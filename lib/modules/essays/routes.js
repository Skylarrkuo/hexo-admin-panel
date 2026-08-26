'use strict';

const { readJson } = require('../../server/request');
const { success } = require('../../server/response');
const { validate, validateId } = require('../../server/validation');
const { badRequest } = require('../../server/errors');

const fields = {
  content: { type: 'string', required: true, minLength: 1, maxLength: 200000 },
  date: { type: 'string', required: true, maxLength: 64 },
  revision: { type: 'string', required: true, pattern: /^[a-f0-9]{64}$/ }
};

function validateEssay(body) {
  const data = validate(body, fields);
  if (!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?$/.test(data.date)) {
    throw badRequest('date: 格式必须为 YYYY-MM-DD HH:mm:ss', 'VALIDATION_ERROR');
  }
  return data;
}

function essayRoutes(context) {
  const essays = context.services.essays;
  return [
    { method: 'GET', path: '/essays', handler({ res }) { success(res, essays.list()); } },
    { method: 'POST', path: '/essays', async handler({ req, res }) { success(res, essays.create(validateEssay(await readJson(req)))); } },
    { method: 'PUT', path: '/essays/:id', async handler({ req, res, params }) { success(res, essays.update(validateId(params.id), validateEssay(await readJson(req)))); } },
    { method: 'DELETE', path: '/essays/:id', handler({ req, res, params }) { success(res, essays.remove(validateId(params.id), req.headers['if-match'])); } }
  ];
}

module.exports = { essayRoutes, validateEssay };
