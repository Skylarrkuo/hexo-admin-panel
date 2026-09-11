<template>
  <section class="plugin-about-page">
    <div class="plugin-manifest-hero">
      <div class="plugin-brand-plate" aria-hidden="true">
        <img :src="logoUrl" alt="">
        <div class="plugin-wordmark"><strong>hexo-admin-panel</strong><code>@{{ info.version }}</code></div>
      </div>
      <div class="plugin-hero-copy">
        <span class="plugin-eyebrow">OPEN SOURCE PUBLISHING CONSOLE</span>
        <h2>{{ tr('把 Hexo 的文件工作流，变成一间可靠的编辑室。','A reliable editorial room for your file-based Hexo workflow.') }}</h2>
        <p>{{ tr('Hexo Admin Panel 直接工作在你的 Hexo 项目里：内容仍然是 Markdown 与 YAML，主题、插件和 Git 工作流仍由你掌控。它只把日常编辑、预览和发布变得更清楚。','Hexo Admin Panel works directly inside your Hexo project. Content stays in Markdown and YAML, while your theme, plugins, and Git workflow remain under your control. It simply makes editing, previewing, and publishing clearer.') }}</p>
        <div class="plugin-link-row">
          <a class="btn btn-primary" :href="info.links.repository" target="_blank" rel="noreferrer"><AppIcon name="external"/>GitHub</a>
          <a class="btn btn-outline" :href="info.links.npm" target="_blank" rel="noreferrer"><AppIcon name="external"/>npm</a>
          <a class="plugin-issue-link" :href="info.links.issues" target="_blank" rel="noreferrer">{{ tr('报告问题','Report an issue') }} ↗</a>
        </div>
        <dl class="plugin-runtime-strip">
          <div><dt>{{ tr('版本','Version') }}</dt><dd>v{{ info.version }}</dd></div>
          <div><dt>Node</dt><dd>{{ info.runtime.node || '—' }}</dd></div>
          <div><dt>Hexo</dt><dd>{{ info.runtime.hexo || tr('由站点提供','Provided by site') }}</dd></div>
          <div><dt>{{ tr('许可','License') }}</dt><dd>{{ info.license }}</dd></div>
        </dl>
      </div>
    </div>

    <div class="plugin-values" :aria-label="tr('设计原则','Design principles')">
      <article><span>01</span><div><strong>{{ tr('文件优先','Files first') }}</strong><p>{{ tr('不引入内容数据库，源文件始终可读、可移植。','No content database; source files stay readable and portable.') }}</p></div></article>
      <article><span>02</span><div><strong>{{ tr('真实结果','Real output') }}</strong><p>{{ tr('预览调用真实主题、插件与 permalink 构建。','Previews build with the real theme, plugins, and permalinks.') }}</p></div></article>
      <article><span>03</span><div><strong>{{ tr('可恢复操作','Recoverable changes') }}</strong><p>{{ tr('修订检查、备份、日志和回收站守住每次修改。','Revisions, backups, logs, and trash protect every change.') }}</p></div></article>
    </div>

    <div class="plugin-about-layout">
      <article class="card plugin-field-guide">
        <div class="plugin-section-head"><span>CAPABILITY INDEX</span><h3>{{ tr('一套贴近 Hexo 的完整工作流','A workflow shaped around Hexo') }}</h3></div>
        <ol class="plugin-capability-list">
          <li v-for="(capability,index) in capabilities" :key="capability.title">
            <span>{{ String(index + 1).padStart(2,'0') }}</span>
            <div><strong>{{ capability.title }}</strong><p>{{ capability.description }}</p></div>
            <code>{{ capability.path }}</code>
          </li>
        </ol>
      </article>

      <aside class="plugin-provenance">
        <section class="card plugin-license-card">
          <div class="plugin-section-head"><span>PROVENANCE</span><h3>{{ tr('开源、许可与出处','Open source, license, and provenance') }}</h3></div>
          <p>{{ tr('插件与项目 Logo 均以 MIT License 发布。你可以使用、修改和分发，但需保留版权与许可声明。','The plugin and its logo are released under the MIT License. You may use, modify, and distribute them while retaining the copyright and license notice.') }}</p>
          <div class="license-seal"><b>MIT</b><span>{{ info.copyright }}</span></div>
          <nav class="plugin-document-links" :aria-label="tr('项目文档','Project documents')">
            <a :href="info.links.license" target="_blank" rel="noreferrer"><span>LICENSE</span><AppIcon name="external"/></a>
            <a :href="info.links.notices" target="_blank" rel="noreferrer"><span>THIRD_PARTY_NOTICES.md</span><AppIcon name="external"/></a>
          </nav>
        </section>

      </aside>
    </div>
    <section class="card plugin-attribution-card">
      <div class="plugin-section-head"><span>REFERENCES</span><h3>{{ tr('第三方版权与开源声明（7 项）','Third-party copyright and open-source notices (7)') }}</h3></div>
      <p class="attribution-intro">{{ tr('以下清单覆盖 Hexo 对等宿主、全部直接运行依赖，以及管理端浏览器包内嵌的全部第三方库。','This list covers the Hexo peer host, every direct runtime dependency, and every third-party library embedded in the admin browser bundle.') }}</p>
      <ul class="plugin-attribution-grid">
        <li v-for="item in info.attributions" :key="item.name">
          <div class="attribution-head">
            <div><a :href="item.url" target="_blank" rel="noreferrer">{{ item.name }}</a><code>{{ item.version }}</code></div>
            <span>{{ scopeLabel(item.scope) }}</span>
          </div>
          <p>{{ locale==='en'?item.purposeEn:item.purposeZh }}</p>
          <small>{{ item.copyright }}</small>
          <div class="attribution-links"><a :href="item.licenseUrl" target="_blank" rel="noreferrer">{{ item.license }}</a><a :href="item.url" target="_blank" rel="noreferrer">{{ tr('源码','Source') }} ↗</a></div>
        </li>
      </ul>
    </section>
    <p v-if="loadFailed" class="plugin-runtime-note" role="status">{{ tr('当前显示内置项目资料；运行时版本信息暂时不可用。','Showing built-in project details; runtime version information is temporarily unavailable.') }}</p>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import logoUrl from '../../../assets/hexo-admin-panel-logo.svg';
import { api } from '../api/client';
import AppIcon from '../components/AppIcon.vue';
import { useI18n } from '../i18n';

const {locale,tr}=useI18n();
const loadFailed=ref(false);
const fallbackAttributions=[
  {name:'Hexo',version:'>=4.0.0',scope:'peer',purposeZh:'站点生成器与插件宿主',purposeEn:'Site generator and plugin host',copyright:'Copyright (c) 2012-present Tommy Chen',license:'MIT',licenseUrl:'https://github.com/hexojs/hexo/blob/master/LICENSE',url:'https://github.com/hexojs/hexo'},
  {name:'hexo-front-matter',version:'^4.2.1',scope:'runtime',purposeZh:'解析与序列化 Markdown Front Matter',purposeEn:'Parse and serialize Markdown Front Matter',copyright:'Package author: Tommy Chen; contributors retain copyright in their contributions',license:'MIT',licenseUrl:'https://github.com/hexojs/hexo-front-matter/blob/master/package.json',url:'https://github.com/hexojs/hexo-front-matter'},
  {name:'js-yaml',version:'^4.3.1',scope:'runtime',purposeZh:'解析与序列化 YAML',purposeEn:'Parse and serialize YAML',copyright:'Copyright (C) 2011-2015 Vitaly Puzrin',license:'MIT',licenseUrl:'https://github.com/nodeca/js-yaml/blob/master/LICENSE',url:'https://github.com/nodeca/js-yaml'},
  {name:'yaml',version:'^2.9.0',scope:'runtime',purposeZh:'保留注释的 YAML 文档编辑',purposeEn:'Edit YAML documents while preserving comments',copyright:'Copyright Eemeli Aro <eemeli@gmail.com>',license:'ISC',licenseUrl:'https://github.com/eemeli/yaml/blob/main/LICENSE',url:'https://github.com/eemeli/yaml'},
  {name:'sharp',version:'^0.34.4',scope:'runtime',purposeZh:'读取图片元数据并执行图片压缩',purposeEn:'Read image metadata and optimize images',copyright:'Copyright 2013 Lovell Fuller and others',license:'Apache-2.0',licenseUrl:'https://github.com/lovell/sharp/blob/main/LICENSE',url:'https://github.com/lovell/sharp'},
  {name:'Vue',version:'3.5.41',scope:'bundled',purposeZh:'管理后台界面运行时',purposeEn:'Admin interface runtime',copyright:'Copyright (c) 2018-present, Yuxi (Evan) You',license:'MIT',licenseUrl:'https://github.com/vuejs/core/blob/main/LICENSE',url:'https://github.com/vuejs/core'},
  {name:'marked',version:'15.0.12',scope:'bundled',purposeZh:'将 Markdown 转换为 HTML',purposeEn:'Convert Markdown to HTML',copyright:'Copyright (c) 2018+ MarkedJS; 2011-2018 Christopher Jeffrey; Markdown © 2004 John Gruber',license:'MIT / BSD-3-Clause notice for Markdown',licenseUrl:'https://github.com/markedjs/marked/blob/master/LICENSE.md',url:'https://github.com/markedjs/marked'},
  {name:'DOMPurify',version:'3.4.14',scope:'bundled',purposeZh:'清理 Markdown 渲染产生的 HTML',purposeEn:'Sanitize HTML produced by Markdown rendering',copyright:'Copyright (c) Cure53 and other contributors',license:'Apache-2.0 OR MPL-2.0',licenseUrl:'https://github.com/cure53/DOMPurify/blob/main/LICENSE',url:'https://github.com/cure53/DOMPurify'}
];
const info=ref({
  version:'3.5.1',license:'MIT',copyright:'Copyright (c) 2026 Skylarr Kuo',
  runtime:{node:'',hexo:'',theme:''},
  links:{
    repository:'https://github.com/Skylarrkuo/hexo-admin-panel',
    npm:'https://www.npmjs.com/package/hexo-admin-panel',
    issues:'https://github.com/Skylarrkuo/hexo-admin-panel/issues',
    license:'https://github.com/Skylarrkuo/hexo-admin-panel/blob/master/LICENSE',
    notices:'https://github.com/Skylarrkuo/hexo-admin-panel/blob/master/THIRD_PARTY_NOTICES.md'
  },
  attributions:fallbackAttributions
});

function scopeLabel(scope){return scope==='peer'?tr('对等宿主','Peer host'):scope==='runtime'?tr('运行依赖','Runtime dependency'):tr('浏览器内嵌','Browser bundle');}

const capabilities=computed(()=>[
  {title:tr('文章与工作流','Posts and workflow'),description:tr('Scaffold、新建状态、Front Matter 类型安全编辑与本地自动保存。','Scaffolds, editorial states, type-safe Front Matter, and local autosave.'),path:'source/_posts · source/_drafts'},
  {title:tr('独立页面','Standalone pages'),description:tr('管理 source 下的页面、模板与主题菜单顺序。','Manage source pages, templates, and theme menu order.'),path:'source/**/index.md'},
  {title:tr('分类与标签','Taxonomies'),description:tr('搜索选择、使用统计、合并、重命名与安全删除。','Search, usage statistics, merge, rename, and safe deletion.'),path:'categories · tags'},
  {title:tr('媒体资源','Media library'),description:tr('递归浏览、路径级引用分析与保留原图的压缩。','Recursive browsing, path-level reference analysis, and backed-up optimization.'),path:'source/images/**'},
  {title:tr('真实主题预览','Real theme previews'),description:tr('临时构建真实主题、插件和最终 permalink，并在隔离的 sandbox iframe 查看。','Temporarily build the real theme, plugins, and final permalink in an isolated sandbox iframe.'),path:'hexo generate → preview'},
  {title:tr('发布中心','Publishing center'),description:tr('定时日历、失败重试、任务进度、取消操作与部署日志。','Scheduling calendar, retries, progress, cancellation, and deployment logs.'),path:'schedule · generate · deploy'}
]);

onMounted(async()=>{
  try{
    const data=await api.get('/system/about');
    info.value={...info.value,...data,runtime:{...info.value.runtime,...data.runtime},links:{...info.value.links,...data.links},attributions:data.attributions?.length?data.attributions:fallbackAttributions};
  }catch(_){loadFailed.value=true;}
});
</script>
