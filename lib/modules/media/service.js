'use strict';

const path = require('path');
const sharp = require('sharp');
const { sanitizeUploadName, mimeFor, validateUpload } = require('./file-policy');
const { safeFilename } = require('../../shared/paths');
const { notFound, badRequest, conflict } = require('../../server/errors');
const { analyzeMediaReferences } = require('./references');

function createMediaService(context) {
  const imagesDir = context.paths.images;
  const backupsDir = path.join(context.hexo.base_dir, '.hexo-admin', 'backups', 'media');
  const files = context.repositories.files;
  if (!files.exists(imagesDir)) files.mkdir(imagesDir);
  if (!files.exists(backupsDir)) files.mkdir(backupsDir);
  async function refresh() { await context.operations.run(() => context.hexo.source.process()); }
  function analysis() {
    const references = analyzeMediaReferences(context);
    const items = files.list(imagesDir, { withFileTypes: true }).filter(entry => entry.isFile()).map(entry => {
      const refs = references.get(entry.name) || [];
      return { name: entry.name, used: refs.length > 0, referenceCount: refs.reduce((sum, item) => sum + item.count, 0), references: refs };
    });
    return { items, total: items.length, used: items.filter(item => item.used).length, unused: items.filter(item => !item.used).length };
  }
  return {
    list(query) {
      const page = Math.max(1, parseInt(query.page, 10) || 1);
      const perPage = Math.min(100, Math.max(1, parseInt(query.per_page, 10) || 20));
      const search = String(query.search || '').trim().toLowerCase();
      const usage = query.usage || 'all';
      const referenceMap = new Map(analysis().items.map(item => [item.name, item]));
      const mediaFiles = files.list(imagesDir, { withFileTypes: true }).filter(entry => entry.isFile()).map(entry => {
        const stat = files.stat(path.join(imagesDir, entry.name));
        const refs = referenceMap.get(entry.name) || { used: false, referenceCount: 0, references: [] };
        return { name: entry.name, path: '/images/' + entry.name, size: stat.size, modified: stat.mtime.toISOString(), type: mimeFor(entry.name), ...refs };
      }).filter(file => (!search || file.name.toLowerCase().includes(search)) && (usage === 'all' || (usage === 'used') === file.used)).sort((a, b) => new Date(b.modified) - new Date(a.modified));
      const total = mediaFiles.length;
      return { files: mediaFiles.slice((page - 1) * perPage, page * perPage), total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
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
      filename = safeFilename(filename);
      const filePath = path.join(imagesDir, filename);
      if (!files.exists(filePath)) throw notFound('File not found');
      return context.services.trash.move('media', filePath, { path: '/images/' + filename });
    },
    async rename(filename, requestedName) {
      filename = safeFilename(filename);
      const sourcePath = path.join(imagesDir, filename);
      if (!files.exists(sourcePath)) throw notFound('File not found');
      const nextName = sanitizeUploadName(requestedName);
      if (path.extname(nextName).toLowerCase() !== path.extname(filename).toLowerCase()) {
        throw badRequest('重命名时不能修改文件扩展名', 'MEDIA_EXTENSION_CHANGE');
      }
      if (nextName === filename) return { name: filename, path: '/images/' + filename };
      const destinationPath = path.join(imagesDir, nextName);
      if (files.exists(destinationPath)) throw conflict('同名资源已存在', 'MEDIA_NAME_CONFLICT');
      files.move(sourcePath, destinationPath);
      try { await refresh(); }
      catch (error) { files.move(destinationPath, sourcePath); throw error; }
      return { oldName: filename, name: nextName, path: '/images/' + nextName };
    },
    async compress(filename, quality) {
      filename = safeFilename(filename);
      const extension = path.extname(filename).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) throw badRequest('此文件类型不支持压缩', 'MEDIA_COMPRESSION_UNSUPPORTED');
      const filePath = path.join(imagesDir, filename);
      if (!files.exists(filePath)) throw notFound('File not found');
      const original = files.readBuffer(filePath);
      const pipeline = sharp(original).rotate();
      let optimized;
      if (extension === '.jpg' || extension === '.jpeg') optimized = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
      else if (extension === '.png') optimized = await pipeline.png({ compressionLevel: 9 }).toBuffer();
      else optimized = await pipeline.webp({ quality, effort: 5 }).toBuffer();
      if (optimized.length >= original.length) return { name: filename, optimized: false, originalSize: original.length, size: original.length, saved: 0 };
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupId = filename + '.' + stamp + '.bak';
      files.copy(filePath, path.join(backupsDir, backupId));
      const backups = files.list(backupsDir).filter(name => name.startsWith(filename + '.') && name.endsWith('.bak')).sort().reverse();
      backups.slice(5).forEach(name => files.remove(path.join(backupsDir, name)));
      try { files.writeBuffer(filePath, optimized); await refresh(); }
      catch (error) { files.copy(path.join(backupsDir, backupId), filePath); throw error; }
      return { name: filename, optimized: true, originalSize: original.length, size: optimized.length, saved: original.length - optimized.length, backupId };
    }
  };
}

module.exports = { createMediaService };
