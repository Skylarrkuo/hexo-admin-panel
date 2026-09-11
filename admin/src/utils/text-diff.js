export function diffLines(before, after) {
  const a=String(before).split('\n'),b=String(after).split('\n');
  if(a.length*b.length>1000000)return [{type:'remove',text:a.join('\n')},{type:'add',text:b.join('\n')}];
  const table=Array.from({length:a.length+1},()=>new Uint32Array(b.length+1));
  for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)table[i][j]=a[i]===b[j]?table[i+1][j+1]+1:Math.max(table[i+1][j],table[i][j+1]);
  const result=[];let i=0,j=0;
  while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){result.push({type:'same',text:a[i++]});j++;}else if(j<b.length&&(i===a.length||table[i][j+1]>table[i+1][j]))result.push({type:'add',text:b[j++]});else result.push({type:'remove',text:a[i++]});}
  return result;
}

export function mergeThreeWay(base, local, server) {
  if(local===server||server===base)return {text:local,conflicts:false};
  if(local===base)return {text:server,conflicts:false};
  function edits(next) {
    const result=[];let position=0,current=null;
    for(const line of diffLines(base,next)) {
      if(line.type==='same'){if(current){result.push(current);current=null;}position++;continue;}
      if(!current)current={start:position,end:position,lines:[]};
      if(line.type==='remove'){position+=line.text.split('\n').length;current.end=position;}else current.lines.push(...line.text.split('\n'));
    }
    if(current)result.push(current);return result;
  }
  const left=edits(local),right=edits(server),combined=[...left];let overlapping=false;
  for(const change of right){
    if(left.some(other=>JSON.stringify(other)===JSON.stringify(change)))continue;
    if(left.some(other=>change.start<=other.end&&other.start<=change.end))overlapping=true;
    combined.push(change);
  }
  if(!overlapping){const lines=base.split('\n');for(const edit of combined.sort((a,b)=>b.start-a.start))lines.splice(edit.start,edit.end-edit.start,...edit.lines);return {text:lines.join('\n'),conflicts:false};}
  // Preserve all three versions for manual resolution; never silently pick a side.
  return {text:'<<<<<<< 本地修改\n'+local+'\n||||||| 原版本\n'+base+'\n=======\n'+server+'\n>>>>>>> 服务器版本',conflicts:true};
}
