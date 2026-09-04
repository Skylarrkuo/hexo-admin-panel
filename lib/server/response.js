'use strict';

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

function sendJson(res, data, statusCode) {
  res.writeHead(statusCode || 200, {
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

function success(res, data, statusCode) {
  sendJson(res, { success: true, ...(data === undefined ? {} : { data }) }, statusCode);
}

function failure(res, error) {
  const statusCode = error && error.statusCode || 500;
  sendJson(res, {
    success: false,
    error: error && error.message || 'Internal server error',
    code: error && error.code || 'INTERNAL_ERROR'
  }, statusCode);
}

module.exports = { SECURITY_HEADERS, success, failure };
