import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml' };
const handleRequest = async (req,res) => {
  try {
    const url = new URL(req.url, 'http://localhost:3040');
    const file = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'" });
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
};

// Browsers may resolve localhost to either loopback address. Serve both,
// without exposing the user's local tracker on network interfaces.
const servers = [];
let listening = 0;
for (const host of ['127.0.0.1', '::1']) {
  const server = http.createServer(handleRequest);
  servers.push(server);
  server.on('error', error => {
    console.error(`Cannot start Epic Diet Tracker on ${host}:3040: ${error.code}`);
    for (const active of servers) active.close();
    process.exitCode = 1;
  });
  server.listen({ port: 3040, host, ipv6Only: host === '::1' }, () => {
    listening += 1;
    if (listening === 2) console.log('Epic Diet Tracker ready at http://localhost:3040 (IPv4 + IPv6 loopback)');
  });
}
