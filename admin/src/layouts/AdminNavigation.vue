<template>
  <div class="nav-workspace">
    <header class="nav-brand">
      <img :src="logoUrl" alt="">
      <div><strong>{{ brandName }}</strong><span>{{ tr('内容工作台','Publishing workspace') }}</span></div>
      <button v-if="mobile" class="nav-icon-button nav-close" :aria-label="tr('关闭导航','Close navigation')" @click="$emit('close')"><AppIcon name="close" /></button>
    </header>
    <nav class="nav-scroll" :aria-label="tr('后台导航','Admin navigation')">
      <a class="nav-item nav-overview" href="#/dashboard" :class="{active: route==='/dashboard'}" :aria-current="route==='/dashboard'?'page':undefined" @click.prevent="$emit('navigate','/dashboard')"><AppIcon name="dashboard"/><span>{{ tr('工作概览','Dashboard') }}</span></a>
      <section v-for="group in groups" :key="group.id" class="nav-group" :aria-labelledby="'nav-'+group.id">
        <h2 :id="'nav-'+group.id">{{ group.label }}</h2>
        <a v-for="item in group.items" :key="item.path" class="nav-item" :href="'#'+item.path" :class="{active:isActive(item.path)}" :aria-current="isActive(item.path)?'page':undefined" @click.prevent="$emit('navigate',item.path)"><AppIcon :name="item.icon"/><span>{{ item.label }}</span><span v-if="isActive(item.path)" class="nav-active-mark" aria-hidden="true"></span></a>
      </section>
    </nav>
    <footer class="nav-footer">
      <div class="nav-tools">
        <button class="nav-language" :aria-label="tr('切换为英文','Switch to Chinese')" @click="toggleLocale"><span :class="{selected:locale==='zh-CN'}">中</span><span :class="{selected:locale==='en'}">EN</span></button>
        <div class="nav-tool-links">
          <button class="nav-icon-button" :title="themeLabel" :aria-label="themeLabel" @click="$emit('toggle-theme')"><AppIcon :name="colorMode==='dark'?'sun':'moon'"/></button>
          <a class="nav-icon-button" :href="assetUrl('')" target="_blank" rel="noopener noreferrer" :title="tr('查看站点','View site')" :aria-label="tr('查看站点','View site')"><AppIcon name="external"/></a>
        </div>
      </div>
      <details ref="accountMenu" class="nav-account" @keydown.esc.stop.prevent="closeAccount(true)">
        <summary :class="{active:route==='/password'}"><span class="nav-account-icon"><AppIcon name="lock"/></span><span>{{ tr('账户与安全','Account & security') }}</span><AppIcon name="chevron-down"/></summary>
        <div class="nav-account-menu">
          <a href="#/password" :aria-current="route==='/password'?'page':undefined" @click.prevent="accountAction('navigate','/password')"><AppIcon name="lock"/>{{ tr('修改密码','Change password') }}</a>
          <div class="nav-menu-divider"></div>
          <button @click="accountAction('logout')"><AppIcon name="logout"/>{{ tr('退出登录','Sign out') }}</button>
          <button @click="accountAction('logout-all')"><AppIcon name="logout"/>{{ tr('退出所有会话','Sign out of all sessions') }}</button>
        </div>
      </details>
    </footer>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { assetUrl } from '../api/client';
import { useI18n } from '../i18n';
import AppIcon from '../components/AppIcon.vue';
import logoUrl from '../../../assets/hexo-admin-panel-logo.svg';
const props=defineProps({route:{type:String,required:true},colorMode:{type:String,default:'light'},brandName:{type:String,required:true},mobile:Boolean});
const emit=defineEmits(['navigate','logout','logout-all','toggle-theme','close']);
const {tr,locale,toggleLocale}=useI18n();
const accountMenu=ref(null);
const themeLabel=computed(()=>props.colorMode==='dark'?tr('切换亮色模式','Switch to light mode'):tr('切换暗色模式','Switch to dark mode'));
const groups=computed(()=>[
  {id:'content',label:tr('内容管理','Content'),items:[
    {path:'/posts',label:tr('文章管理','Posts'),icon:'posts'},
    {path:'/pages',label:tr('页面管理','Pages'),icon:'about'},
    {path:'/essays',label:tr('随笔管理','Essays'),icon:'essays'},
    {path:'/media',label:tr('媒体资源','Media'),icon:'media'},
    {path:'/taxonomies',label:tr('分类标签','Taxonomies'),icon:'taxonomy'}
  ]},
  {id:'operations',label:tr('发布与维护','Publishing & maintenance'),items:[
    {path:'/publishing',label:tr('发布中心','Publishing'),icon:'publishing'},
    {path:'/recovery',label:tr('恢复中心','Recovery'),icon:'history'},
    {path:'/trash',label:tr('回收站','Trash'),icon:'trash'}
  ]},
  {id:'site',label:tr('站点设置','Site settings'),items:[
    {path:'/config',label:tr('站点配置','Settings'),icon:'config'},
    {path:'/themes',label:tr('主题外观','Themes'),icon:'themes'},
    {path:'/plugin',label:tr('关于插件','About plugin'),icon:'plugin'}
  ]}
]);
function isActive(path){return props.route===path||(path==='/posts'&&props.route.startsWith('/posts/'))||(path==='/pages'&&props.route.startsWith('/pages/'));}
function closeAccount(focus=false){if(!accountMenu.value)return;accountMenu.value.open=false;if(focus)accountMenu.value.querySelector('summary')?.focus();}
function accountAction(event,path){closeAccount();emit(event,...(path?[path]:[]));}
function outsideClick(event){if(!accountMenu.value?.contains(event.target))closeAccount();}
function outsideFocus(event){if(!accountMenu.value?.contains(event.target))closeAccount();}
onMounted(()=>{document.addEventListener('pointerdown',outsideClick);document.addEventListener('focusin',outsideFocus);});
onBeforeUnmount(()=>{document.removeEventListener('pointerdown',outsideClick);document.removeEventListener('focusin',outsideFocus);});
</script>

<style scoped>
.nav-workspace{--nav-bg:#eeebeb;--nav-text:#625961;--nav-strong:#3f3540;--nav-muted:#8a7b86;--nav-line:#dbd4d9;--nav-hover:#e5dfe3;--nav-active:#e5d5dc;--nav-accent:#814f63;--nav-popup:#fdfafb;display:flex;flex-direction:column;height:100%;min-height:0;background:var(--nav-bg);color:var(--nav-text)}
:root[data-theme="dark"] .nav-workspace{--nav-bg:#252126;--nav-text:#bcb0bb;--nav-strong:#f1e8f0;--nav-muted:#9b8b98;--nav-line:#40353f;--nav-hover:#342b34;--nav-active:#48303f;--nav-accent:#e4b1c7;--nav-popup:#302832}
.nav-brand{display:flex;align-items:center;gap:10px;flex-shrink:0;padding:25px 21px 22px}
.nav-brand>img{width:32px;height:36px;flex-shrink:0}
.nav-brand strong{display:block;color:var(--nav-strong);font-size:13px;font-weight:750;letter-spacing:-.25px;white-space:nowrap}
.nav-brand div>span{display:block;margin-top:3px;color:var(--nav-muted);font-size:10px;letter-spacing:.08em}
.nav-scroll{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:0 14px 18px;scrollbar-width:thin;scrollbar-color:var(--nav-line) transparent}
.nav-group{margin-top:17px}
.nav-group h2{padding:0 12px;margin-bottom:7px;color:var(--nav-muted);font-size:10px;line-height:16px;font-weight:650;letter-spacing:.09em}
.nav-item{position:relative;display:flex;align-items:center;gap:12px;min-height:38px;padding:8px 12px;margin:2px 0;border-radius:7px;color:var(--nav-text);font-size:12px;font-weight:500;line-height:20px;transition:background .16s,color .16s}
.nav-item .app-icon{width:17px;height:17px;opacity:.8}
.nav-item:hover{background:var(--nav-hover);color:var(--nav-strong)}
.nav-item.active{background:var(--nav-active);color:var(--nav-accent);font-weight:700}
.nav-item.active .app-icon{opacity:1}
.nav-item.active:before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:3px;background:var(--nav-accent);border-radius:0 3px 3px 0}
.nav-active-mark{width:5px;height:5px;margin-left:auto;border-radius:50%;background:var(--nav-accent);opacity:.7}
.nav-overview{margin-top:0}
.nav-footer{flex-shrink:0;position:relative;margin:0 17px;padding:12px 0 14px;border-top:1px solid var(--nav-line)}
.nav-tools,.nav-tool-links{display:flex;align-items:center;justify-content:space-between;gap:5px}
.nav-tools{padding:0 3px 9px}
.nav-icon-button{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border:0;border-radius:6px;background:transparent;color:var(--nav-text)}
.nav-icon-button:hover{background:var(--nav-hover);color:var(--nav-strong)}
.nav-icon-button .app-icon{width:16px;height:16px}
.nav-language{display:flex;gap:2px;padding:3px;border:1px solid var(--nav-line);border-radius:7px;background:transparent;color:var(--nav-muted)}
.nav-language span{display:grid;place-items:center;min-width:27px;height:22px;font-size:10px;font-weight:650;border-radius:4px}
.nav-language .selected{background:var(--nav-popup);color:var(--nav-strong);box-shadow:0 1px 3px #0000000a}
.nav-account{position:relative}
.nav-account summary{display:flex;align-items:center;gap:9px;padding:7px 8px;min-height:40px;border-radius:7px;list-style:none;cursor:pointer;font-size:12px;font-weight:600;color:var(--nav-strong)}
.nav-account summary::-webkit-details-marker{display:none}
.nav-account summary>.app-icon{margin-left:auto;width:14px;height:14px;transition:transform .18s}
.nav-account[open] summary>.app-icon{transform:rotate(180deg)}
.nav-account summary:hover,.nav-account[open] summary,.nav-account summary.active{background:var(--nav-hover)}
.nav-account-icon{display:grid;place-items:center;width:28px;height:28px;border:1px solid var(--nav-line);border-radius:8px;color:var(--nav-accent)}
.nav-account-icon .app-icon{width:14px;height:14px}
.nav-account-menu{position:absolute;z-index:3;left:0;right:0;bottom:calc(100% + 8px);padding:6px;border:1px solid var(--nav-line);border-radius:10px;background:var(--nav-popup);box-shadow:0 8px 30px #20102020}
.nav-account-menu a,.nav-account-menu button{display:flex;align-items:center;gap:10px;width:100%;min-height:38px;padding:8px 10px;border:0;border-radius:5px;background:transparent;color:var(--nav-text);text-align:left;font-size:12px}
.nav-account-menu a:hover,.nav-account-menu button:hover{background:var(--nav-hover);color:var(--nav-strong)}
.nav-account-menu .app-icon{width:15px;height:15px}
.nav-menu-divider{height:1px;margin:5px 6px;background:var(--nav-line)}
.nav-workspace :focus-visible{outline:2px solid var(--nav-accent);outline-offset:2px}
.nav-close{margin-left:auto;flex-shrink:0}
@media(max-width:760px){.nav-brand{padding:20px}.nav-item{min-height:44px;font-size:13px}.nav-group{margin-top:20px}.nav-footer{padding-bottom:max(15px,env(safe-area-inset-bottom))}.nav-brand strong{font-size:14px}}
@media(min-width:761px) and (max-height:800px){.nav-brand{padding-top:20px;padding-bottom:18px}.nav-group{margin-top:12px}.nav-group h2{margin-bottom:5px}.nav-item{min-height:36px;padding-top:7px;padding-bottom:7px}.nav-scroll{padding-bottom:12px}}
@media(prefers-reduced-motion:reduce){.nav-workspace *{transition:none!important}}
</style>
