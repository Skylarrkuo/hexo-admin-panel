<template>
  <section class="about-editor-page">
    <div class="toolbar editor-commandbar">
      <div class="editor-switches">
        <div class="filter-tabs" aria-label="编辑模式"><button :class="{active:mode==='visual'}" @click="switchMode('visual')">内容编辑</button><button :class="{active:mode==='source'}" @click="switchMode('source')">完整源码</button></div>
        <div class="view-switch" aria-label="工作区视图"><button v-for="item in viewOptions" :key="item.value" :class="{active:viewMode===item.value}" @click="setView(item.value)">{{item.label}}</button></div>
      </div>
      <button class="btn btn-primary" :disabled="saving||loading" @click="save">{{saving?'保存中...':'保存 About'}}</button>
    </div>

    <div v-if="loading" class="loading">正在打开 About 页面...</div>
    <template v-else>
      <div class="about-letterhead">
        <div><span>ABOUT / 关于</span><h2>写下你希望访客认识的自己</h2><p>这里保存到 <code>source/about/index.md</code>，Markdown 内容会直接用于主题的关于页面。</p></div>
        <a href="/about/" target="_blank">查看线上页面 ↗</a>
      </div>

      <template v-if="mode==='visual'">
        <div class="card post-meta-card about-meta-card">
          <div class="card-title">页面信息</div>
          <div class="form-row"><div class="form-group"><label>页面标题</label><input v-model="editor.title" placeholder="About" @input="markDirty"></div><div class="form-group"><label>主题模板</label><input v-model="editor.template" placeholder="about" @input="markDirty"></div></div>
          <div class="form-group"><label>创建时间</label><input v-model="editor.date" type="datetime-local" @input="markDirty"></div>
        </div>
        <div class="front-matter-section mb-16">
          <div class="flex justify-between items-center mb-8"><label class="extra-field-label">其他 Front Matter</label><button class="btn btn-outline btn-sm" @click="addField">＋ 添加字段</button></div>
          <div v-for="(field,index) in editor.frontMatterFields" :key="index" class="fm-row"><input v-model="field.key" placeholder="字段名" style="flex:.4" @input="markDirty"><input v-model="field.value" placeholder="值" @input="markDirty"><button class="btn btn-danger btn-sm" aria-label="删除字段" @click="removeField(index)">×</button></div>
          <div v-if="!editor.frontMatterFields.length" class="text-sm text-muted">当前没有额外字段。</div>
        </div>
      </template>

      <div class="writing-workspace about-workspace" :class="'workspace-'+viewMode" :style="workspaceStyle">
        <div v-if="viewMode!=='preview'" class="editor-pane" :class="{ 'source-pane':mode==='source' }">
          <div v-if="mode==='source'" class="workspace-pane-head"><span>About 完整源码</span><small>包含 YAML Front Matter</small></div>
          <div v-else class="editor-toolbar">
            <button class="toolbar-btn" @click="insertFormat('**','**')" title="粗体"><b>B</b></button><button class="toolbar-btn" @click="insertFormat('*','*')" title="斜体"><i>I</i></button><span class="toolbar-divider"></span>
            <button class="toolbar-btn" @click="insertFormat('## ','')">H2</button><button class="toolbar-btn" @click="insertFormat('### ','')">H3</button><button class="toolbar-btn" @click="insertFormat('\n- ','')">列表</button><button class="toolbar-btn" @click="insertFormat('\n> ','')">引用</button><span class="toolbar-divider"></span>
            <button class="toolbar-btn" @click="insertFormat('`','`')">行内代码</button><button class="toolbar-btn" @click="insertFormat('[','](url)')">链接</button><button class="toolbar-btn" @click="pickImage">图片</button>
          </div>
          <div class="editor-dropzone" :class="{'drag-active':dragOver}" @dragover.prevent="dragOver=true" @dragleave="dragOver=false" @drop.prevent="handleDrop">
            <MarkdownCodeEditor ref="markdownEditor" v-model="activeContent" :label="mode==='source'?'About 完整 Markdown 源码':'About Markdown 内容'" @input="handleInput" @paste="handlePaste" />
            <div v-if="uploading" class="upload-overlay"><div class="upload-spinner"></div><span>正在上传图片...</span></div>
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

const emit=defineEmits(['notify']);
const editor=reactive({title:'About',date:'',template:'about',content:'',sourceContent:'',frontMatterFields:[],revision:'',visualDirty:false,sourceDirty:false});
const loading=ref(true),saving=ref(false),mode=ref('visual'),viewMode=ref('split'),preview=ref(''),uploading=ref(false),dragOver=ref(false),markdownEditor=ref(null);
const viewOptions=[{value:'split',label:'分栏'},{value:'md',label:'仅 Markdown'},{value:'preview',label:'仅预览'}];let previewTimer,previewRequest=0;
const activeContent=computed({get:()=>mode.value==='source'?editor.sourceContent:editor.content,set:value=>{if(mode.value==='source')editor.sourceContent=value;else editor.content=value;}});
const workspaceStyle=computed(()=>{const source=activeContent.value||'',chars=viewMode.value==='split'?54:92;const rows=source.split('\n').reduce((sum,line)=>sum+Math.max(1,Math.ceil(Array.from(line).length/chars)),0);return{'--workspace-auto-height':Math.min(viewMode.value==='split'?660:780,Math.max(320,105+rows*23))+'px'};});
function notify(message,type='info'){emit('notify',message,type);}function displayValue(value){return typeof value==='string'?value:JSON.stringify(value);}function parseValue(value){try{return JSON.parse(value);}catch(_){return value;}}
function toLocalDate(value){if(!value)return'';const date=new Date(value);if(Number.isNaN(date.getTime()))return String(value).replace(' ','T').slice(0,16);const pad=n=>String(n).padStart(2,'0');return date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate())+'T'+pad(date.getHours())+':'+pad(date.getMinutes());}
function applyData(data){editor.title=data.title||'About';editor.date=toLocalDate(data.date);editor.template=data.template||'about';editor.content=data.content||'';editor.frontMatterFields=Object.entries(data.frontMatter||{}).map(([key,value])=>({key,value:displayValue(value)}));editor.visualDirty=false;updatePreview(editor.content);}
function visualBody(){const frontMatter={};editor.frontMatterFields.forEach(field=>{const key=field.key.trim();if(key)frontMatter[key]=parseValue(field.value);});let date=editor.date?editor.date.replace('T',' '):'';if(date&&date.length===16)date+=':00';return{title:editor.title.trim()||'About',date,template:editor.template.trim()||'about',content:editor.content,frontMatter};}
async function load(){loading.value=true;try{const data=await api.get('/about');applyData(data);editor.sourceContent=data.raw||'';editor.revision=data.revision||'';editor.sourceDirty=false;}catch(error){notify(error.message,'error');}finally{loading.value=false;}}
function markDirty(){editor.visualDirty=true;}function handleInput(){if(mode.value==='source')editor.sourceDirty=true;else editor.visualDirty=true;clearTimeout(previewTimer);previewTimer=setTimeout(()=>updatePreview(mode.value==='source'?sourceBody():editor.content),280);}
async function updatePreview(content){const request=++previewRequest;preview.value=renderMarkdown(content||'');try{const data=await api.post('/render',{content:content||''});if(request===previewRequest)preview.value=sanitizeHtml(data.html);}catch(_){}}
function sourceBody(){const raw=(editor.sourceContent||'').replace(/\r\n?/g,'\n'),marker='\n---\n',end=raw.startsWith('---\n')?raw.indexOf(marker,4):-1;return end>=0?raw.slice(end+marker.length):raw;}
async function switchMode(next){if(next===mode.value)return;try{if(next==='source'){if(editor.visualDirty){editor.sourceContent=(await api.post('/about/source/build',visualBody())).raw;editor.visualDirty=false;}updatePreview(sourceBody());}else if(editor.sourceDirty){applyData(await api.post('/about/source/parse',{raw:editor.sourceContent}));editor.sourceDirty=false;}mode.value=next;}catch(error){notify(error.message,'error');}}
function setView(next){viewMode.value=next;if(next!=='md')updatePreview(mode.value==='source'?sourceBody():editor.content);}
async function save(){if(mode.value==='visual'&&!editor.title.trim()){notify('页面标题不能为空','error');return;}saving.value=true;try{const payload=mode.value==='source'?{raw:editor.sourceContent,revision:editor.revision}:{...visualBody(),revision:editor.revision};const data=await api.put('/about',payload);editor.revision=data.revision;editor.visualDirty=false;editor.sourceDirty=false;if(mode.value==='visual')editor.sourceContent=(await api.post('/about/source/build',visualBody())).raw;notify('About 页面已保存','success');}catch(error){notify(error.message,'error');}finally{saving.value=false;}}
function addField(){editor.frontMatterFields.push({key:'',value:''});markDirty();}function removeField(index){editor.frontMatterFields.splice(index,1);markDirty();}
function inputElement(){return markdownEditor.value?.element||null;}function insertFormat(before,after){if(mode.value!=='visual')return;const element=inputElement();if(!element)return;const start=element.selectionStart,end=element.selectionEnd,text=editor.content||'',selected=text.slice(start,end)||'文本';editor.content=text.slice(0,start)+before+selected+after+text.slice(end);handleInput();nextTick(()=>{element.focus();element.setSelectionRange(start+before.length,start+before.length+selected.length);});}
function insertAtCursor(value){const element=inputElement();if(!element)return;const start=element.selectionStart;editor.content=editor.content.slice(0,start)+value+editor.content.slice(start);handleInput();nextTick(()=>{element.focus();element.setSelectionRange(start+value.length,start+value.length);});}
async function upload(file){if(mode.value!=='visual'||!file?.type.startsWith('image/'))return;uploading.value=true;try{const form=new FormData();form.append('file',file);const data=await api.upload('/media/upload',form);insertAtCursor('!['+file.name.replace(/\.[^.]+$/,'')+']('+data.path+')');notify('图片已插入 About 内容','success');}catch(error){notify('图片上传失败：'+error.message,'error');}finally{uploading.value=false;}}
function pickImage(){const input=document.createElement('input');input.type='file';input.accept='image/*';input.onchange=()=>upload(input.files?.[0]);input.click();}function handleDrop(event){dragOver.value=false;for(const file of event.dataTransfer?.files||[])if(file.type.startsWith('image/'))upload(file);}function handlePaste(event){for(const item of event.clipboardData?.items||[])if(item.type.startsWith('image/')){event.preventDefault();upload(item.getAsFile());break;}}
watch(mode,()=>nextTick(()=>{}));load();
</script>
