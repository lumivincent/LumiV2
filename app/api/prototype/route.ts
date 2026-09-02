import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROOT = resolve(/* turbopackIgnore: true */ process.env.WORKSPACE_ROOT?.trim() || process.cwd());
const assets = {
  base: { filename: 'prototype-base.css', type: 'text/css; charset=utf-8' },
  'agent-style': { filename: 'agent-prototype.css', type: 'text/css; charset=utf-8' },
  'lottery-style': { filename: 'lottery-prototype.css', type: 'text/css; charset=utf-8' },
  'agent-script': { filename: 'agent-prototype.js', type: 'text/javascript; charset=utf-8' },
  'lottery-script': { filename: 'lottery-prototype.js', type: 'text/javascript; charset=utf-8' },
} as const;

export async function GET(request: NextRequest) {
  const asset = request.nextUrl.searchParams.get('asset') as keyof typeof assets | null;
  if (asset && assets[asset]) {
    try {
      const definition = assets[asset];
      const content = await readFile(join(ROOT, 'sources', definition.filename), 'utf8');
      return new NextResponse(content, { headers: { 'Content-Type': definition.type, 'Cache-Control': 'no-cache' } });
    } catch {
      return new NextResponse('本地原型资源尚未同步', { status: 404 });
    }
  }

  const id = request.nextUrl.searchParams.get('id') === 'lottery' ? 'lottery' : 'agent';
  const title = id === 'agent' ? 'Agent 交互' : '抽奖交互';
  const style = id === 'agent' ? 'agent-style' : 'lottery-style';
  const script = id === 'agent' ? 'agent-script' : 'lottery-script';
  const mount = id === 'agent' ? 'mountAgentPrototype' : 'mountLotteryPrototype';
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link rel="stylesheet" href="/api/prototype?asset=base"><link rel="stylesheet" href="/api/prototype?asset=${style}"><style>html,body{margin:0;min-height:100%;background:#f7f7f3}body{display:block!important}.prototype-local-shell{min-height:100vh;padding:18px;box-sizing:border-box}</style></head><body><main id="prototype-root" class="prototype-local-shell"><p>正在载入本地交互原型…</p></main><script type="module">import { ${mount} } from '/api/prototype?asset=${script}'; ${mount}(document.querySelector('#prototype-root'));</script></body></html>`;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
}
