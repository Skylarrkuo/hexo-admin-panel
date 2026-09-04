<template>
  <section class="new-post-shell">
    <div class="new-post-copy"><span>NEW CONTENT</span><h2>{{ tr('从模板开始，','Start from a scaffold,') }}<br>{{ tr('把流程也一起定下来。','and choose the workflow.') }}</h2><p>{{ tr('Hexo scaffolds 会提供正文和 Front Matter 初始值；状态决定内容进入草稿、审核、计划或发布流程。','Hexo scaffolds provide the initial body and Front Matter; workflow controls whether content is drafted, reviewed, scheduled, or published.') }}</p></div>
    <div class="card new-post-card">
      <div class="card-title">{{ tr('新建文章','Create post') }}</div>
      <div class="form-group"><label>{{ tr('文章标题','Post title') }}</label><input v-model="form.title" :placeholder="tr('例如：用 Hexo 建立一套可靠的写作流程','Example: Build a reliable writing workflow with Hexo')" autofocus @keyup.enter="submit"></div>
      <div class="form-row"><div class="form-group"><label>{{ tr('Hexo Scaffold','Hexo scaffold') }}</label><select v-model="form.scaffold"><option value="">{{tr('空白内容','Blank content')}}</option><option v-for="item in scaffolds" :key="item.name" :value="item.name">{{item.name}} · {{item.layout}}</option></select></div><div class="form-group"><label>{{tr('工作流状态','Workflow status')}}</label><select v-model="form.workflowStatus"><option value="draft">{{tr('草稿','Draft')}}</option><option value="in_progress">{{tr('未完成','In progress')}}</option><option value="review">{{tr('待审核','In review')}}</option><option value="scheduled">{{tr('计划中','Scheduled')}}</option><option value="published">{{tr('立即发布','Publish now')}}</option></select></div></div>
      <div v-if="form.workflowStatus==='scheduled'" class="form-row"><div class="form-group"><label>{{tr('计划发布时间','Publish at')}}</label><input v-model="form.publishAt" type="datetime-local"></div><div class="form-group"><label>{{tr('失败重试','Failure retry')}}</label><div class="retry-fields"><input v-model.number="form.maxAttempts" type="number" min="1" max="10"><span>×</span><input v-model.number="form.retryDelayMinutes" type="number" min="1" max="1440"><span>{{tr('分钟','min')}}</span></div></div></div>
      <div v-if="selectedScaffold" class="scaffold-summary"><strong>{{selectedScaffold.name}}</strong><span>{{selectedScaffold.excerpt||tr('该模板没有预置正文','This scaffold has no preset body')}}</span></div>
      <div class="btn-group" style="justify-content:flex-end;margin-top:16px"><button class="btn btn-outline" @click="$emit('cancel')">{{ tr('返回内容库','Back to posts') }}</button><button class="btn btn-primary" :disabled="!canSubmit" @click="submit">{{ tr('创建并开始写作','Create and start writing') }} →</button></div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { api } from '../api/client';
import { useI18n } from '../i18n';
const {tr,errorMessage}=useI18n();const emit=defineEmits(['create','cancel','notify']);
const scaffolds=ref([]);const form=reactive({title:'',scaffold:'post',workflowStatus:'draft',publishAt:'',maxAttempts:3,retryDelayMinutes:5});
const selectedScaffold=computed(()=>scaffolds.value.find(item=>item.name===form.scaffold));const canSubmit=computed(()=>form.title.trim()&&(form.workflowStatus!=='scheduled'||form.publishAt));
function localDate(value){const pad=n=>String(n).padStart(2,'0');return value.getFullYear()+'-'+pad(value.getMonth()+1)+'-'+pad(value.getDate())+'T'+pad(value.getHours())+':'+pad(value.getMinutes());}
function submit(){if(canSubmit.value)emit('create',{...form,title:form.title.trim(),publishAt:form.publishAt?new Date(form.publishAt).toISOString():''});}
onMounted(async()=>{form.publishAt=localDate(new Date(Date.now()+3600000));try{scaffolds.value=(await api.get('/scaffolds')).items||[];if(!scaffolds.value.some(item=>item.name==='post'))form.scaffold=scaffolds.value[0]?.name||'';}catch(error){emit('notify',errorMessage(error),'error');}});
</script>
