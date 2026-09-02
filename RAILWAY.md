# Railway 部署说明

## 1. 创建服务

1. 在 Railway 新建 Project。
2. 选择 **Deploy from GitHub repo**。
3. 选择 `lumivincent/LumiV2`，部署 `main` 分支。
4. Railway 会根据 `pnpm-lock.yaml`、`build` 与 `start` 脚本完成构建和启动。

## 2. 配置环境变量

在服务的 **Variables** 中增加：

```text
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_TEXT_MODEL=gpt-5.6-sol
OPENAI_ANALYSIS_MODEL=gpt-5.6-sol
OPENAI_IMAGE_CONVERSATION_MODEL=gpt-5.6
WORKSPACE_ROOT=/data/workspace
APP_ACCESS_USERNAME=lumiterra
APP_ACCESS_PASSWORD=为团队设置的强密码
```

注意：

- 不要在 Railway 配置本机使用的 `OPENAI_PROXY_URL`、`HTTP_PROXY` 或 `HTTPS_PROXY`。
- `OPENAI_API_KEY` 和 `APP_ACCESS_PASSWORD` 应在 Railway 中设为 sealed variables。
- 如果未配置 `APP_ACCESS_PASSWORD`，网页和接口不会启用访问保护。

## 3. 添加持久化 Volume

1. 给 Web Service 添加一个 Volume。
2. Mount Path 设置为 `/data`。
3. 保持服务单副本运行；Railway 的 Volume 不支持同一服务多副本同时挂载。

启动时，应用会在空 Volume 中创建 `/data/workspace`，并从部署包复制初始的 `memory/`、`sources/`、`records/`、`outputs/`、`knowledge/`、`snapshots/`、`data/` 和 `AGENTS.md`。后续重启或重新部署只补充缺失文件，不覆盖团队已经产生的数据。

当仓库包含 `deploy/workspace-sync.json` 时，启动程序会按其中的同步编号应用一次 `deploy/workspace-sync/` 数据包：覆盖线上同名文件、保留线上独有文件。完成后会在 Volume 的 `.deployment-sync/` 写入标记，同一数据包不会因重启而重复覆盖。

## 4. 服务设置

通常不需要手动覆盖命令。需要排查时可核对：

```text
Build Command: pnpm build
Start Command: pnpm start
Healthcheck Path: /api/health
```

`pnpm start` 会启动 Next.js standalone server，监听 Railway 提供的 `PORT` 和 `0.0.0.0`。

## 5. 开放访问

1. 在 **Settings → Networking** 点击 **Generate Domain**。
2. 打开 Railway 域名。
3. 浏览器登录框中输入 `APP_ACCESS_USERNAME` 和 `APP_ACCESS_PASSWORD`。
4. 验证知识库、Marketing、内容创作和素材上传。

## 6. 数据边界与备份

- Railway 页面产生的数据保存在 Volume，不会自动写回 GitHub。
- GitHub 负责应用代码和首次初始化内容；Volume 是线上工作台的运行数据源。
- 正式使用前为 Volume 开启定期备份。
- 迁移或排障时可用 Railway CLI 的 `railway volume browse /` 检查和导出文件。

仓库默认不直接提交根目录的 `outputs/`。需要随一次部署迁移本地工作台时，把经过确认的数据快照放入 `deploy/workspace-sync/`，并为 `deploy/workspace-sync.json` 设置新的唯一同步编号。部署后应从 Railway 日志确认一次性同步完成。

也可以通过 Railway CLI 将下列目录手动上传到 Volume 的 `/workspace/`：

```text
data/
knowledge/
memory/
outputs/
records/
snapshots/
sources/
```

例如：

```bash
railway volume files --volume <volume-name> upload ./outputs /workspace/outputs --overwrite
railway volume files --volume <volume-name> upload ./data /workspace/data --overwrite
```

其余目录使用相同方式上传。上传前应先确认 CLI 已链接到正确的 Railway Project、Environment 和 Service。
