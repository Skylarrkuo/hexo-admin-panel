<template>
  <section class="post-editor-page">
    <div class="toolbar editor-commandbar">
      <button class="btn btn-outline" @click="$emit('cancel')">← 返回文章</button>
      <div class="editor-switches">
        <div class="filter-tabs" aria-label="编辑模式">
          <button :class="{active:mode==='visual'}" @click="switchMode('visual')">表单编辑</button>
          <button :class="{active:mode==='source'}" @click="switchMode('source')">完整源码</button>
        </div>
        <div class="view-switch" aria-label="工作区视图">
          <button v-for="item in viewOptions" :key="item.value" :class="{active:viewMode===item.value}" @click="setView(item.value)">{{item.label}}</button>
        </div>
      </div>
      <button class="btn btn-primary" @click="save" :disabled="saving">{{ saving?'保存中...':'保存文章' }}</button>
    </div>

    <div v-if="loading" class="loading">加载文章...</div>
    <template v-else>
      <template v-if="mode==='visual'">
        <div class="card post-meta-card">
          <div class="card-title">文章信息</div>
          <div class="form-row">
            <div class="form-group"><label>标题</label><input v-model="editor.title" placeholder="文章标题" @input="markVisualDirty"></div>
            <div class="form-group"><label>发布日期</label><input v-model="editor.date" type="datetime-local" @input="markVisualDirty"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>分类（逗号分隔）</label><input v-model="editor.categoriesStr" placeholder="例如：技术, JavaScript" @input="markVisualDirty"></div>
            <div class="form-group"><label>标签（逗号分隔）</label><input v-model="editor.tagsStr" placeholder="例如：node, hexo" @input="markVisualDirty"></div>
          </div>
        </div>

        <div class="card cover-field-card">
          <div class="cover-field-copy"><div class="card-title">文章首图</div><p>对应 Front Matter 的 <code>cover</code> 字段，将用于主题首页卡片或文章头图。</p></div>
          <div class="cover-field-body">
            <div class="cover-preview">
              <img v-if="editor.cover&&!coverBroken" :src="coverPreviewUrl" alt="文章首图预览" @error="coverBroken=true">
              <div v-else class="cover-placeholder"><span>◇</span><small>{{editor.cover?'图片无法预览':'尚未设置首图'}}</small></div>
            </div>
            <div class="cover-controls">
              <label for="post-cover">图片路径或 URL</label>
              <input id="post-cover" v-model="editor.cover" placeholder="/images/cover.webp" @input="coverBroken=false;markVisualDirty()">
              <div class="btn-group">
                <input ref="coverInput" type="file" accept="image/*" hidden @change="uploadCover">
                <button class="btn btn-outline btn-sm" :disabled="coverUploading" @click="coverInput.click()">{{coverUploading?'上传中...':'上传首图'}}</button>
                <button v-if="editor.cover" class="btn btn-outline btn-sm" @click="clearCover">移除首图</button>
              </div>
            </div>
          </div>
        </div>

        <div class="front-matter-section mb-16">
          <div class="flex justify-between items-center mb-8"><label class="extra-field-label">Front Matter（其他字段）</label><button class="btn btn-outline btn-sm" @click="addField">＋ 添加字段</button></div>
          <div v-for="(field,index) in editor.frontMatterFields" :key="index" class="fm-row">
            <input v-model="field.key" placeholder="字段名" style="flex:.4" @input="markVisualDirty"><input v-model="field.value" placeholder="值" @input="markVisualDirty"><button class="btn btn-danger btn-sm" aria-label="删除字段" @click="removeField(index)">×</button>
          </div>
          <div v-if="editor.frontMatterFields.length===0" class="text-sm text-muted">没有其他 Front Matter 字段。</div>
        </div>

        <div class="writing-workspace" :class="'workspace-'+viewMode" :style="workspaceStyle">
          <div v-if="viewMode!=='preview'" class="editor-pane">
            <div class="editor-toolbar">
              <button class="toolbar-btn" @click="insertFormat('**','**')" title="粗体"><b>B</b></button><button class="toolbar-btn" @click="insertFormat('*','*')" title="斜体"><i>I</i></button><button class="toolbar-btn" @click="insertFormat('~~','~~')" title="删除线"><s>S</s></button><span class="toolbar-divider"></span>
              <button class="toolbar-btn" @click="insertFormat('# ','')">H1</button><button class="toolbar-btn" @click="insertFormat('## ','')">H2</button><button class="toolbar-btn" @click="insertFormat('### ','')">H3</button><span class="toolbar-divider"></span>
              <button class="toolbar-btn" @click="insertFormat('\n- ','')">列表</button><button class="toolbar-btn" @click="insertFormat('\n1. ','')">序号</button><button class="toolbar-btn" @click="insertFormat('\n> ','')">引用</button><span class="toolbar-divider"></span>
              <button class="toolbar-btn" @click="insertCode">行内代码</button><button class="toolbar-btn" @click="insertCodeBlock">代码块</button><button class="toolbar-btn" @click="insertFormat('[','](url)')">链接</button><button class="toolbar-btn" @click="insertImage">图片</button>
            </div>
            <div class="editor-dropzone" :class="{'drag-active':dragOver}" @dragover.prevent="dragOver=true" @dragleave="dragOver=false" @drop.prevent="handleDrop">
              <MarkdownCodeEditor ref="textarea" v-model="editor.content" label="Markdown 正文" @input="handleVisualInput" @paste="handlePaste" />
              <div v-if="uploading" class="upload-overlay"><div class="upload-spinner"></div><span>正在上传图片...</span></div>
            </div>
          </div>
          <ThemePreview v-if="viewMode!=='md'" :editor="editor" :html="preview" :cover-url="coverPreviewUrl" :cover-broken="coverBroken" @cover-error="coverBroken=true" />
        </div>
      </template>

      <template v-else>
        <div class="writing-workspace source-workspace" :class="'workspace-'+viewMode" :style="workspaceStyle">
          <div v-if="viewMode!=='preview'" class="editor-pane source-pane">
            <div class="workspace-pane-head"><span>完整 Markdown</span><small>包含 YAML Front Matter</small></div>
            <MarkdownCodeEditor v-model="editor.sourceContent" label="完整 Markdown 源码" @input="handleSourceInput" />
          </div>
          <ThemePreview v-if="viewMode!=='md'" :editor="editor" :html="preview" :cover-url="coverPreviewUrl" :cover-broken="coverBroken" @cover-error="coverBroken=true" />
        </div>
      </template>
    </template>
  </section>
</template>

<script setup>
import { computed, defineComponent, h, nextTick, reactive, ref, watch } from 'vue';
import { api, assetUrl } from '../api/client';
import MarkdownCodeEditor from '../components/MarkdownCodeEditor.vue';
import { renderMarkdown, sanitizeHtml } from '../utils/markdown';

const ThemePreview=defineComponent({
  props:{editor:Object,html:String,coverUrl:String,coverBroken:Boolean},emits:['cover-error'],
  setup(props,{emit}){return()=>h('article',{class:'theme-preview-shell'},[
    h('div',{class:'preview-chrome'},[h('span',{class:'preview-status'},'THEME PREVIEW'),h('span',{},'Hexo · Redefine')]),
    h('div',{class:'theme-article'},[
      props.editor.cover&&!props.coverBroken?h('img',{class:'theme-cover',src:props.coverUrl,alt:'',onError:()=>emit('cover-error')}):null,
      h('header',{class:'theme-article-header'},[h('h1',{},props.editor.title||'未命名文章'),h('div',{class:'theme-article-meta'},[props.editor.date?props.editor.date.replace('T',' '):'未设置日期',props.editor.categoriesStr?' · '+props.editor.categoriesStr:''])]),
      h('div',{class:'markdown-body',innerHTML:props.html})
    ])
  ]);}
});

const props=defineProps({postId:{type:String,required:true}});const emit=defineEmits(['cancel','saved','notify']);
const editor=reactive({id:null,title:'',date:'',categoriesStr:'',tagsStr:'',cover:'',content:'',frontMatterFields:[],sourceContent:'',visualDirty:false,sourceDirty:false,revision:''});
const loading=ref(false),saving=ref(false),mode=ref('visual'),viewMode=ref('split'),preview=ref(''),dragOver=ref(false),uploading=ref(false),coverUploading=ref(false),coverBroken=ref(false),textarea=ref(null),coverInput=ref(null);
const viewOptions=[{value:'split',label:'分栏'},{value:'md',label:'仅 Markdown'},{value:'preview',label:'仅预览'}];let previewTimer,previewRequest=0;
const coverPreviewUrl=computed(()=>{const value=String(editor.cover||'').trim();return /^(https?:|data:|blob:)/i.test(value)?value:assetUrl(value);});
const workspaceStyle=computed(()=>{
  const markdown=mode.value==='source'?editor.sourceContent:editor.content;
  const charsPerLine=viewMode.value==='split'?54:92;
  const markdownRows=String(markdown||'').split('\n').reduce((total,line)=>total+Math.max(1,Math.ceil(Array.from(line).length/charsPerLine)),0);
  const previewText=String(preview.value||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  const headings=(String(preview.value||'').match(/<h[1-6]\b/gi)||[]).length;
  const previewRows=Math.max(1,Math.ceil(Array.from(previewText).length/(viewMode.value==='split'?52:86))+headings*2);
  let desired;
  if(viewMode.value==='md')desired=76+markdownRows*23;
  else if(viewMode.value==='preview')desired=190+previewRows*25;
  else desired=Math.max(76+markdownRows*23,190+previewRows*25);
  const maximum=viewMode.value==='split'?660:780;
  return{'--workspace-auto-height':Math.min(maximum,Math.max(290,desired))+'px'};
});
function notify(message,type='info'){emit('notify',message,type);}function toLocalDate(value){if(!value)return'';const date=new Date(value);if(Number.isNaN(date.getTime()))return String(value).replace(' ','T').slice(0,16);const pad=value=>String(value).padStart(2,'0');return date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate())+'T'+pad(date.getHours())+':'+pad(date.getMinutes());}
function displayValue(value){return typeof value==='string'?value:JSON.stringify(value);}function parseValue(value){try{return JSON.parse(value);}catch(_){return value;}}
function applyData(data){editor.title=data.title||'';editor.date=toLocalDate(data.date);editor.categoriesStr=(Array.isArray(data.categories)?data.categories:[data.categories]).filter(Boolean).join(', ');editor.tagsStr=(Array.isArray(data.tags)?data.tags:[data.tags]).filter(Boolean).join(', ');editor.content=data.content||'';const fields={...(data.frontMatter||{})};editor.cover=typeof fields.cover==='string'?fields.cover:'';delete fields.cover;editor.frontMatterFields=Object.entries(fields).map(([key,value])=>({key,value:displayValue(value)}));if(data.revision!==undefined)editor.revision=data.revision;editor.visualDirty=false;coverBroken.value=false;updatePreview(editor.content);}
function body(){const frontMatter={};editor.frontMatterFields.forEach(field=>{const key=field.key.trim();if(key&&key!=='cover')frontMatter[key]=parseValue(field.value);});if(editor.cover.trim())frontMatter.cover=editor.cover.trim();let date=editor.date?editor.date.replace('T',' '):undefined;if(date&&date.length===16)date+=':00';return{title:editor.title,content:editor.content,categories:editor.categoriesStr.split(',').map(v=>v.trim()).filter(Boolean),tags:editor.tagsStr.split(',').map(v=>v.trim()).filter(Boolean),date,frontMatter};}
async function load(){loading.value=true;try{const data=await api.get('/posts/'+props.postId);editor.id=data._id;applyData(data);editor.sourceContent=data.raw||'';editor.sourceDirty=false;}catch(error){notify(error.message,'error');emit('cancel');}finally{loading.value=false;}}
function markVisualDirty(){editor.visualDirty=true;}function setView(next){viewMode.value=next;if(next!=='md')mode.value==='source'?parseSource():updatePreview(editor.content);}
function handleVisualInput(){markVisualDirty();clearTimeout(previewTimer);previewTimer=setTimeout(()=>updatePreview(editor.content),320);}
async function updatePreview(content){const current=++previewRequest;preview.value=renderMarkdown(content);try{const data=await api.post('/render',{content:content||''});if(current===previewRequest)preview.value=sanitizeHtml(data.html);}catch(_){/* client-rendered preview remains available */}}
function sourceBody(){const normalized=(editor.sourceContent||'').replace(/\r\n?/g,'\n'),marker='\n---\n',end=normalized.startsWith('---\n')?normalized.indexOf(marker,4):-1;return end>=0?normalized.slice(end+marker.length):normalized;}
function parseSource(){updatePreview(sourceBody());}function handleSourceInput(){editor.sourceDirty=true;clearTimeout(previewTimer);previewTimer=setTimeout(parseSource,320);}
async function switchMode(next){if(next===mode.value)return;try{if(next==='source'){if(editor.visualDirty){const data=await api.post('/posts/source/build',body());editor.sourceContent=data.raw;editor.visualDirty=false;}parseSource();}else if(editor.sourceDirty){const data=await api.post('/posts/source/parse',{raw:editor.sourceContent});applyData(data);editor.sourceDirty=false;}mode.value=next;}catch(error){notify(error.message,'error');}}
async function save(){if(mode.value==='visual'&&!editor.title.trim()){notify('标题不能为空','error');return;}saving.value=true;try{const payload=mode.value==='source'?{raw:editor.sourceContent,revision:editor.revision}:{...body(),revision:editor.revision};const data=await api.put('/posts/'+editor.id,payload);editor.revision=data.revision;notify('文章已更新','success');emit('saved');}catch(error){notify(error.message,'error');}finally{saving.value=false;}}
function addField(){editor.frontMatterFields.push({key:'',value:''});markVisualDirty();}function removeField(index){editor.frontMatterFields.splice(index,1);markVisualDirty();}
function editorElement(){return textarea.value?.element||null;}function insertFormat(before,after){const element=editorElement();if(!element)return;const start=element.selectionStart,end=element.selectionEnd,text=editor.content||'',selected=text.substring(start,end)||'文本';editor.content=text.substring(0,start)+before+selected+after+text.substring(end);handleVisualInput();nextTick(()=>{element.focus();element.setSelectionRange(start+before.length,start+before.length+selected.length);});}
function insertCode(){insertFormat('`','`');}function insertCodeBlock(){insertFormat('\n```\n','\n```\n');}function insertAtCursor(value){const element=editorElement();if(!element)return;const start=element.selectionStart;editor.content=(editor.content||'').slice(0,start)+value+(editor.content||'').slice(start);handleVisualInput();nextTick(()=>{element.focus();element.setSelectionRange(start+value.length,start+value.length);});}
async function upload(file){if(!file||!file.type.startsWith('image/'))return;uploading.value=true;try{const form=new FormData();form.append('file',file);const data=await api.upload('/media/upload',form);if(data.path){insertAtCursor('!['+file.name.replace(/\.[^.]+$/,'')+']('+data.path+')');notify('图片上传成功','success');}}catch(error){notify('图片上传失败：'+error.message,'error');}finally{uploading.value=false;}}
async function uploadCover(event){const file=event.target.files?.[0];if(!file)return;coverUploading.value=true;try{const form=new FormData();form.append('file',file);const data=await api.upload('/media/upload',form);editor.cover=data.path||'';coverBroken.value=false;markVisualDirty();notify('首图已上传，保存文章后生效','success');}catch(error){notify('首图上传失败：'+error.message,'error');}finally{coverUploading.value=false;event.target.value='';}}
function clearCover(){editor.cover='';coverBroken.value=false;markVisualDirty();}function handleDrop(event){dragOver.value=false;for(const file of event.dataTransfer?.files||[])if(file.type.startsWith('image/'))upload(file);}function handlePaste(event){for(const item of event.clipboardData?.items||[])if(item.type.startsWith('image/')){event.preventDefault();upload(item.getAsFile());break;}}
function insertImage(){const input=document.createElement('input');input.type='file';input.accept='image/*';input.multiple=true;input.onchange=()=>{for(const file of input.files||[])upload(file);};input.click();}
watch(()=>props.postId,load,{immediate:true});
</script>
