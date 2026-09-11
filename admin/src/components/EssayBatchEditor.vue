<template>
  <div class="card essay-batch">
    <div class="card-title justify-between"><span>{{tr('批量编写随笔','Batch essay editor')}} · {{rows.length}} / 100</span><button class="btn btn-outline btn-sm" :disabled="saving" @click="close">{{tr('收起','Close')}}</button></div>
    <LocalDraftNotice :draft="draft"/>
    <p class="text-sm text-muted">{{tr('逐条修改内容和时间，所有条目校验通过后一次保存。移出此批次不会删除已保存的随笔。','Edit content and dates, then save the entire validated batch. Removing a row does not delete a saved essay.')}}</p>
    <details class="essay-import"><summary>{{tr('粘贴多篇随笔','Paste multiple essays')}}</summary><label for="essay-import-text">{{tr('每篇之间用单独一行 --- 分隔；空段会忽略，代码块内不会拆分。','Separate essays with a standalone --- line. Empty blocks are ignored; fenced code is preserved.')}}</label><textarea id="essay-import-text" v-model="importText" rows="6" :placeholder="tr('第一篇随笔\n---\n第二篇随笔','First essay\n---\nSecond essay')"></textarea><button class="btn btn-outline" :disabled="saving||!importText.trim()" @click="importRows">{{tr('拆分并添加到下方','Split and add below')}}</button></details>
    <div class="toolbar essay-batch-tools"><div class="btn-group"><button class="btn btn-outline" :disabled="saving||rows.length>=100" @click="addRow">＋ {{tr('添加一条','Add entry')}}</button><button class="btn btn-outline" @click="showPreview=!showPreview">{{showPreview?tr('隐藏预览','Hide previews'):tr('预览全部','Preview all')}}</button></div><div class="btn-group"><label for="essay-batch-date">{{tr('统一时间','Shared date')}} · {{timeZone}}</label><input id="essay-batch-date" v-model="sharedDate" type="datetime-local" step="1"><button class="btn btn-outline" :disabled="saving||!sharedDate||!rows.length" @click="applyDate">{{tr('应用到全部','Apply to all')}}</button></div></div>
    <div v-if="conflict" class="card essay-conflict" role="alert"><h3>{{tr('服务器数据已变化，请核对后继续','Server data changed. Review before continuing.')}}</h3><p>{{tr('减号表示服务器内容，加号表示本地修改。未在此批次的随笔会保留。','Minus lines show server content; plus lines show local edits. Essays outside this batch are preserved.')}}</p><div v-for="row in rows.filter(item=>item.id)" :key="row.key"><strong>{{serverRow(row)?tr('服务器 → 本地','Server → local'):tr('服务器已删除此条','This entry was deleted on the server')}}</strong><TextDiff :before="rowText(serverRow(row))" :after="rowText(row)"/><button v-if="serverRow(row)" class="btn btn-outline btn-sm" @click="useServer(row)">{{tr('采用服务器内容','Use server content')}}</button><button v-else class="btn btn-outline btn-sm" @click="row.id=''">{{tr('作为新随笔添加','Add as a new essay')}}</button></div><button class="btn btn-primary" :disabled="missingTargets" @click="acceptLatest">{{tr('已核对，基于此版本继续编辑','Reviewed — continue with this version')}}</button></div>
    <div v-for="(row,index) in rows" :key="row.key" class="essay-batch-row">
      <div class="essay-meta"><strong>{{index+1}} · {{row.id?tr('修改','Edit'):tr('新增','New')}}</strong><button class="btn btn-outline btn-sm" :disabled="saving" @click="rows.splice(index,1)">{{tr('移出此批次','Remove from batch')}}</button></div>
      <label :for="'essay-date-'+row.key">{{tr('发布时间','Publish date')}} · {{timeZone}}</label><input :id="'essay-date-'+row.key" v-model="row.date" type="datetime-local" step="1">
      <div :class="{'editor-layout':showPreview}"><div class="form-group"><label :for="'essay-content-'+row.key">{{tr('Markdown 内容','Markdown content')}}</label><textarea :id="'essay-content-'+row.key" v-model="row.content" class="essay-textarea" :aria-label="tr('第 {number} 条内容','Entry {number} content',{number:index+1})"></textarea><small class="text-muted">{{row.content.length}} {{tr('字符','characters')}}</small></div><div v-if="showPreview" class="preview-pane" v-html="renderMarkdown(row.content)"></div></div>
      <p v-if="errors[row.key]" class="config-error" role="alert">{{errors[row.key]}}</p>
    </div>
    <p v-if="!rows.length" class="empty">{{tr('添加条目，或粘贴多篇随笔开始编写。','Add an entry or paste several essays to begin.')}}</p>
    <div class="btn-group"><button class="btn btn-primary essay-batch-save" :disabled="saving||!rows.length||!!conflict" @click="save">{{saving?tr('保存中…','Saving…'):tr('保存全部 {count} 条','Save all {count} entries',{count:rows.length})}}</button><span class="text-sm text-muted">{{tr('保存前自动备份，可在恢复中心找回。保存后需通过发布流程更新线上站点。','A backup is created before saving. Publish the site to update it online.')}}</span></div>
  </div>
</template>

<script setup>
import {computed,onMounted,ref} from 'vue';
import {api} from '../api/client';
import {useI18n} from '../i18n';
import {renderMarkdown} from '../utils/markdown';
import {siteInput,siteInputToIso} from '../utils/site-time';
import {splitEssays} from '../utils/essay-batch';
import {useLocalDraft} from '../composables/useLocalDraft';
import LocalDraftNotice from './LocalDraftNotice.vue';
import TextDiff from './TextDiff.vue';
const props=defineProps({initialItems:{type:Array,default:()=>[]},revision:{type:String,required:true},timeZone:{type:String,default:'UTC'}});
const emit=defineEmits(['notify','dirty-change','saved','close']);const {tr,errorMessage}=useI18n();
let sequence=0;const key=()=>String(Date.now())+'-'+(++sequence);
const rows=ref(props.initialItems.map(item=>({key:key(),id:item.id,content:item.content,date:inputDate(item.date)})));
const revision=ref(props.revision),sharedDate=ref(siteInput(new Date(),props.timeZone)),importText=ref(''),showPreview=ref(false),saving=ref(false),errors=ref({}),conflict=ref(null);
const draft=useLocalDraft({key:()=> 'essays_batch',state:()=>({rows:rows.value,revision:revision.value,importText:importText.value,sharedDate:sharedDate.value}),apply:value=>{rows.value=value.rows;revision.value=value.revision;importText.value=value.importText||'';sharedDate.value=value.sharedDate||'';conflict.value=null;},emit});
function inputDate(value){return String(value||'').replace(' ','T').slice(0,19);}
function apiDate(value){return value.slice(0,19).replace('T',' ')+(value.length===16?':00':'');}
function createId(){return crypto.randomUUID().replaceAll('-','');}
function addRow(){if(rows.value.length<100)rows.value.push({key:key(),id:'',createId:createId(),content:'',date:sharedDate.value});}
function importRows(){const blocks=splitEssays(importText.value);if(rows.value.length+blocks.length>100){emit('notify',tr('每批最多 100 条，请分批添加','A batch supports up to 100 entries'),'error');return;}rows.value.push(...blocks.map(content=>({key:key(),id:'',createId:createId(),content,date:sharedDate.value})));importText.value='';}
function applyDate(){rows.value.forEach(row=>{row.date=sharedDate.value;});}
function close(){if(draft.leave())emit('close');}
function rowText(row){return row?row.date+'\n'+row.content:tr('不存在','Missing');}
function serverRow(row){return conflict.value?.items.find(item=>item.id===row.id);}
const missingTargets=computed(()=>rows.value.some(row=>row.id&&!serverRow(row)));
function useServer(row){const server=serverRow(row);row.date=inputDate(server.date);row.content=server.content;}
function acceptLatest(){revision.value=conflict.value.revision;conflict.value=null;}
async function reviewConflict(){try{conflict.value=await api.get('/essays');for(const row of rows.value){if(!row.id&&row.createId&&conflict.value.items.some(item=>item.id===row.createId))row.id=row.createId;}}catch(error){emit('notify',errorMessage(error),'error');}}
async function save(){
  errors.value={};
  for(const row of rows.value){if(!row.content.trim())errors.value[row.key]=tr('内容不能为空','Content is required');else if(row.content.length>200000)errors.value[row.key]=tr('内容不能超过 200000 字符','Content exceeds 200000 characters');else try{siteInputToIso(row.date.slice(0,16),props.timeZone);if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::[0-5]\d(?:\.0+)?)?$/.test(row.date))throw new Error(tr('日期格式无效','Invalid date'));}catch(error){errors.value[row.key]=error.message;}}
  if(Object.keys(errors.value).length||!rows.value.length)return;
  saving.value=true;const submitted=draft.snapshot();
  try{
    const data=await api.post('/essays/batch',{revision:submitted.revision,entries:submitted.rows.map(row=>({...(row.id?{id:row.id}:{createId:row.createId}),content:row.content,date:apiDate(row.date)}))});
    // Keep edits typed during the request, but bind newly created rows to their saved IDs.
    submitted.rows.forEach((row,index)=>{const current=rows.value.find(item=>item.key===row.key);row.id=data.changed[index].id;if(current)current.id=row.id;});
    revision.value=data.revision;submitted.revision=data.revision;submitted.importText='';draft.saved(submitted);
    emit('saved',data);emit('notify',tr('已保存：新增 {created} 条，修改 {updated} 条','Saved: {created} new, {updated} updated',{created:data.created,updated:data.updated}),'success');
  }catch(error){draft.persist();if(error.status===409||error.status===404)await reviewConflict();emit('notify',errorMessage(error),'error');}finally{saving.value=false;}
}
onMounted(()=>{draft.loaded();});
</script>

<style scoped>
.essay-batch{margin-bottom:20px}.essay-import{margin:16px 0}.essay-import summary{cursor:pointer;margin-bottom:10px}.essay-import textarea{display:block;width:100%;margin:8px 0}.essay-batch-tools{gap:12px;flex-wrap:wrap}.essay-batch-tools .btn-group{flex-wrap:wrap}.essay-batch-row{border-top:1px solid var(--border-color,#8885);padding:18px 0}.essay-batch-row>input{display:block;margin:6px 0 12px;max-width:280px}.essay-batch-row .essay-textarea{min-height:140px}.essay-conflict{margin:16px 0}.essay-conflict .text-diff{margin:10px 0}.essay-batch .btn-group{flex-wrap:wrap}
</style>
