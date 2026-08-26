/* global hexo */
'use strict';

const path = require('path');
const { loadAdminConfig } = require('./lib/plugin/load-config');
const { registerMiddleware } = require('./lib/plugin/register-middleware');

const adminConfig = loadAdminConfig(hexo);

if (adminConfig) {
  registerMiddleware(hexo, adminConfig, { distDir: path.join(__dirname, 'dist', 'admin') });
  hexo.log.info('Admin panel loaded at /admin');
}
