const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const reportsRoot = path.join(root, 'qa', 'reports');
const executionId = process.argv[2];
if (!executionId) throw new Error('Uso: node qa/scripts/serve-report.cjs <executionId>');
const reportRoot = path.resolve(reportsRoot, executionId);
if (path.dirname(reportRoot) !== reportsRoot) throw new Error('executionId deve identificar somente uma pasta dentro de qa/reports/.');
const port = Number(process.env.QA_REPORT_PORT || 8766);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }

  const target = path.resolve(reportRoot, `.${pathname}`);
  if (target !== reportRoot && !target.startsWith(reportRoot + path.sep)) {
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
    });
    stream.pipe(response);
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`QA report server listening at http://127.0.0.1:${port}/; executionId=${executionId}`);
});
