import { NextRequest, NextResponse } from 'next/server';
import { readAsset } from '@/lib/workspace-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const path = request.nextUrl.searchParams.get('path') ?? '';
    const asset = await readAsset(path);
    return new NextResponse(new Uint8Array(asset.data), {
      headers: { 'Content-Type': asset.mimeType, 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '读取失败' }, { status: 404 });
  }
}
