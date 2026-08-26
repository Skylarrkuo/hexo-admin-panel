'use strict';

const { success } = require('../../server/response');
const { countWords } = require('../../shared/text');

function dashboardRoutes(context) {
  const hexo = context.hexo;
  return [
    {
      method: 'GET', path: '/stats', handler({ res }) {
        const posts = hexo.model('Post').find({}).toArray();
        const published = posts.filter(post => post.published !== false);
        const drafts = posts.filter(post => post.published === false);
        const totalWords = posts.reduce((sum, post) => sum + countWords(post.content || post._content || ''), 0);
        const lastUpdated = posts.reduce((max, post) => {
          const date = post.updated || post.date;
          return date > max ? date : max;
        }, new Date(0));
        success(res, {
          posts: published.length, drafts: drafts.length,
          categories: hexo.model('Category').count(), tags: hexo.model('Tag').count(), totalWords,
          lastUpdated: lastUpdated.toISOString ? lastUpdated.toISOString() : lastUpdated
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
