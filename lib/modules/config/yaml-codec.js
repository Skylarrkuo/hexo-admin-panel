'use strict';

const yaml = require('js-yaml');

function parseYaml(raw) {
  const value = yaml.load(String(raw));
  return value === undefined || value === null ? {} : value;
}

function dumpYaml(value) {
  return yaml.dump(value, { lineWidth: -1 });
}

function deepMerge(target, source) {
  const base = target && typeof target === 'object' && !Array.isArray(target) ? target : {};
  const result = { ...base };
  for (const key of Object.keys(source || {})) {
    const sourceValue = source[key];
    const targetValue = base[key];
    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
        targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue;
    }
  }
  return result;
}

module.exports = { parseYaml, dumpYaml, deepMerge };
