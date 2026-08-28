<template>
  <section>
    <div class="section-heading"><div><h2>{{ tr('资源库','Media library') }}</h2><p>{{ tr('集中管理文章中使用的图片与附件。','Manage images and attachments used by your posts.') }}</p></div><span class="text-sm text-muted">{{ tr('当前显示 {count} 个文件','Showing {count} files',{count:files.length}) }}</span></div>
    <div class="toolbar">
      <div class="search-box"><input :value="search" :placeholder="tr('筛选文件...','Filter files...')" @input="$emit('update:search',$event.target.value)"></div>
      <div><input ref="fileInput" type="file" style="display:none" multiple @change="$emit('upload',$event)"><button class="btn btn-primary" @click="fileInput.click()">＋ {{ tr('上传文件','Upload files') }}</button></div>
    </div>
    <div v-if="loading" class="loading">{{ tr('加载中...','Loading...') }}</div>
    <div v-else>
      <div v-if="files.length===0" class="empty card">{{ tr('暂无媒体文件','No media files') }}</div>
      <div v-else class="media-grid"><div v-for="file in files" :key="file.name" class="media-item">
        <img v-if="isImage(file.name)" :src="assetUrl(file.path)" :alt="file.name" loading="lazy">
        <div v-else class="media-file-placeholder">&#128196;</div>
        <template v-if="renaming===file.name"><div class="media-rename"><input ref="renameInput" v-model.trim="renameValue" :aria-label="tr('新文件名','New file name')" @keyup.enter="commitRename(file)" @keyup.esc="cancelRename"><div class="btn-group"><button class="btn btn-primary btn-sm" :disabled="!renameValue" @click="commitRename(file)">{{ tr('保存','Save') }}</button><button class="btn btn-outline btn-sm" @click="cancelRename">{{ tr('取消','Cancel') }}</button></div></div></template>
        <template v-else><div class="info" :title="file.name">{{ file.name }}</div><div class="info text-muted">{{ formatSize(file.size) }}</div>
        <div class="actions"><button class="btn btn-outline btn-sm" @click="$emit('copy',file)">{{ tr('复制链接','Copy link') }}</button><button class="btn btn-outline btn-sm" @click="startRename(file)">{{ tr('重命名','Rename') }}</button><button class="btn btn-danger btn-sm" @click="$emit('remove',file)">{{ tr('删除','Delete') }}</button></div></template>
      </div></div>
      <div v-if="totalPages>1" class="pagination"><button :disabled="page<=1" @click="changePage(page-1)">&lt;</button><span class="info">{{ tr('第 {page} 页 / 共 {total} 页','Page {page} of {total}',{page,total:totalPages}) }}</span><button :disabled="page>=totalPages" @click="changePage(page+1)">&gt;</button></div>
    </div>
  </section>
</template>

<script setup>
import { nextTick, ref } from 'vue';
import { assetUrl } from '../api/client';
import { useI18n } from '../i18n';
const {tr}=useI18n();
defineProps({ files:Array, loading:Boolean, search:String, page:Number, totalPages:Number });
const emit=defineEmits(['update:search','update:page','reload','upload','copy','rename','remove']);
const fileInput=ref(null);const renameInput=ref(null);const renaming=ref('');const renameValue=ref('');
function startRename(file){renaming.value=file.name;renameValue.value=file.name;nextTick(()=>{const input=Array.isArray(renameInput.value)?renameInput.value[0]:renameInput.value;input?.focus();input?.setSelectionRange(0,file.name.lastIndexOf('.')>0?file.name.lastIndexOf('.'):file.name.length);});}
function cancelRename(){renaming.value='';renameValue.value='';}
function commitRename(file){if(!renameValue.value||renameValue.value===file.name){cancelRename();return;}emit('rename',file,renameValue.value);cancelRename();}
function changePage(page){emit('update:page',page);emit('reload');}
function isImage(name){return /\.(jpg|jpeg|png|gif|webp|svg|ico|bmp)$/i.test(name);}
function formatSize(bytes){if(bytes<1024)return bytes+' B';if(bytes<1048576)return(bytes/1024).toFixed(1)+' KB';return(bytes/1048576).toFixed(1)+' MB';}
</script>
