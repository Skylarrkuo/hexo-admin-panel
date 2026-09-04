'use strict';

const { readJson } = require('../../server/request');
const { success } = require('../../server/response');
const { validate, validateId } = require('../../server/validation');

function scheduleRoutes(context) {
  const scheduler = context.services.scheduler;
  return [
    { method: 'GET', path: '/schedules', handler({ res, query }) { success(res, scheduler.list(query)); } },
    { method: 'POST', path: '/posts/:id/schedule', async handler({ req, res, params }) { const body=validate(await readJson(req),{publishAt:{type:'string',required:true,maxLength:64},revision:{type:'string',required:true,pattern:/^[a-f0-9]{64}$/},maxAttempts:{type:'number',min:1,max:10},retryDelayMinutes:{type:'number',min:1,max:1440}});success(res,scheduler.schedule(validateId(params.id),body.publishAt,body.revision,body)); } },
    { method: 'POST', path: '/schedules/:id/retry', async handler({ req, res, params }) { const body=validate(await readJson(req),{publishAt:{type:'string',maxLength:64}});success(res,scheduler.retry(validateId(params.id),body.publishAt)); } },
    { method: 'DELETE', path: '/schedules/:id', handler({ res, params }) { success(res,scheduler.cancel(validateId(params.id))); } }
  ];
}

module.exports = { scheduleRoutes };
