'use strict';

const path = require('path');
const { safeFilename } = require('../../shared/paths');
const { badRequest, HttpError } = require('../../server/errors');

const MIME_TYPES = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.bmp': 'image/bmp', '.pdf': 'application/pdf',
  '.zip': 'application/zip', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg'
};

function sanitizeUploadName(value) {
  const name = path.basename(String(value || '')).replace(/[^\w一-鿿._-]/g, '_');
  return safeFilename(name || 'upload');
}

function mimeFor(name) { return MIME_TYPES[path.extname(name).toLowerCase()] || 'application/octet-stream'; }

function detectedType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return null;
  const hex = buffer.subarray(0, 16).toString('hex');
  const text = buffer.subarray(0, 12).toString('ascii');
  if (hex.startsWith('ffd8ff')) return '.jpg';
  if (hex.startsWith('89504e470d0a1a0a')) return '.png';
  if (text.startsWith('GIF87a') || text.startsWith('GIF89a')) return '.gif';
  if (text.startsWith('RIFF') && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return '.webp';
  if (text.startsWith('%PDF-')) return '.pdf';
  if (text.startsWith('BM')) return '.bmp';
  if (hex.startsWith('00000100')) return '.ico';
  if (hex.startsWith('504b0304') || hex.startsWith('504b0506') || hex.startsWith('504b0708')) return '.zip';
  if (text.startsWith('ID3') || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)) return '.mp3';
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp') return '.mp4';
  return null;
}

function validateUpload(file, options) {
  const extension = path.extname(file.filename || '').toLowerCase();
  const allowed = new Set((options.allowed_extensions || []).map(value => String(value).toLowerCase()));
  if (!extension || !allowed.has(extension)) throw badRequest('不允许上传此文件类型: ' + (extension || '无后缀'), 'UPLOAD_TYPE_NOT_ALLOWED');
  if (extension === '.svg') throw badRequest('出于安全原因不支持 SVG 上传', 'UPLOAD_TYPE_NOT_ALLOWED');
  if (file.buffer.length > options.max_file_size) throw new HttpError(413, '文件超过大小限制', 'UPLOAD_TOO_LARGE');
  const detected = detectedType(file.buffer);
  const equivalent = extension === '.jpeg' ? '.jpg' : extension;
  if (!detected || detected !== equivalent) throw badRequest('文件内容与扩展名不匹配', 'UPLOAD_CONTENT_MISMATCH');
  return { extension, detected, mime: mimeFor(file.filename) };
}

module.exports = { sanitizeUploadName, mimeFor, detectedType, validateUpload };
