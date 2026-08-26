function readPath(value, path) {
  return path.reduce((current, key) => current == null ? undefined : current[key], value);
}

export function fieldsFromSchema(config, schema) {
  return (schema?.fields || []).map(field => ({
    ...field,
    path: Array.isArray(field.path) ? field.path : String(field.key || '').split('.').filter(Boolean),
    value: readPath(config, Array.isArray(field.path) ? field.path : String(field.key || '').split('.').filter(Boolean)),
    domId: String(field.key || '').replace(/[^a-zA-Z0-9_-]/g, '-')
  }));
}

export function sectionsFromSchema(schema, fields) {
  return (schema?.sections || []).map(section => ({
    ...section,
    count: fields.filter(field => field.section === section.key).length
  }));
}
