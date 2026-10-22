# 期刊目录与分区

维护日期：2026-10-22。当前首批收录 128 本期刊：中国主办 30 本、海外主办 98 本。包含力学主体学科以及固体与材料、计算力学、冲击爆炸、断裂疲劳、结构、流体、生物、岩土、复合材料等常见交叉方向。

这是便于课题组使用的初步导航目录，不是完整的 SCI/SCIE Mechanics 学科清单，也不覆盖所有与力学有交叉的期刊。列入目录不等于被 SCI、EI、CSCD 或其他数据库收录。地区指主办背景，不是出版语言、质量等级或文章作者国籍。中文期刊和中国主办的英文期刊均可列入中国主办分组。

## 查询与分区

在「文献期刊」选择地区、方向、分区体系和区域。两套分区独立保存、独立筛选；已有分区排在待核验之前。卡片同时显示中科院与 JCR，展开「分区年份与来源」查看学科、版本和依据。无法核验的字段保持待核验，不从影响因子、刊名或另一体系推测。

分区中的 `year` 指发布版本年份，不是引文数据年度。例如本次公开可核对的 Annual Review of Fluid Mechanics 使用 **2026 JCR 版本、2025 引文数据**。出版方公开排名为 Mechanics 1/172，据此判定 Q1，卡片明确标注这个判定依据；未据此推断中科院分区。

目前所有中科院数据待核验，JCR 只有上述一条有公开依据的记录，其余待核验。这一状态反映核验进度，不代表其他期刊没有分区。未持有机构授权的完整数据表，不能声称已核对最新全量分区。不同年度或多个学科可能有不同结果；当前每套体系只保存一个明确选定的学科，不自动挑选最高分区。

## 官方来源

- [中国力学期刊网](https://pubs.cstam.org.cn/journals)：国内力学期刊目录入口。
- [中科院分区表](https://www.fenqubiao.com/)：核对中科院分区、年份和学科。
- [Journal Citation Reports](https://jcr.clarivate.com/)：核对 JCR 版本与学科分区。
- [Clarivate JCR 产品说明](https://clarivate.com/academia-government/scientific-and-academic-research/research-funding-analytics/journal-citation-reports/)：产品与版本背景。
- [Annual Reviews 2026 排名](https://www.annualreviews.org/about/impact-factors)：本次公开记录的实际依据。
- [ASME](https://www.asme.org/publications-submissions/journals/find-journal)、[Elsevier 力学目录](https://shop.elsevier.com/journals/subjects/physical-sciences-and-engineering/engineering-and-technology/mechanics)、[Springer Nature](https://link.springer.com/journals)：继续查找当前目录以外的刊物。

目录提供期刊或出版平台入口，不代替数据库收录核验、投稿要求检查或学校学位目录。部分刊物的平台、域名或访问权限会变化，需要持续维护。

## 导入课题组已核对的数据

使用「导入已核对的分区数据」选择 JSON 文件；不向服务器发送文件。仅校验数据结构，不自动认证内容真实性。保留原始文件便于备份和追溯。期刊 ID 参见 [journal-directory.json](journal-directory.json)，可导入的真实格式示例见 [journal-rankings-example.json](journal-rankings-example.json)。

格式为 `{ "version": 1, "rankings": [...] }`，每条包含 `id`，以及需要更新的 `cas` / `jcr`：

- CAS 的 `zone` 为数字 1、2、3 或 4，JCR 的 `zone` 为字符串 Q1、Q2、Q3 或 Q4。
- 分区对象必须有版本 `year`、完整学科 `category`、安全的 HTTP(S) 来源 `source`；可选 `note` 说明数据年度或核验方式。
- 省略某套体系会保留当前值，明确写 `null` 会将它清为待核验。
- 文件最多 1 MB、1000 条；未知或重复 ID、无效分区、不完整来源、未来年份会导致整批拒绝，不覆盖当前数据。

完整覆盖表只保存在当前浏览器的 `linknest.journal-rankings.v1`，不自动同步到其他设备或标签页，也不自动修改之前保存的期刊收藏。收藏保存当时的元数据，随个人备份导出；完整覆盖表需要保留原导入文件。浏览器清理数据后可重新导入。
