<template>
  <section>
    <div class="section-heading"><div><h2>内容库</h2><p>搜索、筛选并维护所有 Markdown 文章。</p></div><span class="text-sm text-muted">{{ total }} 篇文章</span></div>
    <div class="toolbar">
      <div class="search-box"><input :value="search" placeholder="搜索文章..." @input="$emit('update:search',$event.target.value);$emit('search')"></div>
      <div class="filter-tabs">
        <button v-for="item in statuses" :key="item.value" :class="{active:status===item.value}" @click="$emit('update:status',item.value);$emit('reload')">{{ item.label }}</button>
      </div>
      <button class="btn btn-primary" @click="$emit('create')">＋ 新建文章</button>
    </div>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else class="card">
      <div v-if="posts.length===0" class="empty">暂无文章</div>
      <div v-else class="table-wrap"><table>
        <thead><tr><th>标题</th><th>日期</th><th>分类</th><th>标签</th><th>字数</th><th>状态</th><th>操作</th></tr></thead>
        <tbody><tr v-for="post in posts" :key="post._id">
          <td style="max-width:250px"><button class="post-title-link truncate" @click="$emit('edit',post._id)">{{ post.title }}</button></td><td class="text-sm">{{ formatDate(post.date) }}</td>
          <td><span v-for="category in post.categories" :key="category" class="cat-badge">{{ category }}</span></td>
          <td><span v-for="tag in post.tags" :key="tag" class="tag-badge">{{ tag }}</span></td>
          <td class="text-sm">{{ post.wordCount }}</td>
          <td><span :class="post.published?'status-published':'status-draft'">{{ post.published?'已发布':'草稿' }}</span></td>
          <td><div class="btn-group">
            <button class="btn btn-outline btn-sm" @click="$emit('edit',post._id)">编辑</button>
            <button class="btn btn-sm" :class="post.published?'btn-warning':'btn-success'" @click="$emit('publish',post)">{{ post.published?'取消发布':'发布' }}</button>
            <button class="btn btn-danger btn-sm" @click="$emit('remove',post)">删除</button>
          </div></td>
        </tr></tbody>
      </table></div>
      <div v-if="totalPages>1" class="pagination">
        <button :disabled="page<=1" @click="changePage(page-1)">&lt;</button>
        <template v-for="item in pageRange" :key="item"><button v-if="item==='...'" disabled>...</button><button v-else :class="{active:item===page}" @click="changePage(item)">{{ item }}</button></template>
        <button :disabled="page>=totalPages" @click="changePage(page+1)">&gt;</button><span class="info">共 {{ total }} 篇</span>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({ posts:Array, loading:Boolean, search:String, status:String, page:Number, total:Number, totalPages:Number, pageRange:Array });
const emit = defineEmits(['update:search','update:status','update:page','search','reload','create','edit','publish','remove']);
const statuses=[{value:'all',label:'全部'},{value:'published',label:'已发布'},{value:'draft',label:'草稿'}];
function changePage(page){emit('update:page',page);emit('reload');}
function formatDate(value){if(!value)return'-';const date=new Date(value);return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
</script>
