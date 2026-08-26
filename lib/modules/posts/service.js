'use strict';

const path = require('path');
const frontMatter = require('hexo-front-matter');
const { slugify, countWords, normalizeNewlines } = require('../../shared/text');
const { editablePost, buildPostSource, setPublished } = require('./front-matter');
const { badRequest, notFound, conflict } = require('../../server/errors');
const { contentRevision, requireRevision } = require('../../shared/revision');

function relationNames(relation) {
  try { return relation && relation.toArray ? relation.toArray().map(item => item.name) : []; }
  catch (_) { return []; }
}

function createPostService(context) {
  const hexo = context.hexo;
  const postsDir = context.paths.posts;
  const sourceDir = context.paths.source;
  const files = context.repositories.files;

  function find(id) {
    const post = hexo.model('Post').findById(id);
    if (!post) throw notFound('Post not found');
    return post;
  }

  async function refresh() { await context.operations.run(() => hexo.source.process()); }

  function detail(post) {
    const raw = files.readText(post.full_source);
    const editable = editablePost(raw, {
      title: post.title, date: post.date,
      categories: relationNames(post.categories), tags: relationNames(post.tags)
    });
    return {
      _id: post._id, title: editable.title, slug: post.slug, date: editable.date,
      categories: editable.categories, tags: editable.tags,
      published: editable.frontMatter.published !== false,
      layout: editable.frontMatter.layout || 'post', content: editable.content,
      frontMatter: editable.frontMatter, source: post.source, raw, revision: contentRevision(raw)
    };
  }

  return {
    list(query) {
      const page = Math.max(1, parseInt(query.page, 10) || 1);
      const perPage = Math.min(100, Math.max(1, parseInt(query.per_page, 10) || 20));
      const search = (query.search || '').toLowerCase();
      let posts = hexo.model('Post').find({}).toArray();
      if (query.status === 'published') posts = posts.filter(post => post.published !== false);
      else if (query.status === 'draft') posts = posts.filter(post => post.published === false);
      if (search) posts = posts.filter(post => (post.title || '').toLowerCase().includes(search));
      if (query.category) posts = posts.filter(post => relationNames(post.categories).some(value => value.toLowerCase() === query.category.toLowerCase()));
      if (query.tag) posts = posts.filter(post => relationNames(post.tags).some(value => value.toLowerCase() === query.tag.toLowerCase()));
      posts.sort((a, b) => new Date(b.date) - new Date(a.date));
      const total = posts.length;
      const result = posts.slice((page - 1) * perPage, page * perPage).map(post => ({
        _id: post._id, title: post.title, slug: post.slug, date: post.date, updated: post.updated,
        categories: relationNames(post.categories), tags: relationNames(post.tags), published: post.published !== false,
        excerpt: (post.excerpt || post.content || '').slice(0, 200), source: post.source,
        wordCount: countWords(post.content || post._content || ''),
        revision: contentRevision(files.readBuffer(post.full_source))
      }));
      return { posts: result, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
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
      const filePath = path.join(postsDir, filename);
      if (files.exists(filePath)) throw conflict('A post with this title already exists');
      const content = buildPostSource({
        title: data.title, date: data.date || new Date().toISOString().replace('T', ' ').slice(0, 19),
        categories: data.categories || [], tags: data.tags || [], content: data.content || '', frontMatter: data.frontMatter || {}
      });
      files.mkdir(path.dirname(filePath));
      files.writeText(filePath, content);
      await refresh();
      return { path: path.relative(sourceDir, filePath), source: path.relative(hexo.base_dir, filePath) };
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
          published: data.published !== undefined ? data.published : current.frontMatter.published,
          layout: data.layout !== undefined ? data.layout : current.frontMatter.layout || 'post',
          content: data.content !== undefined ? data.content : current.content,
          frontMatter: data.frontMatter !== undefined ? data.frontMatter : current.frontMatter
        });
        files.writeText(filePath, content);
      }
      await refresh();
      return { source: post.source, revision: contentRevision(files.readBuffer(filePath)) };
    },
    async remove(id, revision) {
      const post = find(id);
      const raw = files.readText(post.full_source);
      requireRevision(revision, raw);
      return context.services.trash.move('post', post.full_source, { title: post.title, source: post.source });
    },
    async publish(id, published, revision) {
      const post = find(id);
      const raw = files.readText(post.full_source);
      requireRevision(revision, raw);
      const value = published !== false;
      files.writeText(post.full_source, setPublished(raw, value));
      await refresh();
      return { published: value, revision: contentRevision(files.readBuffer(post.full_source)) };
    }
  };
}

module.exports = { createPostService };
