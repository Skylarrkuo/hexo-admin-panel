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
  const value = Number(port || context.hexo.config.port || 4000);
  if (!Number.isInteger(value) || value < 1 || value > 65535) throw badRequest('服务端口无效', 'INVALID_SERVER_PORT');
  return {
    parentPid: process.pid,
    node: process.execPath,
    cli: resolveHexoCli(context.hexo.base_dir),
    cwd: context.hexo.base_dir,
    port: value,
    log: path.join(context.hexo.base_dir, '.hexo-admin', 'restart.log')
  };
}

function scheduleRestart(context, port, runtime) {
  const payload = buildRestartPayload(context, port);
  const helper = path.join(__dirname, 'restart-helper.js');
  const child = spawn(process.execPath, [helper, Buffer.from(JSON.stringify(payload)).toString('base64')], {
    cwd: context.hexo.base_dir, detached: true, stdio: 'ignore', windowsHide: true
  });
  child.unref();
  const exit = runtime && runtime.exit || process.exit;
  const timer = runtime && runtime.setTimeout || setTimeout;
  timer(() => exit(0), 350);
  return { scheduled: true, port: payload.port };
}

module.exports = { resolveHexoCli, buildRestartPayload, scheduleRestart };
