'use strict';

const path = require('path');
const { sanitizeUploadName, mimeFor, validateUpload } = require('./file-policy');
const { safeFilename } = require('../../shared/paths');
const { notFound, badRequest, conflict } = require('../../server/errors');

function createMediaService(context) {
  const imagesDir = context.paths.images;
  const files = context.repositories.files;
  if (!files.exists(imagesDir)) files.mkdir(imagesDir);
  async function refresh() { await context.operations.run(() => context.hexo.source.process()); }
  return {
    list(query) {
      const page = Math.max(1, parseInt(query.page, 10) || 1);
      const perPage = Math.min(100, Math.max(1, parseInt(query.per_page, 10) || 20));
      const mediaFiles = files.list(imagesDir, { withFileTypes: true }).filter(entry => entry.isFile()).map(entry => {
        const stat = files.stat(path.join(imagesDir, entry.name));
        return { name: entry.name, path: '/images/' + entry.name, size: stat.size, modified: stat.mtime.toISOString(), type: mimeFor(entry.name) };
      }).sort((a, b) => new Date(b.modified) - new Date(a.modified));
      const total = mediaFiles.length;
      return { files: mediaFiles.slice((page - 1) * perPage, page * perPage), total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
    },
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
    }
  };
}

module.exports = { createMediaService };
