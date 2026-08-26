<template>
  <section>
    <div class="section-heading"><div><h2>主题外观</h2><p>查看 Hexo 工作区中已安装的主题及启用状态。</p></div></div>
    <div class="card">
    <div class="card-title">已安装主题</div>
    <div v-if="loading" class="loading">加载中...</div>
    <table v-else>
      <thead><tr><th>主题</th><th>状态</th></tr></thead>
      <tbody><tr v-for="theme in themes" :key="theme.name">
        <td>{{ theme.name }}</td>
        <td><span :class="theme.active?'status-published':'text-muted'">{{ theme.active?'启用':'未启用' }}</span></td>
      </tr></tbody>
    </table>
    </div>
  </section>
</template>

<script setup>
defineProps({ themes: { type: Array, required: true }, loading: Boolean });
</script>
