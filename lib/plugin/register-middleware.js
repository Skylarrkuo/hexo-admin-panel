'use strict';

const createApiHandler = require('../api');
const { createStaticHandler } = require('./static-files');

function normalizeRoot(value) {
  const root = value || '/';
  return root.endsWith('/') ? root : root + '/';
}

function registerMiddleware(hexo, config, options) {
  const distDir = options.distDir;
  hexo.extend.filter.register('server_middleware', async function mount(app) {
    const adminConfig = typeof config === 'function' ? await config() : await config;
    const root = normalizeRoot(hexo.config.root);
    app.use(root + 'admin/api', createApiHandler(hexo, adminConfig));
    app.use(root + 'admin', createStaticHandler({ directory: distDir, root }));
    hexo.log.info('Admin panel loaded at ' + root + 'admin');
  }, 1);
}

module.exports = { registerMiddleware };
