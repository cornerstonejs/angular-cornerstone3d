/**
 * Creates node_modules/fs and node_modules/path that stub Node built-ins for browser builds.
 * Cornerstone codec packages require('fs') and require('path'); this lets the bundler resolve them.
 * When using file: protocol, codecs come from the monorepo's node_modules, so we stub there too.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const nodeModulesDirs = [
  path.join(root, 'node_modules'),
  path.join(root, '..', '2-cornerstone3D', 'node_modules'),
];

const stubs = {
  fs: {
    'package.json': JSON.stringify({ name: 'fs', version: '0.0.0', main: 'index.js' }, null, 2),
    'index.js': 'module.exports = { readFileSync: () => \'\', existsSync: () => false };',
  },
  path: {
    'package.json': JSON.stringify({ name: 'path', version: '0.0.0', main: 'index.js' }, null, 2),
    'index.js': "function noop() { return ''; }\nmodule.exports = { join: noop, resolve: noop, dirname: noop, basename: noop };",
  },
};

for (const nodeModules of nodeModulesDirs) {
  if (!fs.existsSync(nodeModules)) continue;
  for (const [pkg, files] of Object.entries(stubs)) {
    const dir = path.join(nodeModules, pkg);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    for (const [name, content] of Object.entries(files)) {
      fs.writeFileSync(path.join(dir, name), content);
    }
  }
}
console.log('Node stubs (fs, path) installed for browser build.');
