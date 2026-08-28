'use strict';

const { flattenConfig } = require('./generic');
const { REDEFINE_METADATA } = require('./redefine-metadata');

const SECTION_LABELS = {
  info: ['基本信息','Basic information'], defaults: ['默认图片','Default images'], colors: ['颜色模式','Colors'], global: ['全局设置','Global settings'], fontawesome: ['图标资源','Font Awesome'],
  home_banner: ['首页横幅','Home banner'], navbar: ['导航栏','Navigation bar'], home: ['首页布局','Home page'], articles: ['文章阅读','Articles'], comment: ['评论系统','Comments'],
  footer: ['页脚','Footer'], inject: ['代码注入','Code injection'], plugins: ['功能插件','Plugins'], page_templates: ['页面模板','Page templates'], cdn: ['CDN','CDN'], developer: ['开发者选项','Developer options']
};

const FIELD_LABELS = {
  enable: ['启用','Enable'], title: ['标题','Title'], subtitle: ['副标题','Subtitle'], author: ['作者','Author'], url: ['地址','URL'], style: ['样式','Style'], image: ['图片','Image'],
  light: ['浅色模式','Light mode'], dark: ['深色模式','Dark mode'], position: ['位置','Position'], links: ['链接','Links'], search: ['搜索','Search'], language: ['语言','Language'],
  font_size: ['字体大小','Font size'], line_height: ['行高','Line height'], max_depth: ['最大深度','Maximum depth'], limit: ['数量限制','Limit'], provider: ['服务商','Provider'],
  version: ['版本','Version'], customize: ['自定义内容','Custom content'], statistics: ['访问统计','Statistics'], runtime: ['运行时间','Runtime'], start: ['开始时间','Start time']
};

function bilingual(metadata, fallback) {
  const label = metadata && metadata.label || {};
  return { 'zh-CN': label['zh-CN'] || fallback[0], en: label.en || fallback[1] };
}

function descriptions(metadata, labels, key) {
  const description = metadata && metadata.description || {};
  return {
    'zh-CN': description['zh-CN'] || labels['zh-CN'] || `配置项 ${key}`,
    en: description.en || labels.en || `Configuration option ${key}`
  };
}

function sectionLabels(key) {
  const fallback = SECTION_LABELS[key] || [key, key];
  const labels = bilingual(REDEFINE_METADATA[key], fallback);
  labels.en = fallback[1] || labels.en;
  return labels;
}

function cleanComment(value) {
  return String(value || '')
    .replace(/^\s*#+\s*/, '')
    .replace(/[<>]{4,}/g, '')
    .replace(/\s*(开始|结束|start|end)\s*$/iu, '')
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
    const useful = comments.filter(item => !/^(文档|docs?)\s*[:：]/iu.test(item) && !/^https?:\/\//i.test(item));
    const documentation = comments.find(item => /^(文档|docs?)\s*[:：]/iu.test(item));
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
    const fields = flattenConfig(config || {}).map(({ value, ...field }) => {
      const leaf = field.path[field.path.length - 1] || field.key;
      const details = REDEFINE_METADATA[field.key];
      const fallback = FIELD_LABELS[leaf] || [leaf.replace(/_/g, ' '), leaf.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase())];
      const labels = bilingual(details, fallback);
      const fieldDescriptions = descriptions(details, labels, field.key);
      return {
        ...field,
        label: labels['zh-CN'],
        labelI18n: labels,
        description: fieldDescriptions['zh-CN'],
        descriptionI18n: fieldDescriptions,
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
        label: sectionLabels(key)['zh-CN'],
        labelI18n: sectionLabels(key),
        count: fields.filter(field => field.section === key).length
      })),
      fields
    };
  }
};

module.exports = { redefineAdapter, commentMetadata };
