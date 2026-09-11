<p align="center">
  <a href="https://github.com/Skylarrkuo/hexo-admin-panel">
    <img src="./assets/hexo-admin-panel-logo.svg" width="120" alt="Hexo Admin Panel Logo">
  </a>
</p>

<h1 align="center">Hexo Admin Panel</h1>

<p align="center">
  <strong>简体中文</strong> · <a href="./README_EN.md">English</a>
</p>

<p align="center">
  一个直接运行在 Hexo 进程内、本地优先、以 Markdown 与 YAML 为内容源的博客管理工作台。
</p>

<p align="center">
  不引入内容数据库，不改变 Hexo 的发布方式，也不要求额外部署后端服务。
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/hexo-admin-panel"><img alt="npm version" src="https://img.shields.io/npm/v/hexo-admin-panel?style=flat-square&color=8b5961"></a>
  <a href="https://github.com/Skylarrkuo/hexo-admin-panel/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Skylarrkuo/hexo-admin-panel/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/Skylarrkuo/hexo-admin-panel/blob/master/LICENSE"><img alt="MIT License" src="https://img.shields.io/npm/l/hexo-admin-panel?style=flat-square&color=8b5961"></a>
  <img alt="Node.js 20 or newer" src="https://img.shields.io/badge/Node.js-%3E%3D20-8b5961?style=flat-square">
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> ·
  <a href="#功能概览">功能概览</a> ·
  <a href="#配置">配置</a> ·
  <a href="#本地开发">本地开发</a> ·
  <a href="#开源许可与引用">开源许可</a>
</p>

---

## 项目定位

Hexo Admin Panel 面向希望保留 Hexo 文件工作流，同时获得完整图形化管理体验的站点维护者。管理端通过 `/admin` 挂载在现有 Hexo 服务上，所有内容仍保存在站点目录中，可以继续使用 Git、编辑器、CI 和原有部署脚本。

| 原则 | 实现 |
| --- | --- |
| 文件仍是唯一内容源 | 直接读写 `source/`、`scaffolds/` 和主题覆盖配置，不维护影子数据库 |
| 预览等于真实站点 | 调用当前 Hexo 实例临时构建，保留实际主题、插件与 permalink |
| 写入必须可恢复 | revision 冲突检测、原子写入、回收站和变更前备份 |
| 发布过程可观察 | 定时日历、任务进度、Hexo 输出日志、取消、重试与历史记录 |

```text
浏览器中的 Vue 管理端
          │  /admin/api
          ▼
    当前 Hexo 进程
     ├─ source/          Markdown、页面与媒体
     ├─ scaffolds/       Hexo 内容模板
     ├─ _config*.yml     站点与主题配置
     └─ .hexo-admin/     私有状态、备份、任务与日志
```

## 功能概览

### 内容创作

- 创建、编辑、发布、撤回和回收文章，支持全文检索与批量操作。
- 使用站点现有的 `scaffolds/*.md` 创建内容，在新建时选择模板。
- 提供草稿、未完成、待审核、计划中和已发布工作流状态。
- Front Matter 可视化编辑保留字符串、数字、布尔值、空值、数组和对象的原始类型。
- 编辑器支持完整源码、Markdown、分栏预览、本地自动保存和未保存离开保护。
- 分类与标签使用可搜索、可创建的选择器，不再依赖自由文本输入。

### 页面、分类与站点结构

- 通用管理 `source/**/index.md` 及 `source/` 下其他独立 Markdown 页面。
- 创建页面时可选择 Hexo scaffold、页面 layout 和源码路径。
- 识别常见主题的 `navbar.links` 或 `menu` 配置，并维护菜单顺序。
- 分类标签中心提供文章使用统计、合并、重命名和删除。
- 提供 Redefine 主题配置与 `source/_data/essays.yml` 随笔管理；支持勾选批量编辑、粘贴拆分批量添加、统一时间和 Markdown 预览，每批最多 100 条，整批校验后一次保存。
- 站点配置、主题配置、文章、页面与随笔写入均带 revision，防止并发静默覆盖。

### 媒体资源

- 递归管理 `source/images` 及其子目录，以完整相对路径区分同名资源。
- 服务端搜索整个媒体库，并分析 source 中的 Markdown、YAML、JSON、HTML、CSS，以及站点根目录 `_config*.yml` / `.yaml` 中的静态引用；外部站点同路径图片不会算作本地引用。
- 可筛选“扫描范围内无引用”的资源；主题源码、插件和动态生成的引用不在扫描范围内，该筛选不保证资源可以安全删除。
- 重命名前展示受影响文件，确认后校验预览版本并同步修改引用；修改前备份，写入或刷新失败时回滚。修改了配置引用后需重启 Hexo 使运行中的配置生效。
- 支持 JPEG、PNG 与 WebP 压缩；仅在结果更小时替换，并保留原图备份。
- 上传同时校验数量、请求体大小、扩展名、MIME 和文件签名；禁止 SVG 上传。

### 真实预览与发布中心

- 对文章和独立页面执行临时 Hexo 构建，在 sandbox iframe 中展示真实主题、插件和 permalink；预览响应本身也强制隔离，使新窗口打开同样无法读取后台的存储或页面。
- 真实预览使用随机 token，默认 30 分钟失效，服务重启时清理临时目录。
- 发布中心以月历展示计划任务，并保留完成、失败和取消历史。
- 定时发布支持失败自动重试、手动重试、自定义重试次数与间隔。
- `generate`、`deploy`、`clean` 和 `rebuild` 均作为后台任务运行。
- 任务提供排队、执行、取消、完成、失败等状态，以及进度、日志、重试与取消操作。

### 可靠性、安全与体验

- 首次登录强制改密；已有明文凭据自动迁移为 PBKDF2 哈希并轮换 JWT 密钥。
- 管理页与 API 设置 CSP、点击劫持防护、MIME 嗅探防护、Referrer Policy 和 Permissions Policy。
- 登录按连接来源地址限流，记录自动过期清理，最多 1024 条；达到容量上限时拒绝新来源，不驱逐仍有效的锁定记录。
- PBKDF2 使用异步计算，整个进程最多同时执行 2 个、排队 8 个任务；超额返回 `429 AUTH_BUSY`，避免阻塞 Hexo 主线程。
- 普通退出撤销当前 token，侧栏“退出所有会话”持久化轮换签名密钥。退出失败时界面保留会话并提示重试，不把本地清除伪装成服务端撤销。
- 文件操作同时验证路径字符串和真实路径，拒绝通过符号链接、Windows junction 或其下尚未创建的目标逃出站点目录；站点内链接可继续使用。
- 批量发布、撤回或回收全部完成后只刷新一次 Hexo source。
- 中文与 English 界面、亮色与暗色模式，以及桌面和移动端布局。
- 管理首页与发布中心集中展示命令任务状态和 Hexo 原始输出日志。

## 内容版本与完整发布流程

- 文章、页面提供保存历史、当前版本差异、恢复和三方合并。独立修改可以自动合并；同一区域冲突保留原版本、本地修改和服务器版本，手动处理后再保存。
- 文章、页面、新建文章、随笔、About 和配置编辑均保留本机草稿；断线、离开或登录过期不会清除草稿。恢复草稿保留原 revision，避免覆盖服务器新内容。
- 编辑器可“保存并进入发布流程”。发布中心按 **保存版本确认 → 内容检查 → 构建 → 部署 → 线上验证** 执行并保留逐步记录、内容 revision 和构建输出哈希。
- “已加入站点”仅表示进入 Hexo 内容源。完整流程只有在线上发布标记和本次 HTML 构建逐字节一致时才显示验证通过。配置文件修改后必须先重启；流程执行期间拒绝后台内容写入，并在阶段边界检测外部修改。
- 内容检查覆盖缺标题、常见 Front Matter 类型错误、重复 permalink、缺图、站内死链、引用式链接、`asset_img` 资源和代码块语言遗漏。结果显示文件、字段、行号和编辑入口；错误阻止完整发布，缺语言为警告。默认检查进入站点的内容，可额外检查草稿；原始命令入口仍可单独执行 Hexo 命令。
- 按文章查看公共媒体引用，管理文章资源目录的上传、重命名同步引用、删除影响预览；开启 `post_asset_folder` 时创建同名目录，并随草稿发布一起迁移。新文章文件名支持 Hexo 文档中的全部日期占位符、`:hash`，以及 Front Matter 或 `permalink_defaults` 中的自定义占位符（含 `:lang`）；媒体 URL 与时间输入适配站点子路径和时区。
- 恢复中心集中展示内容历史及可定位目标的配置、随笔、菜单、分类和媒体旧备份；文本预览差异，图片比较当前文件与原图，再以当前 revision 确认恢复。旧批量备份按文件恢复，界面注明目标和保留策略。
- 配置表单使用 YAML 文档编辑保留注释，只写变化的覆盖值；可查看主题默认值与覆盖值、删除覆盖恢复默认，并在保存前校验字段和确认差异。

历史内容位于 `.hexo-admin/history/`：每个文本最多 50 个不同版本、每个二进制资源最多 5 个，总共最多 10000 个版本、512 MiB；按数量和容量裁剪，没有固定天数过期。旧模块备份沿用原保留策略，恢复中心显示其可定位部分的磁盘占用。历史会随后台内的文件迁移更新位置；插件不会持续监听外部编辑器的每次落盘，但下一次后台写入会先备份外部的当前内容。

线上验证最多 2000 个 HTML 文件，每个文件不超过 10 MiB，每次请求超时 15 秒。CDN 延迟、HTML 自动改写、重定向或部署排除发布标记会导致“部署完成但验证失败”，不会误记为已验证。部署后的外部传播不能回滚；修正问题后重新检查和发布。动态模板、外部链接可用性和跨文章动态资源引用不在静态检查范围内。

详细入口、接口与恢复边界见 [内容与发布工作流](docs/workflows.md)。Hexo 适配规则参考 [写作与文件名](https://hexo.io/zh-cn/docs/writing) 和 [文章资源目录](https://hexo.io/zh-cn/docs/asset-folders)。

## 环境要求

- Node.js `>= 20.0.0`
- Hexo `>= 4.0.0`
- 一个可以正常执行 `hexo server`、`hexo generate` 的 Hexo 站点

普通用户使用 npm 包中已经构建好的管理端资源，不需要单独安装或启动 Vite。

> [!IMPORTANT]
> 管理后台拥有内容写入和部署执行权限。不要把 `/admin` 直接暴露在不受信任的公网环境中；远程使用时应置于 HTTPS、可信反向代理、私有网络或额外访问控制之后。

## 快速开始

### 1. 安装

在 Hexo 站点根目录执行：

```bash
npm install hexo-admin-panel
```

### 2. 初始化管理员

推荐在站点根目录新建 `_admin-config.yml`，只把密码作为首次初始化凭据：

```yaml
admin:
  username: admin
  password: replace-with-a-long-temporary-password
```

首次启动时，插件会将密码转换为 PBKDF2 哈希，生成随机 JWT 密钥并保存到 `.hexo-admin/state.yml`，随后自动从 `_admin-config.yml` 删除 `password`、`password_hash` 和 `jwt_secret` 字段。

未配置密码时，插件会在启动 Hexo 的本机终端显示随机一次性初始化凭据（默认用户名 `admin`，密码为 24 字节随机值）。初始化密码不写入配置或状态文件，服务重启后重新生成；登录后必须设置不少于 12 个字符的正式密码。设置成功后，初始化凭据及此前签发的 token 立即失效。旧的未初始化 `admin/admin` 配置也会改用随机凭据。

### 3. 启动并登录

```bash
npx hexo server
```

打开 [http://localhost:4000/admin](http://localhost:4000/admin)。如果站点配置了非根路径，管理端会自动跟随 Hexo 的 `root` 配置。

### 4. 保护本地状态

将以下路径加入站点的 `.gitignore`：

```gitignore
.hexo-admin/
_admin-config.yml
```

`.hexo-admin/` 包含凭据状态、回收内容、配置备份、任务记录和部署日志，不应进入公开仓库或站点产物。

会话撤销记录保存在 `.hexo-admin/revoked-sessions.json`，服务重启后仍生效。最多保留 1024 条尚未过期的撤销记录，达到上限时通过轮换签名密钥撤销全部旧会话，避免丢弃有效撤销记录。API 为 `POST /admin/api/auth/logout` 和 `POST /admin/api/auth/logout-all`，均需携带当前 Bearer token。限流使用真实连接来源，不信任请求自行提供的代理地址头。

## 核心使用流程

### 从模板创建内容

在“新建文章”中选择站点 `scaffolds/` 目录下的模板，再选择工作流状态。草稿、未完成和待审核内容写入 `source/_drafts`；立即发布的内容写入 `source/_posts`；计划内容会同时创建持久化定时任务。

### 类型安全地编辑

表单模式适合修改常用字段，完整源码模式适合维护自定义 Front Matter。未知字段会被保留，标量和复合值不会因为表单往返而被意外转换。保存时必须携带当前 revision；源文件被其他窗口或外部程序修改后，旧请求会返回 `409`。

文章、页面创建和保存若已完成文件写入，但 Hexo source 刷新失败，API 仍返回成功和新 revision，同时返回 `saved: true`、`refreshed: false`、`warning.code: SOURCE_REFRESH_FAILED`。界面明确提示内容已落盘，请检查服务日志并在修复后重建，无需重复提交内容。

### 验证真实主题

编辑文章或页面并保存后，选择“真实主题预览”。插件会以当前 Hexo 配置、主题和插件临时生成目标页面，再在 iframe 中展示最终结果。该预览会真实执行 Hexo 生成过程，因此应把主题或第三方插件的构建代码视为可信代码。浏览器预览使用不含 `allow-same-origin` 的响应级 sandbox，允许脚本运行，但禁止访问后台存储、提交表单、弹窗及顶层跳转；依赖这些能力的主题功能在预览中受限。

### 安排与追踪发布

发布中心同时展示定时任务和 Hexo 命令任务。定时发布依赖 Hexo 服务持续运行；服务短暂停止后，下一轮检查会继续处理已到期任务。默认最多尝试 3 次，失败后每 5 分钟重试，也可在创建任务时调整。已结束的历史最多保留 200 条，待执行、重试中和运行中的任务不参与裁剪。日历及任务时间使用 Hexo `timezone`；未设置时使用服务端时区，非法时区回退 UTC，界面显示实际使用的时区。

### 恢复误操作

删除文章、页面或媒体默认进入 `.hexo-admin/trash/`。配置、随笔、菜单、分类标签和媒体压缩会在修改前建立对应备份；需要永久删除时再从回收站明确操作。

## 配置

配置可以放在 Hexo `_config.yml` 的 `admin` 节点，也可以放在独立的 `_admin-config.yml`。推荐使用独立文件完成首次初始化，以便插件迁移后自动清除明文凭据。

```yaml
admin:
  username: admin
  password: replace-with-a-long-temporary-password
  token_expiry: 24h

  security:
    login_max_attempts: 5
    login_window_minutes: 15
    login_lock_minutes: 15

  uploads:
    max_file_size: 10485760
    max_request_size: 52428800
    max_files: 10
    allowed_extensions:
      - .jpg
      - .jpeg
      - .png
      - .gif
      - .webp
      - .bmp
      - .ico
      - .pdf
      - .zip
      - .mp3
      - .mp4
```

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `admin.username` | `admin` | 管理员用户名 |
| `admin.password` | 未设置时随机生成 | 配置的密码用于首次迁移；随机初始化凭据登录后必须改密 |
| `admin.jwt_secret` | 自动迁移或生成 | 可选；有效值至少 32 个字符，初始化后由私有状态接管 |
| `admin.token_expiry` | `24h` | 登录令牌有效期，格式如 `30m`、`24h`、`7d` |
| `admin.security.login_max_attempts` | `5` | 统计窗口内允许的登录失败次数 |
| `admin.security.login_window_minutes` | `15` | 登录失败统计窗口，单位为分钟 |
| `admin.security.login_lock_minutes` | `15` | 超限后的锁定时间，单位为分钟 |
| `admin.uploads.max_file_size` | `10485760` | 单个文件上限，单位为字节 |
| `admin.uploads.max_request_size` | `52428800` | 单次上传请求上限，单位为字节 |
| `admin.uploads.max_files` | `10` | 单次请求允许上传的文件数量 |
| `admin.uploads.allowed_extensions` | 见示例 | 允许上传的扩展名；SVG 始终禁止 |

配置合并优先级由高到低为：

1. `.hexo-admin/state.yml` 中已初始化的用户名、密码哈希与 JWT 密钥
2. Hexo `_config.yml` 中的 `admin` 配置
3. `_admin-config.yml`
4. 插件默认值

从旧版本升级时，非默认明文密码会在启动阶段自动迁移并轮换 JWT 密钥。独立配置文件中的凭据会被自动清除；若明文凭据写在 Hexo `_config.yml` 中，请在确认迁移成功后手动删除 `password`、`password_hash` 和 `jwt_secret`。

## 数据与备份

| 内容 | 保存位置 |
| --- | --- |
| 已发布文章 | `source/_posts/` |
| 草稿与其他未发布状态 | `source/_drafts/` |
| 独立页面 | `source/**/index.md` 或其他非文章 Markdown |
| Hexo 内容模板 | `scaffolds/*.md` |
| 媒体资源 | `source/images/` |
| Redefine 随笔 | `source/_data/essays.yml` |
| 管理员私有状态 | `.hexo-admin/state.yml` |
| 回收站 | `.hexo-admin/trash/` |
| 配置与随笔备份 | `.hexo-admin/backups/` |
| 媒体原图备份 | `.hexo-admin/backups/media/` |
| 分类标签变更备份 | `.hexo-admin/backups/taxonomies/` |
| 主题菜单变更备份 | `.hexo-admin/backups/menu/` |
| 定时发布记录 | `.hexo-admin/scheduled-posts.json` |
| Hexo 命令任务与日志 | `.hexo-admin/jobs/` |
| 临时真实主题预览 | `.hexo-admin/previews/` |
| 服务重启日志 | `.hexo-admin/restart.log` |

随笔修改前默认保留最近 20 份 YAML 快照；媒体压缩默认保留最近 5 份原图备份。主题菜单保存后需要重新构建或重启 Hexo 才会由主题重新加载。

## 兼容性与运行边界

- 通用内容、媒体、发布和命令能力不绑定特定主题。
- Redefine 提供专用的配置元数据和随笔管理；其他主题通过通用 YAML 配置编辑器管理。
- 菜单顺序当前识别常见的 `navbar.links` 和 `menu` 结构，主题使用自定义导航结构时需要直接编辑主题覆盖配置。
- 定时发布调度器运行在 Hexo 进程内；主机休眠或 Hexo 停止期间不会触发，到期任务会在服务恢复后继续处理。
- “重新构建并重启”面向直接运行 `hexo server` 的本地环境。由进程管理器或容器托管时，建议使用外部编排方式完成重启。
- 真实主题预览会执行当前站点的生成器、渲染器和插件；构建时间与站点规模及插件行为有关。

## API 与任务模型

所有管理接口使用 `/admin/api` 前缀。失败响应具有稳定的机器可读错误码：

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

客户端应依据 `code` 分支处理，不要依赖可能本地化的 `error` 文案。

`generate`、`deploy`、`clean`、`rebuild` 和真实预览会返回 HTTP `202` 与任务对象。命令任务状态包括：

```text
queued → running → completed
                 ↘ failed
                 ↘ cancelling → cancelled
```

常用接口：

| 资源 | 接口 |
| --- | --- |
| 文章与工作流 | `/admin/api/posts` |
| 独立页面与菜单 | `/admin/api/pages` |
| 分类标签中心 | `/admin/api/taxonomies` |
| Hexo scaffolds | `/admin/api/scaffolds` |
| 定时发布 | `/admin/api/schedules` |
| 真实构建预览 | `/admin/api/previews` |
| 命令任务与日志 | `/admin/api/commands/jobs` |

媒体重命名先调用 `POST /admin/api/media/:filename/rename-preview`，传入 `{name}`，取得受影响文件和 `revision`；确认后调用 `PUT /admin/api/media/:filename/rename`，传入 `{name, revision}`。检测到引用时必须提交预览版本；文件或扫描内容发生变化时返回 `409 MEDIA_RENAME_CONFLICT`。备份保存在 `.hexo-admin/backups/media/rename-*/`，`manifest.json` 记录原路径、备份文件和回滚状态。

## 本地开发

克隆仓库并安装锁定依赖：

```bash
git clone https://github.com/Skylarrkuo/hexo-admin-panel.git
cd hexo-admin-panel
npm ci
```

运行完整质量检查：

```bash
npm run check
```

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Vite 前端开发服务器 |
| `npm run build` | 构建管理端生产资源 |
| `npm run test:node` | 运行后端与结构测试 |
| `npm run test:ui` | 运行 Vue 组件测试 |
| `npm run test:browser` | 使用本机 Chrome/Chromium/Edge 验证预览隔离；支持 `CHROME_BIN`，未发现浏览器时跳过 |
| `npm test` | 运行全部测试 |
| `npm run lint` | 检查 Node、Vue 和测试源码 |
| `npm run coverage` | 生成 Node 与前端覆盖率报告 |
| `npm run check` | 依次执行 lint、全部测试和生产构建 |

在真实 Hexo 站点中联调时，可以把插件声明为本地文件依赖：

```json
{
  "dependencies": {
    "hexo-admin-panel": "file:../hexo-admin-panel"
  }
}
```

Vite 开发服务器默认运行在 `http://localhost:5173`，并将 `/admin/api` 代理到 `http://localhost:4000`。

### 项目结构

```text
hexo-admin-panel/
├─ index.js                 Hexo 插件入口
├─ lib/
│  ├─ plugin/               配置、注册与中间件
│  ├─ server/               路由、鉴权和请求处理
│  ├─ modules/              按领域拆分的业务模块
│  ├─ repositories/         受站点根目录约束的文件访问层
│  └─ shared/               通用工具
├─ admin/src/
│  ├─ api/                  管理端 API 客户端
│  ├─ components/           可复用界面组件
│  ├─ composables/          状态与交互逻辑
│  ├─ layouts/              管理端布局
│  ├─ pages/                功能页面
│  ├─ styles/               主题与响应式样式
│  └─ utils/                Markdown、Front Matter 与配置工具
├─ assets/                  项目标识
└─ test/                    Node、API 与结构测试
```

持续集成在 Node.js 20 和 22 上执行 lint、测试、覆盖率、生产构建与 npm 打包检查。发布前的 `prepack` 也会运行 `npm run check`。

## 参与贡献

欢迎提交缺陷报告、功能建议和 Pull Request。

1. 先在 [Issues](https://github.com/Skylarrkuo/hexo-admin-panel/issues) 中确认是否已有相关讨论。
2. Fork 仓库并从独立分支实现变更。
3. 为行为变化补充测试，并确保 `npm run check` 通过。
4. 在 Pull Request 中说明使用场景、实现取舍和验证结果；界面变更请附截图。

涉及凭据、路径边界、任意文件写入、命令执行或 HTML 清理的安全问题，请避免在公开 Issue 中披露可直接利用的细节，优先通过 GitHub 仓库维护者的私密渠道报告。

## 版本与发布

当前版本为 `3.5.0`。项目遵循语义化版本规范，详细变更见 [CHANGELOG.md](./CHANGELOG.md)。

README：<strong>简体中文</strong> · [English](./README_EN.md)

- [GitHub 源码仓库](https://github.com/Skylarrkuo/hexo-admin-panel)
- [npm 软件包](https://www.npmjs.com/package/hexo-admin-panel)
- [问题与功能建议](https://github.com/Skylarrkuo/hexo-admin-panel/issues)

## 开源许可与引用

Hexo Admin Panel 及原创 Logo `assets/hexo-admin-panel-logo.svg` 由 Skylarr Kuo 基于 [MIT License](./LICENSE) 发布。使用、修改或分发本项目时，请保留版权与许可声明。

本项目直接依赖、集成或随浏览器产物打包以下开源组件：

| 组件 | 使用范围 | 版权归属 | 许可证 |
| --- | --- | --- | --- |
| [Hexo](https://github.com/hexojs/hexo) `>=4.0.0` | 对等依赖；站点生成器与插件宿主 | Copyright (c) 2012-present Tommy Chen | [MIT](https://github.com/hexojs/hexo/blob/master/LICENSE) |
| [hexo-front-matter](https://github.com/hexojs/hexo-front-matter) `^4.2.1` | 运行时；解析与序列化 Front Matter | Package author Tommy Chen；各贡献者保留其贡献版权 | [MIT](https://github.com/hexojs/hexo-front-matter/blob/master/package.json) |
| [js-yaml](https://github.com/nodeca/js-yaml) `^4.3.1` | 运行时；解析与序列化 YAML | Copyright (C) 2011-2015 Vitaly Puzrin | [MIT](https://github.com/nodeca/js-yaml/blob/master/LICENSE) |
| [sharp](https://github.com/lovell/sharp) `^0.34.4` | 运行时；图像元数据与压缩 | Copyright 2013 Lovell Fuller and others | [Apache-2.0](https://github.com/lovell/sharp/blob/main/LICENSE) |
| [Vue](https://github.com/vuejs/core) `3.5.41` | 浏览器产物；管理端运行时 | Copyright (c) 2018-present, Yuxi (Evan) You | [MIT](https://github.com/vuejs/core/blob/main/LICENSE) |
| [marked](https://github.com/markedjs/marked) `15.0.12` | 浏览器产物；Markdown 转换 | Copyright (c) 2018+ MarkedJS；2011-2018 Christopher Jeffrey；Markdown syntax © 2004 John Gruber | [MIT / BSD notice](https://github.com/markedjs/marked/blob/master/LICENSE.md) |
| [DOMPurify](https://github.com/cure53/DOMPurify) `3.4.14` | 浏览器产物；HTML 安全清理 | Copyright (c) Cure53 and other contributors | [Apache-2.0 OR MPL-2.0](https://github.com/cure53/DOMPurify/blob/main/LICENSE) |

完整用途、版权与源码引用见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。该文件随 npm 包发布；上述组件仍分别受其原许可证与版权声明约束。

---

<p align="center">
  Made for a transparent, file-first Hexo workflow.
</p>
