'use strict';

const { readJson } = require('../../server/request');
const { success } = require('../../server/response');
const { validate, validateId } = require('../../server/validation');
const { badRequest } = require('../../server/errors');
const { siteTimestamp } = require('../../shared/hexo-native');

const fields = {
  content: { type: 'string', required: true, minLength: 1, maxLength: 200000 },
  date: { type: 'string', required: true, maxLength: 64 },
  revision: { type: 'string', required: true, pattern: /^[a-f0-9]{64}$/ }
};

function validateEssay(body, timeZone) {
  const data = validate(body, fields);
  if (!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?$/.test(data.date)) {
    throw badRequest('date: 格式必须为 YYYY-MM-DD HH:mm:ss', 'VALIDATION_ERROR');
  }
  if (!data.content.trim()) throw badRequest('随笔内容不能为空', 'VALIDATION_ERROR');
  siteTimestamp(data.date, timeZone);
  return data;
}

function validateBatch(body, timeZone) {
  validate(body, { revision: fields.revision, entries: { type: 'array', required: true, maxItems: 100 } });
  if (!body.entries.length) throw badRequest('请至少添加一条随笔', 'VALIDATION_ERROR');
  const ids = new Set();
  const entries = body.entries.map((entry, index) => {
    try {
      validate(entry, { content: fields.content, date: fields.date, id: { type: 'string', minLength: 1, maxLength: 512 }, createId: { type: 'string', pattern: /^[a-f0-9]{32}$/ } });
      validateEssay({ ...entry, revision: body.revision }, timeZone);
      const identity = entry.id || entry.createId;
      if (identity) {
        if (ids.has(identity)) throw badRequest('同一篇随笔不能重复提交', 'VALIDATION_ERROR');
        ids.add(identity);
      }
      return { id: entry.id || undefined, createId: entry.createId || undefined, content: entry.content, date: entry.date };
    } catch (error) { throw badRequest('第 ' + (index + 1) + ' 条：' + error.message, 'VALIDATION_ERROR'); }
  });
  return { revision: body.revision, entries };
}

function essayRoutes(context) {
  const essays = context.services.essays;
  return [
    { method: 'GET', path: '/essays', handler({ res }) { success(res, essays.list()); } },
    { method: 'POST', path: '/essays/batch', async handler({ req, res }) { success(res, essays.batch(validateBatch(await readJson(req), context.hexo.config.timezone))); } },
    { method: 'POST', path: '/essays', async handler({ req, res }) { success(res, essays.create(validateEssay(await readJson(req), context.hexo.config.timezone))); } },
    { method: 'PUT', path: '/essays/:id', async handler({ req, res, params }) { success(res, essays.update(validateId(params.id), validateEssay(await readJson(req), context.hexo.config.timezone))); } },
    { method: 'DELETE', path: '/essays/:id', handler({ req, res, params }) { success(res, essays.remove(validateId(params.id), req.headers['if-match'])); } }
  ];
}

module.exports = { essayRoutes, validateEssay };
