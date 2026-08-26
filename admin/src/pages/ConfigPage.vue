<template>
  <section>
    <div class="toolbar">
      <div class="filter-tabs"><button :class="{active:type==='site'}" @click="switchType('site')" :disabled="loading">站点配置</button><button :class="{active:type==='theme'}" @click="switchType('theme')" :disabled="loading">主题配置</button></div>
      <div class="btn-group"><button class="btn btn-sm" :class="view==='form'?'btn-primary':'btn-outline'" @click="switchView('form')" :disabled="loading">表单编辑</button><button class="btn btn-sm" :class="view==='raw'?'btn-primary':'btn-outline'" @click="switchView('raw')" :disabled="loading">YAML 编辑</button><button class="btn btn-success" @click="save" :disabled="saving">{{saving?'保存中...':'保存配置'}}</button><button class="btn btn-outline" @click="toggleBackups">{{showBackups?'隐藏备份':'备份记录'}}</button></div>
    </div>
    <div v-if="showBackups" class="card mb-16">
      <div class="card-title">配置备份</div><div v-if="backupsLoading" class="loading">加载中...</div><div v-else-if="backups.length===0" class="empty">暂无备份，首次保存配置后会自动创建。</div>
      <div v-else class="table-wrap"><table><thead><tr><th>类型</th><th>时间</th><th>大小</th><th>操作</th></tr></thead><tbody><tr v-for="backup in backups" :key="backup.id"><td>{{backup.type==='theme'?'主题':'站点'}}</td><td>{{new Date(backup.createdAt).toLocaleString()}}</td><td>{{formatSize(backup.size)}}</td><td><button class="btn btn-warning btn-sm" @click="restore(backup)">恢复此版本</button></td></tr></tbody></table></div>
    </div>
    <div v-if="loading" class="loading">加载中...</div>
    <template v-else>
      <div v-if="view==='form'&&type==='site'" class="config-form">
        <div class="card"><div class="card-title">基本信息</div><div class="form-row"><div class="form-group"><label>站点标题</label><input v-model="site.title"></div><div class="form-group"><label>副标题</label><input v-model="site.subtitle"></div></div><div class="form-row"><div class="form-group"><label>作者</label><input v-model="site.author"></div><div class="form-group"><label>语言</label><select v-model="site.language"><option value="zh-CN">简体中文</option><option value="en">English</option><option value="ja">日本語</option><option value="ko">한국어</option></select></div></div><div class="form-group"><label>站点 URL</label><input v-model="site.url"></div><div class="form-group"><label>站点描述</label><textarea v-model="site.description" rows="2"></textarea></div></div>
        <div class="card"><div class="card-title">目录设置</div><div class="form-row"><div class="form-group"><label>源目录</label><input v-model="site.source_dir"></div><div class="form-group"><label>公共目录</label><input v-model="site.public_dir"></div></div><div class="form-row"><div class="form-group"><label>标签目录</label><input v-model="site.tag_dir"></div><div class="form-group"><label>归档目录</label><input v-model="site.archive_dir"></div></div></div>
        <div class="card"><div class="card-title">写作设置</div><div class="form-row"><div class="form-group"><label>新文章文件名</label><input v-model="site.new_post_name"></div><div class="form-group"><label>默认布局</label><select v-model="site.default_layout"><option value="post">post</option><option value="page">page</option><option value="draft">draft</option></select></div></div><div class="form-row"><div class="form-group"><label>日期格式</label><input v-model="site.date_format"></div><div class="form-group"><label>时间格式</label><input v-model="site.time_format"></div></div></div>
        <div class="card"><div class="card-title">分页与主题</div><div class="form-row"><div class="form-group"><label>每页文章数</label><input v-model.number="site.per_page" type="number" min="0"></div><div class="form-group"><label>分页目录</label><input v-model="site.pagination_dir"></div></div><div class="form-group"><label>当前主题</label><select v-model="site.theme"><option v-for="theme in themes" :key="theme.name" :value="theme.name">{{theme.name}}</option></select></div></div>
        <div class="card"><div class="card-title">部署</div><div class="form-row"><div class="form-group"><label>部署类型</label><select v-model="deploy.type"><option value="">无</option><option value="git">git</option><option value="rsync">rsync</option><option value="s3">s3</option></select></div><div v-if="deploy.type==='git'" class="form-group"><label>仓库地址</label><input v-model="deploy.repo"></div></div><div v-if="deploy.type==='git'" class="form-group"><label>分支</label><input v-model="deploy.branch"></div></div>
      </div>
      <div v-if="view==='form'&&type==='theme'" class="config-form">
        <div class="card"><div class="card-title">当前主题：{{themeInfo.name||'未检测到'}}</div><div class="text-sm text-muted">适配器：{{themeInfo.adapter||'generic'}} · 版本：{{themeInfo.version||'未知'}}</div><div class="text-sm text-muted">配置来源：{{themeInfo.source||'未知'}} · 保存位置：{{themeInfo.path}}</div></div>
        <ConfigAtlas v-if="schema&&schema.fields&&schema.fields.length" :config="theme" :schema="schema" @validity="valid=$event" />
        <div v-else class="card"><div class="card-title">没有可用的主题 schema</div><button class="btn btn-primary" @click="switchView('raw')">打开 YAML 编辑器</button></div>
      </div>
      <div v-if="view==='raw'" class="config-editor"><textarea v-model="raw"></textarea></div>
    </template>
    <div class="text-sm text-muted mt-16">保存后会自动清理、重新生成并重启 Hexo，管理页短暂断开后将自动恢复。</div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { api } from '../api/client';
import ConfigAtlas from '../components/ConfigAtlas.vue';
const emit=defineEmits(['notify','request-confirm','saved-restart']);
const type=ref('site');const view=ref('form');const loading=ref(false);const saving=ref(false);const raw=ref('');const site=ref({});const theme=ref({});const schema=ref(null);const valid=ref(true);const themes=ref([]);const themeInfo=reactive({name:'',adapter:'',version:'',source:'',path:''});const deploy=reactive({type:'',repo:'',branch:''});const showBackups=ref(false);const backups=ref([]);const backupsLoading=ref(false);
function notify(message,kind='info'){emit('notify',message,kind);}function formatSize(bytes){if(bytes<1024)return bytes+' B';if(bytes<1048576)return(bytes/1024).toFixed(1)+' KB';return(bytes/1048576).toFixed(1)+' MB';}
function current(){if(type.value==='theme')return theme.value;const data={...site.value};if(deploy.type)data.deploy={type:deploy.type,repo:deploy.repo,branch:deploy.branch||'main'};else delete data.deploy;return data;}
function applySite(value){site.value=value||{};const current=site.value.deploy||{};Object.assign(deploy,{type:current.type||'',repo:current.repo||'',branch:current.branch||''});}
function apply(data){raw.value=data.raw||'';if(type.value==='theme'){theme.value=data.parsed||{};schema.value=data.schema||null;Object.assign(themeInfo,{name:data.theme||'',adapter:data.adapter||'',version:data.version||'',source:data.source||'',path:data.writePath||data.path||''});if(!schema.value)view.value='raw';}else applySite(data.parsed);}
async function load(){loading.value=true;try{apply(await api.get('/config?type='+type.value));}catch(error){notify(error.message,'error');}finally{loading.value=false;}}
async function loadThemes(){try{const data=await api.get('/themes');themes.value=data.themes||[];}catch(error){notify(error.message,'error');}}
async function switchType(next){if(next===type.value)return;type.value=next;await load();}
async function switchView(next){if(next===view.value)return;loading.value=true;try{if(next==='raw')raw.value=(await api.post('/config/source/build',{data:current()})).raw;else{const data=await api.post('/config/source/parse',{raw:raw.value});if(type.value==='theme')theme.value=data.parsed||{};else applySite(data.parsed);}view.value=next;}catch(error){notify(error.message,'error');}finally{loading.value=false;}}
async function save(){if(type.value==='theme'&&view.value==='form'&&!valid.value){notify('请先修正 JSON 格式错误','error');return;}saving.value=true;try{const body=view.value==='raw'?{raw:raw.value,type:type.value}:{data:current(),type:type.value};await api.put('/config',body);if(showBackups.value)loadBackups();emit('saved-restart');}catch(error){notify(error.message,'error');}finally{saving.value=false;}}
async function loadBackups(){backupsLoading.value=true;try{const data=await api.get('/config/backups');backups.value=data.items||[];}catch(error){notify(error.message,'error');}finally{backupsLoading.value=false;}}
function toggleBackups(){showBackups.value=!showBackups.value;if(showBackups.value)loadBackups();}
function restore(backup){emit('request-confirm','恢复配置备份','确定恢复此配置版本吗？当前配置也会先自动备份，并在恢复后重启 Hexo。',async()=>{try{await api.post('/config/backups/'+encodeURIComponent(backup.id)+'/restore');await load();loadBackups();emit('saved-restart');}catch(error){notify(error.message,'error');}});}
onMounted(()=>{loadThemes();load();});
</script>
