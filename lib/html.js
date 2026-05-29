'use strict';

function getHtml(root) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hexo 后台管理</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --primary:#3b82f6;--primary-hover:#2563eb;--primary-light:#eff6ff;
  --success:#10b981;--danger:#ef4444;--warning:#f59e0b;
  --bg:#f1f5f9;--card:#fff;--text:#1e293b;--text-secondary:#64748b;
  --border:#e2e8f0;--shadow:0 1px 3px rgba(0,0,0,.08);
  --radius:8px;--transition:all .2s;
}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;min-height:100vh}
a{color:var(--primary);text-decoration:none}
button{cursor:pointer;font-family:inherit;font-size:inherit}
input,textarea,select{font-family:inherit;font-size:inherit;border:1px solid var(--border);border-radius:var(--radius);padding:8px 12px;outline:none;transition:var(--transition)}
input:focus,textarea:focus,select:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(59,130,246,.15)}
textarea{resize:vertical}

/* Layout */
.app{display:flex;flex-direction:column;min-height:100vh}
.header{background:var(--card);border-bottom:1px solid var(--border);padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:var(--shadow)}
.header h1{font-size:18px;font-weight:700;color:var(--primary)}
.header nav{display:flex;gap:4px;align-items:center}
.header nav a,.header nav button{padding:8px 14px;border-radius:var(--radius);font-size:14px;color:var(--text-secondary);background:none;border:none;transition:var(--transition);white-space:nowrap}
.header nav a:hover,.header nav button:hover{background:var(--primary-light);color:var(--primary)}
.header nav a.active{background:var(--primary);color:#fff}
.header .logout-btn{color:var(--danger);margin-left:8px}
.main{flex:1;padding:24px;max-width:1200px;width:100%;margin:0 auto}
@media(max-width:768px){
  .header{padding:0 12px;height:auto;flex-wrap:wrap;padding-top:8px;padding-bottom:8px}
  .header nav{flex-wrap:wrap;gap:2px}
  .header nav a,.header nav button{padding:6px 10px;font-size:13px}
  .main{padding:12px}
}

/* Cards */
.card{background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);padding:20px;margin-bottom:16px}
.card-title{font-size:16px;font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px}

/* Stats grid */
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px}
.stat-card{background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);padding:20px;text-align:center}
.stat-card .num{font-size:32px;font-weight:700;color:var(--primary)}
.stat-card .label{font-size:13px;color:var(--text-secondary);margin-top:4px}

/* Buttons */
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:var(--radius);font-size:14px;font-weight:500;border:none;transition:var(--transition)}
.btn-primary{background:var(--primary);color:#fff}.btn-primary:hover{background:var(--primary-hover)}
.btn-success{background:var(--success);color:#fff}.btn-success:hover{background:#059669}
.btn-danger{background:var(--danger);color:#fff}.btn-danger:hover{background:#dc2626}
.btn-warning{background:var(--warning);color:#fff}.btn-warning:hover{background:#d97706}
.btn-outline{background:none;border:1px solid var(--border);color:var(--text)}.btn-outline:hover{border-color:var(--primary);color:var(--primary)}
.btn-sm{padding:5px 10px;font-size:13px}
.btn-group{display:flex;gap:8px;flex-wrap:wrap}

/* Table */
.table-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--border);font-size:14px}
th{background:var(--bg);font-weight:600;color:var(--text-secondary);white-space:nowrap}
tr:hover{background:#f8fafc}
.tag-badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:12px;background:var(--primary-light);color:var(--primary);margin:1px 2px}
.cat-badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:12px;background:#f0fdf4;color:var(--success);margin:1px 2px}
.status-published{color:var(--success);font-weight:500}
.status-draft{color:var(--warning);font-weight:500}

/* Pagination */
.pagination{display:flex;justify-content:center;align-items:center;gap:8px;margin-top:16px}
.pagination button{min-width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:1px solid var(--border);background:var(--card);border-radius:var(--radius);font-size:14px}
.pagination button.active{background:var(--primary);color:#fff;border-color:var(--primary)}
.pagination button:disabled{opacity:.5;cursor:not-allowed}
.pagination .info{font-size:13px;color:var(--text-secondary)}

/* Toolbar */
.toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap}
.search-box{flex:1;min-width:200px;max-width:400px}
.search-box input{width:100%}
.filter-tabs{display:flex;gap:4px}
.filter-tabs button{padding:6px 14px;border:none;background:none;border-radius:var(--radius);font-size:14px;color:var(--text-secondary);transition:var(--transition)}
.filter-tabs button.active{background:var(--primary);color:#fff}
.filter-tabs button:hover:not(.active){background:var(--primary-light)}

/* Form */
.form-group{margin-bottom:16px}
.form-group label{display:block;font-size:14px;font-weight:500;margin-bottom:4px;color:var(--text-secondary)}
.form-group input,.form-group textarea,.form-group select{width:100%}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:768px){.form-row{grid-template-columns:1fr}}

/* Editor */
.editor-layout{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:900px){.editor-layout{grid-template-columns:1fr}}
.editor-toolbar{display:flex;flex-wrap:wrap;gap:4px;padding:8px;background:var(--bg);border:1px solid var(--border);border-bottom:none;border-radius:var(--radius) var(--radius) 0 0}
.toolbar-btn{padding:4px 10px;border:1px solid var(--border);background:var(--card);border-radius:4px;font-size:13px;cursor:pointer;transition:var(--transition)}
.toolbar-btn:hover{background:var(--primary-light);border-color:var(--primary)}
.toolbar-divider{width:1px;background:var(--border);margin:0 4px}
.editor-dropzone{position:relative}
.editor-dropzone textarea{border-radius:0 0 var(--radius) var(--radius)}
.drag-active{outline:2px dashed var(--primary);outline-offset:-2px}
.drag-active textarea{background:var(--primary-light)}
.upload-overlay{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;gap:8px;border-radius:var(--radius);font-size:14px;color:var(--primary)}
.upload-spinner{width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin .6s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.source-editor{width:100%;min-height:600px;font-family:"JetBrains Mono","Fira Code",Consolas,monospace;font-size:13px;line-height:1.6;background:#1e293b;color:#e2e8f0;padding:16px;border:1px solid var(--border);border-radius:var(--radius)}
.editor-pane textarea{width:100%;min-height:400px;font-family:"JetBrains Mono","Fira Code",Consolas,monospace;font-size:14px;line-height:1.6}
.preview-pane{border:1px solid var(--border);border-radius:var(--radius);padding:16px;overflow-y:auto;max-height:500px;background:#fff}
.preview-pane h1,.preview-pane h2,.preview-pane h3{margin:16px 0 8px}
.preview-pane p{margin-bottom:12px}
.preview-pane code{background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:13px}
.preview-pane pre{background:#1e293b;color:#e2e8f0;padding:16px;border-radius:var(--radius);overflow-x:auto;margin-bottom:12px}
.preview-pane pre code{background:none;color:inherit;padding:0}
.preview-pane img{max-width:100%}
.preview-pane blockquote{border-left:4px solid var(--primary);padding-left:16px;color:var(--text-secondary);margin-bottom:12px}
.preview-pane table{border-collapse:collapse;width:100%;margin-bottom:12px}
.preview-pane th,.preview-pane td{border:1px solid var(--border);padding:8px;text-align:left}
.preview-pane ul,.preview-pane ol{padding-left:24px;margin-bottom:12px}

/* Media grid */
.media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
.media-item{border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;background:var(--card);position:relative}
.media-item img{width:100%;height:120px;object-fit:cover;display:block}
.media-item .info{padding:8px;font-size:12px;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.media-item .actions{display:flex;gap:4px;padding:0 8px 8px}
.media-item .actions button{font-size:12px;padding:3px 8px}

/* Config editor */
.config-editor textarea{width:100%;min-height:500px;font-family:"JetBrains Mono","Fira Code",Consolas,monospace;font-size:13px;line-height:1.5;background:#1e293b;color:#e2e8f0;padding:16px;border:none;border-radius:var(--radius)}
.config-form .card{margin-bottom:16px}
.config-form .card-title{font-size:15px;font-weight:600;margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid var(--border)}

/* Toast */
.toast-container{position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px}
.toast{padding:12px 20px;border-radius:var(--radius);color:#fff;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,.15);animation:slideIn .3s ease;max-width:360px;word-break:break-word}
.toast-success{background:var(--success)}
.toast-error{background:var(--danger)}
.toast-info{background:var(--primary)}
@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}

/* Login */
.login-wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--bg)}
.login-box{background:var(--card);padding:40px;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.1);width:100%;max-width:380px}
.login-box h2{text-align:center;margin-bottom:24px;color:var(--primary)}
.login-box .form-group{margin-bottom:20px}
.login-box .btn{width:100%;justify-content:center;padding:10px}

/* Misc */
.loading{text-align:center;padding:40px;color:var(--text-secondary)}
.empty{text-align:center;padding:40px;color:var(--text-secondary);font-size:14px}
.mb-8{margin-bottom:8px}.mb-16{margin-bottom:16px}.mt-16{margin-top:16px}
.flex{display:flex}.gap-8{gap:8px}.items-center{align-items:center}.justify-between{justify-content:space-between}
.text-sm{font-size:13px}.text-muted{color:var(--text-secondary)}
.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.confirm-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.4);z-index:1000;display:flex;align-items:center;justify-content:center}
.confirm-box{background:var(--card);padding:24px;border-radius:var(--radius);max-width:400px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,.2)}
.confirm-box h3{margin-bottom:12px}
.confirm-box p{margin-bottom:20px;color:var(--text-secondary)}
.switch{position:relative;display:inline-block;width:44px;height:24px}
.switch input{opacity:0;width:0;height:0}
.switch .slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#cbd5e1;transition:var(--transition);border-radius:24px}
.switch .slider:before{content:"";position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;transition:var(--transition);border-radius:50%}
.switch input:checked+.slider{background:var(--primary)}
.switch input:checked+.slider:before{transform:translateX(20px)}
.front-matter-section{background:#f8fafc;border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-top:12px}
.fm-row{display:flex;gap:8px;margin-bottom:8px;align-items:center}
.fm-row input{flex:1}
.autocomplete-wrap{position:relative}
.autocomplete-list{position:absolute;top:100%;left:0;right:0;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);z-index:50;max-height:200px;overflow-y:auto}
.autocomplete-item{padding:8px 12px;cursor:pointer;font-size:14px}
.autocomplete-item:hover{background:var(--primary-light)}
</style>
</head>
<body>
<div id="app">
  <!-- Toast -->
  <div class="toast-container">
    <div v-for="(t,i) in toasts" :key="i" :class="'toast toast-'+t.type">{{t.msg}}</div>
  </div>

  <!-- Confirm dialog -->
  <div v-if="confirmDialog.show" class="confirm-overlay" @click.self="confirmDialog.show=false">
    <div class="confirm-box">
      <h3>{{confirmDialog.title}}</h3>
      <p>{{confirmDialog.message}}</p>
      <div class="btn-group" style="justify-content:flex-end">
        <button class="btn btn-outline" @click="confirmDialog.show=false">取消</button>
        <button class="btn btn-danger" @click="confirmDialog.onOk();confirmDialog.show=false">确认</button>
      </div>
    </div>
  </div>

  <!-- Login -->
  <div v-if="!authenticated" class="login-wrap">
    <div class="login-box">
      <h2>Hexo 后台管理</h2>
      <div class="form-group">
        <label>用户名</label>
        <input v-model="loginForm.username" @keyup.enter="doLogin" placeholder="admin" autofocus>
      </div>
      <div class="form-group">
        <label>密码</label>
        <input v-model="loginForm.password" type="password" @keyup.enter="doLogin" placeholder="请输入密码">
      </div>
      <button class="btn btn-primary" @click="doLogin" :disabled="loginLoading">
        {{loginLoading ? '登录中...' : '登录'}}
      </button>
    </div>
  </div>

  <!-- Main App -->
  <div v-else class="app">
    <div class="header">
      <h1>Hexo 管理后台</h1>
      <nav>
        <a href="#/dashboard" :class="{active:route==='/dashboard'}" @click="go('/dashboard')">仪表盘</a>
        <a href="#/posts" :class="{active:route==='/posts'||route==='/posts/new'||route.startsWith('/posts/edit')}" @click="go('/posts')">文章</a>
        <a href="#/media" :class="{active:route==='/media'}" @click="go('/media')">媒体</a>
        <a href="#/config" :class="{active:route==='/config'}" @click="go('/config')">配置</a>
        <a href="#/themes" :class="{active:route==='/themes'}" @click="go('/themes')">主题</a>
        <button class="logout-btn" @click="doLogout">退出</button>
      </nav>
    </div>

    <div class="main">
      <!-- Dashboard -->
      <div v-if="route==='/dashboard'">
        <div class="stats-grid">
          <div class="stat-card"><div class="num">{{stats.posts||0}}</div><div class="label">已发布</div></div>
          <div class="stat-card"><div class="num">{{stats.drafts||0}}</div><div class="label">草稿</div></div>
          <div class="stat-card"><div class="num">{{stats.categories||0}}</div><div class="label">分类</div></div>
          <div class="stat-card"><div class="num">{{stats.tags||0}}</div><div class="label">标签</div></div>
          <div class="stat-card"><div class="num">{{formatNumber(stats.totalWords||0)}}</div><div class="label">总字数</div></div>
        </div>
        <div class="card">
          <div class="card-title">快捷操作</div>
          <div class="btn-group">
            <button class="btn btn-primary" @click="runCommand('generate')" :disabled="cmdLoading">
              {{cmdLoading==='generate'?'生成中...':'生成站点'}}
            </button>
            <button class="btn btn-success" @click="runCommand('deploy')" :disabled="cmdLoading">
              {{cmdLoading==='deploy'?'部署中...':'部署'}}
            </button>
            <button class="btn btn-warning" @click="runCommand('clean')" :disabled="cmdLoading">
              {{cmdLoading==='clean'?'清除中...':'清除缓存'}}
            </button>
          </div>
        </div>
        <div class="card">
          <div class="card-title">最近文章</div>
          <div v-if="recentPosts.length===0" class="empty">暂无文章</div>
          <table v-else>
            <thead><tr><th>标题</th><th>日期</th><th>状态</th></tr></thead>
            <tbody>
              <tr v-for="p in recentPosts" :key="p._id">
                <td><a href="#/posts" @click="editPost(p._id)">{{p.title}}</a></td>
                <td>{{formatDate(p.date)}}</td>
                <td><span :class="p.published?'status-published':'status-draft'">{{p.published?'已发布':'草稿'}}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Posts List -->
      <div v-if="route==='/posts'">
        <div class="toolbar">
          <div class="search-box">
            <input v-model="postSearch" @input="debounceLoadPosts" placeholder="搜索文章...">
          </div>
          <div class="filter-tabs">
            <button :class="{active:postStatus==='all'}" @click="postStatus='all';loadPosts()">全部</button>
            <button :class="{active:postStatus==='published'}" @click="postStatus='published';loadPosts()">已发布</button>
            <button :class="{active:postStatus==='draft'}" @click="postStatus='draft';loadPosts()">草稿</button>
          </div>
          <button class="btn btn-primary" @click="go('/posts/new')">+ 新建文章</button>
        </div>
        <div v-if="postsLoading" class="loading">加载中...</div>
        <div v-else class="card">
          <div v-if="posts.length===0" class="empty">暂无文章</div>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr><th>标题</th><th>日期</th><th>分类</th><th>标签</th><th>字数</th><th>状态</th><th>操作</th></tr>
              </thead>
              <tbody>
                <tr v-for="p in posts" :key="p._id">
                  <td style="max-width:250px" class="truncate">{{p.title}}</td>
                  <td class="text-sm">{{formatDate(p.date)}}</td>
                  <td><span v-for="c in p.categories" class="cat-badge">{{c}}</span></td>
                  <td><span v-for="t in p.tags" class="tag-badge">{{t}}</span></td>
                  <td class="text-sm">{{p.wordCount}}</td>
                  <td><span :class="p.published?'status-published':'status-draft'">{{p.published?'已发布':'草稿'}}</span></td>
                  <td>
                    <div class="btn-group">
                      <button class="btn btn-outline btn-sm" @click="editPost(p._id)">编辑</button>
                      <button class="btn btn-sm" :class="p.published?'btn-warning':'btn-success'" @click="togglePublish(p)">
                        {{p.published?'取消发布':'发布'}}
                      </button>
                      <button class="btn btn-danger btn-sm" @click="deletePost(p)">删除</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="postTotalPages>1" class="pagination">
            <button @click="postPage--;loadPosts()" :disabled="postPage<=1">&lt;</button>
            <template v-for="pg in paginationRange">
              <button v-if="pg==='...'" disabled>...</button>
              <button v-else :class="{active:pg===postPage}" @click="postPage=pg;loadPosts()">{{pg}}</button>
            </template>
            <button @click="postPage++;loadPosts()" :disabled="postPage>=postTotalPages">&gt;</button>
            <span class="info">共 {{postTotal}} 篇</span>
          </div>
        </div>
      </div>

      <!-- New Post Dialog -->
      <div v-if="route==='/posts/new'">
        <div class="card" style="max-width:500px;margin:40px auto">
          <div class="card-title">新建文章</div>
          <div class="form-group">
            <label>文章标题</label>
            <input v-model="newPostTitle" placeholder="请输入文章标题" @keyup.enter="createNewPost" autofocus>
          </div>
          <div class="btn-group" style="justify-content:flex-end;margin-top:16px">
            <button class="btn btn-outline" @click="go('/posts')">取消</button>
            <button class="btn btn-primary" @click="createNewPost" :disabled="!newPostTitle.trim()">创建文章</button>
          </div>
        </div>
      </div>

      <!-- Post Editor -->
      <div v-if="route.startsWith('/posts/edit')">
        <div class="toolbar">
          <button class="btn btn-outline" @click="go('/posts')">&larr; 返回</button>
          <div class="btn-group">
            <button class="btn btn-sm" :class="editorMode==='visual'?'btn-primary':'btn-outline'" @click="editorMode='visual'">可视化编辑</button>
            <button class="btn btn-sm" :class="editorMode==='source'?'btn-primary':'btn-outline'" @click="editorMode='source'">源代码编辑</button>
          </div>
          <div class="btn-group">
            <button class="btn btn-primary" @click="savePost" :disabled="saving">
              {{saving?'保存中...':'保存'}}
            </button>
          </div>
        </div>
        <div class="form-row mb-16">
          <div class="form-group">
            <label>标题</label>
            <input v-model="editor.title" placeholder="文章标题">
          </div>
          <div class="form-group">
            <label>日期</label>
            <input v-model="editor.date" type="datetime-local">
          </div>
        </div>
        <div class="form-row mb-16">
          <div class="form-group">
            <label>分类（逗号分隔）</label>
            <input v-model="editor.categoriesStr" placeholder="例如：技术, JavaScript">
          </div>
          <div class="form-group">
            <label>标签（逗号分隔）</label>
            <input v-model="editor.tagsStr" placeholder="例如：node, hexo">
          </div>
        </div>

        <!-- Front Matter -->
        <div class="front-matter-section mb-16">
          <div class="flex justify-between items-center mb-8">
            <label style="font-weight:600;font-size:14px">Front Matter（额外字段）</label>
            <button class="btn btn-outline btn-sm" @click="addFrontMatterField">+ 添加字段</button>
          </div>
          <div v-for="(fm,i) in editor.frontMatterFields" :key="i" class="fm-row">
            <input v-model="fm.key" placeholder="键" style="flex:0.4">
            <input v-model="fm.value" placeholder="值" style="flex:1">
            <button class="btn btn-danger btn-sm" @click="editor.frontMatterFields.splice(i,1)">&times;</button>
          </div>
          <div v-if="editor.frontMatterFields.length===0" class="text-sm text-muted">无额外 Front Matter 字段</div>
        </div>

        <!-- Visual Editor Mode -->
        <div v-if="editorMode==='visual'" class="editor-layout">
          <div class="editor-pane">
            <div class="editor-toolbar">
              <button class="toolbar-btn" @click="insertFormat('**','**')" title="粗体"><b>B</b></button>
              <button class="toolbar-btn" @click="insertFormat('*','*')" title="斜体"><i>I</i></button>
              <button class="toolbar-btn" @click="insertFormat('~~','~~')" title="删除线"><s>S</s></button>
              <span class="toolbar-divider"></span>
              <button class="toolbar-btn" @click="insertFormat('# ','')" title="标题">H1</button>
              <button class="toolbar-btn" @click="insertFormat('## ','')" title="标题2">H2</button>
              <button class="toolbar-btn" @click="insertFormat('### ','')" title="标题3">H3</button>
              <span class="toolbar-divider"></span>
              <button class="toolbar-btn" @click="insertFormat('\\n- ','')" title="无序列表">• List</button>
              <button class="toolbar-btn" @click="insertFormat('\\n1. ','')" title="有序列表">1. List</button>
              <button class="toolbar-btn" @click="insertFormat('\\n> ','')" title="引用">❝ Quote</button>
              <span class="toolbar-divider"></span>
              <button class="toolbar-btn" @click="insertCode" title="行内代码">&lt;code&gt;</button>
              <button class="toolbar-btn" @click="insertCodeBlock" title="代码块">&lt;block&gt;</button>
              <button class="toolbar-btn" @click="insertFormat('[','](url)')" title="链接">🔗 Link</button>
              <span class="toolbar-divider"></span>
              <button class="toolbar-btn" @click="insertImage" title="插入图片">🖼️ 图片</button>
              <button class="toolbar-btn" @click="insertFormat('\\n---\\n','')" title="分割线">— HR</button>
            </div>
            <div class="editor-dropzone"
                 @dragover.prevent="editorDragOver=$event"
                 @dragleave="editorDragOver=null"
                 @drop.prevent="handleEditorDrop($event)"
                 :class="{'drag-active':editorDragOver}">
              <textarea
                ref="editorTextarea"
                v-model="editor.content"
                @input="debouncePreview"
                @paste="handleEditorPaste($event)"
                placeholder="在此编写 Markdown 内容...支持拖拽和粘贴图片上传"></textarea>
              <div v-if="editorUploading" class="upload-overlay">
                <div class="upload-spinner"></div>
                <span>上传中...</span>
              </div>
            </div>
          </div>
          <div class="preview-pane">
            <div class="text-sm text-muted mb-8">预览</div>
            <div v-html="editorPreview"></div>
          </div>
        </div>

        <!-- Source Code Editor Mode -->
        <div v-if="editorMode==='source'">
          <div class="card">
            <div class="card-title flex justify-between items-center">
              <span>源代码编辑</span>
              <button class="btn btn-outline btn-sm" @click="toggleSourcePreview">{{showSourcePreview?'隐藏预览':'显示预览'}}</button>
            </div>
            <div class="form-group">
              <label>完整 Markdown 源代码（包含 Front Matter）</label>
              <textarea
                v-model="editor.sourceContent"
                class="source-editor"
                placeholder="---&#10;title: 文章标题&#10;date: 2024-01-01&#10;categories: []&#10;tags: []&#10;---&#10;&#10;正文内容..."
                @input="parseSourceContent"></textarea>
            </div>
            <div v-if="showSourcePreview" class="mt-16">
              <label class="text-sm text-muted mb-8" style="display:block">预览</label>
              <div class="preview-pane" style="max-height:400px">
                <div v-html="editorPreview"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Media -->
      <div v-if="route==='/media'">
        <div class="toolbar">
          <div class="search-box">
            <input v-model="mediaSearch" placeholder="筛选文件...">
          </div>
          <div>
            <input type="file" ref="mediaFileInput" style="display:none" @change="uploadMedia" multiple>
            <button class="btn btn-primary" @click="$refs.mediaFileInput.click()">上传文件</button>
          </div>
        </div>
        <div v-if="mediaLoading" class="loading">加载中...</div>
        <div v-else>
          <div v-if="filteredMedia.length===0" class="empty card">暂无媒体文件</div>
          <div v-else class="media-grid">
            <div v-for="f in filteredMedia" :key="f.name" class="media-item">
              <img v-if="isImage(f.name)" :src="'${root}'+f.path.slice(1)" :alt="f.name" loading="lazy">
              <div v-else style="height:120px;display:flex;align-items:center;justify-content:center;background:#f1f5f9;font-size:32px">&#128196;</div>
              <div class="info" :title="f.name">{{f.name}}</div>
              <div class="info text-muted">{{formatSize(f.size)}}</div>
              <div class="actions">
                <button class="btn btn-outline btn-sm" @click="copyUrl(f)">复制链接</button>
                <button class="btn btn-danger btn-sm" @click="deleteMedia(f)">删除</button>
              </div>
            </div>
          </div>
          <div v-if="mediaTotalPages>1" class="pagination">
            <button @click="mediaPage--;loadMedia()" :disabled="mediaPage<=1">&lt;</button>
            <span class="info">第 {{mediaPage}} 页 / 共 {{mediaTotalPages}} 页</span>
            <button @click="mediaPage++;loadMedia()" :disabled="mediaPage>=mediaTotalPages">&gt;</button>
          </div>
        </div>
      </div>

      <!-- Config -->
      <div v-if="route==='/config'">
        <div class="toolbar">
          <div class="filter-tabs">
            <button :class="{active:configType==='site'}" @click="configType='site';loadConfig()">站点配置</button>
            <button :class="{active:configType==='theme'}" @click="configType='theme';loadConfig()">主题配置</button>
          </div>
          <div class="btn-group">
            <button class="btn btn-sm" :class="configView==='form'?'btn-primary':'btn-outline'" @click="configView='form'">表单编辑</button>
            <button class="btn btn-sm" :class="configView==='raw'?'btn-primary':'btn-outline'" @click="configView='raw'">YAML 编辑</button>
            <button class="btn btn-success" @click="saveConfig" :disabled="configSaving">
              {{configSaving?'保存中...':'保存配置'}}
            </button>
          </div>
        </div>
        <div v-if="configLoading" class="loading">加载中...</div>
        <div v-else>
          <!-- Form Editor -->
          <div v-if="configView==='form'">
            <!-- Site Config Form -->
            <div v-if="configType==='site'" class="config-form">
              <div class="card">
                <div class="card-title">基本信息</div>
                <div class="form-row">
                  <div class="form-group">
                    <label>站点标题</label>
                    <input v-model="configData.title" placeholder="站点标题">
                  </div>
                  <div class="form-group">
                    <label>副标题</label>
                    <input v-model="configData.subtitle" placeholder="副标题">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>作者</label>
                    <input v-model="configData.author" placeholder="作者名">
                  </div>
                  <div class="form-group">
                    <label>语言</label>
                    <select v-model="configData.language">
                      <option value="zh-CN">简体中文</option>
                      <option value="en">English</option>
                      <option value="ja">日本語</option>
                      <option value="ko">한국어</option>
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label>站点 URL</label>
                  <input v-model="configData.url" placeholder="https://example.com">
                </div>
                <div class="form-group">
                  <label>站点描述</label>
                  <textarea v-model="configData.description" rows="2" placeholder="站点描述"></textarea>
                </div>
              </div>
              <div class="card">
                <div class="card-title">目录设置</div>
                <div class="form-row">
                  <div class="form-group">
                    <label>源目录</label>
                    <input v-model="configData.source_dir" placeholder="source">
                  </div>
                  <div class="form-group">
                    <label>公共目录</label>
                    <input v-model="configData.public_dir" placeholder="public">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>标签目录</label>
                    <input v-model="configData.tag_dir" placeholder="tags">
                  </div>
                  <div class="form-group">
                    <label>归档目录</label>
                    <input v-model="configData.archive_dir" placeholder="archives">
                  </div>
                </div>
              </div>
              <div class="card">
                <div class="card-title">写作设置</div>
                <div class="form-row">
                  <div class="form-group">
                    <label>新文章文件名</label>
                    <input v-model="configData.new_post_name" placeholder=":title.md">
                  </div>
                  <div class="form-group">
                    <label>默认布局</label>
                    <select v-model="configData.default_layout">
                      <option value="post">post</option>
                      <option value="page">page</option>
                      <option value="draft">draft</option>
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>日期格式</label>
                    <input v-model="configData.date_format" placeholder="YYYY-MM-DD">
                  </div>
                  <div class="form-group">
                    <label>时间格式</label>
                    <input v-model="configData.time_format" placeholder="HH:mm:ss">
                  </div>
                </div>
              </div>
              <div class="card">
                <div class="card-title">分页设置</div>
                <div class="form-row">
                  <div class="form-group">
                    <label>每页文章数</label>
                    <input v-model.number="configData.per_page" type="number" min="0">
                  </div>
                  <div class="form-group">
                    <label>分页目录</label>
                    <input v-model="configData.pagination_dir" placeholder="page">
                  </div>
                </div>
              </div>
              <div class="card">
                <div class="card-title">主题</div>
                <div class="form-group">
                  <label>当前主题</label>
                  <select v-model="configData.theme">
                    <option v-for="t in themes" :key="t.name" :value="t.name">{{t.name}}</option>
                  </select>
                </div>
              </div>
              <div class="card">
                <div class="card-title">部署</div>
                <div class="form-row">
                  <div class="form-group">
                    <label>部署类型</label>
                    <select v-model="deployType">
                      <option value="">无</option>
                      <option value="git">git</option>
                      <option value="rsync">rsync</option>
                      <option value="s3">s3</option>
                    </select>
                  </div>
                  <div class="form-group" v-if="deployType==='git'">
                    <label>仓库地址</label>
                    <input v-model="deployRepo" placeholder="git@github.com:user/repo.git">
                  </div>
                </div>
                <div class="form-row" v-if="deployType==='git'">
                  <div class="form-group">
                    <label>分支</label>
                    <input v-model="deployBranch" placeholder="main">
                  </div>
                </div>
              </div>
            </div>
            <!-- Theme Config Form -->
            <div v-if="configType==='theme'" class="config-form">
              <div class="card">
                <div class="card-title">基本信息</div>
                <div class="form-group">
                  <label>网站标题</label>
                  <input v-model="themeConfigData.info.title" placeholder="网站标题">
                </div>
                <div class="form-group">
                  <label>网站副标题</label>
                  <input v-model="themeConfigData.info.subtitle" placeholder="网站副标题">
                </div>
                <div class="form-group">
                  <label>作者名称</label>
                  <input v-model="themeConfigData.info.author" placeholder="作者名称">
                </div>
              </div>
              <div class="card">
                <div class="card-title">图片配置</div>
                <div class="form-row">
                  <div class="form-group">
                    <label>网站图标</label>
                    <input v-model="themeConfigData.defaults.favicon" placeholder="/images/favicon.png">
                  </div>
                  <div class="form-group">
                    <label>网站头像</label>
                    <input v-model="themeConfigData.defaults.avatar" placeholder="/images/avatar.png">
                  </div>
                </div>
              </div>
              <div class="card">
                <div class="card-title">颜色</div>
                <div class="form-row">
                  <div class="form-group">
                    <label>主色调</label>
                    <div class="flex gap-8 items-center">
                      <input v-model="themeConfigData.colors.primary" placeholder="#63a4a8" style="flex:1">
                      <input type="color" v-model="themeConfigData.colors.primary" style="width:40px;height:36px;padding:2px;cursor:pointer">
                    </div>
                  </div>
                  <div class="form-group">
                    <label>默认主题模式</label>
                    <select v-model="themeConfigData.colors.default_mode">
                      <option value="light">浅色</option>
                      <option value="dark">深色</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="card">
                <div class="card-title">首页横幅</div>
                <div class="form-group">
                  <label>启用首页横幅</label>
                  <select v-model="themeConfigData.home_banner.enable">
                    <option :value="true">启用</option>
                    <option :value="false">禁用</option>
                  </select>
                </div>
                <div v-if="themeConfigData.home_banner.enable">
                  <div class="form-group">
                    <label>横幅标题</label>
                    <input v-model="themeConfigData.home_banner.title" placeholder="横幅标题">
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label>浅色模式图片</label>
                      <input v-model="themeConfigData.home_banner.image.light" placeholder="/images/light.webp">
                    </div>
                    <div class="form-group">
                      <label>深色模式图片</label>
                      <input v-model="themeConfigData.home_banner.image.dark" placeholder="/images/dark.webp">
                    </div>
                  </div>
                </div>
              </div>
              <div class="card">
                <div class="card-title">文章设置</div>
                <div class="form-row">
                  <div class="form-group">
                    <label>字体大小</label>
                    <input v-model="themeConfigData.articles.style.font_size" placeholder="16px">
                  </div>
                  <div class="form-group">
                    <label>行高</label>
                    <input v-model="themeConfigData.articles.style.line_height" placeholder="1.5">
                  </div>
                </div>
                <div class="form-group">
                  <label>启用目录</label>
                  <select v-model="themeConfigData.articles.toc.enable">
                    <option :value="true">启用</option>
                    <option :value="false">禁用</option>
                  </select>
                </div>
                <div v-if="themeConfigData.articles.toc.enable" class="form-group">
                  <label>目录深度</label>
                  <input v-model.number="themeConfigData.articles.toc.max_depth" type="number" min="1" max="6">
                </div>
              </div>
              <div class="card">
                <div class="card-title">页脚</div>
                <div class="form-group">
                  <label>显示运行时间</label>
                  <select v-model="themeConfigData.footer.runtime">
                    <option :value="true">启用</option>
                    <option :value="false">禁用</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>网站开始时间</label>
                  <input v-model="themeConfigData.footer.start" placeholder="2023/9/25 17:00:00">
                </div>
              </div>
            </div>
          </div>
          <!-- Raw YAML Editor -->
          <div v-if="configView==='raw'" class="config-editor">
            <textarea v-model="configRaw"></textarea>
          </div>
        </div>
        <div class="text-sm text-muted mt-16">更改将在服务器重启或重新生成后生效。</div>
      </div>

      <!-- Themes -->
      <div v-if="route==='/themes'">
        <div class="card">
          <div class="card-title">已安装主题</div>
          <div v-if="themesLoading" class="loading">加载中...</div>
          <div v-else>
            <table>
              <thead><tr><th>主题</th><th>状态</th></tr></thead>
              <tbody>
                <tr v-for="t in themes" :key="t.name">
                  <td>{{t.name}}</td>
                  <td><span :class="t.active?'status-published':'text-muted'">{{t.active?'启用':'未启用'}}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script src="https://registry.npmmirror.com/vue/3.5.13/files/dist/vue.global.prod.js"><\/script>
<script src="https://registry.npmmirror.com/marked/15.0.7/files/marked.min.js"><\/script>
<script>
(function(){
const {createApp,ref,reactive,computed,onMounted,watch,nextTick} = Vue;

const api = {
  token: localStorage.getItem('hexo_admin_token'),
  async request(method, path, body) {
    const opts = {method, headers:{'Content-Type':'application/json'}};
    if (this.token) opts.headers['Authorization'] = 'Bearer ' + this.token;
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch('${root}admin/api' + path, opts);
    const data = await res.json();
    if (res.status === 401) { this.logout(); throw new Error('会话已过期'); }
    if (!data.success) throw new Error(data.error || '未知错误');
    return data.data;
  },
  get(p){return this.request('GET',p)},
  post(p,b){return this.request('POST',p,b)},
  put(p,b){return this.request('PUT',p,b)},
  del(p){return this.request('DELETE',p)},
  async upload(path,formData){
    const opts={method:'POST',headers:{}};
    if(this.token) opts.headers['Authorization']='Bearer '+this.token;
    opts.body=formData;
    const res=await fetch('${root}admin/api'+path,opts);
    const data=await res.json();
    if(res.status===401){this.logout();throw new Error('会话已过期');}
    if(!data.success) throw new Error(data.error||'上传失败');
    return data.data;
  },
  logout(){this.token=null;localStorage.removeItem('hexo_admin_token');}
};

const app = createApp({
  setup(){
    const authenticated = ref(false);
    const route = ref('/dashboard');
    const toasts = ref([]);
    const confirmDialog = reactive({show:false,title:'',message:'',onOk:null});

    // Login
    const loginForm = reactive({username:'',password:''});
    const loginLoading = ref(false);

    // Stats
    const stats = ref({});
    const recentPosts = ref([]);
    const cmdLoading = ref(false);

    // Posts
    const posts = ref([]);
    const postSearch = ref('');
    const postStatus = ref('all');
    const postPage = ref(1);
    const postTotal = ref(0);
    const postTotalPages = ref(0);
    const postsLoading = ref(false);

    // Editor
    const editor = reactive({
      id:null,title:'',date:'',categoriesStr:'',tagsStr:'',content:'',
      frontMatterFields:[],sourceContent:''
    });
    const editorPreview = ref('');
    const saving = ref(false);
    const editorMode = ref('visual');
    const showSourcePreview = ref(false);
    const newPostTitle = ref('');

    // Media
    const mediaFiles = ref([]);
    const mediaSearch = ref('');
    const mediaPage = ref(1);
    const mediaTotal = ref(0);
    const mediaTotalPages = ref(0);
    const mediaLoading = ref(false);

    // Config
    const configRaw = ref('');
    const configLoading = ref(false);
    const configSaving = ref(false);
    const configType = ref('site');
    const configView = ref('form');
    const configData = ref({});
    const themeConfigData = ref({
      info:{title:'',subtitle:'',author:'',url:''},
      defaults:{favicon:'',logo:'',avatar:''},
      colors:{primary:'',secondary:'',default_mode:'light'},
      global:{fonts:{chinese:{enable:false,family:'',url:''},english:{enable:false,family:'',url:''},title:{enable:false,family:'',url:''}},content_max_width:'1000px',sidebar_width:'210px',hover:{shadow:true,scale:false},scroll_progress:{bar:false,percentage:true},website_counter:{url:'',enable:false,site_pv:false,site_uv:false,post_pv:false},single_page:true,preloader:{enable:true,custom_message:''},side_tools:{gear_rotation:true,auto_expand:false},open_graph:{enable:true,image:'',description:''},google_analytics:{enable:false,id:''}},
      home_banner:{enable:true,style:'fixed',image:{light:'',dark:''},title:'',subtitle:{text:[],hitokoto:{enable:false,show_author:true,api:''},typing_speed:100,backing_speed:80,starting_delay:500,backing_delay:1500,loop:false,smart_backspace:true},text_color:{light:'',dark:''},text_style:{title_size:'3.8rem',subtitle_size:'1.8rem',line_height:1.2},custom_font:{enable:false,family:'',url:''},social_links:{enable:true,style:'center',links:[],qrs:[]}},
      navbar:{auto_hide:true,color:{left:'',right:'',transparency:35},width:{home:'1200px',pages:'1000px'},links:{},search:{enable:true,preload:true}},
      home:{sidebar:{enable:true,position:'left',first_item:'info',announcement:'',show_on_mobile:true,links:{}},article_date_format:'auto',excerpt_length:200,categories:{enable:true,limit:3},tags:{enable:true,limit:3}},
      articles:{style:{font_size:'16px',line_height:'1.5',image_border_radius:'14px',image_alignment:'center',image_caption:false,link_icon:true,delete_mask:false,title_alignment:'left',headings_top_spacing:{h1:'3.2rem',h2:'2.4rem',h3:'1.9rem',h4:'1.6rem',h5:'1.4rem',h6:'1.3rem'}},word_count:{enable:true,count:true,min2read:true},author_label:{enable:false,auto:false,list:[]},code_block:{copy:true,style:'mac',highlight_theme:{light:'github',dark:'vs2015'},font:{enable:false,family:'',url:''}},toc:{enable:true,max_depth:3,number:false,expand:true,init_open:true},copyright:{enable:true,default:'cc_by_nc_sa'},lazyload:true,pangu_js:false,recommendation:{enable:false,title:'',limit:3,mobile_limit:2,placeholder:'',skip_dirs:[]}},
      comment:{enable:false,system:'gitalk',config:{waline:{serverUrl:'',lang:'zh-CN',emoji:[],recaptchaV3Key:'',turnstileKey:'',reaction:false},gitalk:{clientID:'',clientSecret:'',repo:'',owner:''},twikoo:{version:'',server_url:'',region:''},giscus:{repo:'',repo_id:'',category:'',category_id:'',mapping:'pathname',strict:0,reactions_enabled:1,emit_metadata:0,lang:'en',input_position:'bottom',loading:'lazy'}}},
      footer:{runtime:true,icon:'',start:'',statistics:true,customize:'',icp:{enable:false,number:'',url:''}},
      inject:{enable:true,head:'',footer:[]},
      plugins:{feed:{enable:false},aplayer:{enable:false,type:'fixed',audios:[]},mermaid:{enable:true,version:''}},
      page_templates:{friends_column:2,tags_style:'blur'},
      cdn:{enable:false,provider:''},
      developer:{enable:false}
    });
    const deployType = ref('');
    const deployRepo = ref('');
    const deployBranch = ref('');

    // Themes
    const themes = ref([]);
    const themesLoading = ref(false);

    // Toast
    function toast(msg,type){
      type=type||'info';
      toasts.value.push({msg,type});
      setTimeout(()=>{toasts.value.shift();},3000);
    }

    // Navigation
    function go(r){
      location.hash='#'+r;
    }
    function handleHash(){
      const h=location.hash.slice(1)||'/dashboard';
      route.value=h;
      if(h==='/dashboard') loadDashboard();
      else if(h==='/posts'){postPage.value=1;loadPosts();}
      else if(h==='/posts/new') newPostTitle.value='';
      else if(h.startsWith('/posts/edit/')) loadPostForEdit(h.split('/')[3]);
      else if(h==='/media'){mediaPage.value=1;loadMedia();}
      else if(h==='/config') loadConfig();
      else if(h==='/themes') loadThemes();
    }

    // Auth
    async function verifyAuth(){
      if(!api.token){authenticated.value=false;return;}
      try{
        await api.get('/auth/verify');
        authenticated.value=true;
      }catch(e){
        authenticated.value=false;
      }
    }
    async function doLogin(){
      if(!loginForm.username||!loginForm.password){toast('请输入用户名和密码','error');return;}
      loginLoading.value=true;
      try{
        const data=await api.post('/auth/login',{username:loginForm.username,password:loginForm.password});
        api.token=data.token;
        localStorage.setItem('hexo_admin_token',data.token);
        authenticated.value=true;
        toast('登录成功','success');
        handleHash();
      }catch(e){toast(e.message,'error');}
      finally{loginLoading.value=false;}
    }
    function doLogout(){
      api.logout();
      authenticated.value=false;
      toast('已退出登录','info');
    }

    // Dashboard
    async function loadDashboard(){
      try{
        stats.value=await api.get('/stats');
        const pd=await api.get('/posts?page=1&per_page=5&status=published');
        recentPosts.value=pd.posts||[];
      }catch(e){toast(e.message,'error');}
    }
    async function runCommand(cmd){
      cmdLoading.value=cmd;
      try{
        const data=await api.post('/commands/'+cmd);
        toast(data.message,'success');
      }catch(e){toast(e.message,'error');}
      finally{cmdLoading.value=false;}
    }

    // Posts
    let searchTimer=null;
    function debounceLoadPosts(){
      clearTimeout(searchTimer);
      searchTimer=setTimeout(()=>{postPage.value=1;loadPosts();},300);
    }
    async function loadPosts(){
      postsLoading.value=true;
      try{
        const params=new URLSearchParams();
        params.set('page',postPage.value);
        params.set('per_page','15');
        params.set('status',postStatus.value);
        if(postSearch.value) params.set('search',postSearch.value);
        const data=await api.get('/posts?'+params.toString());
        posts.value=data.posts;
        postTotal.value=data.total;
        postTotalPages.value=data.total_pages;
      }catch(e){toast(e.message,'error');}
      finally{postsLoading.value=false;}
    }
    function resetEditor(){
      editor.id=null;editor.title='';editor.date=new Date().toISOString().slice(0,16);
      editor.categoriesStr='';editor.tagsStr='';editor.content='';
      editor.frontMatterFields=[];editor.sourceContent='';
      editorPreview.value='';editorMode.value='visual';
    }

    async function createNewPost(){
      if(!newPostTitle.value.trim()){toast('请输入文章标题','error');return;}
      try{
        const data=await api.post('/posts',{title:newPostTitle.value.trim()});
        toast('文章已创建','success');
        newPostTitle.value='';
        // Redirect to edit page
        if(data&&data.data&&data.data.path){
          // Find the post by source path
          const posts=await api.get('/posts?per_page=1');
          // Reload posts list and find the new post
          const allPosts=await api.get('/posts?per_page=999');
          const newPost=allPosts.posts.find(p=>p.source===(data.data.source||data.data.path));
          if(newPost){
            go('/posts/edit/'+newPost._id);
          }else{
            go('/posts');
          }
        }else{
          go('/posts');
        }
      }catch(e){toast(e.message,'error');}
    }

    async function loadPostForEdit(id){
      try{
        const data=await api.get('/posts/'+id);
        editor.id=data._id;
        editor.title=data.title||'';
        editor.date=data.date?new Date(data.date).toISOString().slice(0,16):'';
        editor.categoriesStr=(data.categories||[]).join(', ');
        editor.tagsStr=(data.tags||[]).join(', ');
        editor.content=data.content||'';
        // Build source content for source editor
        editor.sourceContent=data.raw||'';
        const fields=[];
        if(data.frontMatter){
          for(const[k,v]of Object.entries(data.frontMatter)){
            fields.push({key:k,value:typeof v==='object'?JSON.stringify(v):String(v)});
          }
        }
        editor.frontMatterFields=fields;
        updatePreview();
      }catch(e){toast(e.message,'error');go('/posts');}
    }

    function editPost(id){go('/posts/edit/'+id);}

    function parseSourceContent(){
      // Parse raw source content and update editor fields
      const raw=editor.sourceContent||'';
      const match=raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if(match){
        try{
          // Simple YAML-like parsing for front matter
          const fmLines=match[1].split('\n');
          const content=match[2];
          const fields=[];
          let currentKey=null;
          let currentValue='';
          for(const line of fmLines){
            const kvMatch=line.match(/^(\w[\w_-]*):\s*(.*)$/);
            if(kvMatch){
              if(currentKey){
                fields.push({key:currentKey,value:currentValue.trim()});
              }
              currentKey=kvMatch[1];
              currentValue=kvMatch[2];
            }else if(currentKey){
              currentValue+=line;
            }
          }
          if(currentKey){
            fields.push({key:currentKey,value:currentValue.trim()});
          }
          // Update editor fields
          const titleField=fields.find(f=>f.key==='title');
          const dateField=fields.find(f=>f.key==='date');
          const catsField=fields.find(f=>f.key==='categories');
          const tagsField=fields.find(f=>f.key==='tags');
          if(titleField)editor.title=titleField.value;
          if(dateField)editor.date=dateField.value;
          if(catsField)editor.categoriesStr=catsField.value.replace(/[\[\]]/g,'');
          if(tagsField)editor.tagsStr=tagsField.value.replace(/[\[\]]/g,'');
          editor.content=content;
          // Keep other fields as front matter
          editor.frontMatterFields=fields.filter(f=>!['title','date','categories','tags'].includes(f.key));
          updatePreview();
        }catch(e){
          // If parsing fails, just update preview
          editorPreview.value='<p style="color:orange">Front Matter 解析失败，请检查格式</p>';
        }
      }else{
        // No front matter, treat as content only
        editor.content=raw;
        updatePreview();
      }
    }

    function toggleSourcePreview(){
      showSourcePreview.value=!showSourcePreview.value;
      if(showSourcePreview.value)updatePreview();
    }
    async function savePost(){
      if(!editor.title){toast('标题不能为空','error');return;}
      saving.value=true;
      try{
        let body;
        if(editorMode.value==='source'){
          // In source mode, parse the raw content first
          parseSourceContent();
          // Then build the body from parsed fields
          const cats=editor.categoriesStr.split(',').map(s=>s.trim()).filter(Boolean);
          const tags=editor.tagsStr.split(',').map(s=>s.trim()).filter(Boolean);
          const fm={};
          editor.frontMatterFields.forEach(f=>{
            if(f.key.trim()){
              let v=f.value;
              try{v=JSON.parse(v);}catch(e){}
              fm[f.key.trim()]=v;
            }
          });
          body={
            title:editor.title,
            content:editor.content,
            categories:cats,
            tags:tags,
            date:editor.date?editor.date.replace('T',' ')+':00':undefined,
            frontMatter:Object.keys(fm).length?fm:undefined
          };
        }else{
          // Visual mode
          const cats=editor.categoriesStr.split(',').map(s=>s.trim()).filter(Boolean);
          const tags=editor.tagsStr.split(',').map(s=>s.trim()).filter(Boolean);
          const fm={};
          editor.frontMatterFields.forEach(f=>{
            if(f.key.trim()){
              let v=f.value;
              try{v=JSON.parse(v);}catch(e){}
              fm[f.key.trim()]=v;
            }
          });
          body={
            title:editor.title,
            content:editor.content,
            categories:cats,
            tags:tags,
            date:editor.date?editor.date.replace('T',' ')+':00':undefined,
            frontMatter:Object.keys(fm).length?fm:undefined
          };
        }
        if(editor.id){
          await api.put('/posts/'+editor.id,body);
          toast('文章已更新','success');
        }else{
          await api.post('/posts',body);
          toast('文章已创建','success');
        }
        go('/posts');
      }catch(e){toast(e.message,'error');}
      finally{saving.value=false;}
    }
    async function togglePublish(p){
      try{
        await api.put('/posts/'+p._id+'/publish',{published:!p.published});
        p.published=!p.published;
        toast(p.published?'文章已发布':'文章已转为草稿','success');
      }catch(e){toast(e.message,'error');}
    }
    function deletePost(p){
      confirmDialog.title='删除文章';
      confirmDialog.message='确定要删除「'+p.title+'」吗？此操作不可撤销。';
      confirmDialog.onOk=async()=>{
        try{
          await api.del('/posts/'+p._id);
          toast('文章已删除','success');
          loadPosts();
        }catch(e){toast(e.message,'error');}
      };
      confirmDialog.show=true;
    }
    function addFrontMatterField(){editor.frontMatterFields.push({key:'',value:''});}

    // Preview
    let previewTimer=null;
    function debouncePreview(){
      clearTimeout(previewTimer);
      previewTimer=setTimeout(updatePreview,300);
    }
    function updatePreview(){
      try{editorPreview.value=marked.parse(editor.content||'');}
      catch(e){editorPreview.value='<p style="color:red">Preview error</p>';}
    }

    // Editor enhancements
    const editorDragOver = ref(false);
    const editorUploading = ref(false);
    const editorTextarea = ref(null);

    function insertFormat(before, after) {
      const textarea = editorTextarea.value;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = editor.content || '';
      const selected = text.substring(start, end) || '文本';
      editor.content = text.substring(0, start) + before + selected + after + text.substring(end);
      nextTick(() => {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
      });
    }

    function insertCode() {
      const backtick = String.fromCharCode(96);
      insertFormat(backtick, backtick);
    }

    function insertCodeBlock() {
      const backtick = String.fromCharCode(96);
      const block = '\n' + backtick + backtick + backtick + '\n';
      insertFormat(block, block);
    }

    function insertAtCursor(text) {
      const textarea = editorTextarea.value;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const content = editor.content || '';
      editor.content = content.substring(0, start) + text + content.substring(start);
      nextTick(() => {
        textarea.focus();
        textarea.setSelectionRange(start + text.length, start + text.length);
      });
    }

    async function uploadImageFile(file) {
      if (!file || !file.type.startsWith('image/')) return;
      editorUploading.value = true;
      try {
        const fd = new FormData();
        fd.append('file', file);
        const data = await api.upload('/media/upload', fd);
        const path = data.path || data.data?.path;
        if (path) {
          const name = file.name.replace(/\.[^.]+$/, '');
          insertAtCursor('![' + name + '](' + path + ')');
          toast('图片上传成功', 'success');
        }
      } catch(e) {
        toast('图片上传失败: ' + e.message, 'error');
      } finally {
        editorUploading.value = false;
      }
    }

    function handleEditorDrop(e) {
      editorDragOver.value = null;
      const files = e.dataTransfer?.files;
      if (files && files.length) {
        for (const file of files) {
          if (file.type.startsWith('image/')) {
            uploadImageFile(file);
          }
        }
      }
    }

    function handleEditorPaste(e) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) uploadImageFile(file);
          break;
        }
      }
    }

    function insertImage() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = () => {
        if (input.files) {
          for (const file of input.files) {
            uploadImageFile(file);
          }
        }
      };
      input.click();
    }

    // Media
    const mediaSearchFilter = computed(()=>{
      const q=mediaSearch.value.toLowerCase();
      if(!q) return mediaFiles.value;
      return mediaFiles.value.filter(f=>f.name.toLowerCase().includes(q));
    });
    function isImage(name){
      return /\\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(name);
    }
    async function loadMedia(){
      mediaLoading.value=true;
      try{
        const params=new URLSearchParams();
        params.set('page',mediaPage.value);
        params.set('per_page','24');
        const data=await api.get('/media?'+params.toString());
        mediaFiles.value=data.files;
        mediaTotal.value=data.total;
        mediaTotalPages.value=data.total_pages;
      }catch(e){toast(e.message,'error');}
      finally{mediaLoading.value=false;}
    }
    async function uploadMedia(e){
      const files=e.target.files;
      if(!files.length)return;
      for(const file of files){
        const fd=new FormData();
        fd.append('file',file);
        try{
          await api.upload('/media/upload',fd);
          toast(file.name+' 上传成功','success');
        }catch(err){toast(err.message,'error');}
      }
      e.target.value='';
      loadMedia();
    }
    function copyUrl(f){
      const url=window.location.origin+'${root}'+f.path.slice(1);
      navigator.clipboard.writeText(url).then(()=>toast('链接已复制','success'));
    }
    function deleteMedia(f){
      confirmDialog.title='删除文件';
      confirmDialog.message='确定要删除「'+f.name+'」吗？';
      confirmDialog.onOk=async()=>{
        try{
          await api.del('/media/'+encodeURIComponent(f.name));
          toast('文件已删除','success');
          loadMedia();
        }catch(e){toast(e.message,'error');}
      };
      confirmDialog.show=true;
    }

    // Config
    function ensureNested(obj, defaults) {
      const result = { ...defaults };
      for (const key of Object.keys(obj)) {
        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) &&
            defaults[key] && typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
          result[key] = ensureNested(obj[key], defaults[key]);
        } else if (obj[key] !== undefined) {
          result[key] = obj[key];
        }
      }
      return result;
    }

    async function loadConfig(){
      configLoading.value=true;
      try{
        const data=await api.get('/config?type='+configType.value);
        configRaw.value=data.raw;
        if(configType.value==='site'){
          configData.value=data.parsed||{};
          // Parse deploy config
          if(data.parsed&&data.parsed.deploy){
            deployType.value=data.parsed.deploy.type||'';
            deployRepo.value=data.parsed.deploy.repo||'';
            deployBranch.value=data.parsed.deploy.branch||'';
          }
        }else{
          // Ensure all nested objects exist for Vue reactivity
          const parsed = data.parsed || {};
          themeConfigData.value = {
            info: { title:'', subtitle:'', author:'', url:'', ...(parsed.info||{}) },
            defaults: { favicon:'', logo:'', avatar:'', ...(parsed.defaults||{}) },
            colors: { primary:'', secondary:'', default_mode:'light', ...(parsed.colors||{}) },
            home_banner: {
              enable: true, style: 'fixed', title: '',
              image: { light: '', dark: '', ...((parsed.home_banner||{}).image||{}) },
              ...parsed.home_banner
            },
            articles: {
              style: { font_size:'16px', line_height:'1.5', ...(parsed.articles||{}).style },
              toc: { enable:true, max_depth:3, ...((parsed.articles||{}).toc||{}) },
              word_count: { enable:true, count:true, min2read:true, ...((parsed.articles||{}).word_count||{}) },
              ...parsed.articles
            },
            footer: { runtime:true, start:'', statistics:true, ...(parsed.footer||{}) },
            navbar: { auto_hide:true, ...(parsed.navbar||{}) },
            home: { ...(parsed.home||{}) },
            comment: { enable:false, ...(parsed.comment||{}) },
            plugins: { ...(parsed.plugins||{}) },
            inject: { enable:true, ...(parsed.inject||{}) },
            global: { ...(parsed.global||{}) },
            cdn: { enable:false, ...(parsed.cdn||{}) },
            developer: { enable:false, ...(parsed.developer||{}) }
          };
        }
      }catch(e){toast(e.message,'error');}
      finally{configLoading.value=false;}
    }
    async function saveConfig(){
      configSaving.value=true;
      try{
        if(configView.value==='raw'){
          await api.put('/config',{raw:configRaw.value,type:configType.value});
        }else{
          if(configType.value==='site'){
            const data={...configData.value};
            // Add deploy config
            if(deployType.value){
              data.deploy={type:deployType.value,repo:deployRepo.value,branch:deployBranch.value||'main'};
            }
            await api.put('/config',{data,type:'site'});
          }else{
            await api.put('/config',{data:themeConfigData.value,type:'theme'});
          }
        }
        toast('配置已保存','success');
      }catch(e){toast(e.message,'error');}
      finally{configSaving.value=false;}
    }

    // Themes
    async function loadThemes(){
      themesLoading.value=true;
      try{
        const data=await api.get('/themes');
        themes.value=data.themes;
      }catch(e){toast(e.message,'error');}
      finally{themesLoading.value=false;}
    }

    // Helpers
    function formatDate(d){
      if(!d)return'-';
      const dt=new Date(d);
      return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');
    }
    function formatSize(bytes){
      if(bytes<1024)return bytes+' B';
      if(bytes<1048576)return(bytes/1024).toFixed(1)+' KB';
      return(bytes/1048576).toFixed(1)+' MB';
    }
    function formatNumber(n){
      if(n>=10000)return(n/10000).toFixed(1)+'w';
      return String(n);
    }

    const paginationRange=computed(()=>{
      const total=postTotalPages.value;
      const current=postPage.value;
      if(total<=7)return Array.from({length:total},(_,i)=>i+1);
      const pages=[];
      pages.push(1);
      if(current>3)pages.push('...');
      for(let i=Math.max(2,current-1);i<=Math.min(total-1,current+1);i++)pages.push(i);
      if(current<total-2)pages.push('...');
      pages.push(total);
      return pages;
    });

    onMounted(async()=>{
      await verifyAuth();
      window.addEventListener('hashchange',handleHash);
      if(authenticated.value) handleHash();
    });

    return {
      authenticated,route,toasts,confirmDialog,
      loginForm,loginLoading,doLogin,doLogout,
      stats,recentPosts,cmdLoading,runCommand,
      posts,postSearch,postStatus,postPage,postTotal,postTotalPages,postsLoading,
      loadPosts,debounceLoadPosts,editPost,deletePost,togglePublish,paginationRange,
      editor,editorPreview,saving,savePost,addFrontMatterField,debouncePreview,
      editorDragOver,editorUploading,editorTextarea,insertFormat,insertCode,insertCodeBlock,insertAtCursor,uploadImageFile,handleEditorDrop,handleEditorPaste,insertImage,
      editorMode,showSourcePreview,newPostTitle,createNewPost,parseSourceContent,toggleSourcePreview,
      mediaFiles,mediaSearch,filteredMedia:mediaSearchFilter,mediaPage,mediaTotal,mediaTotalPages,
      mediaLoading,loadMedia,uploadMedia,copyUrl,deleteMedia,isImage,
      configRaw,configLoading,configSaving,saveConfig,
      configType,configView,configData,themeConfigData,
      deployType,deployRepo,deployBranch,
      themes,themesLoading,
      go,toast,formatDate,formatSize,formatNumber
    };
  }
});
app.mount('#app');
})();
<\/script>
</body>
</html>`;
}

module.exports = { getHtml };
