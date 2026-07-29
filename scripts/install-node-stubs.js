/**
 * Creates node_modules/<name> packages that stub Node built-ins for browser builds,
 * so the bundler can resolve the bare requires that reach the browser bundle:
 *  - fs, path: the Cornerstone codec packages' emscripten glue
 *  - url: @kitware/vtk.js 36 -> xmlbuilder2@4 -> @oozcitak/url
 * Cornerstone3D's own example builds do the same thing through webpack's
 * resolve.fallback (fs: false, path: path-browserify, url: false).
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const nodeModules = path.join(root, 'node_modules');

const stubs = {
  fs: {
    'package.json': JSON.stringify({ name: 'fs', version: '0.0.0', main: 'index.js' }, null, 2),
    'index.js': 'module.exports = { readFileSync: () => \'\', existsSync: () => false };',
  },
  path: {
    'package.json': JSON.stringify({ name: 'path', version: '0.0.0', main: 'index.js' }, null, 2),
    'index.js': "function noop() { return ''; }\nmodule.exports = { join: noop, resolve: noop, dirname: noop, basename: noop };",
  },
  // Only domainToASCII/domainToUnicode are reached (URL host parsing); pass the
  // domain through rather than throwing, which is what an empty stub would do.
  url: {
    'package.json': JSON.stringify({ name: 'url', version: '0.0.0', main: 'index.js' }, null, 2),
    'index.js':
      'function identity(domain) { return domain; }\n' +
      'module.exports = { domainToASCII: identity, domainToUnicode: identity };',
  },
};

for (const [pkg, files] of Object.entries(stubs)) {
  const dir = path.join(nodeModules, pkg);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content);
  }
}
console.log('Node stubs (fs, path) installed for browser build.');
