<template>
  <div class="taxonomy-selector">
    <label>{{ label }}</label>
    <div class="taxonomy-control" @click="focusInput">
      <span v-for="item in selected" :key="item" class="taxonomy-chip">{{ item }}<button type="button" :aria-label="tr('移除 '+item,'Remove '+item)" @click.stop="remove(item)">×</button></span>
      <input ref="input" v-model="query" :placeholder="selected.length?'':placeholder" @focus="open=true" @keydown.enter.prevent="add(query)" @keydown.esc="open=false">
    </div>
    <div v-if="open&&(matches.length||query.trim())" class="taxonomy-options">
      <button v-for="item in matches" :key="item.name" type="button" @mousedown.prevent="add(item.name)"><span>{{ item.name }}</span><small>{{ tr(item.count+' 篇',item.count+' posts') }}</small></button>
      <button v-if="query.trim()&&!exact" type="button" @mousedown.prevent="add(query)"><span>＋ {{ tr('新建','Create') }} “{{ query.trim() }}”</span></button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from '../i18n';
const {tr}=useI18n();
const props=defineProps({modelValue:{type:String,default:''},options:{type:Array,default:()=>[]},label:{type:String,required:true},placeholder:{type:String,default:''}});
const emit=defineEmits(['update:modelValue','change']);
const query=ref(''),open=ref(false),input=ref(null);
const selected=computed(()=>String(props.modelValue||'').split(',').map(value=>value.trim()).filter(Boolean));
const matches=computed(()=>props.options.filter(item=>!selected.value.includes(item.name)&&item.name.toLowerCase().includes(query.value.trim().toLowerCase())).slice(0,12));
const exact=computed(()=>props.options.some(item=>item.name.toLowerCase()===query.value.trim().toLowerCase()));
function update(items){emit('update:modelValue',items.join(', '));emit('change');}
function add(value){const name=String(value||'').trim();if(!name)return;update([...new Set([...selected.value,name])]);query.value='';open.value=false;}
function remove(value){update(selected.value.filter(item=>item!==value));}
function focusInput(){input.value?.focus();open.value=true;}
</script>
