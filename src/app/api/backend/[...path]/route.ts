import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, TOKEN_COOKIE, backendHeaders, isAllowedPath } from '@/lib/server/backend';

export const dynamic = 'force-dynamic';

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
  }

  const path = params.path.join('/');
  if (!isAllowedPath(path)) {
    return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  }

  const headers: Record<string, string> = backendHeaders(token);
  const contentType = req.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const body = hasBody ? await req.arrayBuffer() : undefined;

  // FastAPI redirects "/fleet" <-> "/fleet/" (307) and Next strips trailing slashes,
  // so follow those redirects here. fetch() cannot replay a request body across a
  // redirect, hence the manual loop. Each hop is rebuilt against BACKEND_URL so a
  // Location header can never send the API keys to another host.
  let url = `${BACKEND_URL}/${path}${req.nextUrl.search}`;
  let upstream: Response | undefined;
  try {
    for (let hop = 0; hop < 3; hop++) {
      upstream = await fetch(url, { method: req.method, headers, body, redirect: 'manual', cache: 'no-store' });
      const location = upstream.headers.get('location');
      if (![307, 308].includes(upstream.status) || !location) break;
      const next = new URL(location, BACKEND_URL);
      url = `${BACKEND_URL}${next.pathname}${next.search}`;
    }
  } catch (err) {
    console.error('[proxy] backend request failed:', req.method, path, err);
    return NextResponse.json({ detail: 'Backend is unreachable' }, { status: 502 });
  }
  if (!upstream) return NextResponse.json({ detail: 'Backend is unreachable' }, { status: 502 });

  const res = new NextResponse(upstream.status === 204 ? null : upstream.body, {
    status: upstream.status,
  });
  const upstreamType = upstream.headers.get('content-type');
  if (upstreamType) res.headers.set('Content-Type', upstreamType);
  const disposition = upstream.headers.get('content-disposition');
  if (disposition) res.headers.set('Content-Disposition', disposition);

  // The backend rejecting our JWT means the session is over.
  if (upstream.status === 401) res.cookies.delete(TOKEN_COOKIE);
  return res;
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
