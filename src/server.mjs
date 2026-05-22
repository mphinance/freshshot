// A tiny static file server, so captures can run against a local folder
// with no separate dev server and no dependency on a live deploy.

import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, resolve, sep } from 'path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

// Serves `dir` on a random free port. Resolves { url, close }.
export function serve(dir) {
  const root = resolve(dir);
  return new Promise((ok) => {
    const server = createServer((req, res) => {
      let path = decodeURIComponent(req.url.split('?')[0]);
      if (path.endsWith('/')) path += 'index.html';
      const file = resolve(join(root, path));
      // Stay inside the served folder. The trailing separator stops a
      // sibling like "site-other" from matching a root of "site".
      if (!file.startsWith(root + sep) || !existsSync(file) || !statSync(file).isFile()) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream'
      });
      res.end(readFileSync(file));
    });
    server.listen(0, () => {
      ok({
        url: `http://localhost:${server.address().port}`,
        close: () => server.close()
      });
    });
  });
}
