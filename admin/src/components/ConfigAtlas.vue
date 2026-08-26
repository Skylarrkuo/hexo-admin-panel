<template>
  <div class="config-atlas">
    <aside class="config-atlas-rail" aria-label="配置分区">
      <h3>配置地图</h3>
      <button class="config-section-btn" :class="{active:section==='all'}" @click="section='all'"><span>全部配置</span><span class="count">{{ fields.length }}</span></button>
      <button v-for="item in sections" :key="item.key" class="config-section-btn" :class="{active:section===item.key}" @click="section=item.key"><span>{{ item.label }}</span><span class="count">{{ item.count }}</span></button>
    </aside>
    <div class="config-atlas-main">
      <div class="config-mode-bar">
        <div class="config-atlas-search"><input v-model.trim="search" aria-label="搜索配置" placeholder="搜索路径、分区或当前值"></div>
        <button v-if="search||section!=='all'" class="btn btn-sm btn-outline" @click="resetFilter">清除筛选</button>
      </div>
      <div class="config-note">完整表单会保留值的布尔、数字、字符串、空值及数组类型。表单保存会重新排版 YAML；如需保留原注释，请使用“YAML 编辑”。</div>
      <p class="config-summary">显示 {{ filteredFields.length }} / {{ fields.length }} 项</p>
      <div v-if="filteredFields.length" class="config-field-list"><div v-for="field in filteredFields" :key="field.key" class="config-field">
        <div class="config-field-head"><label class="config-field-label" :for="'theme-field-'+field.domId">{{ field.label }}<span class="config-field-path">{{ field.key }}</span></label><div class="config-field-meta"><span v-if="field.description" class="config-help" tabindex="0" :aria-label="field.description">?<span role="tooltip">{{ field.description }}</span></span><span class="config-type">{{ field.type }}</span></div></div>
        <select v-if="field.type==='boolean'" :id="'theme-field-'+field.domId" :value="field.value" @change="setValue(field,$event.target.value==='true')"><option value="true">启用 / true</option><option value="false">禁用 / false</option></select>
        <input v-else-if="field.type==='number'" :id="'theme-field-'+field.domId" type="number" step="any" :value="field.value" @input="updateNumber(field,$event.target.value)">
        <textarea v-else-if="field.type==='array'||field.type==='object'" :id="'theme-field-'+field.domId" :value="complexDraft(field)" spellcheck="false" @input="updateComplex(field,$event.target.value)"></textarea>
        <div v-else-if="field.color" class="config-color-input"><span class="config-color-swatch" :class="{empty:!validColor(field.value)}" :style="validColor(field.value)?{backgroundColor:String(field.value)}:{}" :title="validColor(field.value)?String(field.value):'请输入有效的 Hex、RGB(A) 或 HSL(A) 颜色'"></span><input :id="'theme-field-'+field.domId" type="text" :value="field.value===null?'':field.value" placeholder="#8b5961 或 rgb(139, 89, 97)" @input="setValue(field,$event.target.value)"></div>
        <input v-else :id="'theme-field-'+field.domId" :type="field.secret?'password':'text'" :value="field.value===null?'':field.value" :placeholder="field.type==='null'?'留空保持 null；输入后转为文本':''" @input="setValue(field,field.type==='null'&&$event.target.value===''?null:$event.target.value)">
        <div v-if="errors[field.key]" class="config-error" role="alert">{{ errors[field.key] }}</div>
      </div></div>
      <div v-else class="card empty">没有匹配的配置项。请更换关键词或清除筛选。</div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { fieldsFromSchema, sectionsFromSchema } from '../utils/config-schema';
const props=defineProps({config:{type:Object,required:true},schema:Object});
const emit=defineEmits(['validity']);
const search=ref('');const section=ref('all');const errors=reactive({});const drafts=reactive({});
const fields=computed(()=>fieldsFromSchema(props.config,props.schema));
const sections=computed(()=>sectionsFromSchema(props.schema,fields.value));
const sectionNames=computed(()=>Object.fromEntries(sections.value.map(item=>[item.key,item.label])));
const filteredFields=computed(()=>{const query=search.value.toLowerCase();return fields.value.filter(field=>{if(section.value!=='all'&&field.section!==section.value)return false;if(!query)return true;let value='';try{value=JSON.stringify(field.value);}catch(_){value=String(field.value);}return(field.key+' '+field.label+' '+(sectionNames.value[field.section]||'')+' '+value).toLowerCase().includes(query);});});
function setValue(field,value){let target=props.config;for(let index=0;index<field.path.length-1;index++)target=target[field.path[index]];target[field.path[field.path.length-1]]=value;delete errors[field.key];}
function updateNumber(field,value){if(value===''){errors[field.key]='数字不能为空';return;}const parsed=Number(value);if(Number.isFinite(parsed))setValue(field,parsed);}
function complexDraft(field){if(!Object.prototype.hasOwnProperty.call(drafts,field.key))drafts[field.key]=JSON.stringify(field.value,null,2);return drafts[field.key];}
function updateComplex(field,value){drafts[field.key]=value;try{const parsed=JSON.parse(value);if(field.type==='array'&&!Array.isArray(parsed))throw new Error('此项必须是 JSON 数组');if(field.type==='object'&&(parsed===null||Array.isArray(parsed)||typeof parsed!=='object'))throw new Error('此项必须是 JSON 对象');setValue(field,parsed);}catch(error){errors[field.key]=error.message||'JSON 格式无效';}}
function resetFilter(){search.value='';section.value='all';}
function validColor(value){return typeof value==='string'&&/^(#[0-9a-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\))$/i.test(value.trim());}
function reset(){Object.keys(errors).forEach(key=>delete errors[key]);Object.keys(drafts).forEach(key=>delete drafts[key]);resetFilter();}
watch(()=>props.config,reset);
watch(errors,value=>emit('validity',Object.keys(value).length===0),{deep:true,immediate:true});
</script>
