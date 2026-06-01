# hexo-admin-panel

一个功能齐全的 Hexo 管理后台插件，零外部依赖，直接调用 Hexo 内部 API。

## 功能特性

- JWT 身份认证
- 文章增删改查（CRUD）
- 草稿/发布状态切换
- Front Matter 可视化编辑
- Markdown 实时预览
- 媒体文件管理（上传/删除/浏览）
- 分类管理
- 标签管理
- 站点配置查看与编辑
- 仪表盘统计（文章数、字数、分类数、标签数）
- 一键生成/部署/清理缓存
- 主题列表
- 分页、搜索
- 响应式前端（Vue 3 + marked.js，通过 CDN 加载）
- 全中文界面

## 安装

```bash
npm install hexo-admin-panel
```

或在 `package.json` 中添加：

```json
{
  "dependencies": {
    "hexo-admin-panel": "^1.0.0"
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

1. `hexo.config.admin`（来自 `_config.yml` 的 `admin:` 字段）
2. `_admin-config.yml` 文件
3. 内置默认值（admin/admin）

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

## API 接口

所有接口以 `/admin/api` 为前缀。

| 接口 | 方法 | 用途 |
|---|---|---|
| `/auth/login` | POST | 登录，返回 JWT |
| `/auth/verify` | GET | 验证令牌 |
| `/posts` | GET | 文章列表（分页、搜索、筛选） |
| `/posts/:id` | GET | 获取单篇文章 |
| `/posts` | POST | 新建文章 |
| `/posts/:id` | PUT | 更新文章 |
| `/posts/:id` | DELETE | 删除文章 |
| `/posts/:id/publish` | PUT | 切换草稿/发布状态 |
| `/categories` | GET | 获取所有分类 |
| `/tags` | GET | 获取所有标签 |
| `/media` | GET | 媒体文件列表 |
| `/media/upload` | POST | 上传文件 |
| `/media/:filename` | DELETE | 删除媒体文件 |
| `/config` | GET | 读取 _config.yml |
| `/config` | PUT | 写入 _config.yml |
| `/stats` | GET | 仪表盘统计数据 |
| `/themes` | GET | 已安装主题列表 |
| `/commands/generate` | POST | 执行 hexo generate |
| `/commands/deploy` | POST | 执行 hexo deploy |
| `/commands/clean` | POST | 执行 hexo clean |

## 许可证

MIT
