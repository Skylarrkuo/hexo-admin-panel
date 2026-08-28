# Hexo Admin Panel

一个运行在 Hexo 内部的博客管理后台。安装后可在浏览器中管理文章、随笔、媒体文件和站点配置，无需单独部署后端服务。

后台界面使用 Vue 3 构建，生产环境所需的静态资源已包含在 npm 包中。

## 主要功能

- 编写、预览、发布和回收文章，支持 Front Matter 与编辑冲突检测
- 管理分类、标签、媒体文件和 About 页面
- 管理 Redefine 主题的随笔与配置
- 备份和恢复站点配置，恢复或永久删除回收项
- 在管理后台执行 Hexo 的生成、清理和部署命令
- 中文与 English 界面切换，语言选择保存在浏览器中
- 亮色与暗色界面，适配桌面和移动端
- 登录限流、首次登录改密、上传类型检查等基础安全保护

## 快速开始

在 Hexo 项目根目录安装插件：

```bash
npm install hexo-admin-panel
```

在 Hexo 的 `_config.yml` 中添加管理员配置：

```yaml
admin:
  username: admin
  password: replace-with-a-secure-password
  jwt_secret: replace-with-a-random-secret
```

启动 Hexo：

```bash
hexo server
```

然后访问 [http://localhost:4000/admin](http://localhost:4000/admin)。

也可以将配置写入 Hexo 根目录下的 `_admin-config.yml`：

```yaml
admin:
  username: admin
  password: replace-with-a-secure-password
  jwt_secret: replace-with-a-random-secret
  token_expiry: 24h
```

### 首次登录

未设置管理员账号时，插件会临时使用 `admin/admin`。首次登录后必须设置一个不少于 12 个字符的新密码，之后才能进入管理后台。

账号状态、回收站和配置备份保存在 Hexo 根目录的 `.hexo-admin/`。请将该目录加入 `.gitignore`，不要将其部署到公开站点。

## 配置

完整示例：

```yaml
admin:
  username: admin
  password: replace-with-a-secure-password
  jwt_secret: replace-with-a-random-secret
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
| `token_expiry` | `24h` | 登录令牌有效期 |
| `security.login_max_attempts` | `5` | 统计窗口内允许的登录失败次数 |
| `security.login_window_minutes` | `15` | 登录失败统计窗口，单位为分钟 |
| `security.login_lock_minutes` | `15` | 超限后的锁定时间，单位为分钟 |
| `uploads.max_file_size` | `10485760` | 单个文件大小上限，单位为字节 |
| `uploads.max_request_size` | `52428800` | 单次上传请求大小上限，单位为字节 |
| `uploads.max_files` | `10` | 单次请求允许上传的文件数量 |
| `uploads.allowed_extensions` | 见上方示例 | 允许上传的扩展名 |

插件会同时检查文件扩展名和内容签名。SVG 不允许上传。

Redefine 配置表单的字段名称和说明以中英双语元数据随插件发布，不会在每次打开配置页时重新解析主题 YAML 注释。

配置按以下顺序读取，排在前面的值优先：

1. `.hexo-admin/state.yml` 中已初始化的账号和 JWT 密钥
2. Hexo `_config.yml` 中的 `admin` 配置
3. `_admin-config.yml`
4. 首次使用时的一次性账号 `admin/admin`

## 内容与备份

| 内容 | 保存位置 |
| --- | --- |
| 文章与草稿 | Hexo 默认的 `source/_posts`、`source/_drafts` |
| About 页面 | `source/about/index.md` |
| Redefine 随笔 | `source/_data/essays.yml` |
| 管理后台状态 | `.hexo-admin/state.yml` |
| 回收站 | `.hexo-admin/trash/` |
| 配置与随笔备份 | `.hexo-admin/backups/` |
| 服务重启日志 | `.hexo-admin/restart.log` |

随笔修改前会自动保存 YAML 快照，默认保留最近 20 份。旧随笔首次通过后台修改时会获得稳定的 `id` 字段，Redefine 会忽略该字段。

## 本地开发

前端开发和构建需要 Node.js 20.19 或更高版本。普通用户使用 npm 包内已构建的前端资源，不需要安装 Vite。

将插件作为本地依赖加入 Hexo 项目：

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

cd ../your-hexo-site
npm install
npm run server
```

需要前端热更新时，在插件目录运行：

```bash
npm run dev
```

Vite 默认监听 `http://localhost:5173`，并将 `/admin/api` 代理到 `http://localhost:4000`。

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动前端开发服务器 |
| `npm run build` | 构建管理后台静态资源 |
| `npm run test:node` | 运行后端测试 |
| `npm run test:ui` | 运行前端组件测试 |
| `npm test` | 运行全部测试 |
| `npm run check` | 运行测试并验证生产构建 |

“重新构建并重启”功能面向直接运行 `hexo server` 的本地环境。它会执行 `hexo clean` 和 `hexo generate`，随后由辅助进程在原端口重启服务。

## 项目结构

```text
lib/
├─ plugin/        Hexo 插件入口与中间件
├─ server/        路由、鉴权与请求处理
├─ modules/       文章、媒体、配置等业务模块
├─ repositories/ 文件访问层
└─ shared/        通用工具

admin/src/
├─ api/           API 客户端
├─ components/    通用组件
├─ composables/   可复用状态逻辑
├─ i18n.js        界面语言状态与通用翻译
├─ layouts/       页面布局
├─ pages/         功能页面
├─ styles/        全局样式
└─ utils/         Markdown 与配置工具
```

管理接口统一使用 `/admin/api` 前缀。错误响应格式为：

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

客户端应根据 `code` 处理错误，不要依赖 `error` 文案。

## 版本与许可

当前版本为 `3.0.0`，变更记录见 [CHANGELOG.md](CHANGELOG.md)。

本项目基于 [MIT License](LICENSE) 发布。
