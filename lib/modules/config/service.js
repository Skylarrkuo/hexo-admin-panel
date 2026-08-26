'use strict';

const path = require('path');
const { parseYaml, dumpYaml, deepMerge } = require('./yaml-codec');
const { badRequest, notFound } = require('../../server/errors');
const { safeFilename } = require('../../shared/paths');

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
        schema: target.schema, adapter: target.adapter, version: target.version
      };
    },
    save(type, body) {
      const target = info(type || 'site');
      const backupId = backup(target.type, target.writePath);
      if (body.raw !== undefined) {
        this.parse(body.raw);
        files.writeText(target.writePath, body.raw);
      } else if (body.data !== undefined) {
        this.build(body.data);
        let existing = {};
        try { existing = parseYaml(files.readText(target.readPath)); } catch (_) {}
        files.writeText(target.writePath, dumpYaml(deepMerge(existing, body.data)));
      } else throw badRequest('No config content provided');
      return { backupId };
    },
    listBackups(type) {
      const prefix = type === 'theme' ? 'theme-' : type === 'site' ? 'site-' : '';
      const items = files.list(backupsDir).filter(name => name.endsWith('.yml') && (!prefix || name.startsWith(prefix))).map(name => {
        const stat = files.stat(path.join(backupsDir, name));
        return { id: name, type: name.startsWith('theme-') ? 'theme' : 'site', createdAt: stat.mtime.toISOString(), size: stat.size };
      }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return { items, total: items.length };
    },
    restoreBackup(id) {
      id = safeFilename(id);
      const backupPath = path.join(backupsDir, id);
      if (!files.exists(backupPath) || !id.endsWith('.yml')) throw notFound('配置备份不存在');
      const type = id.startsWith('theme-') ? 'theme' : id.startsWith('site-') ? 'site' : null;
      if (!type) throw badRequest('配置备份名称无效');
      const raw = files.readText(backupPath);
      this.parse(raw);
      const target = info(type);
      const currentBackupId = backup(type, target.writePath);
      files.writeText(target.writePath, raw);
      return { restored: true, type, backupId: currentBackupId };
    }
  };
}

module.exports = { createConfigService };
