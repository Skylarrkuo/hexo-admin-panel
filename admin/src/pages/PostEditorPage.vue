<template>
  <section class="post-editor-page">
    <div class="toolbar editor-commandbar">
      <button class="btn btn-outline" @click="$emit('cancel')">← {{ tr('返回文章','Back to posts') }}</button>
      <div class="editor-switches">
        <div class="filter-tabs" :aria-label="tr('编辑模式','Editing mode')">
          <button :class="{active:mode==='visual'}" @click="switchMode('visual')">{{ tr('表单编辑','Form') }}</button>
          <button :class="{active:mode==='source'}" @click="switchMode('source')">{{ tr('完整源码','Source') }}</button>
        </div>
        <div class="view-switch" :aria-label="tr('工作区视图','Workspace view')">
          <button v-for="item in viewOptions" :key="item.value" :class="{active:viewMode===item.value}" @click="setView(item.value)">{{item.label}}</button>
        </div>
      </div>
      <button class="btn btn-primary" @click="save" :disabled="saving">{{ saving?tr('保存中...','Saving...'):tr('保存文章','Save post') }}</button>
    </div>

    <div v-if="loading" class="loading">{{ tr('加载文章...','Loading post...') }}</div>
    <template v-else>
      <template v-if="mode==='visual'">
        <div class="card post-meta-card">
          <div class="card-title">{{ tr('文章信息','Post details') }}</div>
          <div class="form-row">
            <div class="form-group"><label>{{ tr('标题','Title') }}</label><input v-model="editor.title" :placeholder="tr('文章标题','Post title')" @input="markVisualDirty"></div>
            <div class="form-group"><label>{{ tr('发布日期','Publish date') }}</label><input v-model="editor.date" type="datetime-local" @input="markVisualDirty"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>{{ tr('分类（逗号分隔）','Categories (comma-separated)') }}</label><input v-model="editor.categoriesStr" :placeholder="tr('例如：技术, JavaScript','Example: Tech, JavaScript')" @input="markVisualDirty"></div>
            <div class="form-group"><label>{{ tr('标签（逗号分隔）','Tags (comma-separated)') }}</label><input v-model="editor.tagsStr" :placeholder="tr('例如：node, hexo','Example: node, hexo')" @input="markVisualDirty"></div>
          </div>
        </div>

        <div class="card cover-field-card">
          <div class="cover-field-copy"><div class="card-title">{{ tr('文章首图','Cover image') }}</div><p>{{ tr('对应 Front Matter 的','Maps to the') }} <code>cover</code> {{ tr('字段，将用于主题首页卡片或文章头图。','Front Matter field used by home cards and post headers.') }}</p></div>
          <div class="cover-field-body">
            <div class="cover-preview">
              <img v-if="editor.cover&&!coverBroken" :src="coverPreviewUrl" :alt="tr('文章首图预览','Cover image preview')" @error="coverBroken=true">
              <div v-else class="cover-placeholder"><span>◇</span><small>{{editor.cover?tr('图片无法预览','Preview unavailable'):tr('尚未设置首图','No cover image')}}</small></div>
            </div>
            <div class="cover-controls">
              <label for="post-cover">{{ tr('图片路径或 URL','Image path or URL') }}</label>
              <input id="post-cover" v-model="editor.cover" placeholder="/images/cover.webp" @input="coverBroken=false;markVisualDirty()">
              <div class="btn-group">
                <input ref="coverInput" type="file" accept="image/*" hidden @change="uploadCover">
                <button class="btn btn-outline btn-sm" :disabled="coverUploading" @click="coverInput.click()">{{coverUploading?tr('上传中...','Uploading...'):tr('上传首图','Upload cover')}}</button>
                <button v-if="editor.cover" class="btn btn-outline btn-sm" @click="clearCover">{{ tr('移除首图','Remove cover') }}</button>
              </div>
            </div>
          </div>
        </div>

        <div class="front-matter-section mb-16">
          <div class="flex justify-between items-center mb-8"><label class="extra-field-label">{{ tr('Front Matter（其他字段）','Other Front Matter') }}</label><button class="btn btn-outline btn-sm" @click="addField">＋ {{ tr('添加字段','Add field') }}</button></div>
          <div v-for="(field,index) in editor.frontMatterFields" :key="index" class="fm-row">
            <input v-model="field.key" :placeholder="tr('字段名','Field name')" style="flex:.4" @input="markVisualDirty"><input v-model="field.value" :placeholder="tr('值','Value')" @input="markVisualDirty"><button class="btn btn-danger btn-sm" :aria-label="tr('删除字段','Delete field')" @click="removeField(index)">×</button>
          </div>
          <div v-if="editor.frontMatterFields.length===0" class="text-sm text-muted">{{ tr('没有其他 Front Matter 字段。','No additional Front Matter fields.') }}</div>
        </div>

        <div class="writing-workspace" :class="'workspace-'+viewMode" :style="workspaceStyle">
          <div v-if="viewMode!=='preview'" class="editor-pane">
            <div class="editor-toolbar">
              <button class="toolbar-btn" @click="insertFormat('**','**')" :title="tr('粗体','Bold')"><b>B</b></button><button class="toolbar-btn" @click="insertFormat('*','*')" :title="tr('斜体','Italic')"><i>I</i></button><button class="toolbar-btn" @click="insertFormat('~~','~~')" :title="tr('删除线','Strikethrough')"><s>S</s></button><span class="toolbar-divider"></span>
              <button class="toolbar-btn" @click="insertFormat('# ','')">H1</button><button class="toolbar-btn" @click="insertFormat('## ','')">H2</button><button class="toolbar-btn" @click="insertFormat('### ','')">H3</button><span class="toolbar-divider"></span>
              <button class="toolbar-btn" @click="insertFormat('\n- ','')">{{ tr('列表','List') }}</button><button class="toolbar-btn" @click="insertFormat('\n1. ','')">{{ tr('序号','Numbered') }}</button><button class="toolbar-btn" @click="insertFormat('\n> ','')">{{ tr('引用','Quote') }}</button><span class="toolbar-divider"></span>
              <button class="toolbar-btn" @click="insertCode">{{ tr('行内代码','Inline code') }}</button><button class="toolbar-btn" @click="insertCodeBlock">{{ tr('代码块','Code block') }}</button><button class="toolbar-btn" @click="insertFormat('[','](url)')">{{ tr('链接','Link') }}</button><button class="toolbar-btn" @click="insertImage">{{ tr('图片','Image') }}</button>
            </div>
            <div class="editor-dropzone" :class="{'drag-active':dragOver}" @dragover.prevent="dragOver=true" @dragleave="dragOver=false" @drop.prevent="handleDrop">
              <MarkdownCodeEditor ref="textarea" v-model="editor.content" :label="tr('Markdown 正文','Markdown content')" @input="handleVisualInput" @paste="handlePaste" />
              <div v-if="uploading" class="upload-overlay"><div class="upload-spinner"></div><span>{{ tr('正在上传图片...','Uploading image...') }}</span></div>
            </div>
          </div>
          <ThemePreview v-if="viewMode!=='md'" :editor="editor" :html="preview" :cover-url="coverPreviewUrl" :cover-broken="coverBroken" @cover-error="coverBroken=true" />
        </div>
      </template>

      <template v-else>
        <div class="writing-workspace source-workspace" :class="'workspace-'+viewMode" :style="workspaceStyle">
          <div v-if="viewMode!=='preview'" class="editor-pane source-pane">
            <div class="workspace-pane-head"><span>{{ tr('完整 Markdown','Full Markdown') }}</span><small>{{ tr('包含 YAML Front Matter','Includes YAML Front Matter') }}</small></div>
            <MarkdownCodeEditor v-model="editor.sourceContent" :label="tr('完整 Markdown 源码','Full Markdown source')" @input="handleSourceInput" />
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
import { useI18n } from '../i18n';

const {tr,errorMessage}=useI18n();

const ThemePreview=defineComponent({
  props:{editor:Object,html:String,coverUrl:String,coverBroken:Boolean},emits:['cover-error'],
  setup(props,{emit}){return()=>h('article',{class:'theme-preview-shell'},[
    h('div',{class:'preview-chrome'},[h('span',{class:'preview-status'},'THEME PREVIEW'),h('span',{},'Hexo · Redefine')]),
    h('div',{class:'theme-article'},[
      props.editor.cover&&!props.coverBroken?h('img',{class:'theme-cover',src:props.coverUrl,alt:'',onError:()=>emit('cover-error')}):null,
      h('header',{class:'theme-article-header'},[h('h1',{},props.editor.title||tr('未命名文章','Untitled post')),h('div',{class:'theme-article-meta'},[props.editor.date?props.editor.date.replace('T',' '):tr('未设置日期','No date'),props.editor.categoriesStr?' · '+props.editor.categoriesStr:''])]),
      h('div',{class:'markdown-body',innerHTML:props.html})
    ])
  ]);}
});

const props=defineProps({postId:{type:String,required:true}});const emit=defineEmits(['cancel','saved','notify']);
const editor=reactive({id:null,title:'',date:'',categoriesStr:'',tagsStr:'',cover:'',content:'',frontMatterFields:[],sourceContent:'',visualDirty:false,sourceDirty:false,revision:''});
const loading=ref(false),saving=ref(false),mode=ref('visual'),viewMode=ref('split'),preview=ref(''),dragOver=ref(false),uploading=ref(false),coverUploading=ref(false),coverBroken=ref(false),textarea=ref(null),coverInput=ref(null);
const viewOptions=computed(()=>[{value:'split',label:tr('分栏','Split')},{value:'md',label:tr('仅 Markdown','Markdown')},{value:'preview',label:tr('仅预览','Preview')}]);let previewTimer,previewRequest=0;
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
async function load(){loading.value=true;try{const data=await api.get('/posts/'+props.postId);editor.id=data._id;applyData(data);editor.sourceContent=data.raw||'';editor.sourceDirty=false;}catch(error){notify(errorMessage(error),'error');emit('cancel');}finally{loading.value=false;}}
function markVisualDirty(){editor.visualDirty=true;}function setView(next){viewMode.value=next;if(next!=='md')mode.value==='source'?parseSource():updatePreview(editor.content);}
function handleVisualInput(){markVisualDirty();clearTimeout(previewTimer);previewTimer=setTimeout(()=>updatePreview(editor.content),320);}
async function updatePreview(content){const current=++previewRequest;preview.value=renderMarkdown(content);try{const data=await api.post('/render',{content:content||''});if(current===previewRequest)preview.value=sanitizeHtml(data.html);}catch(_){/* client-rendered preview remains available */}}
function sourceBody(){const normalized=(editor.sourceContent||'').replace(/\r\n?/g,'\n'),marker='\n---\n',end=normalized.startsWith('---\n')?normalized.indexOf(marker,4):-1;return end>=0?normalized.slice(end+marker.length):normalized;}
function parseSource(){updatePreview(sourceBody());}function handleSourceInput(){editor.sourceDirty=true;clearTimeout(previewTimer);previewTimer=setTimeout(parseSource,320);}
async function switchMode(next){if(next===mode.value)return;try{if(next==='source'){if(editor.visualDirty){const data=await api.post('/posts/source/build',body());editor.sourceContent=data.raw;editor.visualDirty=false;}parseSource();}else if(editor.sourceDirty){const data=await api.post('/posts/source/parse',{raw:editor.sourceContent});applyData(data);editor.sourceDirty=false;}mode.value=next;}catch(error){notify(errorMessage(error),'error');}}
async function save(){if(mode.value==='visual'&&!editor.title.trim()){notify(tr('标题不能为空','Title is required'),'error');return;}saving.value=true;try{const payload=mode.value==='source'?{raw:editor.sourceContent,revision:editor.revision}:{...body(),revision:editor.revision};const data=await api.put('/posts/'+editor.id,payload);editor.revision=data.revision;notify(tr('文章已更新','Post updated'),'success');emit('saved');}catch(error){notify(errorMessage(error),'error');}finally{saving.value=false;}}
function addField(){editor.frontMatterFields.push({key:'',value:''});markVisualDirty();}function removeField(index){editor.frontMatterFields.splice(index,1);markVisualDirty();}
function editorElement(){return textarea.value?.element||null;}function insertFormat(before,after){const element=editorElement();if(!element)return;const start=element.selectionStart,end=element.selectionEnd,text=editor.content||'',selected=text.substring(start,end)||tr('文本','text');editor.content=text.substring(0,start)+before+selected+after+text.substring(end);handleVisualInput();nextTick(()=>{element.focus();element.setSelectionRange(start+before.length,start+before.length+selected.length);});}
function insertCode(){insertFormat('`','`');}function insertCodeBlock(){insertFormat('\n```\n','\n```\n');}function insertAtCursor(value){const element=editorElement();if(!element)return;const start=element.selectionStart;editor.content=(editor.content||'').slice(0,start)+value+(editor.content||'').slice(start);handleVisualInput();nextTick(()=>{element.focus();element.setSelectionRange(start+value.length,start+value.length);});}
async function upload(file){if(!file||!file.type.startsWith('image/'))return;uploading.value=true;try{const form=new FormData();form.append('file',file);const data=await api.upload('/media/upload',form);if(data.path){insertAtCursor('!['+file.name.replace(/\.[^.]+$/,'')+']('+data.path+')');notify(tr('图片上传成功','Image uploaded'),'success');}}catch(error){notify(tr('图片上传失败：{message}','Image upload failed: {message}',{message:errorMessage(error)}),'error');}finally{uploading.value=false;}}
async function uploadCover(event){const file=event.target.files?.[0];if(!file)return;coverUploading.value=true;try{const form=new FormData();form.append('file',file);const data=await api.upload('/media/upload',form);editor.cover=data.path||'';coverBroken.value=false;markVisualDirty();notify(tr('首图已上传，保存文章后生效','Cover uploaded. Save the post to apply it'),'success');}catch(error){notify(tr('首图上传失败：{message}','Cover upload failed: {message}',{message:errorMessage(error)}),'error');}finally{coverUploading.value=false;event.target.value='';}}
function clearCover(){editor.cover='';coverBroken.value=false;markVisualDirty();}function handleDrop(event){dragOver.value=false;for(const file of event.dataTransfer?.files||[])if(file.type.startsWith('image/'))upload(file);}function handlePaste(event){for(const item of event.clipboardData?.items||[])if(item.type.startsWith('image/')){event.preventDefault();upload(item.getAsFile());break;}}
function insertImage(){const input=document.createElement('input');input.type='file';input.accept='image/*';input.multiple=true;input.onchange=()=>{for(const file of input.files||[])upload(file);};input.click();}
watch(()=>props.postId,load,{immediate:true});
</script>
