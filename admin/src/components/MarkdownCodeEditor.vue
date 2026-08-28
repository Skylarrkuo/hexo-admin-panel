<template>
  <div class="markdown-code-editor">
    <pre ref="highlightLayer" aria-hidden="true"><code v-html="highlighted"></code><br v-if="modelValue.endsWith('\n')"></pre>
    <textarea
      ref="input"
      :value="modelValue"
      :aria-label="editorLabel"
      spellcheck="false"
      @input="onInput"
      @scroll="syncScroll"
      @keydown.tab.prevent="insertTab"
      @paste="$emit('paste',$event)"
    ></textarea>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue';
import { useI18n } from '../i18n';
const {tr}=useI18n();
const props=defineProps({modelValue:{type:String,default:''},label:{type:String,default:''}});
const emit=defineEmits(['update:modelValue','input','paste']);
const input=ref(null);const highlightLayer=ref(null);
function escape(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}
function inline(value){let output='',last=0;const pattern=/(`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|!?\[[^\]\n]*\]\([^\)\n]+\))/g;for(const match of value.matchAll(pattern)){output+=escape(value.slice(last,match.index));const token=match[0];let kind='hljs-emphasis';if(token.startsWith('`'))kind='hljs-code';else if(token.startsWith('**')||token.startsWith('__'))kind='hljs-strong';else if(token.includes(']('))kind='hljs-link';output+='<span class="'+kind+'">'+escape(token)+'</span>';last=match.index+token.length;}return output+escape(value.slice(last));}
function highlightMarkdown(value){let fence=false,frontMatter=false;return String(value||'').split('\n').map((line,index)=>{if(/^\s*```/.test(line)){fence=!fence;return'<span class="hljs-code">'+escape(line)+'</span>';}if(fence)return'<span class="hljs-code">'+escape(line)+'</span>';if(index===0&&line.trim()==='---'){frontMatter=true;return'<span class="hljs-meta">'+escape(line)+'</span>';}if(frontMatter){if(line.trim()==='---')frontMatter=false;const match=line.match(/^(\s*[^:#]+:)(.*)$/);return match?'<span class="hljs-attr">'+escape(match[1])+'</span>'+inline(match[2]):'<span class="hljs-meta">'+escape(line)+'</span>';}const heading=line.match(/^(\s*#{1,6})(\s+.*)$/);if(heading)return'<span class="hljs-section">'+escape(heading[1])+'</span><span class="hljs-title">'+inline(heading[2])+'</span>';const quote=line.match(/^(\s*&gt;|\s*>)(.*)$/);if(quote)return'<span class="hljs-quote">'+escape(quote[1])+'</span>'+inline(quote[2]);const bullet=line.match(/^(\s*(?:[-+*]|\d+\.)\s+)(.*)$/);if(bullet)return'<span class="hljs-bullet">'+escape(bullet[1])+'</span>'+inline(bullet[2]);return inline(line);}).join('\n');}
const highlighted=computed(()=>highlightMarkdown(props.modelValue));
const editorLabel=computed(()=>props.label||tr('Markdown 编辑器','Markdown editor'));
function onInput(event){emit('update:modelValue',event.target.value);emit('input',event);nextTick(syncScroll);}
function syncScroll(){if(!input.value||!highlightLayer.value)return;highlightLayer.value.scrollTop=input.value.scrollTop;highlightLayer.value.scrollLeft=input.value.scrollLeft;}
function insertTab(){const element=input.value;if(!element)return;const start=element.selectionStart,end=element.selectionEnd;const next=(props.modelValue||'').slice(0,start)+'  '+(props.modelValue||'').slice(end);emit('update:modelValue',next);emit('input');nextTick(()=>{element.focus();element.setSelectionRange(start+2,start+2);});}
defineExpose({element:input});
</script>
