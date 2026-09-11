'use strict';
const YAML = require('yaml');
const { isDeepStrictEqual } = require('util');
const { badRequest } = require('../../server/errors');

function mapping(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date); }
function patchDocument(raw, previous, next, unset = []) {
  const doc=YAML.parseDocument(raw || '{}\n');
  if(doc.errors.length)throw badRequest(doc.errors[0].message,'CONFIG_YAML_INVALID');
  function update(before,after,keys=[]) {
    if(isDeepStrictEqual(before,after))return;
    if(mapping(before)&&mapping(after)) {
      for(const key of new Set([...Object.keys(before),...Object.keys(after)])) {
        if(['__proto__','prototype','constructor'].includes(key))throw badRequest('配置字段名称无效');
        if(!Object.hasOwn(after,key))doc.deleteIn([...keys,key]);else update(before[key],after[key],[...keys,key]);
      }
    } else if(keys.length)doc.setIn(keys,after);
    else doc.contents=doc.createNode(after);
  }
  update(previous,next);
  for(const field of unset) {
    if(typeof field!=='string'||!field||field.split('.').some(key=>['__proto__','prototype','constructor'].includes(key)))throw badRequest('覆盖字段路径无效');
    doc.deleteIn(field.split('.'));
  }
  return String(doc);
}

function validateConfig(data,type,schema) {
  if(!mapping(data))throw badRequest('配置必须是 YAML 映射','CONFIG_TYPE_INVALID');
  const invalid=[];
  if(type==='site') {
    for(const field of ['title','url','root','source_dir','public_dir','new_post_name','theme','timezone'])if(data[field]!==undefined&&typeof data[field]!=='string')invalid.push(field+' 必须是字符串');
    for(const field of ['per_page','index_generator.per_page']) {
      const value=field.split('.').reduce((obj,key)=>obj?.[key],data);
      if(value!==undefined&&(!Number.isInteger(value)||value<0))invalid.push(field+' 必须是非负整数');
    }
    if(data.post_asset_folder===true&&typeof data.new_post_name==='string'&&!data.new_post_name.endsWith('.md'))invalid.push('post_asset_folder 开启时，new_post_name 需以 .md 结尾');
    if(data.post_asset_folder!==undefined&&typeof data.post_asset_folder!=='boolean')invalid.push('post_asset_folder 必须是布尔值');
    if(typeof data.url==='string'&&data.url) {try{if(!['http:','https:'].includes(new URL(data.url).protocol))throw new Error();}catch(_){invalid.push('url 必须是 HTTP(S) URL');}}
    if(typeof data.root==='string'&&(!data.root.startsWith('/')||!data.root.endsWith('/')))invalid.push('root 必须以 / 开始和结束');
    if(data.timezone)try{new Intl.DateTimeFormat('en',{timeZone:data.timezone});}catch(_){invalid.push('timezone 不是有效的 IANA 时区');}
  }
  for(const field of schema?.fields||[]) {
    const keys=Array.isArray(field.path)?field.path:String(field.path||field.key||'').split('.');
    const value=keys.reduce((obj,key)=>obj?.[key],data);
    if(value===undefined)continue;
    if((['string','number','boolean'].includes(field.type)&&typeof value!==field.type)||(field.type==='array'&&!Array.isArray(value))||(field.type==='object'&&!mapping(value))||(field.type==='number'&&!Number.isFinite(value)))invalid.push(keys.join('.')+' 类型应为 '+field.type);
  }
  if(invalid.length)throw badRequest(invalid.join('；'),'CONFIG_VALIDATION_FAILED');
}
module.exports={patchDocument,validateConfig};
