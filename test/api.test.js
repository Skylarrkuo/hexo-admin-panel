'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Readable } = require('node:stream');
const test = require('node:test');
const frontMatter = require('hexo-front-matter');
const yaml = require('js-yaml');
const createApiHandler = require('../lib/api');

function relation(values) {
  return { toArray: () => values.map(name => ({ name })) };
}

function createFixture(runtime) {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexo-admin-panel-'));
  const sourceDir = path.join(baseDir, 'source');
  const postsDir = path.join(sourceDir, '_posts');
  const themeDir = path.join(baseDir, 'themes', 'redefine');
  fs.mkdirSync(postsDir, { recursive: true });
  fs.mkdirSync(themeDir, { recursive: true });
  const configPath = path.join(baseDir, '_config.yml');
  fs.writeFileSync(configPath, 'title: Test site\ntheme: redefine\n', 'utf8');
  fs.writeFileSync(path.join(themeDir, '_config.yml'), 'info:\n  title: Theme\n', 'utf8');

  let posts = [];
  const calls = [];

  function processSource() {
    posts = fs.readdirSync(postsDir)
      .filter(name => name.endsWith('.md'))
      .map(name => {
        const fullSource = path.join(postsDir, name);
        const raw = fs.readFileSync(fullSource, 'utf8').replace(/\r\n?/g, '\n');
        const data = frontMatter.parse(raw);
        const categories = Array.isArray(data.categories) ? data.categories : (data.categories ? [data.categories] : []);
        const tags = Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []);
        return {
          _id: 'id-' + Buffer.from(name).toString('hex'),
          title: data.title || path.basename(name, '.md'),
          slug: path.basename(name, '.md'),
          date: data.date || new Date('2026-01-01T00:00:00Z'),
          updated: data.updated || data.date || new Date('2026-01-01T00:00:00Z'),
          published: data.published !== false,
          layout: data.layout || 'post',
          content: data._content || '',
          _content: data._content || '',
          full_source: fullSource,
          source: '_posts/' + name,
          categories: relation(categories),
          tags: relation(tags)
        };
      });
    return Promise.resolve();
  }

  function taxonomyModel(field) {
    const values = () => [...new Set(posts.flatMap(post => post[field].toArray().map(item => item.name)))];
    return {
      count: () => values().length,
      find: () => ({ toArray: () => values().map(name => ({ name, slug: name, length: 1 })) })
    };
  }

  const postModel = {
    find: () => ({ toArray: () => posts.slice() }),
    findById: id => posts.find(post => post._id === id) || null
  };

  const hexo = {
    base_dir: baseDir + path.sep,
    source_dir: sourceDir + path.sep,
    config_path: configPath,
    config: { root: '/', new_post_name: ':title.md', theme: 'redefine' },
    source: { process: processSource },
    model(name) {
      if (name === 'Post') return postModel;
      if (name === 'Category') return taxonomyModel('categories');
      if (name === 'Tag') return taxonomyModel('tags');
      throw new Error('Unknown model: ' + name);
    },
    render: { render: async ({ text }) => '<p>' + text + '</p>' },
    call: async name => { calls.push(name); }
  };

  const config = { username: 'admin', password: 'secret', jwt_secret: 'test-secret', token_expiry: '2h' };
  const handler = createApiHandler(hexo, config, runtime);
  const cleanup = () => fs.rmSync(baseDir, { recursive: true, force: true });
  return { baseDir, calls, cleanup, config, configPath, handler, hexo, postsDir, processSource, sourceDir };
}

function request(handler, method, url, options = {}) {
  return new Promise((resolve, reject) => {
    const body = options.body === undefined
      ? Buffer.alloc(0)
      : (Buffer.isBuffer(options.body) ? options.body : Buffer.from(String(options.body)));
    const req = Readable.from(body.length ? [body] : []);
    req.method = method;
    req.url = url;
    req.headers = Object.fromEntries(Object.entries(options.headers || {}).map(([key, value]) => [key.toLowerCase(), value]));

    const chunks = [];
    const res = {
      headers: {}, headersSent: false, writableEnded: false, statusCode: 200,
      writeHead(statusCode, headers) {
        this.statusCode = statusCode;
        this.headers = headers || {};
        this.headersSent = true;
      },
      end(chunk) {
        if (chunk) chunks.push(Buffer.from(chunk));
        this.writableEnded = true;
        clearTimeout(timer);
        const text = Buffer.concat(chunks).toString('utf8');
        let json;
        try { json = text ? JSON.parse(text) : undefined; } catch (error) { json = undefined; }
        resolve({ statusCode: this.statusCode, headers: this.headers, text, json });
      }
    };

    const timer = setTimeout(() => reject(new Error(method + ' ' + url + ' timed out')), 3000);
    const next = () => {
      clearTimeout(timer);
      resolve({ statusCode: 404, next: true });
    };

    try {
      const result = handler(req, res, next);
      if (result && typeof result.catch === 'function') result.catch(reject);
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
}

async function login(handler) {
  const response = await request(handler, 'POST', '/auth/login', {
    body: JSON.stringify({ username: 'admin', password: 'secret' }),
    headers: { 'content-type': 'application/json' }
  });
  assert.equal(response.statusCode, 200);
  return response.json.data.token;
}

function authHeaders(token, extra) {
  return { authorization: 'Bearer ' + token, 'content-type': 'application/json', ...(extra || {}) };
}

test('authentication rejects malformed input without terminating later requests', async t => {
  const fixture = createFixture();
  t.after(fixture.cleanup);

  const malformed = await request(fixture.handler, 'POST', '/auth/login', {
    body: '{', headers: { 'content-type': 'application/json' }
  });
  assert.equal(malformed.statusCode, 400);
  assert.equal(malformed.json.error, 'Invalid JSON body');
  assert.equal(malformed.json.code, 'INVALID_JSON');

  const malformedUrl = await request(fixture.handler, 'GET', '/posts?search=%E0%A4%A');
  assert.equal(malformedUrl.statusCode, 400);
  assert.equal(malformedUrl.json.code, 'INVALID_URL');

  const token = await login(fixture.handler);
  const verify = await request(fixture.handler, 'GET', '/auth/verify', { headers: authHeaders(token) });
  assert.equal(verify.statusCode, 200);

  const unauthorized = await request(fixture.handler, 'GET', '/posts');
  assert.equal(unauthorized.statusCode, 401);
});

test('API validation rejects invalid body and query shapes with stable codes', async t => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const token = await login(fixture.handler);
  const headers = authHeaders(token);
  const invalidPost = await request(fixture.handler, 'POST', '/posts', { headers, body: JSON.stringify({ title: 42 }) });
  assert.equal(invalidPost.statusCode, 400);
  assert.equal(invalidPost.json.code, 'VALIDATION_ERROR');
  const invalidPage = await request(fixture.handler, 'GET', '/posts?page=zero', { headers });
  assert.equal(invalidPage.statusCode, 400);
  assert.equal(invalidPage.json.code, 'VALIDATION_ERROR');
  const invalidConfig = await request(fixture.handler, 'GET', '/config?type=unknown', { headers });
  assert.equal(invalidConfig.statusCode, 400);
  assert.equal(invalidConfig.json.code, 'VALIDATION_ERROR');
});

test('one-time default account is restricted until the password is changed', async t => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  fixture.config.password = 'admin';
  fixture.config.requires_password_change = true;

  const loggedIn = await request(fixture.handler, 'POST', '/auth/login', {
    body: JSON.stringify({ username: 'admin', password: 'admin' }),
    headers: { 'content-type': 'application/json' }
  });
  assert.equal(loggedIn.statusCode, 200);
  assert.equal(loggedIn.json.data.mustChangePassword, true);
  const restrictedToken = loggedIn.json.data.token;
  const restricted = await request(fixture.handler, 'GET', '/stats', { headers: authHeaders(restrictedToken) });
  assert.equal(restricted.statusCode, 403);
  assert.equal(restricted.json.code, 'PASSWORD_CHANGE_REQUIRED');

  const changed = await request(fixture.handler, 'POST', '/auth/change-password', {
    headers: authHeaders(restrictedToken),
    body: JSON.stringify({ currentPassword: 'admin', newPassword: 'A-longer-safe-passphrase-2026' })
  });
  assert.equal(changed.statusCode, 200);
  assert.equal(changed.json.data.mustChangePassword, false);
  const state = fs.readFileSync(path.join(fixture.baseDir, '.hexo-admin', 'state.yml'), 'utf8');
  assert.match(state, /password_hash:/);
  assert.doesNotMatch(state, /A-longer-safe-passphrase-2026/);
  const allowed = await request(fixture.handler, 'GET', '/stats', { headers: authHeaders(changed.json.data.token) });
  assert.equal(allowed.statusCode, 200);
});

test('login endpoint locks repeated failed attempts', async t => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  for (let index = 0; index < 5; index += 1) {
    const failed = await request(fixture.handler, 'POST', '/auth/login', {
      body: JSON.stringify({ username: 'admin', password: 'wrong' }), headers: { 'content-type': 'application/json' }
    });
    assert.equal(failed.statusCode, 401);
  }
  const locked = await request(fixture.handler, 'POST', '/auth/login', {
    body: JSON.stringify({ username: 'admin', password: 'secret' }), headers: { 'content-type': 'application/json' }
  });
  assert.equal(locked.statusCode, 429);
  assert.equal(locked.json.code, 'LOGIN_RATE_LIMITED');
});

test('post API covers create, list, edit, raw source, publish and delete', async t => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const token = await login(fixture.handler);
  const headers = authHeaders(token);

  const created = await request(fixture.handler, 'POST', '/posts', {
    headers,
    body: JSON.stringify({ title: 'API Test', categories: ['one'], tags: ['two'], content: 'initial' })
  });
  assert.equal(created.statusCode, 200);
  assert.match(fs.readFileSync(path.join(fixture.postsDir, 'api-test.md'), 'utf8'), /^---\n/);

  const list = await request(fixture.handler, 'GET', '/posts?per_page=10', { headers });
  assert.equal(list.json.data.total, 1);
  const id = list.json.data.posts[0]._id;
  let revision = list.json.data.posts[0].revision;

  const updated = await request(fixture.handler, 'PUT', '/posts/' + id, {
    headers,
    body: JSON.stringify({
      title: 'API Test', date: '2026-08-25 12:00:00', categories: ['alpha'], tags: ['beta'],
      content: 'visual edit', frontMatter: { permalink: 'custom/path/', nested: { enabled: true } }, revision
    })
  });
  assert.equal(updated.statusCode, 200);
  revision = updated.json.data.revision;

  const raw = ['---', 'title: API Test', 'categories: scalar', 'published: false', '---', 'raw edit'].join('\r\n');
  const rawUpdated = await request(fixture.handler, 'PUT', '/posts/' + id, {
    headers, body: JSON.stringify({ raw, revision })
  });
  assert.equal(rawUpdated.statusCode, 200);
  revision = rawUpdated.json.data.revision;

  const detail = await request(fixture.handler, 'GET', '/posts/' + id, { headers });
  assert.deepEqual(detail.json.data.categories, ['scalar']);
  assert.equal(detail.json.data.raw, raw);

  const published = await request(fixture.handler, 'PUT', '/posts/' + id + '/publish', {
    headers, body: JSON.stringify({ published: true, revision })
  });
  assert.equal(published.statusCode, 200);
  revision = published.json.data.revision;
  assert.match(fs.readFileSync(path.join(fixture.postsDir, 'api-test.md'), 'utf8'), /^---\n/);

  const removed = await request(fixture.handler, 'DELETE', '/posts/' + id, { headers: { ...headers, 'if-match': revision } });
  assert.equal(removed.statusCode, 200);
  assert.equal(fs.existsSync(path.join(fixture.postsDir, 'api-test.md')), false);
  const trash = await request(fixture.handler, 'GET', '/trash?kind=post', { headers });
  assert.equal(trash.json.data.total, 1);
  const restored = await request(fixture.handler, 'POST', '/trash/' + removed.json.data.id + '/restore', { headers });
  assert.equal(restored.statusCode, 200);
  assert.equal(fs.existsSync(path.join(fixture.postsDir, 'api-test.md')), true);
});

test('post update rejects stale revisions without changing the file', async t => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const token = await login(fixture.handler);
  const headers = authHeaders(token);
  await request(fixture.handler, 'POST', '/posts', { headers, body: JSON.stringify({ title: 'Concurrent', content: 'first' }) });
  const listed = await request(fixture.handler, 'GET', '/posts', { headers });
  const post = listed.json.data.posts[0];
  const filePath = path.join(fixture.postsDir, 'concurrent.md');
  fs.appendFileSync(filePath, '\nexternal change');
  const before = fs.readFileSync(filePath, 'utf8');
  const stale = await request(fixture.handler, 'PUT', '/posts/' + post._id, {
    headers, body: JSON.stringify({ title: 'Overwritten', content: 'unsafe', revision: post.revision })
  });
  assert.equal(stale.statusCode, 409);
  assert.equal(stale.json.code, 'POST_REVISION_CONFLICT');
  assert.equal(fs.readFileSync(filePath, 'utf8'), before);
});

test('media API uploads, lists and deletes a file safely', async t => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const token = await login(fixture.handler);
  const boundary = '----hexoAdminTestBoundary';
  const multipart = Buffer.concat([
    Buffer.from('--' + boundary + '\r\n' +
    'Content-Disposition: form-data; name="file"; filename="test image.png"\r\n' +
    'Content-Type: image/png\r\n\r\n'),
    Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex'),
    Buffer.from('\r\n--' + boundary + '--\r\n')
  ]);

  const uploaded = await request(fixture.handler, 'POST', '/media/upload', {
    body: multipart,
    headers: { authorization: 'Bearer ' + token, 'content-type': 'multipart/form-data; boundary=' + boundary }
  });
  assert.equal(uploaded.statusCode, 200);
  assert.equal(uploaded.json.data.name, 'test_image.png');

  const listed = await request(fixture.handler, 'GET', '/media', { headers: authHeaders(token) });
  assert.equal(listed.json.data.total, 1);

  const renamed = await request(fixture.handler, 'PUT', '/media/test_image.png/rename', { headers: authHeaders(token), body: JSON.stringify({ name: 'renamed-cover.png' }) });
  assert.equal(renamed.statusCode, 200);
  assert.equal(renamed.json.data.name, 'renamed-cover.png');
  assert.equal(fs.existsSync(path.join(fixture.sourceDir, 'images', 'renamed-cover.png')), true);

  const removed = await request(fixture.handler, 'DELETE', '/media/renamed-cover.png', { headers: authHeaders(token) });
  assert.equal(removed.statusCode, 200);
  const restored = await request(fixture.handler, 'POST', '/trash/' + removed.json.data.id + '/restore', { headers: authHeaders(token) });
  assert.equal(restored.statusCode, 200);

  const unsafeBoundary = '----unsafeUploadBoundary';
  const unsafe = Buffer.from('--' + unsafeBoundary + '\r\nContent-Disposition: form-data; name="file"; filename="script.png"\r\nContent-Type: image/png\r\n\r\n<script>alert(1)</script>\r\n--' + unsafeBoundary + '--\r\n');
  const rejected = await request(fixture.handler, 'POST', '/media/upload', {
    body: unsafe, headers: { authorization: 'Bearer ' + token, 'content-type': 'multipart/form-data; boundary=' + unsafeBoundary }
  });
  assert.equal(rejected.statusCode, 400);
  assert.equal(rejected.json.code, 'UPLOAD_CONTENT_MISMATCH');
});

test('about API reads and safely updates the dedicated page', async t => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const aboutDir = path.join(fixture.sourceDir, 'about');
  const aboutPath = path.join(aboutDir, 'index.md');
  fs.mkdirSync(aboutDir, { recursive: true });
  fs.writeFileSync(aboutPath, '---\ntitle: About\ntemplate: about\n---\n\n旧内容\n', 'utf8');
  const token = await login(fixture.handler);

  const loaded = await request(fixture.handler, 'GET', '/about', { headers: authHeaders(token) });
  assert.equal(loaded.statusCode, 200);
  assert.equal(loaded.json.data.template, 'about');
  assert.match(loaded.json.data.content, /旧内容/);

  const updated = await request(fixture.handler, 'PUT', '/about', {
    headers: authHeaders(token),
    body: JSON.stringify({ title: '关于我', template: 'about', content: '## 新内容', frontMatter: { comments: true }, revision: loaded.json.data.revision })
  });
  assert.equal(updated.statusCode, 200);
  const saved = fs.readFileSync(aboutPath, 'utf8');
  assert.match(saved, /title: 关于我/);
  assert.match(saved, /## 新内容/);

  const stale = await request(fixture.handler, 'PUT', '/about', {
    headers: authHeaders(token),
    body: JSON.stringify({ title: '覆盖', content: 'stale', revision: loaded.json.data.revision })
  });
  assert.equal(stale.statusCode, 409);
  assert.equal(stale.json.code, 'ABOUT_REVISION_CONFLICT');
});

test('essays API preserves legacy data on read and backs up conflict-safe mutations', async t => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const dataDir = path.join(fixture.sourceDir, '_data');
  const essaysPath = path.join(dataDir, 'essays.yml');
  fs.mkdirSync(dataDir, { recursive: true });
  const legacyRaw = '- content: 第一条\n  date: 2026-08-20 09:30:00\n\n- content: |\n    **Markdown** 内容\n  date: 2026-08-21 10:40:00\n';
  fs.writeFileSync(essaysPath, legacyRaw, 'utf8');
  const token = await login(fixture.handler);
  const headers = authHeaders(token);

  const listed = await request(fixture.handler, 'GET', '/essays', { headers });
  assert.equal(listed.statusCode, 200);
  assert.equal(listed.json.data.total, 2);
  assert.equal(fs.readFileSync(essaysPath, 'utf8'), legacyRaw);
  const initialRevision = listed.json.data.revision;

  const created = await request(fixture.handler, 'POST', '/essays', {
    headers, body: JSON.stringify({ content: '新说说', date: '2026-08-26 12:00:00', revision: initialRevision })
  });
  assert.equal(created.statusCode, 200);
  assert.match(created.json.data.item.id, /^[a-f0-9]{32}$/);
  assert.ok(created.json.data.backupId);
  const afterCreate = fs.readFileSync(essaysPath, 'utf8');
  assert.equal(yaml.load(afterCreate, { schema: yaml.JSON_SCHEMA }).length, 3);

  const stale = await request(fixture.handler, 'PUT', '/essays/' + created.json.data.item.id, {
    headers, body: JSON.stringify({ content: '不应覆盖', date: '2026-08-26 12:30:00', revision: initialRevision })
  });
  assert.equal(stale.statusCode, 409);
  assert.equal(stale.json.code, 'ESSAYS_REVISION_CONFLICT');
  assert.equal(fs.readFileSync(essaysPath, 'utf8'), afterCreate);

  const updated = await request(fixture.handler, 'PUT', '/essays/' + created.json.data.item.id, {
    headers, body: JSON.stringify({ content: '更新后的内容', date: '2026-08-26 12:30:00', revision: created.json.data.revision })
  });
  assert.equal(updated.statusCode, 200);
  const removed = await request(fixture.handler, 'DELETE', '/essays/' + updated.json.data.item.id, {
    headers: authHeaders(token, { 'if-match': updated.json.data.revision })
  });
  assert.equal(removed.statusCode, 200);
  assert.equal(yaml.load(fs.readFileSync(essaysPath, 'utf8'), { schema: yaml.JSON_SCHEMA }).length, 2);
  assert.ok(fs.readdirSync(path.join(fixture.baseDir, '.hexo-admin', 'backups', 'essays')).length >= 3);
});

test('rebuild and restart command completes builds before scheduling a safe handoff', async t => {
  const restarts = [];
  const fixture = createFixture({
    scheduleRestart(context, port) { restarts.push({ baseDir: context.hexo.base_dir, port }); return { scheduled: true, port }; }
  });
  t.after(fixture.cleanup);
  const token = await login(fixture.handler);
  const response = await request(fixture.handler, 'POST', '/commands/rebuild-restart', { headers: authHeaders(token) });
  assert.equal(response.statusCode, 202);
  assert.deepEqual(fixture.calls, ['clean', 'generate']);
  assert.equal(restarts.length, 1);
  assert.equal(restarts[0].port, 4000);
  assert.equal(response.json.data.scheduled, true);
});

test('config API synchronizes structured data and YAML source', async t => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const token = await login(fixture.handler);
  const headers = authHeaders(token);

  const built = await request(fixture.handler, 'POST', '/config/source/build', {
    headers, body: JSON.stringify({ data: {
      title: 'Changed', nested: { enabled: true, count: 3, unset: null },
      links: [{ name: 'GitHub', url: 'https://github.com' }], empty: []
    } })
  });
  assert.equal(built.statusCode, 200);
  assert.match(built.json.data.raw, /title: Changed/);

  const parsed = await request(fixture.handler, 'POST', '/config/source/parse', {
    headers, body: JSON.stringify({ raw: built.json.data.raw })
  });
  assert.deepEqual(parsed.json.data.parsed, {
    title: 'Changed', nested: { enabled: true, count: 3, unset: null },
    links: [{ name: 'GitHub', url: 'https://github.com' }], empty: []
  });

  const saved = await request(fixture.handler, 'PUT', '/config', {
    headers, body: JSON.stringify({ type: 'site', data: { subtitle: 'Merged' } })
  });
  assert.equal(saved.statusCode, 200);
  assert.ok(saved.json.data.backupId);

  const backups = await request(fixture.handler, 'GET', '/config/backups?type=site', { headers });
  assert.equal(backups.json.data.total, 1);

  const loaded = await request(fixture.handler, 'GET', '/config?type=site', { headers });
  assert.equal(loaded.json.data.parsed.title, 'Test site');
  assert.equal(loaded.json.data.parsed.subtitle, 'Merged');

  const themeDefaultPath = path.join(fixture.baseDir, 'themes', 'redefine', '_config.yml');
  const themeDefaultBefore = fs.readFileSync(themeDefaultPath, 'utf8');
  const themeLoaded = await request(fixture.handler, 'GET', '/config?type=theme', { headers });
  assert.equal(themeLoaded.json.data.theme, 'redefine');
  assert.equal(themeLoaded.json.data.source, 'theme-directory');
  assert.equal(themeLoaded.json.data.path, themeDefaultPath);
  assert.equal(themeLoaded.json.data.writePath, path.join(fixture.baseDir, '_config.redefine.yml'));

  const themeSaved = await request(fixture.handler, 'PUT', '/config', {
    headers,
    body: JSON.stringify({ type: 'theme', data: { info: { title: 'Customized theme' } } })
  });
  assert.equal(themeSaved.statusCode, 200);
  assert.equal(fs.readFileSync(themeDefaultPath, 'utf8'), themeDefaultBefore);
  const themeOverride = yaml.load(fs.readFileSync(path.join(fixture.baseDir, '_config.redefine.yml'), 'utf8'));
  assert.equal(themeOverride.info.title, 'Customized theme');

  const themeReloaded = await request(fixture.handler, 'GET', '/config?type=theme', { headers });
  assert.equal(themeReloaded.json.data.source, 'site-override');

  const restored = await request(fixture.handler, 'POST', '/config/backups/' + saved.json.data.backupId + '/restore', { headers });
  assert.equal(restored.statusCode, 200);
  const siteAfterRestore = await request(fixture.handler, 'GET', '/config?type=site', { headers });
  assert.equal(siteAfterRestore.json.data.parsed.subtitle, undefined);
});

test('npm theme config is read from the package but saved as a site override', async t => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  fs.rmSync(path.join(fixture.baseDir, 'themes', 'redefine'), { recursive: true, force: true });
  const packageThemeDir = path.join(fixture.baseDir, 'node_modules', 'hexo-theme-redefine');
  fs.mkdirSync(packageThemeDir, { recursive: true });
  const packageConfigPath = path.join(packageThemeDir, '_config.yml');
  fs.writeFileSync(packageConfigPath, 'info:\n  title: Package default\n', 'utf8');
  const token = await login(fixture.handler);
  const headers = authHeaders(token);

  const loaded = await request(fixture.handler, 'GET', '/config?type=theme', { headers });
  assert.equal(loaded.json.data.source, 'npm-package');
  assert.equal(loaded.json.data.parsed.info.title, 'Package default');

  const saved = await request(fixture.handler, 'PUT', '/config', {
    headers,
    body: JSON.stringify({ type: 'theme', raw: 'info:\n  title: Site override\n' })
  });
  assert.equal(saved.statusCode, 200);
  assert.equal(fs.readFileSync(packageConfigPath, 'utf8'), 'info:\n  title: Package default\n');
  assert.equal(
    yaml.load(fs.readFileSync(path.join(fixture.baseDir, '_config.redefine.yml'), 'utf8')).info.title,
    'Site override'
  );
});

test('render, taxonomy, theme and command endpoints respond successfully', async t => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  fs.writeFileSync(path.join(fixture.postsDir, 'seed.md'), '---\ntitle: Seed\ncategories: cat\ntags: tag\n---\nbody', 'utf8');
  await fixture.processSource();
  const token = await login(fixture.handler);
  const headers = authHeaders(token);

  const rendered = await request(fixture.handler, 'POST', '/render', {
    headers, body: JSON.stringify({ content: 'hello' })
  });
  assert.equal(rendered.json.data.html, '<p>hello</p>');

  const categories = await request(fixture.handler, 'GET', '/categories', { headers });
  const tags = await request(fixture.handler, 'GET', '/tags', { headers });
  assert.equal(categories.json.data[0].name, 'cat');
  assert.equal(tags.json.data[0].name, 'tag');

  const themes = await request(fixture.handler, 'GET', '/themes', { headers });
  assert.equal(themes.json.data.active, 'redefine');
  assert.ok(themes.json.data.themes.some(theme => theme.name === 'redefine'));

  for (const command of ['generate', 'deploy', 'clean']) {
    const response = await request(fixture.handler, 'POST', '/commands/' + command, { headers });
    assert.equal(response.statusCode, 200);
  }
  assert.deepEqual(fixture.calls, ['generate', 'deploy', 'clean']);
});
