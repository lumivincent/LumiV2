# 工作台接入 Codex 一键执行

- 记录时间：2026-08-26
- 类型：工作台能力更新

## 完成内容

- 接入官方 `@openai/codex-sdk`，由 Next.js 服务端启动本地 Codex 任务。
- 文档分析、内容创作和素材方案保持为独立工作类型，统一共享本地项目记忆。
- 原“复制 Codex 指令”流程改为网页直接执行、轮询状态、显示本轮产出。
- 每次执行仍先创建 `records/requests/` 任务，Codex 按 `AGENTS.md` 写入产出和执行记录。
- Agent 权限限制为工作区写入，关闭任务内网络访问与网页搜索；同一时间只运行一个任务。
- 修正 Windows 服务进程的 home 环境映射，使 SDK 可以复用本机 Codex 登录。

## 验证

- ESLint 通过。
- Next.js 生产构建通过。
- Codex SDK 只读连通性测试返回 `CODEX_READY`，确认当前 ChatGPT 登录可复用。
- 本地页面检查通过：分析、内容、素材三个入口均展示直接执行按钮，浏览器无前端错误。
- `/api/codex` 状态接口响应正常。

## 边界

- 本次没有修改 `sources/`、`memory/current.md` 或既有运营产出。
- 服务重启会清空页面中的临时运行状态，但已落盘的任务、产出和执行记录不会丢失。
- 当前版本不支持多个 Agent 任务并发，避免工作项同时写入造成冲突。

## 运行问题修复

- 首次从 Next.js 路由执行时出现 `Unable to locate Codex CLI binaries`。原因是服务端打包改变了 SDK 对平台 CLI 包的动态定位。
- 已在 `next.config.ts` 将 `@openai/codex-sdk` 与 `@openai/codex` 保留为服务端外部依赖。
- 进一步验证发现，沙箱内启动的开发服务无法访问 Windows 用户目录，因此不能读取本机 Codex 登录。
- 开发服务现仅绑定 `127.0.0.1:3000` 并以本机权限运行；局域网无法访问。Agent 自身仍使用 `workspace-write`，并关闭任务内网络访问。
- 已从 `/api/codex` 重新执行失败任务 `records/requests/2026-08-26T11-26-57-427Z-v2-产品理解分析.md`，状态返回 `completed`，CLI 定位、ChatGPT 登录、文件读写和执行记录链路均验证成功。
