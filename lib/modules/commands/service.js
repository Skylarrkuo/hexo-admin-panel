'use strict';

const path = require('path');
const crypto = require('crypto');
const { notFound, badRequest, conflict } = require('../../server/errors');

const ACTIVE_STATES = new Set(['queued', 'running', 'cancelling']);

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

  function setProgress(job, value, message) {
    const next = Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
    if (next < job.progress) return;
    job.progress = next;
    if (message) append(job, message);
    else persist(job);
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

  function start(command, executor, metadata) {
    const job = {
      id: crypto.randomBytes(12).toString('hex'),
      command,
      status: 'queued',
      progress: 0,
      cancelRequested: false,
      retryOf: metadata && metadata.retryOf || null,
      createdAt: now(),
      startedAt: null,
      finishedAt: null,
      logs: []
    };
    jobs.set(job.id, job);
    append(job, '任务已进入执行队列');
    prune();
    const execution = context.operations.run(async () => {
      if (job.cancelRequested) {
        job.status = 'cancelled';
        job.finishedAt = now();
        append(job, '任务在开始前已取消', 'warning');
        return present(job);
      }
      job.status = 'running';
      job.startedAt = now();
      setProgress(job, 1);
      append(job, '任务开始执行');
      try {
        const control = (message, level) => append(job, message, level);
        control.log = control;
        control.progress = (value, message) => setProgress(job, value, message);
        control.isCancelled = () => job.cancelRequested;
        control.throwIfCancelled = () => {
          if (job.cancelRequested) {
            const error = new Error('任务已取消');
            error.code = 'COMMAND_CANCELLED';
            throw error;
          }
        };
        const result = await executor(control);
        control.throwIfCancelled();
        job.status = 'completed';
        job.progress = 100;
        job.result = result || {};
        job.finishedAt = now();
        append(job, '任务执行完成', 'success');
      } catch (error) {
        job.status = error && error.code === 'COMMAND_CANCELLED' ? 'cancelled' : 'failed';
        job.finishedAt = now();
        job.error = error && error.message || 'Command failed';
        job.errorCode = error && error.code || 'COMMAND_FAILED';
        append(job, job.error, job.status === 'cancelled' ? 'warning' : 'error');
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
    cancel(id) {
      const job = jobs.get(id);
      if (!job) throw notFound('命令任务不存在', 'COMMAND_JOB_NOT_FOUND');
      if (!ACTIVE_STATES.has(job.status)) throw conflict('任务已经结束，无法取消', 'COMMAND_NOT_CANCELLABLE');
      job.cancelRequested = true;
      job.status = job.status === 'queued' ? 'cancelling' : job.status;
      append(job, job.status === 'cancelling' ? '已取消排队任务' : '已请求取消；当前 Hexo 阶段结束后停止', 'warning');
      return present(job);
    },
    retry(id, executor) {
      const source = jobs.get(id);
      if (!source) throw notFound('命令任务不存在', 'COMMAND_JOB_NOT_FOUND');
      if (!['failed', 'cancelled'].includes(source.status)) throw conflict('只有失败或已取消任务可以重试', 'COMMAND_NOT_RETRYABLE');
      if (typeof executor !== 'function') throw badRequest('此任务类型不支持重试', 'COMMAND_NOT_RETRYABLE');
      return start(source.command, executor, { retryOf: source.id });
    },
    get(id) {
      const job = jobs.get(id);
      if (!job) throw notFound('命令任务不存在', 'COMMAND_JOB_NOT_FOUND');
      return present(job);
    },
    list(limit, filters) {
      const size = Math.min(50, Math.max(1, Number(limit) || 20));
      let values = [...jobs.values()];
      if (filters && filters.status) values = values.filter(job => job.status === filters.status);
      if (filters && filters.command) values = values.filter(job => job.command === filters.command);
      const items = values
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, size)
        .map(present);
      return { items, total: values.length };
    }
  };
}

module.exports = { ACTIVE_STATES, createCommandService };
