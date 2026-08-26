'use strict';

function sendJson(res, data, statusCode) {
  res.writeHead(statusCode || 200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
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

module.exports = { success, failure };
