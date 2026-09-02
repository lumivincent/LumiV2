# Lumiterra Operations Content

`upstream/` 保存从产品文档站同步的原始 Markdown。运行 `pnpm sync:docs` 会检查内容哈希；发生变化时更新本地文件，并把旧版本保存到项目根目录的 `snapshots/`。
