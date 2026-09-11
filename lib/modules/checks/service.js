'use strict';

const path = require('path');
const frontMatter = require('hexo-front-matter');
const crypto=require('crypto');
const {pageId}=require('../pages/service');
const { contentRevision } = require('../../shared/revision');
const { resolveInside } = require('../../shared/paths');

function sourceFiles(context) {
  const files = context.repositories.files; const result = [];
  function visit(dir) {
    if (!files.exists(dir)) return;
    for (const entry of files.list(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const location = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(location);
      else if (entry.isFile()) result.push(location);
    }
  }
  visit(context.paths.source); return result.sort();
}

function createCheckService(context) {
  const files = context.repositories.files; const hexo = context.hexo;
  function configFiles() {
    const candidates=[];
    for (const entry of files.list(hexo.base_dir, { withFileTypes: true })) {
      if (entry.isFile() && /^_config.*\.ya?ml$/i.test(entry.name)) candidates.push(path.join(hexo.base_dir, entry.name));
    }
    if (typeof hexo.config_path==='string' && files.exists(hexo.config_path)) candidates.push(hexo.config_path);
    const theme=context.themes.resolve();if(theme.defaultPath&&files.exists(theme.defaultPath))candidates.push(theme.defaultPath);
    return [...new Set(candidates)].sort();
  }
  function configRevision() { return contentRevision(JSON.stringify(configFiles().map(file=>[file,contentRevision(files.readBuffer(file))]))); }
  const loadedConfigRevision=configRevision();
  function manifest() {
    const candidates = [...sourceFiles(context),...configFiles()];
    const versions = candidates.sort().map(file => ({ source: path.relative(hexo.base_dir, file).replace(/\\/g, '/'), revision: contentRevision(files.readBuffer(file)) }));
    return { versions, revision: contentRevision(JSON.stringify(versions)) };
  }
  function run(options = {}) {
    const issues = []; const records = []; const routes = new Set(['/']); const permalinks = new Map();
    const config = hexo.config; let site;
    try { site = new URL(config.url); } catch (_) { site = new URL('https://hexo.invalid'); }
    const root = '/' + String(config.root || '/').replace(/^\/+|\/+$/g, '') + '/';
    const siteRoot = root.replace(/\/+/g, '/');
    function canonical(value) {
      const url = new URL(value, site.origin + siteRoot);
      if (url.origin !== site.origin) return null;
      let pathname = decodeURIComponent(url.pathname);
      if (siteRoot !== '/' && !pathname.startsWith(siteRoot)) return null;
      pathname = '/' + pathname.slice(siteRoot.length).replace(/^\//, '');
      return pathname.replace(/index\.html$/, '').replace(/\/$/, '') || '/';
    }
    const models = new Map();
    for (const kind of ['Post', 'Page']) {
      try { for (const item of hexo.model(kind).find({}).toArray()) models.set(path.resolve(item.full_source), item); } catch (_) { /* Model may not exist before first processing. */ }
    }
    try { for (const route of hexo.route.list()) routes.add(canonical(siteRoot + route)); } catch (_) { /* Static source routes still checked. */ }
    for (const target of sourceFiles(context)) {
      const source = path.relative(context.paths.source, target).replace(/\\/g, '/');
      if (!source.startsWith('_')) routes.add(canonical(siteRoot + source));
      if (!/\.md$/i.test(target)) continue;
      if(source.startsWith('_drafts/')&&!config.render_drafts&&!options.includeDrafts)continue;
      const raw = files.readText(target);
      const modelRecord=models.get(path.resolve(target));
      const editorPath=source.startsWith('_posts/')?(modelRecord?'/posts/edit/'+modelRecord._id:null):source.startsWith('_drafts/')?'/posts/edit/draft-'+crypto.createHash('sha256').update(source.slice(8)).digest('hex').slice(0,32):'/pages/edit/'+pageId(source);
      const add = (code, message, field, line = 1, severity = 'error') => issues.push({ source, code, message, field, line:line===1?Math.max(1,raw.split(/\r?\n/).findIndex(text=>text.startsWith(field+':'))+1):line, severity,editorPath });
      let data;
      try { data = frontMatter.parse(raw); } catch (error) { add('FRONT_MATTER_INVALID', error.message, 'frontMatter'); continue; }
      if(data.published===false&&!config.render_drafts&&!options.includeDrafts)continue;
      if (typeof data.title !== 'string' || !data.title.trim()) add('TITLE_REQUIRED', '标题缺失或不是字符串', 'title');
      for (const field of ['title', 'permalink', 'cover', 'template']) if (data[field] !== undefined && typeof data[field] !== 'string') add('FRONT_MATTER_TYPE', field + ' 必须是字符串', field);
      if (data.layout !== undefined && data.layout !== false && typeof data.layout !== 'string') add('FRONT_MATTER_TYPE', 'layout 必须是字符串或 false', 'layout');
      for (const field of ['published', 'comments']) if (data[field] !== undefined && typeof data[field] !== 'boolean') add('FRONT_MATTER_TYPE', field + ' 必须是布尔值', field);
      for (const field of ['tags', 'categories']) if (data[field] !== undefined && typeof data[field] !== 'string' && !(Array.isArray(data[field]) && data[field].flat(Infinity).every(value => typeof value === 'string'))) add('FRONT_MATTER_TYPE', field + ' 必须是字符串或字符串数组', field);
      for (const field of ['date', 'updated']) if (data[field] !== undefined && (!(typeof data[field] === 'string' || data[field] instanceof Date) || Number.isNaN(new Date(data[field]).getTime()))) add('FRONT_MATTER_TYPE', field + ' 必须是有效日期', field);
      const model = models.get(path.resolve(target));
      const fallback = source.startsWith('_posts/') ? '/' + path.basename(source, '.md') + '/' : '/' + source.replace(/index\.md$/, '').replace(/\.md$/, '.html');
      const permalink = typeof data.permalink === 'string' ? data.permalink : model?.path || model?.permalink || fallback;
      let route;
      try { route = canonical(/^https?:/.test(permalink)||permalink.startsWith(siteRoot)?permalink:siteRoot+permalink.replace(/^\//,'')); } catch (_) { add('PERMALINK_INVALID', 'permalink 无效', 'permalink'); }
      const published = !source.startsWith('_drafts/') && data.published !== false;
      if (published && route) {
        routes.add(route);
        if (permalinks.has(route)) { add('PERMALINK_DUPLICATE', '与 ' + permalinks.get(route) + ' 使用相同 permalink', 'permalink'); }
        else permalinks.set(route, source);
      }
      records.push({ target, source, raw, data, route, add, published });
    }
    for (const record of records) {
      const { target, source, raw, data, route, add } = record;
      const lines = raw.split(/\r?\n/); let fence = null;
      const definitions=new Map();let definitionFence=null;
      for(const line of lines){
        const marker=line.match(/^\s*(`{3,}|~{3,})(.*)$/);
        if(marker){if(!definitionFence)definitionFence=marker[1];else if(marker[1][0]===definitionFence[0]&&marker[1].length>=definitionFence.length&&!marker[2].trim())definitionFence=null;continue;}
        if(definitionFence)continue;
        const definition=line.match(/^\s*\[([^\]]+)\]:\s*<?([^\s>]+)>?/);if(definition)definitions.set(definition[1].trim().toLowerCase(),definition[2]);
      }
      function check(value, image, line, asset = false) {
        if (!value || /^(#|data:|mailto:|tel:|javascript:|\{%)/i.test(value)) return;
        let url;
        try { url = new URL(value, site.origin + siteRoot + String(route || '/').replace(/^\//, '') + ((route || '').endsWith('.html') ? '' : '/')); } catch (_) { return; }
        if (url.origin !== site.origin) return;
        let decoded;
        try { decoded = decodeURIComponent(value.split(/[?#]/)[0]); } catch (_) { add('URL_INVALID', 'URL 编码无效：' + value, image ? 'image' : 'link', line); return; }
        const candidates = [];
        if (!/^([a-z]+:)?\//i.test(value)) {
          if (asset || config.post_asset_folder && /^_(posts|drafts)\//.test(source)) candidates.push(path.join(path.dirname(target), path.basename(target, path.extname(target)), decoded));
          if (!asset) candidates.push(path.join(path.dirname(target), decoded));
        }
        let routePath;try{routePath=canonical(url.href);}catch(_){add('URL_INVALID','URL 编码无效：'+value,'link',line);return;}
        if (!asset && routePath) candidates.push(path.join(context.paths.source, routePath.slice(1)));
        const found = candidates.some(candidate => { try { const safe = resolveInside(context.paths.source, path.relative(context.paths.source, candidate)); return files.exists(safe) && files.stat(safe).isFile(); } catch (_) { return false; } });
        if (!found && (image || asset || !routePath || !routes.has(routePath))) add(image ? 'IMAGE_MISSING' : 'LINK_BROKEN', (image ? '缺少图片：' : '站内链接无法定位：') + value, image ? 'image' : 'link', line);
      }
      if (typeof data.cover === 'string') check(data.cover, true, Math.max(1, lines.findIndex(line => /^cover:/.test(line)) + 1));
      lines.forEach((line, index) => {
        const marker = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
        if (marker) {
          if (!fence) { fence = marker[1]; if (!marker[2].trim()) add('CODE_LANGUAGE_MISSING', '代码块没有声明语言', 'content', index + 1, 'warning'); }
          else if (marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
          return;
        }
        if (fence) return;
        for (const match of line.matchAll(/(!?)\[[^\]]*\]\(<?([^\s)>]+)>?(?:\s+[^)]*)?\)/g)) check(match[2], Boolean(match[1]), index + 1);
        for(const match of line.matchAll(/(!?)\[([^\]]+)\]\[([^\]]*)\]/g)) {
          const key=(match[3]||match[2]).trim().toLowerCase();const value=definitions.get(key);
          if(value)check(value,Boolean(match[1]),index+1);else add('LINK_REFERENCE_MISSING','缺少引用式链接定义：'+key,'link',index+1);
        }
        for (const match of line.matchAll(/<(img|a)\b[^>]*\b(?:src|href)=["']([^"']+)["']/gi)) check(match[2], match[1].toLowerCase() === 'img', index + 1);
        for (const match of line.matchAll(/\{%\s*asset_(img|link|path)\s+(?:"([^"]+)"|'([^']+)'|([^\s%]+))/g)) check(match[2] || match[3] || match[4], match[1] === 'img', index + 1, true);
      });
    }
    return { ...manifest(), issues, errors: issues.filter(item => item.severity === 'error').length, warnings: issues.filter(item => item.severity === 'warning').length, checkedFiles: records.length, restartRequired: configRevision()!==loadedConfigRevision, scope: 'Markdown、Front Matter、静态资源与 Hexo 已知路由；不请求外部链接，不执行动态模板。'+(config.render_drafts||options.includeDrafts?'包含草稿。':'不检查未进入站点的草稿。') };
  }
  return { run, manifest, restartRequired:()=>configRevision()!==loadedConfigRevision };
}

module.exports = { createCheckService, sourceFiles };
