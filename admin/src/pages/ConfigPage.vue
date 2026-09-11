<template>
  <section>
    <LocalDraftNotice :draft="draft"/>
    <div v-if="savePreview" class="card"><h3>{{tr('保存前差异','Review before saving')}}</h3><p>{{savePreview.writePath}}</p><TextDiff :before="savePreview.before" :after="savePreview.after"/><button class="btn btn-primary" :disabled="saving" @click="confirmSave">{{tr('确认保存并重启','Save and restart')}}</button><button class="btn btn-outline" @click="savePreview=null">{{tr('继续编辑','Continue editing')}}</button></div>
    <div class="toolbar">
      <div class="filter-tabs">
        <button :class="{active:type==='site'}" :disabled="loading" @click="switchType('site')">{{ tr('站点配置','Site settings') }}</button>
        <button :class="{active:type==='theme'}" :disabled="loading" @click="switchType('theme')">{{ tr('主题配置','Theme settings') }}</button>
      </div>
      <div class="btn-group">
        <button class="btn btn-sm" :class="view==='form'?'btn-primary':'btn-outline'" :disabled="loading" @click="switchView('form')">{{ tr('表单编辑','Form') }}</button>
        <button class="btn btn-sm" :class="view==='raw'?'btn-primary':'btn-outline'" :disabled="loading" @click="switchView('raw')">{{ tr('YAML 编辑','YAML editor') }}</button>
        <button class="btn btn-success" :disabled="saving" @click="save">{{ saving?tr('保存中...','Saving...'):tr('保存配置','Save settings') }}</button>
        <button class="btn btn-outline" @click="toggleBackups">{{ showBackups?tr('隐藏备份','Hide backups'):tr('备份记录','Backups') }}</button>
      </div>
    </div>

    <div v-if="showBackups" class="card mb-16">
      <div class="card-title">{{ tr('配置备份','Configuration backups') }}</div>
      <div v-if="backupsLoading" class="loading">{{ tr('加载中...','Loading...') }}</div>
      <div v-else-if="backups.length===0" class="empty">{{ tr('暂无备份，首次保存配置后会自动创建。','No backups yet. The first one is created when you save settings.') }}</div>
      <div v-else class="table-wrap">
        <table>
          <thead><tr><th>{{ tr('类型','Type') }}</th><th>{{ tr('时间','Time') }}</th><th>{{ tr('大小','Size') }}</th><th>{{ tr('操作','Actions') }}</th></tr></thead>
          <tbody><tr v-for="backup in backups" :key="backup.id"><td>{{ backup.type==='theme'?tr('主题','Theme'):tr('站点','Site') }}</td><td>{{ formatDate(backup.createdAt) }}</td><td>{{ formatSize(backup.size) }}</td><td><button class="btn btn-warning btn-sm" @click="restore(backup)">{{ tr('恢复此版本','Restore version') }}</button></td></tr></tbody>
        </table>
      </div>
    </div>

    <div v-if="loading" class="loading">{{ tr('加载中...','Loading...') }}</div>
    <template v-else>
      <div v-if="view==='form'&&type==='site'" class="config-form">
        <div class="card">
          <div class="card-title">{{ tr('基本信息','Basic information') }}</div>
          <div class="form-row"><div class="form-group"><label>{{ tr('站点标题','Site title') }}</label><input v-model="site.title"></div><div class="form-group"><label>{{ tr('副标题','Subtitle') }}</label><input v-model="site.subtitle"></div></div>
          <div class="form-row"><div class="form-group"><label>{{ tr('作者','Author') }}</label><input v-model="site.author"></div><div class="form-group"><label>{{ tr('语言','Language') }}</label><select v-model="site.language"><option value="zh-CN">简体中文</option><option value="en">English</option><option value="ja">日本語</option><option value="ko">한국어</option></select></div></div>
          <div class="form-group"><label>{{ tr('站点 URL','Site URL') }}</label><input v-model="site.url"></div>
          <div class="form-group"><label>{{ tr('站点描述','Site description') }}</label><textarea v-model="site.description" rows="2"></textarea></div>
        </div>
        <div class="card">
          <div class="card-title">{{ tr('目录设置','Directories') }}</div>
          <div class="form-row"><div class="form-group"><label>{{ tr('源目录','Source directory') }}</label><input v-model="site.source_dir"></div><div class="form-group"><label>{{ tr('公共目录','Public directory') }}</label><input v-model="site.public_dir"></div></div>
          <div class="form-row"><div class="form-group"><label>{{ tr('标签目录','Tag directory') }}</label><input v-model="site.tag_dir"></div><div class="form-group"><label>{{ tr('归档目录','Archive directory') }}</label><input v-model="site.archive_dir"></div></div>
        </div>
        <div class="card">
          <div class="card-title">{{ tr('写作设置','Writing') }}</div>
          <div class="form-row"><div class="form-group"><label>{{ tr('新文章文件名','New post file name') }}</label><input v-model="site.new_post_name"></div><div class="form-group"><label>{{ tr('默认布局','Default layout') }}</label><select v-model="site.default_layout"><option value="post">post</option><option value="page">page</option><option value="draft">draft</option></select></div></div>
          <div class="form-row"><div class="form-group"><label>{{ tr('日期格式','Date format') }}</label><input v-model="site.date_format"></div><div class="form-group"><label>{{ tr('时间格式','Time format') }}</label><input v-model="site.time_format"></div></div>
        </div>
        <div class="card">
          <div class="card-title">{{ tr('分页与主题','Pagination and theme') }}</div>
          <div class="form-row"><div class="form-group"><label>{{ tr('每页文章数','Posts per page') }}</label><input v-model.number="site.per_page" type="number" min="0"></div><div class="form-group"><label>{{ tr('分页目录','Pagination directory') }}</label><input v-model="site.pagination_dir"></div></div>
          <div class="form-group"><label>{{ tr('当前主题','Active theme') }}</label><select v-model="site.theme"><option v-for="item in themes" :key="item.name" :value="item.name">{{ item.name }}</option></select></div>
        </div>
        <div class="card">
          <div class="card-title">{{ tr('部署','Deployment') }}</div>
          <div class="form-row"><div class="form-group"><label>{{ tr('部署类型','Deployment type') }}</label><select v-model="deploy.type"><option value="">{{ tr('无','None') }}</option><option value="git">git</option><option value="rsync">rsync</option><option value="s3">s3</option></select></div><div v-if="deploy.type==='git'" class="form-group"><label>{{ tr('仓库地址','Repository URL') }}</label><input v-model="deploy.repo"></div></div>
          <div v-if="deploy.type==='git'" class="form-group"><label>{{ tr('分支','Branch') }}</label><input v-model="deploy.branch"></div>
        </div>
      </div>

      <div v-if="view==='form'&&type==='theme'" class="config-form">
        <div class="card">
          <div class="card-title">{{ tr('当前主题：{name}','Active theme: {name}',{name:themeInfo.name||tr('未检测到','Not detected')}) }}</div>
          <div class="text-sm text-muted">{{ tr('适配器','Adapter') }}：{{ themeInfo.adapter||'generic' }} · {{ tr('版本','Version') }}：{{ themeInfo.version||tr('未知','Unknown') }}</div>
          <div class="text-sm text-muted">{{ tr('配置来源','Source') }}：{{ themeInfo.source||tr('未知','Unknown') }} · {{ tr('保存位置','Save path') }}：{{ themeInfo.path }}</div>
        </div>
        <details v-if="overrideRows.length"><summary>{{tr('主题默认值与覆盖值（勾选以恢复默认）','Theme defaults and overrides (select to reset)')}}</summary><div v-for="row in overrideRows" :key="row.path" class="form-group"><label><input v-model="unset" type="checkbox" :value="row.path"> {{row.path}}</label><small>{{tr('默认','Default')}}: {{JSON.stringify(row.defaultValue)}} · {{tr('覆盖','Override')}}: {{JSON.stringify(row.value)}}</small></div></details>
        <ConfigAtlas v-if="schema&&schema.fields&&schema.fields.length" :config="theme" :schema="schema" :field-drafts="fieldDrafts" @field-drafts="fieldDrafts=$event" @validity="valid=$event" />
        <div v-else class="card"><div class="card-title">{{ tr('没有可用的主题 schema','No theme schema available') }}</div><button class="btn btn-primary" @click="switchView('raw')">{{ tr('打开 YAML 编辑器','Open YAML editor') }}</button></div>
      </div>

      <div v-if="view==='raw'" class="config-editor"><textarea v-model="raw" :aria-label="tr('YAML 配置源码','YAML configuration source')"></textarea></div>
    </template>
    <div class="text-sm text-muted mt-16">{{ tr('保存后会自动清理、重新生成并重启 Hexo，管理页短暂断开后将自动恢复。','After saving, Hexo will clean, regenerate, and restart. The panel reconnects automatically after a brief interruption.') }}</div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import LocalDraftNotice from '../components/LocalDraftNotice.vue';
import TextDiff from '../components/TextDiff.vue';
import {useLocalDraft} from '../composables/useLocalDraft';
import { api } from '../api/client';
import ConfigAtlas from '../components/ConfigAtlas.vue';
import { useI18n } from '../i18n';

const {locale,tr,errorMessage}=useI18n();
const emit=defineEmits(['notify','request-confirm','saved-restart','dirty-change']);
const type=ref('site');const view=ref('form');const loading=ref(false);const saving=ref(false);const raw=ref('');const revision=ref('');const site=ref({});const theme=ref({});const schema=ref(null);const valid=ref(true);const themes=ref([]);const themeInfo=reactive({name:'',adapter:'',version:'',source:'',path:''});const deploy=reactive({type:'',repo:'',branch:''});const showBackups=ref(false);const backups=ref([]);const backupsLoading=ref(false);
const fieldDrafts=ref({});
const savePreview=ref(null),defaults=ref({}),overrides=ref({}),unset=ref([]);
const draft=useLocalDraft({key:()=> 'config_'+type.value,state:()=>({raw:raw.value,revision:revision.value,site:site.value,theme:theme.value,deploy:{...deploy},view:view.value,unset:unset.value,fieldDrafts:fieldDrafts.value}),apply:value=>{raw.value=value.raw;revision.value=value.revision;site.value=value.site;theme.value=value.theme;Object.assign(deploy,value.deploy);view.value=value.view;unset.value=value.unset||[];fieldDrafts.value=value.fieldDrafts||{};},emit});
const overrideRows=computed(()=>{const rows=[];function walk(value,keys=[]){for(const [key,item] of Object.entries(value||{})){const path=[...keys,key];if(item&&typeof item==='object'&&!Array.isArray(item))walk(item,path);else rows.push({path:path.join('.'),value:item,defaultValue:path.reduce((obj,k)=>obj?.[k],defaults.value)});}}walk(overrides.value);return rows;});
function notify(message,kind='info'){emit('notify',message,kind);}function formatSize(bytes){if(bytes<1024)return bytes+' B';if(bytes<1048576)return(bytes/1024).toFixed(1)+' KB';return(bytes/1048576).toFixed(1)+' MB';}
function formatDate(value){return value?new Date(value).toLocaleString(locale.value==='en'?'en-US':'zh-CN'):'-';}
function current(){if(type.value==='theme')return theme.value;const data={...site.value};if(deploy.type)data.deploy={type:deploy.type,repo:deploy.repo,branch:deploy.branch||'main'};else delete data.deploy;return data;}
function applySite(value){site.value=value||{};const current=site.value.deploy||{};Object.assign(deploy,{type:current.type||'',repo:current.repo||'',branch:current.branch||''});}
function apply(data){fieldDrafts.value={};defaults.value=data.defaults||{};overrides.value=data.overrides||{};unset.value=[];raw.value=data.raw||'';revision.value=data.revision||'';if(type.value==='theme'){theme.value=data.parsed||{};schema.value=data.schema||null;Object.assign(themeInfo,{name:data.theme||'',adapter:data.adapter||'',version:data.version||'',source:data.source||'',path:data.writePath||data.path||''});if(!schema.value)view.value='raw';}else applySite(data.parsed);}
async function load(){draft.pause();loading.value=true;try{apply(await api.get('/config?type='+type.value));draft.loaded();}catch(error){notify(errorMessage(error),'error');}finally{loading.value=false;}}
async function loadThemes(){try{const data=await api.get('/themes');themes.value=data.themes||[];}catch(error){notify(errorMessage(error),'error');}}
async function switchType(next){if(next===type.value||!draft.leave())return;draft.pause();savePreview.value=null;type.value=next;await load();}
async function switchView(next){if(next===view.value)return;if(view.value==='form'&&!valid.value){notify(tr('请先修正字段格式，未完成的输入已保留在本机','Fix invalid fields first; unfinished input is saved locally'),'error');return;}loading.value=true;try{if(next==='raw')raw.value=(await api.post('/config/preview',{type:type.value,revision:revision.value,data:current(),replace:true,unset:unset.value})).raw;else{const data=await api.post('/config/source/parse',{raw:raw.value});if(type.value==='theme'){fieldDrafts.value={};theme.value=data.parsed||{};}else applySite(data.parsed);}view.value=next;}catch(error){notify(errorMessage(error),'error');}finally{loading.value=false;}}
async function save(){if(type.value==='theme'&&view.value==='form'&&!valid.value){notify(tr('请先修正字段格式','Fix invalid fields first'),'error');return;}saving.value=true;try{const body=view.value==='raw'?{raw:raw.value,type:type.value,revision:revision.value}:{data:current(),type:type.value,revision:revision.value,replace:true,unset:unset.value};const snapshot=draft.snapshot();savePreview.value={...await api.post('/config/preview',body),snapshot};}catch(error){draft.persist();notify(errorMessage(error),'error');}finally{saving.value=false;}}
async function confirmSave(){if(JSON.stringify(draft.snapshot())!==JSON.stringify(savePreview.value.snapshot)){savePreview.value=null;notify(tr('预览后配置又有修改，请重新查看保存差异','Settings changed after the preview. Review the diff again.'),'warning');return;}saving.value=true;try{const accepted=savePreview.value.snapshot;const nextRaw=savePreview.value.after;const data=await api.put('/config',{type:type.value,raw:nextRaw,revision:savePreview.value.revision});const edited=JSON.stringify(draft.snapshot())!==JSON.stringify(accepted);revision.value=data.revision;if(!edited||view.value!=='raw')raw.value=data.raw||nextRaw;accepted.revision=data.revision;accepted.raw=data.raw||nextRaw;savePreview.value=null;draft.saved(accepted);if(showBackups.value)loadBackups();if(draft.dirty.value)notify(tr('配置已保存，后续修改仍保留；请完成编辑后再重启 Hexo','Configuration saved; newer edits remain. Restart Hexo after finishing them.'),'info');else emit('saved-restart');}catch(error){draft.persist();notify(errorMessage(error),'error');}finally{saving.value=false;}}

async function loadBackups(){backupsLoading.value=true;try{const data=await api.get('/config/backups');backups.value=data.items||[];}catch(error){notify(errorMessage(error),'error');}finally{backupsLoading.value=false;}}
function toggleBackups(){showBackups.value=!showBackups.value;if(showBackups.value)loadBackups();}
function restore(backup){emit('request-confirm',tr('恢复配置备份','Restore configuration backup'),tr('确定恢复此配置版本吗？当前配置也会先自动备份，并在恢复后重启 Hexo。','Restore this version? The current configuration will be backed up first, then Hexo will restart.'),async()=>{try{await api.post('/config/backups/'+encodeURIComponent(backup.id)+'/restore',{revision:revision.value});await load();loadBackups();emit('saved-restart');}catch(error){notify(errorMessage(error),'error');}});}
onMounted(()=>{loadThemes();load();});
</script>
