'use strict';

const path = require('path');
const crypto = require('crypto');
const { isPathInside, safeFilename } = require('../../shared/paths');
const { notFound, conflict, badRequest } = require('../../server/errors');

function createTrashService(context) {
  const files = context.repositories.files;
  const trashRoot = path.join(context.hexo.base_dir, '.hexo-admin', 'trash');
  const recordsDir = path.join(trashRoot, 'records');
  const filesDir = path.join(trashRoot, 'files');
  files.mkdir(recordsDir);
  files.mkdir(filesDir);

  function recordPath(id) { return path.join(recordsDir, safeFilename(id) + '.json'); }
  function readRecord(id) {
    const location = recordPath(id);
    if (!files.exists(location)) throw notFound('回收项不存在');
    try { return JSON.parse(files.readText(location)); }
    catch (_) { throw badRequest('回收项记录已损坏'); }
  }
  function allowedOriginal(record) {
    if (record.kind === 'post') return isPathInside(context.paths.posts, record.originalPath) || isPathInside(context.paths.drafts, record.originalPath);
    if (record.kind === 'page') {
      return isPathInside(context.paths.source, record.originalPath) &&
        !isPathInside(context.paths.posts, record.originalPath) && !isPathInside(context.paths.drafts, record.originalPath);
    }
    const root = record.kind === 'media' ? context.paths.images : null;
    return root && isPathInside(root, record.originalPath);
  }
  async function refresh() { await context.operations.run(() => context.hexo.source.process()); }

  return {
    async move(kind, sourcePath, metadata, options) {
      if (!['post', 'page', 'media'].includes(kind)) throw badRequest('不支持的回收类型');
      const id = Date.now().toString(36) + '-' + crypto.randomBytes(5).toString('hex');
      const payloadPath = path.join(filesDir, id + path.extname(sourcePath));
      const record = {
        id, kind, name: path.basename(sourcePath), originalPath: path.resolve(sourcePath),
        payloadPath, deletedAt: new Date().toISOString(), metadata: metadata || {}
      };
      if (!allowedOriginal(record)) throw badRequest('文件不在允许的目录中');
      files.move(sourcePath, payloadPath);
      try { files.writeText(recordPath(id), JSON.stringify(record, null, 2)); }
      catch (error) { files.move(payloadPath, sourcePath); throw error; }
      if (!(options && options.skipRefresh)) await refresh();
      return { id, kind, name: record.name, deletedAt: record.deletedAt };
    },
    list(query) {
      const kind = query && query.kind;
      const items = files.list(recordsDir).filter(name => name.endsWith('.json')).map(name => {
        try { return JSON.parse(files.readText(path.join(recordsDir, name))); } catch (_) { return null; }
      }).filter(record => record && (!kind || record.kind === kind)).map(record => ({
        id: record.id, kind: record.kind, name: record.name, deletedAt: record.deletedAt,
        originalPath: path.relative(context.hexo.base_dir, record.originalPath), metadata: record.metadata
      })).sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
      return { items, total: items.length };
    },
    async restore(id) {
      const record = readRecord(id);
      if (!allowedOriginal(record)) throw badRequest('回收项原路径不安全');
      if (!files.exists(record.payloadPath)) throw notFound('回收文件不存在');
      if (files.exists(record.originalPath)) throw conflict('原位置已有同名文件，无法恢复');
      files.mkdir(path.dirname(record.originalPath));
      files.move(record.payloadPath, record.originalPath);
      files.remove(recordPath(id));
      await refresh();
      return { id, restored: true, path: path.relative(context.hexo.base_dir, record.originalPath) };
    },
    remove(id) {
      const record = readRecord(id);
      if (files.exists(record.payloadPath)) files.remove(record.payloadPath);
      files.remove(recordPath(id));
    }
  };
}

module.exports = { createTrashService };
