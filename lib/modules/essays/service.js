'use strict';

const crypto = require('crypto');
const path = require('path');
const { parseEssays, dumpEssays } = require('./codec');
const { contentRevision, requireRevision } = require('../../shared/revision');
const { notFound } = require('../../server/errors');

function generatedId() {
  return crypto.randomBytes(16).toString('hex');
}

function itemId(item, index) {
  if (item && typeof item.id === 'string' && item.id) return item.id;
  return crypto.createHash('sha256').update(JSON.stringify([index, item && item.date, item && item.content])).digest('hex').slice(0, 32);
}

function normalizeDate(value) {
  return String(value || '').trim().replace('T', ' ').replace(/Z$/, '').slice(0, 19);
}

function createEssayService(context) {
  const files = context.repositories.files;
  const dataFile = context.paths.essays;
  const backupsDir = path.join(context.hexo.base_dir, '.hexo-admin', 'backups', 'essays');
  files.mkdir(path.dirname(dataFile));
  files.mkdir(backupsDir);

  function raw() { return files.exists(dataFile) ? files.readText(dataFile) : ''; }
  function snapshot(currentRaw) {
    if (!files.exists(dataFile)) return null;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const id = 'essays-' + stamp + '-' + crypto.randomBytes(3).toString('hex') + '.yml';
    files.writeText(path.join(backupsDir, id), currentRaw);
    const names = files.list(backupsDir).filter(name => /^essays-.*\.yml$/.test(name)).sort().reverse();
    names.slice(20).forEach(name => files.remove(path.join(backupsDir, name)));
    return id;
  }
  function load() {
    const currentRaw = raw();
    return { currentRaw, items: parseEssays(currentRaw) };
  }
  function assertRevision(revision, currentRaw) {
    return requireRevision(revision, currentRaw, {
      requiredMessage: '缺少说说数据版本，请刷新后重试',
      conflictMessage: '说说数据已被其他窗口或程序修改，请刷新后重新编辑',
      conflictCode: 'ESSAYS_REVISION_CONFLICT'
    });
  }
  function save(items, currentRaw) {
    const backupId = snapshot(currentRaw);
    const nextRaw = dumpEssays(items);
    files.writeText(dataFile, nextRaw);
    return { revision: contentRevision(nextRaw), backupId };
  }
  function locate(items, id) {
    const index = items.findIndex((item, itemIndex) => itemId(item, itemIndex) === id);
    if (index < 0) throw notFound('说说不存在', 'ESSAY_NOT_FOUND');
    return index;
  }
  function ensureIds(items) {
    items.forEach(item => { if (!item.id) item.id = generatedId(); });
  }
  function present(item, index) {
    return { id: itemId(item, index), content: String(item.content || ''), date: normalizeDate(item.date) };
  }

  return {
    list() {
      const { currentRaw, items } = load();
      const presented = items.map(present).sort((a, b) => String(b.date).localeCompare(String(a.date)));
      return { items: presented, total: presented.length, revision: contentRevision(currentRaw), path: path.relative(context.hexo.base_dir, dataFile) };
    },
    create(data) {
      const { currentRaw, items } = load();
      assertRevision(data.revision, currentRaw);
      ensureIds(items);
      const item = { id: generatedId(), content: data.content.trim(), date: normalizeDate(data.date) };
      items.push(item);
      return { item: present(item, items.length - 1), ...save(items, currentRaw) };
    },
    update(id, data) {
      const { currentRaw, items } = load();
      assertRevision(data.revision, currentRaw);
      const index = locate(items, id);
      ensureIds(items);
      const existing = items[index] || {};
      const item = { ...existing, content: data.content.trim(), date: normalizeDate(data.date) };
      items[index] = item;
      return { item: present(item, index), ...save(items, currentRaw) };
    },
    remove(id, revision) {
      const { currentRaw, items } = load();
      assertRevision(revision, currentRaw);
      const index = locate(items, id);
      ensureIds(items);
      const removed = present(items[index], index);
      items.splice(index, 1);
      return { item: removed, ...save(items, currentRaw) };
    }
  };
}

module.exports = { createEssayService, itemId, normalizeDate };
