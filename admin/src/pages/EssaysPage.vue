<template>
  <section class="management-page essays-page">
    <LocalDraftNotice v-if="!batchOpen" :draft="draft"/>
    <div class="section-heading essays-heading">
      <div>
        <h2>{{ tr('随笔管理','Essays') }}</h2>
        <div class="text-sm text-muted">{{ tr('散落的念头，也值得被认真收好 · 共 {count} 篇','Keep passing thoughts close · {count} entries',{count:items.length}) }}</div>
      </div>
      <div class="btn-group"><button class="btn btn-outline" :disabled="loading||saving||batchOpen" @click="startBatch(false)">{{tr('批量添加','Batch add')}}</button><button class="btn btn-outline" :disabled="loading||saving||batchOpen||!selected.length||selected.length>100" @click="startBatch(true)">{{tr('批量编辑已选 {count} 条','Edit {count} selected',{count:selected.length})}}</button><button class="btn btn-primary" :disabled="loading||saving||batchOpen" @click="startCreate">＋ {{ tr('写一篇随笔','Write an essay') }}</button></div>
    </div>

    <EssayBatchEditor v-if="batchOpen" :initial-items="batchItems" :revision="revision" :time-zone="siteZone" @notify="notify" @dirty-change="$emit('dirty-change',$event)" @saved="batchSaved" @close="closeBatch"/>
    <div v-if="editing&&!batchOpen&&!inlineEditing" class="card essay-create-card">
      <EssayEditor :form="form" :time-zone="siteZone" :saving="saving" @update:date="form.date=$event" @update:content="form.content=$event" @save="save" @cancel="cancel"/>
    </div>

    <div v-if="items.length" class="essay-selection-bar"><label class="selection-control"><input type="checkbox" :indeterminate="selected.length>0&&selected.length<items.length" :checked="items.length>0&&selected.length===items.length" :disabled="batchOpen||items.length>100" @change="selected=$event.target.checked?items.map(item=>item.id):[]"> {{tr('全选','Select all')}}</label><span class="text-sm text-muted">{{tr('已选 {count} 条 · 每批最多 100 条','{count} selected · up to 100 per batch',{count:selected.length})}}</span><button v-if="selected.length" class="btn btn-outline btn-sm" :disabled="batchOpen" @click="selected=[]">{{tr('清空选择','Clear selection')}}</button></div>
    <div v-if="loading" class="loading">{{ tr('加载中...','Loading...') }}</div>
    <div v-else-if="items.length===0" class="card empty">{{ tr('这里还没有随笔。写下一段最近萦绕心头的事吧。','No essays yet. Capture a thought that has stayed with you.') }}</div>
    <div v-else class="essay-list">
      <article v-for="item in items" :key="item.id" class="card essay-item" :class="{'is-editing':editing&&form.id===item.id,'is-selected':selected.includes(item.id)}" :data-essay-id="item.id">
        <div class="essay-meta"><label class="selection-control"><input v-model="selected" type="checkbox" :value="item.id" :disabled="batchOpen||(!selected.includes(item.id)&&selected.length>=100)" :aria-label="tr('选择随笔 {date}','Select essay {date}',{date:item.date})"> <time>{{ item.date }}</time></label><div v-if="!editing||form.id!==item.id" class="btn-group"><button class="btn btn-outline btn-sm" :disabled="batchOpen||saving" @click="startEdit(item)">{{ tr('编辑','Edit') }}</button><button class="btn btn-danger btn-sm" :disabled="batchOpen||saving||editing" @click="remove(item)">{{ tr('删除','Delete') }}</button></div></div>
        <EssayEditor v-if="editing&&form.id===item.id&&!batchOpen" :form="form" :time-zone="siteZone" :saving="saving" @update:date="form.date=$event" @update:content="form.content=$event" @save="save" @cancel="cancel"/>
        <div v-else class="essay-content" v-html="render(item.content)"></div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import EssayEditor from '../components/EssayEditor.vue';
import EssayBatchEditor from '../components/EssayBatchEditor.vue';
import LocalDraftNotice from '../components/LocalDraftNotice.vue';
import {useLocalDraft} from '../composables/useLocalDraft';
import {siteInput} from '../utils/site-time';
import { api } from '../api/client';
import { renderMarkdown } from '../utils/markdown';
import { useI18n } from '../i18n';

const {tr,errorMessage}=useI18n();
const emit=defineEmits(['notify','request-confirm','dirty-change']);
const siteZone=ref('UTC');const items=ref([]);const revision=ref('');const sourcePath=ref('');const loading=ref(false);const saving=ref(false);const editing=ref(false);
const batchOpen=ref(false),batchItems=ref([]),selected=ref([]);
const form=reactive({id:'',content:'',date:''});
const draft=useLocalDraft({key:()=> 'essays',state:()=>({form:{...form},editing:editing.value,revision:revision.value}),apply:value=>{Object.assign(form,value.form);editing.value=value.editing;revision.value=value.revision;},emit});
const inlineEditing=computed(()=>form.id&&items.value.some(item=>item.id===form.id));
function notify(message,type='info'){emit('notify',message,type);}
function nowLocal(){return siteInput(new Date(),siteZone.value);}
function inputDate(value){return String(value||'').replace(' ','T').slice(0,19);}
function apiDate(value){const normalized=String(value||'').replace('T',' ').slice(0,19);return normalized.length===16?normalized+':00':normalized;}
function render(content){return renderMarkdown(content);}
async function load(){try{siteZone.value=(await api.get('/native')).timeZone||'UTC';}catch(_){}draft.pause();loading.value=true;try{const data=await api.get('/essays');items.value=data.items||[];revision.value=data.revision;sourcePath.value=data.path;draft.loaded();}catch(error){notify(errorMessage(error),'error');}finally{loading.value=false;}}
function startBatch(useSelection){if(!draft.leave())return;draft.pause();editing.value=false;batchItems.value=useSelection?items.value.filter(item=>selected.value.includes(item.id)):[];batchOpen.value=true;emit('dirty-change',false);}
function batchSaved(data){items.value=data.items;revision.value=data.revision;selected.value=[];}
async function closeBatch(){batchOpen.value=false;emit('dirty-change',false);await load();}
function startCreate(){if(!draft.leave())return;draft.pause();Object.assign(form,{id:'',content:'',date:nowLocal()});editing.value=true;draft.loaded();}
function startEdit(item){if(!draft.leave())return;draft.pause();Object.assign(form,{id:item.id,content:item.content,date:inputDate(item.date)});editing.value=true;draft.loaded();}
function cancel(){if(saving.value)return;if(!draft.leave())return;draft.pause();editing.value=false;Object.assign(form,{id:'',content:'',date:''});draft.loaded();}
async function save(){if(saving.value)return;if(!form.content.trim()){notify(tr('随笔内容不能为空','Essay content is required'),'error');return;}if(!form.date){notify(tr('请选择发布时间','Choose a publish date'),'error');return;}saving.value=true;try{const body={content:form.content,date:apiDate(form.date),revision:revision.value};const wasEditing=!!form.id;const submitted=draft.snapshot();const data=form.id?await api.put('/essays/'+encodeURIComponent(form.id),body):await api.post('/essays',body);revision.value=data.revision;submitted.revision=data.revision;form.id=data.item.id;submitted.form.id=data.item.id;draft.saved(submitted);items.value=[...items.value.filter(item=>item.id!==data.item.id),data.item].sort((a,b)=>b.date.localeCompare(a.date));if(draft.dirty.value){notify(tr('内容已保存，后续修改仍保留','Content saved; newer edits remain'),'info');return;}notify(wasEditing?tr('随笔已更新','Essay updated'):tr('随笔已保存','Essay saved'),'success');draft.pause();editing.value=false;Object.assign(form,{id:'',content:'',date:''});draft.loaded();}catch(error){notify(errorMessage(error),'error');}finally{saving.value=false;}}
function remove(item){emit('request-confirm',tr('删除随笔','Delete essay'),tr('确定删除这篇随笔吗？写入前会自动备份 essays.yml。','Delete this essay? essays.yml will be backed up first.'),async()=>{try{const data=await api.del('/essays/'+encodeURIComponent(item.id),revision.value);revision.value=data.revision;notify(tr('随笔已删除','Essay deleted'),'success');await load();}catch(error){notify(errorMessage(error),'error');}});}
onMounted(load);
</script>
