'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '../../store/useAppStore';
import RadialMenu, { RadialMenuItem } from './RadialMenu';

export default function BottomNavBar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isTradesActive = pathname === '/trades' || pathname.startsWith('/trades');
  const isAnalyticsActive = pathname === '/analytics';
  const isDashboardActive = pathname === '/dashboard' || pathname === '/';
  const isSettingsActive = pathname === '/settings';

  const radialItems: RadialMenuItem[] = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: 'dashboard' },
    { href: '/support', label: t('nav.support'), icon: 'contact_support' },
  ];

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <RadialMenu items={radialItems} open={menuOpen} onClose={closeMenu} />

      <div className={`bottom-nav-container ${menuOpen ? 'menu-open' : ''}`}>
        {/* 1. Trades */}
        <Link href="/trades" className={`bottom-nav-item ${isTradesActive ? 'active' : ''}`}>
          <div className="bottom-nav-icon-wrapper">
            <span className="material-symbols-outlined icon" style={isTradesActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
              analytics
            </span>
          </div>
          <span className="label">{t('nav.trades')}</span>
        </Link>

        {/* 2. Analytics */}
        <Link href="/analytics" className={`bottom-nav-item ${isAnalyticsActive ? 'active' : ''}`}>
          <div className="bottom-nav-icon-wrapper">
            <span className="material-symbols-outlined icon" style={isAnalyticsActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
              bar_chart
            </span>
          </div>
          <span className="label">{t('nav.analytics')}</span>
        </Link>

        {/* 3. Center FAB — opens radial menu */}
        <div className="bottom-nav-raised-wrapper">
          <button
            className={`bottom-nav-raised-item ${menuOpen ? 'menu-open' : ''} ${isDashboardActive ? 'active' : ''}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Open menu"
          >
            <span
              className="material-symbols-outlined icon"
              style={{
                transition: 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                transform: menuOpen ? 'rotate(45deg)' : undefined,
              }}
            >
              {menuOpen ? 'close' : 'add'}
            </span>
          </button>
          <span className="raised-label">{t('nav.more')}</span>
        </div>

        {/* 4. Journal */}
        <Link href="/journal" className={`bottom-nav-item ${pathname === '/journal' ? 'active' : ''}`}>
          <div className="bottom-nav-icon-wrapper">
            <span className="material-symbols-outlined icon" style={pathname === '/journal' ? { fontVariationSettings: "'FILL' 1" } : undefined}>
              sticky_note_2
            </span>
          </div>
          <span className="label">{t('nav.journal')}</span>
        </Link>

        {/* 5. Settings */}
        <Link href="/settings" className={`bottom-nav-item ${isSettingsActive ? 'active' : ''}`}>
          <div className="bottom-nav-icon-wrapper">
            <span className="material-symbols-outlined icon" style={isSettingsActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
              settings
            </span>
          </div>
          <span className="label">{t('nav.settings')}</span>
        </Link>
      </div>
    </>
  );
}
