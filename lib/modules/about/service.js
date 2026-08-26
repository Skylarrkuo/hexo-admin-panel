'use strict';

const path = require('path');
const frontMatter = require('hexo-front-matter');
const { normalizeNewlines } = require('../../shared/text');
const { contentRevision, requireRevision } = require('../../shared/revision');
const { badRequest, notFound } = require('../../server/errors');

const CONTROLLED_FIELDS = new Set(['title', 'date', 'template', '_content']);

function parseAboutSource(raw) {
  if (typeof raw !== 'string') throw badRequest('About source must be a string');
  const parsed = frontMatter.parse(normalizeNewlines(raw));
  const extra = {};
  Object.entries(parsed).forEach(([key, value]) => {
    if (!CONTROLLED_FIELDS.has(key)) extra[key] = value;
  });
  return {
    title: parsed.title || 'About',
    date: parsed.date || '',
    template: parsed.template || 'about',
    content: parsed._content || '',
    frontMatter: extra
  };
}

function buildAboutSource(data) {
  const fields = data.frontMatter && typeof data.frontMatter === 'object' ? { ...data.frontMatter } : {};
  fields.title = data.title || 'About';
  if (data.date) fields.date = data.date;
  fields.template = data.template || 'about';
  return frontMatter.stringify({ ...fields, _content: data.content || '' }, { prefixSeparator: true });
}

function createAboutService(context) {
  const filePath = context.paths.about;
  const files = context.repositories.files;
  async function refresh() { await context.operations.run(() => context.hexo.source.process()); }
  function currentRaw() {
    if (!files.exists(filePath)) throw notFound('About 页面不存在，请先在 source/about/index.md 创建页面', 'ABOUT_NOT_FOUND');
    return files.readText(filePath);
  }
  return {
    get() {
      const raw = currentRaw();
      return { ...parseAboutSource(raw), raw, path: path.relative(context.paths.source, filePath).replace(/\\/g, '/'), revision: contentRevision(raw) };
    },
    parse(raw) { return parseAboutSource(raw); },
    build(data) { return buildAboutSource(data || {}); },
    async update(data) {
      const raw = currentRaw();
      requireRevision(data.revision, raw, {
        requiredMessage: '缺少 About 页面版本信息，请刷新后重试',
        conflictMessage: 'About 页面已被其他窗口或程序修改，请刷新后重新编辑',
        conflictCode: 'ABOUT_REVISION_CONFLICT'
      });
      let next;
      if (Object.prototype.hasOwnProperty.call(data, 'raw')) {
        parseAboutSource(data.raw);
        next = normalizeNewlines(data.raw);
      } else next = buildAboutSource(data);
      files.mkdir(path.dirname(filePath));
      files.writeText(filePath, next);
      await refresh();
      return { path: 'about/index.md', revision: contentRevision(files.readBuffer(filePath)) };
    }
  };
}

module.exports = { createAboutService, parseAboutSource, buildAboutSource };
