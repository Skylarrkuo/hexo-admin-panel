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
- 提供 Redefine 主题配置与 `source/_data/essays.yml` 随笔管理。
- 站点配置、主题配置、文章、页面与随笔写入均带 revision，防止并发静默覆盖。

### 媒体资源

- 递归管理 `source/images` 及其子目录，以完整相对路径区分同名资源。
- 服务端搜索整个媒体库，并分析 Markdown、YAML、JSON、HTML 与 CSS 中的路径级引用。
- 可筛选未使用资源，安全重命名或移入回收站。
- 支持 JPEG、PNG 与 WebP 压缩；仅在结果更小时替换，并保留原图备份。
- 上传同时校验数量、请求体大小、扩展名、MIME 和文件签名；禁止 SVG 上传。

### 真实预览与发布中心

- 对文章和独立页面执行临时 Hexo 构建，在同源 iframe 中展示真实主题、插件和 permalink。
- 真实预览使用随机 token，默认 30 分钟失效，服务重启时清理临时目录。
- 发布中心以月历展示计划任务，并保留完成、失败和取消历史。
- 定时发布支持失败自动重试、手动重试、自定义重试次数与间隔。
- `generate`、`deploy`、`clean` 和 `rebuild` 均作为后台任务运行。
- 任务提供排队、执行、取消、完成、失败等状态，以及进度、日志、重试与取消操作。

### 可靠性、安全与体验

- 首次登录强制改密；已有明文凭据自动迁移为 PBKDF2 哈希并轮换 JWT 密钥。
- 管理页与 API 设置 CSP、点击劫持防护、MIME 嗅探防护、Referrer Policy 和 Permissions Policy。
- 登录失败限流、令牌过期、严格路径边界和统一输入校验。
- 批量发布、撤回或回收全部完成后只刷新一次 Hexo source。
- 中文与 English 界面、亮色与暗色模式，以及桌面和移动端布局。
- 管理首页与发布中心集中展示命令任务状态和 Hexo 原始输出日志。

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

如果完全不提供管理员配置，插件会临时启用一次性的 `admin/admin` 账号，并要求登录后立即设置不少于 12 个字符的新密码。

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

## 核心使用流程

### 从模板创建内容

在“新建文章”中选择站点 `scaffolds/` 目录下的模板，再选择工作流状态。草稿、未完成和待审核内容写入 `source/_drafts`；立即发布的内容写入 `source/_posts`；计划内容会同时创建持久化定时任务。

### 类型安全地编辑

表单模式适合修改常用字段，完整源码模式适合维护自定义 Front Matter。未知字段会被保留，标量和复合值不会因为表单往返而被意外转换。保存时必须携带当前 revision；源文件被其他窗口或外部程序修改后，旧请求会返回 `409`。

### 验证真实主题

编辑文章或页面并保存后，选择“真实主题预览”。插件会以当前 Hexo 配置、主题和插件临时生成目标页面，再在 iframe 中展示最终结果。该预览会真实执行 Hexo 生成过程，因此应把主题或第三方插件的构建代码视为可信代码。

### 安排与追踪发布

发布中心同时展示定时任务和 Hexo 命令任务。定时发布依赖 Hexo 服务持续运行；服务短暂停止后，下一轮检查会继续处理已到期任务。默认最多尝试 3 次，失败后每 5 分钟重试，也可在创建任务时调整。

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
| `admin.password` | `admin` | 仅用于首次初始化；默认凭据登录后必须改密 |
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

当前版本为 `3.3.0`。项目遵循语义化版本规范，详细变更见 [CHANGELOG.md](./CHANGELOG.md)。

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
