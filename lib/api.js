'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const frontMatter = require('hexo-front-matter');
const { sign, authMiddleware, json } = require('./auth');

module.exports = function createApiHandler(hexo, config) {
  const sourceDir = hexo.source_dir;
  const postsDir = path.join(sourceDir, '_posts');
  const draftsDir = path.join(sourceDir, '_drafts');
  const imagesDir = path.join(sourceDir, 'images');

  // Ensure images dir exists
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  // ─── Helpers ───────────────────────────────────────────

  function parseBody(req) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      let size = 0;
      const maxSize = 50 * 1024 * 1024; // 50MB
      req.on('data', chunk => {
        size += chunk.length;
        if (size > maxSize) {
          reject(new Error('Body too large'));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }

  async function parseJsonBody(req) {
    const buf = await parseBody(req);
    return JSON.parse(buf.toString('utf8'));
  }

  function parseMultipart(buf, boundary) {
    const files = [];
    const fields = {};
    const boundaryBuf = Buffer.from('--' + boundary);
    const endBuf = Buffer.from('--' + boundary + '--');

    let pos = 0;
    while (pos < buf.length) {
      // Find next boundary
      let start = bufIndexOf(buf, boundaryBuf, pos);
      if (start === -1) break;
      start += boundaryBuf.length;

      // Skip \r\n after boundary
      if (buf[start] === 0x0d && buf[start + 1] === 0x0a) start += 2;

      // Find end of this part (next boundary)
      let end = bufIndexOf(buf, boundaryBuf, start);
      if (end === -1) break;

      // Remove trailing \r\n before boundary
      let partData = buf.slice(start, end);
      if (partData[partData.length - 1] === 0x0a) partData = partData.slice(0, -1);
      if (partData[partData.length - 1] === 0x0d) partData = partData.slice(0, -1);

      // Parse part headers
      const headerEnd = bufIndexOf(partData, Buffer.from('\r\n\r\n'));
      if (headerEnd === -1) { pos = end; continue; }

      const headerStr = partData.slice(0, headerEnd).toString('utf8');
      const body = partData.slice(headerEnd + 4);

      const nameMatch = headerStr.match(/name="([^"]+)"/);
      const filenameMatch = headerStr.match(/filename="([^"]+)"/);
      const typeMatch = headerStr.match(/Content-Type:\s*(\S+)/i);

      if (filenameMatch && nameMatch) {
        files.push({
          fieldname: nameMatch[1],
          filename: filenameMatch[1],
          mimetype: typeMatch ? typeMatch[1] : 'application/octet-stream',
          buffer: body
        });
      } else if (nameMatch) {
        fields[nameMatch[1]] = body.toString('utf8');
      }

      pos = end;
    }

    return { files, fields };
  }

  function bufIndexOf(buf, search, from) {
    from = from || 0;
    for (let i = from; i <= buf.length - search.length; i++) {
      let found = true;
      for (let j = 0; j < search.length; j++) {
        if (buf[i + j] !== search[j]) { found = false; break; }
      }
      if (found) return i;
    }
    return -1;
  }

  function slugify(str) {
    return str
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w一-鿿-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      || 'untitled';
  }

  function countWords(text) {
    if (!text) return 0;
    // Count CJK characters individually + latin words
    const cjk = (text.match(/[一-鿿㐀-䶿豈-﫿]/g) || []).length;
    const latin = text.replace(/[一-鿿㐀-䶿豈-﫿]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0).length;
    return cjk + latin;
  }

  function getPostCategories(post) {
    try {
      const cats = post.categories;
      return cats && cats.toArray ? cats.toArray().map(c => c.name) : [];
    } catch (e) { return []; }
  }

  function getPostTags(post) {
    try {
      const tags = post.tags;
      return tags && tags.toArray ? tags.toArray().map(t => t.name) : [];
    } catch (e) { return []; }
  }

  function parseFrontMatter(raw) {
    try {
      const parsed = frontMatter.parse(raw);
      return {
        data: parsed,
        _content: parsed._content || ''
      };
    } catch (e) {
      return { data: {}, _content: raw };
    }
  }

  function buildPostFile(data) {
    const fm = {};
    if (data.title) fm.title = data.title;
    if (data.date) fm.date = data.date;
    if (data.categories && data.categories.length) fm.categories = data.categories;
    if (data.tags && data.tags.length) fm.tags = data.tags;
    if (data.published === false) fm.published = false;
    if (data.layout) fm.layout = data.layout;
    // Merge extra front matter
    if (data.frontMatter && typeof data.frontMatter === 'object') {
      Object.assign(fm, data.frontMatter);
    }
    return frontMatter.stringify({ ...fm, _content: data.content || '' });
  }

  function parseUrl(url) {
    const qIdx = url.indexOf('?');
    const pathname = qIdx >= 0 ? url.slice(0, qIdx) : url;
    const queryStr = qIdx >= 0 ? url.slice(qIdx + 1) : '';
    const query = {};
    if (queryStr) {
      queryStr.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        query[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }
    return { pathname, query };
  }

  // ─── Router ────────────────────────────────────────────

  const routes = [];

  function addRoute(method, pattern, handler) {
    // pattern like /posts/:id/publish -> regex /posts/([^/]+)/publish
    const regexStr = '^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$';
    const paramNames = (pattern.match(/:([^/]+)/g) || []).map(s => s.slice(1));
    routes.push({
      method: method.toUpperCase(),
      regex: new RegExp(regexStr),
      paramNames,
      handler
    });
  }

  function matchRoute(method, pathname) {
    for (const route of routes) {
      if (route.method !== method) continue;
      const m = pathname.match(route.regex);
      if (m) {
        const params = {};
        route.paramNames.forEach((name, i) => { params[name] = m[i + 1]; });
        return { handler: route.handler, params };
      }
    }
    return null;
  }

  // ─── Auth endpoints ────────────────────────────────────

  addRoute('POST', '/auth/login', async (req, res, params, query) => {
    const body = await parseJsonBody(req);
    if (body.username === config.username && body.password === config.password) {
      const token = sign({ username: body.username }, config.jwt_secret, config.token_expiry || '24h');
      json(res, { success: true, data: { token, expiresIn: 86400 } });
    } else {
      json(res, { success: false, error: 'Invalid credentials' }, 401);
    }
  });

  addRoute('GET', '/auth/verify', (req, res, params, query) => {
    authMiddleware(req, res, () => {
      json(res, { success: true, data: { username: req._user.username } });
    }, config);
  });

  // ─── Stats ─────────────────────────────────────────────

  addRoute('GET', '/stats', (req, res, params, query) => {
    authMiddleware(req, res, () => {
      try {
        const allPosts = hexo.model('Post').find({}).toArray();
        const published = allPosts.filter(p => p.published !== false);
        const drafts = allPosts.filter(p => p.published === false);
        let totalWords = 0;
        allPosts.forEach(p => {
          totalWords += countWords(p.content || p._content || '');
        });
        const lastUpdated = allPosts.reduce((max, p) => {
          const d = p.updated || p.date;
          return d > max ? d : max;
        }, new Date(0));

        json(res, {
          success: true,
          data: {
            posts: published.length,
            drafts: drafts.length,
            categories: hexo.model('Category').count(),
            tags: hexo.model('Tag').count(),
            totalWords,
            lastUpdated: lastUpdated.toISOString ? lastUpdated.toISOString() : lastUpdated
          }
        });
      } catch (e) {
        json(res, { success: false, error: e.message }, 500);
      }
    }, config);
  });

  // ─── Posts ─────────────────────────────────────────────

  addRoute('GET', '/posts', (req, res, params, query) => {
    authMiddleware(req, res, () => {
      try {
        const page = parseInt(query.page) || 1;
        const perPage = parseInt(query.per_page) || 20;
        const search = (query.search || '').toLowerCase();
        const status = query.status || 'all';
        const catFilter = query.category || '';
        const tagFilter = query.tag || '';

        let posts = hexo.model('Post').find({}).toArray();

        // Filter by status
        if (status === 'published') posts = posts.filter(p => p.published !== false);
        else if (status === 'draft') posts = posts.filter(p => p.published === false);

        // Filter by search
        if (search) {
          posts = posts.filter(p => (p.title || '').toLowerCase().includes(search));
        }

        // Filter by category
        if (catFilter) {
          posts = posts.filter(p => {
            const cats = getPostCategories(p);
            return cats.some(c => c.toLowerCase() === catFilter.toLowerCase());
          });
        }

        // Filter by tag
        if (tagFilter) {
          posts = posts.filter(p => {
            const tags = getPostTags(p);
            return tags.some(t => t.toLowerCase() === tagFilter.toLowerCase());
          });
        }

        // Sort by date desc
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        const total = posts.length;
        const totalPages = Math.ceil(total / perPage);
        const start = (page - 1) * perPage;
        const paged = posts.slice(start, start + perPage);

        const result = paged.map(p => ({
          _id: p._id,
          title: p.title,
          slug: p.slug,
          date: p.date,
          updated: p.updated,
          categories: getPostCategories(p),
          tags: getPostTags(p),
          published: p.published !== false,
          excerpt: (p.excerpt || p.content || '').slice(0, 200),
          source: p.source,
          wordCount: countWords(p.content || p._content || '')
        }));

        json(res, {
          success: true,
          data: { posts: result, total, page, per_page: perPage, total_pages: totalPages }
        });
      } catch (e) {
        json(res, { success: false, error: e.message }, 500);
      }
    }, config);
  });

  addRoute('GET', '/posts/:id', (req, res, params) => {
    authMiddleware(req, res, () => {
      try {
        const post = hexo.model('Post').findById(params.id);
        if (!post) return json(res, { success: false, error: 'Post not found' }, 404);

        const raw = fs.readFileSync(post.full_source, 'utf8');
        const parsed = parseFrontMatter(raw);
        const data = parsed.data;
        const content = parsed._content;

        // Build extra front matter (exclude standard fields)
        const standard = ['title', 'date', 'updated', 'categories', 'tags', 'layout', 'published', 'permalink', 'excerpt', 'photos', 'comments', 'slug', '_content'];
        const frontMatterExtra = {};
        for (const [k, v] of Object.entries(data)) {
          if (!standard.includes(k)) frontMatterExtra[k] = v;
        }

        json(res, {
          success: true,
          data: {
            _id: post._id,
            title: data.title || post.title,
            slug: post.slug,
            date: data.date || post.date,
            categories: data.categories || getPostCategories(post),
            tags: data.tags || getPostTags(post),
            published: data.published !== false,
            layout: data.layout || 'post',
            content,
            frontMatter: frontMatterExtra,
            source: post.source,
            raw
          }
        });
      } catch (e) {
        json(res, { success: false, error: e.message }, 500);
      }
    }, config);
  });

  addRoute('POST', '/posts', async (req, res) => {
    authMiddleware(req, res, async () => {
      try {
        const body = await parseJsonBody(req);
        if (!body.title) return json(res, { success: false, error: 'Title is required' }, 400);

        const slug = slugify(body.title);
        const filename = (hexo.config.new_post_name || ':title.md').replace(':title', slug).replace(':lang', 'default');
        const filePath = path.join(postsDir, filename);

        if (fs.existsSync(filePath)) {
          return json(res, { success: false, error: 'A post with this title already exists' }, 409);
        }

        const content = buildPostFile({
          title: body.title,
          date: body.date || new Date().toISOString().replace('T', ' ').slice(0, 19),
          categories: body.categories || [],
          tags: body.tags || [],
          content: body.content || '',
          frontMatter: body.frontMatter || {}
        });

        fs.writeFileSync(filePath, content, 'utf8');

        // Reload source to update database
        await hexo.source.process();

        json(res, {
          success: true,
          data: { path: path.relative(sourceDir, filePath), source: path.relative(hexo.base_dir, filePath) }
        });
      } catch (e) {
        json(res, { success: false, error: e.message }, 500);
      }
    }, config);
  });

  addRoute('PUT', '/posts/:id', async (req, res, params) => {
    authMiddleware(req, res, async () => {
      try {
        const post = hexo.model('Post').findById(params.id);
        if (!post) return json(res, { success: false, error: 'Post not found' }, 404);

        const body = await parseJsonBody(req);
        const filePath = post.full_source;

        const content = buildPostFile({
          title: body.title || post.title,
          date: body.date || post.date,
          categories: body.categories !== undefined ? body.categories : getPostCategories(post),
          tags: body.tags !== undefined ? body.tags : getPostTags(post),
          published: body.published !== undefined ? body.published : post.published,
          layout: body.layout || post.layout || 'post',
          content: body.content !== undefined ? body.content : (post._content || post.content || ''),
          frontMatter: body.frontMatter !== undefined ? body.frontMatter : {}
        });

        fs.writeFileSync(filePath, content, 'utf8');
        await hexo.source.process();

        json(res, { success: true, data: { source: post.source } });
      } catch (e) {
        json(res, { success: false, error: e.message }, 500);
      }
    }, config);
  });

  addRoute('DELETE', '/posts/:id', async (req, res, params) => {
    authMiddleware(req, res, async () => {
      try {
        const post = hexo.model('Post').findById(params.id);
        if (!post) return json(res, { success: false, error: 'Post not found' }, 404);

        const filePath = post.full_source;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        await hexo.source.process();
        json(res, { success: true });
      } catch (e) {
        json(res, { success: false, error: e.message }, 500);
      }
    }, config);
  });

  addRoute('PUT', '/posts/:id/publish', async (req, res, params) => {
    authMiddleware(req, res, async () => {
      try {
        const post = hexo.model('Post').findById(params.id);
        if (!post) return json(res, { success: false, error: 'Post not found' }, 404);

        const body = await parseJsonBody(req);
        const published = body.published !== false;
        const filePath = post.full_source;

        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = parseFrontMatter(raw);
        parsed.data.published = published;

        const content = frontMatter.stringify({ ...parsed.data, _content: parsed._content });
        fs.writeFileSync(filePath, content, 'utf8');

        await hexo.source.process();
        json(res, { success: true, data: { published } });
      } catch (e) {
        json(res, { success: false, error: e.message }, 500);
      }
    }, config);
  });

  // ─── Render markdown preview ───────────────────────────

  addRoute('POST', '/render', async (req, res) => {
    authMiddleware(req, res, async () => {
      try {
        const body = await parseJsonBody(req);
        const content = body.content || '';
        const rendered = await hexo.render.render({ text: content, engine: 'markdown' });
        json(res, { success: true, data: { html: rendered } });
      } catch (e) {
        json(res, { success: false, error: e.message }, 500);
      }
    }, config);
  });

  // ─── Categories ────────────────────────────────────────

  addRoute('GET', '/categories', (req, res) => {
    authMiddleware(req, res, () => {
      try {
        const cats = hexo.model('Category').find({}).toArray().map(c => ({
          name: c.name,
          slug: c.slug,
          count: c.length
        }));
        json(res, { success: true, data: cats });
      } catch (e) {
        json(res, { success: false, error: e.message }, 500);
      }
    }, config);
  });

  // ─── Tags ──────────────────────────────────────────────

  addRoute('GET', '/tags', (req, res) => {
    authMiddleware(req, res, () => {
      try {
        const tags = hexo.model('Tag').find({}).toArray().map(t => ({
          name: t.name,
          slug: t.slug,
          count: t.length
        }));
        json(res, { success: true, data: tags });
      } catch (e) {
        json(res, { success: false, error: e.message }, 500);
      }
    }, config);
  });

  // ─── Media ─────────────────────────────────────────────

  addRoute('GET', '/media', (req, res, params, query) => {
    authMiddleware(req, res, () => {
      try {
        const page = parseInt(query.page) || 1;
        const perPage = parseInt(query.per_page) || 20;

        if (!fs.existsSync(imagesDir)) {
          return json(res, { success: true, data: { files: [], total: 0, page, per_page: perPage } });
        }

        const entries = fs.readdirSync(imagesDir, { withFileTypes: true });
        const files = entries
          .filter(e => e.isFile())
          .map(e => {
            const fp = path.join(imagesDir, e.name);
            const stat = fs.statSync(fp);
            const ext = path.extname(e.name).toLowerCase();
            const mimeMap = {
              '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
              '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
              '.ico': 'image/x-icon', '.bmp': 'image/bmp', '.pdf': 'application/pdf',
              '.zip': 'application/zip', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg'
            };
            return {
              name: e.name,
              path: '/images/' + e.name,
              size: stat.size,
              modified: stat.mtime.toISOString(),
              type: mimeMap[ext] || 'application/octet-stream'
            };
          })
          .sort((a, b) => new Date(b.modified) - new Date(a.modified));

        const total = files.length;
        const start = (page - 1) * perPage;
        const paged = files.slice(start, start + perPage);

        json(res, {
          success: true,
          data: { files: paged, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) }
        });
      } catch (e) {
        json(res, { success: false, error: e.message }, 500);
      }
    }, config);
  });

  addRoute('POST', '/media/upload', async (req, res) => {
    authMiddleware(req, res, async () => {
      try {
        const contentType = req.headers['content-type'] || '';
        const boundaryMatch = contentType.match(/boundary=(.+)/);
        if (!boundaryMatch) {
          return json(res, { success: false, error: 'Invalid content type' }, 400);
        }

        const buf = await parseBody(req);
        const { files } = parseMultipart(buf, boundaryMatch[1]);

        if (!files.length) {
          return json(res, { success: false, error: 'No file uploaded' }, 400);
        }

        const results = [];
        for (const file of files) {
          let filename = file.filename;
          // Sanitize filename
          filename = filename.replace(/[^\w一-鿿._-]/g, '_');
          // Avoid conflicts
          let filePath = path.join(imagesDir, filename);
          if (fs.existsSync(filePath)) {
            const ext = path.extname(filename);
            const base = path.basename(filename, ext);
            filename = base + '_' + Date.now() + ext;
            filePath = path.join(imagesDir, filename);
          }

          fs.writeFileSync(filePath, file.buffer);
          results.push({
            name: filename,
            path: '/images/' + filename,
            size: file.buffer.length
          });
        }

        await hexo.source.process();
        json(res, { success: true, data: results.length === 1 ? results[0] : results });
      } catch (e) {
        json(res, { success: false, error: e.message }, 500);
      }
    }, config);
  });

  addRoute('DELETE', '/media/:filename', async (req, res, params) => {
    authMiddleware(req, res, async () => {
      try {
        const filename = decodeURIComponent(params.filename);
        // Security: no path traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
          return json(res, { success: false, error: 'Invalid filename' }, 400);
        }

        const filePath = path.join(imagesDir, filename);
        if (!fs.existsSync(filePath)) {
          return json(res, { success: false, error: 'File not found' }, 404);
        }

        fs.unlinkSync(filePath);
        await hexo.source.process();
        json(res, { success: true });
      } catch (e) {
        json(res, { success: false, error: e.message }, 500);
      }
    }, config);
  });

  // ─── Config ────────────────────────────────────────────

  function getConfigPath(type) {
    if (type === 'theme') {
      const theme = hexo.config.theme || 'redefine';
      // Check _config.<theme>.yml in root first
      const themeConfigPath = path.join(hexo.base_dir, '_config.' + theme + '.yml');
      if (fs.existsSync(themeConfigPath)) return themeConfigPath;
      // Fallback to themes/<theme>/_config.yml
      return path.join(hexo.base_dir, 'themes', theme, '_config.yml');
    }
    return hexo.config_path || path.join(hexo.base_dir, '_config.yml');
  }

  addRoute('GET', '/config', (req, res, params, query) => {
    authMiddleware(req, res, () => {
      try {
        const type = query.type || 'site';
        const configPath = getConfigPath(type);
        const raw = fs.readFileSync(configPath, 'utf8');
        const parsed = yaml.load(raw);
        json(res, { success: true, data: { raw, parsed, path: configPath, type } });
      } catch (e) {
        json(res, { success: false, error: e.message }, 500);
      }
    }, config);
  });

  addRoute('PUT', '/config', async (req, res, params, query) => {
    authMiddleware(req, res, async () => {
      try {
        const body = await parseJsonBody(req);
        const type = body.type || query.type || 'site';

        if (body.raw !== undefined) {
          // Raw YAML mode
          try {
            yaml.load(body.raw);
          } catch (e) {
            return json(res, { success: false, error: 'Invalid YAML: ' + e.message }, 400);
          }
          const configPath = getConfigPath(type);
          fs.writeFileSync(configPath, body.raw, 'utf8');
        } else if (body.data !== undefined) {
          // Structured data mode - merge with existing config
          const configPath = getConfigPath(type);
          let existing = {};
          try {
            existing = yaml.load(fs.readFileSync(configPath, 'utf8')) || {};
          } catch (e) {}
          const merged = deepMerge(existing, body.data);
          fs.writeFileSync(configPath, yaml.dump(merged, { lineWidth: -1 }), 'utf8');
        } else {
          return json(res, { success: false, error: 'No config content provided' }, 400);
        }

        json(res, { success: true });
      } catch (e) {
        json(res, { success: false, error: e.message }, 500);
      }
    }, config);
  });

  function deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
          target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  // ─── Themes ────────────────────────────────────────────

  addRoute('GET', '/themes', (req, res) => {
    authMiddleware(req, res, () => {
      try {
        const themes = [];
        const seen = new Set();

        // Check themes/ directory
        const themesDir = path.join(hexo.base_dir, 'themes');
        if (fs.existsSync(themesDir)) {
          fs.readdirSync(themesDir, { withFileTypes: true })
            .filter(e => e.isDirectory() && e.name !== '.git' && !e.name.startsWith('.'))
            .forEach(e => {
              themes.push({ name: e.name, active: e.name === hexo.config.theme });
              seen.add(e.name);
            });
        }

        // Check node_modules for hexo-theme-* packages
        const nmDir = path.join(hexo.base_dir, 'node_modules');
        if (fs.existsSync(nmDir)) {
          fs.readdirSync(nmDir, { withFileTypes: true })
            .filter(e => e.isDirectory() && e.name.startsWith('hexo-theme-'))
            .forEach(e => {
              const name = e.name.replace('hexo-theme-', '');
              if (!seen.has(name)) {
                themes.push({ name, active: name === hexo.config.theme });
                seen.add(name);
              }
            });
        }

        json(res, { success: true, data: { themes, active: hexo.config.theme } });
      } catch (e) {
        json(res, { success: false, error: e.message }, 500);
      }
    }, config);
  });

  // ─── Commands ──────────────────────────────────────────

  addRoute('POST', '/commands/generate', (req, res) => {
    authMiddleware(req, res, () => {
      hexo.call('generate', { force: true }).then(() => {
        json(res, { success: true, data: { message: '站点生成完成' } });
      }).catch(e => {
        json(res, { success: false, error: e.message }, 500);
      });
    }, config);
  });

  addRoute('POST', '/commands/deploy', (req, res) => {
    authMiddleware(req, res, () => {
      hexo.call('deploy', {}).then(() => {
        json(res, { success: true, data: { message: '部署完成' } });
      }).catch(e => {
        json(res, { success: false, error: e.message }, 500);
      });
    }, config);
  });

  addRoute('POST', '/commands/clean', (req, res) => {
    authMiddleware(req, res, () => {
      hexo.call('clean', {}).then(() => {
        json(res, { success: true, data: { message: '缓存已清除' } });
      }).catch(e => {
        json(res, { success: false, error: e.message }, 500);
      });
    }, config);
  });

  // ─── Catch-all handler ─────────────────────────────────

  return function apiHandler(req, res, next) {
    const { pathname, query } = parseUrl(req.url);
    const method = req.method.toUpperCase();
    const match = matchRoute(method, pathname);

    if (!match) {
      // No matching API route - pass to next middleware
      return next();
    }

    try {
      match.handler(req, res, match.params, query);
    } catch (e) {
      json(res, { success: false, error: e.message }, 500);
    }
  };
};
