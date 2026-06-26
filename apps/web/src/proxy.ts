import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedPaths = ['/trades', '/analytics', '/dashboard', '/settings', '/strategies'];
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));

  const authPaths = ['/login', '/register'];
  const isAuthPage = authPaths.some(path => pathname.startsWith(path));

  const refreshToken = request.cookies.get('refreshToken')?.value;

  if (isProtected && !refreshToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && refreshToken) {
    const homeUrl = new URL('/trades', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/trades/:path*',
    '/analytics/:path*',
    '/dashboard/:path*',
    '/settings/:path*',
    '/strategies/:path*',
    '/login',
    '/register'
  ],
};
