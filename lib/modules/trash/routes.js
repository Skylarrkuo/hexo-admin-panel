'use strict';

const { success } = require('../../server/response');
const { validateId } = require('../../server/validation');
const { badRequest } = require('../../server/errors');

function trashRoutes(context) {
  const trash = context.services.trash;
  return [
    { method: 'GET', path: '/trash', handler({ res, query }) { if(query.kind&&!['post','page','media','post-asset'].includes(query.kind))throw badRequest('kind must be post, page, media or post-asset','VALIDATION_ERROR');success(res,trash.list(query)); } },
    { method: 'POST', path: '/trash/:id/restore', async handler({ res, params }) { success(res,await trash.restore(validateId(params.id))); } },
    { method: 'DELETE', path: '/trash/:id', handler({ res, params }) { trash.remove(validateId(params.id));success(res); } }
  ];
}

module.exports = { trashRoutes };
