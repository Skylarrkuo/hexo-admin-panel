'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { previewRoutes } = require('../lib/modules/previews/routes');

const browser = [process.env.CHROME_BIN,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'
].find(value => value && fs.existsSync(value));

test('preview scripts cannot read admin storage in an iframe or a direct tab', { skip: !browser, timeout: 45000 }, async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hexo-preview-browser-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }));
  const previewPath = '/previews/test/index.html';
  const html = `<!doctype html><html><head><link rel="stylesheet" href="/previews/test/style.css"></head><body>
    <script type="module" src="/previews/test/check.js"></script></body></html>`;
  const script = `const result = {scriptRan:true};
    for (const [key, read] of Object.entries({storage:()=>localStorage.getItem('hexo_admin_token'),cookie:()=>document.cookie,parent:()=>parent.document.body})) {
      if(key==='parent' && parent===window) continue;
      try { read(); result[key+'Blocked']=false; } catch (_) { result[key+'Blocked']=true; }
    }
    result.fetchWorks=(await (await fetch('/previews/test/data.json')).json()).ok;
    result.cssWorks=getComputedStyle(document.body).color==='rgb(1, 2, 3)';
    document.body.innerHTML='<pre id="result">'+JSON.stringify(result)+'</pre>';
    if(parent!==window)parent.postMessage(result,'*');`;
  const assets = { 'index.html': [html, 'text/html'], 'check.js': [script, 'text/javascript'],
    'style.css': ['body { color: rgb(1, 2, 3); }', 'text/css'], 'data.json': ['{"ok":true}', 'application/json'] };
  const route = previewRoutes({ services: { previews: { get(_token, file) {
    const [body, contentType] = assets[file];
    return { body: Buffer.from(body), contentType };
  } } } }).find(item => item.public);
  const server = http.createServer((req, res) => {
    if (req.url.startsWith('/previews/test/')) {
      route.handler({ res, params: { token: 'test', file: req.url.slice('/previews/test/'.length) } });
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!doctype html><html><body><script>
      localStorage.setItem('hexo_admin_token','browser-test-token');
      document.cookie='test=secret; SameSite=Strict';
      ${req.url === '/direct' ? `location.replace('${previewPath}');` : `
      addEventListener('message',event=>{document.getElementById('result').textContent=JSON.stringify({...event.data,origin:event.origin});});
      `}
      </script><pre id="result"></pre>${req.url === '/direct' ? '' : `<iframe src="${previewPath}"></iframe>`}</body></html>`);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  for (const mode of ['embedded', 'direct']) {
    const output = await new Promise((resolve, reject) => {
      const child = spawn(browser, ['--headless', '--disable-gpu', '--no-sandbox', '--no-first-run', '--disable-background-networking',
        '--user-data-dir=' + path.join(directory, mode), '--dump-dom', '--virtual-time-budget=5000',
        `http://127.0.0.1:${server.address().port}/${mode}`], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '', stderr = '';
      const timeout = setTimeout(() => { child.kill(); reject(new Error('Browser timed out')); }, 18000);
      child.stdout.on('data', value => { stdout += value; });
      child.stderr.on('data', value => { stderr += value; });
      child.on('error', error => { clearTimeout(timeout); reject(error); });
      child.on('close', code => { clearTimeout(timeout); code === 0 ? resolve(stdout) : reject(new Error(stderr)); });
    });
    const match = output.match(/<pre id="result">([^<]+)<\/pre>/);
    assert.ok(match, mode + ': preview script must execute and report a result: ' + output);
    const result = JSON.parse(match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
    assert.equal(result.scriptRan, true);
    assert.equal(result.storageBlocked, true);
    assert.equal(result.cookieBlocked, true);
    assert.equal(result.fetchWorks, true);
    assert.equal(result.cssWorks, true);
    if (mode === 'embedded') {
      assert.equal(result.parentBlocked, true);
      assert.equal(result.origin, 'null');
    }
  }
});
