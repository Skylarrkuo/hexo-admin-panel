'use strict';

const path = require('path');
const crypto = require('crypto');
const frontMatter = require('hexo-front-matter');
const { badRequest, notFound, conflict } = require('../../server/errors');

const TYPES = new Set(['categories', 'tags']);

function taxonomyType(value) {
  if (!TYPES.has(value)) throw badRequest('分类标签类型无效', 'TAXONOMY_TYPE_INVALID');
  return value;
}

function valuesOf(value) {
  if (Array.isArray(value)) return value.flat(Infinity).map(item => String(item).trim()).filter(Boolean);
  if (value === undefined || value === null || value === '') return [];
  return [String(value).trim()].filter(Boolean);
}

function createTaxonomyService(context) {
  const files = context.repositories.files;
  const roots = [context.paths.posts, context.paths.drafts];
  const backupsRoot = path.join(context.hexo.base_dir, '.hexo-admin', 'backups', 'taxonomies');
  files.mkdir(backupsRoot);

  function markdownFiles() {
    const result = [];
    function visit(directory) {
      if (!files.exists(directory)) return;
      files.list(directory, { withFileTypes: true }).forEach(entry => {
        const location = path.join(directory, entry.name);
        if (entry.isDirectory()) visit(location);
        else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) result.push(location);
      });
    }
    roots.forEach(visit);
    return result;
  }

  function records() {
    return markdownFiles().map(filePath => {
      const raw = files.readText(filePath);
      const data = frontMatter.parse(raw);
      return { filePath, raw, data, draft: filePath.startsWith(context.paths.drafts) };
    });
  }

  function statistics() {
    const result = { categories: new Map(), tags: new Map() };
    records().forEach(record => {
      for (const type of TYPES) {
        for (const name of new Set(valuesOf(record.data[type]))) {
          const item = result[type].get(name) || { name, count: 0, published: 0, drafts: 0 };
          item.count += 1;
          item[record.draft ? 'drafts' : 'published'] += 1;
          result[type].set(name, item);
        }
      }
    });
    return {
      categories: [...result.categories.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      tags: [...result.tags.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    };
  }

  async function transform(type, sourceNames, targetName, action) {
    taxonomyType(type);
    const sources = [...new Set(sourceNames.map(value => String(value).trim()).filter(Boolean))];
    if (!sources.length) throw badRequest('请选择要处理的分类或标签', 'TAXONOMY_INVALID');
    if (action === 'merge' && sources.length < 2) throw badRequest('合并至少需要两个来源', 'TAXONOMY_INVALID');
    const target = targetName === undefined ? '' : String(targetName).trim();
    if (action !== 'delete' && !target) throw badRequest('目标名称不能为空', 'TAXONOMY_INVALID');
    if (action === 'rename' && sources.length !== 1) throw badRequest('重命名只能选择一个来源', 'TAXONOMY_INVALID');
    if (action !== 'delete' && sources.includes(target) && sources.length === 1) throw conflict('新旧名称相同', 'TAXONOMY_UNCHANGED');

    const candidates = records().filter(record => valuesOf(record.data[type]).some(value => sources.includes(value)));
    if (!candidates.length) throw notFound('没有文章使用这些分类或标签', 'TAXONOMY_NOT_FOUND');
    const backupId = new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomBytes(4).toString('hex');
    const backupDir = path.join(backupsRoot, backupId);
    files.mkdir(backupDir);

    return context.operations.run(async () => {
      const changed = [];
      try {
        for (const record of candidates) {
          const current = valuesOf(record.data[type]);
          const next = [];
          current.forEach(value => {
            const replacement = sources.includes(value) ? (action === 'delete' ? '' : target) : value;
            if (replacement && !next.includes(replacement)) next.push(replacement);
          });
          const relative = path.relative(context.paths.source, record.filePath);
          const backupPath = path.join(backupDir, relative);
          files.mkdir(path.dirname(backupPath));
          files.writeText(backupPath, record.raw);
          const data = { ...record.data, [type]: next, _content: record.data._content || '' };
          if (!next.length) delete data[type];
          const raw = frontMatter.stringify(data, { prefixSeparator: true });
          files.writeText(record.filePath, raw);
          changed.push(record);
        }
        await context.hexo.source.process();
        files.list(backupsRoot, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort().reverse().slice(20)
          .forEach(name => files.removeTree(path.join(backupsRoot, name)));
      } catch (error) {
        changed.forEach(record => { try { files.writeText(record.filePath, record.raw); } catch (_) {} });
        throw error;
      }
      return { type, action, sources, target: target || null, affectedPosts: changed.length, backupId };
    });
  }

  return {
    list() { const data=statistics();return { ...data, totals: { categories: data.categories.length, tags: data.tags.length } }; },
    rename(type, name, target) { return transform(type, [name], target, 'rename'); },
    remove(type, name) { return transform(type, [name], '', 'delete'); },
    merge(type, sources, target) { return transform(type, sources, target, 'merge'); }
  };
}

module.exports = { createTaxonomyService, taxonomyType, valuesOf };
