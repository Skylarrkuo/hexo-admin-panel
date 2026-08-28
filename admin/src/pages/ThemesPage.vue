<template>
  <section>
    <div class="section-heading"><div><h2>{{ tr('主题外观','Themes') }}</h2><p>{{ tr('查看 Hexo 工作区中已安装的主题及启用状态。','Review installed themes and see which one is active.') }}</p></div></div>
    <div class="card">
    <div class="card-title">{{ tr('已安装主题','Installed themes') }}</div>
    <div v-if="loading" class="loading">{{ tr('加载中...','Loading...') }}</div>
    <table v-else>
      <thead><tr><th>{{ tr('主题','Theme') }}</th><th>{{ tr('状态','Status') }}</th></tr></thead>
      <tbody><tr v-for="theme in themes" :key="theme.name">
        <td>{{ theme.name }}</td>
        <td><span :class="theme.active?'status-published':'text-muted'">{{ theme.active?tr('启用','Active'):tr('未启用','Inactive') }}</span></td>
      </tr></tbody>
    </table>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from '../i18n';
const {tr}=useI18n();
defineProps({ themes: { type: Array, required: true }, loading: Boolean });
</script>
