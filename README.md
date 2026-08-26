# hexo-admin-panel

一个功能齐全的 Hexo 管理后台插件。后端直接调用 Hexo 内部 API，管理界面使用 Vue 3 与 Vite 构建，并以静态资源随 npm 包发布。

当前版本：`3.0.0`。完整版本记录见 [CHANGELOG.md](CHANGELOG.md)。

## 3.0.0 更新摘要

- 管理后台升级为更现代的 Vue 3 工作台，页面切换增加过渡动画，并提供持久化亮色/暗色双模式。
- 文章编辑支持仅 Markdown、仅预览和分栏视图，Markdown 源码高亮，预览尽量贴近 Redefine 主题渲染，并支持 `cover` 首图上传。
- 新增 About 关于页面编辑，可编辑 `source/about/index.md` 的 Markdown、Front Matter 和完整源码。
- “说说管理”统一为“随笔管理”，支持随笔内容的专业化编辑和预览。
- 媒体资源支持安全重命名，保留扩展名校验、同名冲突保护和回收站能力。
- Redefine 配置表单优先读取 YAML 中文注释，配置项支持悬浮说明，颜色字段支持 Hex/RGB(A)/HSL(A) 色块预览。
- 配置保存或恢复后自动清理、重新生成并重启 Hexo，管理页会等待服务恢复后自动刷新。
- 补充 About、媒体重命名、亮暗模式、主题配置元数据和界面暗色覆盖测试。

## 2.0.0 更新摘要

- 后端重组为功能模块、统一路由包装器、Repository 和共享纯函数。
- 管理界面迁移到 Vue 3 + Vite，移除旧版内联页面及运行时 CDN 依赖。
- 修复异步路由崩溃、Front Matter 被破坏和 Markdown 预览 XSS。
- 增加首次登录强制改密、登录限流、上传内容签名检查和统一错误代码。
- 增加文章并发冲突保护、回收站、配置备份以及说说 YAML 备份。
- Redefine 主题配置改为由后端 schema 统一描述，支持 npm 主题与站点覆盖配置。
- 增加 Redefine 说说管理和一键重新构建、重启 Hexo 服务。
- 补充后端 API、纯函数、Vue 组件和 npm 打包检查。

从 1.x 升级时请注意：前端开发环境需要 Node.js 20.19+；生产使用仍直接加载 npm 包内的预构建资源。若此前依赖默认 `admin/admin`，升级后首次登录必须立即修改密码；凭据、回收站和备份保存在 `.hexo-admin/`，请确保该目录不会被公开部署。

## 功能特性

- JWT 身份认证
- 文章增删改查（CRUD）
- 草稿/发布状态切换
- Front Matter 可视化编辑
- Markdown 实时预览
- Markdown 源码高亮、分栏/仅 Markdown/仅预览视图
- 文章首图 `cover` 字段上传和预览
- 亮色/暗色双模式与页面切换动画
- Redefine 随笔（`source/_data/essays.yml`）编写、编辑和删除
- 随笔并发冲突保护与自动备份
- About 关于页面编辑（`source/about/index.md`）
- 媒体文件管理（上传/重命名/删除/浏览）
- 文章与媒体回收站（恢复/永久删除）
- 文章并发编辑冲突保护
- 站点和主题配置自动备份与恢复
- 上传扩展名、大小和文件签名校验
- 分类管理
- 标签管理
- 站点配置查看与编辑
- 仪表盘统计（文章数、字数、分类数、标签数）
- 一键生成/部署/清理缓存，以及重新构建并重启 Hexo 服务
- 主题列表
- Redefine 中文配置说明、悬浮提示和颜色预览
- 分页、搜索
- 响应式前端（Vue 3 + Vite 本地构建）
- 全中文界面

## 安装

```bash
npm install hexo-admin-panel
```

或在 `package.json` 中添加：

```json
{
  "dependencies": {
    "hexo-admin-panel": "^3.0.0"
  }
}
```

然后执行 `npm install`。

## 配置

在 `_config.yml` 中添加以下内容：

```yaml
admin:
  username: admin
  password: your-secure-password
  jwt_secret: your-random-secret-string
  token_expiry: 24h
  security:
    login_max_attempts: 5
    login_window_minutes: 15
    login_lock_minutes: 15
  uploads:
    max_file_size: 10485760
    max_request_size: 52428800
    max_files: 10
    allowed_extensions: [.jpg, .jpeg, .png, .gif, .webp, .bmp, .ico, .pdf, .zip, .mp3, .mp4]
```

或在 Hexo 根目录下创建单独的 `_admin-config.yml` 文件：

```yaml
admin:
  username: admin
  password: your-secure-password
  jwt_secret: your-random-secret-string
  token_expiry: 24h
```

### 配置优先级

1. `.hexo-admin/state.yml` 中已经初始化的凭据状态（只覆盖账号凭据和 JWT 密钥）
2. `hexo.config.admin`（来自 `_config.yml` 的 `admin:` 字段）
3. `_admin-config.yml` 文件
4. 内置一次性默认账号（admin/admin）

### 首次登录与安全文件

如果没有配置管理员账号，插件会临时启用一次性 `admin/admin`。首次登录只能进入改密页面；设置至少 12 个字符的新密码后才能访问后台其他功能。新密码使用随机盐哈希保存，并同时轮换 JWT 密钥。

凭据状态、回收站和配置备份保存在 Hexo 根目录的 `.hexo-admin/` 中。该目录包含敏感状态和可恢复数据，必须加入站点仓库的 `.gitignore`，也不应部署到公开目录。

随笔写入前的 YAML 快照保存在 `.hexo-admin/backups/essays/`，最多保留最近 20 份。首次通过后台修改旧随笔数据时，插件会为条目补充稳定 `id`；Redefine 会忽略该辅助字段。

登录默认在 15 分钟窗口内允许失败 5 次，超限后锁定 15 分钟。上传默认限制为单文件 10 MiB、单请求 50 MiB、最多 10 个文件；文件扩展名必须与内容签名匹配，SVG 默认并且强制禁用。

## 使用方法

1. 启动 Hexo 服务器：

```bash
hexo server
```

2. 打开浏览器访问：

```
http://localhost:4000/admin
```

3. 使用配置的账号密码登录。

## 本地开发

前端构建与测试需要 Node.js 20.19+；已经发布到 npm 的构建产物不要求用户安装 Vite。

在 Hexo 项目的 `package.json` 中使用本地文件依赖：

```json
{
  "dependencies": {
    "hexo-admin-panel": "file:../hexo-admin-panel"
  }
}
```

安装依赖并启动 Hexo：

```bash
cd hexo-admin-panel
npm install

cd ../blog
npm install
npm run server
```

前端热更新开发时，在另一个终端执行：

```bash
cd hexo-admin-panel
npm run dev
```

Vite 默认运行在 `http://localhost:5173`，并将 `/admin/api` 代理到 `http://localhost:4000`。

仪表盘的“一键重建并重启”会依次执行 `hexo clean`、`hexo generate`，成功后由独立辅助进程接管同一端口并重新启动 `hexo server`。新进程输出保存在 Hexo 项目的 `.hexo-admin/restart.log`；此功能适合本地直接运行 `hexo server` 的开发环境。

常用开发命令：

| 命令 | 用途 |
|---|---|
| `npm run dev` | 启动 Vue/Vite 热更新开发服务器 |
| `npm run build` | 构建 `dist/admin` 静态资源 |
| `npm run test:node` | 运行纯函数和 API 测试 |
| `npm run test:ui` | 运行 Vue 组件测试 |
| `npm test` | 运行全部测试 |
| `npm run check` | 运行全部测试并验证生产构建 |

发布 npm 包前会自动运行 `npm run check`。

## 项目结构

```text
lib/
├─ plugin/       Hexo 插件配置和中间件挂载
├─ server/       路由、请求、响应、鉴权和错误边界
├─ modules/      auth/posts/about/essays/media/config/themes/commands 等功能模块
├─ repositories/ 受路径约束的文件仓储层
└─ shared/       路径、文本和操作队列等通用能力

admin/src/
├─ api/          浏览器 API 客户端
├─ components/   通用界面组件
├─ layouts/      后台布局
├─ pages/        功能页面
├─ composables/  可复用界面状态
├─ utils/        Markdown 与服务端 schema 消费工具
└─ styles/       全局设计样式
```

主题配置的字段、类型、标签、分区和版本兼容信息只由后端 `lib/modules/themes/adapters/` 生成。Vue 前端使用通用 schema 表单渲染，不维护第二份 Redefine 字段表。

## API 接口

所有接口以 `/admin/api` 为前缀。

| 接口 | 方法 | 用途 |
|---|---|---|
| `/auth/login` | POST | 登录，返回 JWT |
| `/auth/verify` | GET | 验证令牌 |
| `/auth/change-password` | POST | 首次登录或主动修改密码 |
| `/posts` | GET | 文章列表（分页、搜索、筛选） |
| `/posts/:id` | GET | 获取单篇文章 |
| `/posts` | POST | 新建文章 |
| `/posts/:id` | PUT | 更新文章 |
| `/posts/:id` | DELETE | 删除文章 |
| `/posts/:id/publish` | PUT | 切换草稿/发布状态 |
| `/about` | GET | 获取 About 页面 |
| `/about` | PUT | 更新 About 页面 |
| `/about/source/parse` | POST | 解析 About Markdown 源码 |
| `/about/source/build` | POST | 构建 About Markdown 源码 |
| `/essays` | GET | 获取随笔列表及数据 revision |
| `/essays` | POST | 新建随笔 |
| `/essays/:id` | PUT | 更新随笔 |
| `/essays/:id` | DELETE | 删除随笔 |
| `/categories` | GET | 获取所有分类 |
| `/tags` | GET | 获取所有标签 |
| `/media` | GET | 媒体文件列表 |
| `/media/upload` | POST | 上传文件 |
| `/media/:filename/rename` | PUT | 重命名媒体文件 |
| `/media/:filename` | DELETE | 删除媒体文件 |
| `/trash` | GET | 回收站列表 |
| `/trash/:id/restore` | POST | 恢复回收项 |
| `/trash/:id` | DELETE | 永久删除回收项 |
| `/config` | GET | 读取 _config.yml |
| `/config` | PUT | 写入 _config.yml |
| `/config/backups` | GET | 配置备份列表 |
| `/config/backups/:id/restore` | POST | 恢复配置备份 |
| `/stats` | GET | 仪表盘统计数据 |
| `/themes` | GET | 已安装主题列表 |
| `/commands/generate` | POST | 执行 hexo generate |
| `/commands/deploy` | POST | 执行 hexo deploy |
| `/commands/clean` | POST | 执行 hexo clean |
| `/commands/rebuild` | POST | 依次清理并重新生成站点 |
| `/commands/rebuild-restart` | POST | 重新构建并交接重启 Hexo 服务 |

### API 错误

失败响应统一为 `{ "success": false, "error": "...", "code": "..." }`。常用稳定错误码包括 `VALIDATION_ERROR`、`INVALID_JSON`、`INVALID_URL`、`UNAUTHORIZED`、`PASSWORD_CHANGE_REQUIRED`、`POST_REVISION_CONFLICT`、`ESSAYS_REVISION_CONFLICT`、`REVISION_REQUIRED`、`UPLOAD_CONTENT_MISMATCH` 和 `INTERNAL_ERROR`。界面逻辑应判断 `code`，不要依赖可能翻译或调整的错误文案。

## 许可证

MIT
