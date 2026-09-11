<template>
  <section class="management-page posts-page">
    <div class="section-heading"><div><h2>{{ tr('内容库','Post library') }}</h2><p>{{ tr('搜索、筛选并维护所有 Markdown 文章。','Search, filter, and maintain every Markdown post.') }}</p></div><span class="text-sm text-muted">{{ tr('{total} 篇文章','{total} posts',{total}) }}</span></div>
    <div class="toolbar management-toolbar">
      <div class="search-box"><input type="search" :aria-label="tr('搜索文章','Search posts')" :value="search" :placeholder="tr('搜索文章...','Search posts...')" @input="$emit('update:search',$event.target.value);$emit('search')"></div>
      <div class="filter-tabs" role="group" :aria-label="tr('按文章状态筛选','Filter by post status')">
        <button v-for="item in statuses" :key="item.value" :class="{active:status===item.value}" :aria-pressed="status===item.value" @click="$emit('update:status',item.value);$emit('reload')">{{ item.label }}</button>
      </div>
      <button class="btn btn-primary" @click="$emit('create')">＋ {{ tr('新建文章','New post') }}</button>
    </div>
    <p class="posts-workflow-note">{{tr('加入站点仅改变 Hexo 内容状态，线上发布请到发布中心完成构建、部署与验证。','Adding a post changes its Hexo source state. Use Publishing to build, deploy, and verify it online.')}}</p>
    <div v-if="selectedPosts.length" class="card bulk-action-bar"><strong>{{ tr('已选择 {count} 篇','{count} selected',{count:selectedPosts.length}) }}</strong><div class="btn-group"><button class="btn btn-success btn-sm" @click="$emit('bulk','publish',selectedPosts)">{{ tr('批量发布','Publish') }}</button><button class="btn btn-warning btn-sm" @click="$emit('bulk','unpublish',selectedPosts)">{{ tr('批量撤回','Unpublish') }}</button><button class="btn btn-danger btn-sm" @click="$emit('bulk','delete',selectedPosts)">{{ tr('批量删除','Delete') }}</button><button class="btn btn-outline btn-sm" @click="selected=[]">{{ tr('取消选择','Clear') }}</button></div></div>
    <div v-if="loading" class="loading">{{ tr('加载中...','Loading...') }}</div>
    <div v-else class="card posts-results">
      <div v-if="posts.length===0" class="empty">{{ tr('暂无文章','No posts found') }}</div>
      <div v-else class="table-wrap posts-table"><table>
        <thead><tr><th class="post-select-cell"><input type="checkbox" :checked="allSelected" :indeterminate="selectedPosts.length>0&&!allSelected" :aria-label="tr('选择当前页','Select page')" @change="togglePage($event.target.checked)"></th><th>{{ tr('文章','Post') }}</th><th>{{ tr('分类与标签','Categories & tags') }}</th><th>{{ tr('状态','Status') }}</th><th>{{ tr('操作','Actions') }}</th></tr></thead>
        <tbody><template v-for="post in posts" :key="post._id"><tr class="post-record" :class="{'is-selected':selected.includes(post._id)}">
          <td class="post-select-cell"><input type="checkbox" :checked="selected.includes(post._id)" :aria-label="tr('选择 {title}','Select {title}',{title:post.title})" @change="toggle(post._id,$event.target.checked)"></td>
          <td class="post-identity"><button class="post-title-link" @click="$emit('edit',post._id)">{{ post.title }}</button><div class="post-meta"><time>{{ formatDate(post.date) }}</time><span>{{tr('{count} 字','{count} words',{count:post.wordCount})}}</span></div></td>
          <td class="post-taxonomies"><div v-if="post.categories?.length" class="post-categories"><span v-for="category in post.categories" :key="category" class="cat-badge">{{ category }}</span></div><div class="post-tags"><span v-for="tag in post.tags" :key="tag" class="tag-badge">{{ tag }}</span></div><span v-if="!post.categories?.length&&!post.tags?.length" class="text-muted">—</span></td>
          <td class="post-state"><span :class="post.published?'status-published':'status-draft'">{{ workflowLabel(post) }}</span><small v-if="post.scheduledAt" class="schedule-time" :title="post.scheduleError||''">{{ formatDateTime(post.scheduledAt) }}</small></td>
          <td class="post-actions-cell"><div class="post-actions"><button class="btn btn-outline btn-sm" @click="$emit('edit',post._id)">{{ tr('编辑','Edit') }}</button>
            <details class="post-more-actions" :open="actionPostId===post._id" @toggle="toggleActions($event,post._id)" @keydown.esc.prevent="closeActions($event)"><summary>{{tr('更多','More')}} <AppIcon name="chevron-down" class="post-more-chevron"/></summary><div class="post-action-menu" @click="actionPostId=''">
              <button type="button" @click="$emit('publish',post)">{{post.published?tr('取消发布','Unpublish'):tr('发布','Publish')}}</button>
              <button v-if="!post.published&&!post.scheduledAt" type="button" @click="openSchedule(post)">{{tr('定时','Schedule')}}</button><button v-if="post.scheduleId" type="button" @click="$emit('cancel-schedule',post)">{{tr('取消定时','Cancel schedule')}}</button>
              <button type="button" class="post-delete-action" @click="$emit('remove',post)">{{tr('删除','Delete')}}</button>
            </div></details>
          </div></td>
        </tr><tr v-if="schedulePostId===post._id" class="post-schedule-row"><td colspan="5"><div class="schedule-editor"><div><label :for="'schedule-'+post._id">{{tr('定时发布时间','Scheduled publish time')}} · {{siteZone}}</label><input :id="'schedule-'+post._id" v-model="scheduleValue" type="datetime-local"></div><div class="btn-group"><button class="btn btn-primary btn-sm" @click="submitSchedule(post)">{{ tr('确认','Confirm') }}</button><button class="btn btn-outline btn-sm" @click="schedulePostId=''">{{ tr('取消','Cancel') }}</button></div></div></td></tr></template></tbody>
      </table></div>
      <div v-if="totalPages>1" class="pagination">
        <button :disabled="page<=1" @click="changePage(page-1)">&lt;</button>
        <template v-for="item in pageRange" :key="item"><button v-if="item==='...'" disabled>...</button><button v-else :class="{active:item===page}" @click="changePage(item)">{{ item }}</button></template>
        <button :disabled="page>=totalPages" @click="changePage(page+1)">&gt;</button><span class="info">{{ tr('共 {total} 篇','{total} total',{total}) }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {siteInput,siteInputToIso} from '../utils/site-time';
import {api} from '../api/client';
import AppIcon from '../components/AppIcon.vue';
import { useI18n } from '../i18n';
const {tr}=useI18n();
const props=defineProps({ posts:Array, loading:Boolean, search:String, status:String, page:Number, total:Number, totalPages:Number, pageRange:Array });
const emit = defineEmits(['update:search','update:status','update:page','search','reload','create','edit','publish','remove','bulk','schedule','cancel-schedule','notify']);
const actionPostId=ref('');
const siteZone=ref('UTC');const selected=ref([]);const schedulePostId=ref('');const scheduleValue=ref('');
const statuses=computed(()=>[{value:'all',label:tr('全部','All')},{value:'published',label:tr('已加入站点','In site source')},{value:'draft',label:tr('全部草稿','All drafts')},{value:'in_progress',label:tr('未完成','In progress')},{value:'review',label:tr('待审核','In review')},{value:'scheduled',label:tr('计划中','Scheduled')}]);
const selectedPosts=computed(()=>props.posts.filter(post=>selected.value.includes(post._id)));const allSelected=computed(()=>props.posts.length>0&&props.posts.every(post=>selected.value.includes(post._id)));
function toggle(id,checked){selected.value=checked?[...new Set([...selected.value,id])]:selected.value.filter(value=>value!==id);}function togglePage(checked){selected.value=checked?props.posts.map(post=>post._id):[];}
function toggleActions(event,id){if(event.target.open)actionPostId.value=id;else if(actionPostId.value===id)actionPostId.value='';}
function closeActions(event){actionPostId.value='';event.currentTarget.querySelector('summary')?.focus();}
function dismissActions(event){if(!event.target.closest('.post-more-actions'))actionPostId.value='';}
onMounted(()=>document.addEventListener('click',dismissActions));
onBeforeUnmount(()=>document.removeEventListener('click',dismissActions));
function localDate(value){return siteInput(value,siteZone.value);}
function openSchedule(post){schedulePostId.value=post._id;scheduleValue.value=localDate(new Date(Date.now()+3600000));}
function submitSchedule(post){if(!scheduleValue.value)return;try{emit('schedule',post,siteInputToIso(scheduleValue.value,siteZone.value));schedulePostId.value='';}catch(error){emit('notify',error.message,'error');}}
function changePage(page){emit('update:page',page);emit('reload');}
function formatDate(value){if(!value)return'-';const date=new Date(value);return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
function formatDateTime(value){return value?new Date(value).toLocaleString(undefined,{timeZone:siteZone.value}):'';}
function workflowLabel(post){if(post.scheduleStatus==='failed')return tr('定时失败','Schedule failed');return({published:tr('已加入站点','In site source'),scheduled:tr('计划中','Scheduled'),in_progress:tr('未完成','In progress'),review:tr('待审核','In review'),draft:tr('草稿','Draft')})[post.workflowStatus]||tr('草稿','Draft');}
watch(()=>props.posts,()=>{selected.value=selected.value.filter(id=>props.posts.some(post=>post._id===id));});
onMounted(async()=>{try{siteZone.value=(await api.get('/native')).timeZone||'UTC';}catch(_){}});
</script>
