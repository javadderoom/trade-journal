'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import SideNavBar from './SideNavBar';
import BottomNavBar from './BottomNavBar';
import { useAuthStore } from '../../lib/auth';
import Toaster from '../ui/Toaster';
import { Agentation } from 'agentation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    // 1. Wrap global fetch to automatically attach access token and handle refresh on 401
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      
      let isApiCall = false;
      let isAuthRoute = false;

      try {
        const parsedUrl = new URL(url, window.location.origin);
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        let apiOrigin = '';
        try {
          apiOrigin = new URL(apiBase).origin;
        } catch (_) {}

        const isLocalOrigin = parsedUrl.origin === window.location.origin || (apiOrigin && parsedUrl.origin === apiOrigin);
        isApiCall = isLocalOrigin && parsedUrl.pathname.startsWith('/api') && !parsedUrl.pathname.startsWith('/api/exchange-rate');
        isAuthRoute = parsedUrl.pathname.includes('/api/auth/refresh') || parsedUrl.pathname.includes('/api/auth/login');
      } catch (e) {
        const isRelative = !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//');
        isApiCall = isRelative && url.startsWith('/api') && !url.startsWith('/api/exchange-rate');
        isAuthRoute = url.includes('/api/auth/refresh') || url.includes('/api/auth/login');
      }

      if (isApiCall) {
        let newInit = { ...init };
        const token = useAuthStore.getState().accessToken;
        
        if (token && !isAuthRoute) {
          const headers = new Headers(newInit.headers || {});
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          newInit.headers = headers;
        }
        
        newInit.credentials = 'include';

        try {
          let response = await originalFetch(input, newInit);
          
          if (response.status === 401 && !isAuthRoute) {
            const newAccessToken = await useAuthStore.getState().refresh();
            if (newAccessToken) {
              const headers = new Headers(newInit.headers || {});
              headers.set('Authorization', `Bearer ${newAccessToken}`);
              newInit.headers = headers;
              response = await originalFetch(input, newInit);
            } else {
              useAuthStore.getState().logout();
            }
          }
          return response;
        } catch (error) {
          throw error;
        }
      }

      return originalFetch(input, init);
    };

    // 2. Initialize authentication
    initialize();

    return () => {
      window.fetch = originalFetch;
    };
  }, [initialize]);

  const isAuthPage = pathname ? (pathname.startsWith('/login') || pathname.startsWith('/register')) : false;
  const isLandingPage = pathname === '/' || pathname === '/namad';
  const isHelpPage = pathname ? pathname.startsWith('/help') : false;
  const isContactPage = pathname === '/contact';
  const isPublicPage = isLandingPage || isHelpPage || isContactPage;

  useEffect(() => {
    if (!isInitialized || !pathname) return;

    if (!user && !isAuthPage && !isPublicPage) {
      router.replace('/login');
    } else if (user && isAuthPage) {
      router.replace('/dashboard');
    }
    // Logged-in users on the landing page are redirected to /dashboard by the
    // LandingPage component itself.
  }, [user, isInitialized, isAuthPage, isPublicPage, pathname, router]);

  if (!isInitialized || !pathname) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0B0F19',
        color: '#E2E8F0',
        fontFamily: 'Vazirmatn, sans-serif'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(99, 102, 241, 0.1)',
            borderTop: '3px solid #6366F1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>در حال بارگذاری تریدکاو...</span>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Prevent flash of protected page content while redirecting to login
  if (!user && !isAuthPage && !isPublicPage) {
    return null;
  }

  // Prevent flash of auth page content while redirecting to home
  if (user && isAuthPage) {
    return null;
  }

  // Public pages (landing) render full-bleed, no app chrome
  if (isPublicPage) {
    return (
      <>
        <Toaster />
        {children}
        {process.env.NODE_ENV === 'development' && <Agentation />}
      </>
    );
  }

  if (isAuthPage) {
    return (
      <div className="auth-wrapper">
        <Toaster />
        {children}
        {process.env.NODE_ENV === 'development' && <Agentation />}
      </div>
    );
  }

  return (
    <div className="app-container">
      <SideNavBar />
      <div className="main-content-wrapper">{children}</div>
      <BottomNavBar />
      <Toaster />
      {process.env.NODE_ENV === 'development' && <Agentation />}
    </div>
  );
}

