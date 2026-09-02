# 运营知识库工作台规划记录

- 执行日期：2026-09-01
- 工作类型：产品与运营系统规划

## 本次完成

- 检查现有工作台的项目记忆、来源同步、内容 metadata、素材 metadata 和会话记录方式。
- 规划知识库的目标、边界、对象模型、捕获流程、追溯机制、搜索调用、版本冲突规则与开发阶段。
- 确认外部研究知识不能混入 `sources/` 产品真相层。
- 将 Olympus DAO 设为首个流程试点，而不是知识库的永久边界。
- 明确知识库作为独立一级入口，不占用或改变现有工作区内容。
- 补充“讨论记录”对象，用于持续沉淀日常资料搜集、分析和脑暴结论。

## 关键判断

- 原始资料、证据片段、内部观点、运营实验和实际调用记录必须分层保存。
- 快速捕获应尽量少要求字段；是否可靠、是否采用在后续整理阶段判断。
- 每次 AI 或人工产出都应保存精确知识版本的使用快照，防止观点更新后无法还原历史依据。
- 第一版使用 Markdown 正文与 JSON metadata 最符合现有工作台；语义检索可以后置。
- 讨论纪要、原始证据和已采纳观点必须分开，避免将脑暴结果误当成已证实事实。

## 使用的上下文

- `AGENTS.md`
- `memory/current.md`
- `app/page.tsx`
- `app/api/workspace/route.ts`
- `lib/workspace-store.ts`
- `data/workspace-manifest.json`
- `data/content-metadata.json`
- `records/sessions/2026-08-27-content-workbench-memory-redesign.md`

## 产出

- `outputs/documents/2026-09-01-operations-knowledge-base-workbench-plan.md`
- `records/decisions/2026-09-01-operations-knowledge-base-scope.md`

## 剩余问题

- 工作台内部入口名称、网页抓取范围、观点审核权限和第一阶段集成范围仍需团队确认。
