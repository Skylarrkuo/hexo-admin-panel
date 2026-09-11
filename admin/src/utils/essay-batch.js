// A standalone --- separates essays, except inside fenced Markdown code.
export function splitEssays(text) {
  const blocks=[];let lines=[],fence=null;
  function push(){const content=lines.join('\n').trim();if(content)blocks.push(content);lines=[];}
  for(const line of String(text).replace(/\r\n?/g,'\n').split('\n')) {
    const marker=line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if(marker){if(!fence)fence=marker[1];else if(marker[1][0]===fence[0]&&marker[1].length>=fence.length&&!marker[2].trim())fence=null;lines.push(line);continue;}
    if(!fence&&/^\s*---\s*$/.test(line))push();else lines.push(line);
  }
  push();return blocks;
}
