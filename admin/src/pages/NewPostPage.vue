<template>
  <section class="new-post-shell">
    <div class="new-post-copy"><span>NEW DRAFT</span><h2>先给这篇文章<br>一个清晰的名字。</h2><p>创建后会进入完整编辑器，你可以继续添加分类、标签、Front Matter 与正文内容。</p></div>
    <div class="card new-post-card">
      <div class="card-title">文章标题</div>
      <div class="form-group"><label for="new-post-title">这篇文章讲什么？</label><input id="new-post-title" :value="title" placeholder="例如：用 Hexo 建立一套可靠的写作流程" autofocus @input="$emit('update:title',$event.target.value)" @keyup.enter="$emit('create')"></div>
      <div class="btn-group" style="justify-content:flex-end;margin-top:16px"><button class="btn btn-outline" @click="$emit('cancel')">返回内容库</button><button class="btn btn-primary" :disabled="!title.trim()" @click="$emit('create')">创建并开始写作 →</button></div>
    </div>
  </section>
</template>

<script setup>
defineProps({ title: { type:String, required:true } });
defineEmits(['update:title','create','cancel']);
</script>
