'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { badRequest } = require('../../server/errors');

function resolveHexoCli(baseDir) {
  const candidate = path.join(baseDir, 'node_modules', 'hexo-cli', 'bin', 'hexo');
  if (!fs.existsSync(candidate)) throw badRequest('无法定位 Hexo CLI，不能自动重启', 'HEXO_CLI_NOT_FOUND');
  return candidate;
}

function buildRestartPayload(context, port) {
  const serverConfig = context.hexo.config.server || {};
  const value = Number(port || serverConfig.port || context.hexo.config.port || 4000);
  if (!Number.isInteger(value) || value < 1 || value > 65535) throw badRequest('服务端口无效', 'INVALID_SERVER_PORT');
  return {
    parentPid: process.pid,
    node: process.execPath,
    cli: resolveHexoCli(context.hexo.base_dir),
    cwd: context.hexo.base_dir,
    port: value,
    ip: serverConfig.ip || null,
    log: path.join(context.hexo.base_dir, '.hexo-admin', 'restart.log')
  };
}

async function gracefulExit(context, runtime) {
  const exit = runtime && runtime.exit || process.exit;
  try {
    if (typeof context.hexo.unwatch === 'function') await context.hexo.unwatch();
    if (typeof context.hexo.exit === 'function') await context.hexo.exit();
  } catch (error) {
    if (context.hexo.log && typeof context.hexo.log.error === 'function') context.hexo.log.error('Hexo graceful restart cleanup failed: %s', error.message);
  } finally {
    exit(0);
  }
}

async function scheduleRestart(context, port, runtime) {
  const payload = buildRestartPayload(context, port);
  const helper = path.join(__dirname, 'restart-helper.js');
  const child = spawn(process.execPath, [helper, Buffer.from(JSON.stringify(payload)).toString('base64')], {
    cwd: context.hexo.base_dir, detached: true, stdio: 'ignore', windowsHide: true
  });
  await new Promise((resolve, reject) => {
    child.once('spawn', resolve);
    child.once('error', error => {
      try {
        fs.mkdirSync(path.dirname(payload.log), { recursive: true });
        fs.appendFileSync(payload.log, '[' + new Date().toISOString() + '] Failed to start restart helper: ' + error.stack + '\n');
      } catch (_) {}
      reject(error);
    });
  });
  child.unref();
  const timer = runtime && runtime.setTimeout || setTimeout;
  timer(() => { void gracefulExit(context, runtime); }, 750);
  return { scheduled: true, port: payload.port };
}

module.exports = { resolveHexoCli, buildRestartPayload, gracefulExit, scheduleRestart };
