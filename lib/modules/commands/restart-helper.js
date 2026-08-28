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
function portAvailable(port, ip) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, ip || undefined);
  });
}
async function waitForHandoff(payload) {
  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (!parentAlive(payload.parentPid) && await portAvailable(payload.port, payload.ip)) return;
    await delay(200);
  }
  throw new Error('Timed out waiting for the old Hexo server to stop');
}
async function waitForServer(payload, server, state) {
  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (state.error) throw state.error;
    if (state.exited) throw new Error('The replacement Hexo process exited before listening (code ' + state.code + ', signal ' + state.signal + ')');
    if (!await portAvailable(payload.port, payload.ip)) return;
    await delay(200);
  }
  server.kill();
  throw new Error('Timed out waiting for the replacement Hexo server to listen');
}
async function main() {
  const payload = JSON.parse(Buffer.from(process.argv[2] || '', 'base64').toString('utf8'));
  fs.mkdirSync(path.dirname(payload.log), { recursive: true });
  fs.appendFileSync(payload.log, '\n[' + new Date().toISOString() + '] restart requested; waiting for PID ' + payload.parentPid + ' to release port ' + payload.port + '\n');
  await waitForHandoff(payload);
  const log = fs.openSync(payload.log, 'a');
  fs.writeSync(log, '[' + new Date().toISOString() + '] starting replacement Hexo process\n');
  const args = [payload.cli, 'server', '--port', String(payload.port)];
  if (payload.ip) args.push('--ip', payload.ip);
  const server = spawn(payload.node, args, {
    cwd: payload.cwd, detached: true, stdio: ['ignore', log, log], windowsHide: true
  });
  const state = { error: null, exited: false, code: null, signal: null };
  server.once('error', error => { state.error = error; });
  server.once('exit', (code, signal) => { state.exited = true; state.code = code; state.signal = signal; });
  await waitForServer(payload, server, state);
  fs.writeSync(log, '[' + new Date().toISOString() + '] replacement Hexo is listening on port ' + payload.port + ' (PID ' + server.pid + ')\n');
  server.unref();
}

if (require.main === module) {
  main().catch(error => {
    try { fs.appendFileSync(path.join(process.cwd(), '.hexo-admin', 'restart.log'), '[' + new Date().toISOString() + '] ' + error.stack + '\n'); }
    catch (_) {}
    process.exitCode = 1;
  });
}

module.exports = { parentAlive, portAvailable, waitForHandoff, waitForServer };
