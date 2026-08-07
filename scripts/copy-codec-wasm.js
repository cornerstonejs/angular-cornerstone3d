/**
 * Copies codec .wasm files to public/cs-dicom-loader/codecs/<pkg-name>/...
 * Paths avoid '@' so static servers (e.g. serve) return the file instead of HTML.
 * The worker bundle is patched to request 'codecs/...' instead of '@cornerstonejs/...'.
 */
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const nodeModules = path.join(root, 'node_modules');
const monorepoNodeModules = path.join(root, '..', '2-cornerstone3D', 'node_modules');
const codecsDir = path.join(root, 'public', 'cs-dicom-loader', 'codecs');

const codecs = [
  { shortName: 'codec-libjpeg-turbo-8bit', file: 'dist/libjpegturbowasm_decode.wasm' },
  { shortName: 'codec-openjpeg', file: 'dist/openjpegwasm_decode.wasm' },
  { shortName: 'codec-openjph', file: 'dist/openjphjs.wasm' },
  { shortName: 'codec-charls', file: 'dist/charlswasm_decode.wasm' },
];

for (const { shortName, file } of codecs) {
  let src = path.join(nodeModules, '@cornerstonejs', shortName, file);
  if (!fs.existsSync(src)) {
    src = path.join(monorepoNodeModules, '@cornerstonejs', shortName, file);
  }
  const outFile = path.join(codecsDir, shortName, path.basename(file));
  if (!fs.existsSync(src)) {
    console.warn('copy-codec-wasm: missing', src);
    continue;
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.copyFileSync(src, outFile);
  console.log('copy-codec-wasm:', shortName, '->', outFile);
}
