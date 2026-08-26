'use strict';

const { flattenConfig } = require('./generic');

const SECTION_LABELS = {
  info: '基本信息', defaults: '默认图片', colors: '颜色模式', global: '全局设置', fontawesome: '图标资源',
  home_banner: '首页横幅', navbar: '导航栏', home: '首页布局', articles: '文章阅读', comment: '评论系统',
  footer: '页脚', inject: '代码注入', plugins: '功能插件', page_templates: '页面模板', cdn: 'CDN', developer: '开发者选项'
};

const FIELD_LABELS = {
  enable: '启用', title: '标题', subtitle: '副标题', author: '作者', url: '地址', style: '样式', image: '图片',
  light: '浅色模式', dark: '深色模式', position: '位置', links: '链接', search: '搜索', language: '语言',
  font_size: '字体大小', line_height: '行高', max_depth: '最大深度', limit: '数量限制', provider: '服务商',
  version: '版本', customize: '自定义内容', statistics: '访问统计', runtime: '运行时间', start: '开始时间'
};

function cleanComment(value) {
  return String(value || '')
    .replace(/^\s*#+\s*/, '')
    .replace(/[<>]{4,}/g, '')
    .replace(/\s*(开始|结束)\s*$/u, '')
    .trim();
}

function commentMetadata(raw) {
  const result = {};
  const stack = [];
  let comments = [];
  String(raw || '').split(/\r?\n/).forEach(line => {
    if (/^\s*#/.test(line)) {
      const comment = cleanComment(line);
      if (comment) comments.push(comment);
      return;
    }
    if (!line.trim()) { comments = []; return; }
    const match = line.match(/^(\s*)([A-Za-z0-9_.-]+)\s*:\s*(.*)$/);
    if (!match) { comments = []; return; }
    const indent = match[1].replace(/\t/g, '  ').length;
    const key = match[2];
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    const path = stack.map(item => item.key).concat(key);
    const inlineIndex = match[3].indexOf(' #');
    const inline = inlineIndex >= 0 ? cleanComment(match[3].slice(inlineIndex + 1)) : '';
    const useful = comments.filter(item => !/^文档\s*[:：]/u.test(item) && !/^https?:\/\//i.test(item));
    const documentation = comments.find(item => /^文档\s*[:：]/u.test(item));
    result[path.join('.')] = {
      label: useful[useful.length - 1] || inline || '',
      description: [useful[useful.length - 1], inline, documentation].filter(Boolean).filter((item, index, all) => all.indexOf(item) === index).join('；')
    };
    comments = [];
    stack.push({ indent, key });
  });
  return result;
}

function looksLikeColor(field, value) {
  const key = field.key || '';
  if (/(^|\.)(color|colors|primary|secondary|background(?:_color)?|text_color|shadow_color)$/i.test(key)) return true;
  return typeof value === 'string' && /^(#[0-9a-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\))$/i.test(value.trim());
}

function detectVersion(packageJson) {
  return packageJson && packageJson.version || null;
}

const redefineAdapter = {
  name: 'redefine',
  supports(theme) { return theme === 'redefine'; },
  describe(config, context) {
    const metadata = commentMetadata(context && context.raw);
    const fields = flattenConfig(config || {}).map(({ value, ...field }) => {
      const leaf = field.path[field.path.length - 1] || field.key;
      const details = metadata[field.key] || {};
      return {
        ...field,
        label: details.label || FIELD_LABELS[leaf] || leaf.replace(/_/g, ' '),
        description: details.description || details.label || `配置项 ${field.key}`,
        section: field.path[0] || '',
        secret: /(secret|password)$/i.test(leaf),
        color: looksLikeColor(field, value)
      };
    });
    return {
      adapter: 'redefine',
      version: detectVersion(context && context.packageJson),
      sections: Object.keys(config || {}).map(key => ({
        key,
        label: metadata[key] && metadata[key].label || SECTION_LABELS[key] || key,
        count: fields.filter(field => field.section === key).length
      })),
      fields
    };
  }
};

module.exports = { redefineAdapter, commentMetadata };
