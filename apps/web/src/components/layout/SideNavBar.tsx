'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/auth';
import { useTranslation } from '../../store/useAppStore';

export default function SideNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { t, language, setLanguage } = useTranslation();

  const planLabel = language === 'fa'
    ? (user?.plan === 'PRO' ? 'نسخه حرفه‌ای' : user?.plan === 'STANDARD' ? 'نسخه استاندارد' : 'نسخه رایگان')
    : (user?.plan === 'PRO' ? 'PRO Edition' : user?.plan === 'STANDARD' ? 'Standard Edition' : 'Free Edition');

  const navItems = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: 'dashboard' },
    { href: '/trades', label: t('nav.trades'), icon: 'analytics', fillIcon: true },
    { href: '/analytics', label: t('nav.analytics'), icon: 'bar_chart' },
    { href: '/journal', label: t('nav.journal'), icon: 'sticky_note_2' },
    { href: '/support', label: t('nav.support'), icon: 'contact_support' },
    { href: '/settings', label: t('nav.settings'), icon: 'settings' },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ href: '/admin', label: t('nav.admin'), icon: 'admin_panel_settings' });
    navItems.push({ href: '/admin/support', label: t('nav.adminSupport'), icon: 'support_agent' });
  }

  return (
    <nav className="sidenav-container">
      <div className="sidenav-inner">
        {/* Header */}
        <div className="sidenav-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="logo-box">
              <img
                src="/logo.png?v=2"
                alt="TradeKav"
                width={40}
                height={40}
                className="logo-img"
              />
            </div>
            <div className="title-group">
              <span className="title-text">{language === 'fa' ? 'پنل معامله‌گر' : 'Trader Panel'}</span>
              <span className="subtitle-text">{planLabel}</span>
            </div>
          </div>
          <button
            onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: 'rgba(255,255,255,0.6)',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          >
            {language === 'fa' ? 'EN' : 'FA'}
          </button>
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
              {language === 'fa' 
                ? (user?.plan === 'STANDARD' ? 'ارتقا به حساب حرفه‌ای' : 'حساب حرفه‌ای')
                : (user?.plan === 'STANDARD' ? 'Upgrade to PRO' : 'PRO Account')}
            </span>
            <span className="cta-desc">
              {language === 'fa'
                ? (user?.plan === 'STANDARD'
                  ? 'دسترسی به تحلیل‌های پیشرفته‌تر و امکان اتصال نامحدود حساب‌ها'
                  : 'دسترسی به تمامی ابزارها و گزارش‌های پیشرفته معاملات')
                : (user?.plan === 'STANDARD'
                  ? 'Get advanced analytics and link unlimited trading accounts.'
                  : 'Get access to premium metrics and advanced trading logs.')}
            </span>
            <button className="upgrade-btn" onClick={() => router.push('/settings?tab=subscription')}>
              {language === 'fa' ? 'ارتقاء حساب' : 'Upgrade Now'}
            </button>
          </div>
        )}

        {/* Footer Link */}
        <div className="sidenav-footer" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            href="/contact"
            className="logout-link"
            style={{
              display: 'flex',
              alignItems: 'center',
              color: 'inherit',
              textDecoration: 'none',
              padding: 0,
            }}
          >
            <span className="material-symbols-outlined icon">contact_support</span>
            <span className="label" style={{ marginInlineStart: '12px' }}>{t('nav.contact')}</span>
          </Link>

          <button
            onClick={() => setShowLogoutConfirm(true)}
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
            <span className="label" style={{ marginInlineStart: '12px' }}>{t('common.logout')}</span>
          </button>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="logout-confirm-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="logout-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="material-symbols-outlined modal-icon">logout</span>
              <h3>{language === 'fa' ? 'خروج از حساب کاربری' : 'Log Out of Account'}</h3>
            </div>
            <p className="modal-desc">
              {language === 'fa' 
                ? 'آیا برای خروج از حساب کاربری خود اطمینان دارید؟' 
                : 'Are you sure you want to log out of your account?'}
            </p>
            <div className="modal-actions">
              <button
                className="confirm-btn"
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await logout();
                }}
              >
                {t('common.logout')}
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowLogoutConfirm(false)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
