'use strict';

const path = require('path');
const crypto = require('crypto');
const { badRequest, notFound } = require('../../server/errors');

function createScheduleService(context) {
  const files = context.repositories.files;
  const statePath = path.join(context.hexo.base_dir, '.hexo-admin', 'scheduled-posts.json');
  const runtime = context.runtime || {};
  let running = false;
  let items = [];

  try {
    if (files.exists(statePath)) {
      const parsed = JSON.parse(files.readText(statePath));
      if (Array.isArray(parsed.items)) items = parsed.items;
    }
  } catch (error) {
    context.hexo.log.warn('hexo-admin-panel: Cannot read scheduled posts: ' + error.message);
  }

  function persist() {
    files.mkdir(path.dirname(statePath));
    files.writeText(statePath, JSON.stringify({ version: 1, items }, null, 2));
  }

  function now() { return runtime.now ? new Date(runtime.now()) : new Date(); }

  const service = {
    list() { return { items: items.slice().sort((a, b) => a.publishAt.localeCompare(b.publishAt)), total: items.length }; },
    forPost(postId) { return items.find(item => item.postId === postId) || null; },
    schedule(postId, publishAt, revision) {
      const date = new Date(publishAt);
      if (Number.isNaN(date.getTime())) throw badRequest('定时发布时间无效', 'SCHEDULE_DATE_INVALID');
      if (date <= now()) throw badRequest('定时发布时间必须晚于当前时间', 'SCHEDULE_DATE_INVALID');
      const post = context.services.posts.scheduleInfo(postId, revision);
      let item = items.find(current => current.postId === post.postId);
      if (item) {
        Object.assign(item, { publishAt: date.toISOString(), revision: post.revision, status: 'scheduled', updatedAt: now().toISOString() });
        delete item.failedAt; delete item.error; delete item.errorCode;
      }
      else {
        item = {
          id: crypto.randomBytes(12).toString('hex'), postId: post.postId, title: post.title, source: post.source,
          publishAt: date.toISOString(), revision: post.revision, status: 'scheduled', createdAt: now().toISOString()
        };
        items.push(item);
      }
      persist();
      return item;
    },
    cancel(id) {
      const index = items.findIndex(item => item.id === id);
      if (index < 0) throw notFound('定时发布任务不存在', 'SCHEDULE_NOT_FOUND');
      const removed = items.splice(index, 1)[0];
      persist();
      return { id: removed.id, cancelled: true };
    },
    completeForPost(postId) {
      const before = items.length;
      items = items.filter(item => item.postId !== postId);
      if (items.length !== before) persist();
    },
    async tick(value) {
      if (running) return { processed: 0 };
      running = true;
      let processed = 0;
      try {
        const current = value ? new Date(value) : now();
        const due = items.filter(item => item.status === 'scheduled' && new Date(item.publishAt) <= current);
        for (const item of due) {
          try {
            await context.services.posts.publishLatest(item.postId);
            items = items.filter(currentItem => currentItem.id !== item.id);
          } catch (error) {
            item.status = 'failed';
            item.failedAt = now().toISOString();
            item.error = error.message || 'Scheduled publish failed';
            item.errorCode = error.code || 'SCHEDULE_PUBLISH_FAILED';
          }
          processed += 1;
          persist();
        }
        return { processed };
      } finally { running = false; }
    }
  };

  const setIntervalFn = runtime.setInterval || setInterval;
  const interval = setIntervalFn(() => service.tick().catch(error => context.hexo.log.error('hexo-admin-panel: Scheduled publish failed: ' + error.message)), 30000);
  if (interval && typeof interval.unref === 'function') interval.unref();
  return service;
}

module.exports = { createScheduleService };
