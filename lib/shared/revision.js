'use strict';

const crypto = require('crypto');
const { conflict, preconditionRequired } = require('../server/errors');

function contentRevision(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function requireRevision(expected, content, options) {
  const settings = options || {};
  if (!expected) throw preconditionRequired(settings.requiredMessage || '缺少文章版本信息，请刷新后重试');
  const current = contentRevision(content);
  if (String(expected).replace(/^W\//, '').replace(/^"|"$/g, '') !== current) {
    const error = conflict(settings.conflictMessage || '文章已被其他窗口或程序修改，请刷新后重新编辑');
    error.code = settings.conflictCode || 'POST_REVISION_CONFLICT';
    throw error;
  }
  return current;
}

module.exports = { contentRevision, requireRevision };
