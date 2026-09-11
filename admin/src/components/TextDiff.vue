<template><div class="text-diff" role="region" :aria-label="tr('版本差异','Version diff')"><pre v-for="(line,index) in lines" :key="index" :class="line.type"><span aria-hidden="true">{{line.type==='add'?'+':line.type==='remove'?'-':' '}}</span>{{line.text}}</pre></div></template>
<script setup>
import {computed} from 'vue';
import {diffLines} from '../utils/text-diff';
import {useI18n} from '../i18n';
const {tr}=useI18n();const props=defineProps({before:{type:String,default:''},after:{type:String,default:''}});
const lines=computed(()=>diffLines(props.before,props.after));
</script>
<style scoped>
.text-diff{max-height:400px;overflow:auto;border:1px solid var(--border-color,#8885);border-radius:8px;margin:12px 0}.text-diff pre{margin:0;padding:2px 10px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}.add{background:#27824b22}.remove{background:#c3474722}.text-diff span{display:inline-block;width:20px;user-select:none}
</style>
