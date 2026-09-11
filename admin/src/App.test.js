import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import App from './App.vue';
import ConfigAtlas from './components/ConfigAtlas.vue';
import EssaysPage from './pages/EssaysPage.vue';
import PostEditorPage from './pages/PostEditorPage.vue';
import AboutPage from './pages/AboutPage.vue';
import MarkdownCodeEditor from './components/MarkdownCodeEditor.vue';
import PostsPage from './pages/PostsPage.vue';
import MediaPage from './pages/MediaPage.vue';
import TaxonomySelector from './components/TaxonomySelector.vue';
import PluginAboutPage from './pages/PluginAboutPage.vue';
import { renderMarkdown } from './utils/markdown';
import { fieldsFromSchema, sectionsFromSchema } from './utils/config-schema';
import { fieldsToFrontMatter, frontMatterFields } from './utils/front-matter-fields';
import { setLocale } from './i18n';

describe('admin application', () => {
  beforeEach(() => {
    localStorage.clear();
    setLocale('zh-CN');
    location.hash = '';
    document.documentElement.dataset.theme = 'light';
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the existing login experience as a Vue component', () => {
    const wrapper = mount(App);
    expect(wrapper.get('h2').text()).toBe('Hexo Admin Panel');
    expect(wrapper.get('input[type="password"]').attributes('autocomplete')).toBe('current-password');
  });

  it('persists the global light and dark appearance choice', async () => {
    const wrapper=mount(App);
    expect(document.documentElement.dataset.theme).toBe('light');
    await wrapper.get('.auth-theme-toggle').trigger('click');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('hexo_admin_color_mode')).toBe('dark');
  });

  it('switches and persists the complete interface language', async () => {
    const wrapper=mount(App);
    await wrapper.get('.language-toggle').trigger('click');
    expect(wrapper.get('h2').text()).toBe('Hexo Admin Panel');
    expect(wrapper.get('label[for="admin-username"]').text()).toBe('Username');
    expect(localStorage.getItem('hexo_admin_locale')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('sanitizes rendered Markdown', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)"><script>alert(1)</script>');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('<script');
  });

  it('preserves explicit Front Matter value types', () => {
    const fields=frontMatterFields({stringBoolean:'true',number:12,enabled:false,nested:{ok:true},list:['a'],empty:null});
    expect(fields.find(field=>field.key==='stringBoolean').type).toBe('string');
    expect(fieldsToFrontMatter(fields)).toEqual({stringBoolean:'true',number:12,enabled:false,nested:{ok:true},list:['a'],empty:null});
    expect(()=>fieldsToFrontMatter([...fields,{key:'number',type:'string',value:'duplicate'}])).toThrow(/重复/);
  });

  it('searches existing taxonomies and can create a new choice', async () => {
    const wrapper=mount(TaxonomySelector,{props:{modelValue:'Hexo',label:'标签',placeholder:'搜索标签',options:[{name:'Hexo',count:2},{name:'Node.js',count:5}]}});
    await wrapper.get('.taxonomy-control input').trigger('focus');
    await wrapper.get('.taxonomy-control input').setValue('Node');
    await wrapper.get('.taxonomy-options button').trigger('mousedown');
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['Hexo, Node.js']);
    await wrapper.get('.taxonomy-control input').setValue('New tag');
    await wrapper.get('.taxonomy-control input').trigger('keydown.enter');
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['Hexo, New tag']);
  });

  it('provides a dedicated essays editor with sanitized Markdown preview', () => {
    const wrapper = mount(EssaysPage, { global: { stubs: {} } });
    expect(wrapper.text()).toContain('随笔管理');
    expect(renderMarkdown('<img src=x onerror=alert(1)>')).not.toContain('onerror');
  });

  it('renders fields and sections exclusively from the server schema', () => {
    const config = { info: { title: 'Blog' }, articles: { lazyload: true }, links: [] };
    const schema = { fields: [{ key: 'info.title', path: ['info','title'], type: 'string', section: 'info', label: '站点标题' }], sections: [{ key: 'info', label: '基本资料' }] };
    const fields = fieldsFromSchema(config, schema);
    const sections = sectionsFromSchema(schema, fields);
    expect(fields.find(field => field.key === 'info.title').label).toBe('站点标题');
    expect(fields).toHaveLength(1);
    expect(sections.find(section => section.key === 'info').label).toBe('基本资料');
  });

  it('does not infer theme fields that are absent from the server schema', () => {
    const wrapper = mount(ConfigAtlas, { props: {
      config: { info: { title: 'Blog', hidden: 'not described' } },
      schema: { fields: [{ key: 'info.title', path: ['info','title'], type: 'string', section: 'info', label: '站点标题' }], sections: [{ key: 'info', label: '基本资料' }] }
    } });
    expect(wrapper.findAll('.config-field')).toHaveLength(1);
    expect(wrapper.text()).toContain('站点标题');
    expect(wrapper.text()).not.toContain('not described');
  });

  it('renders built-in theme metadata in the selected language', () => {
    setLocale('en');
    const wrapper = mount(ConfigAtlas, { props: {
      config: { info: { title: 'Blog' } },
      schema: {
        fields: [{ key: 'info.title', path: ['info','title'], type: 'string', section: 'info', label: '网站标题', labelI18n: {'zh-CN':'网站标题',en:'Site title'}, descriptionI18n: {'zh-CN':'网站标题',en:'Site title'} }],
        sections: [{ key: 'info', label: '基本信息', labelI18n: {'zh-CN':'基本信息',en:'Basic information'} }]
      }
    } });
    expect(wrapper.text()).toContain('Site title');
    expect(wrapper.text()).toContain('Basic information');
    expect(wrapper.text()).toContain('Configuration map');
  });

  it('highlights Markdown without rendering source HTML', () => {
    const wrapper = mount(MarkdownCodeEditor, { props: { modelValue: '# 标题\n\n**重点** `<script>`' } });
    expect(wrapper.get('pre').html()).toContain('hljs-section');
    expect(wrapper.get('pre').html()).toContain('hljs-strong');
    expect(wrapper.get('pre').html()).toContain('&lt;script&gt;');
    expect(wrapper.find('pre script').exists()).toBe(false);
  });

  it('supports split, Markdown-only and theme-preview views with a dedicated cover field', async () => {
    const originalFetch=global.fetch;
    global.fetch=async (_url,_options)=>{
      const isRender=String(_url).endsWith('/render');
      return {status:200,json:async()=>({success:true,data:isRender?{html:'<h2>Hexo preview</h2><p>Rendered body</p>'}:{_id:'demo',title:'示例文章',date:'2026-08-26 12:00:00',categories:['技术'],tags:['Hexo'],content:'# 正文',frontMatter:{cover:'/images/cover.webp',toc:true},raw:'---\ntitle: 示例文章\ncover: /images/cover.webp\n---\n# 正文',revision:'rev-1'}})};
    };
    const wrapper=mount(PostEditorPage,{props:{postId:'demo'}});
    await flushPromises();
    expect(wrapper.get('#post-cover').element.value).toBe('/images/cover.webp');
    expect(wrapper.find('.markdown-code-editor').exists()).toBe(true);
    expect(wrapper.find('.theme-preview-shell').exists()).toBe(true);
    const compactHeight=wrapper.get('.writing-workspace').attributes('style');
    const markdownEditor=wrapper.findComponent(MarkdownCodeEditor);
    markdownEditor.vm.$emit('update:modelValue',Array.from({length:24},(_,index)=>'## 段落 '+index+' 这是一段用于测试动态高度的正文。').join('\n'));
    markdownEditor.vm.$emit('input');
    await wrapper.vm.$nextTick();
    expect(wrapper.get('.writing-workspace').attributes('style')).not.toBe(compactHeight);
    await wrapper.get('.view-switch button:nth-child(2)').trigger('click');
    expect(wrapper.find('.theme-preview-shell').exists()).toBe(false);
    await wrapper.get('.view-switch button:nth-child(3)').trigger('click');
    await flushPromises();
    expect(wrapper.find('.markdown-code-editor').exists()).toBe(false);
    expect(wrapper.get('.theme-preview-shell').text()).toContain('示例文章');
    global.fetch=originalFetch;
  });

  it('autosaves unsaved post edits locally and protects browser navigation', async () => {
    vi.useFakeTimers();
    const originalFetch=global.fetch;
    global.fetch=vi.fn(async url=>({status:200,json:async()=>({success:true,data:String(url).endsWith('/render')?{html:'<p>Preview</p>'}:{_id:'autosave-post',title:'Autosave',date:'2026-08-26 12:00:00',categories:[],tags:[],content:'Initial',frontMatter:{},raw:'---\ntitle: Autosave\n---\nInitial',revision:'a'.repeat(64)}})}));
    const wrapper=mount(PostEditorPage,{props:{postId:'autosave-post'}});
    await flushPromises();
    const markdownEditor=wrapper.findComponent(MarkdownCodeEditor);
    markdownEditor.vm.$emit('update:modelValue','Changed locally');
    markdownEditor.vm.$emit('input');
    await wrapper.vm.$nextTick();
    await vi.advanceTimersByTimeAsync(850);
    const saved=JSON.parse(localStorage.getItem('hexo_admin_post_autosave_autosave-post'));
    expect(saved.state.content).toBe('Changed locally');
    expect(wrapper.emitted('dirty-change').at(-1)).toEqual([true]);
    const event=new Event('beforeunload',{cancelable:true});
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    wrapper.unmount();
    global.fetch=originalFetch;
  });

  it('selects posts for bulk operations and configures scheduled publishing', async () => {
    const posts=[{_id:'draft-1',title:'Draft one',date:'2026-08-28T08:00:00Z',categories:[],tags:[],wordCount:10,published:false,revision:'a'.repeat(64)}];
    const wrapper=mount(PostsPage,{props:{posts,loading:false,search:'',status:'all',page:1,total:1,totalPages:1,pageRange:[1]}});
    await wrapper.get('tbody input[type="checkbox"]').setValue(true);
    expect(wrapper.text()).toContain('已选择 1 篇');
    await wrapper.findAll('.bulk-action-bar button')[0].trigger('click');
    expect(wrapper.emitted('bulk')[0]).toEqual(['publish',posts]);
    const scheduleButton=wrapper.findAll('button').find(button=>button.text()==='定时');
    await scheduleButton.trigger('click');
    expect(wrapper.find('input[type="datetime-local"]').exists()).toBe(true);
  });

  it('shows media usage analysis and emits compression actions', async () => {
    const file={name:'cover.png',path:'/images/cover.png',size:2048,used:true,referenceCount:2,references:[{source:'_posts/demo.md',count:2}]};
    const wrapper=mount(MediaPage,{props:{files:[file],loading:false,search:'',usage:'all',compressing:'',page:1,totalPages:1}});
    expect(wrapper.text()).toContain('2 处引用');
    const unusedButton=wrapper.findAll('.filter-tabs button').find(button=>button.text()==='扫描范围内无引用');
    await unusedButton.trigger('click');
    expect(wrapper.emitted('update:usage')[0]).toEqual(['unused']);
    const compressButton=wrapper.findAll('button').find(button=>button.text()==='压缩');
    await compressButton.trigger('click');
    expect(wrapper.emitted('compress')[0]).toEqual([file]);
  });

  it('edits the About page with Markdown, source and preview modes', async () => {
    const originalFetch=global.fetch;
    global.fetch=async url=>{
      const isRender=String(url).endsWith('/render');
      return {status:200,json:async()=>({success:true,data:isRender?{html:'<h2>关于我</h2><p>正文</p>'}:{title:'About',date:'2026-06-04 14:27:30',template:'about',content:'## 关于我\n\n正文',frontMatter:{comments:true},raw:'---\ntitle: About\ntemplate: about\n---\n## 关于我',revision:'a'.repeat(64)}})};
    };
    const wrapper=mount(AboutPage);
    await flushPromises();
    expect(wrapper.text()).toContain('写下你希望访客认识的自己');
    expect(wrapper.find('.markdown-code-editor').exists()).toBe(true);
    expect(wrapper.find('.about-preview-shell').exists()).toBe(true);
    await wrapper.get('.view-switch button:nth-child(2)').trigger('click');
    expect(wrapper.find('.about-preview-shell').exists()).toBe(false);
    await wrapper.get('.filter-tabs button:nth-child(2)').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('About 完整源码');
    global.fetch=originalFetch;
  });

  it('explains the plugin and links its source, package, license, and attributions', async () => {
    const originalFetch=global.fetch;
    global.fetch=vi.fn(async()=>({status:200,json:async()=>({success:true,data:{
      name:'hexo-admin-panel',version:'3.5.0',license:'MIT',copyright:'Copyright (c) 2026 Skylarr Kuo',
      runtime:{node:'v20.19.0',hexo:'8.1.2',theme:'redefine'},
      links:{repository:'https://github.com/Skylarrkuo/hexo-admin-panel',npm:'https://www.npmjs.com/package/hexo-admin-panel',issues:'https://github.com/Skylarrkuo/hexo-admin-panel/issues',license:'https://github.com/Skylarrkuo/hexo-admin-panel/blob/master/LICENSE',notices:'https://github.com/Skylarrkuo/hexo-admin-panel/blob/master/THIRD_PARTY_NOTICES.md'},
      attributions:[{name:'Vue',version:'3.5.41',scope:'bundled',purposeZh:'管理后台界面运行时',purposeEn:'Admin interface runtime',copyright:'Copyright (c) 2018-present, Yuxi (Evan) You',license:'MIT',licenseUrl:'https://github.com/vuejs/core/blob/main/LICENSE',url:'https://github.com/vuejs/core'}]
    }})}));
    const wrapper=mount(PluginAboutPage);
    await flushPromises();
    expect(wrapper.text()).toContain('把 Hexo 的文件工作流');
    expect(wrapper.text()).toContain('v20.19.0');
    expect(wrapper.text()).toContain('Vue');
    expect(wrapper.text()).toContain('Copyright (c) 2018-present, Yuxi (Evan) You');
    expect(wrapper.text()).toContain('3.5.41');
    expect(wrapper.get('a[href="https://github.com/Skylarrkuo/hexo-admin-panel"]').attributes('target')).toBe('_blank');
    expect(wrapper.get('a[href="https://www.npmjs.com/package/hexo-admin-panel"]').exists()).toBe(true);
    expect(wrapper.get('a[href$="THIRD_PARTY_NOTICES.md"]').exists()).toBe(true);
    expect(wrapper.get('.plugin-brand-plate img').attributes('src')).toMatch(/^(data:image\/svg\+xml|.*hexo-admin-panel-logo)/);
    global.fetch=originalFetch;
  });

  it('keeps the complete third-party notice list visible when runtime metadata is unavailable', async () => {
    const originalFetch=global.fetch;
    global.fetch=vi.fn(async()=>{throw new Error('backend restarting');});
    const wrapper=mount(PluginAboutPage);
    await flushPromises();
    expect(wrapper.findAll('.plugin-attribution-grid li')).toHaveLength(8);
    expect(wrapper.text()).toContain('Copyright 2013 Lovell Fuller and others');
    expect(wrapper.text()).toContain('Copyright (c) Cure53 and other contributors');
    expect(wrapper.text()).not.toContain('完整版本与传递依赖许可可在');
    global.fetch=originalFetch;
  });
});
