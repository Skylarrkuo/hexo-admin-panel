'use strict';

const util = require('util');
const { success } = require('../../server/response');
const { scheduleRestart } = require('./restart');
const { HttpError } = require('../../server/errors');
const { validateId, validateIntegerQuery } = require('../../server/validation');

function commandRoutes(context) {
  const jobs = context.services.commands;
  const definitions = {
    generate: { args: { force: true }, message: '站点生成完成', start: '正在执行 hexo generate', end: 92 },
    deploy: { args: {}, message: '部署完成', start: '正在执行 hexo deploy', end: 95 },
    clean: { args: {}, message: '缓存已清除', start: '正在执行 hexo clean', end: 90 }
  };
  async function captureHexoLogs(control, operation) {
    const logger = context.hexo.log || {};
    const methods = ['debug', 'info', 'warn', 'error'];
    const originals = new Map();
    methods.forEach(method => {
      if (typeof logger[method] !== 'function') return;
      const original = logger[method];
      originals.set(method, original);
      logger[method] = function capturedLog(...args) {
        control.log(util.format(...args), method === 'error' ? 'error' : method === 'warn' ? 'warning' : 'info');
        return original.apply(this, args);
      };
    });
    try { return await operation(); }
    finally { originals.forEach((original, method) => { logger[method] = original; }); }
  }
  function runner(command) {
    const definition = definitions[command];
    if (definition) return async control => {
      control.progress(8, definition.start);
      control.throwIfCancelled();
      await captureHexoLogs(control, () => context.hexo.call(command, definition.args));
      control.progress(definition.end, 'Hexo ' + command + ' 阶段已完成');
      control.throwIfCancelled();
      return { message: definition.message };
    };
    if (command === 'rebuild') return async control => {
      control.progress(5, '正在清理站点缓存');
      await captureHexoLogs(control, () => context.hexo.call('clean', {}));
      control.throwIfCancelled();
      control.progress(35, '正在生成静态站点');
      await captureHexoLogs(control, () => context.hexo.call('generate', { force: true }));
      control.progress(95, '静态站点生成完成');
      control.throwIfCancelled();
      return { message: '站点已重新构建' };
    };
    return null;
  }
  const routes = Object.keys(definitions).map(command => ({
    method: 'POST', path: '/commands/' + command,
    handler({ res }) {
      const job = jobs.start(command, runner(command));
      success(res, { message: '任务已创建', job }, 202);
    }
  }));
  routes.unshift(
    { method: 'GET', path: '/commands/jobs', handler({ res, query }) { const limit=validateIntegerQuery(query.limit,'limit',{min:1,max:50});success(res,jobs.list(limit,{status:query.status,command:query.command})); } },
    { method: 'GET', path: '/commands/jobs/:id', handler({ res, params }) { success(res,jobs.get(validateId(params.id,'job id'))); } }
  );
  routes.push(
    { method: 'POST', path: '/commands/jobs/:id/cancel', handler({ res, params }) { success(res,jobs.cancel(validateId(params.id,'job id')),202); } },
    { method: 'POST', path: '/commands/jobs/:id/retry', handler({ res, params }) { const id=validateId(params.id,'job id');const source=jobs.get(id);success(res,{job:jobs.retry(id,runner(source.command))},202); } }
  );
  routes.push({
    method: 'POST', path: '/commands/rebuild',
    handler({ res }) {
      const job = jobs.start('rebuild', runner('rebuild'));
      success(res, { message: '任务已创建', job }, 202);
    }
  });
  routes.push({
    method: 'POST', path: '/commands/rebuild-restart',
    async handler({ req, res }) {
      const job = jobs.start('rebuild-restart', async control => {
        control.progress(5, '正在清理站点缓存');
        await captureHexoLogs(control, () => context.hexo.call('clean', {}));
        control.throwIfCancelled();
        control.progress(35, '正在生成静态站点');
        await captureHexoLogs(control, () => context.hexo.call('generate', { force: true }));
        control.progress(90, '正在安排 Hexo 服务重启');
        control.throwIfCancelled();
        return { message: '站点已重新构建' };
      });
      const completed = await jobs.wait(job.id);
      if (completed.status === 'failed') throw new HttpError(500, completed.error, completed.errorCode);
      const port = req.socket && req.socket.localPort || context.hexo.config.port || 4000;
      const restart = (context.runtime && context.runtime.scheduleRestart) || scheduleRestart;
      const result = await restart(context, port, context.runtime);
      jobs.note(job.id, '新的 Hexo 服务进程已安排启动');
      success(res, { message: '站点已重新构建，服务正在重启', previousInstanceId: context.instanceId, job: jobs.get(job.id), ...result }, 202);
    }
  });
  return routes;
}

module.exports = { commandRoutes };
