'use strict';

const { success } = require('../../server/response');
const { validateId } = require('../../server/validation');

function scaffoldRoutes(context) {
  const scaffolds = context.services.scaffolds;
  return [
    { method: 'GET', path: '/scaffolds', handler({ res }) { success(res, scaffolds.list()); } },
    { method: 'GET', path: '/scaffolds/:name', handler({ res, params }) { success(res, scaffolds.get(validateId(params.name, 'scaffold'))); } }
  ];
}

module.exports = { scaffoldRoutes };
