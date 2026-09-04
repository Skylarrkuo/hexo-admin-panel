'use strict';

const { readJson } = require('../../server/request');
const { success } = require('../../server/response');
const { validate, validateId } = require('../../server/validation');

const pageFields = {
  title: { type: 'string', maxLength: 500 }, date: { type: 'string', maxLength: 64 },
  layout: { type: 'string', maxLength: 100 }, template: { type: 'string', maxLength: 100 },
  scaffold: { type: 'string', maxLength: 100 }, content: { type: 'string' }, frontMatter: { type: 'object' },
  raw: { type: 'string' }, revision: { type: 'string', pattern: /^[a-f0-9]{64}$/ }
};

function pageRoutes(context) {
  const pages = context.services.pages;
  return [
    { method: 'GET', path: '/pages', handler({ res }) { success(res, pages.list()); } },
    { method: 'POST', path: '/pages', async handler({ req, res }) { const body=validate(await readJson(req),{...pageFields,path:{type:'string',required:true,maxLength:500},title:{type:'string',required:true,maxLength:500}});success(res,await pages.create(body)); } },
    { method: 'GET', path: '/pages/menu', handler({ res }) { success(res, pages.menu()); } },
    { method: 'PUT', path: '/pages/menu', async handler({ req, res }) { const body=validate(await readJson(req),{items:{type:'array',required:true,maxItems:200},revision:{type:'string',required:true,pattern:/^[a-f0-9]{64}$/}});const items=body.items.map((item,index)=>validate(item,{label:{type:'string',required:true,maxLength:200},path:{type:'string',required:true,maxLength:1000},icon:{type:'string',maxLength:200}},'items['+index+']'));success(res,pages.updateMenu(items,body.revision)); } },
    { method: 'POST', path: '/pages/source/parse', async handler({ req, res }) { const body=validate(await readJson(req),{raw:{type:'string',required:true}});success(res,pages.parse(body.raw)); } },
    { method: 'POST', path: '/pages/source/build', async handler({ req, res }) { success(res,{raw:pages.build(validate(await readJson(req),pageFields))}); } },
    { method: 'GET', path: '/pages/:id', handler({ res, params }) { success(res,pages.get(validateId(params.id,'page id'))); } },
    { method: 'PUT', path: '/pages/:id', async handler({ req, res, params }) { success(res,await pages.update(validateId(params.id,'page id'),validate(await readJson(req),pageFields))); } },
    { method: 'DELETE', path: '/pages/:id', async handler({ req, res, params }) { success(res,await pages.remove(validateId(params.id,'page id'),req.headers['if-match'])); } }
  ];
}

module.exports = { pageFields, pageRoutes };
