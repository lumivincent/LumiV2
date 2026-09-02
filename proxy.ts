import { NextRequest, NextResponse } from 'next/server';

function unauthorized() {
  return new NextResponse('需要登录 Lumiterra V2 工作台', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Lumiterra V2", charset="UTF-8"' },
  });
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/api/health') return NextResponse.next();
  const password = process.env.APP_ACCESS_PASSWORD?.trim();
  if (!password) return NextResponse.next();
  const username = process.env.APP_ACCESS_USERNAME?.trim() || 'lumiterra';
  const expected = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  return request.headers.get('authorization') === expected ? NextResponse.next() : unauthorized();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
