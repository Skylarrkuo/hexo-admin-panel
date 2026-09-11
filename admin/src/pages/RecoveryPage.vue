<template>
  <section class="management-page recovery-page">
    <div class="section-heading"><div><h2>{{tr('统一恢复中心','Recovery center')}}</h2><p>{{tr('查看文件历史，核对差异后恢复。','Browse file history and review changes before restoring.')}}</p></div><button class="btn btn-outline" :disabled="loading||restoring||!!previewing" @click="load">{{loading?tr('刷新中…','Refreshing…'):tr('刷新','Refresh')}}</button></div>
    <div class="recovery-overview"><div class="recovery-storage"><AppIcon name="history"/><div><span>{{tr('可定位备份占用','Located backup storage')}}</span><strong>{{formatSize(totalBytes)}}</strong></div></div><p v-if="note">{{note}}</p></div>
    <div class="toolbar management-toolbar"><div class="search-box"><input v-model="search" type="search" :aria-label="tr('按文件或备份类型筛选','Filter by file or backup type')" :placeholder="tr('按文件或备份类型筛选…','Filter by file or backup type…')"></div><span class="text-sm text-muted">{{tr('{count} 条备份','{count} backups',{count:filtered.length})}}</span></div>
    <div v-if="loading" class="loading" role="status">{{tr('正在读取备份…','Loading backups…')}}</div>
    <div v-else-if="loadError" class="empty card" role="alert"><p>{{loadError}}</p><button class="btn btn-outline" @click="load">{{tr('重试','Retry')}}</button></div>
    <div v-else-if="!filtered.length" class="empty card"><AppIcon name="history"/><h3>{{tr('暂无匹配的备份','No matching backups')}}</h3><p>{{search?tr('试试其他文件名或备份类型。','Try another file name or backup type.'):tr('修改文件时创建的备份会显示在这里。','Backups created when files change will appear here.')}}</p></div>
    <div v-else class="table-wrap recovery-table"><table><thead><tr><th>{{tr('文件 / 类型','File / type')}}</th><th>{{tr('保存时间','Saved at')}}</th><th>{{tr('保留策略','Retention')}}</th><th><span class="sr-only">{{tr('操作','Actions')}}</span></th></tr></thead><tbody>
      <template v-for="item in filtered" :key="item.id">
        <tr :class="{'is-selected':selected?.id===item.id}"><td class="recovery-file"><strong>{{item.source}}</strong><span class="management-badge">{{item.group}}</span></td><td class="recovery-time"><time :datetime="item.createdAt">{{new Date(item.createdAt).toLocaleString()}}</time></td><td class="recovery-policy">{{item.policy}}</td><td class="recovery-action"><button class="btn btn-outline btn-sm" :disabled="restoring||!!previewing" :aria-expanded="selected?.id===item.id" @click="selected?.id===item.id?selected=null:preview(item)">{{previewing===item.id?tr('读取中…','Loading…'):selected?.id===item.id?tr('收起差异','Hide diff'):tr('预览恢复差异','Preview restore diff')}}</button></td></tr>
        <tr v-if="selected?.id===item.id" class="recovery-detail-row"><td colspan="4"><section class="recovery-preview" :aria-label="tr('恢复预览','Restore preview')">
          <div class="recovery-preview-heading"><h3>{{tr('核对恢复内容','Review restore contents')}}</h3><span class="text-sm text-muted">{{tr('当前文件 → 所选备份','Current file → Selected backup')}}</span></div>
          <template v-if="selected.encoding==='utf8'"><p class="text-sm text-muted">{{tr('− 将移除的内容 · + 将恢复的内容','− Content to remove · + Content to restore')}}</p><TextDiff :before="selected.current" :after="selected.content"/></template>
          <div v-else><div v-if="imageMime" class="recovery-images"><figure><figcaption>{{tr('当前文件','Current file')}}</figcaption><img v-if="selected.current" :src="'data:'+imageMime+';base64,'+selected.current" :alt="tr('当前文件','Current file')"><p v-else class="empty">{{tr('当前文件不存在','Current file is missing')}}</p></figure><figure><figcaption>{{tr('备份原图','Backup image')}}</figcaption><img :src="'data:'+imageMime+';base64,'+selected.content" :alt="tr('备份原图','Backup image')"></figure></div><p class="text-sm text-muted">{{tr('二进制原图恢复','Binary file restore')}} · {{formatSize(selected.size)}}</p></div>
          <footer class="recovery-preview-footer"><p>{{tr('恢复前会先备份当前文件。','The current file will be backed up before restoring.')}}</p><div class="btn-group"><button class="btn btn-outline" :disabled="restoring" @click="selected=null">{{tr('取消','Cancel')}}</button><button class="btn btn-warning" :disabled="restoring" @click="restore">{{restoring?tr('恢复中…','Restoring…'):tr('确认恢复此文件','Restore this file')}}</button></div></footer>
        </section></td></tr>
      </template>
    </tbody></table></div>
  </section>
</template>

<script setup>
import {computed,onMounted,ref} from 'vue';
import {api} from '../api/client';
import TextDiff from '../components/TextDiff.vue';
import AppIcon from '../components/AppIcon.vue';
import {useI18n} from '../i18n';
const {tr,errorMessage}=useI18n();
const emit=defineEmits(['notify']);
const items=ref([]),search=ref(''),selected=ref(null),totalBytes=ref(0),note=ref('');
const loading=ref(false),previewing=ref(''),restoring=ref(false),loadError=ref('');
const filtered=computed(()=>items.value.filter(item=>(item.source+' '+item.group).toLowerCase().includes(search.value.toLowerCase())));
const imageMime=computed(()=>{if(!selected.value||selected.value.encoding!=='base64')return '';const extension=selected.value.source.split('.').at(-1).toLowerCase();return ({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',avif:'image/avif',bmp:'image/bmp'})[extension]||'';});
function formatSize(bytes){return bytes<1024?bytes+' B':bytes<1048576?(bytes/1024).toFixed(2)+' KiB':(bytes/1048576).toFixed(2)+' MiB';}
async function load(){loading.value=true;loadError.value='';try{const data=await api.get('/recovery');items.value=data.items;totalBytes.value=data.totalBytes;note.value=data.note;selected.value=null;}catch(error){loadError.value=errorMessage(error);emit('notify',loadError.value,'error');}finally{loading.value=false;}}
async function preview(item){if(previewing.value||restoring.value)return;previewing.value=item.id;try{selected.value=await api.get('/recovery/'+item.id);}catch(error){emit('notify',errorMessage(error),'error');}finally{previewing.value='';}}
async function restore(){if(restoring.value||!selected.value)return;restoring.value=true;try{const data=await api.post('/recovery/'+selected.value.id+'/restore',{revision:selected.value.currentRevision});emit('notify',data.restartRequired?tr('已恢复配置，请重启 Hexo 生效','Configuration restored. Restart Hexo to apply it'):data.refreshed===false?tr('已恢复文件，但 Hexo 刷新失败','File restored; Hexo refresh failed'):tr('文件已恢复','File restored'),data.refreshed===false?'warning':'success');selected.value=null;await load();}catch(error){emit('notify',errorMessage(error),'error');}finally{restoring.value=false;}}
onMounted(load);
</script>
