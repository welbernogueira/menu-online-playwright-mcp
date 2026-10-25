const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const appRoot = path.resolve(__dirname, '..', '..', 'app');
const port = Number(process.env.QA_LOCAL_PORT || 8765);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }

  const target = path.resolve(appRoot, `.${pathname}`);
  if (target !== appRoot && !target.startsWith(appRoot + path.sep)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  let filename = target;
  try {
    if (fs.statSync(filename).isDirectory()) filename = path.join(filename, 'index.html');
  } catch {
    response.writeHead(404).end('Not found');
    return;
  }

  const stream = fs.createReadStream(filename);
  stream.on('error', () => response.writeHead(404).end('Not found'));
  stream.once('open', () => {
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': mimeTypes[path.extname(filename).toLowerCase()] || 'application/octet-stream',
      'X-QA-Static-Server': 'menu-online',
    });
    stream.pipe(response);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Static QA server listening at http://127.0.0.1:${port}/; appRoot=${appRoot}`);
});

function shutdown() {
  server.close(() => process.exit(0));
  server.closeAllConnections();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
