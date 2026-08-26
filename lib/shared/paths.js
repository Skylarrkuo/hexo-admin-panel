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

module.exports = { isPathInside, resolveInside, safeFilename };
