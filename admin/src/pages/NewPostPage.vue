<template>
  <section class="new-post-shell">
    <div class="new-post-copy"><span>NEW DRAFT</span><h2>{{ tr('先给这篇文章','Give this post') }}<br>{{ tr('一个清晰的名字。','a clear name.') }}</h2><p>{{ tr('创建后会进入完整编辑器，你可以继续添加分类、标签、Front Matter 与正文内容。','After creating it, add categories, tags, Front Matter, and content in the full editor.') }}</p></div>
    <div class="card new-post-card">
      <div class="card-title">{{ tr('文章标题','Post title') }}</div>
      <div class="form-group"><label for="new-post-title">{{ tr('这篇文章讲什么？','What is this post about?') }}</label><input id="new-post-title" :value="title" :placeholder="tr('例如：用 Hexo 建立一套可靠的写作流程','Example: Build a reliable writing workflow with Hexo')" autofocus @input="$emit('update:title',$event.target.value)" @keyup.enter="$emit('create')"></div>
      <div class="btn-group" style="justify-content:flex-end;margin-top:16px"><button class="btn btn-outline" @click="$emit('cancel')">{{ tr('返回内容库','Back to posts') }}</button><button class="btn btn-primary" :disabled="!title.trim()" @click="$emit('create')">{{ tr('创建并开始写作','Create and start writing') }} →</button></div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from '../i18n';
const {tr}=useI18n();
defineProps({ title: { type:String, required:true } });
defineEmits(['update:title','create','cancel']);
</script>
