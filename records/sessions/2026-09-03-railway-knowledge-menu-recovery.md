# Railway 知识菜单缺失修复

## 用户反馈

Railway 部署后的知识库中，Robinhood Chain 只显示 1 项，没有本地已有的资料与项目报告菜单；同时希望各级菜单更清晰、更容易点击与切换。

## 原因

- Railway 使用持久化 Volume，已有的 `data/knowledge-metadata.json` 不会被普通部署覆盖。
- 部署包会补入新增知识文件，但旧 metadata 没有对应条目；运行时自动恢复只能识别文件类型，无法推断主题关系。
- 因此 Robinhood 文档虽然可能已经存在于 Volume，却没有 `topicIds`，主题目录只能统计主题自身的 1 项。

## 修复

- Railway 启动时在一次性数据同步之后，安全合并部署包中的规范知识 metadata。
- 以稳定 ID 或路径识别已有记录；线上已有规范记录保持不变。
- 对同路径的 `RECOVERED-*` 自动恢复记录使用规范 metadata 替换，从而恢复主题关系、标签与稳定 ID。
- 不清空 Volume，不覆盖线上新增或修改的知识记录。
- 知识目录增加连续树形引导线、计数胶囊和更大的整行点击区域。
- 窄屏目录最大高度从 320px 提高到 420px，移动端菜单行进一步增大点击高度。

## 验证

- `pnpm build` 通过；仅保留项目已有的 Turbopack 动态文件追踪警告。
- 使用独立临时 `WORKSPACE_ROOT` 模拟旧 Railway Volume，并实际运行 standalone 服务。
- 启动后 `/api/workspace` 返回 Robinhood Chain 82 项、项目报告 75 项、知识文件 85 份。
- 本地浏览器确认一级主题、直接文档、相关资料与项目报告层级清晰且均可整行点击。

## 部署说明

推送并等待 Railway 使用新提交重新部署即可；不需要删除或重建现有 Volume。
