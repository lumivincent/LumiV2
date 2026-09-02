# Railway API-only 与待复核按钮修复

- 日期：2026-09-02
- 目标：修复内容待复核状态的空白按钮，并让 Railway 托管版只使用 OpenAI API。

## 执行

- 修复完成态主按钮被局部白色背景覆盖、导致白字不可见的问题。
- Railway 环境自动隐藏内容创作、文档分析、知识讨论和视觉创作中的 Codex 入口。
- 托管版从浏览器旧状态恢复时会自动切回 OpenAI API。
- `/api/codex` 在 Railway 环境拒绝执行，避免仅靠前端隐藏造成误调用。
- 本地工作台继续保留 Codex 与 OpenAI API 双模式。

## 重要判断

- Railway 运行环境没有本机 Codex 登录态与桌面工作区能力，托管版本以服务端 `OPENAI_API_KEY` 为统一执行凭证。
- 历史记录中保留原来的 Codex 执行标记，不改写已有产出的来源。
