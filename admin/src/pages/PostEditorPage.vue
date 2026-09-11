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
      <div class="btn-group"><span v-if="autosaveStatus" class="text-sm text-muted">{{ autosaveStatus }}</span><button class="btn btn-outline" @click="realPreview" :disabled="saving||previewing">{{ previewing?tr('构建预览中...','Building preview...'):tr('真实主题预览','Real theme preview') }}</button><button class="btn btn-primary" @click="save()" :disabled="saving">{{ saving?tr('保存中...','Saving...'):tr('保存文章','Save post') }}</button></div>
    </div>

    <p v-if="refreshFailed" role="status" class="task-error">{{ tr('内容已保存到文件，但 Hexo 刷新失败。请检查服务日志，修复后重建站点；无需重复提交内容。','Content was saved to disk, but Hexo refresh failed. Check the server logs and rebuild after fixing the error; the content does not need to be resubmitted.') }}</p>
    <div v-if="loading" class="loading">{{ tr('加载文章...','Loading post...') }}</div>
    <template v-else>
      <template v-if="mode==='visual'">
        <div class="card post-meta-card">
          <div class="card-title">{{ tr('文章信息','Post details') }}</div>
          <div class="form-row">
            <div class="form-group"><label>{{ tr('标题','Title') }}</label><input v-model="editor.title" :placeholder="tr('文章标题','Post title')" @input="markVisualDirty"></div>
            <div class="form-group"><label>{{ tr('发布日期','Publish date') }}</label><input v-model="editor.date" type="datetime-local" @input="markVisualDirty"></div>
          </div>
          <div class="form-row"><TaxonomySelector v-model="editor.categoriesStr" :options="taxonomyOptions.categories" :label="tr('分类','Categories')" :placeholder="tr('搜索或新建分类','Search or create categories')" @change="markVisualDirty"/><TaxonomySelector v-model="editor.tagsStr" :options="taxonomyOptions.tags" :label="tr('标签','Tags')" :placeholder="tr('搜索或新建标签','Search or create tags')" @change="markVisualDirty"/></div>
          <div class="form-row"><div class="form-group"><label>{{tr('工作流状态','Workflow status')}}</label><select v-model="editor.workflowStatus" :disabled="editor.workflowStatus==='published'" @change="markVisualDirty"><option value="draft">{{tr('草稿','Draft')}}</option><option value="in_progress">{{tr('未完成','In progress')}}</option><option value="review">{{tr('待审核','In review')}}</option><option value="scheduled">{{tr('计划中','Scheduled')}}</option><option v-if="editor.workflowStatus==='published'" value="published">{{tr('已发布','Published')}}</option></select></div></div>
        </div>

        <div v-if="previewJob" class="command-job" :class="'job-'+previewJob.status"><div class="command-job-head"><strong>{{tr('真实主题构建','Theme build')}}</strong><span>{{previewJob.status}} · {{previewJob.progress||0}}%</span></div><div class="progress-track"><i :style="{width:(previewJob.progress||0)+'%'}"></i></div><div class="command-job-log"><div v-for="(entry,index) in previewJob.logs||[]" :key="index"><time>{{new Date(entry.at).toLocaleTimeString()}}</time><span>{{entry.message}}</span></div></div></div>
        <div v-if="realPreviewUrl" class="real-preview-frame"><div class="preview-frame-head"><strong>{{tr('真实主题、插件与 permalink 预览','Real theme, plugin, and permalink preview')}}</strong><a :href="realPreviewUrl" target="_blank" rel="noopener noreferrer">{{tr('新窗口打开','Open in new tab')}}</a></div><iframe sandbox="allow-scripts" :src="realPreviewUrl" :title="tr('文章真实主题预览','Real post theme preview')"></iframe></div>

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

        <FrontMatterFields :fields="editor.frontMatterFields" :label="tr('Front Matter（其他字段）','Other Front Matter')" @change="markVisualDirty" />

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
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { api, assetUrl } from '../api/client';
import MarkdownCodeEditor from '../components/MarkdownCodeEditor.vue';
import FrontMatterFields from '../components/FrontMatterFields.vue';
import TaxonomySelector from '../components/TaxonomySelector.vue';
import { renderMarkdown, sanitizeHtml } from '../utils/markdown';
import { fieldsToFrontMatter, frontMatterFields, normalizeFrontMatterFields } from '../utils/front-matter-fields';
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

const props=defineProps({postId:{type:String,required:true}});const emit=defineEmits(['cancel','saved','notify','dirty-change']);
const refreshFailed=ref(false);
const editor=reactive({id:null,title:'',date:'',categoriesStr:'',tagsStr:'',workflowStatus:'draft',cover:'',content:'',frontMatterFields:[],sourceContent:'',visualDirty:false,sourceDirty:false,revision:''});
const loading=ref(false),saving=ref(false),previewing=ref(false),previewJob=ref(null),realPreviewUrl=ref(''),taxonomyOptions=reactive({categories:[],tags:[]}),mode=ref('visual'),viewMode=ref('split'),preview=ref(''),dragOver=ref(false),uploading=ref(false),coverUploading=ref(false),coverBroken=ref(false),textarea=ref(null),coverInput=ref(null),autosaveStatus=ref('');
const viewOptions=computed(()=>[{value:'split',label:tr('分栏','Split')},{value:'md',label:tr('仅 Markdown','Markdown')},{value:'preview',label:tr('仅预览','Preview')}]);let previewTimer,previewRequest=0,autosaveTimer,baseline='',applying=false;
const autosaveKey=computed(()=>'hexo_admin_post_autosave_'+props.postId);
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
function applyData(data){editor.title=data.title||'';editor.date=toLocalDate(data.date);editor.categoriesStr=(Array.isArray(data.categories)?data.categories:[data.categories]).filter(Boolean).join(', ');editor.tagsStr=(Array.isArray(data.tags)?data.tags:[data.tags]).filter(Boolean).join(', ');editor.workflowStatus=data.workflowStatus||'draft';editor.content=data.content||'';const fields={...(data.frontMatter||{})};editor.cover=typeof fields.cover==='string'?fields.cover:'';delete fields.cover;editor.frontMatterFields=frontMatterFields(fields);if(data.revision!==undefined)editor.revision=data.revision;refreshFailed.value=data.refreshed===false;editor.visualDirty=false;coverBroken.value=false;updatePreview(editor.content);}
function contentState(){return{title:editor.title,date:editor.date,categoriesStr:editor.categoriesStr,tagsStr:editor.tagsStr,workflowStatus:editor.workflowStatus,cover:editor.cover,content:editor.content,frontMatterFields:editor.frontMatterFields.map(field=>({...field})),sourceContent:editor.sourceContent};}
function contentSignature(){return JSON.stringify(contentState());}
function setDirtyState(){const dirty=Boolean(baseline)&&contentSignature()!==baseline;emit('dirty-change',dirty);return dirty;}
function clearLocalDraft(){clearTimeout(autosaveTimer);try{localStorage.removeItem(autosaveKey.value);}catch(_){}autosaveStatus.value='';}
function persistLocalDraft(){if(!setDirtyState()){clearLocalDraft();return;}try{localStorage.setItem(autosaveKey.value,JSON.stringify({version:1,savedAt:new Date().toISOString(),baseRevision:editor.revision,mode:mode.value,viewMode:viewMode.value,state:contentState()}));autosaveStatus.value=tr('已自动保存在本机','Autosaved locally');}catch(_){autosaveStatus.value=tr('本地自动保存失败','Local autosave failed');}}
function scheduleAutosave(){if(applying||loading.value||!editor.id)return;const dirty=setDirtyState();if(!dirty){clearLocalDraft();return;}autosaveStatus.value=tr('等待自动保存…','Waiting to autosave…');clearTimeout(autosaveTimer);autosaveTimer=setTimeout(persistLocalDraft,800);}
function restoreLocalDraft(){let saved;try{saved=JSON.parse(localStorage.getItem(autosaveKey.value)||'null');}catch(_){clearLocalDraft();return;}if(!saved||!saved.state)return;const changed=saved.baseRevision&&saved.baseRevision!==editor.revision;const prompt=changed?tr('检测到本地自动保存，但服务器文章已发生变化。仍要恢复本地版本吗？','A local autosave exists, but the server post has changed. Restore the local version anyway?'):tr('检测到未保存的本地草稿，是否恢复？','An unsaved local draft was found. Restore it?');if(!window.confirm(prompt)){clearLocalDraft();return;}applying=true;Object.assign(editor,{...saved.state,frontMatterFields:normalizeFrontMatterFields(saved.state.frontMatterFields)});mode.value=saved.mode==='source'?'source':'visual';viewMode.value=['split','md','preview'].includes(saved.viewMode)?saved.viewMode:'split';editor.visualDirty=mode.value==='visual';editor.sourceDirty=mode.value==='source';applying=false;mode.value==='source'?parseSource():updatePreview(editor.content);autosaveStatus.value=tr('已恢复本地草稿','Local draft restored');emit('dirty-change',true);}
function body(){const frontMatter=fieldsToFrontMatter(editor.frontMatterFields,['cover']);if(editor.cover.trim())frontMatter.cover=editor.cover.trim();let date=editor.date?editor.date.replace('T',' '):undefined;if(date&&date.length===16)date+=':00';return{title:editor.title,content:editor.content,categories:editor.categoriesStr.split(',').map(v=>v.trim()).filter(Boolean),tags:editor.tagsStr.split(',').map(v=>v.trim()).filter(Boolean),workflowStatus:editor.workflowStatus,date,frontMatter};}
async function load(){loading.value=true;applying=true;try{const [data,taxonomies]=await Promise.all([api.get('/posts/'+props.postId),api.get('/taxonomies')]);editor.id=data._id;applyData(data);editor.sourceContent=data.raw||'';editor.sourceDirty=false;taxonomyOptions.categories=taxonomies.categories||[];taxonomyOptions.tags=taxonomies.tags||[];baseline=contentSignature();}catch(error){notify(errorMessage(error),'error');emit('cancel');}finally{applying=false;loading.value=false;}restoreLocalDraft();}
function markVisualDirty(){editor.visualDirty=true;}function setView(next){viewMode.value=next;if(next!=='md')mode.value==='source'?parseSource():updatePreview(editor.content);}
function handleVisualInput(){markVisualDirty();clearTimeout(previewTimer);previewTimer=setTimeout(()=>updatePreview(editor.content),320);}
async function updatePreview(content){const current=++previewRequest;preview.value=renderMarkdown(content);try{const data=await api.post('/render',{content:content||''});if(current===previewRequest)preview.value=sanitizeHtml(data.html);}catch(_){/* client-rendered preview remains available */}}
function sourceBody(){const normalized=(editor.sourceContent||'').replace(/\r\n?/g,'\n'),marker='\n---\n',end=normalized.startsWith('---\n')?normalized.indexOf(marker,4):-1;return end>=0?normalized.slice(end+marker.length):normalized;}
function parseSource(){updatePreview(sourceBody());}function handleSourceInput(){editor.sourceDirty=true;clearTimeout(previewTimer);previewTimer=setTimeout(parseSource,320);}
async function switchMode(next){if(next===mode.value)return;try{if(next==='source'){if(editor.visualDirty){const data=await api.post('/posts/source/build',body());editor.sourceContent=data.raw;editor.visualDirty=false;}parseSource();}else if(editor.sourceDirty){const data=await api.post('/posts/source/parse',{raw:editor.sourceContent});applyData(data);editor.sourceDirty=false;}mode.value=next;}catch(error){notify(errorMessage(error),'error');}}
async function save(stay=false){if(mode.value==='visual'&&!editor.title.trim()){notify(tr('标题不能为空','Title is required'),'error');return false;}saving.value=true;try{const payload=mode.value==='source'?{raw:editor.sourceContent,revision:editor.revision}:{...body(),revision:editor.revision};const data=await api.put('/posts/'+editor.id,payload);editor.revision=data.revision;refreshFailed.value=data.refreshed===false;baseline=contentSignature();clearLocalDraft();emit('dirty-change',false);if(refreshFailed.value){notify(tr('内容已保存到文件，但 Hexo 刷新失败。请检查服务日志，修复后重建站点；无需重复提交内容。','Content was saved to disk, but Hexo refresh failed. Check the server logs and rebuild after fixing the error; the content does not need to be resubmitted.'),'warning');return false;}if(!stay){notify(tr('文章已更新','Post updated'),'success');emit('saved');}return true;}catch(error){notify(errorMessage(error),'error');return false;}finally{saving.value=false;}}
async function realPreview(){if(!await save(true))return;previewing.value=true;realPreviewUrl.value='';try{const started=await api.post('/previews',{kind:'post',id:editor.id,revision:editor.revision});previewJob.value=started.job;for(let index=0;index<240;index++){let job;try{job=await api.get('/commands/jobs/'+started.job.id);}catch(error){if(index===239)throw error;await new Promise(resolve=>setTimeout(resolve,500));continue;}previewJob.value=job;if(job.status==='completed'){realPreviewUrl.value=job.result.previewUrl;notify(tr('真实主题预览已生成','Real theme preview built'),'success');break;}if(['failed','cancelled'].includes(job.status))throw Object.assign(new Error(job.error||'Preview failed'),{code:job.errorCode});await new Promise(resolve=>setTimeout(resolve,500));}}catch(error){notify(errorMessage(error),'error');}finally{previewing.value=false;}}
function editorElement(){return textarea.value?.element||null;}function insertFormat(before,after){const element=editorElement();if(!element)return;const start=element.selectionStart,end=element.selectionEnd,text=editor.content||'',selected=text.substring(start,end)||tr('文本','text');editor.content=text.substring(0,start)+before+selected+after+text.substring(end);handleVisualInput();nextTick(()=>{element.focus();element.setSelectionRange(start+before.length,start+before.length+selected.length);});}
function insertCode(){insertFormat('`','`');}function insertCodeBlock(){insertFormat('\n```\n','\n```\n');}function insertAtCursor(value){const element=editorElement();if(!element)return;const start=element.selectionStart;editor.content=(editor.content||'').slice(0,start)+value+(editor.content||'').slice(start);handleVisualInput();nextTick(()=>{element.focus();element.setSelectionRange(start+value.length,start+value.length);});}
async function upload(file){if(!file||!file.type.startsWith('image/'))return;uploading.value=true;try{const form=new FormData();form.append('file',file);const data=await api.upload('/media/upload',form);if(data.path){insertAtCursor('!['+file.name.replace(/\.[^.]+$/,'')+']('+data.path+')');notify(tr('图片上传成功','Image uploaded'),'success');}}catch(error){notify(tr('图片上传失败：{message}','Image upload failed: {message}',{message:errorMessage(error)}),'error');}finally{uploading.value=false;}}
async function uploadCover(event){const file=event.target.files?.[0];if(!file)return;coverUploading.value=true;try{const form=new FormData();form.append('file',file);const data=await api.upload('/media/upload',form);editor.cover=data.path||'';coverBroken.value=false;markVisualDirty();notify(tr('首图已上传，保存文章后生效','Cover uploaded. Save the post to apply it'),'success');}catch(error){notify(tr('首图上传失败：{message}','Cover upload failed: {message}',{message:errorMessage(error)}),'error');}finally{coverUploading.value=false;event.target.value='';}}
function clearCover(){editor.cover='';coverBroken.value=false;markVisualDirty();}function handleDrop(event){dragOver.value=false;for(const file of event.dataTransfer?.files||[])if(file.type.startsWith('image/'))upload(file);}function handlePaste(event){for(const item of event.clipboardData?.items||[])if(item.type.startsWith('image/')){event.preventDefault();upload(item.getAsFile());break;}}
function insertImage(){const input=document.createElement('input');input.type='file';input.accept='image/*';input.multiple=true;input.onchange=()=>{for(const file of input.files||[])upload(file);};input.click();}
function beforeUnload(event){if(!setDirtyState())return;event.preventDefault();event.returnValue='';}
watch(()=>props.postId,load,{immediate:true});
watch(()=>contentState(),scheduleAutosave,{deep:true});
onMounted(()=>window.addEventListener('beforeunload',beforeUnload));
onBeforeUnmount(()=>{window.removeEventListener('beforeunload',beforeUnload);clearTimeout(previewTimer);clearTimeout(autosaveTimer);});
</script>
