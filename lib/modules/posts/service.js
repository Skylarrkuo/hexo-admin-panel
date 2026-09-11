'use strict';

const path = require('path');
const crypto = require('crypto');
const frontMatter = require('hexo-front-matter');
const { slugify, countWords, normalizeNewlines } = require('../../shared/text');
const { editablePost, buildPostSource, setPublished } = require('./front-matter');
const { badRequest, notFound, conflict } = require('../../server/errors');
const { contentRevision, requireRevision } = require('../../shared/revision');
const { isPathInside, resolveInside } = require('../../shared/paths');
const { refreshSavedContent } = require('../../shared/saved-refresh');

function relationNames(relation) {
  try { return relation && relation.toArray ? relation.toArray().map(item => item.name) : []; }
  catch (_) { return []; }
}

function createPostService(context) {
  const hexo = context.hexo;
  const postsDir = context.paths.posts;
  const draftsDir = context.paths.drafts;
  const sourceDir = context.paths.source;
  const files = context.repositories.files;

  function draftId(relativePath) {
    return 'draft-' + crypto.createHash('sha256').update(relativePath.replace(/\\/g, '/')).digest('hex').slice(0, 32);
  }

  function markdownFiles(directory) {
    if (!files.exists(directory)) return [];
    const result = [];
    function visit(current) {
      files.list(current, { withFileTypes: true }).forEach(entry => {
        const location = path.join(current, entry.name);
        if (entry.isDirectory()) visit(location);
        else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) result.push(location);
      });
    }
    visit(directory);
    return result;
  }

  function draftRecord(filePath) {
    const relative = path.relative(draftsDir, filePath);
    const raw = files.readText(filePath);
    const editable = editablePost(raw);
    const stat = files.stat(filePath);
    return {
      _id: draftId(relative), title: editable.title || path.basename(filePath, path.extname(filePath)),
      slug: path.basename(filePath, path.extname(filePath)), date: editable.date || stat.mtime,
      updated: stat.mtime, published: false, layout: editable.frontMatter.layout || 'post',
      content: editable.content, _content: editable.content, full_source: filePath,
      source: '_drafts/' + relative.replace(/\\/g, '/'), categories: editable.categories,
      tags: editable.tags, isDraft: true, raw, editable
    };
  }

  function drafts() { return markdownFiles(draftsDir).map(draftRecord); }
  function allRecords() { return hexo.model('Post').find({}).toArray().concat(drafts()); }
  function names(relation) { return Array.isArray(relation) ? relation : relationNames(relation); }

  function workflowStatus(post, editable) {
    if (!post.isDraft && post.published !== false) return 'published';
    const schedule = context.services.scheduler && context.services.scheduler.forPost(post._id);
    if (schedule && ['scheduled', 'retrying', 'running'].includes(schedule.status)) return 'scheduled';
    return editable && editable.workflowStatus || 'draft';
  }

  function searchableText(post) {
    const raw = post.raw === undefined ? files.readText(post.full_source) : post.raw;
    let editable;
    try { editable = post.editable || editablePost(raw); } catch (_) { editable = { content: raw, frontMatter: {} }; }
    return [post.title, post.slug, post.source, editable.content, names(post.categories).join(' '), names(post.tags).join(' '), JSON.stringify(editable.frontMatter || {})].join('\n').toLowerCase();
  }

  function find(id) {
    const post = hexo.model('Post').findById(id);
    if (post) return post;
    const draft = drafts().find(item => item._id === id);
    if (draft) return draft;
    throw notFound('Post not found');
  }

  async function refresh() { await context.operations.run(() => hexo.source.process()); }

  function detail(post) {
    const raw = post.raw === undefined ? files.readText(post.full_source) : post.raw;
    const editable = post.editable || editablePost(raw, {
      title: post.title, date: post.date,
      categories: relationNames(post.categories), tags: relationNames(post.tags)
    });
    return {
      _id: post._id, title: editable.title, slug: post.slug, date: editable.date,
      categories: editable.categories, tags: editable.tags,
      published: post.isDraft ? false : editable.frontMatter.published !== false,
      workflowStatus: workflowStatus(post, editable),
      layout: editable.frontMatter.layout || 'post', content: editable.content,
      frontMatter: editable.frontMatter, source: post.source, raw, revision: contentRevision(raw)
    };
  }

  async function removeRecord(post, options) {
    const result = await context.services.trash.move(
      'post',
      post.full_source,
      { title: post.title, source: post.source },
      { skipRefresh: true }
    );
    if (context.services.scheduler) context.services.scheduler.completeForPost(post._id);
    if (!(options && options.skipRefresh)) await refresh();
    return result;
  }

  async function publishRecord(post, raw, published, options) {
    const value = published !== false;
    const fromDir = post.isDraft ? draftsDir : postsDir;
    const toDir = value ? postsDir : draftsDir;
    if (!isPathInside(fromDir, post.full_source)) throw badRequest('文章路径不在允许的目录中', 'INVALID_POST_PATH');
    const relative = path.relative(fromDir, post.full_source);
    const destination = resolveInside(toDir, relative);
    if (path.resolve(destination) !== path.resolve(post.full_source) && files.exists(destination)) {
      throw conflict('目标位置已有同名文章', 'POST_NAME_CONFLICT');
    }
    const nextRaw = setPublished(raw, value);
    const moving = path.resolve(destination) !== path.resolve(post.full_source);
    let moved = false;
    try {
      files.writeText(post.full_source, nextRaw);
      if (moving) {
        files.mkdir(path.dirname(destination));
        files.move(post.full_source, destination);
        moved = true;
      }
      if (!(options && options.skipRefresh)) await refresh();
    } catch (error) {
      try {
        if (moved && files.exists(destination)) files.move(destination, post.full_source);
        if (files.exists(post.full_source)) files.writeText(post.full_source, raw);
      } catch (_) {}
      throw error;
    }
    const next = value
      ? (options && options.skipRefresh ? null : hexo.model('Post').find({}).toArray().find(item => path.resolve(item.full_source) === path.resolve(destination)))
      : draftRecord(destination);
    if (value && context.services.scheduler) context.services.scheduler.completeForPost(post._id);
    return { _id: next && next._id, published: value, source: path.relative(hexo.base_dir, destination), revision: contentRevision(files.readBuffer(destination)) };
  }

  return {
    list(query) {
      const page = Math.max(1, parseInt(query.page, 10) || 1);
      const perPage = Math.min(100, Math.max(1, parseInt(query.per_page, 10) || 20));
      const searchTerms = String(query.search || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
      let posts = allRecords();
      if (query.status === 'published') posts = posts.filter(post => post.published !== false && !post.isDraft);
      else if (query.status && query.status !== 'all') posts = posts.filter(post => {
        const raw = post.raw === undefined ? files.readText(post.full_source) : post.raw;
        const editable = post.editable || editablePost(raw);
        const status = workflowStatus(post, editable);
        return query.status === 'draft' ? status !== 'published' : status === query.status;
      });
      if (searchTerms.length) posts = posts.filter(post => { const text=searchableText(post);return searchTerms.every(term=>text.includes(term)); });
      if (query.category) posts = posts.filter(post => names(post.categories).some(value => value.toLowerCase() === query.category.toLowerCase()));
      if (query.tag) posts = posts.filter(post => names(post.tags).some(value => value.toLowerCase() === query.tag.toLowerCase()));
      posts.sort((a, b) => new Date(b.date) - new Date(a.date));
      const total = posts.length;
      const result = posts.slice((page - 1) * perPage, page * perPage).map(post => {
        const editable = post.editable || editablePost(post.raw === undefined ? files.readText(post.full_source) : post.raw);
        return ({
        _id: post._id, title: post.title, slug: post.slug, date: post.date, updated: post.updated,
        categories: names(post.categories), tags: names(post.tags), published: post.isDraft ? false : post.published !== false,
        excerpt: (post.excerpt || post.content || '').slice(0, 200), source: post.source,
        wordCount: countWords(post.content || post._content || ''),
        revision: contentRevision(files.readBuffer(post.full_source)), draft: post.isDraft === true,
        scheduledAt: context.services.scheduler ? context.services.scheduler.forPost(post._id)?.publishAt || null : null,
        scheduleId: context.services.scheduler ? context.services.scheduler.forPost(post._id)?.id || null : null,
        scheduleStatus: context.services.scheduler ? context.services.scheduler.forPost(post._id)?.status || null : null,
        scheduleError: context.services.scheduler ? context.services.scheduler.forPost(post._id)?.error || null : null,
        workflowStatus: workflowStatus(post, editable)
      }); });
      return { posts: result, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
    },
    summary() {
      const posts = allRecords();
      const published = posts.filter(post => post.published !== false && !post.isDraft).length;
      const draftCount = posts.length - published;
      const totalWords = posts.reduce((sum, post) => sum + countWords(post.content || post._content || ''), 0);
      const lastUpdated = posts.reduce((max, post) => {
        const date = new Date(post.updated || post.date || 0);
        return date > max ? date : max;
      }, new Date(0));
      return { published, drafts: draftCount, totalWords, lastUpdated };
    },
    get(id) { return detail(find(id)); },
    parse(raw) {
      if (typeof raw !== 'string') throw badRequest('Raw source must be a string');
      return editablePost(raw);
    },
    build(data) { return buildPostSource(data || {}); },
    async create(data) {
      if (!data.title) throw badRequest('Title is required');
      const slug = slugify(data.title);
      const filename = (hexo.config.new_post_name || ':title.md').replace(':title', slug).replace(':lang', 'default');
      const published = data.published === true || data.workflowStatus === 'published';
      const targetDir = published ? postsDir : draftsDir;
      let filePath;
      let alternatePath;
      try {
        filePath = resolveInside(targetDir, filename);
        alternatePath = resolveInside(published ? draftsDir : postsDir, filename);
      } catch (_) { throw badRequest('新文章文件名必须位于文章目录内', 'INVALID_POST_PATH'); }
      if (files.exists(filePath) || files.exists(alternatePath)) throw conflict('A post with this title already exists');
      const values = { title: data.title, date: data.date || new Date().toISOString().replace('T', ' ').slice(0, 19), slug };
      let scaffold = null;
      if (data.scaffold) scaffold = editablePost(context.services.scaffolds.render(data.scaffold, values).raw);
      const content = buildPostSource({
        title: data.title, date: values.date,
        categories: data.categories !== undefined ? data.categories : scaffold && scaffold.categories || [],
        tags: data.tags !== undefined ? data.tags : scaffold && scaffold.tags || [],
        content: data.content !== undefined ? data.content : scaffold && scaffold.content || '',
        frontMatter: { ...(scaffold && scaffold.frontMatter || {}), ...(data.frontMatter || {}) },
        layout: data.layout || scaffold && scaffold.frontMatter.layout || 'post',
        workflowStatus: published ? 'published' : data.workflowStatus || scaffold && scaffold.workflowStatus || 'draft',
        published
      });
      files.mkdir(path.dirname(filePath));
      files.writeText(filePath, content);
      const saveState = await refreshSavedContent(context);
      const relative = path.relative(targetDir, filePath);
      const created = published
        ? hexo.model('Post').find({}).toArray().find(post => path.resolve(post.full_source) === path.resolve(filePath))
        : draftRecord(filePath);
      return { ...saveState, _id: created && created._id, published, path: path.relative(sourceDir, filePath), source: path.relative(hexo.base_dir, filePath), relative: relative.replace(/\\/g, '/'), revision: contentRevision(content), workflowStatus: published ? 'published' : data.workflowStatus || 'draft' };
    },
    async update(id, data) {
      const post = find(id);
      const filePath = post.full_source;
      const currentRaw = files.readText(filePath);
      requireRevision(data.revision, currentRaw);
      if (Object.prototype.hasOwnProperty.call(data, 'raw')) {
        if (typeof data.raw !== 'string') throw badRequest('Raw source must be a string');
        frontMatter.parse(normalizeNewlines(data.raw));
        files.writeText(filePath, data.raw);
      } else {
        const current = editablePost(currentRaw, {
          title: post.title, date: post.date, categories: relationNames(post.categories), tags: relationNames(post.tags)
        });
        const content = buildPostSource({
          title: data.title !== undefined ? data.title : current.title,
          date: data.date !== undefined ? data.date : current.date,
          categories: data.categories !== undefined ? data.categories : current.categories,
          tags: data.tags !== undefined ? data.tags : current.tags,
          workflowStatus: data.workflowStatus !== undefined ? data.workflowStatus : current.workflowStatus,
          published: data.published !== undefined ? data.published : current.frontMatter.published,
          layout: data.layout !== undefined ? data.layout : current.frontMatter.layout || 'post',
          content: data.content !== undefined ? data.content : current.content,
          frontMatter: data.frontMatter !== undefined ? data.frontMatter : current.frontMatter
        });
        files.writeText(filePath, content);
      }
      const revision = contentRevision(files.readBuffer(filePath));
      const saveState = await refreshSavedContent(context);
      return { ...saveState, source: post.source, revision };
    },
    async remove(id, revision) {
      const post = find(id);
      const raw = files.readText(post.full_source);
      requireRevision(revision, raw);
      return removeRecord(post);
    },
    scheduleInfo(id, revision) {
      const post = find(id);
      const raw = files.readText(post.full_source);
      requireRevision(revision, raw);
      if (post.published !== false && !post.isDraft) throw badRequest('只能为草稿设置定时发布', 'POST_ALREADY_PUBLISHED');
      return { postId: post._id, title: post.title, source: post.source, revision: contentRevision(raw) };
    },
    async publishLatest(id) {
      const post = find(id);
      const revision = contentRevision(files.readBuffer(post.full_source));
      return this.publish(id, true, revision);
    },
    previewInfo(id, revision) {
      const post = find(id);
      const raw = files.readText(post.full_source);
      requireRevision(revision, raw);
      const editable = post.editable || editablePost(raw);
      return {
        kind: 'post', id, filePath: post.full_source, revision: contentRevision(raw), title: editable.title,
        path: editable.frontMatter.permalink || post.path || post.permalink || ('preview/' + post.slug + '/')
      };
    },
    async bulk(action, items) {
      const ids = new Set();
      const prepared = items.map(item => {
        if (ids.has(item.id)) throw badRequest('批量操作中不能包含重复文章', 'DUPLICATE_POST');
        ids.add(item.id);
        const post = find(item.id);
        const raw = files.readText(post.full_source);
        requireRevision(item.revision, raw);
        return { item, post, raw };
      });
      const results = [];
      let attempted = false;
      try {
        for (const entry of prepared) {
          attempted = true;
          const result = action === 'delete'
            ? await removeRecord(entry.post, { skipRefresh: true })
            : await publishRecord(entry.post, entry.raw, action === 'publish', { skipRefresh: true });
          results.push({ id: entry.item.id, result });
        }
      } finally {
        if (attempted) await refresh();
      }
      return { action, processed: results.length, results };
    },
    async publish(id, published, revision) {
      const post = find(id);
      const raw = files.readText(post.full_source);
      requireRevision(revision, raw);
      return publishRecord(post, raw, published);
    }
  };
}

module.exports = { createPostService };
