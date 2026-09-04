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
  assert.equal(isPathInside('C:\\workspace\\media', 'C:\\workspace\\media\\image.png'), true);
  assert.throws(() => resolveInside('C:\\workspace\\media', '..\\secret.txt'));
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

test('passwords are hashed and weak replacements are rejected', () => {
  const passwordHash = hashPassword('A-long-and-safe-passphrase');
  assert.equal(verifyPassword('A-long-and-safe-passphrase', { password_hash: passwordHash }), true);
  assert.equal(verifyPassword('wrong', { password_hash: passwordHash }), false);
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

test('plaintext credentials and weak JWT secrets are migrated to private state', t => {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexo-admin-config-'));
  t.after(() => fs.rmSync(baseDir, { recursive: true, force: true }));
  const warnings = [];
  const config = loadAdminConfig({
    base_dir: baseDir + path.sep,
    config: { admin: { username: 'owner', password: 'A-long-existing-password', jwt_secret: 'short', token_expiry: '24h' } },
    log: { warn: message => warnings.push(message) }
  });
  assert.ok(config.jwt_secret.length >= 32);
  assert.ok(config.password_hash);
  assert.equal(config.password, undefined);
  assert.equal(verifyPassword('A-long-existing-password', config), true);
  assert.equal(fs.existsSync(path.join(baseDir, '.hexo-admin', 'state.yml')), true);
  assert.ok(warnings.some(message => message.includes('Plaintext administrator credentials')));
});

test('credentials are scrubbed from the dedicated admin config after migration', t => {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexo-admin-config-file-'));
  t.after(() => fs.rmSync(baseDir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(baseDir, '_admin-config.yml'), 'admin:\n  username: owner\n  password: A-long-existing-password\n  jwt_secret: a-secret-that-is-definitely-long-enough\n  token_expiry: 24h\n', 'utf8');
  const config = loadAdminConfig({ base_dir: baseDir + path.sep, config: {}, log: { warn() {} } });
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
