<template>
  <ToastStack :items="toasts" />
  <ConfirmDialog :dialog="confirmDialog" @cancel="confirmDialog.show=false" @confirm="runConfirmation" />
  <button v-if="!authenticated||mustChangePassword" class="auth-theme-toggle" :aria-label="colorMode==='dark'?'切换亮色模式':'切换暗色模式'" @click="toggleColorMode"><AppIcon :name="colorMode==='dark'?'sun':'moon'"/></button>
  <button v-else class="mobile-theme-toggle" :aria-label="colorMode==='dark'?'切换亮色模式':'切换暗色模式'" @click="toggleColorMode"><AppIcon :name="colorMode==='dark'?'sun':'moon'"/></button>
  <PasswordChangePage v-if="mustChangePassword" :form="passwordForm" :loading="passwordLoading" @submit="changePassword" />
  <LoginPage v-else-if="!authenticated" :form="loginForm" :loading="loginLoading" @submit="login" />
  <div v-else class="app">
    <AdminHeader :route="route" :color-mode="colorMode" @navigate="go" @logout="logout" @toggle-theme="toggleColorMode" />
    <main class="main">
      <header class="page-topbar">
        <div><span class="page-kicker">{{ pageMeta.kicker }}</span><h1>{{ pageMeta.title }}</h1></div>
        <div class="topbar-context"><span class="context-dot"></span>{{ pageMeta.context }}</div>
      </header>
      <Transition name="page" mode="out-in">
      <div :key="route" class="page-view">
      <DashboardPage v-if="route==='/dashboard'" :stats="stats" :recent-posts="recentPosts" :command-loading="commandLoading" @command="runCommand" @edit="editPost" @create="go('/posts/new')" />
      <PostsPage v-else-if="route==='/posts'" :posts="posts" :loading="postsLoading" :search="postSearch" :status="postStatus" :page="postPage" :total="postTotal" :total-pages="postTotalPages" :page-range="paginationRange" @update:search="postSearch=$event" @update:status="postStatus=$event" @update:page="postPage=$event" @search="debouncedPosts" @reload="loadPosts" @create="go('/posts/new')" @edit="editPost" @publish="togglePublish" @remove="deletePost" />
      <NewPostPage v-else-if="route==='/posts/new'" :title="newPostTitle" @update:title="newPostTitle=$event" @create="createPost" @cancel="go('/posts')" />
      <PostEditorPage v-else-if="route.startsWith('/posts/edit/')" :post-id="route.split('/')[3]" @cancel="go('/posts')" @saved="go('/posts')" @notify="toast" />
      <EssaysPage v-else-if="route==='/essays'" @notify="toast" @request-confirm="confirmAction" />
      <AboutPage v-else-if="route==='/about'" @notify="toast" />
      <MediaPage v-else-if="route==='/media'" :files="filteredMedia" :loading="mediaLoading" :search="mediaSearch" :page="mediaPage" :total-pages="mediaTotalPages" @update:search="mediaSearch=$event" @update:page="mediaPage=$event" @reload="loadMedia" @upload="uploadMedia" @copy="copyUrl" @rename="renameMedia" @remove="deleteMedia" />
      <TrashPage v-else-if="route==='/trash'" :items="trashItems" :loading="trashLoading" @reload="loadTrash" @restore="restoreTrash" @remove="removeTrash" />
      <ConfigPage v-else-if="route==='/config'" @notify="toast" @request-confirm="confirmAction" @saved-restart="restartAfterConfig" />
      <ThemesPage v-else-if="route==='/themes'" :themes="themes" :loading="themesLoading" />
      </div>
      </Transition>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { api, assetUrl } from './api/client';
import AdminHeader from './layouts/AdminHeader.vue';
import AppIcon from './components/AppIcon.vue';
import ConfirmDialog from './components/ConfirmDialog.vue';
import ToastStack from './components/ToastStack.vue';
import ConfigPage from './pages/ConfigPage.vue';
import DashboardPage from './pages/DashboardPage.vue';
import EssaysPage from './pages/EssaysPage.vue';
import AboutPage from './pages/AboutPage.vue';
import LoginPage from './pages/LoginPage.vue';
import MediaPage from './pages/MediaPage.vue';
import NewPostPage from './pages/NewPostPage.vue';
import PasswordChangePage from './pages/PasswordChangePage.vue';
import PostEditorPage from './pages/PostEditorPage.vue';
import PostsPage from './pages/PostsPage.vue';
import ThemesPage from './pages/ThemesPage.vue';
import TrashPage from './pages/TrashPage.vue';
import { useToast } from './composables/useToast';

const {toasts,toast}=useToast();
const preferredMode=localStorage.getItem('hexo_admin_color_mode')||(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
const colorMode=ref(preferredMode);
document.documentElement.dataset.theme=colorMode.value;
const route=ref('/dashboard');
const authenticated=ref(false);const mustChangePassword=ref(false);
const loginForm=reactive({username:'',password:''});const loginLoading=ref(false);
const passwordForm=reactive({currentPassword:'',newPassword:'',confirmPassword:''});const passwordLoading=ref(false);
const confirmDialog=reactive({show:false,title:'',message:'',onOk:null});
const stats=ref({});const recentPosts=ref([]);const commandLoading=ref(false);
const posts=ref([]);const postSearch=ref('');const postStatus=ref('all');const postPage=ref(1);const postTotal=ref(0);const postTotalPages=ref(0);const postsLoading=ref(false);const newPostTitle=ref('');
const mediaFiles=ref([]);const mediaSearch=ref('');const mediaPage=ref(1);const mediaTotalPages=ref(0);const mediaLoading=ref(false);
const trashItems=ref([]);const trashLoading=ref(false);
const themes=ref([]);const themesLoading=ref(false);
let searchTimer;

const pageMeta=computed(()=>{
  if(route.value==='/dashboard')return{title:'工作概览',kicker:'Overview',context:'今天也适合写点什么'};
  if(route.value==='/posts/new')return{title:'创建文章',kicker:'New post',context:'从一个好标题开始'};
  if(route.value.startsWith('/posts/edit/'))return{title:'编辑文章',kicker:'Editor',context:'更改保存在 Markdown 源文件'};
  const pages={
    '/posts':{title:'文章管理',kicker:'Content',context:`共 ${postTotal.value} 篇内容`},
    '/essays':{title:'随笔管理',kicker:'Notes',context:'收录日常片段与灵感'},
    '/about':{title:'关于页面',kicker:'About',context:'编辑访客认识你的第一封信'},
    '/media':{title:'媒体资源',kicker:'Library',context:'管理站点图片与附件'},
    '/trash':{title:'回收站',kicker:'Recovery',context:'可恢复最近删除的内容'},
    '/config':{title:'站点配置',kicker:'Settings',context:'谨慎修改并保留备份'},
    '/themes':{title:'主题外观',kicker:'Appearance',context:'查看当前主题状态'}
  };return pages[route.value]||pages['/posts'];
});

function go(path){location.hash='#'+path;}
function confirmAction(title,message,onOk){Object.assign(confirmDialog,{show:true,title,message,onOk});}
function runConfirmation(){const action=confirmDialog.onOk;confirmDialog.show=false;confirmDialog.onOk=null;if(action)action();}
async function verify(){if(!api.token)return;try{const data=await api.get('/auth/verify');authenticated.value=true;mustChangePassword.value=data.mustChangePassword===true;}catch(_){authenticated.value=false;}}
async function login(){if(!loginForm.username||!loginForm.password){toast('请输入用户名和密码','error');return;}loginLoading.value=true;try{const data=await api.post('/auth/login',{username:loginForm.username,password:loginForm.password});api.token=data.token;localStorage.setItem('hexo_admin_token',data.token);authenticated.value=true;mustChangePassword.value=data.mustChangePassword===true;if(mustChangePassword.value){passwordForm.currentPassword=loginForm.password;toast('首次登录，请设置新密码','info');}else{toast('登录成功','success');handleRoute();}}catch(error){toast(error.message,'error');}finally{loginLoading.value=false;}}
async function changePassword(){if(passwordForm.newPassword!==passwordForm.confirmPassword){toast('两次输入的新密码不一致','error');return;}passwordLoading.value=true;try{const data=await api.post('/auth/change-password',{currentPassword:passwordForm.currentPassword,newPassword:passwordForm.newPassword});api.token=data.token;localStorage.setItem('hexo_admin_token',data.token);mustChangePassword.value=false;Object.assign(passwordForm,{currentPassword:'',newPassword:'',confirmPassword:''});toast('密码已更新','success');handleRoute();}catch(error){toast(error.message,'error');}finally{passwordLoading.value=false;}}
function logout(){api.logout();authenticated.value=false;mustChangePassword.value=false;toast('已退出登录','info');}
function toggleColorMode(){colorMode.value=colorMode.value==='dark'?'light':'dark';document.documentElement.dataset.theme=colorMode.value;localStorage.setItem('hexo_admin_color_mode',colorMode.value);}

async function loadDashboard(){try{stats.value=await api.get('/stats');recentPosts.value=(await api.get('/posts?page=1&per_page=5&status=published')).posts||[];}catch(error){toast(error.message,'error');}}
function runCommand(command){if(command==='rebuild-restart'){confirmAction('重新构建并重启','将先清理和生成站点，然后重启当前 Hexo 服务。管理页会短暂断开。',()=>executeCommand(command));return;}executeCommand(command);}
async function executeCommand(command){commandLoading.value=command;try{const data=await api.post('/commands/'+command);toast(data.message,'success');if(command==='rebuild-restart')await waitForRestart();}catch(error){toast(error.message,'error');commandLoading.value=false;}}
function restartAfterConfig(){toast('配置已保存，正在重新构建并重启 Hexo…','info');executeCommand('rebuild-restart');}
async function waitForRestart(){await new Promise(resolve=>setTimeout(resolve,1800));for(let attempt=0;attempt<40;attempt+=1){try{await api.get('/auth/verify');location.reload();return;}catch(_){await new Promise(resolve=>setTimeout(resolve,500));}}toast('服务尚未恢复，请查看 .hexo-admin/restart.log','error');commandLoading.value=false;}
async function loadPosts(){postsLoading.value=true;try{const query=new URLSearchParams({page:String(postPage.value),per_page:'15',status:postStatus.value});if(postSearch.value)query.set('search',postSearch.value);const data=await api.get('/posts?'+query);posts.value=data.posts||[];postTotal.value=data.total;postTotalPages.value=data.total_pages;}catch(error){toast(error.message,'error');}finally{postsLoading.value=false;}}
function debouncedPosts(){clearTimeout(searchTimer);searchTimer=setTimeout(()=>{postPage.value=1;loadPosts();},300);}
async function createPost(){if(!newPostTitle.value.trim()){toast('请输入文章标题','error');return;}try{const data=await api.post('/posts',{title:newPostTitle.value.trim()});newPostTitle.value='';toast('文章已创建','success');const all=await api.get('/posts?per_page=100');const created=all.posts.find(post=>post.source===(data.source||data.path));go(created?'/posts/edit/'+created._id:'/posts');}catch(error){toast(error.message,'error');}}
function editPost(id){go('/posts/edit/'+id);}
async function togglePublish(post){try{const data=await api.put('/posts/'+post._id+'/publish',{published:!post.published,revision:post.revision});post.published=!post.published;post.revision=data.revision;toast(post.published?'文章已发布':'文章已转为草稿','success');}catch(error){toast(error.message,'error');}}
function deletePost(post){confirmAction('删除文章','确定要删除「'+post.title+'」吗？文件会移入插件回收站。',async()=>{try{await api.del('/posts/'+post._id,post.revision);toast('文章已移入回收站','success');loadPosts();}catch(error){toast(error.message,'error');}});}
const paginationRange=computed(()=>{const total=postTotalPages.value,current=postPage.value;if(total<=7)return Array.from({length:total},(_,index)=>index+1);const result=[1];if(current>3)result.push('...');for(let page=Math.max(2,current-1);page<=Math.min(total-1,current+1);page++)result.push(page);if(current<total-2)result.push('...');result.push(total);return result;});

const filteredMedia=computed(()=>{const query=mediaSearch.value.toLowerCase();return query?mediaFiles.value.filter(file=>file.name.toLowerCase().includes(query)):mediaFiles.value;});
async function loadMedia(){mediaLoading.value=true;try{const query=new URLSearchParams({page:String(mediaPage.value),per_page:'24'});const data=await api.get('/media?'+query);mediaFiles.value=data.files||[];mediaTotalPages.value=data.total_pages;}catch(error){toast(error.message,'error');}finally{mediaLoading.value=false;}}
async function uploadMedia(event){for(const file of event.target.files||[]){const form=new FormData();form.append('file',file);try{await api.upload('/media/upload',form);toast(file.name+' 上传成功','success');}catch(error){toast(error.message,'error');}}event.target.value='';loadMedia();}
function copyUrl(file){navigator.clipboard.writeText(window.location.origin+assetUrl(file.path)).then(()=>toast('链接已复制','success'));}
async function renameMedia(file,name){try{const data=await api.put('/media/'+encodeURIComponent(file.name)+'/rename',{name});toast('资源已重命名为 '+data.name,'success');loadMedia();}catch(error){toast(error.message,'error');}}
function deleteMedia(file){confirmAction('删除文件','确定要删除「'+file.name+'」吗？',async()=>{try{await api.del('/media/'+encodeURIComponent(file.name));toast('文件已移入回收站','success');loadMedia();}catch(error){toast(error.message,'error');}});}

async function loadTrash(){trashLoading.value=true;try{trashItems.value=(await api.get('/trash')).items||[];}catch(error){toast(error.message,'error');}finally{trashLoading.value=false;}}
async function restoreTrash(item){try{await api.post('/trash/'+encodeURIComponent(item.id)+'/restore');toast('已恢复 '+item.name,'success');loadTrash();}catch(error){toast(error.message,'error');}}
function removeTrash(item){confirmAction('永久删除','永久删除「'+item.name+'」后无法恢复。',async()=>{try{await api.del('/trash/'+encodeURIComponent(item.id));toast('已永久删除','success');loadTrash();}catch(error){toast(error.message,'error');}});}
async function loadThemes(){themesLoading.value=true;try{themes.value=(await api.get('/themes')).themes||[];}catch(error){toast(error.message,'error');}finally{themesLoading.value=false;}}
function handleRoute(){route.value=location.hash.slice(1)||'/dashboard';if(!authenticated.value||mustChangePassword.value)return;if(route.value==='/dashboard')loadDashboard();else if(route.value==='/posts'){postPage.value=1;loadPosts();}else if(route.value==='/posts/new')newPostTitle.value='';else if(route.value==='/media'){mediaPage.value=1;loadMedia();}else if(route.value==='/trash')loadTrash();else if(route.value==='/themes')loadThemes();}
onMounted(async()=>{await verify();window.addEventListener('hashchange',handleRoute);handleRoute();});
onBeforeUnmount(()=>{window.removeEventListener('hashchange',handleRoute);clearTimeout(searchTimer);});
</script>
