<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark" aria-hidden="true"><img :src="logoUrl" alt=""></div>
      <div><strong>Hexo Admin Panel</strong><span>{{ tr('内容工作台','Publishing workspace') }}</span></div>
    </div>
    <div class="site-state"><span class="state-pulse"></span><div><strong>{{ tr('站点已连接','Site connected') }}</strong><span>{{ tr('本地工作区','Local workspace') }}</span></div></div>
    <nav :aria-label="tr('后台导航','Admin navigation')">
      <a v-for="item in items" :key="item.path" :href="'#' + item.path" :class="{ active: isActive(item.path) }" @click="$emit('navigate', item.path)">
        <AppIcon :name="item.icon"/><span>{{ item.label }}</span><i></i>
      </a>
    </nav>
    <div class="sidebar-footer">
      <button class="language-toggle sidebar-language-toggle" :aria-label="tr('切换为英文','Switch to Chinese')" @click="toggleLocale"><span :class="{active:locale==='zh-CN'}">中文</span><span :class="{active:locale==='en'}">EN</span></button>
      <button class="theme-toggle" @click="$emit('toggle-theme')"><AppIcon :name="colorMode==='dark'?'sun':'moon'"/><span>{{ colorMode==='dark'?tr('切换亮色','Use light mode'):tr('切换暗色','Use dark mode') }}</span></button>
      <a class="site-link" href="/" target="_blank"><AppIcon name="external"/><span>{{ tr('查看站点','View site') }}</span></a>
      <button class="logout-btn" @click="$emit('logout')"><AppIcon name="logout"/><span>{{ tr('退出登录','Sign out') }}</span></button>
    </div>
  </aside>
</template>

<script setup>
import AppIcon from '../components/AppIcon.vue';
import { computed } from 'vue';
import { useI18n } from '../i18n';
import logoUrl from '../../../assets/hexo-admin-panel-logo.svg';
const props = defineProps({ route: { type: String, required: true }, colorMode: { type: String, default: 'light' } });
defineEmits(['navigate', 'logout', 'toggle-theme']);
const {locale,tr,toggleLocale}=useI18n();
const items = computed(() => [
  { path: '/dashboard', label: tr('工作概览','Dashboard'), icon: 'dashboard' }, { path: '/posts', label: tr('文章管理','Posts'), icon: 'posts' }, { path: '/pages', label: tr('页面管理','Pages'), icon: 'about' }, { path: '/taxonomies', label: tr('分类标签','Taxonomies'), icon: 'taxonomy' },
  { path: '/publishing', label: tr('发布中心','Publishing'), icon: 'publishing' }, { path: '/essays', label: tr('随笔管理','Essays'), icon: 'essays' }, { path: '/media', label: tr('媒体资源','Media'), icon: 'media' }, { path: '/trash', label: tr('回收站','Trash'), icon: 'trash' }, { path: '/config', label: tr('站点配置','Settings'), icon: 'config' }, { path: '/themes', label: tr('主题外观','Themes'), icon: 'themes' }, { path: '/plugin', label: tr('关于插件','About plugin'), icon: 'plugin' }
]);
function isActive(path) {
  if (path === '/posts') return props.route === '/posts' || props.route === '/posts/new' || props.route.startsWith('/posts/edit');
  if (path === '/pages') return props.route === '/pages' || props.route.startsWith('/pages/edit');
  return props.route === path;
}
</script>
