<template>
  <form class="essay-editor" @submit.prevent="$emit('save')">
    <div class="essay-editor-heading"><h3>{{ form.id ? tr('编辑随笔','Edit essay') : tr('新建随笔','New essay') }}</h3><span class="management-badge">{{ tr('Markdown · 实时预览','Markdown · Live preview') }}</span></div>
    <div class="form-group essay-date-field"><label for="essay-publish-date">{{ tr('发布时间','Publish date') }} <span>{{ timeZone }}</span></label><input id="essay-publish-date" :value="form.date" type="datetime-local" step="1" required @input="$emit('update:date',$event.target.value)"></div>
    <div class="editor-layout">
      <div class="form-group"><label for="essay-content">{{ tr('随笔内容','Essay content') }}</label><textarea id="essay-content" ref="contentInput" :value="form.content" class="essay-textarea" :placeholder="tr('写下此刻经过心里的事……','Write down what is on your mind…')" required @input="$emit('update:content',$event.target.value)"></textarea></div>
      <div class="essay-preview"><span class="essay-preview-label">{{ tr('预览','Preview') }}</span><div class="preview-pane"><div v-if="form.content.trim()" v-html="preview"></div><p v-else class="essay-preview-empty">{{ tr('文字落下，预览即在这里呈现。','Your words will appear here as you write.') }}</p></div></div>
    </div>
    <footer class="essay-editor-footer"><span class="text-sm text-muted">{{ tr('{count} 字符','{count} characters',{count:form.content.length}) }}</span><div class="btn-group"><button type="button" class="btn btn-outline" :disabled="saving" @click="$emit('cancel')">{{ tr('取消','Cancel') }}</button><button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? tr('保存中…','Saving…') : tr('保存随笔','Save essay') }}</button></div></footer>
  </form>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { renderMarkdown } from '../utils/markdown';
import { useI18n } from '../i18n';
const props=defineProps({form:{type:Object,required:true},timeZone:String,saving:Boolean});
defineEmits(['update:date','update:content','save','cancel']);
const {tr}=useI18n();
const contentInput=ref(null);
const preview=computed(()=>renderMarkdown(props.form.content));
onMounted(()=>contentInput.value?.focus({preventScroll:true}));
</script>
