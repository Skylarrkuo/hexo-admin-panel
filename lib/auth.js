'use strict';

const crypto = require('crypto');

function base64url(buf) {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function parseExpiry(str) {
  if (typeof str === 'number') return str;
  const match = String(str).match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 86400;
  const n = parseInt(match[1], 10);
  const unit = { s: 1, m: 60, h: 3600, d: 86400 };
  return n * (unit[match[2]] || 1);
}

function sign(payload, secret, expiry) {
  const header = base64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const now = Math.floor(Date.now() / 1000);
  const body = base64url(Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + parseExpiry(expiry) })));
  const sig = base64url(crypto.createHmac('sha256', secret).update(header + '.' + body).digest());
  return header + '.' + body + '.' + sig;
}

function verify(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expected = base64url(crypto.createHmac('sha256', secret).update(header + '.' + body).digest());
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function extractToken(req) {
  const auth = req.headers['authorization'] || req.headers['Authorization'];
  if (!auth) return null;
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

function json(res, data, status) {
  res.writeHead(status || 200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function authMiddleware(req, res, next, config) {
  const token = extractToken(req);
  if (!token) {
    json(res, { success: false, error: 'No token provided' }, 401);
    return;
  }
  const payload = verify(token, config.jwt_secret);
  if (!payload) {
    json(res, { success: false, error: 'Invalid or expired token' }, 401);
    return;
  }
  req._user = payload;
  next();
}

module.exports = { sign, verify, parseExpiry, extractToken, json, authMiddleware };
