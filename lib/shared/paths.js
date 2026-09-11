'use strict';

const path = require('path');
const fs = require('fs');

function realPathIncludingMissing(filePath, io = fs) {
  const resolved = path.resolve(filePath);
  try { io.lstatSync(resolved); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const parent = path.dirname(resolved);
    if (parent === resolved) throw error;
    return path.join(realPathIncludingMissing(parent, io), path.basename(resolved));
  }
  // An existing but dangling link is rejected rather than treated as missing.
  return io.realpathSync(resolved);
}

function assertRealPathInside(parent, candidate, io = fs, realRoot) {
  if (!isPathInside(parent, candidate) || !isPathInside(realRoot || realPathIncludingMissing(parent, io), realPathIncludingMissing(candidate, io))) {
    const error = new Error('Path escapes the allowed directory through a link or junction');
    error.code = 'PATH_OUTSIDE_ROOT';
    throw error;
  }
}

function isPathInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}

function resolveInside(parent, child) {
  const candidate = path.resolve(parent, child);
  if (!isPathInside(parent, candidate)) throw new Error('Path escapes the allowed directory');
  assertRealPathInside(parent, candidate);
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

module.exports = { isPathInside, resolveInside, safeFilename, safeRelativePath, realPathIncludingMissing, assertRealPathInside };
