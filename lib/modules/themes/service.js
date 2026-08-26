'use strict';

const path = require('path');

function createThemeService(context) {
  return {
    list() {
      const files = context.repositories.files;
      const themes = [];
      const seen = new Set();
      const active = context.themes.activeTheme();
      const themeDir = path.join(context.hexo.base_dir, 'themes');
      if (files.exists(themeDir)) {
        files.list(themeDir, { withFileTypes: true })
          .filter(entry => entry.isDirectory() && entry.name !== '.git' && !entry.name.startsWith('.'))
          .forEach(entry => { themes.push({ name: entry.name, active: entry.name === active }); seen.add(entry.name); });
      }
      const modulesDir = path.join(context.hexo.base_dir, 'node_modules');
      if (files.exists(modulesDir)) {
        files.list(modulesDir, { withFileTypes: true })
          .filter(entry => entry.isDirectory() && entry.name.startsWith('hexo-theme-'))
          .forEach(entry => {
            const name = entry.name.slice('hexo-theme-'.length);
            if (!seen.has(name)) themes.push({ name, active: name === active });
          });
      }
      return { themes, active };
    }
  };
}

module.exports = { createThemeService };
