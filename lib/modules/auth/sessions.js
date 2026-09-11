'use strict';

const path = require('path');
const crypto = require('crypto');

function createSessionService(context) {
  const files = context.repositories.files;
  const location = path.join(context.hexo.base_dir, '.hexo-admin', 'revoked-sessions.json');
  const key = token => crypto.createHash('sha256').update(token).digest('hex');
  let revoked = new Map();
  if (files.exists(location)) {
    const data = JSON.parse(files.readText(location));
    if (!Array.isArray(data) || data.length > 1024 || data.some(item => !Array.isArray(item) || !/^[a-f0-9]{64}$/.test(item[0]) || !Number.isSafeInteger(item[1]))) {
      throw new Error('Invalid session revocation state');
    }
    revoked = new Map(data);
  }
  function prune() {
    const now = Math.floor(Date.now() / 1000);
    for (const [id, expiry] of revoked) if (expiry <= now) revoked.delete(id);
  }
  return {
    isRevoked(token) { prune(); return revoked.has(key(token)); },
    async revoke(token, expiry) {
      prune();
      if (revoked.size >= 1024) {
        // Never evict a still-valid revocation: rotate the signing key instead.
        await context.services.credentials.rotate();
        revoked.clear();
      } else {
        const next = new Map(revoked);
        next.set(key(token), expiry);
        files.mkdir(path.dirname(location));
        files.writeText(location, JSON.stringify([...next]));
        revoked = next;
      }
    }
  };
}

module.exports = { createSessionService };
