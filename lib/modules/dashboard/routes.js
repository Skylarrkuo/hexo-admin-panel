'use strict';

const { success } = require('../../server/response');

function dashboardRoutes(context) {
  const hexo = context.hexo;
  return [
    {
      method: 'GET', path: '/stats', handler({ res }) {
        const summary = context.services.posts.summary();
        success(res, {
          posts: summary.published, drafts: summary.drafts,
          categories: hexo.model('Category').count(), tags: hexo.model('Tag').count(), totalWords: summary.totalWords,
          lastUpdated: summary.lastUpdated.toISOString()
        });
      }
    },
    {
      method: 'GET', path: '/categories', handler({ res }) {
        const categories = hexo.model('Category').find({}).toArray().map(item => ({ name: item.name, slug: item.slug, count: item.length }));
        success(res, categories);
      }
    },
    {
      method: 'GET', path: '/tags', handler({ res }) {
        const tags = hexo.model('Tag').find({}).toArray().map(item => ({ name: item.name, slug: item.slug, count: item.length }));
        success(res, tags);
      }
    }
  ];
}

module.exports = { dashboardRoutes };
