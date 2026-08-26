<template>
  <section>
    <div class="dashboard-hero">
      <div class="card welcome-card">
        <div><span class="eyebrow">Your publishing desk</span><h2>把今天的想法，整理成一篇值得留下的文章。</h2><p>内容、资源与站点配置都在同一处。写完后生成预览，确认无误再发布。</p></div>
        <div class="welcome-actions"><button class="btn btn-primary" @click="$emit('create')">＋ 开始写文章</button></div>
      </div>
      <div class="stats-grid">
        <div v-for="item in statItems" :key="item.label" class="stat-card"><div class="num">{{ item.value }}</div><div class="label">{{ item.label }}</div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">站点操作</div>
      <div class="command-grid">
        <button class="command-action" :disabled="commandLoading" @click="$emit('command','generate')"><span><strong>{{ commandLoading==='generate'?'正在生成':'生成站点' }}</strong><small>编译最新静态文件</small></span><b>→</b></button>
        <button class="command-action" :disabled="commandLoading" @click="$emit('command','deploy')"><span><strong>{{ commandLoading==='deploy'?'正在部署':'部署站点' }}</strong><small>发布到远程环境</small></span><b>→</b></button>
        <button class="command-action" :disabled="commandLoading" @click="$emit('command','clean')"><span><strong>{{ commandLoading==='clean'?'正在清除':'清除缓存' }}</strong><small>移除生成缓存</small></span><b>→</b></button>
        <button class="command-action" :disabled="commandLoading" @click="$emit('command','rebuild-restart')"><span><strong>{{ commandLoading==='rebuild-restart'?'正在重建':'重建并重启' }}</strong><small>完整刷新服务</small></span><b>↻</b></button>
      </div>
    </div>
    <div class="card">
      <div class="card-title">最近文章</div>
      <div v-if="recentPosts.length===0" class="empty">暂无文章</div>
      <table v-else>
        <thead><tr><th>标题</th><th>日期</th><th>状态</th></tr></thead>
        <tbody><tr v-for="post in recentPosts" :key="post._id">
          <td><a href="#/posts" @click="$emit('edit',post._id)">{{ post.title }}</a></td>
          <td>{{ formatDate(post.date) }}</td>
          <td><span :class="post.published?'status-published':'status-draft'">{{ post.published?'已发布':'草稿' }}</span></td>
        </tr></tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({ stats: { type: Object, required: true }, recentPosts: { type: Array, required: true }, commandLoading: [String, Boolean] });
defineEmits(['command', 'edit', 'create']);
const statItems = computed(() => [
  ['已发布', props.stats.posts || 0], ['草稿', props.stats.drafts || 0], ['分类', props.stats.categories || 0],
  ['标签', props.stats.tags || 0], ['总字数', formatNumber(props.stats.totalWords || 0)]
].map(([label, value]) => ({ label, value })));
function formatDate(value) { if (!value) return '-'; const date = new Date(value); return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0'); }
function formatNumber(value) { return value >= 10000 ? (value / 10000).toFixed(1) + 'w' : String(value); }
</script>
