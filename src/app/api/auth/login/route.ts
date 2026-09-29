import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, TOKEN_COOKIE, backendHeaders, jwtExpiry } from '@/lib/server/backend';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.username || !body?.password) {
    return NextResponse.json({ detail: 'Username and password are required' }, { status: 422 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...backendHeaders(undefined) },
      body: JSON.stringify({ username: body.username, password: body.password }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ detail: 'Backend is unreachable' }, { status: 502 });
  }

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok || !data.access_token) {
    const status = upstream.status === 401 ? 401 : upstream.ok ? 502 : upstream.status;
    return NextResponse.json(
      { detail: typeof data.detail === 'string' ? data.detail : 'Login failed' },
      { status }
    );
  }

  const exp = jwtExpiry(data.access_token);
  const maxAge = exp ? Math.max(exp - Math.floor(Date.now() / 1000), 0) : 60 * 60 * 8;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TOKEN_COOKIE, data.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && req.nextUrl.protocol === 'https:',
    path: '/',
    maxAge,
  });
  return res;
}
