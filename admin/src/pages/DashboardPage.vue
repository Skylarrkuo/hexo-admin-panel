<template>
  <section>
    <div class="dashboard-hero">
      <div class="card welcome-card">
        <div><span class="eyebrow">Your publishing desk</span><h2>{{ tr('把今天的想法，整理成一篇值得留下的文章。','Turn today’s idea into something worth keeping.') }}</h2><p>{{ tr('内容、资源与站点配置都在同一处。写完后生成预览，确认无误再发布。','Write, manage assets, and configure your site in one place. Preview before you publish.') }}</p></div>
        <div class="welcome-actions"><button class="btn btn-primary" @click="$emit('create')">＋ {{ tr('开始写文章','Write a post') }}</button></div>
      </div>
      <div class="stats-grid">
        <div v-for="item in statItems" :key="item.label" class="stat-card"><div class="num">{{ item.value }}</div><div class="label">{{ item.label }}</div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">{{ tr('站点操作','Site actions') }}</div>
      <div class="command-grid">
        <button class="command-action" :disabled="commandLoading" @click="$emit('command','generate')"><span><strong>{{ commandLoading==='generate'?tr('正在生成','Generating'):tr('生成站点','Generate site') }}</strong><small>{{ tr('编译最新静态文件','Build the latest static files') }}</small></span><b>→</b></button>
        <button class="command-action" :disabled="commandLoading" @click="$emit('command','deploy')"><span><strong>{{ commandLoading==='deploy'?tr('正在部署','Deploying'):tr('部署站点','Deploy site') }}</strong><small>{{ tr('发布到远程环境','Publish to the remote target') }}</small></span><b>→</b></button>
        <button class="command-action" :disabled="commandLoading" @click="$emit('command','clean')"><span><strong>{{ commandLoading==='clean'?tr('正在清除','Cleaning'):tr('清除缓存','Clean cache') }}</strong><small>{{ tr('移除生成缓存','Remove generated cache') }}</small></span><b>→</b></button>
        <button class="command-action" :disabled="commandLoading" @click="$emit('command','rebuild-restart')"><span><strong>{{ commandLoading==='rebuild-restart'?tr('正在重建','Rebuilding'):tr('重建并重启','Rebuild and restart') }}</strong><small>{{ tr('完整刷新服务','Refresh the full service') }}</small></span><b>↻</b></button>
      </div>
      <div v-if="commandJob" class="command-job" :class="'job-'+commandJob.status">
        <div class="command-job-head"><strong>{{ commandJob.command }}</strong><span>{{ statusLabel(commandJob.status) }}</span></div>
        <div class="command-job-meta">{{ tr('任务编号','Job ID') }}：{{ commandJob.id }}</div>
        <div class="progress-track"><i :style="{width:(commandJob.progress||0)+'%'}"></i></div>
        <div class="command-job-log"><div v-for="(entry,index) in commandJob.logs||[]" :key="index"><time>{{ formatTime(entry.at) }}</time><span>{{ entry.message }}</span></div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">{{ tr('最近文章','Recent posts') }}</div>
      <div v-if="recentPosts.length===0" class="empty">{{ tr('暂无文章','No posts yet') }}</div>
      <table v-else>
        <thead><tr><th>{{ tr('标题','Title') }}</th><th>{{ tr('日期','Date') }}</th><th>{{ tr('状态','Status') }}</th></tr></thead>
        <tbody><tr v-for="post in recentPosts" :key="post._id">
          <td><a href="#/posts" @click="$emit('edit',post._id)">{{ post.title }}</a></td>
          <td>{{ formatDate(post.date) }}</td>
          <td><span :class="post.published?'status-published':'status-draft'">{{ post.published?tr('已加入站点','In site source'):tr('草稿','Draft') }}</span></td>
        </tr></tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '../i18n';
const {locale,tr}=useI18n();
const props = defineProps({ stats: { type: Object, required: true }, recentPosts: { type: Array, required: true }, commandLoading: [String, Boolean], commandJob: { type: Object, default: null } });
defineEmits(['command', 'edit', 'create']);
const statItems = computed(() => [
  [tr('已加入站点','In site source'), props.stats.posts || 0], [tr('草稿','Drafts'), props.stats.drafts || 0], [tr('分类','Categories'), props.stats.categories || 0],
  [tr('标签','Tags'), props.stats.tags || 0], [tr('总字数','Total words'), formatNumber(props.stats.totalWords || 0)]
].map(([label, value]) => ({ label, value })));
function formatDate(value) { if (!value) return '-'; const date = new Date(value); return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0'); }
function formatNumber(value) { return value >= 10000 ? (value / 10000).toFixed(1) + 'w' : String(value); }
function formatTime(value){return value?new Date(value).toLocaleTimeString(locale.value==='en'?'en-US':'zh-CN',{hour12:false}):'';}
function statusLabel(value){return({queued:tr('排队中','Queued'),running:tr('执行中','Running'),cancelling:tr('取消中','Cancelling'),completed:tr('已完成','Completed'),failed:tr('失败','Failed'),cancelled:tr('已取消','Cancelled')})[value]||value;}
</script>
