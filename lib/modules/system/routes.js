'use strict';

const packageMetadata = require('../../../package.json');
const { success } = require('../../server/response');

const REPOSITORY_URL = 'https://github.com/Skylarrkuo/hexo-admin-panel';
const NPM_URL = 'https://www.npmjs.com/package/hexo-admin-panel';

const ATTRIBUTIONS = [
  { name: 'Hexo', version: '>=4.0.0', scope: 'peer', purposeZh: '站点生成器与插件宿主', purposeEn: 'Site generator and plugin host', copyright: 'Copyright (c) 2012-present Tommy Chen', license: 'MIT', licenseUrl: 'https://github.com/hexojs/hexo/blob/master/LICENSE', url: 'https://github.com/hexojs/hexo' },
  { name: 'hexo-front-matter', version: '^4.2.1', scope: 'runtime', purposeZh: '解析与序列化 Markdown Front Matter', purposeEn: 'Parse and serialize Markdown Front Matter', copyright: 'Package author: Tommy Chen; contributors retain copyright in their contributions', license: 'MIT', licenseUrl: 'https://github.com/hexojs/hexo-front-matter/blob/master/package.json', url: 'https://github.com/hexojs/hexo-front-matter' },
  { name: 'js-yaml', version: '^4.3.1', scope: 'runtime', purposeZh: '解析与序列化 YAML', purposeEn: 'Parse and serialize YAML', copyright: 'Copyright (C) 2011-2015 Vitaly Puzrin', license: 'MIT', licenseUrl: 'https://github.com/nodeca/js-yaml/blob/master/LICENSE', url: 'https://github.com/nodeca/js-yaml' },
  {name:'yaml',version:'^2.9.0',scope:'runtime',purposeZh:'保留注释的 YAML 文档编辑',purposeEn:'Edit YAML documents while preserving comments',copyright:'Copyright Eemeli Aro <eemeli@gmail.com>',license:'ISC',licenseUrl:'https://github.com/eemeli/yaml/blob/main/LICENSE',url:'https://github.com/eemeli/yaml'},
  { name: 'sharp', version: '^0.34.4', scope: 'runtime', purposeZh: '读取图片元数据并执行图片压缩', purposeEn: 'Read image metadata and optimize images', copyright: 'Copyright 2013 Lovell Fuller and others', license: 'Apache-2.0', licenseUrl: 'https://github.com/lovell/sharp/blob/main/LICENSE', url: 'https://github.com/lovell/sharp' },
  { name: 'Vue', version: '3.5.41', scope: 'bundled', purposeZh: '管理后台界面运行时', purposeEn: 'Admin interface runtime', copyright: 'Copyright (c) 2018-present, Yuxi (Evan) You', license: 'MIT', licenseUrl: 'https://github.com/vuejs/core/blob/main/LICENSE', url: 'https://github.com/vuejs/core' },
  { name: 'marked', version: '15.0.12', scope: 'bundled', purposeZh: '将 Markdown 转换为 HTML', purposeEn: 'Convert Markdown to HTML', copyright: 'Copyright (c) 2018+ MarkedJS; 2011-2018 Christopher Jeffrey; Markdown © 2004 John Gruber', license: 'MIT / BSD-3-Clause notice for Markdown', licenseUrl: 'https://github.com/markedjs/marked/blob/master/LICENSE.md', url: 'https://github.com/markedjs/marked' },
  { name: 'DOMPurify', version: '3.4.14', scope: 'bundled', purposeZh: '清理 Markdown 渲染产生的 HTML', purposeEn: 'Sanitize HTML produced by Markdown rendering', copyright: 'Copyright (c) Cure53 and other contributors', license: 'Apache-2.0 OR MPL-2.0', licenseUrl: 'https://github.com/cure53/DOMPurify/blob/main/LICENSE', url: 'https://github.com/cure53/DOMPurify' }
];

function systemRoutes(context) {
  return [{
    method: 'GET', path: '/system/about', handler({ res }) {
      success(res, {
        name: packageMetadata.name,
        version: packageMetadata.version,
        description: packageMetadata.description,
        author: packageMetadata.author,
        runtime: {
          node: process.version,
          hexo: context.hexo.version || null,
          theme: context.hexo.config && context.hexo.config.theme || null
        },
        links: {
          repository: REPOSITORY_URL,
          npm: NPM_URL,
          issues: REPOSITORY_URL + '/issues',
          license: REPOSITORY_URL + '/blob/master/LICENSE',
          notices: REPOSITORY_URL + '/blob/master/THIRD_PARTY_NOTICES.md'
        },
        license: packageMetadata.license,
        copyright: 'Copyright (c) 2026 Skylarr Kuo',
        attributions: ATTRIBUTIONS.map(item => item.name === 'Hexo' && context.hexo.version
          ? { ...item, version: context.hexo.version }
          : item)
      });
    }
  }];
}

module.exports = { ATTRIBUTIONS, systemRoutes };
