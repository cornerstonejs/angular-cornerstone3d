/**
 * Copies the codec .wasm files into public/cs-dicom-loader/codecs/.
 *
 * They go in one flat directory because that is what the loader's
 * `wasmBasePath` option expects: a single root holding every binary under its
 * published file name. The path avoids '@' so static servers (e.g. serve)
 * return the file instead of HTML.
 */
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const nodeModules = path.join(root, 'node_modules');
const codecsDir = path.join(root, 'public', 'cs-dicom-loader', 'codecs');

const codecs = [
  { shortName: 'codec-libjpeg-turbo-8bit', file: 'dist/libjpegturbowasm_decode.wasm' },
  { shortName: 'codec-openjpeg', file: 'dist/openjpegwasm_decode.wasm' },
  { shortName: 'codec-openjph', file: 'dist/openjphjs.wasm' },
  { shortName: 'codec-charls', file: 'dist/charlswasm_decode.wasm' },
];

for (const { shortName, file } of codecs) {
  const src = path.join(nodeModules, '@cornerstonejs', shortName, file);
  const outFile = path.join(codecsDir, path.basename(file));
  if (!fs.existsSync(src)) {
    console.warn('copy-codec-wasm: missing', src);
    continue;
  }
  fs.mkdirSync(codecsDir, { recursive: true });
  fs.copyFileSync(src, outFile);
  console.log('copy-codec-wasm:', shortName, '->', outFile);
}
