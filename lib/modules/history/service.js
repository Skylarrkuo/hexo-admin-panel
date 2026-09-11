'use strict';

const path = require('path');
const crypto = require('crypto');
const { isPathInside, resolveInside } = require('../../shared/paths');
const { contentRevision, requireRevision } = require('../../shared/revision');
const { badRequest, notFound, conflict } = require('../../server/errors');
const { refreshSavedContent } = require('../../shared/saved-refresh');

const MAX_BYTES = 512 * 1024 * 1024;
const MAX_ENTRIES = 10000;
const TEXT = /\.(md|markdown|ya?ml|json|html|css)$/i;

function createHistoryService(context) {
  const files = context.repositories.files;
  const root = path.join(context.hexo.base_dir, '.hexo-admin', 'history');
  files.mkdir(root);
  const index = new Map();
  let loaded = false;
  let lastStamp = 0;
  function allowed(target) {
    return isPathInside(context.paths.source, target) ||
      (path.dirname(target) === path.resolve(context.hexo.base_dir) && /^_config.*\.ya?ml$/i.test(path.basename(target)));
  }
  function locate(source) {
    let target;
    try { target = resolveInside(context.hexo.base_dir, source); }
    catch (_) { throw badRequest('历史文件路径无效', 'HISTORY_PATH_INVALID'); }
    if (!allowed(target)) throw badRequest('此文件不属于可恢复的内容或配置', 'HISTORY_PATH_INVALID');
    return target;
  }
  function entries() {
    if (!loaded) {
      for (const name of files.list(root).filter(name => /^[a-f\d]{32}\.json$/.test(name))) {
        const item = JSON.parse(files.readText(path.join(root, name)));
        if (item.id + '.json' !== name) throw badRequest('历史索引校验失败', 'HISTORY_CORRUPTED');
        const storedBytes = files.stat(path.join(root, name)).size + (files.exists(path.join(root,item.id+'.bin'))?files.stat(path.join(root,item.id+'.bin')).size:0);
        index.set(item.id, {...item,storedBytes});lastStamp=Math.max(lastStamp,Date.parse(item.createdAt)||0);
      }
      loaded=true;
    }
    return [...index.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  function prune() {
    const counts = new Map(); let bytes = 0, retained = 0;
    for (const item of entries()) {
      const count = (counts.get(item.source) || 0) + 1; counts.set(item.source, count);
      if (count > (TEXT.test(item.source) ? 50 : 5) || bytes + item.storedBytes > MAX_BYTES || retained >= MAX_ENTRIES) {
        if(files.exists(path.join(root,item.id+'.json')))files.remove(path.join(root,item.id+'.json'));
        if(files.exists(path.join(root,item.id+'.bin')))files.remove(path.join(root,item.id+'.bin'));
        index.delete(item.id);
      } else { bytes+=item.storedBytes;retained++; }
    }
  }
  function capture(target) {
    if (!allowed(target) || !files.exists(target) || !files.stat(target).isFile()) return;
    if (context.releaseBusy) throw conflict('发布流程执行中，请结束后再修改内容', 'RELEASE_IN_PROGRESS');
    const buffer = files.readBuffer(target);
    const source = path.relative(context.hexo.base_dir, target).replace(/\\/g, '/');
    const revision = contentRevision(buffer);
    if (entries().some(item => item.source === source && item.revision === revision)) return;
    if (buffer.length > MAX_BYTES / 2) throw badRequest('文件过大，无法在历史容量内安全备份', 'HISTORY_TOO_LARGE');
    lastStamp=Math.max(Date.now(),lastStamp+1);
    const item = { id: crypto.randomBytes(16).toString('hex'), source, revision, createdAt: new Date(lastStamp).toISOString(), size: buffer.length, encoding: TEXT.test(source) ? 'utf8' : 'base64' };
    files.writeBuffer(path.join(root,item.id+'.bin'),buffer);
    try{files.writeText(path.join(root, item.id + '.json'), JSON.stringify(item));}catch(error){files.remove(path.join(root,item.id+'.bin'));throw error;}
    index.set(item.id,{...item,storedBytes:Buffer.byteLength(JSON.stringify(item))+buffer.length});
    prune();
  }
  function get(id) {
    if (!/^[a-f\d]{32}$/.test(id)) throw notFound('历史版本不存在');
    const target = path.join(root, id + '.json');
    if (!files.exists(target)) throw notFound('历史版本不存在');
    const item = JSON.parse(files.readText(target)); locate(item.source); return {...item,content:item.content ?? files.readBuffer(path.join(root,item.id+'.bin')).toString(item.encoding)};
  }
  return {
    capture,
    moved(from, to) {
      if(!allowed(from)||!allowed(to))return;
      const previous=path.relative(context.hexo.base_dir,from).replace(/\\/g,'/');
      const destination=path.relative(context.hexo.base_dir,to).replace(/\\/g,'/');
      const changes=entries().filter(item=>item.source===previous||item.source.startsWith(previous+'/')).map(item=>{
        const metadata={...item};delete metadata.storedBytes;
        return {item,metadata,next:{...metadata,source:destination+item.source.slice(previous.length)}};
      });
      const written=[];
      try{for(const change of changes){files.writeText(path.join(root,change.item.id+'.json'),JSON.stringify(change.next));written.push(change);}}
      catch(error){for(const change of written)files.writeText(path.join(root,change.item.id+'.json'),JSON.stringify(change.metadata));throw error;}
      for(const change of changes)index.set(change.item.id,{...change.next,storedBytes:Buffer.byteLength(JSON.stringify(change.next))+change.next.size});
    },
    validateSource(source) { locate(source); },
    guard(target) { if (allowed(target) && context.releaseBusy) throw conflict('发布流程执行中，请结束后再修改内容', 'RELEASE_IN_PROGRESS'); },
    list(source) {
      if (source) locate(source);
      const all = entries();
      return { items: all.filter(item => !source || item.source === source).map(({ content: _content, ...item }) => item), totalBytes: all.reduce((sum, item) => sum + item.storedBytes, 0), policy: { textVersions: 50, binaryVersions: 5, maxBytes: MAX_BYTES, maxEntries: MAX_ENTRIES, expiresAfterDays: null } };
    },
    preview(id) {
      const item = get(id); const target = locate(item.source);
      const buffer = files.exists(target) ? files.readBuffer(target) : null;
      return { ...item, current: buffer ? buffer.toString(item.encoding) : '', currentRevision: buffer ? contentRevision(buffer) : 'missing', exists: buffer !== null };
    },
    async restore(id, revision) {
      const item = get(id); const target = locate(item.source);
      if (files.exists(target)) requireRevision(revision, files.readBuffer(target));
      else if (revision !== 'missing') throw conflict('恢复目标已变化，请重新预览');
      const original=path.join(root,item.id+'.bin');
      const buffer = files.exists(original)?files.readBuffer(original):Buffer.from(item.content, item.encoding);
      if (contentRevision(buffer) !== item.revision) throw conflict('备份内容校验失败', 'HISTORY_CORRUPTED');
      files.mkdir(path.dirname(target)); files.writeBuffer(target, buffer);
      return { ...await refreshSavedContent(context), source: item.source, revision: item.revision, restartRequired: !isPathInside(context.paths.source, target) };
    }
  };
}

module.exports = { createHistoryService };
