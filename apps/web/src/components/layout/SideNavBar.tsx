'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function SideNavBar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'داشبورد', icon: 'dashboard' },
    { href: '/trades', label: 'معاملات', icon: 'analytics', fillIcon: true },

    { href: '/journal', label: 'ژورنال', icon: 'menu_book' },
    { href: '/strategies', label: 'استراتژی‌ها', icon: 'query_stats' },
    { href: '/settings', label: 'تنظیمات', icon: 'settings' },
  ];

  return (
    <nav className="sidenav-container">
      <div className="sidenav-inner">
        {/* Header */}
        <div className="sidenav-header">
          <div className="logo-box">
            <Image
              src="/logo.png"
              alt="معامله‌یار"
              width={40}
              height={40}
              className="logo-img"
              priority
            />
          </div>
          <div className="title-group">
            <span className="title-text">پنل معامله‌گر</span>
            <span className="subtitle-text">نسخه حرفه‌ای</span>
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
        <div className="sidenav-cta-box">
          <span className="cta-title">حساب حرفه‌ای</span>
          <span className="cta-desc">دسترسی به تمامی ابزارها و گزارش‌های پیشرفته معاملات</span>
          <button className="upgrade-btn">ارتقاء حساب</button>
        </div>

        {/* Footer Link */}
        <div className="sidenav-footer">
          <Link href="/logout" className="logout-link">
            <span className="material-symbols-outlined icon">logout</span>
            <span className="label">خروج</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
