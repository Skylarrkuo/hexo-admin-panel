<template>
  <div class="card">
    <button class="btn btn-outline btn-sm" @click="load">{{tr('内容历史与版本差异','Content history and diff')}}</button>
    <div v-if="opened"><p class="text-sm text-muted">{{tr('保存前记录原版本，文本最多保留 50 版；恢复前会备份当前文件。','The previous version is recorded before saving, up to 50 text versions. Restore backs up the current file.')}}</p><select v-model="selected" @change="preview"><option value="">{{tr('选择版本','Choose a version')}}</option><option v-for="item in items" :key="item.id" :value="item.id">{{new Date(item.createdAt).toLocaleString()}} · {{item.revision.slice(0,12)}}</option></select><template v-if="version"><TextDiff :before="version.current" :after="version.content"/><button class="btn btn-warning" @click="restore">{{tr('恢复此版本','Restore this version')}}</button></template></div>
    <div v-if="conflict" role="alert"><h3>{{tr('内容冲突：合并后再保存','Content conflict: merge before saving')}}</h3><div class="conflict-columns"><label v-for="item in [['base','原版本'],['local','本地修改'],['server','服务器版本']]" :key="item[0]">{{item[1]}}<textarea :value="conflict[item[0]]" readonly rows="10"></textarea></label></div><TextDiff :before="conflict.base" :after="conflict.server"/><label>{{tr('合并结果（请删除冲突标记）','Merged result (remove conflict markers)')}}<textarea v-model="merged" rows="12"></textarea></label><button class="btn btn-primary" @click="applyMerge">{{tr('使用合并结果继续编辑','Continue editing merged result')}}</button></div>
  </div>
</template>
<script setup>
import {ref} from 'vue';
import {api} from '../api/client';
import {mergeThreeWay} from '../utils/text-diff';
import {useI18n} from '../i18n';
import TextDiff from './TextDiff.vue';
const {tr,errorMessage}=useI18n();const props=defineProps({source:{type:String,default:''},endpoint:{type:String,required:true}});const emit=defineEmits(['notify','reload','merge']);
const opened=ref(false),items=ref([]),selected=ref(''),version=ref(null),conflict=ref(null),merged=ref('');
async function load(){try{items.value=(await api.get('/history?source='+encodeURIComponent(props.source))).items;opened.value=!opened.value;}catch(error){emit('notify',errorMessage(error),'error');}}
async function preview(){version.value=null;if(!selected.value)return;try{version.value=await api.get('/history/'+selected.value);}catch(error){emit('notify',errorMessage(error),'error');}}
async function restore(){if(!window.confirm(tr('恢复将写入服务器文件，当前文件会先备份。本地未保存草稿仍会保留。','Restore the server file after backing it up? Unsaved local drafts remain available.')))return;try{const data=await api.post('/history/'+selected.value+'/restore',{revision:version.value.currentRevision});emit('notify',data.refreshed===false?tr('文件已恢复，Hexo 刷新失败','File restored; Hexo refresh failed'):tr('版本已恢复','Version restored'),data.refreshed===false?'warning':'success');version.value=null;emit('reload');}catch(error){emit('notify',errorMessage(error),'error');}}
async function capture(base,local){try{const server=await api.get(props.endpoint);conflict.value={base,local,server:server.raw,revision:server.revision};merged.value=mergeThreeWay(base,local,server.raw).text;}catch(error){emit('notify',errorMessage(error),'error');}}
function applyMerge(){if(/^(<<<<<<<|\|\|\|\|\|\|\||=======|>>>>>>>)/m.test(merged.value)){emit('notify',tr('请先处理并删除冲突标记','Resolve and remove conflict markers first'),'error');return;}emit('merge',{raw:merged.value,revision:conflict.value.revision,base:conflict.value.server});conflict.value=null;}
defineExpose({capture});
</script>
<style scoped>.card{padding:12px 16px}.conflict-columns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}textarea{width:100%;font-family:monospace}@media(max-width:800px){.conflict-columns{grid-template-columns:1fr}}</style>
