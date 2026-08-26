'use strict';

const { readJson } = require('../../server/request');
const { success } = require('../../server/response');
const { validate } = require('../../server/validation');

function renderRoutes(context) {
  return [{
    method: 'POST', path: '/render',
    async handler({ req, res }) {
      const body = validate(await readJson(req), { content: { type: 'string', required: true } });
      const html = await context.hexo.render.render({ text: body.content || '', engine: 'markdown' });
      success(res, { html });
    }
  }];
}

module.exports = { renderRoutes };
