import { NextRequest, NextResponse } from 'next/server';
import { cancelCodexRun, getCodexRun, startCodexRun } from '@/lib/codex-runner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') ?? '';
  const run = await getCodexRun(id);
  if (!run) return NextResponse.json({ error: '未找到这次任务，服务可能已重启' }, { status: 404 });
  return NextResponse.json(run, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { requestPath?: string; threadId?: string; lane?: 'text' | 'image'; directPrompt?: string };
    if (!body.requestPath && !body.directPrompt) throw new Error('缺少任务内容');
    return NextResponse.json(startCodexRun(body.requestPath ?? '', body.threadId, body.lane === 'image' ? 'image' : 'text', body.directPrompt), { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '无法启动 Codex' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id') ?? '';
    return NextResponse.json(await cancelCodexRun(id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '无法取消 Codex' }, { status: 400 });
  }
}
