'use strict';

class HttpError extends Error {
  constructor(statusCode, message, code) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code || ({400:'BAD_REQUEST',401:'UNAUTHORIZED',403:'FORBIDDEN',404:'NOT_FOUND',409:'CONFLICT',413:'PAYLOAD_TOO_LARGE',428:'PRECONDITION_REQUIRED',429:'TOO_MANY_REQUESTS'}[statusCode] || 'INTERNAL_ERROR');
  }
}

function badRequest(message, code) { return new HttpError(400, message, code); }
function unauthorized(message, code) { return new HttpError(401, message || 'Unauthorized', code); }
function forbidden(message, code) { return new HttpError(403, message || 'Forbidden', code); }
function notFound(message, code) { return new HttpError(404, message || 'Not found', code); }
function conflict(message, code) { return new HttpError(409, message || 'Conflict', code); }
function tooManyRequests(message) { return new HttpError(429, message || 'Too many requests', 'LOGIN_RATE_LIMITED'); }
function preconditionRequired(message) { return new HttpError(428, message || 'Precondition required', 'REVISION_REQUIRED'); }

module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, conflict, tooManyRequests, preconditionRequired };
