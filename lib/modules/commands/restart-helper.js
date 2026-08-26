'use strict';

const fs = require('fs');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function parentAlive(pid) {
  try { process.kill(pid, 0); return true; }
  catch (_) { return false; }
}
function portAvailable(port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, '::');
  });
}
async function waitForHandoff(payload) {
  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (!parentAlive(payload.parentPid) && await portAvailable(payload.port)) return;
    await delay(200);
  }
  throw new Error('Timed out waiting for the old Hexo server to stop');
}
async function main() {
  const payload = JSON.parse(Buffer.from(process.argv[2] || '', 'base64').toString('utf8'));
  fs.mkdirSync(path.dirname(payload.log), { recursive: true });
  await waitForHandoff(payload);
  const log = fs.openSync(payload.log, 'a');
  fs.writeSync(log, '\n[' + new Date().toISOString() + '] restarting Hexo on port ' + payload.port + '\n');
  const server = spawn(payload.node, [payload.cli, 'server', '--port', String(payload.port)], {
    cwd: payload.cwd, detached: true, stdio: ['ignore', log, log], windowsHide: true
  });
  server.unref();
}

if (require.main === module) {
  main().catch(error => {
    try { fs.appendFileSync(path.join(process.cwd(), '.hexo-admin', 'restart.log'), '[' + new Date().toISOString() + '] ' + error.stack + '\n'); }
    catch (_) {}
    process.exitCode = 1;
  });
}

module.exports = { parentAlive, portAvailable, waitForHandoff };
