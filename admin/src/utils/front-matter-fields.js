function isPlainObject(value) {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function frontMatterField(key, value) {
  let type;
  if (value === null) type = 'null';
  else if (Array.isArray(value)) type = 'array';
  else if (isPlainObject(value)) type = 'object';
  else if (['boolean', 'number', 'string'].includes(typeof value)) type = typeof value;
  else type = 'string';
  return {
    key,
    type,
    value: type === 'array' || type === 'object'
      ? JSON.stringify(value, null, 2)
      : type === 'string' ? String(value ?? '') : value
  };
}

export function frontMatterFields(value) {
  return Object.entries(value || {}).map(([key, fieldValue]) => frontMatterField(key, fieldValue));
}

export function normalizeFrontMatterFields(fields) {
  const supported = new Set(['string', 'number', 'boolean', 'null', 'array', 'object']);
  return (fields || []).map(field => {
    if (supported.has(field.type)) return { ...field };
    let legacyValue = field.value;
    try { legacyValue = JSON.parse(String(field.value)); } catch (_) {}
    return frontMatterField(field.key, legacyValue);
  });
}

export function frontMatterValue(field) {
  if (field.type === 'null') return null;
  if (field.type === 'boolean') return field.value === true || field.value === 'true';
  if (field.type === 'number') {
    const value = Number(field.value);
    if (!Number.isFinite(value)) throw new Error(`Front Matter 字段“${field.key}”必须是有效数字`);
    return value;
  }
  if (field.type === 'array' || field.type === 'object') {
    let value;
    try { value = JSON.parse(String(field.value || '')); }
    catch (_) { throw new Error(`Front Matter 字段“${field.key}”不是有效 JSON`); }
    if (field.type === 'array' && !Array.isArray(value)) throw new Error(`Front Matter 字段“${field.key}”必须是数组`);
    if (field.type === 'object' && !isPlainObject(value)) throw new Error(`Front Matter 字段“${field.key}”必须是对象`);
    return value;
  }
  return String(field.value ?? '');
}

export function fieldsToFrontMatter(fields, excluded = []) {
  const result = {};
  const seen = new Set();
  for (const field of fields || []) {
    const key = String(field.key || '').trim();
    if (!key || excluded.includes(key)) continue;
    if (seen.has(key)) throw new Error(`Front Matter 字段“${key}”重复`);
    seen.add(key);
    result[key] = frontMatterValue(field);
  }
  return result;
}

export function defaultValueForType(type, current) {
  if (type === 'null') return null;
  if (type === 'boolean') return current === true || current === 'true';
  if (type === 'number') return Number.isFinite(Number(current)) ? Number(current) : 0;
  if (type === 'array') return '[]';
  if (type === 'object') return '{}';
  return String(current ?? '');
}
