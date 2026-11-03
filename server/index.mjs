import http from 'node:http';
import { loadEnvFile } from 'node:process';
import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiHandler } from './api.mjs';

try { loadEnvFile('.env'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const host = process.env.HOST || '127.0.0.1';
if (!['127.0.0.1', 'localhost', '::1'].includes(host) && (!process.env.APP_ORIGIN || (process.env.APP_ACCESS_TOKEN || '').length < 24)) {
  throw new Error('Network hosting requires APP_ORIGIN and an APP_ACCESS_TOKEN of at least 24 characters.');
}
const root = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
if (!existsSync(path.join(root, 'index.html'))) throw new Error('Run npm run build before npm start.');
const api = createApiHandler();
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  if (await api(req, res)) return;
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.split('/').some(segment => segment.startsWith('.')) || pathname.includes('\\')) { res.writeHead(404); res.end(); return; }
    let filename = path.resolve(root, `.${pathname}`);
    if (filename !== root && !filename.startsWith(root + path.sep)) { res.writeHead(404); res.end(); return; }
    const info = await stat(filename).catch(() => null);
    if (!info?.isFile()) {
      if (path.extname(pathname)) { res.writeHead(404); res.end(); return; }
      filename = path.join(root, 'index.html');
    }
    res.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream',
      'Cache-Control': filename.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache' });
    if (req.method === 'HEAD') res.end(); else createReadStream(filename).on('error', () => res.destroy()).pipe(res);
  } catch { res.writeHead(404); res.end(); }
});
server.requestTimeout = 130_000;
server.listen(Number(process.env.PORT || 3000), host, () => console.log(`Verlyn HQ ready at http://${host}:${process.env.PORT || 3000}`));
