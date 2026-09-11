'use strict';

const path = require('path');
const crypto = require('crypto');
const { resolveInside } = require('../../shared/paths');
const { contentRevision, requireRevision } = require('../../shared/revision');
const { conflict, notFound } = require('../../server/errors');
const { refreshSavedContent } = require('../../shared/saved-refresh');
const { sourceFiles } = require('../checks/service');

function createRecoveryService(context) {
  const files = context.repositories.files; const base = context.hexo.base_dir;
  const backupRoot = path.join(base, '.hexo-admin', 'backups');
  function legacy() {
    const items = [];
    function add(backup, target, group, policy) {
      const source = path.relative(base, target).replace(/\\/g, '/');
      // Reuse the history allowlist; never accept a target from a request or manifest unchecked.
      context.services.history.validateSource(source);
      const stat = files.stat(backup);
      items.push({ id: 'legacy-' + crypto.createHash('sha256').update(backup + source).digest('hex'), source, backup, group, size: stat.size, createdAt: stat.mtime.toISOString(), policy });
    }
    function names(dir) { return files.exists(dir) ? files.list(dir, {withFileTypes:true}) : []; }
    for (const kind of ['config', 'essays', 'menu']) {
      const dir = path.join(backupRoot, kind);
      for (const entry of names(dir)) {
        if (!entry.isFile() || !/\.ya?ml$/.test(entry.name)) continue;
        const target = kind === 'essays' ? context.paths.essays : kind === 'menu' || entry.name.startsWith('theme-') ? context.themes.resolve().writePath : context.hexo.config_path || path.join(base, '_config.yml');
        add(path.join(dir,entry.name),target,kind,'最近 20 份；旧主题备份恢复至当前主题覆盖文件，请核对目标');
      }
    }
    const taxDir = path.join(backupRoot, 'taxonomies');
    function taxWalk(dir, group, relative = '') {
      for (const entry of names(dir)) {
        const next = path.join(dir,entry.name); const rel = path.join(relative,entry.name);
        if (entry.isDirectory()) taxWalk(next,group,rel);
        else if (entry.isFile() && /\.md$/.test(entry.name)) add(next,resolveInside(context.paths.source,rel),group,'最近 20 批；按文件恢复');
      }
    }
    for (const entry of names(taxDir)) if (entry.isDirectory()) taxWalk(path.join(taxDir,entry.name),'taxonomies/' + entry.name);
    const mediaDir = path.join(backupRoot,'media');
    const media = sourceFiles(context).filter(file => /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(file));
    for (const entry of names(mediaDir)) {
      const backup = path.join(mediaDir,entry.name);
      if (entry.isFile() && entry.name.endsWith('.bak')) {
        const target = media.find(file => {
          const relative = path.relative(context.paths.images,file).replace(/\\/g,'/');
          const prefix=crypto.createHash('sha256').update(relative).digest('hex').slice(0,16)+'-'+path.basename(file)+'.';
          return entry.name.startsWith(prefix);
        });
        if (target) add(backup,target,'media','每个媒体最近 5 份原图');
      } else if (entry.isDirectory() && entry.name.startsWith('rename-') && files.exists(path.join(backup,'manifest.json'))) {
        const manifest=JSON.parse(files.readText(path.join(backup,'manifest.json')));
        if (files.exists(path.join(backup,'media.original'))) add(path.join(backup,'media.original'),resolveInside(context.paths.images,manifest.oldName),'media/'+entry.name,'无自动过期；逐文件恢复，重命名后的资源另行清理');
        for (const item of manifest.files || []) add(resolveInside(backup,item.backup),resolveInside(base,path.relative(base,path.resolve(context.paths.source,item.source))),'media/'+entry.name,'无自动过期；逐文件恢复');
      }
    }
    return items;
  }
  function find(id) { const item=legacy().find(item=>item.id===id);if(!item)throw notFound('备份不存在');return item; }
  return {
    list() {
      const history=context.services.history.list(); const old=legacy();
      return { items: [...history.items.map(item=>({...item,group:'history',policy:'每个文本 50 版 / 媒体 5 版；总容量上限 512 MiB'})),...old.map(({backup:_backup,...item})=>item)].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)), totalBytes:history.totalBytes+old.reduce((sum,item)=>sum+item.size,0), historyPolicy:history.policy, note:'显示可定位目标的历史和旧备份。旧格式未记录目标的孤立媒体备份仍保留在磁盘，不会自动猜测恢复位置。' };
    },
    preview(id) {
      if (!id.startsWith('legacy-')) return context.services.history.preview(id);
      const item=find(id); const target=resolveInside(base,item.source);
      const encoding=/\.(md|markdown|ya?ml|json|html|css)$/i.test(target)?'utf8':'base64';
      const current=files.exists(target)?files.readBuffer(target):null;
      return {...item,backup:undefined,encoding,content:files.readBuffer(item.backup).toString(encoding),current:current?current.toString(encoding):'',currentRevision:current?contentRevision(current):'missing'};
    },
    async restore(id,revision) {
      if (!id.startsWith('legacy-')) return context.services.history.restore(id,revision);
      const item=find(id);const target=resolveInside(base,item.source);
      if(files.exists(target))requireRevision(revision,files.readBuffer(target));else if(revision!=='missing')throw conflict('恢复目标已变化');
      files.mkdir(path.dirname(target));files.writeBuffer(target,files.readBuffer(item.backup));
      return {...await refreshSavedContent(context),revision:contentRevision(files.readBuffer(target)),restartRequired:!item.source.startsWith(path.relative(base,context.paths.source).replace(/\\/g,'/'))};
    }
  };
}
module.exports={createRecoveryService};
