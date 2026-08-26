<template>
  <section>
    <div class="section-heading"><div><h2>资源库</h2><p>集中管理文章中使用的图片与附件。</p></div><span class="text-sm text-muted">当前显示 {{ files.length }} 个文件</span></div>
    <div class="toolbar">
      <div class="search-box"><input :value="search" placeholder="筛选文件..." @input="$emit('update:search',$event.target.value)"></div>
      <div><input ref="fileInput" type="file" style="display:none" multiple @change="$emit('upload',$event)"><button class="btn btn-primary" @click="fileInput.click()">＋ 上传文件</button></div>
    </div>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else>
      <div v-if="files.length===0" class="empty card">暂无媒体文件</div>
      <div v-else class="media-grid"><div v-for="file in files" :key="file.name" class="media-item">
        <img v-if="isImage(file.name)" :src="assetUrl(file.path)" :alt="file.name" loading="lazy">
        <div v-else class="media-file-placeholder">&#128196;</div>
        <template v-if="renaming===file.name"><div class="media-rename"><input ref="renameInput" v-model.trim="renameValue" aria-label="新文件名" @keyup.enter="commitRename(file)" @keyup.esc="cancelRename"><div class="btn-group"><button class="btn btn-primary btn-sm" :disabled="!renameValue" @click="commitRename(file)">保存</button><button class="btn btn-outline btn-sm" @click="cancelRename">取消</button></div></div></template>
        <template v-else><div class="info" :title="file.name">{{ file.name }}</div><div class="info text-muted">{{ formatSize(file.size) }}</div>
        <div class="actions"><button class="btn btn-outline btn-sm" @click="$emit('copy',file)">复制链接</button><button class="btn btn-outline btn-sm" @click="startRename(file)">重命名</button><button class="btn btn-danger btn-sm" @click="$emit('remove',file)">删除</button></div></template>
      </div></div>
      <div v-if="totalPages>1" class="pagination"><button :disabled="page<=1" @click="changePage(page-1)">&lt;</button><span class="info">第 {{ page }} 页 / 共 {{ totalPages }} 页</span><button :disabled="page>=totalPages" @click="changePage(page+1)">&gt;</button></div>
    </div>
  </section>
</template>

<script setup>
import { nextTick, ref } from 'vue';
import { assetUrl } from '../api/client';
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
