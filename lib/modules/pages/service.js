'use strict';

const path = require('path');
const {sourceDate}=require('../../shared/hexo-native');
const frontMatter = require('hexo-front-matter');
const { parseYaml, dumpYaml } = require('../config/yaml-codec');
const { safeRelativePath, resolveInside } = require('../../shared/paths');
const { normalizeNewlines } = require('../../shared/text');
const { contentRevision, requireRevision } = require('../../shared/revision');
const { badRequest, notFound, conflict } = require('../../server/errors');
const { refreshSavedContent } = require('../../shared/saved-refresh');

const RESERVED_ROOTS = new Set(['_posts', '_drafts', '_data', 'images']);
const CONTROLLED_FIELDS = new Set(['title', 'date', 'layout', 'template', '_content']);

function pageId(relativePath) {
  return Buffer.from(String(relativePath).replace(/\\/g, '/'), 'utf8').toString('base64url');
}

function pagePathFromId(id) {
  try {
    const value = Buffer.from(String(id), 'base64url').toString('utf8');
    if (pageId(value) !== id) throw new Error('non-canonical');
    return normalizePagePath(value);
  } catch (_) { throw badRequest('页面编号无效', 'PAGE_ID_INVALID'); }
}

function normalizePagePath(value) {
  let relative = safeRelativePath(String(value || '').trim().replace(/^source\//, ''));
  if (!path.posix.extname(relative)) relative = relative.replace(/\/$/, '') + '/index.md';
  if (!relative.toLowerCase().endsWith('.md')) throw badRequest('页面必须使用 .md 文件', 'PAGE_PATH_INVALID');
  const root = relative.split('/')[0];
  if (RESERVED_ROOTS.has(root) || root.startsWith('.')) throw badRequest('页面路径位于保留目录', 'PAGE_PATH_INVALID');
  return relative;
}

function parsePageSource(raw) {
  if (typeof raw !== 'string') throw badRequest('页面源码必须是字符串', 'PAGE_SOURCE_INVALID');
  let parsed;
  try { parsed = frontMatter.parse(normalizeNewlines(raw)); }
  catch (error) { throw badRequest('页面 Front Matter 无效：' + error.message, 'PAGE_SOURCE_INVALID'); }
  const extra = {};
  Object.entries(parsed).forEach(([key, value]) => { if (!CONTROLLED_FIELDS.has(key)) extra[key] = value; });
  return {
    title: parsed.title || '', date: sourceDate(raw,parsed.date || ''), layout: parsed.layout || 'page',
    template: parsed.template || '', content: parsed._content || '', frontMatter: extra
  };
}

function buildPageSource(data) {
  const fields = data.frontMatter && typeof data.frontMatter === 'object' && !Array.isArray(data.frontMatter) ? { ...data.frontMatter } : {};
  fields.title = data.title || 'Untitled page';
  if (data.date) fields.date = data.date;
  if (data.layout) fields.layout = data.layout;
  if (data.template) fields.template = data.template;
  return frontMatter.stringify({ ...fields, _content: data.content || '' }, { prefixSeparator: true });
}

function nestedValue(object, keys) {
  return keys.reduce((value, key) => value && typeof value === 'object' ? value[key] : undefined, object);
}

function setNested(object, keys, value) {
  let cursor = object;
  keys.slice(0, -1).forEach(key => {
    if (!cursor[key] || typeof cursor[key] !== 'object' || Array.isArray(cursor[key])) cursor[key] = {};
    cursor = cursor[key];
  });
  cursor[keys[keys.length - 1]] = value;
}

function createPageService(context) {
  const files = context.repositories.files;
  const sourceDir = context.paths.source;
  const backupsDir = path.join(context.hexo.base_dir, '.hexo-admin', 'backups', 'menu');
  files.mkdir(backupsDir);

  function markdownFiles() {
    const result = [];
    function visit(directory, depth) {
      if (!files.exists(directory)) return;
      files.list(directory, { withFileTypes: true }).forEach(entry => {
        if (entry.name.startsWith('.')) return;
        if (depth === 0 && entry.isDirectory() && RESERVED_ROOTS.has(entry.name)) return;
        const location = path.join(directory, entry.name);
        if (entry.isDirectory()) visit(location, depth + 1);
        else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) result.push(location);
      });
    }
    visit(sourceDir, 0);
    return result;
  }

  function hexoPage(filePath) {
    try {
      const model = context.hexo.model('Page');
      return model.find({}).toArray().find(item => path.resolve(item.full_source) === path.resolve(filePath)) || null;
    } catch (_) { return null; }
  }

  function fallbackPermalink(relative) {
    const normalized = relative.replace(/\\/g, '/');
    if (normalized === 'index.md') return '/';
    if (normalized.endsWith('/index.md')) return '/' + normalized.slice(0, -8) + '/';
    return '/' + normalized.replace(/\.md$/i, '.html');
  }

  function record(filePath) {
    const relative = path.relative(sourceDir, filePath).replace(/\\/g, '/');
    const raw = files.readText(filePath);
    const parsed = parsePageSource(raw);
    const model = hexoPage(filePath);
    const stat = files.stat(filePath);
    return {
      id: pageId(relative), path: relative, title: parsed.title || path.basename(filePath, '.md'),
      layout: parsed.layout, template: parsed.template, date: parsed.date || stat.mtime.toISOString(),
      permalink: parsed.frontMatter.permalink || (model && (model.path || model.permalink)) || fallbackPermalink(relative),
      updatedAt: stat.mtime.toISOString(), revision: contentRevision(raw)
    };
  }

  function locate(id) {
    const relative = pagePathFromId(id);
    const filePath = resolveInside(sourceDir, relative);
    if (!files.exists(filePath)) throw notFound('页面不存在', 'PAGE_NOT_FOUND');
    return { relative, filePath };
  }

  function menuTarget() {
    const theme = context.themes.resolve();
    const resolved = theme.resolved || {};
    const keys = resolved.navbar && resolved.navbar.links && typeof resolved.navbar.links === 'object'
      ? ['navbar', 'links'] : ['menu'];
    const raw = files.exists(theme.writePath) ? files.readText(theme.writePath) : '';
    const overrides = raw ? parseYaml(raw) : {};
    const current = nestedValue(overrides, keys) || nestedValue(resolved, keys) || {};
    return { theme, keys, raw, overrides, current: current && typeof current === 'object' && !Array.isArray(current) ? current : {} };
  }

  function menuItems(target) {
    return Object.entries(target.current).map(([label, value], order) => {
      if (typeof value === 'string') return { label, path: value, icon: '', order };
      const entry = value && typeof value === 'object' ? value : {};
      return { label, path: entry.path || 'none', icon: entry.icon || '', order, hasSubmenus: Boolean(entry.submenus) };
    });
  }

  return {
    list() {
      const target = menuTarget();
      const menu = menuItems(target);
      const menuPaths = new Map(menu.map(item => [String(item.path).replace(/\/$/, '') || '/', item.order]));
      const items = markdownFiles().map(record).map(item => ({
        ...item,
        menuOrder: menuPaths.has(String(item.permalink).replace(/\/$/, '') || '/') ? menuPaths.get(String(item.permalink).replace(/\/$/, '') || '/') : null
      })).sort((a, b) => (a.menuOrder ?? 99999) - (b.menuOrder ?? 99999) || a.path.localeCompare(b.path));
      return { items, total: items.length, menu: { items: menu, revision: contentRevision(target.raw), configPath: path.relative(context.hexo.base_dir, target.theme.writePath).replace(/\\/g, '/') } };
    },
    get(id) {
      const found = locate(id);
      const raw = files.readText(found.filePath);
      return { id, path: found.relative, historySource:path.relative(context.hexo.base_dir,found.filePath).replace(/\\/g,'/'), ...parsePageSource(raw), raw, revision: contentRevision(raw), permalink: record(found.filePath).permalink };
    },
    parse(raw) { return parsePageSource(raw); },
    build(data) { return buildPageSource(data || {}); },
    async create(data) {
      const relative = normalizePagePath(data.path);
      const filePath = resolveInside(sourceDir, relative);
      if (files.exists(filePath)) throw conflict('页面路径已存在', 'PAGE_PATH_CONFLICT');
      const values = { title: data.title || path.basename(relative, '.md'), date: data.date || new Date().toISOString(), slug: relative.split('/')[0] };
      let initial = { title: values.title, date: values.date, layout: data.layout || 'page', template: data.template || '', content: data.content || '', frontMatter: data.frontMatter || {} };
      if (data.scaffold) {
        const rendered = context.services.scaffolds.render(data.scaffold, values).parsed;
        const scaffoldSource = parsePageSource(frontMatter.stringify(rendered, { prefixSeparator: true }));
        initial = { ...scaffoldSource, title: values.title, content: data.content !== undefined ? data.content : scaffoldSource.content };
        if (data.layout) initial.layout = data.layout;
        if (data.template) initial.template = data.template;
      }
      const raw = buildPageSource(initial);
      files.mkdir(path.dirname(filePath));
      files.writeText(filePath, raw);
      const saveState = await refreshSavedContent(context);
      return { ...saveState, id: pageId(relative), path: relative, revision: contentRevision(raw) };
    },
    async update(id, data) {
      const found = locate(id);
      const current = files.readText(found.filePath);
      requireRevision(data.revision, current, { conflictMessage: '页面已在其他位置修改，请刷新后重试', conflictCode: 'PAGE_REVISION_CONFLICT' });
      const raw = Object.prototype.hasOwnProperty.call(data, 'raw') ? normalizeNewlines(data.raw) : buildPageSource(data);
      parsePageSource(raw);
      files.writeText(found.filePath, raw);
      const saveState = await refreshSavedContent(context);
      return { ...saveState, id, path: found.relative, raw, revision: contentRevision(raw) };
    },
    async remove(id, revision) {
      const found = locate(id);
      const raw = files.readText(found.filePath);
      requireRevision(revision, raw);
      return context.services.trash.move('page', found.filePath, { path: found.relative, title: parsePageSource(raw).title });
    },
    menu() {
      const target = menuTarget();
      return { items: menuItems(target), revision: contentRevision(target.raw), configPath: path.relative(context.hexo.base_dir, target.theme.writePath).replace(/\\/g, '/') };
    },
    updateMenu(items, revision) {
      const target = menuTarget();
      requireRevision(revision, target.raw, { conflictMessage: '主题菜单已在其他位置修改，请刷新后重试', conflictCode: 'MENU_REVISION_CONFLICT' });
      const labels = new Set();
      const next = {};
      items.forEach(item => {
        const label = String(item.label || '').trim();
        if (!label || labels.has(label)) throw badRequest('菜单名称不能为空或重复', 'MENU_INVALID');
        labels.add(label);
        const previous = target.current[label];
        if (typeof previous === 'string' && !item.icon) next[label] = item.path;
        else next[label] = { ...(previous && typeof previous === 'object' ? previous : {}), path: item.path || 'none', ...(item.icon ? { icon: item.icon } : {}) };
      });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      if (target.raw) files.writeText(path.join(backupsDir, 'menu-' + stamp + '.yml'), target.raw);
      files.list(backupsDir).filter(name => name.startsWith('menu-') && name.endsWith('.yml')).sort().reverse().slice(20)
        .forEach(name => files.remove(path.join(backupsDir, name)));
      setNested(target.overrides, target.keys, next);
      const raw = dumpYaml(target.overrides);
      files.writeText(target.theme.writePath, raw);
      return { items: menuItems({ current: next }), revision: contentRevision(raw), restartRequired: true };
    },
    previewInfo(id, revision) {
      const found = locate(id);
      const item = record(found.filePath);
      const raw = files.readText(found.filePath);
      requireRevision(revision, raw);
      return { kind: 'page', id, filePath: found.filePath, path: item.permalink, revision: item.revision, title: item.title };
    }
  };
}

module.exports = { buildPageSource, createPageService, normalizePagePath, pageId, pagePathFromId, parsePageSource };
