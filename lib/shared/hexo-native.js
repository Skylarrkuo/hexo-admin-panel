'use strict';
const { badRequest } = require('../server/errors');
const YAML = require('yaml');
const crypto = require('crypto');
const path = require('path');

function sourceDate(raw, fallback) {
  const line=String(raw).match(/^date:\s*([^\r\n]*)/m);
  if(!line)return fallback;
  try { return YAML.parse(line[0]).date || fallback; } catch (_) { return fallback; }
}

function siteDateParts(value, timeZone) {
  const input = value || new Date();
  if (typeof input === 'string' && /^\d{4}-\d\d-\d\d(?:[ T]\d\d:\d\d(?::\d\d)?)?$/.test(input)) {
    const [year,month,day]=input.slice(0,10).split('-');return {year,month,day};
  }
  try {
    return Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:timeZone||Intl.DateTimeFormat().resolvedOptions().timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(input)).filter(item=>item.type!=='literal').map(item=>[item.type,item.value]));
  } catch (_) { throw badRequest('日期或站点时区无效','POST_DATE_INVALID'); }
}
function siteTimestamp(value,timeZone) {
  if(typeof value!=='string'||!/^\d{4}-\d\d-\d\d(?:[ T]\d\d:\d\d(?::\d\d)?)?$/.test(value))return new Date(value).getTime();
  const normalized=(value.length===10?value+'T00:00:00':value.length===16?value+':00':value).replace(' ','T');
  const target=Date.parse(normalized+'Z'),candidates=new Set();
  if(!Number.isFinite(target)||new Date(target).toISOString().slice(0,19)!==normalized)throw badRequest('文章日期无效','POST_DATE_INVALID');
  const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:timeZone||Intl.DateTimeFormat().resolvedOptions().timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  for(const shift of [-86400000,0,86400000]) {
    const instant=target+shift;const p=Object.fromEntries(formatter.formatToParts(new Date(instant)).map(item=>[item.type,item.value]));
    const rendered=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);const candidate=target-(rendered-instant);
    const check=Object.fromEntries(formatter.formatToParts(new Date(candidate)).map(item=>[item.type,item.value]));
    if(Date.UTC(+check.year,+check.month-1,+check.day,+check.hour,+check.minute,+check.second)===target)candidates.add(candidate);
  }
  if(candidates.size!==1)throw badRequest('日期在站点时区不存在或处于夏令时重复时段','POST_DATE_INVALID');
  return [...candidates][0];
}
function newPostName(config, title, date, fields = {}) {
  date=date||new Date();
  if(config.filename_case===1)title=title.toLowerCase();else if(config.filename_case===2)title=title.toUpperCase();
  if(typeof fields==='string')fields={lang:fields};
  const parts=siteDateParts(date,config.timezone);
  const timestamp=siteTimestamp(date,config.timezone);
  if(!Number.isFinite(timestamp))throw badRequest('文章日期无效','POST_DATE_INVALID');
  const hash=crypto.createHash('sha1').update(title+Math.floor(timestamp/1000)).digest('hex').slice(0,12);
  const values={lang:'default',...(config.permalink_defaults||{}),...fields,title,hash,year:parts.year,month:parts.month,day:parts.day,i_month:String(Number(parts.month)),i_day:String(Number(parts.day))};
  let name=String(config.new_post_name||':title.md').replace(/:([a-z_][a-z0-9_]*)/gi,(_,key)=>{
    if(!['string','number','boolean'].includes(typeof values[key]))throw badRequest('文件名占位符缺少有效值：'+key,'POST_NAME_PATTERN_INVALID');return values[key];
  });
  if(!path.extname(name))name+='.md';
  return name;
}
function sitePath(config, relative) {
  const root='/'+String(config.root||'/').replace(/^\/+|\/+$/g,'')+'/';
  return root.replace(/\/+/g,'/')+String(relative).replace(/^\/+/, '');
}
module.exports={newPostName,siteDateParts,sourceDate,sitePath,siteTimestamp};
