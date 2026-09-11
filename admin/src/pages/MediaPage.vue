<template>
  <section>
    <div class="section-heading"><div><h2>{{ tr('资源库','Media library') }}</h2><p>{{ tr('集中管理文章中使用的图片与附件。','Manage images and attachments used by your posts.') }}</p></div><span class="text-sm text-muted">{{ tr('当前显示 {count} 个文件','Showing {count} files',{count:files.length}) }}</span></div>
    <div class="toolbar">
      <div class="search-box"><input :value="search" :placeholder="tr('搜索全部文件...','Search all files...')" @input="$emit('update:search',$event.target.value);$emit('search')"></div>
      <div class="filter-tabs"><button v-for="item in usageOptions" :key="item.value" :class="{active:usage===item.value}" @click="$emit('update:usage',item.value);$emit('update:page',1);$emit('reload')">{{ item.label }}</button></div>
      <div><input ref="fileInput" type="file" style="display:none" multiple @change="$emit('upload',$event)"><button class="btn btn-primary" @click="fileInput.click()">＋ {{ tr('上传文件','Upload files') }}</button></div>
    </div>
    <p class="text-sm text-muted">{{ tr('引用扫描覆盖 source 中的 Markdown、YAML、JSON、HTML、CSS，以及站点根目录的 _config*.yml / .yaml。主题源码、插件和动态生成的引用不在扫描范围内；未检测到引用不代表可以安全删除。','Reference scanning covers Markdown, YAML, JSON, HTML and CSS in source, plus root _config*.yml / .yaml files. Theme code, plugins and dynamic references are not scanned; no matches do not guarantee safe deletion.') }}</p>
    <div v-if="loading" class="loading">{{ tr('加载中...','Loading...') }}</div>
    <div v-else>
      <div v-if="files.length===0" class="empty card">{{ tr('暂无媒体文件','No media files') }}</div>
      <div v-else class="media-grid"><div v-for="file in files" :key="file.name" class="media-item">
        <img v-if="isImage(file.name)" :src="assetUrl(file.path)" :alt="file.name" loading="lazy">
        <div v-else class="media-file-placeholder">&#128196;</div>
        <template v-if="renaming===file.name"><div class="media-rename"><input ref="renameInput" v-model.trim="renameValue" :aria-label="tr('新文件名','New file name')" @keyup.enter="commitRename(file)" @keyup.esc="cancelRename"><div class="btn-group"><button class="btn btn-primary btn-sm" :disabled="!renameValue" @click="commitRename(file)">{{ tr('保存','Save') }}</button><button class="btn btn-outline btn-sm" @click="cancelRename">{{ tr('取消','Cancel') }}</button></div></div></template>
        <template v-else><div class="info" :title="file.name">{{ file.name }}</div><div class="info text-muted">{{ formatSize(file.size) }} · <span :title="referenceTitle(file)">{{ file.used?tr('{count} 处引用','{count} references',{count:file.referenceCount}):tr('扫描范围内无引用','No scanned references') }}</span></div>
        <div class="actions"><button class="btn btn-outline btn-sm" @click="$emit('copy',file)">{{ tr('复制链接','Copy link') }}</button><button v-if="compressible(file.name)" class="btn btn-outline btn-sm" :disabled="compressing===file.name" @click="$emit('compress',file)">{{compressing===file.name?tr('压缩中','Compressing'):tr('压缩','Compress')}}</button><button class="btn btn-outline btn-sm" @click="startRename(file)">{{ tr('重命名','Rename') }}</button><button class="btn btn-danger btn-sm" @click="$emit('remove',file)">{{ tr('删除','Delete') }}</button></div></template>
      </div></div>
      <div v-if="totalPages>1" class="pagination"><button :disabled="page<=1" @click="changePage(page-1)">&lt;</button><span class="info">{{ tr('第 {page} 页 / 共 {total} 页','Page {page} of {total}',{page,total:totalPages}) }}</span><button :disabled="page>=totalPages" @click="changePage(page+1)">&gt;</button></div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue';
import { assetUrl } from '../api/client';
import { useI18n } from '../i18n';
const {tr}=useI18n();
defineProps({ files:Array, loading:Boolean, search:String, usage:String, compressing:String, page:Number, totalPages:Number });
const emit=defineEmits(['update:search','update:usage','update:page','search','reload','upload','copy','rename','compress','remove']);
const fileInput=ref(null);const renameInput=ref(null);const renaming=ref('');const renameValue=ref('');
const usageOptions=computed(()=>[{value:'all',label:tr('全部','All')},{value:'used',label:tr('已使用','Used')},{value:'unused',label:tr('扫描范围内无引用','No scanned references')}]);
function startRename(file){renaming.value=file.name;renameValue.value=file.name;nextTick(()=>{const input=Array.isArray(renameInput.value)?renameInput.value[0]:renameInput.value;input?.focus();input?.setSelectionRange(0,file.name.lastIndexOf('.')>0?file.name.lastIndexOf('.'):file.name.length);});}
function cancelRename(){renaming.value='';renameValue.value='';}
function commitRename(file){if(!renameValue.value||renameValue.value===file.name){cancelRename();return;}emit('rename',file,renameValue.value);cancelRename();}
function changePage(page){emit('update:page',page);emit('reload');}
function isImage(name){return /\.(jpg|jpeg|png|gif|webp|svg|ico|bmp)$/i.test(name);}
function compressible(name){return /\.(jpg|jpeg|png|webp)$/i.test(name);}function referenceTitle(file){return(file.references||[]).map(item=>item.source+' × '+item.count).join('\n');}
function formatSize(bytes){if(bytes<1024)return bytes+' B';if(bytes<1048576)return(bytes/1024).toFixed(1)+' KB';return(bytes/1048576).toFixed(1)+' MB';}
</script>
