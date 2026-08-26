'use strict';

const { badRequest } = require('./errors');

function fail(field, message) {
  throw badRequest((field ? field + ': ' : '') + message, 'VALIDATION_ERROR');
}

function assertSafeObject(value, path, depth) {
  if (depth > 50) fail(path || 'request', 'is nested too deeply');
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) fail(path ? path + '.' + key : key, 'is not allowed');
    assertSafeObject(child, path ? path + '.' + key : key, depth + 1);
  }
}

function validate(value, schema, label) {
  label = label || 'request';
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(label, 'must be an object');
  assertSafeObject(value, '', 0);
  for (const [field, rule] of Object.entries(schema || {})) {
    const current = value[field];
    if (current === undefined || current === null) {
      if (rule.required) fail(field, 'is required');
      continue;
    }
    const type = Array.isArray(current) ? 'array' : typeof current;
    if (rule.type && type !== rule.type) fail(field, 'must be ' + rule.type);
    if (rule.enum && !rule.enum.includes(current)) fail(field, 'must be one of ' + rule.enum.join(', '));
    if (typeof current === 'string') {
      if (rule.minLength !== undefined && current.length < rule.minLength) fail(field, 'is too short');
      if (rule.maxLength !== undefined && current.length > rule.maxLength) fail(field, 'is too long');
      if (rule.pattern && !rule.pattern.test(current)) fail(field, 'has an invalid format');
    }
    if (typeof current === 'number') {
      if (!Number.isFinite(current)) fail(field, 'must be finite');
      if (rule.min !== undefined && current < rule.min) fail(field, 'is too small');
      if (rule.max !== undefined && current > rule.max) fail(field, 'is too large');
    }
    if (Array.isArray(current)) {
      if (rule.maxItems !== undefined && current.length > rule.maxItems) fail(field, 'contains too many items');
      if (rule.items && current.some(item => (Array.isArray(item) ? 'array' : typeof item) !== rule.items.type)) fail(field, 'contains an invalid item');
    }
  }
  return value;
}

function validateId(value, field) {
  if (typeof value !== 'string' || !value || value.length > 512) fail(field || 'id', 'is invalid');
  return value;
}

function validateConfigType(value) {
  if (value === undefined || value === '') return 'site';
  if (!['site', 'theme'].includes(value)) fail('type', 'must be site or theme');
  return value;
}

function validateIntegerQuery(value, field, options) {
  if (value === undefined || value === '') return undefined;
  if (!/^\d+$/.test(String(value))) fail(field, 'must be an integer');
  const number = Number(value);
  if (options && options.min !== undefined && number < options.min) fail(field, 'is too small');
  if (options && options.max !== undefined && number > options.max) fail(field, 'is too large');
  return number;
}

module.exports = { validate, validateId, validateConfigType, validateIntegerQuery, assertSafeObject };
