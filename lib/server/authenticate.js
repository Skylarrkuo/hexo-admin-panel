'use strict';

const { verify, extractToken } = require('../auth');
const { unauthorized } = require('./errors');

function authenticate(req, config, sessions) {
  const token = extractToken(req);
  if (!token) throw unauthorized('No token provided');
  const user = verify(token, config.jwt_secret);
  if (!user || (sessions && sessions.isRevoked(token))) throw unauthorized('Invalid or expired token');
  req._user = user;
  req._authSecret = config.jwt_secret;
  return user;
}

module.exports = { authenticate };
