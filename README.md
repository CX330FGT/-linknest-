# 拾光导航 · LinkNest

把好用的网站、常用工具和下一次灵感，收在一个安静的个人空间。

一个无需安装依赖、无需后端的力学科研与个人导航站。浅米色与森林绿主题，适配桌面和手机。

项目仓库：[CX330FGT/-linknest-](https://github.com/CX330FGT/-linknest-)。

MIT 开源 · 零运行时依赖 · 默认本地数据 · 可自行静态托管。

这是一个早期项目，当前没有可核验的规模化采用或月下载量数据。项目希望为个人工具开发者提供可审查的本地数据管理、备份迁移和输入校验参考；这属于设计价值，不代表已经成为生态基础设施。

## 已实现

- 科研资源库收录 43 个入口，覆盖文献、理论课程、仿真、数值计算、实验数据、后处理、论文写作和 AI；校园入口由用户自行添加。
- 「AI 与智能科研」收录 22 个入口，可按通用助手、文献发现、编程助手、机器学习框架、物理与科学机器学习、课程资料六个子类筛选。
- 「科研资源库 / 我的收藏」切换，一键收藏资源；目录更新不会自动写入或覆盖个人收藏。旧版 15 个示例收藏与所有自定义收藏继续兼容。
- 网站卡片显示实际网站图标，覆盖预置资源及示例收藏的全部 56 个域名；图标随项目提供，可离线显示。
- 网站新增、编辑、删除，重复地址提示，常用收藏切换。
- 按名称、网址、描述、分类、子分类和研究标签搜索；多个关键词同时匹配；按 `/` 聚焦搜索。支持 PINNs、神经算子、参数识别、代理模型等研究关键词。
- 浅色、深色主题；首次访问跟随系统，之后记住选择。
- 浏览器本地保存，多个同源标签页之间同步变更。
- JSON 备份导出、校验与预览，支持合并或替换；合并自动跳过重复网址并保留现有编辑。
- 地址协议白名单、纯文本渲染、存储失败提示。
- 键盘操作、弹窗焦点约束、移动端布局与减少动画偏好支持。

## 本地运行

安装 Node.js 22 或更新版本，在项目目录运行：

```sh
node scripts/serve.mjs
```

打开 http://127.0.0.1:4173 。请通过 HTTP 服务访问，直接双击 HTML 可能会被浏览器阻止加载模块。

```sh
node --test
node --check dist/app.js
node --check dist/core.js
```

无需运行依赖安装命令。`dist/` 就是可以部署的完整网站。

## 数据和隐私

收藏保存在浏览器 `localStorage`，不会上传到 GitHub 或服务器。不同设备、浏览器及不同域名的收藏互不共享；清除浏览器数据会清除收藏。请使用「导出我的收藏」定期备份，迁移时用「导入备份」选择合并或替换。合并会保留当前项，规范化后相同网址只保留一次；查询参数和片段不同的地址不会被粗略合并。替换则会移除当前收藏。

站点不加载第三方字体或统计脚本。已收录的图标打包在本地，不向第三方图标服务发送浏览请求。自定义网站若没有内置图标，会从该网站原站的 `/favicon.ico` 加载图标，并禁止发送页面来源；加载失败时显示备用标识。目录提供官网或官方文档入口，不保证在每个地区均可访问；登录、订阅与软件许可要求以各网站为准。

校园与课题组分类不预置未知学校链接。请选择该分类，添加自己的图书馆、校外访问、超算与仪器预约入口。AI 目录提供外部网站链接，不在本站调用模型或上传收藏。

导入上限为 2 MB、2000 条收藏；仅接受版本 1 的 LinkNest JSON 备份。暂不支持浏览器书签 HTML 导入、跨设备同步、账号登录或自动抓取网站信息。

## 发布到 GitHub

本项目的 GitHub 仓库为 `CX330FGT/-linknest-`。克隆仓库后可本地运行；后续修改使用自己的 GitHub 登录推送：

```sh
git clone https://github.com/CX330FGT/-linknest-.git
cd ./-linknest-
node scripts/serve.mjs
```

修改并提交后：

```sh
git push -u origin main
```

仓库发布与网站上线是两个独立步骤。此仓库由拥有者创建为公开仓库，程序不会把浏览器中的个人收藏上传到仓库。

仓库内有测试工作流，以及一个手动触发的 Pages 部署工作流。如果要上线：在仓库 Settings → Pages 中选择 GitHub Actions 为构建来源，然后在 Actions 中手动运行「Deploy website」。私有仓库的 Pages 可用性取决于账号方案；请在 GitHub 页面中确认访问范围。工作流不会自行修改仓库可见性。

所有页面资源使用相对路径，兼容项目子路径部署。启用 Pages 后，预期地址为 `https://cx330fgt.github.io/-linknest-/`；该地址只有部署成功后才可访问。

## 目录

```text
dist/                 可直接部署的 HTML、CSS、JavaScript 和图标
  core.js             数据模型、校验、搜索和初始数据
  catalog.js          力学与 AI 科研资源目录
  icons.js            本地网站图标与按网址匹配规则
  app.js              页面交互与本地存储
scripts/serve.mjs     本地静态服务
test/core.test.js    核心规则测试
docs/architecture.md 需求与架构决策
.github/workflows/   自动测试与手动网站部署
```

详细设计见 [架构说明](docs/architecture.md)。

分类与目录维护说明见 [科研资源库](docs/research-resources.md)。

## 复用与参与

`dist/core.js` 的 `parseBackup`、`mergeBookmarks` 和 `filterBookmarks` 可在浏览器或 Node.js 中导入使用。它们不依赖 DOM、网络或存储。也可以用以下命令离线检查备份，输出仅包含数量和校验结果，不输出收藏内容：

```sh
node scripts/validate-backup.mjs your-backup.json
```

阅读 [贡献指南](CONTRIBUTING.md)、[安全政策](SECURITY.md)、[路线图](ROADMAP.md) 和 [更新记录](CHANGELOG.md)。API 维护自动化目前只是 [额度使用计划](docs/api-credits-plan.md)，未接入产品，也没有模型性能或节省工时数据。

## English overview

LinkNest is an early-stage, MIT-licensed, local-first bookmark dashboard with no runtime dependencies. It offers category search, favorites, light/dark themes, JSON backup, and non-destructive merge import. The data layer is reusable in browsers and Node.js. Bookmarks stay in the user's browser; there is no telemetry or API requirement. Download counts and broad adoption have not been established. Contributions and reproducible bug reports are welcome; see CONTRIBUTING.md and SECURITY.md.
