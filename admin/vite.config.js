import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: configDir,
  base: './',
  plugins: [
    vue(),
    {
      name: 'hexo-admin-development-root',
      transformIndexHtml(html, context) {
        return context.server ? html.replaceAll('__HEXO_ROOT__', '/') : html;
      }
    }
  ],
  server: {
    port: 5173,
    proxy: { '/admin/api': 'http://localhost:4000' }
  },
  build: {
    outDir: path.resolve(configDir, '../dist/admin'),
    emptyOutDir: true,
    sourcemap: false
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reportsDirectory: path.resolve(configDir, '../coverage/ui'),
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.{js,vue}'],
      exclude: ['src/main.js'],
      thresholds: { lines: 75, functions: 25, statements: 75, branches: 60 }
    }
  }
});
