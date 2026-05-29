/* global hexo */
'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DEFAULTS = {
  username: 'admin',
  password: 'admin',
  jwt_secret: 'hexo-admin-panel-secret',
  token_expiry: '24h'
};

function loadAdminConfig(baseDir) {
  // Priority 1: hexo.config.admin (from _config.yml)
  if (hexo.config.admin && typeof hexo.config.admin === 'object') {
    return Object.assign({}, DEFAULTS, hexo.config.admin);
  }

  // Priority 2: _admin-config.yml file
  try {
    const configPath = path.join(baseDir, '_admin-config.yml');
    const content = fs.readFileSync(configPath, 'utf8');
    const cfg = yaml.load(content);
    if (cfg && cfg.admin) {
      return Object.assign({}, DEFAULTS, cfg.admin);
    }
  } catch (e) {
    // File not found or invalid, continue to defaults
  }

  // Priority 3: defaults (with warning)
  hexo.log.warn('hexo-admin-panel: No admin config found, using defaults (admin/admin)');
  return Object.assign({}, DEFAULTS);
}

const adminConfig = loadAdminConfig(hexo.base_dir);

if (adminConfig) {
  const createApiHandler = require('./lib/api');
  const { getHtml } = require('./lib/html');

  hexo.extend.filter.register('server_middleware', function (app) {
    const root = hexo.config.root || '/';

    // API routes
    app.use(root + 'admin/api', createApiHandler(hexo, adminConfig));

    // SPA fallback - serve for any /admin request
    app.use(root + 'admin', function (req, res, next) {
      if (req.method !== 'GET') return next();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(getHtml(root));
    });
  }, 1);

  hexo.log.info('Admin panel loaded at /admin');
}
