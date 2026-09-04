'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { Readable } = require('node:stream');
const test = require('node:test');
const frontMatter = require('hexo-front-matter');
const yaml = require('js-yaml');
const sharp = require('sharp');
const createApiHandler = require('../lib/api');
const { gracefulExit } = require('../lib/modules/commands/restart');
const { portAvailable, waitForServer } = require('../lib/modules/commands/restart-helper');

function relation(values) {
  return { toArray: () => values.map(name => ({ name })) };
}

function createFixture(runtime) {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexo-admin-panel-'));
  const sourceDir = path.join(baseDir, 'source');
  const postsDir = path.join(sourceDir, '_posts');
  const draftsDir = path.join(sourceDir, '_drafts');
  const themeDir = path.join(baseDir, 'themes', 'redefine');
  fs.mkdirSync(postsDir, { recursive: true });
  fs.mkdirSync(draftsDir, { recursive: true });
  fs.mkdirSync(themeDir, { recursive: true });
  const configPath = path.join(baseDir, '_config.yml');
  fs.writeFileSync(configPath, 'title: Test site\ntheme: redefine\n', 'utf8');
  fs.writeFileSync(path.join(themeDir, '_config.yml'), 'info:\n  title: Theme\n', 'utf8');

  let posts = [];
  const calls = [];
  const sourceProcesses = [];

  function processSource() {
    sourceProcesses.push(Date.now());
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
    public_dir: path.join(baseDir, 'public') + path.sep,
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
    log: { warn() {}, error() {} },
    call: async (name, args) => { calls.push(name);if(runtime&&runtime.hexoCall)await runtime.hexoCall({name,args,hexo,baseDir,sourceDir}); }
  };

  const config = { username: 'admin', password: 'secret', jwt_secret: 'test-secret', token_expiry: '2h' };
  const handler = createApiHandler(hexo, config, runtime);
  const cleanup = () => fs.rmSync(baseDir, { recursive: true, force: true });
  return { baseDir, calls, cleanup, config, configPath, draftsDir, handler, hexo, postsDir, processSource, sourceDir, sourceProcesses };
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
        try { json = text ? JSON.parse(text) : undefined; } catch (_) { json = undefined; }
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

async function waitForCommandJob(handler, token, id) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await request(handler, 'GET', '/commands/jobs/' + id, { headers: authHeaders(token) });
    if (['completed', 'failed', 'cancelled'].includes(response.json.data.status)) return response.json.data;
    await new Promise(resolve => setImmediate(resolve));
  }
  throw new Error('Command job did not finish');
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
  assert.equal(malformed.headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(malformed.headers['X-Frame-Options'], 'DENY');
  assert.equal(malformed.json.error, 'Invalid JSON body');
  assert.equal(malformed.json.code, 'INVALID_JSON');

  const malformedUrl = await request(fixture.handler, 'GET', '/posts?search=%E0%A4%A');
  assert.equal(malformedUrl.statusCode, 400);
  assert.equal(malformedUrl.json.code, 'INVALID_URL');

  const token = await login(fixture.handler);
  const verify = await request(fixture.handler, 'GET', '/auth/verify', { headers: authHeaders(token) });
  assert.equal(verify.statusCode, 200);
  assert.match(verify.json.data.instanceId, /^[0-9a-f-]{36}$/);

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
  const draftPath = path.join(fixture.draftsDir, 'api-test.md');
  assert.match(fs.readFileSync(draftPath, 'utf8'), /^---\n/);
  assert.equal(fs.existsSync(path.join(fixture.postsDir, 'api-test.md')), false);

  const list = await request(fixture.handler, 'GET', '/posts?per_page=10', { headers });
  assert.equal(list.json.data.total, 1);
  let id = list.json.data.posts[0]._id;
  assert.equal(list.json.data.posts[0].draft, true);
  let revision = list.json.data.posts[0].revision;
  const draftStats = await request(fixture.handler, 'GET', '/stats', { headers });
  assert.equal(draftStats.json.data.drafts, 1);
  assert.equal(draftStats.json.data.posts, 0);

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
  id = published.json.data._id;
  revision = published.json.data.revision;
  assert.match(fs.readFileSync(path.join(fixture.postsDir, 'api-test.md'), 'utf8'), /^---\n/);
  assert.equal(fs.existsSync(draftPath), false);
  const publishedStats = await request(fixture.handler, 'GET', '/stats', { headers });
  assert.equal(publishedStats.json.data.posts, 1);
  assert.equal(publishedStats.json.data.drafts, 0);

  const unpublished = await request(fixture.handler, 'PUT', '/posts/' + id + '/publish', {
    headers, body: JSON.stringify({ published: false, revision })
  });
  assert.equal(unpublished.statusCode, 200);
  assert.equal(fs.existsSync(draftPath), true);
  assert.equal(fs.existsSync(path.join(fixture.postsDir, 'api-test.md')), false);
  id = unpublished.json.data._id;
  revision = unpublished.json.data.revision;

  const republished = await request(fixture.handler, 'PUT', '/posts/' + id + '/publish', {
    headers, body: JSON.stringify({ published: true, revision })
  });
  id = republished.json.data._id;
  revision = republished.json.data.revision;

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
  const filePath = path.join(fixture.draftsDir, 'concurrent.md');
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

  const imagesDir = path.join(fixture.sourceDir, 'images');
  for (let index = 0; index < 30; index += 1) fs.writeFileSync(path.join(imagesDir, 'asset-' + index + '.png'), Buffer.from('89504e470d0a1a0a', 'hex'));
  const searched = await request(fixture.handler, 'GET', '/media?page=1&per_page=5&search=asset-29', { headers: authHeaders(token) });
  assert.equal(searched.json.data.total, 1);
  assert.equal(searched.json.data.files[0].name, 'asset-29.png');
  assert.equal(searched.json.data.total_pages, 1);

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
  assert.match(response.json.data.previousInstanceId, /^[0-9a-f-]{36}$/);
});

test('restart cleanup stops the watcher and lets Hexo flush before exiting', async () => {
  const calls = [];
  const context = { hexo: {
    async unwatch() { calls.push('unwatch'); },
    async exit() { calls.push('hexo-exit'); },
    log: { error() {} }
  } };
  await gracefulExit(context, { exit(code) { calls.push('process-exit:' + code); } });
  assert.deepEqual(calls, ['unwatch', 'hexo-exit', 'process-exit:0']);
});

test('restart helper recognizes the replacement server only after its port is listening', async t => {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => { if (server.listening) server.close(); });
  const port = server.address().port;
  assert.equal(await portAvailable(port, '127.0.0.1'), false);
  await waitForServer({ port, ip: '127.0.0.1' }, { kill() {} }, { error: null, exited: false, code: null, signal: null });
  await new Promise(resolve => server.close(resolve));
  assert.equal(await portAvailable(port, '127.0.0.1'), true);
});

test('config API synchronizes structured data and YAML source', async t => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const token = await login(fixture.handler);
  const headers = authHeaders(token);
  const initialSite = await request(fixture.handler, 'GET', '/config?type=site', { headers });
  let siteRevision = initialSite.json.data.revision;

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
    headers, body: JSON.stringify({ type: 'site', data: { subtitle: 'Merged' }, revision: siteRevision })
  });
  assert.equal(saved.statusCode, 200);
  assert.ok(saved.json.data.backupId);
  siteRevision = saved.json.data.revision;

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
    body: JSON.stringify({ type: 'theme', data: { info: { title: 'Customized theme' } }, revision: themeLoaded.json.data.revision })
  });
  assert.equal(themeSaved.statusCode, 200);
  assert.equal(fs.readFileSync(themeDefaultPath, 'utf8'), themeDefaultBefore);
  const themeOverride = yaml.load(fs.readFileSync(path.join(fixture.baseDir, '_config.redefine.yml'), 'utf8'));
  assert.equal(themeOverride.info.title, 'Customized theme');

  const themeReloaded = await request(fixture.handler, 'GET', '/config?type=theme', { headers });
  assert.equal(themeReloaded.json.data.source, 'site-override');

  const restored = await request(fixture.handler, 'POST', '/config/backups/' + saved.json.data.backupId + '/restore', { headers, body: JSON.stringify({ revision: siteRevision }) });
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
    body: JSON.stringify({ type: 'theme', raw: 'info:\n  title: Site override\n', revision: loaded.json.data.revision })
  });
  assert.equal(saved.statusCode, 200);
  assert.equal(fs.readFileSync(packageConfigPath, 'utf8'), 'info:\n  title: Package default\n');
  assert.equal(
    yaml.load(fs.readFileSync(path.join(fixture.baseDir, '_config.redefine.yml'), 'utf8')).info.title,
    'Site override'
  );
});

test('config API rejects stale revisions without overwriting external edits', async t => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const token = await login(fixture.handler);
  const headers = authHeaders(token);
  const loaded = await request(fixture.handler, 'GET', '/config?type=site', { headers });
  fs.appendFileSync(fixture.configPath, 'external: true\n', 'utf8');
  const before = fs.readFileSync(fixture.configPath, 'utf8');
  const stale = await request(fixture.handler, 'PUT', '/config', {
    headers,
    body: JSON.stringify({ type: 'site', data: { title: 'Unsafe overwrite' }, revision: loaded.json.data.revision })
  });
  assert.equal(stale.statusCode, 409);
  assert.equal(stale.json.code, 'CONFIG_REVISION_CONFLICT');
  assert.equal(fs.readFileSync(fixture.configPath, 'utf8'), before);
});

test('full-text search covers Markdown and Front Matter and bulk operations preflight revisions', async t => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const token = await login(fixture.handler);
  const headers = authHeaders(token);
  await request(fixture.handler, 'POST', '/posts', { headers, body: JSON.stringify({ title: 'Search One', content: 'The hidden telescope keyword', tags: ['science'], frontMatter: { description: 'deep space' } }) });
  await request(fixture.handler, 'POST', '/posts', { headers, body: JSON.stringify({ title: 'Search Two', content: 'ordinary content', categories: ['notes'] }) });

  const contentSearch = await request(fixture.handler, 'GET', '/posts?search=telescope%20science', { headers });
  assert.equal(contentSearch.json.data.total, 1);
  assert.equal(contentSearch.json.data.posts[0].title, 'Search One');
  const frontMatterSearch = await request(fixture.handler, 'GET', '/posts?search=deep%20space', { headers });
  assert.equal(frontMatterSearch.json.data.total, 1);

  const listed = await request(fixture.handler, 'GET', '/posts?per_page=10', { headers });
  const staleTarget = listed.json.data.posts.find(post => post.title === 'Search Two');
  fs.appendFileSync(path.join(fixture.draftsDir, 'search-two.md'), '\nexternal edit', 'utf8');
  const staleBulk = await request(fixture.handler, 'POST', '/posts/bulk', {
    headers,
    body: JSON.stringify({ action: 'delete', items: listed.json.data.posts.map(post => ({ id: post._id, revision: post.revision })) })
  });
  assert.equal(staleBulk.statusCode, 409);
  assert.equal(fs.existsSync(path.join(fixture.draftsDir, 'search-one.md')), true);
  assert.equal(fs.existsSync(path.join(fixture.draftsDir, 'search-two.md')), true);

  const refreshed = await request(fixture.handler, 'GET', '/posts?per_page=10', { headers });
  assert.notEqual(refreshed.json.data.posts.find(post => post._id === staleTarget._id).revision, staleTarget.revision);
  const refreshCount = fixture.sourceProcesses.length;
  const published = await request(fixture.handler, 'POST', '/posts/bulk', {
    headers,
    body: JSON.stringify({ action: 'publish', items: refreshed.json.data.posts.map(post => ({ id: post._id, revision: post.revision })) })
  });
  assert.equal(published.statusCode, 200);
  assert.equal(published.json.data.processed, 2);
  assert.equal(fixture.sourceProcesses.length, refreshCount + 1);
  assert.equal(fs.existsSync(path.join(fixture.postsDir, 'search-one.md')), true);
  assert.equal(fs.existsSync(path.join(fixture.postsDir, 'search-two.md')), true);
});

test('media analysis reports references and compression keeps a recoverable backup', async t => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const token = await login(fixture.handler);
  const headers = authHeaders(token);
  const imagesDir = path.join(fixture.sourceDir, 'images');
  const oversized = await sharp({ create: { width: 320, height: 240, channels: 3, background: '#557267' } }).png({ compressionLevel: 0 }).toBuffer();
  fs.writeFileSync(path.join(imagesDir, 'used.png'), oversized);
  fs.writeFileSync(path.join(imagesDir, 'unused.png'), oversized);
  fs.mkdirSync(path.join(imagesDir, 'albums'), { recursive: true });
  fs.writeFileSync(path.join(imagesDir, 'albums', 'nested.png'), oversized);
  fs.writeFileSync(path.join(fixture.postsDir, 'media-ref.md'), '---\ntitle: Media ref\n---\n![cover](/images/used.png)\n![nested](/images/albums/nested.png)\n', 'utf8');
  await fixture.processSource();

  const analysis = await request(fixture.handler, 'GET', '/media/analysis', { headers });
  assert.equal(analysis.json.data.used, 2);
  assert.equal(analysis.json.data.unused, 1);
  assert.equal(analysis.json.data.items.find(item => item.name === 'used.png').references[0].source, '_posts/media-ref.md');
  assert.equal(analysis.json.data.items.find(item => item.name === 'albums/nested.png').referenceCount, 1);
  const unused = await request(fixture.handler, 'GET', '/media?usage=unused', { headers });
  assert.deepEqual(unused.json.data.files.map(file => file.name), ['unused.png']);

  const compressed = await request(fixture.handler, 'POST', '/media/used.png/compress', { headers, body: JSON.stringify({ quality: 82 }) });
  assert.equal(compressed.statusCode, 200);
  assert.equal(compressed.json.data.optimized, true);
  assert.ok(compressed.json.data.size < compressed.json.data.originalSize);
  assert.equal(fs.existsSync(path.join(fixture.baseDir, '.hexo-admin', 'backups', 'media', compressed.json.data.backupId)), true);

  const nested = await request(fixture.handler, 'GET', '/media?search=albums', { headers });
  assert.deepEqual(nested.json.data.files.map(file => file.name), ['albums/nested.png']);
  const renamed = await request(fixture.handler, 'PUT', '/media/' + encodeURIComponent('albums/nested.png') + '/rename', {
    headers, body: JSON.stringify({ name: 'renamed.png' })
  });
  assert.equal(renamed.json.data.name, 'albums/renamed.png');
  assert.equal(fs.existsSync(path.join(imagesDir, 'albums', 'renamed.png')), true);
});

test('scheduled publishing persists tasks and publishes due drafts', async t => {
  let intervalCallback;
  let clock = new Date('2026-08-28T08:00:00.000Z');
  const fixture = createFixture({
    now: () => clock,
    setInterval(callback) { intervalCallback = callback; return { unref() {} }; }
  });
  t.after(fixture.cleanup);
  const token = await login(fixture.handler);
  const headers = authHeaders(token);
  const created = await request(fixture.handler, 'POST', '/posts', { headers, body: JSON.stringify({ title: 'Scheduled Story', content: 'later' }) });
  const draft = await request(fixture.handler, 'GET', '/posts/' + created.json.data._id, { headers });
  const scheduled = await request(fixture.handler, 'POST', '/posts/' + created.json.data._id + '/schedule', {
    headers, body: JSON.stringify({ publishAt: '2026-08-28T09:00:00.000Z', revision: draft.json.data.revision })
  });
  assert.equal(scheduled.statusCode, 200);
  assert.equal(fs.existsSync(path.join(fixture.baseDir, '.hexo-admin', 'scheduled-posts.json')), true);
  const before = await request(fixture.handler, 'GET', '/schedules', { headers });
  assert.equal(before.json.data.total, 1);

  clock = new Date('2026-08-28T09:01:00.000Z');
  await intervalCallback();
  assert.equal(fs.existsSync(path.join(fixture.postsDir, 'scheduled-story.md')), true);
  assert.equal(fs.existsSync(path.join(fixture.draftsDir, 'scheduled-story.md')), false);
  const after = await request(fixture.handler, 'GET', '/schedules', { headers });
  assert.equal(after.json.data.total, 1);
  assert.equal(after.json.data.items[0].status, 'completed');
  assert.ok(after.json.data.items[0].history.some(entry => entry.status === 'completed'));
});

test('scheduled publishing retries failures and keeps attempt history', async t => {
  let intervalCallback;
  let clock = new Date('2026-09-01T08:00:00.000Z');
  const fixture = createFixture({now:()=>clock,setInterval(callback){intervalCallback=callback;return{unref(){}};}});
  t.after(fixture.cleanup);
  const token = await login(fixture.handler);
  const headers = authHeaders(token);
  const created = await request(fixture.handler,'POST','/posts',{headers,body:JSON.stringify({title:'Retry Story',content:'retry me'})});
  const draftPath = path.join(fixture.draftsDir,'retry-story.md');
  const raw = fs.readFileSync(draftPath,'utf8');
  const scheduled = await request(fixture.handler,'POST','/posts/'+created.json.data._id+'/schedule',{headers,body:JSON.stringify({publishAt:'2026-09-01T09:00:00.000Z',revision:created.json.data.revision,maxAttempts:2,retryDelayMinutes:1})});
  fs.unlinkSync(draftPath);
  clock = new Date('2026-09-01T09:01:00.000Z');
  await intervalCallback();
  let history = await request(fixture.handler,'GET','/schedules',{headers});
  assert.equal(history.json.data.items[0].status,'retrying');
  assert.equal(history.json.data.items[0].attempts,1);
  fs.writeFileSync(draftPath,raw,'utf8');
  clock = new Date('2026-09-01T09:03:00.000Z');
  await intervalCallback();
  history = await request(fixture.handler,'GET','/schedules',{headers});
  assert.equal(history.json.data.items[0].status,'completed');
  assert.equal(history.json.data.items[0].attempts,2);
  assert.ok(history.json.data.items[0].history.some(entry=>entry.status==='retrying'));
  assert.equal(scheduled.json.data.maxAttempts,2);
});

test('Hexo scaffolds initialize workflow-aware posts', async t => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const scaffoldDir = path.join(fixture.baseDir, 'scaffolds');
  fs.mkdirSync(scaffoldDir, { recursive: true });
  fs.writeFileSync(path.join(scaffoldDir, 'guide.md'), '---\nlayout: post\ntags:\n  - guide\n---\nWelcome {{ title }}\n', 'utf8');
  const token = await login(fixture.handler);
  const headers = authHeaders(token);

  const templates = await request(fixture.handler, 'GET', '/scaffolds', { headers });
  assert.equal(templates.json.data.items[0].name, 'guide');
  const created = await request(fixture.handler, 'POST', '/posts', {
    headers, body: JSON.stringify({ title: 'Workflow Story', scaffold: 'guide', workflowStatus: 'review' })
  });
  assert.equal(created.statusCode, 200);
  const raw = fs.readFileSync(path.join(fixture.draftsDir, 'workflow-story.md'), 'utf8');
  assert.match(raw, /workflow_status: review/);
  assert.match(raw, /Welcome Workflow Story/);
  const review = await request(fixture.handler, 'GET', '/posts?status=review', { headers });
  assert.equal(review.json.data.total, 1);
  assert.equal(review.json.data.posts[0].workflowStatus, 'review');
});

test('generic pages cover nested and standalone files plus theme menu ordering', async t => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const scaffoldDir = path.join(fixture.baseDir, 'scaffolds');
  fs.mkdirSync(scaffoldDir, { recursive: true });
  fs.writeFileSync(path.join(scaffoldDir, 'page.md'), '---\nlayout: page\n---\nPage body for {{ title }}\n', 'utf8');
  fs.writeFileSync(path.join(fixture.baseDir, '_config.redefine.yml'), 'navbar:\n  links:\n    Home:\n      path: /\n    About:\n      path: /about\n', 'utf8');
  const token = await login(fixture.handler);
  const headers = authHeaders(token);

  const created = await request(fixture.handler, 'POST', '/pages', {
    headers, body: JSON.stringify({ title: 'Projects', path: 'projects/index.md', scaffold: 'page', layout: 'page' })
  });
  assert.equal(created.statusCode, 200);
  assert.match(fs.readFileSync(path.join(fixture.sourceDir, 'projects', 'index.md'), 'utf8'), /Page body for Projects/);
  fs.writeFileSync(path.join(fixture.sourceDir, 'links.md'), '---\ntitle: Links\nlayout: page\n---\nlinks\n', 'utf8');
  const listed = await request(fixture.handler, 'GET', '/pages', { headers });
  assert.equal(listed.json.data.total, 2);
  assert.ok(listed.json.data.items.some(item => item.path === 'links.md'));

  const menu = listed.json.data.menu;
  const reordered = await request(fixture.handler, 'PUT', '/pages/menu', {
    headers, body: JSON.stringify({ items: menu.items.slice().reverse(), revision: menu.revision })
  });
  assert.equal(reordered.statusCode, 200);
  const savedMenu = yaml.load(fs.readFileSync(path.join(fixture.baseDir, '_config.redefine.yml'), 'utf8')).navbar.links;
  assert.deepEqual(Object.keys(savedMenu), ['About', 'Home']);

  const detail = await request(fixture.handler, 'GET', '/pages/' + created.json.data.id, { headers });
  const updated = await request(fixture.handler, 'PUT', '/pages/' + created.json.data.id, {
    headers, body: JSON.stringify({ title: 'Project index', layout: 'page', content: 'updated', frontMatter: {}, revision: detail.json.data.revision })
  });
  assert.equal(updated.statusCode, 200);
  const removed = await request(fixture.handler, 'DELETE', '/pages/' + created.json.data.id, { headers: { ...headers, 'if-match': updated.json.data.revision } });
  assert.equal(removed.statusCode, 200);
  const trash = await request(fixture.handler, 'GET', '/trash?kind=page', { headers });
  assert.equal(trash.json.data.total, 1);
});

test('taxonomy center reports usage and applies merge, rename and delete with backups', async t => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  fs.writeFileSync(path.join(fixture.postsDir, 'one.md'), '---\ntitle: One\ncategories: Old\ntags: [legacy, node]\n---\none', 'utf8');
  fs.writeFileSync(path.join(fixture.draftsDir, 'two.md'), '---\ntitle: Two\ncategories: Old\ntags: [legacy]\n---\ntwo', 'utf8');
  await fixture.processSource();
  const token = await login(fixture.handler);
  const headers = authHeaders(token);
  const initial = await request(fixture.handler, 'GET', '/taxonomies', { headers });
  assert.equal(initial.json.data.categories.find(item => item.name === 'Old').count, 2);
  assert.equal(initial.json.data.tags.find(item => item.name === 'legacy').drafts, 1);

  const merged = await request(fixture.handler, 'POST', '/taxonomies/tags/merge', {
    headers, body: JSON.stringify({ sources: ['legacy', 'node'], target: 'javascript' })
  });
  assert.equal(merged.json.data.affectedPosts, 2);
  assert.equal(fs.existsSync(path.join(fixture.baseDir, '.hexo-admin', 'backups', 'taxonomies', merged.json.data.backupId)), true);
  const renamed = await request(fixture.handler, 'PUT', '/taxonomies/categories/Old', { headers, body: JSON.stringify({ name: 'Guides' }) });
  assert.equal(renamed.statusCode, 200);
  const removed = await request(fixture.handler, 'DELETE', '/taxonomies/tags/javascript', { headers });
  assert.equal(removed.json.data.affectedPosts, 2);
  assert.doesNotMatch(fs.readFileSync(path.join(fixture.postsDir, 'one.md'), 'utf8'), /javascript|legacy|node/);
});

test('command jobs expose progress, cooperative cancellation and retry history', async t => {
  let releaseGenerate;
  let deployAttempts = 0;
  const fixture = createFixture({
    setInterval() { return { unref() {} }; },
    async hexoCall({ name }) {
      if (name === 'generate') await new Promise(resolve => { releaseGenerate = resolve; });
      if (name === 'deploy' && deployAttempts++ === 0) throw new Error('remote unavailable');
    }
  });
  t.after(fixture.cleanup);
  const token = await login(fixture.handler);
  const headers = authHeaders(token);
  const started = await request(fixture.handler, 'POST', '/commands/generate', { headers });
  await new Promise(resolve => setImmediate(resolve));
  const cancelled = await request(fixture.handler, 'POST', '/commands/jobs/' + started.json.data.job.id + '/cancel', { headers });
  assert.equal(cancelled.statusCode, 202);
  releaseGenerate();
  const finalCancelled = await waitForCommandJob(fixture.handler, token, started.json.data.job.id);
  assert.equal(finalCancelled.status, 'cancelled');

  const failedStart = await request(fixture.handler, 'POST', '/commands/deploy', { headers });
  const failed = await waitForCommandJob(fixture.handler, token, failedStart.json.data.job.id);
  assert.equal(failed.status, 'failed');
  const retried = await request(fixture.handler, 'POST', '/commands/jobs/' + failed.id + '/retry', { headers });
  assert.equal(retried.statusCode, 202);
  const completed = await waitForCommandJob(fixture.handler, token, retried.json.data.job.id);
  assert.equal(completed.status, 'completed');
  assert.equal(completed.retryOf, failed.id);
  assert.equal(completed.progress, 100);
});

test('temporary preview serves a real generated iframe document through an expiring token', async t => {
  const fixture = createFixture({
    setInterval() { return { unref() {} }; },
    async hexoCall({ name, hexo }) {
      if (name !== 'generate' || !String(hexo.public_dir).includes('.hexo-admin')) return;
      const output = path.join(hexo.public_dir, 'preview', 'preview-story', 'index.html');
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, '<html><head><title>Preview Story</title></head><body><a href="/archives/">Preview Story</a></body></html>');
    }
  });
  t.after(fixture.cleanup);
  const token = await login(fixture.handler);
  const headers = authHeaders(token);
  const created = await request(fixture.handler, 'POST', '/posts', { headers, body: JSON.stringify({ title: 'Preview Story', content: 'body' }) });
  const started = await request(fixture.handler, 'POST', '/previews', { headers, body: JSON.stringify({ kind: 'post', id: created.json.data._id, revision: created.json.data.revision }) });
  assert.equal(started.statusCode, 202);
  const job = await waitForCommandJob(fixture.handler, token, started.json.data.job.id);
  assert.equal(job.status, 'completed');
  assert.match(job.result.permalink, /preview\/preview-story/);
  const route = new URL(job.result.previewUrl, 'http://local').pathname.replace(/^\/admin\/api/, '');
  const page = await request(fixture.handler, 'GET', route);
  assert.equal(page.statusCode, 200);
  assert.equal(page.headers['X-Frame-Options'], 'SAMEORIGIN');
  assert.match(page.text, /<base href="\/admin\/api\/previews\//);
  assert.match(page.text, /href="\/admin\/api\/previews\/.+\/archives\//);
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

  const about = await request(fixture.handler, 'GET', '/system/about', { headers });
  assert.equal(about.json.data.name, 'hexo-admin-panel');
  assert.equal(about.json.data.license, 'MIT');
  assert.equal(about.json.data.runtime.theme, 'redefine');
  assert.match(about.json.data.links.repository, /github\.com\/Skylarrkuo\/hexo-admin-panel/);
  assert.match(about.json.data.links.npm, /npmjs\.com\/package\/hexo-admin-panel/);
  assert.ok(about.json.data.attributions.some(item => item.name === 'Vue' && item.license === 'MIT'));
  assert.ok(about.json.data.attributions.every(item => item.version && item.copyright && item.licenseUrl && item.url));
  assert.equal(about.json.data.attributions.find(item => item.name === 'DOMPurify').copyright, 'Copyright (c) Cure53 and other contributors');

  for (const command of ['generate', 'deploy', 'clean']) {
    const response = await request(fixture.handler, 'POST', '/commands/' + command, { headers });
    assert.equal(response.statusCode, 202);
    assert.equal(response.json.data.job.command, command);
    const job = await waitForCommandJob(fixture.handler, token, response.json.data.job.id);
    assert.equal(job.status, 'completed');
    assert.ok(job.logs.some(entry => entry.message.includes('hexo ' + command)));
  }
  assert.deepEqual(fixture.calls, ['generate', 'deploy', 'clean']);
  const jobs = await request(fixture.handler, 'GET', '/commands/jobs?limit=2', { headers });
  assert.equal(jobs.json.data.items.length, 2);
});
