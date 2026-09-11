'use strict';

const path = require('path');
const { patchDocument, validateConfig } = require('./document');
const { parseYaml, dumpYaml, deepMerge } = require('./yaml-codec');
const { badRequest, notFound } = require('../../server/errors');
const { safeFilename } = require('../../shared/paths');
const { contentRevision, requireRevision } = require('../../shared/revision');

function createConfigService(context) {
  const hexo = context.hexo;
  const files = context.repositories.files;
  const backupsDir = path.join(hexo.base_dir, '.hexo-admin', 'backups', 'config');
  files.mkdir(backupsDir);

  function info(type) {
    if (type !== 'theme') {
      const filePath = hexo.config_path || path.join(hexo.base_dir, '_config.yml');
      return { readPath: filePath, writePath: filePath, type: 'site', source: 'site-config' };
    }
    return { ...context.themes.resolve(), type: 'theme' };
  }

  function backup(type, targetPath) {
    if (!files.exists(targetPath)) return null;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const id = type + '-' + stamp + '-' + Math.random().toString(36).slice(2, 8) + '.yml';
    files.copy(targetPath, path.join(backupsDir, id));
    const matches = files.list(backupsDir).filter(name => name.startsWith(type + '-') && name.endsWith('.yml')).sort().reverse();
    matches.slice(20).forEach(name => files.remove(path.join(backupsDir, name)));
    return id;
  }

  return {
    parse(raw) {
      if (typeof raw !== 'string') throw badRequest('Raw config must be a string');
      try { return parseYaml(raw); }
      catch (error) { throw badRequest('Invalid YAML: ' + error.message); }
    },
    build(data) {
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw badRequest('Config data must be an object');
      return dumpYaml(data);
    },
    load(type) {
      const target = info(type || 'site');
      const raw = files.exists(target.readPath) ? files.readText(target.readPath) : '';
      return {
        raw,
        parsed: target.type === 'theme' ? target.resolved : parseYaml(raw),
        path: target.readPath, writePath: target.writePath, source: target.source,
        theme: target.theme, type: target.type, defaults: target.defaults, overrides: target.overrides,
        schema: target.schema, adapter: target.adapter, version: target.version,
        revision: contentRevision(raw)
      };
    },
    preview(type, body) {
      const target = info(type || 'site');
      const currentRaw = files.exists(target.readPath) ? files.readText(target.readPath) : '';
      requireRevision(body.revision, currentRaw, { conflictCode:'CONFIG_REVISION_CONFLICT',conflictMessage:'配置已变化，请重新加载并合并' });
      const writeRaw = files.exists(target.writePath) ? files.readText(target.writePath) : '';
      const previous = target.type === 'theme' ? target.resolved : this.parse(currentRaw);
      let nextRaw;
      if (body.raw !== undefined) nextRaw = body.raw;
      else if (body.data !== undefined) {
        const desired = body.replace ? body.data : deepMerge(previous, body.data);
        nextRaw = patchDocument(writeRaw, previous, desired, body.unset || []);
      } else throw badRequest('No config content provided');
      const parsed = this.parse(nextRaw);
      validateConfig(parsed, target.type);
      validateConfig(target.type === 'theme' ? deepMerge(target.defaults, parsed) : parsed, target.type, target.schema);
      return { before:writeRaw,after:nextRaw,raw:nextRaw,revision:contentRevision(currentRaw),writePath:target.writePath,parsed };
    },
    save(type, body) {
      const target=info(type || 'site');
      const preview=this.preview(type,body);
      const backupId=backup(target.type,target.writePath);
      files.writeText(target.writePath,preview.after);
      return { backupId,revision:contentRevision(preview.after),raw:preview.after };
    },
    listBackups(type) {
      const prefix = type === 'theme' ? 'theme-' : type === 'site' ? 'site-' : '';
      const items = files.list(backupsDir).filter(name => name.endsWith('.yml') && (!prefix || name.startsWith(prefix))).map(name => {
        const stat = files.stat(path.join(backupsDir, name));
        return { id: name, type: name.startsWith('theme-') ? 'theme' : 'site', createdAt: stat.mtime.toISOString(), size: stat.size };
      }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return { items, total: items.length };
    },
    restoreBackup(id, revision) {
      id = safeFilename(id);
      const backupPath = path.join(backupsDir, id);
      if (!files.exists(backupPath) || !id.endsWith('.yml')) throw notFound('配置备份不存在');
      const type = id.startsWith('theme-') ? 'theme' : id.startsWith('site-') ? 'site' : null;
      if (!type) throw badRequest('配置备份名称无效');
      const raw = files.readText(backupPath);
      this.parse(raw);
      const target = info(type);
      const currentRaw = files.exists(target.readPath) ? files.readText(target.readPath) : '';
      requireRevision(revision, currentRaw, {
        requiredMessage: '缺少配置版本信息，请刷新后重试',
        conflictMessage: '配置已被其他窗口或程序修改，请刷新后重新编辑',
        conflictCode: 'CONFIG_REVISION_CONFLICT'
      });
      const currentBackupId = backup(type, target.writePath);
      files.writeText(target.writePath, raw);
      return { restored: true, type, backupId: currentBackupId, revision: contentRevision(raw) };
    }
  };
}

module.exports = { createConfigService };
