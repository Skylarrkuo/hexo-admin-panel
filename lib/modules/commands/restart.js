'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { badRequest } = require('../../server/errors');

const SUPERVISED_ENV = 'HEXO_ADMIN_PANEL_SUPERVISED';
const RESTART_EXIT_CODE = 75;

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
    node: process.execPath,
    cli: resolveHexoCli(context.hexo.base_dir),
    cwd: context.hexo.base_dir,
    port: value,
    ip: serverConfig.ip || null,
    log: path.join(context.hexo.base_dir, '.hexo-admin', 'restart.log')
  };
}

function appendRestartLog(payload, message) {
  try {
    fs.mkdirSync(path.dirname(payload.log), { recursive: true });
    fs.appendFileSync(payload.log, '[' + new Date().toISOString() + '] ' + message + '\n');
  } catch (_) {}
}

function findListeningServer(port, runtime) {
  if (runtime && runtime.server) return runtime.server;
  const getActiveHandles = runtime && runtime.getActiveHandles || process._getActiveHandles;
  if (typeof getActiveHandles !== 'function') return null;
  return getActiveHandles.call(process).find(handle => {
    if (!handle || typeof handle.close !== 'function' || typeof handle.address !== 'function') return false;
    try {
      const address = handle.address();
      return Boolean(address && address.port === port);
    } catch (_) {
      return false;
    }
  }) || null;
}

function closeServer(server, runtime) {
  if (!server || typeof server.close !== 'function') {
    return Promise.reject(badRequest('无法获取当前 Hexo 服务监听器，不能安全重启', 'HEXO_SERVER_NOT_FOUND'));
  }
  if (server.listening === false) return Promise.resolve();
  const setTimer = runtime && runtime.setTimeout || setTimeout;
  const clearTimer = runtime && runtime.clearTimeout || clearTimeout;
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = error => {
      if (settled) return;
      settled = true;
      clearTimer(timeout);
      if (error && error.code !== 'ERR_SERVER_NOT_RUNNING') reject(error);
      else resolve();
    };
    const timeout = setTimer(() => {
      if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
      finish();
    }, 5000);
    try {
      server.close(finish);
      if (typeof server.closeIdleConnections === 'function') server.closeIdleConnections();
    } catch (error) {
      finish(error);
    }
  });
}

async function gracefulShutdown(context, server, runtime) {
  await closeServer(server, runtime);
  try {
    if (typeof context.hexo.unwatch === 'function') await context.hexo.unwatch();
    if (typeof context.hexo.exit === 'function') await context.hexo.exit();
  } catch (error) {
    if (context.hexo.log && typeof context.hexo.log.error === 'function') {
      context.hexo.log.error('Hexo graceful restart cleanup failed: %s', error.message);
    }
  }
}

function isSupervised(runtime) {
  const env = runtime && runtime.env || process.env;
  const connected = runtime && Object.hasOwn(runtime, 'connected') ? runtime.connected : process.connected;
  return env[SUPERVISED_ENV] === '1' && connected !== false;
}

function replacementArgs(payload) {
  const args = [payload.cli, 'server', '--port', String(payload.port)];
  if (payload.ip) args.push('--ip', payload.ip);
  return args;
}

function superviseReplacement(payload, runtime) {
  const spawnProcess = runtime && runtime.spawn || spawn;
  const exit = runtime && runtime.exit || process.exit;
  const parentEnv = runtime && runtime.env || process.env;

  function launch() {
    appendRestartLog(payload, 'starting foreground replacement Hexo process');
    const child = spawnProcess(payload.node, replacementArgs(payload), {
      cwd: payload.cwd,
      detached: false,
      stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
      windowsHide: false,
      env: { ...parentEnv, [SUPERVISED_ENV]: '1' }
    });
    let finished = false;
    child.once('spawn', () => {
      appendRestartLog(payload, 'replacement Hexo process started (PID ' + child.pid + '); terminal remains attached');
    });
    child.once('error', error => {
      if (finished) return;
      finished = true;
      appendRestartLog(payload, 'failed to start replacement Hexo process: ' + error.stack);
      exit(1);
    });
    child.once('exit', (code, signal) => {
      if (finished) return;
      finished = true;
      if (code === RESTART_EXIT_CODE) {
        appendRestartLog(payload, 'supervised Hexo process requested another restart');
        launch();
        return;
      }
      const exitCode = Number.isInteger(code) ? code : (signal === 'SIGINT' ? 130 : signal === 'SIGTERM' ? 143 : 1);
      appendRestartLog(payload, 'replacement Hexo process stopped (code ' + code + ', signal ' + signal + ')');
      exit(exitCode);
    });
    return child;
  }

  return launch();
}

async function handoffRestart(context, payload, server, runtime) {
  appendRestartLog(payload, 'restart requested; releasing port ' + payload.port);
  await gracefulShutdown(context, server, runtime);
  if (isSupervised(runtime)) {
    appendRestartLog(payload, 'notifying foreground supervisor to replace this Hexo process');
    const exit = runtime && runtime.exit || process.exit;
    exit(RESTART_EXIT_CODE);
    return null;
  }
  return superviseReplacement(payload, runtime);
}

async function scheduleRestart(context, port, runtime, currentServer) {
  const payload = buildRestartPayload(context, port);
  const server = currentServer || findListeningServer(payload.port, runtime);
  if (!server) throw badRequest('无法获取当前 Hexo 服务监听器，不能安全重启', 'HEXO_SERVER_NOT_FOUND');
  const timer = runtime && runtime.setTimeout || setTimeout;
  timer(() => {
    void handoffRestart(context, payload, server, runtime).catch(error => {
      appendRestartLog(payload, 'foreground restart failed: ' + error.stack);
      if (context.hexo.log && typeof context.hexo.log.error === 'function') {
        context.hexo.log.error('Hexo foreground restart failed: %s', error.message);
      }
    });
  }, 750);
  return { scheduled: true, port: payload.port, mode: 'foreground-supervised' };
}

module.exports = {
  RESTART_EXIT_CODE,
  SUPERVISED_ENV,
  buildRestartPayload,
  closeServer,
  findListeningServer,
  gracefulShutdown,
  handoffRestart,
  resolveHexoCli,
  scheduleRestart,
  superviseReplacement
};
