/**
 * Copies the codec .wasm files into one flat directory,
 * public/cs-dicom-loader/wasm/, which is what the app passes to the DICOM image
 * loader as `wasmBasePath`. The loader expects a single root holding every
 * binary under its published file name - there is no per-codec path.
 *
 * Keep this directory in sync with the codec asset globs in angular.json and
 * with the wasmBasePath passed in cornerstone-viewport.component.ts.
 */
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const nodeModules = path.join(root, 'node_modules');
const wasmDir = path.join(root, 'public', 'cs-dicom-loader', 'wasm');

const codecs = [
  { shortName: 'codec-libjpeg-turbo-8bit', file: 'dist/libjpegturbowasm_decode.wasm' },
  { shortName: 'codec-openjpeg', file: 'dist/openjpegwasm_decode.wasm' },
  { shortName: 'codec-openjph', file: 'dist/openjphjs.wasm' },
  { shortName: 'codec-charls', file: 'dist/charlswasm_decode.wasm' },
];

fs.mkdirSync(wasmDir, { recursive: true });

for (const { shortName, file } of codecs) {
  const src = path.join(nodeModules, '@cornerstonejs', shortName, file);
  const outFile = path.join(wasmDir, path.basename(file));
  if (!fs.existsSync(src)) {
    console.warn('copy-codec-wasm: missing', src);
    continue;
  }
  fs.copyFileSync(src, outFile);
  console.log('copy-codec-wasm:', shortName, '->', outFile);
}
