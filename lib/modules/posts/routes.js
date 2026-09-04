'use strict';

const { readJson } = require('../../server/request');
const { success } = require('../../server/response');
const { validate, validateId, validateIntegerQuery } = require('../../server/validation');
const { badRequest } = require('../../server/errors');

const postFields = {
  title: { type: 'string', maxLength: 500 }, date: { type: 'string', maxLength: 64 },
  categories: { type: 'array', maxItems: 100, items: { type: 'string' } }, tags: { type: 'array', maxItems: 100, items: { type: 'string' } }, content: { type: 'string' },
  frontMatter: { type: 'object' }, raw: { type: 'string' }, revision: { type: 'string', pattern: /^[a-f0-9]{64}$/ },
  published: { type: 'boolean' },
  workflowStatus: { type: 'string', enum: ['draft','in_progress','review','scheduled','published'] },
  scaffold: { type: 'string', maxLength: 100 }, layout: { type: 'string', maxLength: 100 }
};

function postRoutes(context) {
  const posts = context.services.posts;
  return [
    { method: 'GET', path: '/posts', handler({ res, query }) { validateIntegerQuery(query.page,'page',{min:1});validateIntegerQuery(query.per_page,'per_page',{min:1,max:100});if(query.status&&!['all','published','draft','in_progress','review','scheduled'].includes(query.status))throw badRequest('status is invalid','VALIDATION_ERROR');success(res,posts.list(query)); } },
    { method: 'GET', path: '/posts/:id', handler({ res, params }) { success(res, posts.get(validateId(params.id))); } },
    { method: 'POST', path: '/posts', async handler({ req, res }) { const body=validate(await readJson(req),{...postFields,title:{...postFields.title,required:true}});success(res,await posts.create(body)); } },
    { method: 'POST', path: '/posts/bulk', async handler({ req, res }) { const body=validate(await readJson(req),{action:{type:'string',required:true,enum:['publish','unpublish','delete']},items:{type:'array',required:true,minItems:1,maxItems:100}});if(!body.items.length)throw badRequest('items is required','VALIDATION_ERROR');const items=body.items.map((item,index)=>validate(item,{id:{type:'string',required:true,maxLength:512},revision:{type:'string',required:true,pattern:/^[a-f0-9]{64}$/}},'items['+index+']'));success(res,await posts.bulk(body.action,items)); } },
    { method: 'POST', path: '/posts/source/parse', async handler({ req, res }) { const body=validate(await readJson(req),{raw:{type:'string',required:true}});success(res,posts.parse(body.raw)); } },
    { method: 'POST', path: '/posts/source/build', async handler({ req, res }) { success(res,{raw:posts.build(validate(await readJson(req),postFields))}); } },
    { method: 'PUT', path: '/posts/:id', async handler({ req, res, params }) { const body=validate(await readJson(req),postFields);success(res,await posts.update(validateId(params.id),body)); } },
    { method: 'DELETE', path: '/posts/:id', async handler({ req, res, params }) { success(res,await posts.remove(validateId(params.id),req.headers['if-match'])); } },
    { method: 'PUT', path: '/posts/:id/publish', async handler({ req, res, params }) { const body=validate(await readJson(req),{published:{type:'boolean',required:true},revision:postFields.revision});success(res,await posts.publish(validateId(params.id),body.published,body.revision)); } }
  ];
}

module.exports = { postRoutes };
