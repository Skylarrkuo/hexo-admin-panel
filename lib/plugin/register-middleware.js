'use strict';

const path = require('path');
const createApiHandler = require('../api');
const { createStaticHandler } = require('./static-files');

function normalizeRoot(value) {
  const root = value || '/';
  return root.endsWith('/') ? root : root + '/';
}

function registerMiddleware(hexo, config, options) {
  const distDir = options.distDir;
  hexo.extend.filter.register('server_middleware', function mount(app) {
    const root = normalizeRoot(hexo.config.root);
    app.use(root + 'admin/api', createApiHandler(hexo, config));
    app.use(root + 'admin', createStaticHandler({ directory: distDir, root }));
  }, 1);
}

module.exports = { registerMiddleware };
