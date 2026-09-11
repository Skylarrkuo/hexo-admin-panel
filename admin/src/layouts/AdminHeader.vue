<template>
  <aside v-if="!isMobile" class="workspace-sidebar">
    <AdminNavigation :route="route" :color-mode="colorMode" brand-name="Hexo Admin Panel" @navigate="navigate" @logout="$emit('logout')" @logout-all="$emit('logout-all')" @toggle-theme="$emit('toggle-theme')" />
  </aside>
  <template v-else>
    <nav class="mobile-navigation" :aria-label="tr('快捷导航','Quick navigation')">
      <a v-for="item in shortcuts" :key="item.path" :href="'#'+item.path" :class="{active:isActive(item.path)}" :aria-current="isActive(item.path)?'page':undefined" @click.prevent="navigate(item.path)"><AppIcon :name="item.icon"/><span>{{ item.label }}</span></a>
      <button :class="{active:!shortcuts.some(item=>isActive(item.path))}" aria-controls="mobile-navigation-drawer" :aria-expanded="drawerOpen" @click="openDrawer"><AppIcon name="menu"/><span>{{ tr('全部导航','All navigation') }}</span></button>
    </nav>
    <dialog id="mobile-navigation-drawer" ref="drawer" class="navigation-drawer" :aria-label="tr('后台导航','Admin navigation')" @close="drawerOpen=false" @click="backdropClick">
      <AdminNavigation mobile :route="route" :color-mode="colorMode" brand-name="Hexo Admin Panel" @navigate="navigate" @close="closeDrawer" @logout="$emit('logout')" @logout-all="$emit('logout-all')" @toggle-theme="$emit('toggle-theme')" />
    </dialog>
  </template>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from '../i18n';
import AppIcon from '../components/AppIcon.vue';
import AdminNavigation from './AdminNavigation.vue';
const props=defineProps({route:{type:String,required:true},colorMode:{type:String,default:'light'}});
const emit=defineEmits(['navigate','logout','logout-all','toggle-theme']);
const {tr}=useI18n();
const media=window.matchMedia?.('(max-width: 760px)');
const isMobile=ref(media?.matches||false);
const drawer=ref(null);
const drawerOpen=ref(false);
const shortcuts=computed(()=>[
  {path:'/dashboard',label:tr('概览','Overview'),icon:'dashboard'},
  {path:'/posts',label:tr('文章','Posts'),icon:'posts'},
  {path:'/publishing',label:tr('发布','Publishing'),icon:'publishing'}
]);
function isActive(path){return props.route===path||(path==='/posts'&&props.route.startsWith('/posts/'));}
function openDrawer(){drawer.value?.showModal();drawerOpen.value=true;}
function closeDrawer(){drawer.value?.close();drawerOpen.value=false;}
function navigate(path){emit('navigate',path);if(path===props.route)closeDrawer();}
function backdropClick(event){if(event.target!==drawer.value)return;const rect=drawer.value.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeDrawer();}
function updateViewport(event){closeDrawer();isMobile.value=event.matches;}
watch(()=>props.route,closeDrawer);
onMounted(()=>media?.addEventListener('change',updateViewport));
onBeforeUnmount(()=>{closeDrawer();media?.removeEventListener('change',updateViewport);});
</script>

<style scoped>
.workspace-sidebar{position:fixed;inset:0 auto 0 0;z-index:100;width:var(--sidebar);border-right:1px solid var(--line)}
.mobile-navigation{position:fixed;z-index:100;inset:auto 0 0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;padding:7px 12px max(7px,env(safe-area-inset-bottom));background:var(--surface);border-top:1px solid var(--line);box-shadow:0 -4px 18px #271e2608}
.mobile-navigation a,.mobile-navigation button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:48px;padding:4px 2px;border:0;border-radius:8px;background:transparent;color:var(--muted);font-size:10px;font-weight:550}
.mobile-navigation .active{color:var(--jade);background:var(--jade-soft)}
.mobile-navigation .app-icon{width:19px;height:19px}
.navigation-drawer{position:fixed;inset:0 auto 0 0;margin:0;padding:0;width:min(320px,calc(100vw - 40px));max-width:none;height:100dvh;max-height:none;border:0;border-right:1px solid var(--line);background:var(--surface);color:var(--text);box-shadow:16px 0 60px #18101933}
.navigation-drawer::backdrop{background:#1b121b66;backdrop-filter:blur(3px)}
.navigation-drawer[open]{animation:drawer-in .2s ease-out}
@keyframes drawer-in{from{transform:translateX(-20px);opacity:.5}to{transform:translateX(0);opacity:1}}
@media(prefers-reduced-motion:reduce){.navigation-drawer[open]{animation:none}}
</style>

<style>
body:has(.navigation-drawer[open]){overflow:hidden}
@media(max-width:760px){.app{padding-bottom:calc(76px + env(safe-area-inset-bottom))}}
</style>
