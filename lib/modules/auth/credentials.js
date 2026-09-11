'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { dumpYaml } = require('../config/yaml-codec');
const { createFileRepository } = require('../../repositories/file-repository');
const { hashPassword, verifyPassword, validateNewPassword } = require('./security');
const { badRequest, unauthorized } = require('../../server/errors');

function createCredentialService(context) {
  const config = context.config;
  const statePath = config._state_path || path.join(context.hexo.base_dir, '.hexo-admin', 'state.yml');
  const files = context.repositories.files || createFileRepository(context.hexo.base_dir);
  function checkSecret(secret) {
    if (secret !== config.jwt_secret) throw unauthorized('登录状态已变化，请重新登录', 'SESSION_CHANGED');
  }
  function persist(next) {
    files.mkdir(path.dirname(statePath));
    files.writeText(statePath, dumpYaml(next));
    try { fs.chmodSync(statePath, 0o600); } catch (_) {}
  }
  return {
    async verify(username, password) {
      const validPassword = await verifyPassword(password, config);
      return String(username) === String(config.username) && validPassword;
    },
    async change(currentPassword, newPassword, secret = config.jwt_secret) {
      checkSecret(secret);
      const snapshot = { ...config };
      if (!await verifyPassword(currentPassword, snapshot)) throw badRequest('当前密码不正确', 'CURRENT_PASSWORD_INVALID');
      validateNewPassword(newPassword, config.username);
      if (await verifyPassword(newPassword, snapshot)) throw badRequest('新密码不能与当前密码相同', 'WEAK_PASSWORD');
      const next = {
        version: 2,
        username: config.username,
        password_hash: await hashPassword(newPassword),
        jwt_secret: crypto.randomBytes(32).toString('hex'),
        initialized_at: new Date().toISOString()
      };
      checkSecret(secret);
      persist(next);
      config.password = undefined;
      config.password_hash = next.password_hash;
      config.jwt_secret = next.jwt_secret;
      config.requires_password_change = false;
      return next;
    },
    async rotate(secret = config.jwt_secret) {
      checkSecret(secret);
      const passwordHash = config.password_hash || await hashPassword(config.password);
      checkSecret(secret);
      const next = { version: 2, username: config.username, password_hash: passwordHash,
        jwt_secret: crypto.randomBytes(32).toString('hex'), rotated_at: new Date().toISOString() };
      // Bootstrap credentials remain process-local until the password is changed.
      if (!config.requires_password_change) persist(next);
      config.password_hash = passwordHash;
      config.password = undefined;
      config.jwt_secret = next.jwt_secret;
    }
  };
}

module.exports = { createCredentialService };
