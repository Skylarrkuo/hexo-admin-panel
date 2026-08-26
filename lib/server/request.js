'use strict';

const { badRequest, HttpError } = require('./errors');

function readBody(req, options) {
  const limit = options && options.limit || 50 * 1024 * 1024;
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    req.on('data', chunk => {
      if (settled) return;
      size += chunk.length;
      if (size > limit) {
        settled = true;
        reject(new HttpError(413, 'Body too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => { if (!settled) resolve(Buffer.concat(chunks)); });
    req.on('error', error => { if (!settled) reject(error); });
  });
}

async function readJson(req) {
  const body = await readBody(req);
  try { return JSON.parse(body.toString('utf8')); }
  catch (_) { throw badRequest('Invalid JSON body', 'INVALID_JSON'); }
}

function parseUrl(url) {
  const value = url || '/';
  const queryIndex = value.indexOf('?');
  const pathname = queryIndex < 0 ? value : value.slice(0, queryIndex);
  const query = {};
  if (queryIndex >= 0) {
    const source = value.slice(queryIndex + 1);
    if (source) source.split('&').forEach(pair => {
      const separator = pair.indexOf('=');
      const rawKey = separator < 0 ? pair : pair.slice(0, separator);
      const rawValue = separator < 0 ? '' : pair.slice(separator + 1);
      query[decodeURIComponent(rawKey.replace(/\+/g, ' '))] = decodeURIComponent(rawValue.replace(/\+/g, ' '));
    });
  }
  return { pathname, query };
}

module.exports = { readBody, readJson, parseUrl };
