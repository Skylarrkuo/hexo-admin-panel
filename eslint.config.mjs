import js from '@eslint/js';
import globals from 'globals';
import vue from 'eslint-plugin-vue';

export default [
  { ignores: ['coverage/**', 'dist/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['index.js', 'lib/**/*.js', 'test/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: globals.node },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }]
    }
  },
  ...vue.configs['flat/essential'],
  {
    files: ['admin/**/*.{js,vue}'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'vue/no-mutating-props': 'off',
      'vue/multi-word-component-names': 'off'
    }
  }
];
