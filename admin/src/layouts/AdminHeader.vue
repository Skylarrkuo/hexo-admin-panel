<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark" aria-hidden="true"><span>H</span></div>
      <div><strong>Hexo Studio</strong><span>内容工作台</span></div>
    </div>
    <div class="site-state"><span class="state-pulse"></span><div><strong>站点已连接</strong><span>本地工作区</span></div></div>
    <nav aria-label="后台导航">
      <a v-for="item in items" :key="item.path" :href="'#' + item.path" :class="{ active: isActive(item.path) }" @click="$emit('navigate', item.path)">
        <AppIcon :name="item.icon"/><span>{{ item.label }}</span><i></i>
      </a>
    </nav>
    <div class="sidebar-footer">
      <button class="theme-toggle" @click="$emit('toggle-theme')"><AppIcon :name="colorMode==='dark'?'sun':'moon'"/><span>{{ colorMode==='dark'?'切换亮色':'切换暗色' }}</span></button>
      <a class="site-link" href="/" target="_blank"><AppIcon name="external"/><span>查看站点</span></a>
      <button class="logout-btn" @click="$emit('logout')"><AppIcon name="logout"/><span>退出登录</span></button>
    </div>
  </aside>
</template>

<script setup>
import AppIcon from '../components/AppIcon.vue';
const props = defineProps({ route: { type: String, required: true }, colorMode: { type: String, default: 'light' } });
defineEmits(['navigate', 'logout', 'toggle-theme']);
const items = [
  { path: '/dashboard', label: '工作概览', icon: 'dashboard' }, { path: '/posts', label: '文章管理', icon: 'posts' }, { path: '/essays', label: '随笔管理', icon: 'essays' }, { path: '/about', label: '关于页面', icon: 'about' },
  { path: '/media', label: '媒体资源', icon: 'media' }, { path: '/trash', label: '回收站', icon: 'trash' }, { path: '/config', label: '站点配置', icon: 'config' }, { path: '/themes', label: '主题外观', icon: 'themes' }
];
function isActive(path) {
  if (path === '/posts') return props.route === '/posts' || props.route === '/posts/new' || props.route.startsWith('/posts/edit');
  return props.route === path;
}
</script>
