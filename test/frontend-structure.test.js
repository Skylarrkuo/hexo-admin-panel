'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('Vue frontend is organized into feature pages, components and schema utilities', () => {
  const required = [
    'admin/src/App.vue', 'admin/src/main.js', 'admin/src/api/client.js', 'admin/src/utils/markdown.js',
    'admin/src/layouts/AdminHeader.vue', 'admin/src/components/ConfigAtlas.vue',
    'admin/src/pages/DashboardPage.vue', 'admin/src/pages/PostsPage.vue', 'admin/src/pages/MediaPage.vue',
    'admin/src/pages/PasswordChangePage.vue', 'admin/src/pages/TrashPage.vue',
    'admin/src/pages/PostEditorPage.vue', 'admin/src/pages/ConfigPage.vue',
    'admin/src/pages/ThemesPage.vue', 'admin/src/utils/config-schema.js', 'admin/vite.config.js',
    'lib/repositories/file-repository.js', 'lib/server/validation.js',
    'lib/modules/media/references.js', 'lib/modules/schedule/service.js', 'lib/modules/schedule/routes.js'
  ];
  required.forEach(file => assert.equal(fs.existsSync(path.join(root, file)), true, file));
});

test('frontend source uses bundled modules and contains no runtime CDN fallback', () => {
  const files = fs.readdirSync(path.join(root, 'admin', 'src'), { recursive: true })
    .filter(file => /\.(js|vue)$/.test(file))
    .map(file => fs.readFileSync(path.join(root, 'admin', 'src', file), 'utf8'));
  const source = files.join('\n');
  assert.match(source, /from ['"]vue['"]/);
  assert.match(source, /DOMPurify\.sanitize/);
  assert.doesNotMatch(source, /cdn\.jsdelivr|cdnjs|bootcdn|__HEXO_ROOT__/);
  assert.equal(fs.existsSync(path.join(root, 'admin', 'src', 'themes')), false);
  assert.match(fs.readFileSync(path.join(root, 'admin', 'src', 'components', 'ConfigAtlas.vue'), 'utf8'), /fieldsFromSchema/);
});

test('package scripts enforce frontend tests and production build before packing', () => {
  const pkg = require('../package.json');
  assert.match(pkg.scripts.dev, /vite/);
  assert.match(pkg.scripts.build, /vite build/);
  assert.match(pkg.scripts.test, /test:node/);
  assert.match(pkg.scripts.test, /test:ui/);
  assert.equal(pkg.scripts.prepack, 'npm run check');
  assert.match(pkg.scripts.check, /lint/);
  assert.ok(pkg.scripts.coverage);
  assert.ok(pkg.files.includes('dist/'));
  assert.equal(fs.existsSync(path.join(root, 'eslint.config.mjs')), true);
  assert.equal(fs.existsSync(path.join(root, '.github', 'workflows', 'ci.yml')), true);
});

test('dark mode covers raised surfaces, overlays, editors and theme previews', () => {
  const css = fs.readFileSync(path.join(root, 'admin', 'src', 'styles', 'main.css'), 'utf8');
  [
    '.confirm-box', '.login-box', '.table-wrap', '.media-item', '.config-field',
    '.editor-commandbar', '.upload-overlay', '.theme-preview-shell', '.theme-article',
    '.theme-article .markdown-body blockquote'
  ].forEach(selector => assert.match(css, new RegExp(':root\\[data-theme="dark"\\][^}]*' + selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))));
});
