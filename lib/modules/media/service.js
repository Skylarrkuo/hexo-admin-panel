'use strict';

const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { sanitizeUploadName, mimeFor, validateUpload } = require('./file-policy');
const { resolveInside, safeRelativePath } = require('../../shared/paths');
const { notFound, badRequest, conflict, preconditionRequired, HttpError } = require('../../server/errors');
const { contentRevision } = require('../../shared/revision');
const { analyzeMediaReferences, scanMediaReferences, rewriteReferences, SCAN_SCOPE } = require('./references');

function createMediaService(context) {
  const imagesDir = context.paths.images;
  const backupsDir = path.join(context.hexo.base_dir, '.hexo-admin', 'backups', 'media');
  const files = context.repositories.files;
  if (!files.exists(imagesDir)) files.mkdir(imagesDir);
  if (!files.exists(backupsDir)) files.mkdir(backupsDir);
  async function refresh() { await context.operations.run(() => context.hexo.source.process()); }

  function normalizeMediaPath(value) {
    try { return safeRelativePath(value); }
    catch (_) { throw badRequest('媒体路径无效', 'INVALID_MEDIA_PATH'); }
  }

  function absoluteMediaPath(relativePath) {
    const nativePath = normalizeMediaPath(relativePath).split('/').join(path.sep);
    return resolveInside(imagesDir, nativePath);
  }

  function walkMedia(directory, prefix, result) {
    files.list(directory, { withFileTypes: true }).forEach(entry => {
      const relative = prefix ? prefix + '/' + entry.name : entry.name;
      const location = path.join(directory, entry.name);
      if (entry.isDirectory()) walkMedia(location, relative, result);
      else if (entry.isFile()) result.push({ relative, location });
    });
    return result;
  }

  function allMedia() { return walkMedia(imagesDir, '', []); }

  function analysis() {
    const references = analyzeMediaReferences(context);
    const items = allMedia().map(entry => {
      const refs = references.get(entry.relative) || [];
      return { name: entry.relative, used: refs.length > 0, referenceCount: refs.reduce((sum, item) => sum + item.count, 0), references: refs };
    });
    return { items, total: items.length, used: items.filter(item => item.used).length, unused: items.filter(item => !item.used).length, scanScope: SCAN_SCOPE };
  }

  function renamePlan(filename, requestedName) {
    filename = normalizeMediaPath(filename);
    const sourcePath = absoluteMediaPath(filename);
    if (!files.exists(sourcePath)) throw notFound('File not found');
    let nextName;
    if (String(requestedName).includes('/') || String(requestedName).includes('\\')) nextName = normalizeMediaPath(requestedName);
    else {
      const directory = path.posix.dirname(filename);
      const basename = sanitizeUploadName(requestedName);
      nextName = directory === '.' ? basename : directory + '/' + basename;
    }
    if (path.extname(nextName).toLowerCase() !== path.extname(filename).toLowerCase()) {
      throw badRequest('重命名时不能修改文件扩展名', 'MEDIA_EXTENSION_CHANGE');
    }
    const destinationPath = absoluteMediaPath(nextName);
    if (nextName !== filename && files.exists(destinationPath)) throw conflict('同名资源已存在', 'MEDIA_NAME_CONFLICT');
    const scanned = scanMediaReferences(context);
    const changes = scanned.map(file => ({ ...file, nextRaw: rewriteReferences(file, filename, nextName) }))
      .filter(file => file.raw !== file.nextRaw);
    const mediaRevision = contentRevision(files.readBuffer(sourcePath));
    const revision = contentRevision(JSON.stringify({ filename, nextName, mediaRevision, files: scanned.map(file => [file.source, file.revision]) }));
    return { filename, nextName, sourcePath, destinationPath, changes, mediaRevision, revision };
  }

  function presentPlan(plan) {
    return {
      oldName: plan.filename, name: plan.nextName, revision: plan.revision, scanScope: SCAN_SCOPE,
      references: plan.changes.map(file => ({ source: file.source, count: file.occurrences.filter(item => item.mediaPath === plan.filename).length })),
      affectedFiles: plan.changes.length,
      restartRequired: plan.changes.some(file => file.source.startsWith('../'))
    };
  }
  return {
    list(query) {
      const page = Math.max(1, parseInt(query.page, 10) || 1);
      const perPage = Math.min(100, Math.max(1, parseInt(query.per_page, 10) || 20));
      const search = String(query.search || '').trim().toLowerCase();
      const usage = query.usage || 'all';
      const referenceMap = new Map(analysis().items.map(item => [item.name, item]));
      const mediaFiles = allMedia().map(entry => {
        const stat = files.stat(entry.location);
        const refs = referenceMap.get(entry.relative) || { used: false, referenceCount: 0, references: [] };
        return { name: entry.relative, path: '/images/' + entry.relative, size: stat.size, modified: stat.mtime.toISOString(), type: mimeFor(entry.relative), ...refs };
      }).filter(file => (!search || file.name.toLowerCase().includes(search)) && (usage === 'all' || (usage === 'used') === file.used)).sort((a, b) => new Date(b.modified) - new Date(a.modified));
      const total = mediaFiles.length;
      return { files: mediaFiles.slice((page - 1) * perPage, page * perPage), total, page, per_page: perPage, total_pages: Math.ceil(total / perPage), scanScope: SCAN_SCOPE };
    },
    analysis,
    async upload(uploads) {
      const result = [];
      const createdPaths = [];
      const policy = context.config.uploads || {
          max_file_size: 10 * 1024 * 1024,
          allowed_extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.ico', '.pdf', '.zip', '.mp3', '.mp4']
        };
      uploads.forEach(file => validateUpload(file, policy));
      try {
        for (const file of uploads) {
          let filename = sanitizeUploadName(file.filename);
          let filePath = path.join(imagesDir, filename);
          if (files.exists(filePath)) {
            const ext = path.extname(filename);
            const base = path.basename(filename, ext) + '_' + Date.now();
            let counter = 0;
            do {
              filename = base + (counter ? '_' + counter : '') + ext;
              filePath = path.join(imagesDir, filename);
              counter += 1;
            } while (files.exists(filePath));
          }
          files.writeBuffer(filePath, file.buffer);
          createdPaths.push(filePath);
          result.push({ name: filename, path: '/images/' + filename, size: file.buffer.length });
        }
        await refresh();
      } catch (error) {
        createdPaths.forEach(filePath => { try { if (files.exists(filePath)) files.remove(filePath); } catch (_) {} });
        throw error;
      }
      return result.length === 1 ? result[0] : result;
    },
    async remove(filename) {
      filename = normalizeMediaPath(filename);
      const filePath = absoluteMediaPath(filename);
      if (!files.exists(filePath)) throw notFound('File not found');
      return context.services.trash.move('media', filePath, { path: '/images/' + filename });
    },
    previewRename(filename, requestedName) { return presentPlan(renamePlan(filename, requestedName)); },
    async rename(filename, requestedName, revision) {
      return context.operations.run(async () => {
        const plan = renamePlan(filename, requestedName);
        if (revision || plan.changes.length) {
          if (!revision) throw preconditionRequired('请先预览资源引用，并提交预览版本');
          if (revision !== plan.revision) throw conflict('资源或引用已变化，请重新预览重命名', 'MEDIA_RENAME_CONFLICT');
        }
        if (plan.nextName === plan.filename) return { name: plan.filename, path: '/images/' + plan.filename };
        const backupId = 'rename-' + crypto.randomBytes(12).toString('hex');
        const backupDir = path.join(backupsDir, backupId);
        files.mkdir(backupDir);
        files.copy(plan.sourcePath, path.join(backupDir, 'media.original'));
        const manifest = { ...presentPlan(plan), status: 'prepared', createdAt: new Date().toISOString(), files: [] };
        plan.changes.forEach((file, index) => {
          const backup = index + '.txt';
          files.writeText(path.join(backupDir, backup), file.raw);
          manifest.files.push({ source: file.source, backup });
        });
        const persist = () => files.writeText(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
        persist();
        const written = [];
        let moved = false;
        try {
          files.mkdir(path.dirname(plan.destinationPath));
          files.move(plan.sourcePath, plan.destinationPath);
          moved = true;
          for (const file of plan.changes) {
            files.writeText(file.filePath, file.nextRaw);
            written.push(file);
          }
          await context.hexo.source.process();
          manifest.status = 'completed';
          persist();
        } catch (error) {
          const failures = [];
          for (const file of written.reverse()) {
            try {
              if (files.readText(file.filePath) !== file.nextRaw) throw new Error('File changed externally');
              files.writeText(file.filePath, file.raw);
            } catch (_) { failures.push(file.source); }
          }
          if (moved) {
            try {
              if (files.exists(plan.sourcePath) || contentRevision(files.readBuffer(plan.destinationPath)) !== plan.mediaRevision) throw new Error('Media changed externally');
              files.move(plan.destinationPath, plan.sourcePath);
            } catch (_) { failures.push(plan.filename); }
          }
          // Restore Hexo's view too; a failed refresh may have partially updated it.
          try { await context.hexo.source.process(); } catch (_) {}
          manifest.status = failures.length ? 'rollback-incomplete' : 'rolled-back';
          manifest.failures = failures;
          try { persist(); } catch (_) {}
          if (failures.length) throw new HttpError(500, '重命名失败，部分文件需要从备份恢复：' + backupId, 'MEDIA_ROLLBACK_INCOMPLETE');
          throw new HttpError(500, '重命名失败，文件和引用已回滚', 'MEDIA_RENAME_FAILED');
        }
        return { ...presentPlan(plan), path: '/images/' + plan.nextName, backupId };
      });
    },
    async compress(filename, quality) {
      filename = normalizeMediaPath(filename);
      const extension = path.extname(filename).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) throw badRequest('此文件类型不支持压缩', 'MEDIA_COMPRESSION_UNSUPPORTED');
      const filePath = absoluteMediaPath(filename);
      if (!files.exists(filePath)) throw notFound('File not found');
      const original = files.readBuffer(filePath);
      const pipeline = sharp(original).rotate();
      let optimized;
      if (extension === '.jpg' || extension === '.jpeg') optimized = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
      else if (extension === '.png') optimized = await pipeline.png({ compressionLevel: 9 }).toBuffer();
      else optimized = await pipeline.webp({ quality, effort: 5 }).toBuffer();
      if (optimized.length >= original.length) return { name: filename, optimized: false, originalSize: original.length, size: original.length, saved: 0 };
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPrefix = crypto.createHash('sha256').update(filename).digest('hex').slice(0, 16) + '-' + path.basename(filename) + '.';
      const backupId = backupPrefix + stamp + '.bak';
      files.copy(filePath, path.join(backupsDir, backupId));
      const backups = files.list(backupsDir).filter(name => name.startsWith(backupPrefix) && name.endsWith('.bak')).sort().reverse();
      backups.slice(5).forEach(name => files.remove(path.join(backupsDir, name)));
      try { files.writeBuffer(filePath, optimized); await refresh(); }
      catch (error) { files.copy(path.join(backupsDir, backupId), filePath); throw error; }
      return { name: filename, optimized: true, originalSize: original.length, size: optimized.length, saved: original.length - optimized.length, backupId };
    }
  };
}

module.exports = { createMediaService };
