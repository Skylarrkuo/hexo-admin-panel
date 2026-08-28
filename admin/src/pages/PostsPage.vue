<template>
  <section>
    <div class="section-heading"><div><h2>{{ tr('内容库','Post library') }}</h2><p>{{ tr('搜索、筛选并维护所有 Markdown 文章。','Search, filter, and maintain every Markdown post.') }}</p></div><span class="text-sm text-muted">{{ tr('{total} 篇文章','{total} posts',{total}) }}</span></div>
    <div class="toolbar">
      <div class="search-box"><input :value="search" :placeholder="tr('搜索文章...','Search posts...')" @input="$emit('update:search',$event.target.value);$emit('search')"></div>
      <div class="filter-tabs">
        <button v-for="item in statuses" :key="item.value" :class="{active:status===item.value}" @click="$emit('update:status',item.value);$emit('reload')">{{ item.label }}</button>
      </div>
      <button class="btn btn-primary" @click="$emit('create')">＋ {{ tr('新建文章','New post') }}</button>
    </div>
    <div v-if="loading" class="loading">{{ tr('加载中...','Loading...') }}</div>
    <div v-else class="card">
      <div v-if="posts.length===0" class="empty">{{ tr('暂无文章','No posts found') }}</div>
      <div v-else class="table-wrap"><table>
        <thead><tr><th>{{ tr('标题','Title') }}</th><th>{{ tr('日期','Date') }}</th><th>{{ tr('分类','Categories') }}</th><th>{{ tr('标签','Tags') }}</th><th>{{ tr('字数','Words') }}</th><th>{{ tr('状态','Status') }}</th><th>{{ tr('操作','Actions') }}</th></tr></thead>
        <tbody><tr v-for="post in posts" :key="post._id">
          <td style="max-width:250px"><button class="post-title-link truncate" @click="$emit('edit',post._id)">{{ post.title }}</button></td><td class="text-sm">{{ formatDate(post.date) }}</td>
          <td><span v-for="category in post.categories" :key="category" class="cat-badge">{{ category }}</span></td>
          <td><span v-for="tag in post.tags" :key="tag" class="tag-badge">{{ tag }}</span></td>
          <td class="text-sm">{{ post.wordCount }}</td>
          <td><span :class="post.published?'status-published':'status-draft'">{{ post.published?tr('已发布','Published'):tr('草稿','Draft') }}</span></td>
          <td><div class="btn-group">
            <button class="btn btn-outline btn-sm" @click="$emit('edit',post._id)">{{ tr('编辑','Edit') }}</button>
            <button class="btn btn-sm" :class="post.published?'btn-warning':'btn-success'" @click="$emit('publish',post)">{{ post.published?tr('取消发布','Unpublish'):tr('发布','Publish') }}</button>
            <button class="btn btn-danger btn-sm" @click="$emit('remove',post)">{{ tr('删除','Delete') }}</button>
          </div></td>
        </tr></tbody>
      </table></div>
      <div v-if="totalPages>1" class="pagination">
        <button :disabled="page<=1" @click="changePage(page-1)">&lt;</button>
        <template v-for="item in pageRange" :key="item"><button v-if="item==='...'" disabled>...</button><button v-else :class="{active:item===page}" @click="changePage(item)">{{ item }}</button></template>
        <button :disabled="page>=totalPages" @click="changePage(page+1)">&gt;</button><span class="info">{{ tr('共 {total} 篇','{total} total',{total}) }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '../i18n';
const {tr}=useI18n();
defineProps({ posts:Array, loading:Boolean, search:String, status:String, page:Number, total:Number, totalPages:Number, pageRange:Array });
const emit = defineEmits(['update:search','update:status','update:page','search','reload','create','edit','publish','remove']);
const statuses=computed(()=>[{value:'all',label:tr('全部','All')},{value:'published',label:tr('已发布','Published')},{value:'draft',label:tr('草稿','Drafts')}]);
function changePage(page){emit('update:page',page);emit('reload');}
function formatDate(value){if(!value)return'-';const date=new Date(value);return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
</script>
