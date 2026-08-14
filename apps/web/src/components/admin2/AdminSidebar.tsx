'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/auth';
import { useAppStore } from '../../store/useAppStore';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const isSidebarCollapsed = useAppStore(state => state.isSidebarCollapsed);
  const setSidebarCollapsed = useAppStore(state => state.setSidebarCollapsed);

  const navItems = [
    { href: '/admin2', label: 'آمار سیستم', icon: 'analytics' },
    { href: '/admin2/users', label: 'مدیریت کاربران', icon: 'group' },
    { href: '/admin2/receipts', label: 'تایید پرداخت‌ها', icon: 'payments' },
    { href: '/admin2/coupons', label: 'کدهای تخفیف', icon: 'sell' },
    { href: '/admin2/blog', label: 'مدیریت وبلاگ', icon: 'article' },
    { href: '/admin2/reports', label: 'گزارش کامیونیتی', icon: 'flag' },
    { href: '/admin2/experts', label: 'مدیریت اکسپرت', icon: 'upload_file' },
    { href: '/admin2/market-data', label: 'دیتای بازار', icon: 'monitoring' },
    { href: '/admin2/support', label: 'پشتیبانی تیکت‌ها', icon: 'support_agent' },
    { href: '/admin2/settings', label: 'تنظیمات سیستم', icon: 'settings' },
  ];

  return (
    <nav className={`sidenav-container ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidenav-inner">
        {/* Header */}
        <div className="sidenav-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="logo-box" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
              <span className="material-symbols-outlined text-cyan-500" style={{ fontSize: '24px' }}>
                admin_panel_settings
              </span>
            </div>
            <div className="title-group">
              <span className="title-text">معامله‌یار Admin</span>
              <span className="subtitle-text">نسخه جدید</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '6px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                {isSidebarCollapsed ? 'menu_open' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="sidenav-links">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidenav-link-item ${isActive ? 'active' : ''}`}
              >
                <span
                  className="material-symbols-outlined icon"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="label">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer Link */}
        <div className="sidenav-footer" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            href="/dashboard"
            className="logout-link"
            style={{
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <span className="material-symbols-outlined icon">arrow_back</span>
            <span className="label" style={{ marginInlineStart: '12px' }}>بازگشت به پنل کاربری</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
