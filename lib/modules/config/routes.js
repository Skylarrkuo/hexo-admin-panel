'use strict';

const { readJson } = require('../../server/request');
const { success } = require('../../server/response');
const { validate, validateConfigType, validateId } = require('../../server/validation');

function configRoutes(context) {
  const config = context.services.config;
  return [
    { method: 'GET', path: '/config', handler({ res, query }) { success(res,config.load(validateConfigType(query.type))); } },
    { method: 'POST', path: '/config/source/parse', async handler({ req, res }) { const body=validate(await readJson(req),{raw:{type:'string',required:true}});success(res,{parsed:config.parse(body.raw)}); } },
    { method: 'POST', path: '/config/source/build', async handler({ req, res }) { const body=validate(await readJson(req),{data:{type:'object',required:true}});success(res,{raw:config.build(body.data)}); } },
    { method: 'PUT', path: '/config', async handler({ req, res, query }) { const body=validate(await readJson(req),{type:{type:'string',enum:['site','theme']},raw:{type:'string'},data:{type:'object'},revision:{type:'string',required:true,pattern:/^[a-f0-9]{64}$/}});success(res,config.save(validateConfigType(body.type||query.type),body)); } },
    { method: 'GET', path: '/config/backups', handler({ res, query }) { success(res,config.listBackups(query.type?validateConfigType(query.type):undefined)); } },
    { method: 'POST', path: '/config/backups/:id/restore', async handler({ req, res, params }) { const body=validate(await readJson(req),{revision:{type:'string',required:true,pattern:/^[a-f0-9]{64}$/}});success(res,config.restoreBackup(validateId(params.id),body.revision)); } }
  ];
}

module.exports = { configRoutes };
