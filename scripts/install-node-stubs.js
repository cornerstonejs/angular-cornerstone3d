/**
 * Creates node_modules/<name> packages that stub Node built-ins for browser builds.
 *
 * Cornerstone codec packages require('fs') and require('path'), and
 * @oozcitak/url (vtk.js -> xmlbuilder2) requires('url'); this lets the bundler
 * resolve them instead of failing on a built-in it cannot bundle.
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
  // Only domainToASCII/domainToUnicode are used, to punycode-encode host names.
  // The browser does that itself, and the XML tooling that reaches this code
  // never handles international domains, so identity is enough.
  url: {
    'package.json': JSON.stringify({ name: 'url', version: '0.0.0', main: 'index.js' }, null, 2),
    'index.js': "function identity(domain) { return domain; }\nmodule.exports = { domainToASCII: identity, domainToUnicode: identity };",
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
console.log(
  `Node stubs (${Object.keys(stubs).join(', ')}) installed for browser build.`
);
