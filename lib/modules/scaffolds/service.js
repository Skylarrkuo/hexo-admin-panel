'use strict';

const path = require('path');
const frontMatter = require('hexo-front-matter');
const { safeFilename } = require('../../shared/paths');
const { notFound, badRequest } = require('../../server/errors');
const { contentRevision } = require('../../shared/revision');
const { normalizeNewlines } = require('../../shared/text');

function scaffoldName(value) {
  try {
    const name = safeFilename(String(value || '').replace(/\.md$/i, ''));
    if (name.startsWith('.')) throw new Error('hidden');
    return name;
  } catch (_) { throw badRequest('模板名称无效', 'SCAFFOLD_INVALID'); }
}

function substitute(raw, values) {
  return normalizeNewlines(raw).replace(/{{\s*([\w.-]+)\s*}}/g, (match, key) => (
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key] ?? '') : match
  ));
}

function createScaffoldService(context) {
  const files = context.repositories.files;
  const directory = context.paths.scaffolds;

  function location(name) { return path.join(directory, scaffoldName(name) + '.md'); }

  return {
    list() {
      if (!files.exists(directory)) return { items: [], total: 0 };
      const items = files.list(directory, { withFileTypes: true })
        .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
        .map(entry => {
          const raw = files.readText(path.join(directory, entry.name));
          let parsed = {};
          try { parsed = frontMatter.parse(raw); } catch (_) {}
          return {
            name: entry.name.slice(0, -3),
            title: parsed.title || entry.name.slice(0, -3),
            layout: parsed.layout || entry.name.slice(0, -3),
            excerpt: String(parsed._content || '').trim().slice(0, 160),
            revision: contentRevision(raw)
          };
        }).sort((a, b) => a.name.localeCompare(b.name));
      return { items, total: items.length };
    },
    get(name) {
      const filePath = location(name);
      if (!files.exists(filePath)) throw notFound('Hexo 模板不存在', 'SCAFFOLD_NOT_FOUND');
      const raw = files.readText(filePath);
      return { name: scaffoldName(name), raw, revision: contentRevision(raw) };
    },
    render(name, values) {
      const raw = this.get(name).raw;
      const rendered = substitute(raw, values || {});
      try { return { raw: rendered, parsed: frontMatter.parse(rendered) }; }
      catch (error) { throw badRequest('Hexo 模板 Front Matter 无效：' + error.message, 'SCAFFOLD_INVALID'); }
    }
  };
}

module.exports = { createScaffoldService, scaffoldName, substitute };
