'use strict';

const path = require('path');

function isPathInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}

function resolveInside(parent, child) {
  const candidate = path.resolve(parent, child);
  if (!isPathInside(parent, candidate)) throw new Error('Path escapes the allowed directory');
  return candidate;
}

function safeFilename(value) {
  const name = String(value || '');
  if (!name || name === '.' || name === '..' || name.includes('/') || name.includes('\\')) {
    throw new Error('Invalid filename');
  }
  return name;
}

function safeRelativePath(value) {
  const normalized = String(value || '').replace(/\\/g, '/');
  if (!normalized || normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized) || normalized.includes('\0')) {
    throw new Error('Invalid relative path');
  }
  const segments = normalized.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) throw new Error('Invalid relative path');
  segments.forEach(safeFilename);
  return segments.join('/');
}

module.exports = { isPathInside, resolveInside, safeFilename, safeRelativePath };
