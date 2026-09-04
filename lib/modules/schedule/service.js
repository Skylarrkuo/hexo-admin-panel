'use strict';

const path = require('path');
const crypto = require('crypto');
const { badRequest, notFound, conflict } = require('../../server/errors');

const ACTIVE_STATES = new Set(['scheduled', 'retrying']);

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
    if (items.length > 200) items = items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 200);
    files.writeText(statePath, JSON.stringify({ version: 2, items }, null, 2));
  }

  function now() { return runtime.now ? new Date(runtime.now()) : new Date(); }
  function history(item, status, message) {
    item.history = Array.isArray(item.history) ? item.history : [];
    item.history.push({ at: now().toISOString(), status, message });
  }

  let recovered = false;
  items.filter(item => item.status === 'running').forEach(item => {
    item.status = 'retrying';
    item.nextAttemptAt = now().toISOString();
    history(item, 'retrying', 'Hexo 服务重启后恢复未完成的发布任务');
    recovered = true;
  });
  if (recovered) persist();

  const service = {
    list(query) {
      let result = items.slice();
      if (query && query.status) result = result.filter(item => item.status === query.status);
      result.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      return { items: result, total: result.length };
    },
    forPost(postId) {
      return items.filter(item => item.postId === postId && (ACTIVE_STATES.has(item.status) || ['running', 'failed'].includes(item.status)))
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0] || null;
    },
    schedule(postId, publishAt, revision, options) {
      const date = new Date(publishAt);
      if (Number.isNaN(date.getTime())) throw badRequest('定时发布时间无效', 'SCHEDULE_DATE_INVALID');
      if (date <= now()) throw badRequest('定时发布时间必须晚于当前时间', 'SCHEDULE_DATE_INVALID');
      const post = context.services.posts.scheduleInfo(postId, revision);
      let item = items.find(current => current.postId === post.postId && ACTIVE_STATES.has(current.status));
      const maxAttempts = Math.min(10, Math.max(1, Number(options && options.maxAttempts) || 3));
      const retryDelayMinutes = Math.min(1440, Math.max(1, Number(options && options.retryDelayMinutes) || 5));
      if (item) {
        Object.assign(item, { publishAt: date.toISOString(), nextAttemptAt: date.toISOString(), revision: post.revision, status: 'scheduled', updatedAt: now().toISOString(), maxAttempts, retryDelayMinutes, attempts: 0 });
        delete item.failedAt; delete item.error; delete item.errorCode; delete item.cancelledAt; delete item.finishedAt;
        history(item, 'scheduled', '定时任务已更新');
      } else {
        item = {
          id: crypto.randomBytes(12).toString('hex'), postId: post.postId, title: post.title, source: post.source,
          publishAt: date.toISOString(), nextAttemptAt: date.toISOString(), revision: post.revision, status: 'scheduled',
          attempts: 0, maxAttempts, retryDelayMinutes, history: [], createdAt: now().toISOString()
        };
        history(item, 'scheduled', '定时任务已创建');
        items.push(item);
      }
      persist();
      return item;
    },
    cancel(id) {
      const item = items.find(current => current.id === id);
      if (!item) throw notFound('定时发布任务不存在', 'SCHEDULE_NOT_FOUND');
      if (!ACTIVE_STATES.has(item.status) && item.status !== 'failed') throw conflict('定时任务已经结束', 'SCHEDULE_NOT_CANCELLABLE');
      item.status = 'cancelled';
      item.cancelledAt = now().toISOString();
      history(item, 'cancelled', '任务已取消');
      persist();
      return { id: item.id, cancelled: true, item };
    },
    retry(id, publishAt) {
      const item = items.find(current => current.id === id);
      if (!item) throw notFound('定时发布任务不存在', 'SCHEDULE_NOT_FOUND');
      if (!['failed', 'cancelled'].includes(item.status)) throw conflict('只有失败或已取消任务可以重试', 'SCHEDULE_NOT_RETRYABLE');
      const date = publishAt ? new Date(publishAt) : now();
      if (Number.isNaN(date.getTime())) throw badRequest('重试时间无效', 'SCHEDULE_DATE_INVALID');
      item.status = 'retrying';
      item.nextAttemptAt = date.toISOString();
      item.attempts = 0;
      item.updatedAt = now().toISOString();
      history(item, 'retrying', '已请求重试');
      delete item.failedAt; delete item.error; delete item.errorCode; delete item.cancelledAt; delete item.finishedAt;
      persist();
      return item;
    },
    completeForPost(postId) {
      let changed = false;
      items.filter(item => item.postId === postId && ACTIVE_STATES.has(item.status)).forEach(item => {
        item.status = 'completed';
        item.finishedAt = now().toISOString();
        history(item, 'completed', '文章已在其他操作中发布');
        changed = true;
      });
      if (changed) persist();
    },
    async tick(value) {
      if (running) return { processed: 0 };
      running = true;
      let processed = 0;
      try {
        const current = value ? new Date(value) : now();
        const due = items.filter(item => ACTIVE_STATES.has(item.status) && new Date(item.nextAttemptAt || item.publishAt) <= current);
        for (const item of due) {
          item.status = 'running';
          item.attempts = Number(item.attempts || 0) + 1;
          item.lastAttemptAt = now().toISOString();
          history(item, 'running', '开始第 ' + item.attempts + ' 次发布');
          persist();
          try {
            await context.services.posts.publishLatest(item.postId);
            item.status = 'completed';
            item.finishedAt = now().toISOString();
            history(item, 'completed', '定时发布成功');
          } catch (error) {
            item.failedAt = now().toISOString();
            item.error = error.message || 'Scheduled publish failed';
            item.errorCode = error.code || 'SCHEDULE_PUBLISH_FAILED';
            if (item.attempts < (item.maxAttempts || 3)) {
              item.status = 'retrying';
              item.nextAttemptAt = new Date(now().getTime() + (item.retryDelayMinutes || 5) * 60000).toISOString();
              history(item, 'retrying', item.error);
            } else {
              item.status = 'failed';
              history(item, 'failed', item.error);
            }
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

module.exports = { ACTIVE_STATES, createScheduleService };
