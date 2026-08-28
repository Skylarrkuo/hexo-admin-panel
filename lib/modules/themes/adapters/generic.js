'use strict';

function valueType(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value === 'object' ? 'object' : typeof value;
}

function flattenConfig(value, path, result) {
  path = path || [];
  result = result || [];
  const type = valueType(value);
  if (type === 'object' && Object.keys(value).length) {
    Object.keys(value).forEach(key => flattenConfig(value[key], path.concat(key), result));
    return result;
  }
  result.push({ path, key: path.join('.'), type, value });
  return result;
}

const genericAdapter = {
  name: 'generic',
  supports(theme) { return Boolean(theme); },
  describe(config) {
    return {
      adapter: 'generic',
      sections: Object.keys(config || {}).map(key => ({ key, label: key })),
      fields: flattenConfig(config || {}).map(({ value: _value, ...field }) => field)
    };
  }
};

module.exports = { genericAdapter, flattenConfig };
