'use strict';

const fs = require('fs');
const path = require('path');
const { parseYaml, deepMerge } = require('../config/yaml-codec');
const { genericAdapter } = require('./adapters/generic');
const { redefineAdapter } = require('./adapters/redefine');

function readYamlIfPresent(filePath, io) {
  if (!io.existsSync(filePath)) return {};
  return parseYaml(io.readFileSync(filePath, 'utf8'));
}

function readPackageJson(filePath, io) {
  try { return JSON.parse(io.readFileSync(filePath, 'utf8')); }
  catch (_) { return null; }
}

function createThemeResolver(hexo, options) {
  const io = options && options.fs || fs;
  const adapters = options && options.adapters || [redefineAdapter, genericAdapter];

  function activeTheme() {
    try {
      const siteConfig = readYamlIfPresent(hexo.config_path || path.join(hexo.base_dir, '_config.yml'), io);
      return siteConfig.theme || hexo.config.theme || 'landscape';
    } catch (_) { return hexo.config.theme || 'landscape'; }
  }

  function resolve(themeName) {
    const theme = themeName || activeTheme();
    if (!/^[\w.-]+$/.test(theme)) throw new Error('Invalid theme name: ' + theme);
    const overridePath = path.join(hexo.base_dir, '_config.' + theme + '.yml');
    const directoryRoot = path.join(hexo.base_dir, 'themes', theme);
    const packageRoot = path.join(hexo.base_dir, 'node_modules', 'hexo-theme-' + theme);
    const directoryConfig = path.join(directoryRoot, '_config.yml');
    const packageConfig = path.join(packageRoot, '_config.yml');
    const defaultPath = io.existsSync(directoryConfig) ? directoryConfig : packageConfig;
    const source = io.existsSync(overridePath) ? 'site-override' :
      io.existsSync(directoryConfig) ? 'theme-directory' : io.existsSync(packageConfig) ? 'npm-package' : 'missing';
    const defaults = readYamlIfPresent(defaultPath, io);
    const overrides = readYamlIfPresent(overridePath, io);
    const resolved = deepMerge(defaults, overrides);
    const readPath = source === 'site-override' ? overridePath : defaultPath;
    const packageJson = readPackageJson(path.join(io.existsSync(directoryRoot) ? directoryRoot : packageRoot, 'package.json'), io);
    const adapter = adapters.find(item => item.supports(theme)) || genericAdapter;
    const raw = readPath && io.existsSync(readPath) ? io.readFileSync(readPath, 'utf8') : '';
    return {
      theme, source, readPath: readPath || overridePath, writePath: overridePath,
      defaultPath, overridePath, defaults, overrides, resolved,
      schema: adapter.describe(resolved, { packageJson, raw }), adapter: adapter.name, version: packageJson && packageJson.version || null
    };
  }

  return { activeTheme, resolve };
}

module.exports = { createThemeResolver };
