'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { dumpYaml } = require('../config/yaml-codec');
const { writeTextFileAtomic } = require('../config/atomic-write');
const { hashPassword, verifyPassword, validateNewPassword } = require('./security');
const { badRequest } = require('../../server/errors');

function createCredentialService(context) {
  const config = context.config;
  const statePath = config._state_path || path.join(context.hexo.base_dir, '.hexo-admin', 'state.yml');
  return {
    verify(username, password) {
      return String(username) === String(config.username) && verifyPassword(password, config);
    },
    change(currentPassword, newPassword) {
      if (!verifyPassword(currentPassword, config)) throw badRequest('当前密码不正确', 'CURRENT_PASSWORD_INVALID');
      validateNewPassword(newPassword, config.username);
      if (verifyPassword(newPassword, config)) throw badRequest('新密码不能与当前密码相同', 'WEAK_PASSWORD');
      const next = {
        version: 1,
        username: config.username,
        password_hash: hashPassword(newPassword),
        jwt_secret: crypto.randomBytes(32).toString('hex'),
        initialized_at: new Date().toISOString()
      };
      fs.mkdirSync(path.dirname(statePath), { recursive: true });
      writeTextFileAtomic(statePath, dumpYaml(next));
      try { fs.chmodSync(statePath, 0o600); } catch (_) {}
      config.password = undefined;
      config.password_hash = next.password_hash;
      config.jwt_secret = next.jwt_secret;
      config.requires_password_change = false;
      return next;
    }
  };
}

module.exports = { createCredentialService };
