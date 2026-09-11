'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { buildPostSource, editablePost, setPublished } = require('../../lib/modules/posts/front-matter');
const { deepMerge, dumpYaml, parseYaml } = require('../../lib/modules/config/yaml-codec');
const { flattenConfig } = require('../../lib/modules/themes/adapters/generic');
const { redefineAdapter } = require('../../lib/modules/themes/adapters/redefine');
const { isPathInside, resolveInside, safeFilename, safeRelativePath } = require('../../lib/shared/paths');
const { compilePattern } = require('../../lib/server/router');
const { contentRevision, requireRevision } = require('../../lib/shared/revision');
const { hashPassword, verifyPassword, validateNewPassword } = require('../../lib/modules/auth/security');
const { detectedType, validateUpload } = require('../../lib/modules/media/file-policy');
const { loadAdminConfig } = require('../../lib/plugin/load-config');
const { createFileRepository } = require('../../lib/repositories/file-repository');
const { validate, validateConfigType, validateIntegerQuery } = require('../../lib/server/validation');
const { referencedPaths } = require('../../lib/modules/media/references');
const { createStaticHandler } = require('../../lib/plugin/static-files');

test('Front Matter codec round trips extra fields and publication state', () => {
  const raw = buildPostSource({ title: 'Test', content: 'Body', categories: ['A'], frontMatter: { nested: { ok: true } } });
  const parsed = editablePost(raw);
  assert.equal(parsed.title, 'Test');
  assert.deepEqual(parsed.frontMatter.nested, { ok: true });
  assert.equal(editablePost(setPublished(raw, false)).frontMatter.published, false);
});

test('YAML codec preserves structured value types and merges nested values', () => {
  const value = deepMerge({ nested: { left: true }, list: [1] }, { nested: { right: 2 }, list: [] });
  assert.deepEqual(value, { nested: { left: true, right: 2 }, list: [] });
  assert.deepEqual(parseYaml(dumpYaml(value)), value);
});

test('path helpers reject traversal and router patterns expose named parameters', () => {
  const mediaRoot = path.join(path.parse(process.cwd()).root, 'workspace', 'media');
  assert.equal(isPathInside(mediaRoot, path.join(mediaRoot, 'image.png')), true);
  assert.equal(isPathInside(mediaRoot, path.resolve(mediaRoot, '..', 'secret.txt')), false);
  assert.throws(() => resolveInside(mediaRoot, path.join('..', 'secret.txt')));
  assert.throws(() => safeFilename('../secret.txt'));
  assert.equal(safeRelativePath('album/封面.png'), 'album/封面.png');
  assert.throws(() => safeRelativePath('../secret.txt'));
  const pattern = compilePattern('/posts/:id');
  assert.deepEqual(pattern.names, ['id']);
  assert.match('/posts/123', pattern.regex);
});

test('media references preserve nested relative paths', () => {
  const references = referencedPaths('![one](/images/a/cover.png) ![two](images/b/cover.png)');
  assert.equal(references.get('a/cover.png'), 1);
  assert.equal(references.get('b/cover.png'), 1);
});

test('admin static files include browser security headers', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hexo-admin-static-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, 'index.html'), '<!doctype html>', 'utf8');
  let status;
  let headers;
  const response = { writeHead(value, values) { status=value;headers=values; }, end() {} };
  createStaticHandler({ directory, root: '/' })({ method: 'GET', url: '/' }, response, () => assert.fail('unexpected next'));
  assert.equal(status, 200);
  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.match(headers['Content-Security-Policy'], /frame-ancestors 'none'/);
});

test('Redefine adapter describes all scalar and collection fields', () => {
  const config = { info: { title: 'Blog' }, comment: { enable: false, config: { tokens: [] } } };
  const generic = flattenConfig(config);
  const raw = '# 基本信息 >>> 开始\ninfo:\n  # 网站标题\n  title: Blog\ncomment:\n  enable: false # 是否启用评论\n  config:\n    tokens: []\ncolors:\n  # 主色调\n  primary: "#8b5961"\n';
  const schema = redefineAdapter.describe({ ...config, colors: { primary: '#8b5961' } }, { packageJson: { version: '2.9.0' }, raw });
  assert.equal(generic.length, 3);
  assert.equal(schema.version, '2.9.0');
  assert.equal(schema.fields.find(field => field.key === 'comment.enable').type, 'boolean');
  assert.equal(schema.fields.find(field => field.key === 'comment.config.tokens').type, 'array');
  assert.equal(schema.fields.find(field => field.key === 'info.title').label, '网站标题');
  assert.equal(schema.fields.find(field => field.key === 'info.title').labelI18n.en, 'Site title');
  assert.equal(schema.sections.find(section => section.key === 'info').labelI18n.en, 'Basic information');
  assert.match(schema.fields.find(field => field.key === 'comment.enable').description, /是否启用评论/);
  assert.match(schema.fields.find(field => field.key === 'comment.enable').descriptionI18n.en, /enable comment/i);
  assert.equal(schema.fields.find(field => field.key === 'colors.primary').color, true);
  const withoutComments = redefineAdapter.describe(config, { packageJson: { version: '2.9.0' }, raw: 'info:\n  title: Blog\n' });
  assert.equal(withoutComments.fields.find(field => field.key === 'info.title').label, '网站标题');
});

test('passwords are hashed and weak replacements are rejected', async () => {
  const passwordHash = await hashPassword('A-long-and-safe-passphrase');
  assert.equal(await verifyPassword('A-long-and-safe-passphrase', { password_hash: passwordHash }), true);
  assert.equal(await verifyPassword('wrong', { password_hash: passwordHash }), false);
  assert.throws(() => validateNewPassword('short', 'admin'), /12/);
});

test('revision checks detect stale content', () => {
  const revision = contentRevision('original');
  assert.equal(requireRevision(revision, 'original'), revision);
  assert.throws(() => requireRevision(revision, 'changed'), error => error.statusCode === 409);
  assert.throws(() => requireRevision('', 'original'), error => error.statusCode === 428);
});

test('upload policy verifies both extension and file signature', () => {
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
  assert.equal(detectedType(png), '.png');
  assert.equal(validateUpload({ filename: 'safe.png', buffer: png }, { allowed_extensions: ['.png'], max_file_size: 1024 }).detected, '.png');
  assert.throws(() => validateUpload({ filename: 'fake.png', buffer: Buffer.from('script') }, { allowed_extensions: ['.png'], max_file_size: 1024 }), /不匹配/);
});

test('plaintext credentials and weak JWT secrets are migrated to private state', async t => {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexo-admin-config-'));
  t.after(() => fs.rmSync(baseDir, { recursive: true, force: true }));
  const warnings = [];
  const config = await loadAdminConfig({
    base_dir: baseDir + path.sep,
    config: { admin: { username: 'owner', password: 'A-long-existing-password', jwt_secret: 'short', token_expiry: '24h' } },
    log: { warn: message => warnings.push(message) }
  });
  assert.ok(config.jwt_secret.length >= 32);
  assert.ok(config.password_hash);
  assert.equal(config.password, undefined);
  assert.equal(await verifyPassword('A-long-existing-password', config), true);
  assert.equal(fs.existsSync(path.join(baseDir, '.hexo-admin', 'state.yml')), true);
  assert.ok(warnings.some(message => message.includes('Plaintext administrator credentials')));
});

test('credentials are scrubbed from the dedicated admin config after migration', async t => {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexo-admin-config-file-'));
  t.after(() => fs.rmSync(baseDir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(baseDir, '_admin-config.yml'), 'admin:\n  username: owner\n  password: A-long-existing-password\n  jwt_secret: a-secret-that-is-definitely-long-enough\n  token_expiry: 24h\n', 'utf8');
  const config = await loadAdminConfig({ base_dir: baseDir + path.sep, config: {}, log: { warn() {} } });
  const saved = parseYaml(fs.readFileSync(path.join(baseDir, '_admin-config.yml'), 'utf8'));
  assert.ok(config.password_hash);
  assert.equal(saved.admin.password, undefined);
  assert.equal(saved.admin.jwt_secret, undefined);
  assert.equal(saved.admin.token_expiry, '24h');
});

test('file repository centralizes safe atomic file operations', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hexo-admin-repository-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const repository = createFileRepository(root);
  const first = path.join(root, 'nested', 'first.txt');
  const second = path.join(root, 'nested', 'second.txt');
  repository.mkdir(path.dirname(first));
  repository.writeText(first, 'safe');
  assert.equal(repository.readText(first), 'safe');
  repository.copy(first, second);
  assert.equal(repository.exists(second), true);
  repository.remove(second);
  assert.throws(() => repository.readText(path.join(root, '..', 'outside.txt')), /escapes/);
});

test('request validation returns stable validation errors', () => {
  assert.equal(validate({ name: 'valid' }, { name: { type: 'string', required: true } }).name, 'valid');
  assert.equal(validateConfigType('theme'), 'theme');
  assert.equal(validateIntegerQuery('20', 'page', { min: 1, max: 100 }), 20);
  assert.throws(() => validate({}, { name: { type: 'string', required: true } }), error => error.code === 'VALIDATION_ERROR');
  assert.throws(() => validateConfigType('unknown'), error => error.code === 'VALIDATION_ERROR');
  assert.throws(() => validate(JSON.parse('{"data":{"__proto__":{"admin":true}}}'), { data: { type: 'object' } }), error => error.code === 'VALIDATION_ERROR');
});

test('schedule retention keeps every pending or running task and only trims terminal history', () => {
  const { createScheduleService } = require('../../lib/modules/schedule/service');
  let state = JSON.stringify({ items: [
    ...Array.from({ length: 205 }, (_, i) => ({ id: 'history-' + i, status: 'completed', createdAt: new Date(i * 1000).toISOString() })),
    { id: 'running', postId: 'running-post', status: 'running', createdAt: '2000-01-01T00:00:00Z' }
  ] });
  let tick = 0;
  const context = {
    hexo: { base_dir: process.cwd(), config: { timezone: 'Asia/Shanghai' }, log: { warn() {} } },
    repositories: { files: { exists: () => true, readText: () => state, mkdir() {}, writeText(_path, value) { state = value; } } },
    runtime: { now: () => Date.parse('2026-09-10T00:00:00Z') + tick++, setInterval: () => ({ unref() {} }) },
    services: { posts: { scheduleInfo: (id, revision) => ({ postId: id, title: id, source: id, revision }) } }
  };
  const service = createScheduleService(context);
  for (let i = 0; i < 201; i++) service.schedule('pending-' + i, '2027-01-01T00:00:00Z', 'revision');
  const result = service.list();
  assert.equal(result.items.filter(item => item.status === 'completed').length, 200);
  assert.equal(result.items.filter(item => item.status === 'scheduled').length, 201);
  assert.equal(result.items.find(item => item.id === 'running').status, 'retrying');
  assert.ok(result.items.some(item => item.postId === 'pending-0'));
  assert.equal(result.timeZone, 'Asia/Shanghai');
  assert.equal(JSON.parse(state).items.length, 402);
  const restarted = createScheduleService(context);
  assert.equal(restarted.list().total, 402);
});

test('reference rewriting respects URL origin, path boundaries, encoding and query fragments', () => {
  const { referenceOccurrences, rewriteReferences } = require('../../lib/modules/media/references');
  const options = { url: 'https://example.com/blog/', root: '/blog/', source: '_posts/a.md' };
  const raw = [
    '![a](/blog/images/封面.png?width=1#top)',
    'cover: https://example.com/blog/images/封面.png',
    '![b](../images/%E5%B0%81%E9%9D%A2.png)',
    '![c](https://other.com/blog/images/封面.png)',
    '![d](//other.com/images/封面.png)',
    '![e](/other-images/封面.png)',
    '![f](/images/a/../封面.png)',
    'background: url("/images/%E5%B0%81%E9%9D%A2.png")',
    '{"cover":"\\/images\\/%E5%B0%81%E9%9D%A2.png"}'
  ].join('\n');
  const occurrences = referenceOccurrences(raw, options);
  assert.equal(occurrences.length, 5);
  assert.ok(occurrences.every(item => item.mediaPath === '封面.png'));
  const next = rewriteReferences({ raw, occurrences }, '封面.png', 'album/new.png');
  assert.match(next, /\/blog\/images\/album\/new\.png\?width=1#top/);
  assert.match(next, /https:\/\/example\.com\/blog\/images\/album\/new\.png/);
  assert.match(next, /\.\.\/images\/album\/new\.png/);
  assert.ok(next.includes('https://other.com/blog/images/封面.png'));
  assert.ok(next.includes('"\\/images\\/album\\/new.png"'));
  assert.equal(rewriteReferences({ raw, occurrences }, '封面.png', '封面.png'), raw);
});

test('media rename restores earlier writes if a later reference write fails', async t => {
  const { createMediaService } = require('../../lib/modules/media/service');
  const { createOperationQueue } = require('../../lib/shared/operation-queue');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hexo-admin-rename-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, 'source');
  const images = path.join(source, 'images');
  fs.mkdirSync(images, { recursive: true });
  fs.writeFileSync(path.join(images, 'a.png'), 'original');
  const first = path.join(source, 'a.md'), second = path.join(source, 'b.md');
  fs.writeFileSync(first, '![a](/images/a.png)');
  fs.writeFileSync(second, '![b](/images/a.png)');
  const files = createFileRepository(root);
  const originalWrite = files.writeText;
  files.writeText = (location, text) => {
    if (location === second && text.includes('new.png')) throw new Error('disk write failed');
    return originalWrite(location, text);
  };
  const context = { hexo: { base_dir: root, config: {}, source: { process: async () => {} } }, paths: { source, images }, repositories: { files }, operations: createOperationQueue() };
  const media = createMediaService(context);
  const plan = media.previewRename('a.png', 'new.png');
  await assert.rejects(media.rename('a.png', 'new.png', plan.revision), { code: 'MEDIA_RENAME_FAILED' });
  assert.equal(fs.readFileSync(first, 'utf8'), '![a](/images/a.png)');
  assert.equal(fs.readFileSync(second, 'utf8'), '![b](/images/a.png)');
  assert.equal(fs.readFileSync(path.join(images, 'a.png'), 'utf8'), 'original');
  assert.equal(fs.existsSync(path.join(images, 'new.png')), false);

  // A second editor can write while refresh is pending. Rollback must preserve
  // that edit and report the recoverable backup instead of silently overwriting it.
  files.writeText = originalWrite;
  context.hexo.source.process = async () => {
    fs.writeFileSync(first, 'external editor content');
    throw new Error('refresh failed after an external edit');
  };
  const nextPlan = media.previewRename('a.png', 'new.png');
  await assert.rejects(media.rename('a.png', 'new.png', nextPlan.revision), { code: 'MEDIA_ROLLBACK_INCOMPLETE' });
  assert.equal(fs.readFileSync(first, 'utf8'), 'external editor content');
  assert.equal(fs.readFileSync(second, 'utf8'), '![b](/images/a.png)');
  assert.equal(fs.readFileSync(path.join(images, 'a.png'), 'utf8'), 'original');
});

test('initialization credentials are random, process-local and replaced after setup', async t => {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexo-admin-bootstrap-'));
  t.after(() => fs.rmSync(baseDir, { recursive: true, force: true }));
  const messages = [];
  const hexo = { base_dir: baseDir, config: {}, log: { warn: message => messages.push(message) } };
  const first = await loadAdminConfig(hexo);
  const password = messages.find(message => message.includes('initialization username:')).split('; password: ')[1];
  assert.match(password, /^[A-Za-z0-9_-]{32}$/);
  assert.equal(first.password, undefined);
  assert.equal(first.requires_password_change, true);
  assert.equal(await verifyPassword('admin', first), false);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(fs.existsSync(path.join(baseDir, '.hexo-admin', 'state.yml')), false);
  messages.length = 0;
  const second = await loadAdminConfig(hexo);
  const nextPassword = messages.find(message => message.includes('initialization username:')).split('; password: ')[1];
  assert.notEqual(password, nextPassword);
  assert.equal(await verifyPassword(password, second), false);
  const { createCredentialService } = require('../../lib/modules/auth/credentials');
  const service = createCredentialService({ config: second, hexo, repositories: { files: createFileRepository(baseDir) } });
  await service.change(nextPassword, 'Permanent-password-for-owner');
  assert.equal(await verifyPassword(nextPassword, second), false);
  messages.length = 0;
  const reloaded = await loadAdminConfig(hexo);
  assert.equal(reloaded.requires_password_change, false);
  assert.equal(await verifyPassword('Permanent-password-for-owner', reloaded), true);
  assert.equal(messages.length, 0);
});

test('async authentication yields to the event loop and bounds active and queued work', async () => {
  const { createAuthExecutor } = require('../../lib/modules/auth/security');
  const executor = createAuthExecutor({ concurrency: 2, maxQueue: 1 });
  const releases = [];
  const operation = () => new Promise(resolve => releases.push(resolve));
  const first = executor.run(operation), second = executor.run(operation), third = executor.run(operation);
  await assert.rejects(executor.run(operation), { code: 'AUTH_BUSY' });
  assert.deepEqual(executor.size(), { active: 2, queued: 1 });
  releases.shift()();
  await first;
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(executor.size(), { active: 2, queued: 0 });
  releases.forEach(resolve => resolve());
  await Promise.all([second, third]);
  let finished = false;
  const computation = hashPassword('long-test-password').then(() => { finished = true; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(finished, false, 'PBKDF2 must not block the main event loop');
  await computation;
  assert.equal(await verifyPassword('x', { password_hash: 'pbkdf2$999999999$' + 'a'.repeat(32) + '$' + 'a'.repeat(64) }), false);
});

test('login limiter prunes expired entries and refuses capacity overflow without evicting locks', () => {
  const { createLoginLimiter } = require('../../lib/modules/auth/security');
  const limiter = createLoginLimiter({ maxAttempts: 1, windowMs: 100, lockMs: 200, maxEntries: 2 });
  limiter.fail('a', 0); limiter.fail('b', 1);
  assert.ok(limiter.check('new', 2) > 0);
  limiter.fail('new', 2);
  assert.equal(limiter.size(), 2);
  assert.equal(limiter.check('a', 101), 99);
  limiter.prune(201);
  assert.equal(limiter.size(), 0);
  assert.equal(limiter.check('new', 201), 0);
});

test('repository rejects external junctions for reads, missing writes, moves and copies', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hexo-admin-boundary-'));
  const inside = path.join(root, 'site'), outside = path.join(root, 'outside');
  fs.mkdirSync(inside); fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'secret.txt'), 'untouched');
  const link = path.join(inside, 'link');
  fs.symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
  t.after(() => { fs.unlinkSync(link); fs.rmSync(root, { recursive: true, force: true }); });
  const files = createFileRepository(inside);
  for (const action of [
    () => files.readText(path.join(link, 'secret.txt')),
    () => files.writeText(path.join(link, 'new', 'file.txt'), 'bad'),
    () => files.mkdir(path.join(link, 'new')),
    () => files.removeTree(link),
    () => files.remove(path.join(link, 'secret.txt')),
    () => files.copy(path.join(link, 'secret.txt'), path.join(inside, 'copy.txt')),
    () => files.move(path.join(link, 'secret.txt'), path.join(inside, 'moved.txt')),
    () => files.copy(path.join(outside, 'secret.txt'), path.join(link, 'copy.txt')),
    () => resolveInside(inside, 'link/secret.txt')
  ]) assert.throws(action, /escapes/);
  const local = path.join(inside, 'local.txt');
  fs.writeFileSync(local, 'safe');
  assert.throws(() => files.copy(local, path.join(link, 'copy.txt')), /escapes/);
  assert.throws(() => files.move(local, path.join(link, 'moved.txt')), /escapes/);
  assert.equal(fs.readFileSync(path.join(outside, 'secret.txt'), 'utf8'), 'untouched');
  assert.deepEqual(fs.readdirSync(outside), ['secret.txt']);
  // Credential bootstrap must use the same repository boundary.
  const privateLink = path.join(inside, '.hexo-admin');
  fs.symlinkSync(outside, privateLink, process.platform === 'win32' ? 'junction' : 'dir');
  t.after(() => { if (fs.existsSync(privateLink)) fs.unlinkSync(privateLink); });
  await assert.rejects(loadAdminConfig({ base_dir: inside, config: { admin: { password: 'configured-long-password' } }, log: { warn() {} } }), /escapes/);
});

test('repository permits internal links and detects a link retargeted after repository creation', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hexo-admin-internal-link-'));
  const site = path.join(root, 'site'), data = path.join(site, 'data'), outside = path.join(root, 'outside');
  fs.mkdirSync(data, { recursive: true }); fs.mkdirSync(outside);
  const link = path.join(site, 'link');
  fs.symlinkSync(data, link, process.platform === 'win32' ? 'junction' : 'dir');
  t.after(() => { fs.unlinkSync(link); fs.rmSync(root, { recursive: true, force: true }); });
  const files = createFileRepository(site);
  files.writeText(path.join(link, 'ok.txt'), 'allowed');
  assert.equal(fs.readFileSync(path.join(data, 'ok.txt'), 'utf8'), 'allowed');
  fs.unlinkSync(link);
  fs.symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => files.writeText(path.join(link, 'new.txt'), 'blocked'), /escapes/);
  assert.deepEqual(fs.readdirSync(outside), []);
});

test('an in-flight password change cannot undo logout-all key rotation', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hexo-admin-auth-race-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const { createCredentialService } = require('../../lib/modules/auth/credentials');
  const config = { username: 'owner', password_hash: await hashPassword('Original-long-password'), jwt_secret: 'x'.repeat(64) };
  const context = { config, hexo: { base_dir: root }, repositories: { files: createFileRepository(root) } };
  const credentials = createCredentialService(context);
  const change = credentials.change('Original-long-password', 'Replacement-long-password');
  await credentials.rotate();
  const rotatedSecret = config.jwt_secret;
  await assert.rejects(change, { code: 'SESSION_CHANGED' });
  assert.equal(config.jwt_secret, rotatedSecret);
  assert.equal(await verifyPassword('Original-long-password', config), true);
});

test('server middleware awaits asynchronous credential initialization before exposing the API', async () => {
  const { registerMiddleware } = require('../../lib/plugin/register-middleware');
  let mount, finish;
  const config = new Promise(resolve => { finish = resolve; });
  const hexo = { config: { root: '/' }, extend: { filter: { register(_name, callback) { mount = callback; } } } };
  const mounted = [];
  registerMiddleware(hexo, () => config, { distDir: process.cwd() });
  const startup = mount({ use: (...args) => mounted.push(args) });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(mounted.length, 0);
  // A setup failure rejects the lifecycle hook, rather than mounting a public API.
  finish(null);
  await assert.rejects(startup);
  assert.equal(mounted.length, 0);
});


test('history retention bounds versions, keeps binary preimages and rejects corrupted restore data', async t => {
  const {createHistoryService}=require('../../lib/modules/history/service');
  const {createFileRepository}=require('../../lib/repositories/file-repository');
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'hexo-history-'));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const source=path.join(base,'source');fs.mkdirSync(source);const files=createFileRepository(base);
  const context={hexo:{base_dir:base,source:{process:async()=>{}}},paths:{source},repositories:{files},operations:{run:fn=>fn()}};
  const history=createHistoryService(context);files.observe(history);
  const target=path.join(source,'post.md');
  for(let index=0;index<55;index++)files.writeText(target,'Version '+index);
  const items=history.list('source/post.md').items;assert.equal(items.length,50);assert.ok(items.every(item=>item.content===undefined));
  const relocated=path.join(source,'renamed.md');files.move(target,relocated);assert.equal(history.list('source/renamed.md').items.length,50);assert.equal(history.list('source/post.md').items.length,0);assert.equal(history.preview(items[0].id).source,'source/renamed.md');
  const binary=path.join(source,'image.png');files.writeBuffer(binary,Buffer.from([0,255,127]));files.writeBuffer(binary,Buffer.from([1,2,3]));
  const image=history.list('source/image.png').items[0];const preview=history.preview(image.id);assert.deepEqual(Buffer.from(preview.content,'base64'),Buffer.from([0,255,127]));
  fs.writeFileSync(path.join(base,'.hexo-admin','history',image.id+'.bin'),Buffer.from([99]));
  await assert.rejects(()=>history.restore(image.id,preview.currentRevision),error=>error.code==='HISTORY_CORRUPTED');
});


test('native filename placeholders include hash and custom defaults with site-local dates', () => {
  const {newPostName,siteTimestamp}=require('../../lib/shared/hexo-native');
  const crypto=require('crypto');const date='2026-01-02 02:00:00';const timestamp=Date.parse('2026-01-01T18:00:00Z');
  assert.equal(siteTimestamp(date,'Asia/Shanghai'),timestamp);
  assert.equal(newPostName({new_post_name:'Folder/:title.md',filename_case:2},'native',date),'Folder/NATIVE.md');
  assert.throws(()=>siteTimestamp('2026-02-31','Asia/Shanghai'),{code:'POST_DATE_INVALID'});
  const hash=crypto.createHash('sha1').update('native'+Math.floor(timestamp/1000)).digest('hex').slice(0,12);
  const config={timezone:'Asia/Shanghai',new_post_name:':category/:lang/:year/:i_month/:day/:hash-:title',permalink_defaults:{category:'notes',lang:'en'}};
  assert.equal(newPostName(config,'native',date,{lang:'zh'}),'notes/zh/2026/1/02/'+hash+'-native.md');
  assert.throws(()=>newPostName({...config,new_post_name:':unknown.md'},'native',date),{code:'POST_NAME_PATTERN_INVALID'});
  assert.throws(()=>siteTimestamp('2026-03-08 02:30:00','America/New_York'),{code:'POST_DATE_INVALID'});
});
