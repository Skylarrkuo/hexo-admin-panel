'use strict';

const { readJson } = require('../../server/request');
const { success } = require('../../server/response');
const { validate } = require('../../server/validation');

const aboutFields = {
  title: { type: 'string', maxLength: 500 },
  date: { type: 'string', maxLength: 64 },
  template: { type: 'string', maxLength: 100 },
  content: { type: 'string' },
  frontMatter: { type: 'object' },
  raw: { type: 'string' },
  revision: { type: 'string', pattern: /^[a-f0-9]{64}$/ }
};

function aboutRoutes(context) {
  const about = context.services.about;
  return [
    { method: 'GET', path: '/about', handler({ res }) { success(res, about.get()); } },
    { method: 'POST', path: '/about/source/parse', async handler({ req, res }) { const body=validate(await readJson(req),{raw:{type:'string',required:true}});success(res,about.parse(body.raw)); } },
    { method: 'POST', path: '/about/source/build', async handler({ req, res }) { success(res,{raw:about.build(validate(await readJson(req),aboutFields))}); } },
    { method: 'PUT', path: '/about', async handler({ req, res }) { const body=validate(await readJson(req),aboutFields);success(res,await about.update(body)); } }
  ];
}

module.exports = { aboutRoutes };
