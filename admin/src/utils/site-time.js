export function siteInput(value, timeZone = 'UTC') {
  if (!value) return '';
  const text=String(value);
  if(/^\d{4}-\d\d-\d\d[ T]\d\d:\d\d(?::\d\d)?$/.test(text))return text.replace(' ','T').slice(0,16);
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value));
  const values=Object.fromEntries(parts.map(item=>[item.type,item.value]));
  return values.year+'-'+values.month+'-'+values.day+'T'+values.hour+':'+values.minute;
}

export function siteInputToIso(value, timeZone = 'UTC') {
  if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value))throw new Error('日期格式无效');
  const target=Date.parse(value+':00Z'); const candidates=new Set();
  for(const shift of [-86400000,0,86400000]) {
    const instant=target+shift;
    const rendered=Date.parse(siteInput(instant,timeZone)+':00Z');
    const candidate=target-(rendered-instant);
    if(siteInput(candidate,timeZone)===value)candidates.add(candidate);
  }
  if(candidates.size!==1)throw new Error(candidates.size?'此时间处于夏令时回拨的重复时段，请选择明确的时间':'此时间在站点时区不存在，请检查夏令时与日期');
  return new Date([...candidates][0]).toISOString();
}
