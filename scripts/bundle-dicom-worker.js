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
const entry = path.join(
  root,
  'node_modules/@cornerstonejs/dicom-image-loader/dist/esm/decodeImageFrameWorker.js'
);
const outDir = path.join(root, 'public', 'cs-dicom-loader');
const outfile = path.join(outDir, 'decodeImageFrameWorker.js');

// Bare specifier used by each decoder -> path served by copy-codec-wasm.js.
// Keep the right-hand side in sync with scripts/copy-codec-wasm.js and the
// codec asset globs in angular.json.
const wasmSpecifiers = {
  '@cornerstonejs/codec-charls/decodewasm':
    'codecs/codec-charls/charlswasm_decode.wasm',
  '@cornerstonejs/codec-libjpeg-turbo-8bit/decodewasm':
    'codecs/codec-libjpeg-turbo-8bit/libjpegturbowasm_decode.wasm',
  '@cornerstonejs/codec-openjpeg/decodewasm':
    'codecs/codec-openjpeg/openjpegwasm_decode.wasm',
  '@cornerstonejs/codec-openjph/wasm': 'codecs/codec-openjph/openjphjs.wasm',
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

if (!fs.existsSync(path.dirname(entry))) {
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
    outfile,
    minify: false,
    sourcemap: false,
    logLevel: 'info',
  })
  .then(() => {
    // The decoders resolve their wasm with `new URL('@cornerstonejs/codec-*/...',
    // import.meta.url)`. esbuild leaves that bare specifier alone, so rewrite each
    // one to the served codec path that copy-codec-wasm.js populates.
    let code = fs.readFileSync(outfile, 'utf8');
    const missing = [];

    for (const [specifier, servedPath] of Object.entries(wasmSpecifiers)) {
      const pattern = new RegExp(`(new URL\\(\\s*["'])${escapeRegExp(specifier)}(["'])`, 'g');
      const patched = code.replace(pattern, `$1${servedPath}$2`);
      if (patched === code) {
        missing.push(specifier);
      }
      code = patched;
    }

    if (missing.length) {
      throw new Error(
        'expected wasm URL specifiers not found in the bundle - the dicom-image-loader ' +
          `decoders likely changed:\n  ${missing.join('\n  ')}`
      );
    }

    // Nothing else may reach for a bare @cornerstonejs specifier at runtime.
    const leftover = code.match(/(?:new URL|import)\(\s*["']@cornerstonejs\/[^"']+["']/g);
    if (leftover) {
      throw new Error(
        `unhandled runtime reference to a bare specifier:\n  ${[...new Set(leftover)].join('\n  ')}`
      );
    }

    fs.writeFileSync(outfile, code);
    console.log('bundle-dicom-worker: wrote', outfile);
  })
  .catch((err) => {
    console.error('bundle-dicom-worker:', err);
    process.exit(1);
  });
