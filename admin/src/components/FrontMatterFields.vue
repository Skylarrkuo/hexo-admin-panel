<template>
  <div class="front-matter-section mb-16">
    <div class="flex justify-between items-center mb-8">
      <label class="extra-field-label">{{ label }}</label>
      <button class="btn btn-outline btn-sm" type="button" @click="add">＋ {{ tr('添加字段','Add field') }}</button>
    </div>
    <div v-for="(field,index) in fields" :key="index" class="fm-row">
      <input v-model="field.key" class="fm-key" :placeholder="tr('字段名','Field name')" @input="changed">
      <select :value="field.type" class="fm-type" :aria-label="tr('字段类型','Field type')" @change="changeType(field,$event.target.value)">
        <option value="string">string</option><option value="number">number</option><option value="boolean">boolean</option>
        <option value="null">null</option><option value="array">array</option><option value="object">object</option>
      </select>
      <select v-if="field.type==='boolean'" v-model="field.value" class="fm-value" @change="changed"><option :value="true">true</option><option :value="false">false</option></select>
      <textarea v-else-if="field.type==='array'||field.type==='object'" v-model="field.value" class="fm-value" rows="2" spellcheck="false" @input="changed"></textarea>
      <input v-else-if="field.type==='number'" v-model="field.value" class="fm-value" type="number" step="any" @input="changed">
      <input v-else-if="field.type==='null'" class="fm-value" value="null" disabled>
      <input v-else v-model="field.value" class="fm-value" :placeholder="tr('值','Value')" @input="changed">
      <button class="btn btn-danger btn-sm" type="button" :aria-label="tr('删除字段','Delete field')" @click="remove(index)">×</button>
    </div>
    <div v-if="!fields.length" class="text-sm text-muted">{{ tr('当前没有额外字段。','No additional fields.') }}</div>
  </div>
</template>

<script setup>
import { defaultValueForType } from '../utils/front-matter-fields';
import { useI18n } from '../i18n';

const {tr}=useI18n();
const props=defineProps({fields:{type:Array,required:true},label:{type:String,required:true}});
const emit=defineEmits(['change']);
function changed(){emit('change');}
function add(){props.fields.push({key:'',type:'string',value:''});changed();}
function remove(index){props.fields.splice(index,1);changed();}
function changeType(field,type){field.type=type;field.value=defaultValueForType(type,field.value);changed();}
</script>
