'use strict';

const fs = require('fs');
const path = require('path');
const { resolveInside } = require('../shared/paths');
const { SECURITY_HEADERS } = require('../server/response');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.map': 'application/json; charset=utf-8'
};

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: http: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join('; ');

function createStaticHandler(options) {
  const directory = options.directory;
  const root = options.root;
  return function staticHandler(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    let requestPath;
    try { requestPath = decodeURIComponent((req.url || '/').split('?')[0]); }
    catch (_) { res.writeHead(400, SECURITY_HEADERS); res.end('Bad request'); return; }
    const relative = requestPath === '/' || !path.extname(requestPath) ? 'index.html' : requestPath.replace(/^\/+/, '');
    let filePath;
    try { filePath = resolveInside(directory, relative); }
    catch (_) { return next(); }
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      if (relative !== 'index.html') return next();
      const message = 'Hexo Admin Panel frontend is not built. Run npm run build in hexo-admin-panel.';
      res.writeHead(503, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' });
      if (req.method === 'HEAD') res.end(); else res.end(message);
      return;
    }
    const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    const headers = {
      ...SECURITY_HEADERS,
      'Content-Security-Policy': CONTENT_SECURITY_POLICY,
      'Content-Type': type,
      'Cache-Control': path.basename(filePath) === 'index.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
    };
    if (path.extname(filePath) === '.html') {
      const html = fs.readFileSync(filePath, 'utf8').replace(/__HEXO_ROOT__/g, root);
      res.writeHead(200, headers);
      if (req.method === 'HEAD') res.end(); else res.end(html);
      return;
    }
    res.writeHead(200, headers);
    if (req.method === 'HEAD') res.end(); else fs.createReadStream(filePath).pipe(res);
  };
}

module.exports = { CONTENT_SECURITY_POLICY, createStaticHandler, MIME_TYPES };
