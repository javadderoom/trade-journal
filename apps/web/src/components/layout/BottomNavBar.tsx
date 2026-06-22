'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNavBar() {
  const pathname = usePathname();

  const isTradesActive = pathname === '/trades' || pathname.startsWith('/trades');
  const isAnalyticsActive = pathname === '/analytics';
  const isDashboardActive = pathname === '/dashboard' || pathname === '/';
  const isSettingsActive = pathname === '/settings';

  return (
    <div className="bottom-nav-container">
      {/* 1. Trades */}
      <Link href="/trades" className={`bottom-nav-item ${isTradesActive ? 'active' : ''}`}>
        <div className="bottom-nav-icon-wrapper">
          <span className="material-symbols-outlined icon" style={isTradesActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
            analytics
          </span>
        </div>
        <span className="label">معاملات</span>
      </Link>

      {/* 2. Analytics */}
      <Link href="/analytics" className={`bottom-nav-item ${isAnalyticsActive ? 'active' : ''}`}>
        <div className="bottom-nav-icon-wrapper">
          <span className="material-symbols-outlined icon" style={isAnalyticsActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
            bar_chart
          </span>
        </div>
        <span className="label">گزارش عملکرد</span>
      </Link>

      {/* 3. Dashboard (Raised Middle Button) */}
      <div className="bottom-nav-raised-wrapper">
        <Link href="/dashboard" className={`bottom-nav-raised-item ${isDashboardActive ? 'active' : ''}`}>
          <span className="material-symbols-outlined icon" style={isDashboardActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
            dashboard
          </span>
        </Link>
        <span className="raised-label">داشبورد</span>
      </div>

      {/* 4. Journal */}
      <Link href="/journal" className={`bottom-nav-item ${pathname === '/journal' ? 'active' : ''}`}>
        <div className="bottom-nav-icon-wrapper">
          <span className="material-symbols-outlined icon" style={pathname === '/journal' ? { fontVariationSettings: "'FILL' 1" } : undefined}>
            sticky_note_2
          </span>
        </div>
        <span className="label">ژورنال</span>
      </Link>

      {/* 5. Settings */}
      <Link href="/settings" className={`bottom-nav-item ${isSettingsActive ? 'active' : ''}`}>
        <div className="bottom-nav-icon-wrapper">
          <span className="material-symbols-outlined icon" style={isSettingsActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
            settings
          </span>
        </div>
        <span className="label">تنظیمات</span>
      </Link>
    </div>
  );
}
