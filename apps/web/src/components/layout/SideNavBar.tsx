'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/auth';

export default function SideNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  const planLabel = user?.plan === 'PRO' 
    ? 'نسخه حرفه‌ای' 
    : user?.plan === 'STANDARD' 
    ? 'نسخه استاندارد' 
    : 'نسخه رایگان';

  const navItems = [
    { href: '/dashboard', label: 'داشبورد', icon: 'dashboard' },
    { href: '/trades', label: 'معاملات', icon: 'analytics', fillIcon: true },

    { href: '/analytics', label: 'گزارش عملکرد', icon: 'bar_chart' },
    { href: '/journal', label: 'ژورنال', icon: 'sticky_note_2' },
    { href: '/settings', label: 'تنظیمات', icon: 'settings' },
  ];

  return (
    <nav className="sidenav-container">
      <div className="sidenav-inner">
        {/* Header */}
        <div className="sidenav-header">
          <div className="logo-box">
            <img
              src="/logo.png?v=2"
              alt="تریدکاو"
              width={40}
              height={40}
              className="logo-img"
            />
          </div>
          <div className="title-group">
            <span className="title-text">پنل معامله‌گر</span>
            <span className="subtitle-text">{planLabel}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="sidenav-links">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/trades' && pathname.startsWith('/trades'));
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

        {/* CTA Upgrade */}
        {user?.plan !== 'PRO' && (
          <div className="sidenav-cta-box">
            <span className="cta-title">
              {user?.plan === 'STANDARD' ? 'ارتقا به حساب حرفه‌ای' : 'حساب حرفه‌ای'}
            </span>
            <span className="cta-desc">
              {user?.plan === 'STANDARD'
                ? 'دسترسی به تحلیل‌های پیشرفته‌تر و امکان اتصال نامحدود حساب‌ها'
                : 'دسترسی به تمامی ابزارها و گزارش‌های پیشرفته معاملات'}
            </span>
            <button className="upgrade-btn" onClick={() => router.push('/settings?tab=subscription')}>
              ارتقاء حساب
            </button>
          </div>
        )}

        {/* Footer Link */}
        <div className="sidenav-footer">
          <button
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="logout-link"
            style={{
              background: 'none',
              border: 'none',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'inherit',
              padding: 0,
              fontFamily: 'inherit',
            }}
          >
            <span className="material-symbols-outlined icon">logout</span>
            <span className="label" style={{ marginRight: '12px' }}>خروج</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
