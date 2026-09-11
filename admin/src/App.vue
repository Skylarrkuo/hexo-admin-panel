<template>
  <ToastStack :items="toasts" />
  <ConfirmDialog :dialog="confirmDialog" @cancel="confirmDialog.show=false" @confirm="runConfirmation" />
  <div v-if="authChecking||!authenticated||mustChangePassword" class="auth-utility-bar">
    <button class="language-toggle" :aria-label="tr('切换为英文','Switch to Chinese')" @click="toggleLocale"><span :class="{active:locale==='zh-CN'}">中文</span><span :class="{active:locale==='en'}">EN</span></button>
    <button class="auth-theme-toggle" :aria-label="colorMode==='dark'?tr('切换亮色模式','Switch to light mode'):tr('切换暗色模式','Switch to dark mode')" @click="toggleColorMode"><AppIcon :name="colorMode==='dark'?'sun':'moon'"/></button>
  </div>
  <div v-else class="mobile-utility-bar">
    <button class="language-toggle" :aria-label="tr('切换为英文','Switch to Chinese')" @click="toggleLocale"><span :class="{active:locale==='zh-CN'}">中</span><span :class="{active:locale==='en'}">EN</span></button>
    <button class="mobile-theme-toggle" :aria-label="colorMode==='dark'?tr('切换亮色模式','Switch to light mode'):tr('切换暗色模式','Switch to dark mode')" @click="toggleColorMode"><AppIcon :name="colorMode==='dark'?'sun':'moon'"/></button>
  </div>
  <div v-if="authChecking" class="auth-pending" role="status" aria-live="polite" aria-busy="true"><div class="loading">{{ tr('正在验证登录状态…','Checking your session…') }}</div></div>
  <PasswordChangePage v-else-if="mustChangePassword" :form="passwordForm" :loading="passwordLoading" @submit="changePassword" />
  <LoginPage v-else-if="!authenticated" :form="loginForm" :loading="loginLoading" @submit="login" />
  <div v-else class="app">
    <AdminHeader :route="route" :color-mode="colorMode" @navigate="go" @logout="logout()" @logout-all="logout(true)" @toggle-theme="toggleColorMode" />
    <main class="main">
      <header class="page-topbar">
        <div><span class="page-kicker">{{ pageMeta.kicker }}</span><h1>{{ pageMeta.title }}</h1></div>
        <div class="topbar-context"><span class="context-dot"></span>{{ pageMeta.context }}</div>
      </header>
      <Transition name="page" mode="out-in">
      <div :key="route" class="page-view">
      <DashboardPage v-if="route==='/dashboard'" :stats="stats" :recent-posts="recentPosts" :command-loading="commandLoading" :command-job="commandJob" @command="runCommand" @edit="editPost" @create="go('/posts/new')" />
      <PostsPage @notify="toast" v-else-if="route==='/posts'" :posts="posts" :loading="postsLoading" :search="postSearch" :status="postStatus" :page="postPage" :total="postTotal" :total-pages="postTotalPages" :page-range="paginationRange" @update:search="postSearch=$event" @update:status="postStatus=$event" @update:page="postPage=$event" @search="debouncedPosts" @reload="loadPosts" @create="go('/posts/new')" @edit="editPost" @publish="togglePublish" @remove="deletePost" @bulk="bulkPosts" @schedule="schedulePost" @cancel-schedule="cancelSchedule" />
      <NewPostPage ref="newPostEditor" @dirty-change="editorDirty=$event" v-else-if="route==='/posts/new'" @create="createPost" @cancel="go('/posts')" @notify="toast" />
      <PostEditorPage @publish="go('/publishing')" v-else-if="route.startsWith('/posts/edit/')" :post-id="route.split('/')[3]" @cancel="go('/posts')" @saved="go('/posts')" @notify="toast" @dirty-change="editorDirty=$event" />
      <EssaysPage @dirty-change="editorDirty=$event" v-else-if="route==='/essays'" @notify="toast" @request-confirm="confirmAction" />
      <AboutPage @dirty-change="editorDirty=$event" v-else-if="route==='/about'" @notify="toast" />
      <PagesPage @dirty-change="editorDirty=$event" v-else-if="route==='/pages'" @edit="editPage" @notify="toast" @request-confirm="confirmAction" />
      <PageEditorPage @publish="go('/publishing')" @dirty-change="editorDirty=$event" v-else-if="route.startsWith('/pages/edit/')" :page-id="route.split('/')[3]" @cancel="go('/pages')" @notify="toast" />
      <PublishingPage v-else-if="route==='/publishing'" @notify="toast" />
      <TaxonomiesPage v-else-if="route==='/taxonomies'" @notify="toast" @request-confirm="confirmAction" />
      <PluginAboutPage v-else-if="route==='/plugin'" />
      <MediaPage v-else-if="route==='/media'" :files="mediaFiles" :loading="mediaLoading" :search="mediaSearch" :usage="mediaUsage" :compressing="mediaCompressing" :page="mediaPage" :total-pages="mediaTotalPages" @update:search="mediaSearch=$event" @update:usage="mediaUsage=$event" @update:page="mediaPage=$event" @search="debouncedMedia" @reload="loadMedia" @upload="uploadMedia" @copy="copyUrl" @rename="renameMedia" @compress="compressMedia" @remove="deleteMedia" />
      <RecoveryPage v-else-if="route==='/recovery'" @notify="toast"/>
      <TrashPage v-else-if="route==='/trash'" :items="trashItems" :loading="trashLoading" @reload="loadTrash" @restore="restoreTrash" @remove="removeTrash" />
      <ConfigPage @dirty-change="editorDirty=$event" v-else-if="route==='/config'" @notify="toast" @request-confirm="confirmAction" @saved-restart="restartAfterConfig" />
      <PasswordChangePage v-else-if="route==='/password'" :initialization="false" :form="passwordForm" :loading="passwordLoading" @submit="changePassword" @cancel="go('/dashboard')" />
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
import PagesPage from './pages/PagesPage.vue';
import PageEditorPage from './pages/PageEditorPage.vue';
import PublishingPage from './pages/PublishingPage.vue';
import TaxonomiesPage from './pages/TaxonomiesPage.vue';
import PluginAboutPage from './pages/PluginAboutPage.vue';
import LoginPage from './pages/LoginPage.vue';
import MediaPage from './pages/MediaPage.vue';
import NewPostPage from './pages/NewPostPage.vue';
import PasswordChangePage from './pages/PasswordChangePage.vue';
import PostEditorPage from './pages/PostEditorPage.vue';
import PostsPage from './pages/PostsPage.vue';
import ThemesPage from './pages/ThemesPage.vue';
import RecoveryPage from './pages/RecoveryPage.vue';
import TrashPage from './pages/TrashPage.vue';
import { useToast } from './composables/useToast';
import { useI18n } from './i18n';

const {toasts,toast}=useToast();
const {locale,tr,toggleLocale,errorMessage}=useI18n();
const preferredMode=localStorage.getItem('hexo_admin_color_mode')||(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
const colorMode=ref(preferredMode);
document.documentElement.dataset.theme=colorMode.value;
const route=ref(location.hash.slice(1)||'/dashboard');
const authChecking=ref(!!api.token);const authenticated=ref(false);const mustChangePassword=ref(false);
const loginForm=reactive({username:'',password:''});const loginLoading=ref(false);
const passwordForm=reactive({currentPassword:'',newPassword:'',confirmPassword:''});const passwordLoading=ref(false);
const confirmDialog=reactive({show:false,title:'',message:'',onOk:null});
const stats=ref({});const recentPosts=ref([]);const commandLoading=ref(false);const commandJob=ref(null);
const posts=ref([]);const postSearch=ref('');const postStatus=ref('all');const postPage=ref(1);const postTotal=ref(0);const postTotalPages=ref(0);const postsLoading=ref(false);
const mediaFiles=ref([]);const mediaSearch=ref('');const mediaUsage=ref('all');const mediaPage=ref(1);const mediaTotalPages=ref(0);const mediaLoading=ref(false);const mediaCompressing=ref('');
const trashItems=ref([]);const trashLoading=ref(false);
const themes=ref([]);const themesLoading=ref(false);
const newPostEditor=ref(null);const editorDirty=ref(false);let postSearchTimer,mediaSearchTimer;

const pageMeta=computed(()=>{
  if(route.value==='/dashboard')return{title:tr('工作概览','Dashboard'),kicker:'Overview',context:tr('今天也适合写点什么','A good day to write something')};
  if(route.value==='/posts/new')return{title:tr('创建文章','Create post'),kicker:'New post',context:tr('从一个好标题开始','Start with a clear title')};
  if(route.value.startsWith('/posts/edit/'))return{title:tr('编辑文章','Edit post'),kicker:'Editor',context:tr('更改保存在 Markdown 源文件','Changes are saved to the Markdown source')};
  if(route.value.startsWith('/pages/edit/'))return{title:tr('编辑页面','Edit page'),kicker:'Page editor',context:tr('使用真实主题构建确认最终效果','Build with the real theme before publishing')};
  const pages={
    '/posts':{title:tr('文章管理','Posts'),kicker:'Content',context:tr(`共 ${postTotal.value} 篇内容`,`${postTotal.value} items`)},
    '/essays':{title:tr('随笔管理','Essays'),kicker:'Notes',context:tr('收录日常片段与灵感','Keep everyday notes and ideas')},
    '/about':{title:tr('关于页面','About page'),kicker:'About',context:tr('编辑访客认识你的第一封信','Shape how visitors get to know you')},
    '/pages':{title:tr('页面管理','Pages'),kicker:'Pages',context:tr('独立页面、模板与主题菜单','Standalone pages, templates, and theme menus')},
    '/publishing':{title:tr('发布中心','Publishing'),kicker:'Operations',context:tr('计划、进度、日志与历史','Schedules, progress, logs, and history')},
    '/taxonomies':{title:tr('分类标签中心','Taxonomies'),kicker:'Structure',context:tr('维护内容分类体系','Maintain your content taxonomy')},
    '/plugin':{title:tr('关于插件','About this plugin'),kicker:'Open source',context:tr('了解设计、许可与项目出处','Design, license, and project provenance')},
    '/media':{title:tr('媒体资源','Media'),kicker:'Library',context:tr('管理站点图片与附件','Manage site images and attachments')},
    '/recovery':{title:tr('恢复中心','Recovery center'),kicker:'Recovery',context:tr('历史、差异与恢复','History, diff, and restore')},
    '/trash':{title:tr('回收站','Trash'),kicker:'Recovery',context:tr('可恢复最近删除的内容','Recover recently deleted content')},
    '/config':{title:tr('站点配置','Settings'),kicker:'Settings',context:tr('谨慎修改并保留备份','Edit carefully and keep backups')},
    '/password':{title:tr('修改密码','Change password'),kicker:'Account',context:tr('管理后台登录密码','Manage your admin password')},
    '/themes':{title:tr('主题外观','Themes'),kicker:'Appearance',context:tr('查看当前主题状态','Review installed and active themes')}
  };return pages[route.value]||pages['/posts'];
});

function confirmEditorLeave(){return !editorDirty.value||window.confirm(tr('编辑器有尚未保存的修改，确定离开吗？本地自动保存仍会保留。','This editor has unsaved changes. Leave anyway? The local autosave will be kept.'));}
function go(path){if(path===route.value)return;if(!confirmEditorLeave())return;editorDirty.value=false;location.hash='#'+path;}
function confirmAction(title,message,onOk,details=[]){Object.assign(confirmDialog,{show:true,title,message,onOk,details});}
function runConfirmation(){const action=confirmDialog.onOk;confirmDialog.show=false;confirmDialog.onOk=null;if(action)action();}
async function verify(){try{if(!api.token)return;const data=await api.get('/auth/verify');authenticated.value=true;mustChangePassword.value=data.mustChangePassword===true;}catch(_){authenticated.value=false;}finally{authChecking.value=false;}}
async function login(){if(!loginForm.username||!loginForm.password){toast(tr('请输入用户名和密码','Enter your username and password'),'error');return;}loginLoading.value=true;try{const data=await api.post('/auth/login',{username:loginForm.username,password:loginForm.password});api.token=data.token;localStorage.setItem('hexo_admin_token',data.token);authenticated.value=true;mustChangePassword.value=data.mustChangePassword===true;if(mustChangePassword.value){passwordForm.currentPassword=loginForm.password;toast(tr('首次登录，请设置新密码','Set a new password for your first sign-in'),'info');}else{toast(tr('登录成功','Signed in'),'success');handleRoute();}}catch(error){toast(errorMessage(error),'error');}finally{loginLoading.value=false;}}
function resetPasswordForm(){Object.assign(passwordForm,{currentPassword:'',newPassword:'',confirmPassword:''});}
async function changePassword(){
  if(passwordLoading.value)return;
  if(!passwordForm.currentPassword){toast(tr('请输入当前密码','Enter your current password'),'error');return;}
  if(passwordForm.newPassword.length<12||passwordForm.newPassword.length>256){toast(tr('新密码需要 12–256 个字符','Use 12–256 characters for the new password'),'error');return;}
  if(passwordForm.newPassword!==passwordForm.confirmPassword){toast(tr('两次输入的新密码不一致','The new passwords do not match'),'error');return;}
  if(passwordForm.newPassword===passwordForm.currentPassword){toast(tr('新密码不能与当前密码相同','The new password must differ from the current password'),'error');return;}
  const sessionToken=api.token;
  passwordLoading.value=true;
  try{
    const data=await api.post('/auth/change-password',{currentPassword:passwordForm.currentPassword,newPassword:passwordForm.newPassword});
    if(!authenticated.value||api.token!==sessionToken)return;
    api.token=data.token;localStorage.setItem('hexo_admin_token',data.token);mustChangePassword.value=false;
    resetPasswordForm();loginForm.password='';
    toast(tr('密码已更新，其他会话需重新登录','Password updated. Other sessions must sign in again'),'success');handleRoute();
  }catch(error){toast(errorMessage(error),'error');}finally{passwordLoading.value=false;}
}
async function logout(all=false){
  if(!confirmEditorLeave())return;
  try{await api.post(all?'/auth/logout-all':'/auth/logout');}
  catch(error){if(error.code!=='UNAUTHORIZED'){toast(tr('退出失败，服务端尚未确认撤销会话，请重试。','Sign-out failed; the server has not confirmed session revocation. Please retry.'),'error');return;}}
  api.logout();authenticated.value=false;mustChangePassword.value=false;editorDirty.value=false;
  Object.assign(loginForm,{password:''});Object.assign(passwordForm,{currentPassword:'',newPassword:'',confirmPassword:''});
  toast(all?tr('已退出所有会话','Signed out of all sessions'):tr('已退出登录','Signed out'),'info');
}
function toggleColorMode(){colorMode.value=colorMode.value==='dark'?'light':'dark';document.documentElement.dataset.theme=colorMode.value;localStorage.setItem('hexo_admin_color_mode',colorMode.value);}

async function loadDashboard(){try{const [summary,recent,jobs]=await Promise.all([api.get('/stats'),api.get('/posts?page=1&per_page=5&status=published'),api.get('/commands/jobs?limit=1')]);stats.value=summary;recentPosts.value=recent.posts||[];if(jobs.items?.length)commandJob.value=jobs.items[0];}catch(error){toast(errorMessage(error),'error');}}
function runCommand(command){if(command==='rebuild-restart'){confirmAction(tr('重新构建并重启','Rebuild and restart'),tr('将先清理和生成站点，然后在当前终端前台重启 Hexo 服务。管理页会短暂断开。','Hexo will clean and generate the site, then restart the service in the current foreground terminal. The panel will disconnect briefly.'),()=>executeCommand(command));return;}executeCommand(command);}
async function executeCommand(command){commandLoading.value=command;try{const data=await api.post('/commands/'+command);commandJob.value=data.job||null;if(command==='rebuild-restart'){toast(locale.value==='en'?tr('命令执行成功','Command completed'):data.message,'success');await waitForRestart(data.previousInstanceId);return;}if(data.job)await waitForCommandJob(data.job.id);else toast(locale.value==='en'?tr('命令执行成功','Command completed'):data.message,'success');}catch(error){toast(errorMessage(error),'error');commandLoading.value=false;}finally{if(command!=='rebuild-restart')commandLoading.value=false;}}
async function waitForCommandJob(id){for(let attempt=0;attempt<240;attempt+=1){let job;try{job=await api.get('/commands/jobs/'+id);}catch(error){if(attempt===239)throw error;await new Promise(resolve=>setTimeout(resolve,500));continue;}commandJob.value=job;if(job.status==='completed'){toast(locale.value==='en'?tr('命令执行成功','Command completed'):(job.result?.message||tr('命令执行成功','Command completed')),'success');return;}if(['failed','cancelled'].includes(job.status)){const error=new Error(job.error||tr('命令执行失败','Command failed'));error.code=job.errorCode||(job.status==='cancelled'?'COMMAND_CANCELLED':'COMMAND_FAILED');throw error;}await new Promise(resolve=>setTimeout(resolve,500));}const error=new Error(tr('命令仍在后台执行，请稍后刷新查看','The command is still running. Refresh later to check it'));error.code='COMMAND_TIMEOUT';throw error;}
function restartAfterConfig(){toast(tr('配置已保存，正在重新构建并重启 Hexo…','Configuration saved. Rebuilding and restarting Hexo…'),'info');executeCommand('rebuild-restart');}
async function waitForRestart(previousInstanceId){await new Promise(resolve=>setTimeout(resolve,800));for(let attempt=0;attempt<120;attempt+=1){try{const status=await api.get('/auth/verify');if(status.instanceId&&status.instanceId!==previousInstanceId){location.reload();return;}}catch(_){}await new Promise(resolve=>setTimeout(resolve,500));}toast(tr('未检测到新的服务实例，请查看 .hexo-admin/restart.log','No new service instance was detected. Check .hexo-admin/restart.log'),'error');commandLoading.value=false;}
async function loadPosts(){postsLoading.value=true;try{const query=new URLSearchParams({page:String(postPage.value),per_page:'15',status:postStatus.value});if(postSearch.value)query.set('search',postSearch.value);const data=await api.get('/posts?'+query);posts.value=data.posts||[];postTotal.value=data.total;postTotalPages.value=data.total_pages;}catch(error){toast(errorMessage(error),'error');}finally{postsLoading.value=false;}}
function debouncedPosts(){clearTimeout(postSearchTimer);postSearchTimer=setTimeout(()=>{postPage.value=1;loadPosts();},300);}
async function createPost(form){if(!form.title?.trim()){toast(tr('请输入文章标题','Enter a post title'),'error');return;}let data;try{data=await api.post('/posts',{title:form.title.trim(),scaffold:form.scaffold||undefined,workflowStatus:form.workflowStatus,published:form.workflowStatus==='published'});}catch(error){toast(errorMessage(error),'error');return;}newPostEditor.value?.saved();if(form.workflowStatus==='scheduled'){try{await api.post('/posts/'+data._id+'/schedule',{publishAt:form.publishAt,revision:data.revision,maxAttempts:form.maxAttempts,retryDelayMinutes:form.retryDelayMinutes});}catch(error){toast(tr('文章已创建，但定时任务保存失败：{message}','The post was created, but its schedule could not be saved: {message}',{message:errorMessage(error)}),'error');go(data._id?'/posts/edit/'+data._id:'/posts');return;}}toast(data.refreshed===false?tr('内容已保存到文件，但 Hexo 刷新失败。请检查服务日志，修复后重建站点；无需重复提交内容。','Content was saved to disk, but Hexo refresh failed. Check the server logs and rebuild after fixing the error; the content does not need to be resubmitted.'):form.workflowStatus==='published'?tr('文章已加入站点源码，部署与线上验证请使用发布中心','Post added to site source. Use Publishing to deploy and verify it online'):form.workflowStatus==='scheduled'?tr('文章已加入发布计划','Post scheduled'):tr('内容已创建','Content created'),data.refreshed===false?'warning':'success');go(data._id?'/posts/edit/'+data._id:'/posts');}
function editPost(id){go('/posts/edit/'+id);}
function editPage(id){go('/pages/edit/'+id);}
async function togglePublish(post){try{const data=await api.put('/posts/'+post._id+'/publish',{published:!post.published,revision:post.revision});post.published=data.published;post.revision=data.revision;if(data._id)post._id=data._id;if(post.published){post.scheduledAt=null;post.scheduleId=null;}toast(post.published?tr('文章已加入站点源码，部署与线上验证请使用发布中心','Post added to site source. Use Publishing to deploy and verify it online'):tr('文章已转为草稿','Post moved to drafts'),'success');}catch(error){toast(errorMessage(error),'error');}}
async function bulkPosts(action,selected){const execute=async()=>{try{await api.post('/posts/bulk',{action,items:selected.map(post=>({id:post._id,revision:post.revision}))});toast(tr('已完成 {count} 篇文章的批量操作','Bulk operation completed for {count} posts',{count:selected.length}),'success');loadPosts();}catch(error){toast(errorMessage(error),'error');}};if(action==='delete'){confirmAction(tr('批量删除文章','Delete posts'),tr('确定删除选中的 {count} 篇文章吗？文件会移入回收站。','Delete the {count} selected posts? They will be moved to trash.',{count:selected.length}),execute);return;}await execute();}
async function schedulePost(post,publishAt){try{await api.post('/posts/'+post._id+'/schedule',{publishAt,revision:post.revision});toast(tr('已设置定时发布','Scheduled publish saved'),'success');loadPosts();}catch(error){toast(errorMessage(error),'error');}}
async function cancelSchedule(post){try{await api.del('/schedules/'+post.scheduleId);toast(tr('已取消定时发布','Scheduled publish cancelled'),'success');loadPosts();}catch(error){toast(errorMessage(error),'error');}}
function deletePost(post){confirmAction(tr('删除文章','Delete post'),tr('确定要删除「{title}」吗？文件会移入插件回收站。','Delete “{title}”? The file will be moved to the plugin trash.',{title:post.title}),async()=>{try{await api.del('/posts/'+post._id,post.revision);toast(tr('文章已移入回收站','Post moved to trash'),'success');loadPosts();}catch(error){toast(errorMessage(error),'error');}});}
const paginationRange=computed(()=>{const total=postTotalPages.value,current=postPage.value;if(total<=7)return Array.from({length:total},(_,index)=>index+1);const result=[1];if(current>3)result.push('...');for(let page=Math.max(2,current-1);page<=Math.min(total-1,current+1);page++)result.push(page);if(current<total-2)result.push('...');result.push(total);return result;});

async function loadMedia(){mediaLoading.value=true;try{const query=new URLSearchParams({page:String(mediaPage.value),per_page:'24',usage:mediaUsage.value});if(mediaSearch.value)query.set('search',mediaSearch.value);const data=await api.get('/media?'+query);mediaFiles.value=data.files||[];mediaTotalPages.value=data.total_pages;}catch(error){toast(errorMessage(error),'error');}finally{mediaLoading.value=false;}}
function debouncedMedia(){clearTimeout(mediaSearchTimer);mediaSearchTimer=setTimeout(()=>{mediaPage.value=1;loadMedia();},300);}
async function uploadMedia(event){for(const file of event.target.files||[]){const form=new FormData();form.append('file',file);try{await api.upload('/media/upload',form);toast(tr('{name} 上传成功','{name} uploaded',{name:file.name}),'success');}catch(error){toast(errorMessage(error),'error');}}event.target.value='';loadMedia();}
function copyUrl(file){navigator.clipboard.writeText(window.location.origin+assetUrl(file.path)).then(()=>toast(tr('链接已复制','Link copied'),'success'));}
async function renameMedia(file,name){
  try{
    const endpoint='/media/'+encodeURIComponent(file.name);
    const plan=await api.post(endpoint+'/rename-preview',{name});
    const details=plan.references.map(item=>({label:item.source,value:tr('{count} 处引用','{count} references',{count:item.count})}));
    confirmAction(tr('重命名并更新引用','Rename and update references'),tr('将「{old}」重命名为「{name}」，同步更新 {count} 个文件中的已识别引用。修改前会创建备份。','Rename “{old}” to “{name}” and update detected references in {count} files. A backup is created first.',{old:file.name,name:plan.name,count:plan.affectedFiles}),async()=>{
      try{const data=await api.put(endpoint+'/rename',{name:plan.name,revision:plan.revision});toast(tr('资源已重命名，已更新 {count} 个引用文件','Media renamed; updated {count} referencing files',{count:data.affectedFiles})+(data.restartRequired?tr('；配置引用需重启 Hexo 后生效','; restart Hexo to apply configuration references'):''),'success');loadMedia();}catch(error){toast(errorMessage(error),'error');}
    },details);
  }catch(error){toast(errorMessage(error),'error');}
}
async function compressMedia(file){mediaCompressing.value=file.name;try{const data=await api.post('/media/'+encodeURIComponent(file.name)+'/compress',{quality:82});toast(data.optimized?tr('压缩完成，节省 {size}','Compressed; saved {size}',{size:formatBytes(data.saved)}):tr('当前文件已足够紧凑','The file is already optimized'),'success');loadMedia();}catch(error){toast(errorMessage(error),'error');}finally{mediaCompressing.value='';}}
function formatBytes(bytes){if(bytes<1024)return bytes+' B';if(bytes<1048576)return(bytes/1024).toFixed(1)+' KB';return(bytes/1048576).toFixed(1)+' MB';}
async function deleteMedia(file){try{const plan=await api.get('/media/'+encodeURIComponent(file.name)+'/delete-preview');confirmAction(tr('删除前检查影响','Review deletion impact'),tr('删除「{name}」后，以下已识别引用将失效。文件会移入回收站。','Deleting “{name}” will break the references below. The file will move to trash.',{name:file.name}),async()=>{try{await api.del('/media/'+encodeURIComponent(file.name),plan.revision);toast(tr('文件已移入回收站','File moved to trash'),'success');loadMedia();}catch(error){toast(errorMessage(error),'error');}},plan.references.map(item=>({label:item.source,value:item.count+' '+tr('处引用','references')})));}catch(error){toast(errorMessage(error),'error');}}

async function loadTrash(){trashLoading.value=true;try{trashItems.value=(await api.get('/trash')).items||[];}catch(error){toast(errorMessage(error),'error');}finally{trashLoading.value=false;}}
async function restoreTrash(item){try{await api.post('/trash/'+encodeURIComponent(item.id)+'/restore');toast(tr('已恢复 {name}','Restored {name}',{name:item.name}),'success');loadTrash();}catch(error){toast(errorMessage(error),'error');}}
function removeTrash(item){confirmAction(tr('永久删除','Delete permanently'),tr('永久删除「{name}」后无法恢复。','“{name}” cannot be recovered after permanent deletion.',{name:item.name}),async()=>{try{await api.del('/trash/'+encodeURIComponent(item.id));toast(tr('已永久删除','Deleted permanently'),'success');loadTrash();}catch(error){toast(errorMessage(error),'error');}});}
async function loadThemes(){themesLoading.value=true;try{themes.value=(await api.get('/themes')).themes||[];}catch(error){toast(errorMessage(error),'error');}finally{themesLoading.value=false;}}
function handleRoute(){const next=location.hash.slice(1)||'/dashboard';if(next!==route.value&&!confirmEditorLeave()){location.hash='#'+route.value;return;}if(next!==route.value){editorDirty.value=false;if(route.value==='/password'&&!mustChangePassword.value)resetPasswordForm();}route.value=next;if(!authenticated.value||mustChangePassword.value)return;if(route.value==='/dashboard')loadDashboard();else if(route.value==='/posts'){postPage.value=1;loadPosts();}else if(route.value==='/media'){mediaPage.value=1;loadMedia();}else if(route.value==='/trash')loadTrash();else if(route.value==='/themes')loadThemes();}
function sessionExpired(){authenticated.value=false;mustChangePassword.value=false;resetPasswordForm();loginForm.password='';}
onMounted(async()=>{window.addEventListener('hexo-auth-expired',sessionExpired);await verify();window.addEventListener('hashchange',handleRoute);handleRoute();});
onBeforeUnmount(()=>{window.removeEventListener('hexo-auth-expired',sessionExpired);window.removeEventListener('hashchange',handleRoute);clearTimeout(postSearchTimer);clearTimeout(mediaSearchTimer);});
</script>
