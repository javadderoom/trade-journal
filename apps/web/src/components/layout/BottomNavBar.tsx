'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '../../store/useAppStore';
import { useAuthStore } from '../../lib/auth';
import { notify } from '../../lib/notify';

export interface NavDrawerItem {
  href?: string;
  label: string;
  icon: string;
  onClick?: () => void;
}

export default function BottomNavBar() {
  const pathname = usePathname();
  const { t, language, setLanguage } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isTradesActive = pathname === '/trades' || pathname.startsWith('/trades');
  const isAnalyticsActive = pathname === '/analytics';
  const isDashboardActive = pathname === '/dashboard' || pathname === '/';
  const isSettingsActive = pathname === '/settings';

  const logout = useAuthStore((state) => state.logout);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'fa' ? 'en' : 'fa');
  }, [language, setLanguage]);

  const handleLogout = useCallback(async () => {
    const ok = await notify.confirm({
      title: language === 'fa' ? 'خروج از حساب کاربری' : 'Log Out of Account',
      message:
        language === 'fa'
          ? 'آیا برای خروج از حساب کاربری خود اطمینان دارید؟'
          : 'Are you sure you want to log out of your account?',
      confirmLabel: language === 'fa' ? 'خروج' : 'Log Out',
      cancelLabel: language === 'fa' ? 'لغو' : 'Cancel',
    });
    if (ok) await logout();
  }, [language, logout]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const langLabel = language === 'fa' ? 'English' : 'فارسی';
  const langIcon = 'translate';

  const drawerItems: NavDrawerItem[] = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: 'dashboard' },
    { href: '/support', label: t('nav.support'), icon: 'contact_support' },
    { label: langLabel, icon: langIcon, onClick: toggleLanguage },
    { label: t('common.logout'), icon: 'logout', onClick: handleLogout },
  ];

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      {/* Dimmed backdrop when navbar expands */}
      {menuOpen && (
        <div className="bottom-nav-backdrop" onClick={closeMenu} />
      )}

      <div className={`bottom-nav-container ${menuOpen ? 'expanded' : ''}`}>
        {/* Expanded Navbar Upper Drawer Deck */}
        <div className="bottom-nav-drawer">
          <div className="bottom-nav-drawer-header">
            <span className="bottom-nav-drawer-title">
              {language === 'fa' ? 'منوی دسترسی سریع' : 'Quick Access'}
            </span>
          </div>

          <div className="bottom-nav-drawer-grid">
            {drawerItems.map((item) => {
              const isActive = !!item.href && pathname === item.href;
              const sharedProps = {
                className: `bottom-nav-drawer-item ${isActive ? 'active' : ''}`,
              };

              const inner = (
                <>
                  <div className="drawer-icon-box">
                    <span
                      className="material-symbols-outlined icon"
                      style={{ fontVariationSettings: isActive ? "'FILL' 1" : undefined }}
                    >
                      {item.icon}
                    </span>
                  </div>
                  <span className="drawer-label">{item.label}</span>
                </>
              );

              if (item.onClick) {
                return (
                  <button
                    key={item.label}
                    {...sharedProps}
                    onClick={() => {
                      item.onClick?.();
                      closeMenu();
                    }}
                  >
                    {inner}
                  </button>
                );
              }

              return (
                <Link
                  key={item.href || item.label}
                  href={item.href!}
                  {...sharedProps}
                  onClick={closeMenu}
                >
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Primary Navbar Bar Row */}
        <div className="bottom-nav-main-row">
          {/* 1. Trades */}
          <Link href="/trades" className={`bottom-nav-item ${isTradesActive ? 'active' : ''}`} onClick={closeMenu}>
            <div className="bottom-nav-icon-wrapper">
              <span className="material-symbols-outlined icon" style={isTradesActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                analytics
              </span>
            </div>
            <span className="label">{t('nav.trades')}</span>
          </Link>

          {/* 2. Analytics */}
          <Link href="/analytics" className={`bottom-nav-item ${isAnalyticsActive ? 'active' : ''}`} onClick={closeMenu}>
            <div className="bottom-nav-icon-wrapper">
              <span className="material-symbols-outlined icon" style={isAnalyticsActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                bar_chart
              </span>
            </div>
            <span className="label">{t('nav.analytics')}</span>
          </Link>

          {/* 3. Center FAB — expands bottom navbar */}
          <div className="bottom-nav-raised-wrapper">
            <button
              className={`bottom-nav-raised-item ${menuOpen ? 'menu-open' : ''} ${isDashboardActive ? 'active' : ''}`}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation drawer"
            >
              <span
                className="material-symbols-outlined icon"
                style={{
                  transition: 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                  transform: menuOpen ? 'rotate(90deg)' : undefined,
                }}
              >
                {menuOpen ? 'close' : 'apps'}
              </span>
            </button>
          </div>

          {/* 4. Journal */}
          <Link href="/journal" className={`bottom-nav-item ${pathname === '/journal' ? 'active' : ''}`} onClick={closeMenu}>
            <div className="bottom-nav-icon-wrapper">
              <span className="material-symbols-outlined icon" style={pathname === '/journal' ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                sticky_note_2
              </span>
            </div>
            <span className="label">{t('nav.journal')}</span>
          </Link>

          {/* 5. Settings */}
          <Link href="/settings" className={`bottom-nav-item ${isSettingsActive ? 'active' : ''}`} onClick={closeMenu}>
            <div className="bottom-nav-icon-wrapper">
              <span className="material-symbols-outlined icon" style={isSettingsActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                settings
              </span>
            </div>
            <span className="label">{t('nav.settings')}</span>
          </Link>
        </div>
      </div>
    </>
  );
}
