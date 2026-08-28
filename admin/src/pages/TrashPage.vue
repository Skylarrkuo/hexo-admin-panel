<template>
  <section>
    <div class="section-heading"><div><h2>{{ tr('最近删除','Recently deleted') }}</h2><p>{{ tr('删除的文章和媒体会暂存在这里，永久删除后无法恢复。','Deleted posts and media stay here until they are permanently removed.') }}</p></div><button class="btn btn-outline" @click="$emit('reload')">{{ tr('刷新列表','Refresh') }}</button></div>
    <div v-if="loading" class="loading">{{ tr('加载中...','Loading...') }}</div>
    <div v-else class="card">
      <div v-if="items.length===0" class="empty">{{ tr('回收站为空','Trash is empty') }}</div>
      <div v-else class="table-wrap"><table>
        <thead><tr><th>{{ tr('名称','Name') }}</th><th>{{ tr('类型','Type') }}</th><th>{{ tr('原位置','Original location') }}</th><th>{{ tr('删除时间','Deleted at') }}</th><th>{{ tr('操作','Actions') }}</th></tr></thead>
        <tbody><tr v-for="item in items" :key="item.id">
          <td>{{ item.name }}</td><td>{{ item.kind==='post'?tr('文章','Post'):tr('媒体','Media') }}</td><td class="text-sm">{{ item.originalPath }}</td>
          <td class="text-sm">{{ formatDate(item.deletedAt) }}</td>
          <td><div class="btn-group"><button class="btn btn-success btn-sm" @click="$emit('restore',item)">{{ tr('恢复','Restore') }}</button><button class="btn btn-danger btn-sm" @click="$emit('remove',item)">{{ tr('永久删除','Delete permanently') }}</button></div></td>
        </tr></tbody>
      </table></div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from '../i18n';
const {locale,tr}=useI18n();
defineProps({ items: Array, loading: Boolean });
defineEmits(['reload','restore','remove']);
function formatDate(value){return value?new Date(value).toLocaleString(locale.value==='en'?'en-US':'zh-CN'):'-';}
</script>
