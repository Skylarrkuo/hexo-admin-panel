'use strict';

const { success } = require('../../server/response');
const { scheduleRestart } = require('./restart');

function commandRoutes(context) {
  const definitions = [
    ['generate', { force: true }, '站点生成完成'],
    ['deploy', {}, '部署完成'],
    ['clean', {}, '缓存已清除']
  ];
  const routes = definitions.map(([command, args, message]) => ({
    method: 'POST', path: '/commands/' + command,
    async handler({ res }) {
      await context.operations.run(() => context.hexo.call(command, args));
      success(res, { message });
    }
  }));
  routes.push({
    method: 'POST', path: '/commands/rebuild',
    async handler({ res }) {
      await context.operations.run(async () => {
        await context.hexo.call('clean', {});
        await context.hexo.call('generate', { force: true });
      });
      success(res, { message: '站点已重新构建' });
    }
  });
  routes.push({
    method: 'POST', path: '/commands/rebuild-restart',
    async handler({ req, res }) {
      await context.operations.run(async () => {
        await context.hexo.call('clean', {});
        await context.hexo.call('generate', { force: true });
      });
      const port = req.socket && req.socket.localPort || context.hexo.config.port || 4000;
      const restart = (context.runtime && context.runtime.scheduleRestart) || scheduleRestart;
      const result = restart(context, port, context.runtime);
      success(res, { message: '站点已重新构建，服务正在重启', ...result }, 202);
    }
  });
  return routes;
}

module.exports = { commandRoutes };
