/* global hexo */
'use strict';

const path = require('path');
const { loadAdminConfig } = require('./lib/plugin/load-config');
const { registerMiddleware } = require('./lib/plugin/register-middleware');

registerMiddleware(hexo, () => loadAdminConfig(hexo), { distDir: path.join(__dirname, 'dist', 'admin') });
