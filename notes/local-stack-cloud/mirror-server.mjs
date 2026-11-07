// Serves a mirror of the hosted pilet feed (api/v1/pilets + pilets/**) on the compose network only.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize } from 'node:path';
const ROOT = '/mirror';
const types = { js: 'application/javascript', css: 'text/css', json: 'application/json', map: 'application/json', svg: 'image/svg+xml', png: 'image/png', woff2: 'font/woff2', woff: 'font/woff' };
createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^\/+/, '');
  if (path.startsWith('..')) { res.writeHead(400).end(); return; }
  try {
    const body = await readFile(join(ROOT, path));
    const ext = path === 'api/v1/pilets' ? 'json' : path.split('.').pop();
    res.writeHead(200, { 'content-type': types[ext] || 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
}).listen(8000, () => console.log('pilet mirror on :8000'));
