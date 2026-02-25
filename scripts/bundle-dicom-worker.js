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
    // Patch worker: use codecs/ path and real .wasm filenames so Angular assets can copy from node_modules
    let code = fs.readFileSync(outfile, 'utf8');
    code = code.replace(/@cornerstonejs\//g, 'codecs/');
    code = code.replace(/codecs\/codec-charls\/decodewasm/g, 'codecs/codec-charls/charlswasm_decode.wasm');
    code = code.replace(/codecs\/codec-libjpeg-turbo-8bit\/decodewasm/g, 'codecs/codec-libjpeg-turbo-8bit/libjpegturbowasm_decode.wasm');
    code = code.replace(/codecs\/codec-openjpeg\/decodewasm/g, 'codecs/codec-openjpeg/openjpegwasm_decode.wasm');
    code = code.replace(/codecs\/codec-openjph\/wasm/g, 'codecs/codec-openjph/openjphjs.wasm');
    fs.writeFileSync(outfile, code);
    console.log('bundle-dicom-worker: wrote', outfile);
  })
  .catch((err) => {
    console.error('bundle-dicom-worker:', err);
    process.exit(1);
  });
