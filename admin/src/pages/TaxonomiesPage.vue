<template>
  <section>
    <div class="section-heading"><div><h2>{{ tr('分类标签中心','Taxonomy center') }}</h2><p>{{ tr('统一查看使用量，并安全合并、重命名或删除分类与标签。','Review usage and safely merge, rename, or remove categories and tags.') }}</p></div><button class="btn btn-outline" @click="load">{{ tr('刷新','Refresh') }}</button></div>
    <div class="toolbar"><div class="filter-tabs"><button :class="{active:type==='categories'}" @click="type='categories'">{{ tr('分类','Categories') }} · {{ data.totals?.categories||0 }}</button><button :class="{active:type==='tags'}" @click="type='tags'">{{ tr('标签','Tags') }} · {{ data.totals?.tags||0 }}</button></div><div class="search-box"><input v-model="search" :placeholder="tr('搜索名称...','Search names...')"></div></div>
    <div v-if="selected.length>1" class="card bulk-action-bar"><strong>{{ tr('合并 {count} 项','Merge {count} items',{count:selected.length}) }}</strong><div class="btn-group"><input v-model="mergeTarget" :placeholder="tr('合并后的名称','Target name')"><button class="btn btn-primary btn-sm" :disabled="!mergeTarget.trim()||busy" @click="merge">{{ tr('执行合并','Merge') }}</button><button class="btn btn-outline btn-sm" @click="selected=[]">{{ tr('取消','Cancel') }}</button></div></div>
    <div class="card">
      <div v-if="loading" class="loading">{{ tr('加载中...','Loading...') }}</div>
      <div v-else-if="!filtered.length" class="empty">{{ tr('暂无数据','No taxonomy data') }}</div>
      <div v-else class="table-wrap"><table><thead><tr><th></th><th>{{ tr('名称','Name') }}</th><th>{{ tr('使用量','Usage') }}</th><th>{{ tr('已发布','Published') }}</th><th>{{ tr('草稿','Drafts') }}</th><th>{{ tr('操作','Actions') }}</th></tr></thead><tbody>
        <tr v-for="item in filtered" :key="item.name"><td><input type="checkbox" :checked="selected.includes(item.name)" @change="toggle(item.name,$event.target.checked)"></td><td><input v-if="editing===item.name" v-model="renameValue" class="taxonomy-rename"><strong v-else>{{ item.name }}</strong></td><td>{{ item.count }}</td><td>{{ item.published }}</td><td>{{ item.drafts }}</td><td><div class="btn-group"><template v-if="editing===item.name"><button class="btn btn-primary btn-sm" :disabled="!renameValue.trim()||busy" @click="rename(item)">{{ tr('保存','Save') }}</button><button class="btn btn-outline btn-sm" @click="editing=''">{{ tr('取消','Cancel') }}</button></template><template v-else><button class="btn btn-outline btn-sm" @click="editing=item.name;renameValue=item.name">{{ tr('重命名','Rename') }}</button><button class="btn btn-danger btn-sm" @click="remove(item)">{{ tr('删除','Delete') }}</button></template></div></td></tr>
      </tbody></table></div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from '../api/client';
import { useI18n } from '../i18n';
const {tr,errorMessage}=useI18n();const emit=defineEmits(['notify','request-confirm']);
const data=ref({categories:[],tags:[],totals:{}}),type=ref('categories'),search=ref(''),loading=ref(false),busy=ref(false),selected=ref([]),mergeTarget=ref(''),editing=ref(''),renameValue=ref('');
const filtered=computed(()=>(data.value[type.value]||[]).filter(item=>item.name.toLowerCase().includes(search.value.toLowerCase())));
async function load(){loading.value=true;try{data.value=await api.get('/taxonomies');selected.value=[];}catch(error){emit('notify',errorMessage(error),'error');}finally{loading.value=false;}}
function toggle(name,checked){selected.value=checked?[...new Set([...selected.value,name])]:selected.value.filter(item=>item!==name);}
async function mutate(action){busy.value=true;try{const result=await action();emit('notify',tr('已更新 {count} 篇文章','Updated {count} posts',{count:result.affectedPosts}),'success');editing.value='';mergeTarget.value='';await load();}catch(error){emit('notify',errorMessage(error),'error');}finally{busy.value=false;}}
function rename(item){mutate(()=>api.put('/taxonomies/'+type.value+'/'+encodeURIComponent(item.name),{name:renameValue.value.trim()}));}
function merge(){mutate(()=>api.post('/taxonomies/'+type.value+'/merge',{sources:selected.value,target:mergeTarget.value.trim()}));}
function remove(item){emit('request-confirm',tr('删除分类标签','Remove taxonomy'),tr('将从 {count} 篇文章中移除“{name}”，操作前会自动备份。','Remove “{name}” from {count} posts? A backup will be created first.',{name:item.name,count:item.count}),()=>mutate(()=>api.del('/taxonomies/'+type.value+'/'+encodeURIComponent(item.name))));}
onMounted(load);
</script>
