/**
 * Points this app at a local Cornerstone3D build so unreleased changes can be
 * tested before they ship to npm.
 *
 * For each package, the installed `dist` directory in node_modules is set aside
 * and replaced with a copy of `<repo>/packages/<dir>/dist`. Everything else
 * (Angular's resolution, the asset globs, scripts/bundle-dicom-worker.js) keeps
 * working unchanged, because only the contents of dist change.
 *
 *   node scripts/link-cs3d.js [--repo <path>] [--packages a,b] [--restore] [--status]
 *
 * Defaults to ../cornerstone3D and the dicom-image-loader package. Build the
 * Cornerstone3D side first (`pnpm build:esm` in the package, or `pnpm build` at
 * the repo root), and re-run this after each rebuild to pick up changes.
 *
 * It copies rather than symlinks on purpose: a symlinked dist makes the bundler
 * resolve the loader's own dependencies (the codec packages, and the Node
 * built-ins their emscripten glue requires) from the Cornerstone3D checkout,
 * where this app's browser stubs do not exist, and the build fails with
 * "Could not resolve fs".
 *
 * `--restore` puts the published dist directories back. A `pnpm install --force`
 * also restores them, since node_modules is regenerated.
 */
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const BACKUP_SUFFIX = '.published-backup';

// npm package name -> directory under <repo>/packages
const PACKAGE_DIRS = {
  '@cornerstonejs/dicom-image-loader': 'dicomImageLoader',
  '@cornerstonejs/core': 'core',
  '@cornerstonejs/metadata': 'metadata',
  '@cornerstonejs/tools': 'tools',
  '@cornerstonejs/utils': 'utils',
};

const DEFAULT_PACKAGES = ['@cornerstonejs/dicom-image-loader'];

function parseArgs(argv) {
  const args = {
    repo: '../cornerstone3D',
    packages: DEFAULT_PACKAGES,
    restore: false,
    status: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--restore' || arg === '--unlink') {
      args.restore = true;
    } else if (arg === '--status') {
      args.status = true;
    } else if (arg === '--repo') {
      args.repo = argv[++i];
    } else if (arg === '--packages') {
      args.packages = argv[++i]
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) =>
          name.startsWith('@cornerstonejs/') ? name : `@cornerstonejs/${name}`
        );
    } else {
      fail(`unknown argument: ${arg}`);
    }
  }

  if (!args.repo) {
    fail('--repo needs a path');
  }

  for (const name of args.packages) {
    if (!PACKAGE_DIRS[name]) {
      fail(
        `unknown package: ${name}\n  known: ${Object.keys(PACKAGE_DIRS).join(', ')}`
      );
    }
  }

  return args;
}

function fail(message) {
  console.error(`link-cs3d: ${message}`);
  process.exit(1);
}

function isLink(target) {
  try {
    return fs.lstatSync(target).isSymbolicLink();
  } catch {
    return false;
  }
}

function restore(packageName) {
  const installed = path.join(root, 'node_modules', packageName, 'dist');
  const backup = `${installed}${BACKUP_SUFFIX}`;

  if (!fs.existsSync(backup)) {
    console.log(`link-cs3d: ${packageName} is not linked`);
    return;
  }

  if (isLink(installed)) {
    fs.unlinkSync(installed);
  } else if (fs.existsSync(installed)) {
    fs.rmSync(installed, { recursive: true, force: true });
  }

  fs.renameSync(backup, installed);
  console.log(`link-cs3d: restored published ${packageName}`);
}

function link(packageName, repo) {
  const packageDir = path.join(root, 'node_modules', packageName);
  if (!fs.existsSync(packageDir)) {
    fail(`${packageName} is not installed - run pnpm install first`);
  }

  const source = path.join(repo, 'packages', PACKAGE_DIRS[packageName], 'dist');
  if (!fs.existsSync(source)) {
    fail(
      `no build at ${source}\n` +
        `  build it first, e.g.: cd ${repo} && pnpm --filter ${packageName} run build:esm`
    );
  }

  const installed = path.join(packageDir, 'dist');
  const backup = `${installed}${BACKUP_SUFFIX}`;

  if (isLink(installed)) {
    // Left over from an older, symlink-based run of this script.
    fs.unlinkSync(installed);
  } else if (fs.existsSync(installed)) {
    if (fs.existsSync(backup)) {
      // Already synced once; the backup holds the published dist, so this copy
      // is a previous sync and can go.
      fs.rmSync(installed, { recursive: true, force: true });
    } else {
      fs.renameSync(installed, backup);
    }
  }

  fs.cpSync(source, installed, { recursive: true });
  console.log(`link-cs3d: ${packageName} <- ${source}`);
}

/**
 * Reports which build each package is using. The synced state is a plain
 * directory, not a symlink - `dir`/`ls` cannot tell them apart, so the presence
 * of the set-aside published dist is what marks a package as synced.
 */
function status(packageName) {
  const installed = path.join(root, 'node_modules', packageName, 'dist');
  const backup = `${installed}${BACKUP_SUFFIX}`;

  if (!fs.existsSync(installed)) {
    console.log(`${packageName}: not installed`);
    return;
  }

  const version = (() => {
    try {
      return require(`${packageName}/package.json`).version;
    } catch {
      return 'unknown';
    }
  })();

  if (fs.existsSync(backup)) {
    console.log(
      `${packageName}: LOCAL build (published ${version} set aside in ${path.basename(backup)})`
    );
  } else {
    console.log(`${packageName}: published ${version}`);
  }
}

const args = parseArgs(process.argv.slice(2));
const repo = path.resolve(root, args.repo);

if (args.status) {
  Object.keys(PACKAGE_DIRS).forEach(status);
  process.exit(0);
}

if (args.restore) {
  args.packages.forEach(restore);
  process.exit(0);
}

if (!fs.existsSync(repo)) {
  fail(`no Cornerstone3D checkout at ${repo} - pass --repo <path>`);
}

args.packages.forEach((name) => link(name, repo));
console.log(
  'link-cs3d: synced. Re-run pnpm link:cs3d after each Cornerstone3D rebuild; ' +
    'pnpm unlink:cs3d restores the published build.'
);
