/**
 * Bundles @cornerstonejs/dicom-image-loader's decodeImageFrameWorker and all
 * dependencies (including comlink and ./shared/*) into a single ESM file.
 * That file is served at /cs-dicom-loader/decodeImageFrameWorker.js so the
 * worker loads without bare specifier or relative-import failures in preview.
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const entryCandidates = [
  // Prefer built dist (works with file: protocol and published packages)
  path.join(
    root,
    'node_modules/@cornerstonejs/dicom-image-loader/dist/esm/decodeImageFrameWorker.js'
  ),
  // Fallback to source when only src exists (e.g. dev symlink)
  path.join(
    root,
    'node_modules/@cornerstonejs/dicom-image-loader/src/decodeImageFrameWorker.ts'
  ),
];
const entry = entryCandidates.find((p) => fs.existsSync(p));
const outDir = path.join(root, 'public', 'cs-dicom-loader');
const outfile = path.join(outDir, 'decodeImageFrameWorker.js');

if (!entry) {
  console.warn('bundle-dicom-worker: dicom-image-loader not found, skipping.');
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });

esbuild
  .build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    absWorkingDir: root,
    preserveSymlinks: false,
    outfile,
    minify: false,
    sourcemap: false,
    logLevel: 'info',
    plugins: [
      {
        name: 'node-builtins-stub',
        setup(build) {
          build.onResolve({ filter: /^(fs|path)$/ }, (args) => ({
            path: args.path,
            namespace: 'node-builtin-stub',
          }));
          build.onLoad({ filter: /.*/, namespace: 'node-builtin-stub' }, () => ({
            contents: 'export default {};',
            loader: 'js',
          }));
        },
      },
    ],
  })
  .then(() => {
    // WASM paths are passed via decodeConfig.peerImportPaths/peerImportBasePath from the main thread (dicomImageLoaderInit).
    console.log('bundle-dicom-worker: wrote', outfile);
  })
  .catch((err) => {
    console.error('bundle-dicom-worker:', err);
    process.exit(1);
  });
