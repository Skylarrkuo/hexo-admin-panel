'use strict';

const frontMatter = require('hexo-front-matter');
const { normalizeList, normalizeNewlines } = require('../../shared/text');

const CONTROLLED_FIELDS = new Set(['title', 'date', 'categories', 'tags', 'workflow_status', '_content']);

function parsePostSource(raw) {
  const parsed = frontMatter.parse(normalizeNewlines(raw));
  return { data: parsed, content: parsed._content || '' };
}

function editablePost(raw, fallback) {
  const parsed = parsePostSource(raw).data;
  const extra = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (!CONTROLLED_FIELDS.has(key)) extra[key] = value;
  }
  fallback = fallback || {};
  return {
    title: parsed.title || fallback.title || '',
    date: parsed.date || fallback.date || '',
    categories: normalizeList(parsed.categories, fallback.categories || []),
    tags: normalizeList(parsed.tags, fallback.tags || []),
    workflowStatus: parsed.workflow_status || fallback.workflowStatus || '',
    content: parsed._content || '',
    frontMatter: extra
  };
}

function buildPostSource(data) {
  const fields = data.frontMatter && typeof data.frontMatter === 'object'
    ? { ...data.frontMatter }
    : {};
  if (data.title) fields.title = data.title;
  if (data.date) fields.date = data.date;
  if (data.categories && data.categories.length) fields.categories = data.categories;
  if (data.tags && data.tags.length) fields.tags = data.tags;
  if (data.workflowStatus && data.workflowStatus !== 'published') fields.workflow_status = data.workflowStatus;
  else delete fields.workflow_status;
  if (data.published === false) fields.published = false;
  if (data.layout) fields.layout = data.layout;
  return frontMatter.stringify({ ...fields, _content: data.content || '' }, { prefixSeparator: true });
}

function setPublished(raw, published) {
  const parsed = parsePostSource(raw);
  parsed.data.published = published;
  if (published) delete parsed.data.workflow_status;
  else parsed.data.workflow_status = 'draft';
  return frontMatter.stringify({ ...parsed.data, _content: parsed.content }, { prefixSeparator: true });
}

module.exports = { editablePost, buildPostSource, setPublished };
