'use strict';

const crypto = require('crypto');
const { badRequest, HttpError } = require('../../server/errors');

const HASH_ITERATIONS = 210000;

function createAuthExecutor({ concurrency = 2, maxQueue = 8 } = {}) {
  let active = 0;
  const queue = [];
  function start(operation, resolve, reject) {
    active++;
    Promise.resolve().then(operation).then(resolve, reject).finally(() => {
      active--;
      if (queue.length) start(...queue.shift());
    });
  }
  return {
    run(operation) {
      return new Promise((resolve, reject) => {
        if (active < concurrency) start(operation, resolve, reject);
        else if (queue.length < maxQueue) queue.push([operation, resolve, reject]);
        else reject(new HttpError(429, '认证繁忙，请稍后重试', 'AUTH_BUSY'));
      });
    },
    size: () => ({ active, queued: queue.length })
  };
}

// Shared by initialization, password verification and changes in this process.
const authExecutor = createAuthExecutor();
function derive(password, salt, iterations) {
  return authExecutor.run(() => new Promise((resolve, reject) => {
    crypto.pbkdf2(String(password), salt, iterations, 32, 'sha256', (error, key) => error ? reject(error) : resolve(key.toString('hex')));
  }));
}

async function hashPassword(password, salt) {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = await derive(password, actualSalt, HASH_ITERATIONS);
  return ['pbkdf2', HASH_ITERATIONS, actualSalt, hash].join('$');
}

function safeEqualText(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function verifyPassword(password, config) {
  if (config.password_hash) {
    const parts = String(config.password_hash).split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
    const iterations = Number(parts[1]);
    if (!Number.isSafeInteger(iterations) || iterations < 100000 || iterations > 1000000 || !/^[a-f0-9]{32}$/i.test(parts[2]) || !/^[a-f0-9]{64}$/i.test(parts[3])) return false;
    const actual = await derive(password, parts[2], iterations);
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
  const maxEntries = options.maxEntries || 1024;
  function prune(time) {
    for (const [key, state] of attempts) {
      if (time >= Math.max(state.windowStarted + windowMs, state.lockedUntil)) attempts.delete(key);
    }
  }
  return {
    check(key, now) {
      const time = now ?? Date.now();
      prune(time);
      const state = attempts.get(key);
      if (!state) return attempts.size >= maxEntries ? Math.max(1, Math.min(...[...attempts.values()].map(item => Math.max(item.windowStarted + windowMs, item.lockedUntil) - time))) : 0;
      if (state.lockedUntil > time) return state.lockedUntil - time;
      if (time - state.windowStarted >= windowMs) attempts.delete(key);
      return 0;
    },
    fail(key, now) {
      const time = now ?? Date.now();
      prune(time);
      let state = attempts.get(key);
      if (!state && attempts.size >= maxEntries) return Math.max(windowMs, lockMs);
      if (state && state.lockedUntil > time) return state.lockedUntil - time;
      if (!state || time - state.windowStarted >= windowMs) state = { count: 0, windowStarted: time, lockedUntil: 0 };
      state.count += 1;
      if (state.count >= maxAttempts) state.lockedUntil = time + lockMs;
      attempts.set(key, state);
      return state.lockedUntil > time ? state.lockedUntil - time : 0;
    },
    success(key) { attempts.delete(key); },
    size() { return attempts.size; },
    prune(now = Date.now()) { prune(now); }
  };
}

module.exports = { hashPassword, verifyPassword, validateNewPassword, createLoginLimiter, safeEqualText, createAuthExecutor };
