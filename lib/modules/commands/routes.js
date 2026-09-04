'use strict';

const { success } = require('../../server/response');
const { scheduleRestart } = require('./restart');
const { HttpError } = require('../../server/errors');
const { validateId, validateIntegerQuery } = require('../../server/validation');

function commandRoutes(context) {
  const jobs = context.services.commands;
  const definitions = [
    ['generate', { force: true }, '站点生成完成'],
    ['deploy', {}, '部署完成'],
    ['clean', {}, '缓存已清除']
  ];
  const routes = definitions.map(([command, args, message]) => ({
    method: 'POST', path: '/commands/' + command,
    handler({ res }) {
      const job = jobs.start(command, async log => {
        log('正在执行 hexo ' + command);
        await context.hexo.call(command, args);
        return { message };
      });
      success(res, { message: '任务已创建', job }, 202);
    }
  }));
  routes.unshift(
    { method: 'GET', path: '/commands/jobs', handler({ res, query }) { const limit=validateIntegerQuery(query.limit,'limit',{min:1,max:50});success(res,jobs.list(limit)); } },
    { method: 'GET', path: '/commands/jobs/:id', handler({ res, params }) { success(res,jobs.get(validateId(params.id,'job id'))); } }
  );
  routes.push({
    method: 'POST', path: '/commands/rebuild',
    handler({ res }) {
      const job = jobs.start('rebuild', async log => {
        log('正在清理站点缓存');
        await context.hexo.call('clean', {});
        log('正在生成静态站点');
        await context.hexo.call('generate', { force: true });
        return { message: '站点已重新构建' };
      });
      success(res, { message: '任务已创建', job }, 202);
    }
  });
  routes.push({
    method: 'POST', path: '/commands/rebuild-restart',
    async handler({ req, res }) {
      const job = jobs.start('rebuild-restart', async log => {
        log('正在清理站点缓存');
        await context.hexo.call('clean', {});
        log('正在生成静态站点');
        await context.hexo.call('generate', { force: true });
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
