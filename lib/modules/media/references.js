'use strict';

const path = require('path');
const { isPathInside } = require('../../shared/paths');

const CONTENT_EXTENSIONS = new Set(['.md', '.markdown', '.yml', '.yaml', '.json', '.html', '.css']);

function contentFiles(files, root, excluded) {
  const result = [];
  if (!files.exists(root)) return result;
  function visit(directory) {
    files.list(directory, { withFileTypes: true }).forEach(entry => {
      const location = path.join(directory, entry.name);
      if (excluded.some(item => isPathInside(item, location))) return;
      if (entry.isDirectory()) visit(location);
      else if (entry.isFile() && CONTENT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) result.push(location);
    });
  }
  visit(root);
  return result;
}

function referencedNames(text) {
  const counts = new Map();
  const pattern = /(?:https?:\/\/[^\s)'"<>]+)?\/?images\/([^\s)'"<>?#]+)/gi;
  for (const match of String(text || '').matchAll(pattern)) {
    let name = match[1].replace(/\\/g, '/').split('/').pop();
    try { name = decodeURIComponent(name); } catch (_) {}
    if (name) counts.set(name, (counts.get(name) || 0) + 1);
  }
  return counts;
}

function analyzeMediaReferences(context) {
  const files = context.repositories.files;
  const references = new Map();
  contentFiles(files, context.paths.source, [context.paths.images]).forEach(filePath => {
    const source = path.relative(context.paths.source, filePath).replace(/\\/g, '/');
    for (const [name, count] of referencedNames(files.readText(filePath))) {
      if (!references.has(name)) references.set(name, []);
      references.get(name).push({ source, count });
    }
  });
  return references;
}

module.exports = { CONTENT_EXTENSIONS, contentFiles, referencedNames, analyzeMediaReferences };
