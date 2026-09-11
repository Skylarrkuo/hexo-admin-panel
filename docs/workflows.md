# 内容与发布工作流

## 编辑与冲突

文章和页面顶部提供历史版本及差异面板。保存返回 409 时，本地内容保持不变，面板读取最新服务器版本并展示三方内容。无交叠的行改动自动合并；冲突标记必须手动消除。接受合并只更新编辑器，下一次保存仍检查服务器 revision。

本机草稿与服务器历史分开保存。退出、断网或登录过期后，重新登录、打开同一编辑器并选择恢复。本机存储写入失败会提示复制备份。源码模式中的未完成 YAML、主题字段的未完成 JSON／数字、新建页面与菜单排序也保留在本机。配置保存先生成差异；预览后再修改必须重新预览。

## 随笔批量编写

在随笔列表勾选条目后点击“批量编辑”，或点击“批量添加”。可逐条编辑 Markdown 与时间、预览全部内容，也可粘贴多篇文字，以单独一行 `---` 分隔；空段忽略，围栏代码块内的分隔线保留。拆分后先核对条目，正文中的其他分隔线也会成为拆分位置。每批最多 100 条，可统一应用时间；“移出此批次”不会删除已保存的数据。

点击“保存全部”后，后端校验所有条目、日期与 essays.yml 的 revision，再一次写入并生成一份旧文件备份；保留未选择随笔与自定义字段。任何一条无效、目标不存在或版本过期时，整批不写入。保存随笔只更新源文件，线上站点仍需完成发布流程。

批量草稿包含逐条内容、日期及尚未拆分的粘贴文本。登录过期后重新打开批量编辑并选择恢复。服务器冲突时展示最新服务器与本地差异，核对后再继续保存；已被服务器删除的条目需移出批次或明确作为新随笔添加。新增条目携带固定 createId，响应丢失后重新核对可识别已经保存的条目。

## 发布

1. 保存编辑器内容；文章需要先加入站点源码，草稿默认不进入部署内容。
2. 进入发布中心运行检查。可选包含草稿；缺语言是警告，其余已识别错误阻止流程。
3. 点击“构建 → 部署 → 验证线上”。任务固定 source 文件与站点/主题配置的 SHA-256 清单。
4. 后台拒绝发布期间的内容写入。在构建和部署前后检查文件清单，发现外部修改即失败。
5. 清理并生成 public，写入 `hexo-admin-release.json`，确认配置和部署插件可用后执行 Hexo deploy。标记只含发布 ID 与总 revision，不包含文章源码、配置或令牌。
6. 对站点 URL/root 发起无凭据 HTTP(S) 请求，验证标记及全部构建 HTML 的字节哈希。任务保存每步时间、错误和对应版本。

仅部署完成不会被显示为线上验证通过。CDN HTML 改写、路径重定向、延迟传播或排除标记文件会导致验证失败。每个请求超时 15 秒，最多 2000 页，每页 10 MiB。失败后查看步骤日志，修正配置再重新检查发布；取消在阶段间生效，已经部署的远程变更不会自动撤销。已有 generate/deploy 等独立命令保持原行为，不经过完整检查门槛。

## 资源与恢复

公共媒体仍位于 source/images。文章的资源面板展示其已保存源码中的公共媒体引用，以及同名资源目录。asset_img、asset_link、asset_path 和 Markdown/HTML 相对引用在文章资源重命名时同步更新；仅处理当前文章可识别的引用。外部 URL 保持不变，跨文章和动态引用需自行核对。开启 post_asset_folder 时 new_post_name 需以 .md 结尾，以便 Hexo 识别文章。草稿发布会移动同名目录，目标冲突则拒绝；删除文章不会顺带销毁整套资源目录。

历史存储原始字节与独立元数据，列表不读取整份二进制内容。文本每文件 50 版、二进制每文件 5 版，全局 10000 版/512 MiB，按最新版本优先裁剪，没有固定天数。恢复前显示当前 revision；确认后若目标已经变化返回 409。恢复当前文件也会产生备份。外部文件变更不会被持续监听，在下一次后台写入前捕获。

恢复中心还识别旧配置、随笔、菜单、分类批次、压缩原图和重命名备份。旧批次逐文件恢复，保留原保留策略；无法确定目标的孤立备份不猜测恢复位置。旧主题备份没有主题标识，界面明确提示当前主题覆盖目标，恢复前需核对差异。旧重命名备份恢复原文件后，新文件另行清理。

## 新接口

所有接口位于站点 root 下的 `/admin/api`，使用现有单用户认证。

| 接口 | 用途 |
| --- | --- |
| GET /history?source=source/_posts/example.md | 按站点相对路径查询版本元数据 |
| GET /history/:id | 历史内容、当前内容与 currentRevision |
| POST /history/:id/restore | 以 `{revision}` 恢复，缺失目标使用预览返回的 `missing` |
| GET /recovery | 统一备份列表、保留策略和可定位备份占用 |
| GET /recovery/:id | 预览备份及当前文件 |
| POST /recovery/:id/restore | 以 `{revision}` 恢复单个文件 |
| GET /checks?include_drafts=true | 内容检查、定位、版本清单、是否需要重启 |
| POST /publishing/run | 以检查返回的 `{revision}` 启动完整任务 |
| GET /commands/jobs/:id | 查看逐步发布结果、日志和版本 |
| GET /media?source=_posts/example.md | 按已保存文章引用过滤公共媒体 |
| GET /media/:filename/delete-preview | 删除影响与计划 revision |
| DELETE /media/:filename | 使用 `If-Match` 确认删除计划 |
| GET /posts/:id/assets | 列出文章资源和 asset_img 插入文本 |
| POST /posts/:id/assets | multipart 上传到文章目录 |
| POST /posts/:id/assets/:name/rename-preview | 以 `{name}` 预览重命名和文章差异 |
| PUT /posts/:id/assets/:name/rename | 以 `{name,revision}` 应用计划 |
| GET /posts/:id/assets/:name/delete-preview | 文章内删除影响与版本 |
| DELETE /posts/:id/assets/:name | 使用 `If-Match` 删除并移入回收站 |
| POST /essays/batch | `{revision,entries:[{id?,createId?,content,date}]}`；有 id 为修改，无 id 为新增；createId 可选，为 32 位十六进制新条目标识。返回 changed（按输入顺序）、items、created、updated、revision、backupId |
| GET /native | 站点时区、root 与资源目录开关 |
| POST /config/preview | 使用现有 config 保存参数生成 diff；`replace:true` 表示完整表单；`unset` 为要删除的覆盖字段路径 |

静态检查识别 Markdown、HTML 和 Hexo 资源标签中的常见路径；已注册 Hexo 路由用于站内链接判断。不会访问外部 URL，也不会证明动态模板中的引用完整。字段行号对应源码位置，编辑入口打开相应文章或页面。
