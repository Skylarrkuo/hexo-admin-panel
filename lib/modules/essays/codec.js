'use strict';

const yaml = require('js-yaml');
const { badRequest } = require('../../server/errors');

function parseEssays(raw) {
  let value;
  try { value = yaml.load(String(raw || ''), { schema: yaml.JSON_SCHEMA }); }
  catch (error) { throw badRequest('说说数据 YAML 无效: ' + error.message, 'ESSAYS_YAML_INVALID'); }
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw badRequest('说说数据必须是 YAML 列表', 'ESSAYS_FORMAT_INVALID');
  if (value.some(item => !item || typeof item !== 'object' || Array.isArray(item) || typeof item.content !== 'string' || typeof item.date !== 'string')) {
    throw badRequest('每条说说都必须包含字符串类型的 content 和 date', 'ESSAYS_FORMAT_INVALID');
  }
  return value;
}

function dumpEssays(items) {
  return yaml.dump(items, { lineWidth: -1, noRefs: true });
}

module.exports = { parseEssays, dumpEssays };
