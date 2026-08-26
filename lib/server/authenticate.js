'use strict';

const { verify, extractToken } = require('../auth');
const { unauthorized } = require('./errors');

function authenticate(req, config) {
  const token = extractToken(req);
  if (!token) throw unauthorized('No token provided');
  const user = verify(token, config.jwt_secret);
  if (!user) throw unauthorized('Invalid or expired token');
  req._user = user;
  return user;
}

module.exports = { authenticate };
