# Codex for Open Source 申请材料

> 历史申请资料：2.0 已改为空网址、自主管理分类的导航站。本文不代表当前功能或目录规模，提交申请前请按当前 README 重新核对。

依据用户提供的申请表截图与 [官方说明](https://developers.openai.com/community/codex-for-oss)，核对日期：2026-10-21。准备材料不等于满足全部资格，审核与支持范围由项目方决定。

## 三个文本框

可复制文案在 [application-answers.json](application-answers.json)，分别对应：

- `eligibility`：为什么这个代码仓库符合要求。
- `api_usage`：你将如何针对自己的项目使用 API 额度。
- `additional`：还有其他需要说明的事项吗。

每项均少于 500 字符。提交前按当时的真实项目状态更新，不能把计划写成已实现结果。

## 选择与账号字段

若愿意按当前维护计划执行，可以选择「Codex Security」与「项目的 API 额度」。前者用于申请安全审查支持，后者用于计划中的 OSS 维护实验；选择不代表已获批准。

OpenAI 组织 ID 必须从申请人自己的 OpenAI 组织设置复制。当前无法验证申请人的组织 ID，不填占位值，不使用 GitHub 用户名代替，也不把组织 ID 或任何密钥提交到公开仓库。

本次没有提交申请、同意申请条款、创建 API 密钥或消耗 API 额度。

## 证据与边界

| 申请表内容 | 可查证材料 | 不应声称 |
| --- | --- | --- |
| 开源与可复用价值 | LICENSE、README、dist/core.js、scripts/validate-backup.mjs | 已被广泛采用、关键基础设施 |
| 数据迁移与隐私 | 合并导入实现、SECURITY.md、test/import.test.js | 绝对安全、数据加密或已获安全认证 |
| 测试与维护 | test/、docs/verification.md、CONTRIBUTING.md | 所有浏览器均已覆盖、GitHub CI 已通过（未核验） |
| API 额度用途 | docs/api-credits-plan.md | 已集成 API、已节省工时或已获额度 |
| 星标、月下载量 | 提交时核验 GitHub 显示值；当前没有下载统计 | 猜测星标数，把网页访问量当下载量 |

GitHub 连接本次返回的仓库元数据不含星标字段，因此文案不填写未经核验的星标数字。项目未发布 npm 包，没有月下载统计，也没有真实用户增长证据。没有为申请制造虚假 Issue、用户、使用量或社区背书。
