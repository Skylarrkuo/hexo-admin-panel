'use strict';

const { readJson } = require('../../server/request');
const { success } = require('../../server/response');
const { validate, validateId } = require('../../server/validation');

function taxonomyRoutes(context) {
  const taxonomies = context.services.taxonomies;
  return [
    { method: 'GET', path: '/taxonomies', handler({ res }) { success(res,taxonomies.list()); } },
    { method: 'POST', path: '/taxonomies/:type/merge', async handler({ req,res,params }) { const body=validate(await readJson(req),{sources:{type:'array',required:true,minItems:2,maxItems:100,items:{type:'string'}},target:{type:'string',required:true,maxLength:200}});success(res,await taxonomies.merge(validateId(params.type),body.sources,body.target)); } },
    { method: 'PUT', path: '/taxonomies/:type/:name', async handler({ req,res,params }) { const body=validate(await readJson(req),{name:{type:'string',required:true,maxLength:200}});success(res,await taxonomies.rename(validateId(params.type),validateId(params.name),body.name)); } },
    { method: 'DELETE', path: '/taxonomies/:type/:name', async handler({ res,params }) { success(res,await taxonomies.remove(validateId(params.type),validateId(params.name))); } }
  ];
}

module.exports = { taxonomyRoutes };
