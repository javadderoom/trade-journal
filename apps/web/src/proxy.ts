import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── 1. i18n Redirects for Public Pages ─────────────────────────────────────
  const PUBLIC_PATHS = ['/logo.png', '/favicon.ico', '/fonts/', '/help/', '/api/'];
  const isStaticOrApi = PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname.includes('.');

  if (!isStaticOrApi) {
    const locales = ['fa', 'en'];
    const hasLocale = locales.some(
      locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (!hasLocale) {
      // Determine locale preference
      let locale = 'fa'; // Default fallback
      const cookieLocale = request.cookies.get('locale')?.value;
      if (cookieLocale && locales.includes(cookieLocale)) {
        locale = cookieLocale;
      } else {
        const acceptLang = request.headers.get('accept-language');
        if (acceptLang && acceptLang.toLowerCase().includes('en')) {
          locale = 'en';
        }
      }

      if (pathname === '/') {
        return NextResponse.redirect(new URL(`/${locale}`, request.url));
      }

      if (pathname === '/contact') {
        return NextResponse.redirect(new URL(`/${locale}/contact`, request.url));
      }
    }
  }

  // ─── 2. Route Protection ────────────────────────────────────────────────────
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
    '/contact',
    '/trades/:path*',
    '/analytics/:path*',
    '/dashboard/:path*',
    '/settings/:path*',
    '/strategies/:path*',
    '/login',
    '/register'
  ],
};
