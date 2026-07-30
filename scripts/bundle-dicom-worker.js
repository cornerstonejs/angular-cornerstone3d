/**
 * Bundles @cornerstonejs/dicom-image-loader's decodeImageFrameWorker and all
 * dependencies (including comlink and ./shared/*) into a single ESM file.
 * That file is served at /cs-dicom-loader/decodeImageFrameWorker.js so the
 * worker loads without bare specifier or relative-import failures in preview.
 *
 * The codec WASM paths are NOT rewritten here. The app passes `wasmBasePath` to
 * the loader's init() instead (see cornerstone-viewport.component.ts), and the
 * decoders resolve their binaries from it at runtime.
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const loaderDist = path.join(
  root,
  'node_modules/@cornerstonejs/dicom-image-loader/dist/esm'
);
const entry = path.join(loaderDist, 'decodeImageFrameWorker.js');
const outDir = path.join(root, 'public', 'cs-dicom-loader');
const outfile = path.join(outDir, 'decodeImageFrameWorker.js');

if (!fs.existsSync(loaderDist)) {
  console.warn('bundle-dicom-worker: dicom-image-loader not found, skipping.');
  process.exit(0);
}

/**
 * wasmBasePath support landed after 5.6.12. Without it the decoders fall back to
 * bare `@cornerstonejs/codec-*` specifiers that no bundler rewrites, and decoding
 * fails with "expected magic word 00 61 73 6d" (the SPA fallback HTML). Warn at
 * build time rather than failing, so `pnpm install` can complete and be followed
 * by `pnpm link:cs3d`.
 */
function checkWasmBasePathSupport() {
  const supportFile = path.join(loaderDist, 'shared', 'wasmBasePath.js');
  if (fs.existsSync(supportFile)) {
    return;
  }

  const version = (() => {
    try {
      return require('@cornerstonejs/dicom-image-loader/package.json').version;
    } catch {
      return 'unknown';
    }
  })();

  console.warn(
    [
      '',
      'bundle-dicom-worker: WARNING - the installed @cornerstonejs/dicom-image-loader',
      `  (${version}) does not support the wasmBasePath option, which this app relies on`,
      '  to locate the codec WASM binaries. Image decoding will fail at runtime.',
      '',
      '  Link a local Cornerstone3D build that has it:',
      '    pnpm link:cs3d',
      '',
      '  or upgrade to a release that includes wasmBasePath and run pnpm unlink:cs3d.',
      '',
    ].join('\n')
  );
}

fs.mkdirSync(outDir, { recursive: true });

esbuild
  .build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    outfile,
    minify: false,
    sourcemap: false,
    logLevel: 'info',
  })
  .then(() => {
    checkWasmBasePathSupport();
    console.log('bundle-dicom-worker: wrote', outfile);
  })
  .catch((err) => {
    console.error('bundle-dicom-worker:', err);
    process.exit(1);
  });
