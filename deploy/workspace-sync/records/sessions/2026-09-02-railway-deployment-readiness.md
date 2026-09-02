# Railway 部署适配

## 完成内容

- Next.js 启用 standalone 构建，并增加统一生产启动脚本。
- 支持 `WORKSPACE_ROOT`，将线上可写工作区统一放到 Railway Volume。
- 空 Volume 首次启动时自动复制初始项目资料；已有文件不会被后续部署覆盖。
- 增加 `/api/health` 健康检查，并允许该入口绕过登录。
- 增加由 `APP_ACCESS_USERNAME`、`APP_ACCESS_PASSWORD` 控制的 HTTP Basic Auth；未配置密码时保持本地开发体验。
- 增加根目录 `RAILWAY.md`，记录 GitHub、变量、Volume、域名与备份配置。

## 重要判断

- Railway 每个服务只能挂载一个 Volume，因此不能继续把持久数据分散在容器内多个临时目录。
- GitHub 是代码与初始化内容来源；线上编辑产生的数据以 Volume 为准，不自动回写 GitHub。
- 不把本机代理地址带到 Railway；线上直接连接 OpenAI API。
- 当前为小团队单实例方案，不启用多副本写入同一个文件工作区。

## 验证

- ESLint 通过。
- Next.js production build 与 TypeScript 通过。
- 使用全新临时目录模拟空 Volume，确认初始资料、sources 和 Marketing 数据成功初始化。
- 确认未登录访问返回 401、`/api/health` 返回 200、正确账号可读取和写入工作区。
- 重启服务后确认测试 Todo 仍存在于模拟 Volume；临时数据已清理。

## 使用资料

- Railway 官方 Next.js deployment guide
- Railway 官方 Volumes guide 与 Volumes reference
- Railway 官方 Variables guide
- 本地 `package.json`、`next.config.ts`、`lib/workspace-store.ts`、`lib/codex-runner.ts`

## 剩余问题

- Railway 项目、Volume、环境变量和公开域名仍需在用户的 Railway 账号中创建。
- 仓库忽略 `outputs/`；如果线上需要保留全部本地历史产出，首次部署后需用 Railway CLI 上传当前工作目录到 Volume。
- 正式使用前需要为 Volume 开启备份，并妥善保存团队访问密码。
