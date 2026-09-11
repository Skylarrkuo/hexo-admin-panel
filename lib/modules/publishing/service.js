'use strict';

const path = require('path');
const crypto = require('crypto');
const { contentRevision } = require('../../shared/revision');
const { conflict, badRequest } = require('../../server/errors');

async function readResponse(response, limit) {
  if (!response.ok) throw new Error('线上返回 HTTP ' + response.status);
  const chunks = []; let size = 0;
  for await (const chunk of response.body) { size += chunk.length; if (size > limit) throw new Error('线上响应超过验证大小限制'); chunks.push(Buffer.from(chunk)); }
  return Buffer.concat(chunks);
}

function createPublishingService(context) {
  const files = context.repositories.files;
  return {
    start(revision) {
      if (!revision || revision !== context.services.checks.manifest().revision) throw conflict('内容已变化，请重新检查后发布', 'RELEASE_REVISION_CONFLICT');
      if(context.services.checks.restartRequired())throw conflict('配置文件已变化，请先重启 Hexo 再发布','RELEASE_RESTART_REQUIRED');
      if (context.releasePending) throw conflict('已有发布流程正在执行', 'RELEASE_IN_PROGRESS');
      let site;
      try { site = new URL(context.hexo.config.url); if (!['http:', 'https:'].includes(site.protocol) || site.username || site.password) throw new Error(); }
      catch (_) { throw badRequest('请先配置有效的站点 HTTP(S) URL', 'RELEASE_URL_INVALID'); }
      const root = '/' + String(context.hexo.config.root || site.pathname || '/').replace(/^\/+|\/+$/g, '') + '/';
      const base = new URL(root.replace(/\/+/g, '/'), site.origin);
      context.releasePending = true;
      const job = context.services.commands.start('publish', async control => {
        const result = { releaseId: crypto.randomUUID(), revision, versions: [], steps: [], verified: false };
        async function step(name, fn) {
          control.throwIfCancelled();
          const item = { name, status: 'running', startedAt: new Date().toISOString(), revision };
          result.steps.push(item); control.result(result); control.log(name);
          try { const details = await fn(); item.status = 'completed'; if (details) item.details = details; }
          catch (error) { item.status = 'failed'; item.error = error.message; throw error; }
          finally { item.finishedAt = new Date().toISOString(); control.result(result); }
        }
        function unchanged() { if (context.services.checks.manifest().revision !== revision) throw conflict('文件在发布期间发生变化，请重新检查并发布', 'RELEASE_REVISION_CONFLICT'); }
        try {
          context.releaseBusy = true;
          await step('保存版本确认', async () => { unchanged(); result.versions = context.services.checks.manifest().versions; });
          await step('内容检查', async () => {
            await context.hexo.source.process(); unchanged();
            const report = context.services.checks.run(); result.checks = report;
            if (report.errors) throw badRequest('内容检查发现 ' + report.errors + ' 个错误', 'CONTENT_CHECK_FAILED');
            return { warnings: report.warnings };
          });
          const outputs = [];
          const publicDir = context.hexo.public_dir || path.join(context.hexo.base_dir, 'public');
          await step('构建', async () => {
            await context.hexo.call('clean', {}); control.throwIfCancelled();
            await context.hexo.call('generate', { force: true }); unchanged();
            function visit(dir) {
              if (!files.exists(dir)) return;
              for (const entry of files.list(dir, { withFileTypes: true })) {
                const target = path.join(dir, entry.name);
                if (entry.isDirectory()) visit(target);
                else if (entry.isFile() && /\.html$/i.test(entry.name)) outputs.push({ path: path.relative(publicDir, target).replace(/\\/g, '/'), revision: contentRevision(files.readBuffer(target)), size: files.stat(target).size });
              }
            }
            visit(publicDir);
            if (!outputs.length) throw new Error('构建没有生成可验证的 HTML 页面');
            if (outputs.length > 2000 || outputs.some(item => item.size > 10 * 1024 * 1024)) throw new Error('线上验证支持最多 2000 个 HTML 页面，每页最大 10 MiB');
            files.writeText(path.join(publicDir, 'hexo-admin-release.json'), JSON.stringify({ releaseId: result.releaseId, revision }));
            result.outputs = outputs; return { pages: outputs.length };
          });
          await step('部署', async () => {
            unchanged();
            const deployers=context.hexo.extend?.deployer?.list();
            if(deployers){
              const entries=[context.hexo.config.deploy].flat().filter(Boolean);
              if(!entries.length||entries.some(item=>!item.type||!deployers[item.type]))throw badRequest('部署配置为空或部署插件未安装','RELEASE_DEPLOYER_INVALID');
            }
            await context.hexo.call('deploy', { generate: false }); unchanged();
          });
          await step('线上验证', async () => {
            const fetcher = context.runtime.fetch || globalThis.fetch;
            async function fetchFile(relative, limit) {
              const url = new URL(relative.split('/').map(encodeURIComponent).join('/'), base); url.searchParams.set('hexo_release', result.releaseId);
              return readResponse(await fetcher(url, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15000) }), limit);
            }
            const marker = JSON.parse((await fetchFile('hexo-admin-release.json', 8192)).toString('utf8'));
            if (marker.releaseId !== result.releaseId || marker.revision !== revision) throw new Error('线上版本标记尚未更新；部署可能仍在传播');
            let verifiedPages = 0;
            for (const output of outputs) {
              control.throwIfCancelled();
              if (contentRevision(await fetchFile(output.path, 10 * 1024 * 1024)) !== output.revision) throw new Error('线上页面与本次构建不同：' + output.path);
              verifiedPages++; if(verifiedPages%Math.max(1,Math.ceil(outputs.length/50))===0||verifiedPages===outputs.length)control.progress(50 + Math.round(verifiedPages / outputs.length * 49));
            }
            unchanged(); result.verified = true; result.verifiedAt = new Date().toISOString(); return { verifiedPages };
          });
          return { ...result, message: '发布完成，线上内容已验证' };
        } finally { context.releaseBusy = false; context.releasePending = false; }
      });
      // A job cancelled while queued never invokes the executor.
      context.services.commands.wait(job.id).finally(() => { context.releasePending = false; });
      return { job };
    }
  };
}

module.exports = { createPublishingService, readResponse };
