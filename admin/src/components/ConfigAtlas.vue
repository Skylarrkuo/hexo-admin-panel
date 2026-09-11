<template>
  <div class="config-atlas">
    <aside class="config-atlas-rail" :aria-label="tr('配置分区','Configuration sections')">
      <h3>{{ tr('配置地图','Configuration map') }}</h3>
      <button class="config-section-btn" :class="{active:section==='all'}" @click="section='all'"><span>{{ tr('全部配置','All settings') }}</span><span class="count">{{ fields.length }}</span></button>
      <button v-for="item in sections" :key="item.key" class="config-section-btn" :class="{active:section===item.key}" @click="section=item.key"><span>{{ item.label }}</span><span class="count">{{ item.count }}</span></button>
    </aside>
    <div class="config-atlas-main">
      <div class="config-mode-bar">
        <div class="config-atlas-search"><input v-model.trim="search" :aria-label="tr('搜索配置','Search settings')" :placeholder="tr('搜索路径、分区或当前值','Search path, section, or value')"></div>
        <button v-if="search||section!=='all'" class="btn btn-sm btn-outline" @click="resetFilter">{{ tr('清除筛选','Clear filters') }}</button>
      </div>
      <div class="config-note">{{ tr('完整表单会保留值的布尔、数字、字符串、空值及数组类型。保存前会展示差异，并尽量保留原 YAML 注释。','The form preserves boolean, number, string, null, and array values. Review the diff before saving; existing YAML comments are preserved where possible.') }}</div>
      <p class="config-summary">{{ tr('显示 {shown} / {total} 项','Showing {shown} of {total}',{shown:filteredFields.length,total:fields.length}) }}</p>
      <div v-if="filteredFields.length" class="config-field-list"><div v-for="field in filteredFields" :key="field.key" class="config-field">
        <div class="config-field-head"><label class="config-field-label" :for="'theme-field-'+field.domId">{{ field.label }}<span class="config-field-path">{{ field.key }}</span></label><div class="config-field-meta"><span v-if="field.description" class="config-help" tabindex="0" :aria-label="field.description">?<span role="tooltip">{{ field.description }}</span></span><span class="config-type">{{ field.type }}</span></div></div>
        <select v-if="field.type==='boolean'" :id="'theme-field-'+field.domId" :value="field.value" @change="setValue(field,$event.target.value==='true')"><option value="true">{{ tr('启用','Enabled') }} / true</option><option value="false">{{ tr('禁用','Disabled') }} / false</option></select>
        <input v-else-if="field.type==='number'" :id="'theme-field-'+field.domId" type="number" step="any" :value="drafts[field.key]??field.value" @input="updateNumber(field,$event.target.value)">
        <textarea v-else-if="field.type==='array'||field.type==='object'" :id="'theme-field-'+field.domId" :value="complexDraft(field)" spellcheck="false" @input="updateComplex(field,$event.target.value)"></textarea>
        <div v-else-if="field.color" class="config-color-input"><span class="config-color-swatch" :class="{empty:!validColor(field.value)}" :style="validColor(field.value)?{backgroundColor:String(field.value)}:{}" :title="validColor(field.value)?String(field.value):tr('请输入有效的 Hex、RGB(A) 或 HSL(A) 颜色','Enter a valid Hex, RGB(A), or HSL(A) color')"></span><input :id="'theme-field-'+field.domId" type="text" :value="field.value===null?'':field.value" :placeholder="tr('#8b5961 或 rgb(139, 89, 97)','#8b5961 or rgb(139, 89, 97)')" @input="setValue(field,$event.target.value)"></div>
        <input v-else :id="'theme-field-'+field.domId" :type="field.secret?'password':'text'" :value="field.value===null?'':field.value" :placeholder="field.type==='null'?tr('留空保持 null；输入后转为文本','Leave blank to keep null; typing converts it to text'):''" @input="setValue(field,field.type==='null'&&$event.target.value===''?null:$event.target.value)">
        <div v-if="errors[field.key]" class="config-error" role="alert">{{ errors[field.key] }}</div>
      </div></div>
      <div v-else class="card empty">{{ tr('没有匹配的配置项。请更换关键词或清除筛选。','No settings match. Try another keyword or clear the filters.') }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { fieldsFromSchema, sectionsFromSchema } from '../utils/config-schema';
import { useI18n } from '../i18n';
const {tr,localize}=useI18n();
const props=defineProps({config:{type:Object,required:true},schema:Object,fieldDrafts:{type:Object,default:()=>({})}});
const emit=defineEmits(['validity','field-drafts']);
const search=ref('');const section=ref('all');const errors=reactive({});const drafts=reactive({});
const fields=computed(()=>fieldsFromSchema(props.config,props.schema).map(field=>({...field,label:localize(field.labelI18n,field.label),description:localize(field.descriptionI18n,field.description)})));
const sections=computed(()=>sectionsFromSchema(props.schema,fields.value).map(item=>({...item,label:localize(item.labelI18n,item.label)})));
const sectionNames=computed(()=>Object.fromEntries(sections.value.map(item=>[item.key,item.label])));
const filteredFields=computed(()=>{const query=search.value.toLowerCase();return fields.value.filter(field=>{if(section.value!=='all'&&field.section!==section.value)return false;if(!query)return true;let value='';try{value=JSON.stringify(field.value);}catch(_){value=String(field.value);}return(field.key+' '+field.label+' '+(sectionNames.value[field.section]||'')+' '+value).toLowerCase().includes(query);});});
function setValue(field,value){let target=props.config;for(let index=0;index<field.path.length-1;index++)target=target[field.path[index]];target[field.path[field.path.length-1]]=value;delete errors[field.key];}
function remember(field,value){drafts[field.key]=value;emit('field-drafts',{...drafts});}
function updateNumber(field,value){remember(field,value);if(value===''){errors[field.key]=tr('数字不能为空','A number is required');return;}const parsed=Number(value);if(Number.isFinite(parsed))setValue(field,parsed);}
function complexDraft(field){return drafts[field.key]??JSON.stringify(field.value,null,2);}
function updateComplex(field,value){remember(field,value);try{const parsed=JSON.parse(value);if(field.type==='array'&&!Array.isArray(parsed))throw new Error(tr('此项必须是 JSON 数组','This value must be a JSON array'));if(field.type==='object'&&(parsed===null||Array.isArray(parsed)||typeof parsed!=='object'))throw new Error(tr('此项必须是 JSON 对象','This value must be a JSON object'));setValue(field,parsed);}catch(error){errors[field.key]=error.message||tr('JSON 格式无效','Invalid JSON format');}}
function resetFilter(){search.value='';section.value='all';}
function validColor(value){return typeof value==='string'&&/^(#[0-9a-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\))$/i.test(value.trim());}
function validateDrafts(){
  Object.keys(errors).forEach(key=>delete errors[key]);
  for(const field of fields.value){
    if(!Object.prototype.hasOwnProperty.call(drafts,field.key))continue;
    try{const value=drafts[field.key];if(field.type==='number'){if(value===''||!Number.isFinite(Number(value)))throw new Error(tr('数字无效','Invalid number'));}else{const parsed=JSON.parse(value);if(field.type==='array'&&!Array.isArray(parsed)||field.type==='object'&&(parsed===null||Array.isArray(parsed)||typeof parsed!=='object'))throw new Error(tr('字段类型无效','Invalid field type'));}}
    catch(error){errors[field.key]=error.message;}
  }
}
watch(()=>props.fieldDrafts,value=>{Object.keys(drafts).forEach(key=>delete drafts[key]);Object.assign(drafts,value);validateDrafts();},{immediate:true});
watch(()=>props.config,()=>{resetFilter();validateDrafts();});
watch(errors,value=>emit('validity',Object.keys(value).length===0),{deep:true,immediate:true});
</script>
