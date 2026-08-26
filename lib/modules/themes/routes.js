'use strict';

const { success } = require('../../server/response');

function themeRoutes(context) {
  return [{ method: 'GET', path: '/themes', handler({ res }) { success(res, context.services.themes.list()); } }];
}

module.exports = { themeRoutes };
