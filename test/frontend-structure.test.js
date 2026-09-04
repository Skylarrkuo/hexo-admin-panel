'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('Vue frontend is organized into feature pages, components and schema utilities', () => {
  const required = [
    'admin/src/App.vue', 'admin/src/main.js', 'admin/src/api/client.js', 'admin/src/utils/markdown.js',
    'admin/src/layouts/AdminHeader.vue', 'admin/src/components/ConfigAtlas.vue', 'admin/src/components/FrontMatterFields.vue',
    'admin/src/pages/DashboardPage.vue', 'admin/src/pages/PostsPage.vue', 'admin/src/pages/MediaPage.vue',
    'admin/src/pages/PasswordChangePage.vue', 'admin/src/pages/TrashPage.vue',
    'admin/src/pages/PostEditorPage.vue', 'admin/src/pages/ConfigPage.vue',
    'admin/src/pages/ThemesPage.vue', 'admin/src/utils/config-schema.js', 'admin/vite.config.js',
    'lib/repositories/file-repository.js', 'lib/server/validation.js',
    'admin/src/utils/front-matter-fields.js', 'lib/modules/media/references.js', 'lib/modules/schedule/service.js', 'lib/modules/schedule/routes.js',
    'lib/modules/commands/service.js', 'lib/modules/pages/service.js', 'lib/modules/pages/routes.js',
    'lib/modules/previews/service.js', 'lib/modules/previews/routes.js', 'lib/modules/scaffolds/service.js',
    'lib/modules/taxonomies/service.js', 'admin/src/components/TaxonomySelector.vue',
    'admin/src/pages/PagesPage.vue', 'admin/src/pages/PageEditorPage.vue', 'admin/src/pages/PublishingPage.vue',
    'admin/src/pages/TaxonomiesPage.vue', 'admin/src/pages/PluginAboutPage.vue',
    'lib/modules/system/routes.js', 'assets/hexo-admin-panel-logo.svg', 'README_EN.md', 'THIRD_PARTY_NOTICES.md'
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
  assert.ok(pkg.files.includes('assets/'));
  assert.ok(pkg.files.includes('README_EN.md'));
  assert.ok(pkg.files.includes('THIRD_PARTY_NOTICES.md'));
  assert.match(pkg.engines.node, />=20/);
  assert.equal(fs.existsSync(path.join(root, 'eslint.config.mjs')), true);
  assert.equal(fs.existsSync(path.join(root, '.github', 'workflows', 'ci.yml')), true);
});

test('project logo stays minimal and uses the admin panel plum palette', () => {
  const logo = fs.readFileSync(path.join(root, 'assets', 'hexo-admin-panel-logo.svg'), 'utf8');
  assert.match(logo, /#8b5961/);
  assert.match(logo, /#f5f3ef/);
  assert.doesNotMatch(logo, /#14362d|linearGradient|<circle|stroke=/);
  assert.equal((logo.match(/<path/g) || []).length, 2);
});

test('visible product branding consistently uses Hexo Admin Panel', () => {
  const header = fs.readFileSync(path.join(root, 'admin', 'src', 'layouts', 'AdminHeader.vue'), 'utf8');
  const login = fs.readFileSync(path.join(root, 'admin', 'src', 'pages', 'LoginPage.vue'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'admin', 'index.html'), 'utf8');
  for (const source of [header, login, html]) assert.match(source, /Hexo Admin Panel/);
  assert.doesNotMatch([header, login, html].join('\n'), /Hexo Studio|Hexo 后台管理|>Hexo Admin</);
});

test('README presents the release identity, onboarding and explicit open-source references', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /assets\/hexo-admin-panel-logo\.svg/);
  assert.match(readme, /href="\.\/README_EN\.md">English<\/a>/);
  assert.match(readme, /actions\/workflows\/ci\.yml\/badge\.svg/);
  assert.match(readme, /npmjs\.com\/package\/hexo-admin-panel/);
  assert.match(readme, /## 快速开始/);
  assert.match(readme, /## 兼容性与运行边界/);
  assert.match(readme, /## 开源许可与引用/);
  for (const project of ['Hexo', 'hexo-front-matter', 'js-yaml', 'sharp', 'Vue', 'marked', 'DOMPurify']) {
    assert.match(readme, new RegExp('\\[' + project.replace('-', '\\-') + '\\]'));
  }
  assert.doesNotMatch(readme, /关键开源组件\s*\n\s*-\s*\n/);

  const english = fs.readFileSync(path.join(root, 'README_EN.md'), 'utf8');
  assert.match(english, /href="\.\/README\.md">简体中文<\/a>/);
  assert.match(english, /## Quick start/);
  assert.match(english, /## Open-source licenses and attributions/);
});

test('dark mode covers raised surfaces, overlays, editors and theme previews', () => {
  const css = fs.readFileSync(path.join(root, 'admin', 'src', 'styles', 'main.css'), 'utf8');
  [
    '.confirm-box', '.login-box', '.table-wrap', '.media-item', '.config-field',
    '.editor-commandbar', '.upload-overlay', '.theme-preview-shell', '.theme-article',
    '.theme-article .markdown-body blockquote'
  ].forEach(selector => assert.match(css, new RegExp(':root\\[data-theme="dark"\\][^}]*' + selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))));
});
