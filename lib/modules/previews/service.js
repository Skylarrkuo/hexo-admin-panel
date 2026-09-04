'use strict';

const path = require('path');
const crypto = require('crypto');
const { safeRelativePath, resolveInside } = require('../../shared/paths');
const { badRequest, notFound } = require('../../server/errors');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.map': 'application/json'
};

function normalizeOutputPath(value) {
  let result = String(value || '').trim();
  try { if (/^https?:\/\//i.test(result)) result = new URL(result).pathname; } catch (_) {}
  result = result.replace(/^\/+/, '');
  if (!result) return 'index.html';
  if (result.endsWith('/')) result += 'index.html';
  else if (!path.posix.extname(result)) result += '/index.html';
  return safeRelativePath(result);
}

function createPreviewService(context) {
  const files = context.repositories.files;
  const root = path.join(context.hexo.base_dir, '.hexo-admin', 'previews');
  const entries = new Map();
  if (files.exists(root)) files.removeTree(root);
  files.mkdir(root);

  function cleanExpired() {
    const now = Date.now();
    for (const [token, entry] of entries) {
      if (entry.expiresAt > now) continue;
      entries.delete(token);
      if (files.exists(entry.directory)) files.removeTree(entry.directory);
    }
  }

  function previewUrl(token, relative) {
    const rootPath = String(context.hexo.config.root || '/').replace(/\/?$/, '/');
    return rootPath + 'admin/api/previews/' + token + '/' + relative.split('/').map(encodeURIComponent).join('/');
  }

  function locateGeneratedPage(siteDir, title) {
    const matches = [];
    function visit(directory) {
      files.list(directory, { withFileTypes: true }).forEach(entry => {
        const location = path.join(directory, entry.name);
        if (entry.isDirectory()) visit(location);
        else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
          const html = files.readText(location);
          if (!title || html.includes(String(title))) matches.push(location);
        }
      });
    }
    visit(siteDir);
    const preferred = matches.find(file => !/[\\/](?:index|archives|categories|tags)[\\/]?index\.html$/i.test(file)) || matches[0];
    return preferred ? path.relative(siteDir, preferred).replace(/\\/g, '/') : null;
  }

  function start(kind, id, revision) {
    cleanExpired();
    if (!['post', 'page'].includes(kind)) throw badRequest('预览内容类型无效', 'PREVIEW_KIND_INVALID');
    const info = kind === 'post' ? context.services.posts.previewInfo(id, revision) : context.services.pages.previewInfo(id, revision);
    const token = crypto.randomBytes(24).toString('hex');
    const directory = path.join(root, token);
    const siteDir = path.join(directory, 'site');
    const relative = normalizeOutputPath(info.path);
    const entry = { token, directory, siteDir, relative, expiresAt: Date.now() + 30 * 60000, jobId: null };
    entries.set(token, entry);
    files.mkdir(siteDir);
    const job = context.services.commands.start('preview-' + kind, async control => {
      const previousPublicDir = context.hexo.public_dir;
      const previousRenderDrafts = context.hexo.config.render_drafts;
      control.progress(8, '正在加载 Hexo 主题与插件');
      try {
        context.hexo.public_dir = siteDir + path.sep;
        context.hexo.config.render_drafts = true;
        await context.hexo.source.process();
        control.throwIfCancelled();
        control.progress(28, '正在构建临时站点');
        await context.hexo.call('generate', { force: true, draft: true });
        control.throwIfCancelled();
        control.progress(92, '正在定位真实 permalink');
        let output = relative;
        let target = resolveInside(siteDir, output);
        if (!files.exists(target)) {
          output = locateGeneratedPage(siteDir, info.title);
          if (!output) throw notFound('Hexo 已完成构建，但没有找到预览页面：' + relative, 'PREVIEW_OUTPUT_NOT_FOUND');
          target = resolveInside(siteDir, output);
        }
        entry.relative = output;
        return { previewUrl: previewUrl(token, output), permalink: '/' + output.replace(/index\.html$/, ''), expiresAt: new Date(entry.expiresAt).toISOString() };
      } finally {
        context.hexo.public_dir = previousPublicDir;
        context.hexo.config.render_drafts = previousRenderDrafts;
      }
    });
    entry.jobId = job.id;
    return { token, job, expiresAt: new Date(entry.expiresAt).toISOString() };
  }

  function get(token, requestedPath) {
    cleanExpired();
    const entry = entries.get(token);
    if (!entry) throw notFound('主题预览不存在或已经过期', 'PREVIEW_NOT_FOUND');
    let relative = String(requestedPath || 'index.html').replace(/^\/+/, '');
    if (!relative || relative.endsWith('/')) relative += 'index.html';
    try { relative = safeRelativePath(relative); }
    catch (_) { throw badRequest('预览资源路径无效', 'PREVIEW_PATH_INVALID'); }
    const filePath = resolveInside(entry.siteDir, relative);
    if (!files.exists(filePath) || !files.stat(filePath).isFile()) throw notFound('预览资源不存在', 'PREVIEW_ASSET_NOT_FOUND');
    const extension = path.extname(filePath).toLowerCase();
    let body = files.readBuffer(filePath);
    const base = previewUrl(token, '');
    if (extension === '.html') {
      let html = body.toString('utf8');
      html = html.replace(/(href|src|action|poster)=(['"])\/(?!\/)/gi, '$1=$2' + base);
      html = html.replace(/<head([^>]*)>/i, '<head$1><base href="' + base + '">');
      body = Buffer.from(html);
    } else if (extension === '.css') {
      body = Buffer.from(body.toString('utf8').replace(/url\((['"]?)\/(?!\/)/gi, 'url($1' + base));
    }
    return { body, contentType: CONTENT_TYPES[extension] || 'application/octet-stream' };
  }

  function remove(token) {
    const entry = entries.get(token);
    if (!entry) throw notFound('主题预览不存在或已经过期', 'PREVIEW_NOT_FOUND');
    entries.delete(token);
    if (files.exists(entry.directory)) files.removeTree(entry.directory);
    return { removed: true };
  }

  return { start, get, remove };
}

module.exports = { CONTENT_TYPES, createPreviewService, normalizeOutputPath };
