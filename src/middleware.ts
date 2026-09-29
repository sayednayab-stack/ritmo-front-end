import { NextRequest, NextResponse } from 'next/server';

// Cookie presence only gates page navigation; the backend still validates the JWT
// on every proxied call, and the proxy clears the cookie when it is rejected.
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has('ritmo_token');
  const { pathname, search } = req.nextUrl;

  if (pathname === '/login') {
    if (hasSession) return NextResponse.redirect(new URL('/', req.url));
    return NextResponse.next();
  }

  if (!hasSession) {
    const url = new URL('/login', req.url);
    if (pathname !== '/') url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
