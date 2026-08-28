<template>
  <section class="about-editor-page">
    <div class="toolbar editor-commandbar">
      <div class="editor-switches">
        <div class="filter-tabs" :aria-label="tr('编辑模式','Editing mode')"><button :class="{active:mode==='visual'}" @click="switchMode('visual')">{{ tr('内容编辑','Content') }}</button><button :class="{active:mode==='source'}" @click="switchMode('source')">{{ tr('完整源码','Source') }}</button></div>
        <div class="view-switch" :aria-label="tr('工作区视图','Workspace view')"><button v-for="item in viewOptions" :key="item.value" :class="{active:viewMode===item.value}" @click="setView(item.value)">{{item.label}}</button></div>
      </div>
      <button class="btn btn-primary" :disabled="saving||loading" @click="save">{{saving?tr('保存中...','Saving...'):tr('保存 About','Save About')}}</button>
    </div>

    <div v-if="loading" class="loading">{{ tr('正在打开 About 页面...','Opening the About page...') }}</div>
    <template v-else>
      <div class="about-letterhead">
        <div><span>ABOUT / {{ tr('关于','About') }}</span><h2>{{ tr('写下你希望访客认识的自己','Write the introduction you want visitors to read') }}</h2><p>{{ tr('内容保存到','Content is saved to') }} <code>source/about/index.md</code>{{ tr('，Markdown 内容会直接用于主题的关于页面。','. Its Markdown is rendered directly on the theme’s About page.') }}</p></div>
        <a href="/about/" target="_blank">{{ tr('查看线上页面','View live page') }} ↗</a>
      </div>

      <template v-if="mode==='visual'">
        <div class="card post-meta-card about-meta-card">
          <div class="card-title">{{ tr('页面信息','Page details') }}</div>
          <div class="form-row"><div class="form-group"><label>{{ tr('页面标题','Page title') }}</label><input v-model="editor.title" placeholder="About" @input="markDirty"></div><div class="form-group"><label>{{ tr('主题模板','Theme template') }}</label><input v-model="editor.template" placeholder="about" @input="markDirty"></div></div>
          <div class="form-group"><label>{{ tr('创建时间','Created at') }}</label><input v-model="editor.date" type="datetime-local" @input="markDirty"></div>
        </div>
        <div class="front-matter-section mb-16">
          <div class="flex justify-between items-center mb-8"><label class="extra-field-label">{{ tr('其他 Front Matter','Other Front Matter') }}</label><button class="btn btn-outline btn-sm" @click="addField">＋ {{ tr('添加字段','Add field') }}</button></div>
          <div v-for="(field,index) in editor.frontMatterFields" :key="index" class="fm-row"><input v-model="field.key" :placeholder="tr('字段名','Field name')" style="flex:.4" @input="markDirty"><input v-model="field.value" :placeholder="tr('值','Value')" @input="markDirty"><button class="btn btn-danger btn-sm" :aria-label="tr('删除字段','Delete field')" @click="removeField(index)">×</button></div>
          <div v-if="!editor.frontMatterFields.length" class="text-sm text-muted">{{ tr('当前没有额外字段。','No additional fields.') }}</div>
        </div>
      </template>

      <div class="writing-workspace about-workspace" :class="'workspace-'+viewMode" :style="workspaceStyle">
        <div v-if="viewMode!=='preview'" class="editor-pane" :class="{ 'source-pane':mode==='source' }">
          <div v-if="mode==='source'" class="workspace-pane-head"><span>{{ tr('About 完整源码','Full About source') }}</span><small>{{ tr('包含 YAML Front Matter','Includes YAML Front Matter') }}</small></div>
          <div v-else class="editor-toolbar">
            <button class="toolbar-btn" @click="insertFormat('**','**')" :title="tr('粗体','Bold')"><b>B</b></button><button class="toolbar-btn" @click="insertFormat('*','*')" :title="tr('斜体','Italic')"><i>I</i></button><span class="toolbar-divider"></span>
            <button class="toolbar-btn" @click="insertFormat('## ','')">H2</button><button class="toolbar-btn" @click="insertFormat('### ','')">H3</button><button class="toolbar-btn" @click="insertFormat('\n- ','')">{{ tr('列表','List') }}</button><button class="toolbar-btn" @click="insertFormat('\n> ','')">{{ tr('引用','Quote') }}</button><span class="toolbar-divider"></span>
            <button class="toolbar-btn" @click="insertFormat('`','`')">{{ tr('行内代码','Inline code') }}</button><button class="toolbar-btn" @click="insertFormat('[','](url)')">{{ tr('链接','Link') }}</button><button class="toolbar-btn" @click="pickImage">{{ tr('图片','Image') }}</button>
          </div>
          <div class="editor-dropzone" :class="{'drag-active':dragOver}" @dragover.prevent="dragOver=true" @dragleave="dragOver=false" @drop.prevent="handleDrop">
            <MarkdownCodeEditor ref="markdownEditor" v-model="activeContent" :label="mode==='source'?tr('About 完整 Markdown 源码','Full About Markdown source'):tr('About Markdown 内容','About Markdown content')" @input="handleInput" @paste="handlePaste" />
            <div v-if="uploading" class="upload-overlay"><div class="upload-spinner"></div><span>{{ tr('正在上传图片...','Uploading image...') }}</span></div>
          </div>
        </div>
        <article v-if="viewMode!=='md'" class="theme-preview-shell about-preview-shell">
          <div class="preview-chrome"><span class="preview-status">ABOUT PREVIEW</span><span>Hexo · Redefine</span></div>
          <div class="theme-article about-theme-article"><header class="theme-article-header"><span class="about-preview-kicker">ABOUT ME</span><h1>{{editor.title||'About'}}</h1></header><div class="markdown-body" v-html="preview"></div></div>
        </article>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { api } from '../api/client';
import MarkdownCodeEditor from '../components/MarkdownCodeEditor.vue';
import { renderMarkdown, sanitizeHtml } from '../utils/markdown';
import { useI18n } from '../i18n';

const {tr,errorMessage}=useI18n();

const emit=defineEmits(['notify']);
const editor=reactive({title:'About',date:'',template:'about',content:'',sourceContent:'',frontMatterFields:[],revision:'',visualDirty:false,sourceDirty:false});
const loading=ref(true),saving=ref(false),mode=ref('visual'),viewMode=ref('split'),preview=ref(''),uploading=ref(false),dragOver=ref(false),markdownEditor=ref(null);
const viewOptions=computed(()=>[{value:'split',label:tr('分栏','Split')},{value:'md',label:tr('仅 Markdown','Markdown')},{value:'preview',label:tr('仅预览','Preview')}]);let previewTimer,previewRequest=0;
const activeContent=computed({get:()=>mode.value==='source'?editor.sourceContent:editor.content,set:value=>{if(mode.value==='source')editor.sourceContent=value;else editor.content=value;}});
const workspaceStyle=computed(()=>{const source=activeContent.value||'',chars=viewMode.value==='split'?54:92;const rows=source.split('\n').reduce((sum,line)=>sum+Math.max(1,Math.ceil(Array.from(line).length/chars)),0);return{'--workspace-auto-height':Math.min(viewMode.value==='split'?660:780,Math.max(320,105+rows*23))+'px'};});
function notify(message,type='info'){emit('notify',message,type);}function displayValue(value){return typeof value==='string'?value:JSON.stringify(value);}function parseValue(value){try{return JSON.parse(value);}catch(_){return value;}}
function toLocalDate(value){if(!value)return'';const date=new Date(value);if(Number.isNaN(date.getTime()))return String(value).replace(' ','T').slice(0,16);const pad=n=>String(n).padStart(2,'0');return date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate())+'T'+pad(date.getHours())+':'+pad(date.getMinutes());}
function applyData(data){editor.title=data.title||'About';editor.date=toLocalDate(data.date);editor.template=data.template||'about';editor.content=data.content||'';editor.frontMatterFields=Object.entries(data.frontMatter||{}).map(([key,value])=>({key,value:displayValue(value)}));editor.visualDirty=false;updatePreview(editor.content);}
function visualBody(){const frontMatter={};editor.frontMatterFields.forEach(field=>{const key=field.key.trim();if(key)frontMatter[key]=parseValue(field.value);});let date=editor.date?editor.date.replace('T',' '):'';if(date&&date.length===16)date+=':00';return{title:editor.title.trim()||'About',date,template:editor.template.trim()||'about',content:editor.content,frontMatter};}
async function load(){loading.value=true;try{const data=await api.get('/about');applyData(data);editor.sourceContent=data.raw||'';editor.revision=data.revision||'';editor.sourceDirty=false;}catch(error){notify(errorMessage(error),'error');}finally{loading.value=false;}}
function markDirty(){editor.visualDirty=true;}function handleInput(){if(mode.value==='source')editor.sourceDirty=true;else editor.visualDirty=true;clearTimeout(previewTimer);previewTimer=setTimeout(()=>updatePreview(mode.value==='source'?sourceBody():editor.content),280);}
async function updatePreview(content){const request=++previewRequest;preview.value=renderMarkdown(content||'');try{const data=await api.post('/render',{content:content||''});if(request===previewRequest)preview.value=sanitizeHtml(data.html);}catch(_){}}
function sourceBody(){const raw=(editor.sourceContent||'').replace(/\r\n?/g,'\n'),marker='\n---\n',end=raw.startsWith('---\n')?raw.indexOf(marker,4):-1;return end>=0?raw.slice(end+marker.length):raw;}
async function switchMode(next){if(next===mode.value)return;try{if(next==='source'){if(editor.visualDirty){editor.sourceContent=(await api.post('/about/source/build',visualBody())).raw;editor.visualDirty=false;}updatePreview(sourceBody());}else if(editor.sourceDirty){applyData(await api.post('/about/source/parse',{raw:editor.sourceContent}));editor.sourceDirty=false;}mode.value=next;}catch(error){notify(errorMessage(error),'error');}}
function setView(next){viewMode.value=next;if(next!=='md')updatePreview(mode.value==='source'?sourceBody():editor.content);}
async function save(){if(mode.value==='visual'&&!editor.title.trim()){notify(tr('页面标题不能为空','Page title is required'),'error');return;}saving.value=true;try{const payload=mode.value==='source'?{raw:editor.sourceContent,revision:editor.revision}:{...visualBody(),revision:editor.revision};const data=await api.put('/about',payload);editor.revision=data.revision;editor.visualDirty=false;editor.sourceDirty=false;if(mode.value==='visual')editor.sourceContent=(await api.post('/about/source/build',visualBody())).raw;notify(tr('About 页面已保存','About page saved'),'success');}catch(error){notify(errorMessage(error),'error');}finally{saving.value=false;}}
function addField(){editor.frontMatterFields.push({key:'',value:''});markDirty();}function removeField(index){editor.frontMatterFields.splice(index,1);markDirty();}
function inputElement(){return markdownEditor.value?.element||null;}function insertFormat(before,after){if(mode.value!=='visual')return;const element=inputElement();if(!element)return;const start=element.selectionStart,end=element.selectionEnd,text=editor.content||'',selected=text.slice(start,end)||tr('文本','text');editor.content=text.slice(0,start)+before+selected+after+text.slice(end);handleInput();nextTick(()=>{element.focus();element.setSelectionRange(start+before.length,start+before.length+selected.length);});}
function insertAtCursor(value){const element=inputElement();if(!element)return;const start=element.selectionStart;editor.content=editor.content.slice(0,start)+value+editor.content.slice(start);handleInput();nextTick(()=>{element.focus();element.setSelectionRange(start+value.length,start+value.length);});}
async function upload(file){if(mode.value!=='visual'||!file?.type.startsWith('image/'))return;uploading.value=true;try{const form=new FormData();form.append('file',file);const data=await api.upload('/media/upload',form);insertAtCursor('!['+file.name.replace(/\.[^.]+$/,'')+']('+data.path+')');notify(tr('图片已插入 About 内容','Image inserted into the About page'),'success');}catch(error){notify(tr('图片上传失败：{message}','Image upload failed: {message}',{message:errorMessage(error)}),'error');}finally{uploading.value=false;}}
function pickImage(){const input=document.createElement('input');input.type='file';input.accept='image/*';input.onchange=()=>upload(input.files?.[0]);input.click();}function handleDrop(event){dragOver.value=false;for(const file of event.dataTransfer?.files||[])if(file.type.startsWith('image/'))upload(file);}function handlePaste(event){for(const item of event.clipboardData?.items||[])if(item.type.startsWith('image/')){event.preventDefault();upload(item.getAsFile());break;}}
watch(mode,()=>nextTick(()=>{}));load();
</script>
