'use strict';

const crypto = require('crypto');

function base64url(buf) {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlToBase64(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4 !== 0) s += '=';
  return s;
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
    const actualBuffer = Buffer.from(sig);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;
    const payload = JSON.parse(Buffer.from(base64urlToBase64(body), 'base64').toString());
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

module.exports = { sign, verify, parseExpiry, extractToken };
