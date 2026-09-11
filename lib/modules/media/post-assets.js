'use strict';
const path = require('path');
const { resolveInside } = require('../../shared/paths');
const { contentRevision, requireRevision } = require('../../shared/revision');
const { sanitizeUploadName, validateUpload } = require('./file-policy');
const { success } = require('../../server/response');
const { readBody, readJson } = require('../../server/request');
const {validate}=require('../../server/validation');
const { parseMultipart } = require('../../server/multipart');
const { badRequest, conflict } = require('../../server/errors');
const { refreshSavedContent } = require('../../shared/saved-refresh');

function postAssetRoutes(context) {
  const files=context.repositories.files;
  function locate(id) { const post=context.services.posts.assetInfo(id);return {...post,directory:post.filePath.slice(0,-path.extname(post.filePath).length)}; }
  function list(id) {
    const post=locate(id);const items=[];
    function walk(dir,prefix='') {
      if(!files.exists(dir))return;
      for(const entry of files.list(dir,{withFileTypes:true})) {
        const target=path.join(dir,entry.name);const name=prefix+entry.name;
        if(entry.isDirectory())walk(target,name+'/');
        else if(entry.isFile())items.push({name,size:files.stat(target).size,revision:contentRevision(files.readBuffer(target)),source:path.relative(context.hexo.base_dir,target).replace(/\\/g,'/'),tag:'{% asset_img "'+name.replace(/"/g,'%22')+'" %}'});
      }
    }
    walk(post.directory);
    return {enabled:post.enabled,items,source:post.source,scope:'本文章资源目录。asset_img 使用文章相对路径；真实主题预览用于确认渲染结果。'};
  }
  function renamePlan(id,name,next) {
    const post=locate(id);const from=resolveInside(post.directory,name);
    next=sanitizeUploadName(next);
    const to=resolveInside(post.directory,path.posix.join(path.posix.dirname(name),next));
    if(path.extname(from).toLowerCase()!==path.extname(to).toLowerCase())throw badRequest('重命名不能改变扩展名');
    if(from!==to&&files.exists(to))throw conflict('资源名称已存在','MEDIA_NAME_CONFLICT');
    const nextName=path.relative(post.directory,to).replace(/\\/g,'/');
    const pattern=/(\{%\s*asset_(?:img|link|path)\s+)(?:"([^"]+)"|'([^']+)'|([^\s%]+))|(!?\[[^\]]*\]\(\s*<?)([^>\s)]+)|((?:src|href)=["'])([^"']+)/g;
    let count=0;
    const raw=post.raw.replace(pattern,(match,tag,double,single,plain,markdown,url,html,attribute)=>{
      const value=double||single||plain||url||attribute;
      let decoded;try{decoded=decodeURIComponent(value.split(/[?#]/)[0]).replace(/^\.\//,'');}catch(_){return match;}
      if(decoded!==name)return match;
      count++;const encoded=nextName.split('/').map(encodeURIComponent).join('/')+(value.match(/[?#].*$/)?.[0]||'');
      if(tag)return tag+(double?'"'+encoded+'"':single?"'"+encoded+"'":encoded);
      return (markdown||html)+encoded;
    });
    return {post,from,to,name,nextName,raw,count,revision:contentRevision(Buffer.concat([files.readBuffer(from),Buffer.from(post.raw),Buffer.from(nextName)]))};
  }
  return [
    { method:'GET',path:'/native',handler({res}) {success(res,{timeZone:context.hexo.config.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone,postAssetFolder:!!context.hexo.config.post_asset_folder,root:context.hexo.config.root||'/'});} },
    { method:'GET',path:'/posts/:id/assets',handler({res,params}) {success(res,list(params.id));} },
    {method:'POST',path:'/posts/:id/assets/:name/rename-preview',async handler({req,res,params}){
      const body=validate(await readJson(req),{name:{type:'string',required:true,maxLength:255}});const plan=renamePlan(params.id,params.name,body.name);
      success(res,{name:plan.nextName,revision:plan.revision,before:plan.post.raw,after:plan.raw,count:plan.count,scope:'同步本文章中的 asset_img / asset_link / asset_path、Markdown 和 HTML 相对资源引用；跨文章及动态引用需自行核对'});
    }},
    {method:'PUT',path:'/posts/:id/assets/:name/rename',async handler({req,res,params}){
      const body=validate(await readJson(req),{name:{type:'string',required:true,maxLength:255},revision:{type:'string',required:true}});
      const result=await context.operations.run(async()=>{
        const plan=renamePlan(params.id,params.name,body.name);if(body.revision!==plan.revision)throw conflict('文章或资源已变化，请重新预览','MEDIA_RENAME_CONFLICT');
        if(plan.from===plan.to)return {renamed:false};
        files.move(plan.from,plan.to);
        try{files.writeText(plan.post.filePath,plan.raw);await context.hexo.source.process();}
        catch(error){
          if(files.readText(plan.post.filePath)!==plan.raw&&files.readText(plan.post.filePath)!==plan.post.raw)throw conflict('重命名期间文章被外部修改，请在恢复中心核对原资源和文章','MEDIA_ROLLBACK_INCOMPLETE');
          files.move(plan.to,plan.from);files.writeText(plan.post.filePath,plan.post.raw);throw error;
        }
        return {renamed:true,name:plan.nextName,revision:contentRevision(plan.raw),updatedReferences:plan.count};
      });success(res,result);
    }},
    { method:'POST',path:'/posts/:id/assets',async handler({req,res,params}) {
      const post=locate(params.id);if(!post.enabled)throw badRequest('请先启用 post_asset_folder');
      const boundary=String(req.headers['content-type']||'').match(/boundary=(?:"([^"]+)"|([^;]+))/i);if(!boundary)throw badRequest('上传格式无效');
      const policy=context.config.uploads||{max_file_size:10*1024*1024,allowed_extensions:['.jpg','.jpeg','.png','.gif','.webp','.pdf']};
      const uploads=parseMultipart(await readBody(req,{limit:policy.max_request_size||50*1024*1024}),boundary[1]||boundary[2]).files;
      if(!uploads.length||uploads.length>(policy.max_files||10))throw badRequest('上传文件数量无效');
      const prepared=uploads.map(file=>{validateUpload(file,policy);const name=sanitizeUploadName(file.filename);return {file,name,target:resolveInside(post.directory,name)};});
      if(new Set(prepared.map(item=>item.name)).size!==prepared.length||prepared.some(item=>files.exists(item.target)))throw conflict('资源名称重复','MEDIA_NAME_CONFLICT');
      files.mkdir(post.directory);const created=[];
      try { for(const item of prepared){files.writeBuffer(item.target,item.file.buffer);created.push(item.target);} }
      catch(error){for(const target of created)files.remove(target);throw error;}
      success(res,{...await refreshSavedContent(context),...list(params.id)});
    } },
    { method:'GET',path:'/posts/:id/assets/:name/delete-preview',handler({res,params}) {
      const post=locate(params.id);const target=resolveInside(post.directory,params.name);const raw=post.raw;
      const references=raw.split(/\r?\n/).flatMap((text,index)=>text.includes(params.name)?[{source:post.source,line:index+1,text}]:[]);
      success(res,{name:params.name,references,revision:contentRevision(Buffer.concat([files.readBuffer(target),Buffer.from(raw)])),scope:'此文章内按资源文件名匹配，可能包含普通文本；其他文章和动态主题引用不在范围内'});
    } },
    { method:'DELETE',path:'/posts/:id/assets/:name',async handler({req,res,params}) {
      const post=locate(params.id);const target=resolveInside(post.directory,params.name);
      requireRevision(req.headers['if-match'],Buffer.concat([files.readBuffer(target),Buffer.from(post.raw)]));
      success(res,await context.services.trash.move('post-asset',target,{source:post.source,name:params.name}));
    } }
  ];
}
module.exports={postAssetRoutes};
