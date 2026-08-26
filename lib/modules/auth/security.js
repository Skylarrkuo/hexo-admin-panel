'use strict';

const crypto = require('crypto');
const { badRequest } = require('../../server/errors');

const HASH_ITERATIONS = 210000;

function hashPassword(password, salt) {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(String(password), actualSalt, HASH_ITERATIONS, 32, 'sha256').toString('hex');
  return ['pbkdf2', HASH_ITERATIONS, actualSalt, hash].join('$');
}

function safeEqualText(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function verifyPassword(password, config) {
  if (config.password_hash) {
    const parts = String(config.password_hash).split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
    const iterations = Number(parts[1]);
    if (!Number.isSafeInteger(iterations) || iterations < 100000) return false;
    const actual = crypto.pbkdf2Sync(String(password), parts[2], iterations, 32, 'sha256').toString('hex');
    return safeEqualText(actual, parts[3]);
  }
  return safeEqualText(password, config.password || '');
}

function validateNewPassword(password, username) {
  if (typeof password !== 'string' || password.length < 12) throw badRequest('新密码至少需要 12 个字符', 'WEAK_PASSWORD');
  if (password.length > 256) throw badRequest('密码长度不能超过 256 个字符', 'WEAK_PASSWORD');
  const lower = password.toLowerCase();
  if (lower === 'admin' || lower === 'password' || lower.includes(String(username || '').toLowerCase() + '123')) {
    throw badRequest('新密码过于简单', 'WEAK_PASSWORD');
  }
}

function createLoginLimiter(options) {
  const attempts = new Map();
  const maxAttempts = options.maxAttempts;
  const windowMs = options.windowMs;
  const lockMs = options.lockMs;
  return {
    check(key, now) {
      const time = now || Date.now();
      const state = attempts.get(key);
      if (!state) return 0;
      if (state.lockedUntil > time) return state.lockedUntil - time;
      if (time - state.windowStarted >= windowMs) attempts.delete(key);
      return 0;
    },
    fail(key, now) {
      const time = now || Date.now();
      let state = attempts.get(key);
      if (!state || time - state.windowStarted >= windowMs) state = { count: 0, windowStarted: time, lockedUntil: 0 };
      state.count += 1;
      if (state.count >= maxAttempts) state.lockedUntil = time + lockMs;
      attempts.set(key, state);
      return state.lockedUntil > time ? state.lockedUntil - time : 0;
    },
    success(key) { attempts.delete(key); },
    size() { return attempts.size; }
  };
}

module.exports = { hashPassword, verifyPassword, validateNewPassword, createLoginLimiter, safeEqualText };
