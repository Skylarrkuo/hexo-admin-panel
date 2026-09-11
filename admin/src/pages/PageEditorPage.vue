<template>
  <section class="post-editor-page">
    <div class="toolbar editor-commandbar"><button class="btn btn-outline" @click="$emit('cancel')">← {{ tr('返回页面','Back to pages') }}</button><div class="filter-tabs"><button :class="{active:mode==='visual'}" @click="switchMode('visual')">{{ tr('表单编辑','Form') }}</button><button :class="{active:mode==='source'}" @click="switchMode('source')">{{ tr('完整源码','Source') }}</button></div><div class="btn-group"><button class="btn btn-outline" :disabled="previewing||saving" @click="realPreview">{{ previewing?tr('构建预览中...','Building preview...'):tr('真实主题预览','Real theme preview') }}</button><button class="btn btn-primary" :disabled="saving" @click="save">{{ saving?tr('保存中...','Saving...'):tr('保存页面','Save page') }}</button></div></div>
    <p v-if="refreshFailed" role="status" class="task-error">{{ tr('内容已保存到文件，但 Hexo 刷新失败。请检查服务日志，修复后重建站点；无需重复提交内容。','Content was saved to disk, but Hexo refresh failed. Check the server logs and rebuild after fixing the error; the content does not need to be resubmitted.') }}</p>
    <div v-if="loading" class="loading">{{ tr('加载页面...','Loading page...') }}</div>
    <template v-else>
      <div v-if="mode==='visual'" class="card post-meta-card"><div class="card-title">{{ tr('页面信息','Page details') }}</div><div class="form-row"><div class="form-group"><label>{{ tr('标题','Title') }}</label><input v-model="editor.title"></div><div class="form-group"><label>{{ tr('日期','Date') }}</label><input v-model="editor.date" type="datetime-local"></div></div><div class="form-row"><div class="form-group"><label>{{ tr('Layout','Layout') }}</label><input v-model="editor.layout" placeholder="page"></div><div class="form-group"><label>{{ tr('主题 Template','Theme template') }}</label><input v-model="editor.template" placeholder="about"></div></div></div>
      <FrontMatterFields v-if="mode==='visual'" :fields="editor.frontMatterFields" :label="tr('其他 Front Matter','Other Front Matter')" />
      <div v-if="previewJob" class="command-job" :class="'job-'+previewJob.status"><div class="command-job-head"><strong>{{ tr('真实主题构建','Theme build') }}</strong><span>{{ previewJob.status }} · {{ previewJob.progress||0 }}%</span></div><div class="progress-track"><i :style="{width:(previewJob.progress||0)+'%'}"></i></div><div class="command-job-log"><div v-for="(entry,index) in previewJob.logs||[]" :key="index"><time>{{ new Date(entry.at).toLocaleTimeString() }}</time><span>{{ entry.message }}</span></div></div></div>
      <div v-if="previewUrl" class="real-preview-frame"><div class="preview-frame-head"><strong>{{ tr('真实主题、插件与 permalink 预览','Real theme, plugin, and permalink preview') }}</strong><a :href="previewUrl" target="_blank" rel="noopener noreferrer">{{ tr('新窗口打开','Open in new tab') }}</a></div><iframe sandbox="allow-scripts" :src="previewUrl" :title="tr('页面真实主题预览','Real page theme preview')"></iframe></div>
      <div v-else class="writing-workspace workspace-split">
        <div class="editor-pane"><MarkdownCodeEditor v-model="activeSource" :label="mode==='source'?tr('完整 Markdown 源码','Full Markdown source'):tr('Markdown 正文','Markdown content')" /></div>
        <article class="theme-preview-shell"><div class="preview-chrome"><span class="preview-status">QUICK PREVIEW</span></div><div class="theme-article"><header class="theme-article-header"><h1>{{editor.title}}</h1></header><div class="markdown-body" v-html="quickPreview"></div></div></article>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { api } from '../api/client';
import FrontMatterFields from '../components/FrontMatterFields.vue';
import MarkdownCodeEditor from '../components/MarkdownCodeEditor.vue';
import { fieldsToFrontMatter, frontMatterFields } from '../utils/front-matter-fields';
import { renderMarkdown, sanitizeHtml } from '../utils/markdown';
import { useI18n } from '../i18n';
const {tr,errorMessage}=useI18n();const props=defineProps({pageId:{type:String,required:true}});const emit=defineEmits(['cancel','notify']);
const refreshFailed=ref(false);
const editor=reactive({title:'',date:'',layout:'page',template:'',content:'',source:'',revision:'',frontMatterFields:[]});const loading=ref(false),saving=ref(false),previewing=ref(false),previewJob=ref(null),previewUrl=ref(''),mode=ref('visual');
const activeSource=computed({get:()=>mode.value==='source'?editor.source:editor.content,set:value=>{if(mode.value==='source')editor.source=value;else editor.content=value;}});const quickPreview=computed(()=>sanitizeHtml(renderMarkdown(mode.value==='source'?sourceBody(editor.source):editor.content)));
function toLocalDate(value){if(!value)return'';const date=new Date(value);if(Number.isNaN(date.getTime()))return String(value).replace(' ','T').slice(0,16);return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);}
function sourceBody(raw){const value=String(raw||'').replace(/\r\n?/g,'\n'),end=value.startsWith('---\n')?value.indexOf('\n---\n',4):-1;return end>=0?value.slice(end+5):value;}
function apply(data){editor.title=data.title||'';editor.date=toLocalDate(data.date);editor.layout=data.layout||'page';editor.template=data.template||'';editor.content=data.content||'';editor.source=data.raw||editor.source;editor.revision=data.revision||editor.revision;editor.frontMatterFields=frontMatterFields(data.frontMatter||{});}
function body(){let date=editor.date?editor.date.replace('T',' '):'';if(date&&date.length===16)date+=':00';return{title:editor.title,date,layout:editor.layout,template:editor.template,content:editor.content,frontMatter:fieldsToFrontMatter(editor.frontMatterFields)};}
async function load(){loading.value=true;try{apply(await api.get('/pages/'+props.pageId));}catch(error){emit('notify',errorMessage(error),'error');emit('cancel');}finally{loading.value=false;}}
async function switchMode(next){if(next===mode.value)return;try{if(next==='source')editor.source=(await api.post('/pages/source/build',body())).raw;else apply(await api.post('/pages/source/parse',{raw:editor.source}));mode.value=next;}catch(error){emit('notify',errorMessage(error),'error');}}
async function save(silent=false){if(mode.value==='visual'&&!editor.title.trim()){emit('notify',tr('页面标题不能为空','Page title is required'),'error');return false;}saving.value=true;try{const payload=mode.value==='source'?{raw:editor.source,revision:editor.revision}:{...body(),revision:editor.revision};const data=await api.put('/pages/'+props.pageId,payload);editor.revision=data.revision;refreshFailed.value=data.refreshed===false;if(refreshFailed.value){emit('notify',tr('内容已保存到文件，但 Hexo 刷新失败。请检查服务日志，修复后重建站点；无需重复提交内容。','Content was saved to disk, but Hexo refresh failed. Check the server logs and rebuild after fixing the error; the content does not need to be resubmitted.'),'warning');return false;}if(!silent)emit('notify',tr('页面已保存','Page saved'),'success');return true;}catch(error){emit('notify',errorMessage(error),'error');return false;}finally{saving.value=false;}}
async function realPreview(){if(!await save(true))return;previewing.value=true;previewUrl.value='';try{const started=await api.post('/previews',{kind:'page',id:props.pageId,revision:editor.revision});previewJob.value=started.job;for(let index=0;index<240;index++){let job;try{job=await api.get('/commands/jobs/'+started.job.id);}catch(error){if(index===239)throw error;await new Promise(resolve=>setTimeout(resolve,500));continue;}previewJob.value=job;if(job.status==='completed'){previewUrl.value=job.result.previewUrl;emit('notify',tr('真实主题预览已生成','Real theme preview built'),'success');break;}if(['failed','cancelled'].includes(job.status))throw Object.assign(new Error(job.error||'Preview failed'),{code:job.errorCode});await new Promise(resolve=>setTimeout(resolve,500));}}catch(error){emit('notify',errorMessage(error),'error');}finally{previewing.value=false;}}
watch(()=>props.pageId,load,{immediate:true});
</script>
