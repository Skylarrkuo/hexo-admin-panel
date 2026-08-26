'use strict';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w一-鿿-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'untitled';
}

function countWords(text) {
  if (!text) return 0;
  const value = String(text);
  const cjk = (value.match(/[一-鿿㐀-䶿豈-﫿]/g) || []).length;
  const latin = value.replace(/[一-鿿㐀-䶿豈-﫿]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return cjk + latin;
}

function normalizeList(value, fallback) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return fallback || [];
  return [value];
}

function normalizeNewlines(value) {
  return String(value).replace(/\r\n?/g, '\n');
}

module.exports = { slugify, countWords, normalizeList, normalizeNewlines };
