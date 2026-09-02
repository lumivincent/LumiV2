# Railway pnpm workspace 构建修复

## 问题

Railway 在 `pnpm install --frozen-lockfile --prefer-offline` 阶段退出，提示 `packages field missing or empty`，尚未进入 Next.js 构建。

## 根因与修复

- 根目录存在 `pnpm-workspace.yaml`，但只配置了依赖构建许可，没有声明 workspace `packages`。
- 增加根包声明 `packages: ['.']`，保持当前单包项目结构不变。

## 验证

- `pnpm install --frozen-lockfile --prefer-offline` 通过，锁文件没有变化。
- `pnpm build`、TypeScript 和 Next.js production build 通过。

## 剩余问题

- 等待 Railway 根据新提交自动重新部署并确认线上构建结果。
