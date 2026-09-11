'use strict';

const { sign, extractToken } = require('../../auth');
const { parseExpiry } = require('../../auth');
const { readJson } = require('../../server/request');
const { success } = require('../../server/response');
const { unauthorized, tooManyRequests } = require('../../server/errors');
const { validate } = require('../../server/validation');

function clientKey(req) {
  const address = req.socket && req.socket.remoteAddress || 'local';
  return address;
}

function authRoutes(context) {
  const config = context.config;
  return [
    {
      method: 'POST', path: '/auth/login', public: true,
      async handler({ req, res }) {
        const body = validate(await readJson(req), { username: { type: 'string', required: true, maxLength: 128 }, password: { type: 'string', required: true, maxLength: 256 } });
        const key = clientKey(req);
        const remaining = context.loginLimiter.check(key);
        if (remaining > 0) throw tooManyRequests('登录尝试过多，请在 ' + Math.ceil(remaining / 60000) + ' 分钟后重试');
        // Reserve attempts before awaiting crypto, so concurrent requests cannot
        // bypass the failure budget or grow an unbounded authentication queue.
        context.loginLimiter.fail(key);
        const secret = config.jwt_secret;
        if (!await context.services.credentials.verify(body.username, body.password)) {
          throw unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
        }
        if (secret !== config.jwt_secret) throw unauthorized('登录状态已变化，请重新登录', 'SESSION_CHANGED');
        context.loginLimiter.success(key);
        const mustChangePassword = config.requires_password_change === true;
        const token = sign({ username: body.username, mustChangePassword }, config.jwt_secret, config.token_expiry || '24h');
        success(res, { token, expiresIn: parseExpiry(config.token_expiry || '24h'), mustChangePassword });
      }
    },
    {
      method: 'POST', path: '/auth/change-password', allowPasswordChange: true,
      async handler({ req, res }) {
        const body = validate(await readJson(req), { currentPassword: { type: 'string', required: true, maxLength: 256 }, newPassword: { type: 'string', required: true, minLength: 12, maxLength: 256 } });
        await context.services.credentials.change(body.currentPassword, body.newPassword, req._authSecret);
        const token = sign({ username: config.username, mustChangePassword: false }, config.jwt_secret, config.token_expiry || '24h');
        success(res, { token, expiresIn: parseExpiry(config.token_expiry || '24h'), mustChangePassword: false });
      }
    },
    {
      method: 'POST', path: '/auth/logout', allowPasswordChange: true,
      async handler({ req, res }) {
        await context.services.sessions.revoke(extractToken(req), req._user.exp);
        success(res, { revoked: true });
      }
    },
    {
      method: 'POST', path: '/auth/logout-all', allowPasswordChange: true,
      async handler({ req, res }) {
        await context.services.credentials.rotate(req._authSecret);
        success(res, { revoked: true, all: true });
      }
    },
    {
      method: 'GET', path: '/auth/verify', allowPasswordChange: true,
      handler({ req, res }) { success(res, { username: req._user.username, mustChangePassword: req._user.mustChangePassword === true, instanceId: context.instanceId }); }
    }
  ];
}

module.exports = { authRoutes };
