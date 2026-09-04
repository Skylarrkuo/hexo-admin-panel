'use strict';

const { parseUrl } = require('./request');
const { failure } = require('./response');
const { authenticate } = require('./authenticate');
const { forbidden, badRequest } = require('./errors');

function compilePattern(pattern) {
  const names = [];
  const escaped = pattern.split('/').map(segment => {
    if (segment.startsWith(':')) { names.push(segment.slice(1)); return '([^/]+)'; }
    if (segment.startsWith('*')) { names.push(segment.slice(1)); return '(.*)'; }
    return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('/');
  return { regex: new RegExp('^' + escaped + '$'), names };
}

function createRouter(options) {
  const routes = [];
  const config = options && options.config || {};

  function add(method, pattern, handler, routeOptions) {
    const compiled = compilePattern(pattern);
    routes.push({
      method: method.toUpperCase(), pattern, handler,
      public: routeOptions && routeOptions.public,
      allowPasswordChange: routeOptions && routeOptions.allowPasswordChange,
      ...compiled
    });
  }

  function register(definitions) {
    definitions.forEach(route => add(route.method, route.path, route.handler, route));
  }

  function handler(req, res, next) {
    let parsed;
    try { parsed = parseUrl(req.url); }
    catch (_) { failure(res, badRequest('Invalid URL encoding', 'INVALID_URL')); return; }
    const method = String(req.method || 'GET').toUpperCase();
    for (const route of routes) {
      if (route.method !== method) continue;
      const match = parsed.pathname.match(route.regex);
      if (!match) continue;
      const params = {};
      try { route.names.forEach((name, index) => { params[name] = decodeURIComponent(match[index + 1]); }); }
      catch (_) { failure(res, badRequest('Invalid path parameter encoding', 'INVALID_URL')); return; }
      Promise.resolve().then(() => {
        if (!route.public) {
          const user = authenticate(req, config);
          if (user.mustChangePassword && !route.allowPasswordChange) {
            throw forbidden('首次登录必须先修改默认密码', 'PASSWORD_CHANGE_REQUIRED');
          }
        }
        return route.handler({ req, res, params, query: parsed.query });
      }).catch(error => {
        if (!res.headersSent && !res.writableEnded) failure(res, error);
      });
      return;
    }
    return next();
  }

  return { add, register, handler, routes };
}

module.exports = { createRouter, compilePattern };
