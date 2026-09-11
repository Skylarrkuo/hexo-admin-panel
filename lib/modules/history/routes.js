'use strict';
const { success } = require('../../server/response');
const { readJson } = require('../../server/request');
const { validate } = require('../../server/validation');

function historyRoutes(context) {
  return [
    { method: 'GET', path: '/history', handler({ res, query }) { success(res, context.services.history.list(query.source)); } },
    { method: 'GET', path: '/history/:id', handler({ res, params }) { success(res, context.services.history.preview(params.id)); } },
    { method: 'POST', path: '/history/:id/restore', async handler({ req, res, params }) { const body=validate(await readJson(req), { revision: {type:'string',required:true} });success(res, await context.services.history.restore(params.id, body.revision)); } },
    { method: 'GET', path: '/checks', handler({ res,query }) { success(res, context.services.checks.run({includeDrafts:query.include_drafts==='true'})); } },
    { method: 'POST', path: '/publishing/run', async handler({ req, res }) { const body=validate(await readJson(req), { revision: {type:'string',required:true} });success(res, context.services.publishing.start(body.revision), 202); } },
    { method: 'GET', path: '/recovery', handler({ res }) { success(res, context.services.recovery.list()); } },
    { method: 'GET', path: '/recovery/:id', handler({ res, params }) { success(res, context.services.recovery.preview(params.id)); } },
    { method: 'POST', path: '/recovery/:id/restore', async handler({ req, res, params }) { const body=validate(await readJson(req), { revision: {type:'string',required:true} });success(res, await context.services.recovery.restore(params.id, body.revision)); } }
  ];
}
module.exports = { historyRoutes };
