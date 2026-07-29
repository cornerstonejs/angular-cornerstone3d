/**
 * Static preview server that mirrors a real deployment under a base path.
 *
 * Unlike `npx serve -s <dir>`, the SPA fallback stays inside the base path:
 * unknown routes under it return the app's index.html, and anything outside
 * it 404s - the same shape as a reverse proxy that only routes /<base>/ to
 * the app.
 *
 * Usage: node scripts/preview-server.js [--dir <dist dir>] [--base subpath] [--port 4202]
 *
 * --base is normalized to /<base>/, so pass it without slashes: Git Bash and
 * other MSYS shells rewrite a leading-slash argument into a Windows path.
 */
const path = require('path');
const fs = require('fs');
const http = require('http');

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const root = path.resolve(__dirname, '..');
const dir = path.resolve(root, getArg('dir', 'dist/angular-vite-6/browser'));
const port = Number(getArg('port', '4202'));
// Normalize to a leading and trailing slash, e.g. 'subpath' -> '/subpath/'
const base = `/${getArg('base', '/').replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.dcm': 'application/dicom',
};

if (!fs.existsSync(path.join(dir, 'index.html'))) {
  console.error(`preview-server: no index.html in ${dir} - build first`);
  process.exit(1);
}

const sendFile = (res, filePath, status = 200) => {
  const body = fs.readFileSync(filePath);
  res.writeHead(status, {
    'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Content-Length': body.length,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache',
  });
  res.end(body);
};

const send = (res, status, message) => {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(message);
};

const server = http.createServer((req, res) => {
  let pathname;
  try {
    ({ pathname } = new URL(req.url, `http://${req.headers.host || 'localhost'}`));
  } catch {
    send(res, 400, 'Bad request');
    return;
  }
  pathname = decodeURIComponent(pathname);

  // Outside the base path there is no app - just like the real deployment.
  if (base !== '/' && !pathname.startsWith(base)) {
    if (`${pathname}/` === base) {
      res.writeHead(301, { Location: base });
      res.end();
      return;
    }
    send(res, 404, `Not found. The app is served at ${base}`);
    return;
  }

  const relative = pathname.slice(base.length);
  const filePath = path.join(dir, relative);
  // Reject traversal outside the served directory.
  if (relative && !filePath.startsWith(dir + path.sep)) {
    send(res, 403, 'Forbidden');
    return;
  }

  if (relative && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    sendFile(res, filePath);
    return;
  }

  // SPA fallback for client-side routes under the base path.
  sendFile(res, path.join(dir, 'index.html'));
});

server.listen(port, () => {
  console.log(`preview-server: serving ${dir} at http://localhost:${port}${base}`);
});
