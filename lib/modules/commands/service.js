'use strict';

const path = require('path');
const crypto = require('crypto');
const { notFound } = require('../../server/errors');

const ACTIVE_STATES = new Set(['queued', 'running']);

function createCommandService(context) {
  const files = context.repositories.files;
  const jobsDir = path.join(context.hexo.base_dir, '.hexo-admin', 'jobs');
  const runtime = context.runtime || {};
  const jobs = new Map();
  const running = new Map();
  files.mkdir(jobsDir);

  function now() {
    const value = runtime.now ? runtime.now() : Date.now();
    return new Date(value).toISOString();
  }

  function jobPath(id) { return path.join(jobsDir, id + '.json'); }
  function persist(job) { files.writeText(jobPath(job.id), JSON.stringify(job, null, 2)); }
  function present(job) { return JSON.parse(JSON.stringify(job)); }

  function append(job, message, level) {
    job.logs.push({ at: now(), level: level || 'info', message: String(message) });
    if (job.logs.length > 200) job.logs = job.logs.slice(-200);
    persist(job);
  }

  function prune() {
    const ordered = [...jobs.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    ordered.slice(50).filter(job => !ACTIVE_STATES.has(job.status)).forEach(job => {
      jobs.delete(job.id);
      if (files.exists(jobPath(job.id))) files.remove(jobPath(job.id));
    });
  }

  files.list(jobsDir).filter(name => /^[a-f0-9]{24}\.json$/.test(name)).forEach(name => {
    try {
      const job = JSON.parse(files.readText(path.join(jobsDir, name)));
      if (!job || !job.id) return;
      if (ACTIVE_STATES.has(job.status)) {
        job.status = 'failed';
        job.finishedAt = now();
        job.error = 'Hexo 服务在任务完成前停止';
        job.errorCode = 'COMMAND_INTERRUPTED';
        job.logs = Array.isArray(job.logs) ? job.logs : [];
        append(job, job.error, 'error');
      }
      jobs.set(job.id, job);
    } catch (error) {
      context.hexo.log.warn('hexo-admin-panel: Cannot read command job ' + name + ': ' + error.message);
    }
  });
  prune();

  function start(command, executor) {
    const job = {
      id: crypto.randomBytes(12).toString('hex'),
      command,
      status: 'queued',
      createdAt: now(),
      startedAt: null,
      finishedAt: null,
      logs: []
    };
    jobs.set(job.id, job);
    append(job, '任务已进入执行队列');
    prune();
    const execution = context.operations.run(async () => {
      job.status = 'running';
      job.startedAt = now();
      append(job, '任务开始执行');
      try {
        const result = await executor((message, level) => append(job, message, level));
        job.status = 'completed';
        job.result = result || {};
        job.finishedAt = now();
        append(job, '任务执行完成', 'success');
      } catch (error) {
        job.status = 'failed';
        job.finishedAt = now();
        job.error = error && error.message || 'Command failed';
        job.errorCode = error && error.code || 'COMMAND_FAILED';
        append(job, job.error, 'error');
      }
      return present(job);
    });
    const promise = execution.catch(error => {
      job.status = 'failed';
      job.finishedAt = now();
      job.error = error && error.message || 'Command state could not be persisted';
      job.errorCode = error && error.code || 'COMMAND_STATE_FAILED';
      if (context.hexo.log && typeof context.hexo.log.error === 'function') {
        context.hexo.log.error('hexo-admin-panel: Command job failed: ' + job.error);
      }
      return present(job);
    }).finally(() => running.delete(job.id));
    running.set(job.id, promise);
    return present(job);
  }

  return {
    start,
    async wait(id) {
      if (running.has(id)) await running.get(id);
      return this.get(id);
    },
    note(id, message, level) {
      const job = jobs.get(id);
      if (!job) throw notFound('命令任务不存在', 'COMMAND_JOB_NOT_FOUND');
      append(job, message, level);
      return present(job);
    },
    get(id) {
      const job = jobs.get(id);
      if (!job) throw notFound('命令任务不存在', 'COMMAND_JOB_NOT_FOUND');
      return present(job);
    },
    list(limit) {
      const size = Math.min(50, Math.max(1, Number(limit) || 20));
      const items = [...jobs.values()]
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, size)
        .map(present);
      return { items, total: jobs.size };
    }
  };
}

module.exports = { ACTIVE_STATES, createCommandService };
