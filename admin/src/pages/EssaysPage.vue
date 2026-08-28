<template>
  <section>
    <div class="toolbar">
      <div>
        <h2>{{ tr('随笔管理','Essays') }}</h2>
        <div class="text-sm text-muted">{{ tr('散落的念头，也值得被认真收好 · 共 {count} 篇','Keep passing thoughts close · {count} entries',{count:items.length}) }}</div>
      </div>
      <button class="btn btn-primary" @click="startCreate">＋ {{ tr('写一篇随笔','Write an essay') }}</button>
    </div>

    <div v-if="editing" class="card essay-editor">
      <div class="card-title justify-between"><span>{{ form.id ? tr('编辑随笔','Edit essay') : tr('新建随笔','New essay') }}</span><button class="btn btn-outline btn-sm" @click="cancel">{{ tr('取消','Cancel') }}</button></div>
      <div class="form-group"><label>{{ tr('发布时间','Publish date') }}</label><input v-model="form.date" type="datetime-local"></div>
      <div class="editor-layout">
        <div class="form-group"><label>{{ tr('Markdown 内容','Markdown content') }}</label><textarea v-model="form.content" class="essay-textarea" :placeholder="tr('写下此刻经过心里的事……','Write down what is on your mind…')"></textarea></div>
        <div class="preview-pane"><div class="text-sm text-muted mb-8">{{ tr('安全预览','Safe preview') }}</div><div v-html="preview"></div></div>
      </div>
      <div class="btn-group"><button class="btn btn-primary" :disabled="saving" @click="save">{{ saving ? tr('保存中...','Saving...') : tr('保存随笔','Save essay') }}</button><button class="btn btn-outline" @click="cancel">{{ tr('取消','Cancel') }}</button></div>
    </div>

    <div v-if="loading" class="loading">{{ tr('加载中...','Loading...') }}</div>
    <div v-else-if="items.length===0" class="card empty">{{ tr('这里还没有随笔。写下一段最近萦绕心头的事吧。','No essays yet. Capture a thought that has stayed with you.') }}</div>
    <div v-else class="essay-list">
      <article v-for="item in items" :key="item.id" class="card essay-item">
        <div class="essay-meta"><time>{{ item.date }}</time><div class="btn-group"><button class="btn btn-outline btn-sm" @click="startEdit(item)">{{ tr('编辑','Edit') }}</button><button class="btn btn-danger btn-sm" @click="remove(item)">{{ tr('删除','Delete') }}</button></div></div>
        <div class="essay-content" v-html="render(item.content)"></div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { api } from '../api/client';
import { renderMarkdown } from '../utils/markdown';
import { useI18n } from '../i18n';

const {tr,errorMessage}=useI18n();
const emit=defineEmits(['notify','request-confirm']);
const items=ref([]);const revision=ref('');const sourcePath=ref('');const loading=ref(false);const saving=ref(false);const editing=ref(false);
const form=reactive({id:'',content:'',date:''});
const preview=computed(()=>renderMarkdown(form.content));
function notify(message,type='info'){emit('notify',message,type);}
function nowLocal(){const date=new Date();date.setMinutes(date.getMinutes()-date.getTimezoneOffset());return date.toISOString().slice(0,16);}
function inputDate(value){return String(value||'').replace(' ','T').slice(0,16);}
function apiDate(value){const normalized=String(value||'').replace('T',' ');return normalized.length===16?normalized+':00':normalized;}
function render(content){return renderMarkdown(content);}
async function load(){loading.value=true;try{const data=await api.get('/essays');items.value=data.items||[];revision.value=data.revision;sourcePath.value=data.path;}catch(error){notify(errorMessage(error),'error');}finally{loading.value=false;}}
function startCreate(){Object.assign(form,{id:'',content:'',date:nowLocal()});editing.value=true;}
function startEdit(item){Object.assign(form,{id:item.id,content:item.content,date:inputDate(item.date)});editing.value=true;window.scrollTo({top:0,behavior:'smooth'});}
function cancel(){editing.value=false;Object.assign(form,{id:'',content:'',date:''});}
async function save(){if(!form.content.trim()){notify(tr('随笔内容不能为空','Essay content is required'),'error');return;}if(!form.date){notify(tr('请选择发布时间','Choose a publish date'),'error');return;}saving.value=true;try{const body={content:form.content,date:apiDate(form.date),revision:revision.value};const data=form.id?await api.put('/essays/'+encodeURIComponent(form.id),body):await api.post('/essays',body);revision.value=data.revision;notify(form.id?tr('随笔已更新','Essay updated'):tr('随笔已发布','Essay published'),'success');cancel();await load();}catch(error){notify(errorMessage(error),'error');}finally{saving.value=false;}}
function remove(item){emit('request-confirm',tr('删除随笔','Delete essay'),tr('确定删除这篇随笔吗？写入前会自动备份 essays.yml。','Delete this essay? essays.yml will be backed up first.'),async()=>{try{const data=await api.del('/essays/'+encodeURIComponent(item.id),revision.value);revision.value=data.revision;notify(tr('随笔已删除','Essay deleted'),'success');await load();}catch(error){notify(errorMessage(error),'error');}});}
onMounted(load);
</script>
