'use strict';

const path = require('path');
const { isPathInside } = require('../../shared/paths');
const { contentRevision } = require('../../shared/revision');

const CONTENT_EXTENSIONS = new Set(['.md', '.markdown', '.yml', '.yaml', '.json', '.html', '.css']);
const SCAN_SCOPE = {
  includes: ['source/**/*.{md,markdown,yml,yaml,json,html,css}', '_config*.{yml,yaml}'],
  excludes: ['source/images/**', 'theme/plugin source code', 'dynamic/generated references', 'remote sites'],
  description: 'Static references in source content, site configuration and theme overrides. No match does not prove a file is unused.'
};

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

function normalizeReference(value) {
  let decoded = String(value || '').replace(/\\/g, '/');
  try { decoded = decodeURIComponent(decoded); } catch (_) { return null; }
  decoded = decoded.replace(/^\.\//, '').replace(/^\/+/, '');
  const segments = decoded.split('/').filter(Boolean);
  if (!segments.length || segments.some(segment => segment === '.' || segment === '..')) return null;
  return segments.join('/');
}

// Preserve offsets and spelling so rewrites do not reserialize YAML/Markdown,
// lose comments, touch external URLs, or change query strings and fragments.
function referenceOccurrences(text, options = {}) {
  const result = [];
  const pattern = /[^\s"'<>()[\]`,;{}]+/g;
  let site;
  try { site = new URL(options.url); } catch (_) {}
  const root = '/' + String(options.root || '/').replace(/^\/+|\/+$/g, '') + '/';
  const mediaRoots = [...new Set([root.replace(/\/+/g, '/') + 'images/', '/images/'])];
  for (const match of String(text || '').matchAll(pattern)) {
    const token = match[0];
    const escapedSlashes = token.includes('\\/');
    const value = token.replace(/\\\//g, '/');
    let pathname = value.split(/[?#]/, 1)[0];
    if (/^(?:https?:)?\/\//i.test(value)) {
      let url;
      try { url = new URL(value, site); } catch (_) { continue; }
      if (!site || url.origin !== site.origin) continue;
      // Keep original spelling/offsets (URL.pathname percent-encodes Unicode).
      pathname = pathname.replace(/^(?:https?:)?\/\/[^/]+/i, '');
    } else if (/^[a-z][a-z\d+.-]*:/i.test(value)) continue;
    let relative;
    if (pathname.startsWith('/')) {
      const prefix = mediaRoots.find(item => pathname.startsWith(item));
      if (!prefix) continue;
      relative = pathname.slice(prefix.length);
    } else if (/^(?:\.\/)?images\//.test(pathname)) {
      relative = pathname.replace(/^(?:\.\/)?images\//, '');
    } else if (pathname.startsWith('../') && options.source) {
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(options.source), pathname));
      if (!resolved.startsWith('images/')) continue;
      const at = pathname.indexOf('images/');
      if (at < 0) continue;
      relative = pathname.slice(at + 7);
    } else continue;
    const mediaPath = normalizeReference(relative);
    if (!mediaPath) continue;
    const suffixStart = value.search(/[?#]/);
    const suffix = suffixStart >= 0 ? value.slice(suffixStart) : '';
    const prefix = value.slice(0, value.length - suffix.length - relative.length);
    result.push({ mediaPath, start: match.index, end: match.index + token.length, prefix, suffix, escapedSlashes });
  }
  return result;
}

function referencedPaths(text, options) {
  const counts = new Map();
  for (const reference of referenceOccurrences(text, options)) {
    counts.set(reference.mediaPath, (counts.get(reference.mediaPath) || 0) + 1);
  }
  return counts;
}

function scanMediaReferences(context) {
  const files = context.repositories.files;
  const base = context.hexo.base_dir;
  const candidates = new Set(contentFiles(files, context.paths.source, [context.paths.images]));
  files.list(base, { withFileTypes: true }).filter(entry => entry.isFile() && /^_config.*\.ya?ml$/i.test(entry.name))
    .forEach(entry => candidates.add(path.join(base, entry.name)));
  if (context.hexo.config_path) candidates.add(context.hexo.config_path);
  return [...candidates].filter(location => files.exists(location)).sort().map(filePath => {
    const raw = files.readText(filePath);
    const source = path.relative(context.paths.source, filePath).replace(/\\/g, '/');
    const options = { url: context.hexo.config.url, root: context.hexo.config.root, source };
    return { filePath, source, raw, revision: contentRevision(raw), occurrences: referenceOccurrences(raw, options) };
  });
}

function analyzeMediaReferences(context) {
  const references = new Map();
  for (const file of scanMediaReferences(context)) {
    const counts = new Map();
    for (const occurrence of file.occurrences) counts.set(occurrence.mediaPath, (counts.get(occurrence.mediaPath) || 0) + 1);
    for (const [mediaPath, count] of counts) {
      if (!references.has(mediaPath)) references.set(mediaPath, []);
      references.get(mediaPath).push({ source: file.source, count });
    }
  }
  return references;
}

function rewriteReferences(file, previousName, nextName) {
  if (previousName === nextName) return file.raw;
  let raw = file.raw;
  const encodedName = nextName.split('/').map(segment => encodeURIComponent(segment).replace(/[!'()*]/g, char => '%' + char.charCodeAt(0).toString(16))).join('/');
  for (const occurrence of file.occurrences.filter(item => item.mediaPath === previousName).reverse()) {
    let replacement = occurrence.prefix + encodedName + occurrence.suffix;
    if (occurrence.escapedSlashes) replacement = replacement.replace(/\//g, '\\/');
    raw = raw.slice(0, occurrence.start) + replacement + raw.slice(occurrence.end);
  }
  return raw;
}

module.exports = { CONTENT_EXTENSIONS, SCAN_SCOPE, contentFiles, normalizeReference, referenceOccurrences,
  referencedPaths, referencedNames: referencedPaths, analyzeMediaReferences, scanMediaReferences, rewriteReferences };
