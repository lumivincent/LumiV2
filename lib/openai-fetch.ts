import { ProxyAgent, type Dispatcher } from 'undici';

let proxyAgent: ProxyAgent | undefined;

function proxyUrl() {
  const configured = process.env.OPENAI_PROXY_URL?.trim();
  if (configured) return configured;
  return process.platform === 'win32' ? 'http://127.0.0.1:7897' : '';
}

export function openAIProxyUrl() {
  return proxyUrl();
}

export function openAITransport() {
  return proxyUrl() ? 'proxy' : 'direct';
}

export async function openAIFetch(input: string | URL, init: RequestInit = {}) {
  const activeProxy = proxyUrl();
  try {
    if (!activeProxy) return await fetch(input, init);
    proxyAgent ??= new ProxyAgent(activeProxy);
    return await fetch(input, { ...init, dispatcher: proxyAgent } as RequestInit & { dispatcher: Dispatcher });
  } catch (error) {
    const cause = error && typeof error === 'object' && 'cause' in error ? (error as { cause?: { code?: string } }).cause : undefined;
    const reason = cause?.code ? `（${cause.code}）` : '';
    throw new Error(`无法连接 OpenAI API${reason}。请确认 Clash 正在运行，并检查本地代理端口。`, { cause: error });
  }
}
