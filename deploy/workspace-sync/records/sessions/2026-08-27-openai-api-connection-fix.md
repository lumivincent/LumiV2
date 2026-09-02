# OpenAI API 本地连接修复

## 问题

- 素材工作室使用 OpenAI API 生成图片时返回 `fetch failed`。
- 请求没有 OpenAI 错误码或请求编号，说明失败发生在收到 API 响应之前。

## 原因

- 本机 Node 进程没有代理环境配置，直接访问 `api.openai.com` 时触发 `EACCES`。
- 本机同时运行 Clash，HTTP 代理监听在 `127.0.0.1:7897`；通过该代理访问 OpenAI 可正常建立连接。
- 因此问题与提示词、参考图数量、图片格式或模型参数无关。

## 修复

- 增加统一的 OpenAI 请求传输层，Windows 本地默认使用 `http://127.0.0.1:7897`。
- 支持通过 `OPENAI_PROXY_URL` 覆盖代理地址。
- 图片生成、图片连续修改、远程图片读取和内容创作共用该连接方式。
- 连接失败时返回明确的 Clash/代理检查提示，不再只显示 `fetch failed`。

## 验证

- 使用现有 API Key 请求 OpenAI 模型列表返回 HTTP 200；该校验不生成图片、不产生图片 Token 消耗。
- ESLint 通过。
- Next.js 生产构建通过。

## 官方参考

- https://developers.openai.com/api/reference/ruby#handling-errors
