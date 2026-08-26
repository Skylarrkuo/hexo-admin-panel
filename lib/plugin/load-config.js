'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parseYaml, dumpYaml } = require('../modules/config/yaml-codec');
const { writeTextFileAtomic } = require('../modules/config/atomic-write');

const DEFAULTS = {
  username: 'admin', password: 'admin', jwt_secret: 'hexo-admin-panel-secret', token_expiry: '24h',
  security: { login_max_attempts: 5, login_window_minutes: 15, login_lock_minutes: 15 },
  uploads: {
    max_file_size: 10 * 1024 * 1024, max_request_size: 50 * 1024 * 1024, max_files: 10,
    allowed_extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.ico', '.pdf', '.zip', '.mp3', '.mp4']
  }
};

function mergeNested(base, extra) {
  return {
    ...base, ...(extra || {}),
    security: { ...base.security, ...((extra && extra.security) || {}) },
    uploads: { ...base.uploads, ...((extra && extra.uploads) || {}) }
  };
}

function validateConfig(config) {
  if (typeof config.username !== 'string' || !config.username.trim()) throw new Error('hexo-admin-panel: admin.username must be a non-empty string');
  if (!config.password_hash && (typeof config.password !== 'string' || !config.password)) throw new Error('hexo-admin-panel: admin.password must be configured');
  if (typeof config.jwt_secret !== 'string' || config.jwt_secret.length < 32) throw new Error('hexo-admin-panel: admin.jwt_secret must contain at least 32 characters');
  if (!/^\d+(s|m|h|d)$/.test(String(config.token_expiry))) throw new Error('hexo-admin-panel: admin.token_expiry must look like 30m, 24h or 7d');
  for (const key of ['login_max_attempts', 'login_window_minutes', 'login_lock_minutes']) {
    if (!Number.isInteger(config.security[key]) || config.security[key] < 1) throw new Error('hexo-admin-panel: admin.security.' + key + ' must be a positive integer');
  }
  for (const key of ['max_file_size', 'max_request_size', 'max_files']) {
    if (!Number.isInteger(config.uploads[key]) || config.uploads[key] < 1) throw new Error('hexo-admin-panel: admin.uploads.' + key + ' must be a positive integer');
  }
  if (config.uploads.max_request_size < config.uploads.max_file_size) throw new Error('hexo-admin-panel: upload request limit cannot be smaller than the file limit');
  if (!Array.isArray(config.uploads.allowed_extensions) || !config.uploads.allowed_extensions.length) throw new Error('hexo-admin-panel: uploads.allowed_extensions must be a non-empty array');
  config.uploads.allowed_extensions = config.uploads.allowed_extensions.map(value => {
    const extension = String(value).toLowerCase();
    return extension.startsWith('.') ? extension : '.' + extension;
  });
  return config;
}

function loadAdminConfig(hexo) {
  const configPath = path.join(hexo.base_dir, '_admin-config.yml');
  const statePath = path.join(hexo.base_dir, '.hexo-admin', 'state.yml');
  let fileConfig = {};
  try {
    const parsed = parseYaml(fs.readFileSync(configPath, 'utf8'));
    if (parsed.admin && typeof parsed.admin === 'object') fileConfig = parsed.admin;
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error('hexo-admin-panel: Cannot read _admin-config.yml: ' + error.message);
  }
  const inlineConfig = hexo.config.admin && typeof hexo.config.admin === 'object' ? hexo.config.admin : {};
  let config = mergeNested(mergeNested(DEFAULTS, fileConfig), inlineConfig);
  let state = null;
  try { state = parseYaml(fs.readFileSync(statePath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw new Error('hexo-admin-panel: Cannot read credential state: ' + error.message); }
  if (state && state.jwt_secret) {
    config = mergeNested(config, {
      username: state.username || config.username,
      ...(state.password_hash ? { password: undefined, password_hash: state.password_hash } : {}),
      jwt_secret: state.jwt_secret
    });
  }
  const usingDefaultAccount = !(state && state.password_hash) && config.username === DEFAULTS.username && config.password === DEFAULTS.password;
  if (usingDefaultAccount) {
    config.jwt_secret = crypto.randomBytes(32).toString('hex');
    config.requires_password_change = true;
    hexo.log.warn('hexo-admin-panel: One-time default account enabled; password change is required after login');
  } else {
    config.requires_password_change = false;
    if (typeof config.jwt_secret !== 'string' || config.jwt_secret.length < 32) {
      const migrated = {
        ...(state || {}), version: 1, username: config.username,
        jwt_secret: crypto.randomBytes(32).toString('hex'), migrated_at: new Date().toISOString()
      };
      fs.mkdirSync(path.dirname(statePath), { recursive: true });
      writeTextFileAtomic(statePath, dumpYaml(migrated));
      try { fs.chmodSync(statePath, 0o600); } catch (_) {}
      config.jwt_secret = migrated.jwt_secret;
      hexo.log.warn('hexo-admin-panel: Weak JWT secret was replaced with a generated secret in .hexo-admin/state.yml');
    }
    if (!config.password_hash && String(config.password).length < 12) {
      hexo.log.warn('hexo-admin-panel: The configured password is shorter than 12 characters; change it as soon as possible');
    }
  }
  config._state_path = statePath;
  return validateConfig(config);
}

module.exports = { DEFAULTS, loadAdminConfig, validateConfig, mergeNested };
