'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';

export default function PublicHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const locale = (params?.locale as string) || 'fa';
  const isEn = locale === 'en';

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goRegister = () => router.push('/register');
  const goLogin = () => router.push('/login');

  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLangSwitch = () => {
    let newPath = pathname;
    if (isEn) {
      newPath = newPath.replace(/^\/en/, '/fa');
    } else {
      newPath = newPath.replace(/^\/fa/, '/en');
    }
    if (newPath === '/') newPath = isEn ? '/fa' : '/en';
    router.push(newPath);
  };

  const navLinks = isEn 
    ? [
        { href: '#how', label: 'How it Works' },
        { href: '#features', label: 'Features' },
        { href: '#pricing', label: 'Pricing' },
        { href: '/en/tools', label: 'Tools' },
        { href: '/en/blog', label: 'Blog' },
        { href: '/en/community', label: 'Community' },
        { href: '/en/contact', label: 'Contact Us' },
      ]
    : [
        { href: '#how', label: 'روش کار' },
        { href: '#features', label: 'امکانات' },
        { href: '#pricing', label: 'تعرفه‌ها' },
        { href: '/fa/tools', label: 'ابزارها' },
        { href: '/fa/blog', label: 'وبلاگ' },
        { href: '/fa/community', label: 'انجمن' },
        { href: '/fa/contact', label: 'تماس با ما' },
      ];

  const signinLabel = isEn ? 'Sign In' : 'ورود';
  const registerLabel = isEn ? 'Start Free' : 'شروع رایگان';
  const mobMenuLabel = isEn ? 'Menu' : 'منو';

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
    // Check if we are on the exact landing page
    const isLandingPage = pathname === `/${locale}` || pathname === `/${locale}/`;

    // 1. Regular internal page links (e.g. /fa/blog)
    if (href.startsWith('/')) {
      router.push(href);
      setMobileMenuOpen(false);
      return;
    }

    // 2. Hash link handling
    if (href.startsWith('#')) {
      // If we are NOT on the landing page, navigate to the landing page with the hash
      if (!isLandingPage) {
        router.push(`/${locale}${href}`);
        setMobileMenuOpen(false);
        return;
      }

      // If we ARE on the landing page, scroll smoothly
      if (href === '#top') {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
        setMobileMenuOpen(false);
        return;
      }

      const targetId = href.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        const navHeight = 68; // height of fixed nav
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - navHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
  };

  return (
    <nav className={`landing-nav ${navScrolled ? 'scrolled' : ''}`}>
      <a className="landing-logo" href="#top" aria-label="TradeKav" onClick={(e) => handleScroll(e, '#top')}>
        <img src="/logo.png" alt="TradeKav" className="logo-img-landing" style={{ height: '34px', width: 'auto', objectFit: 'contain' }} />
        <span className="logo-text">{isEn ? 'TradeKav' : 'تریدکاو'}</span>
      </a>
      <div className="landing-nav-links">
        {navLinks.map((l) => (
          <a key={l.href} href={l.href} onClick={(e) => handleScroll(e, l.href)}>{l.label}</a>
        ))}
      </div>
      <div className="landing-nav-cta">
        <button 
          className="lang-switcher" 
          onClick={handleLangSwitch} 
          style={{ marginInlineEnd: '16px', background: 'transparent', border: '1px solid #1e2535', color: '#f0f2f5', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          {isEn ? 'فارسی' : 'English'}
        </button>
        {user ? (
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 0
              }}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {user.name?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </button>
            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: isEn ? 0 : 'auto',
                left: isEn ? 'auto' : 0,
                background: '#111319',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '8px 0',
                minWidth: '180px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                zIndex: 100
              }}>
                <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#f8fafc', padding: '8px 16px', textAlign: isEn ? 'left' : 'right', cursor: 'pointer', width: '100%' }}>
                  {isEn ? 'Dashboard' : 'پنل کاربری'}
                </button>
                <button onClick={() => router.push(`/${locale}/community/user/${user.id}`)} style={{ background: 'none', border: 'none', color: '#f8fafc', padding: '8px 16px', textAlign: isEn ? 'left' : 'right', cursor: 'pointer', width: '100%' }}>
                  {isEn ? 'Your Profile' : 'پروفایل شما'}
                </button>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#ef4444', padding: '8px 16px', textAlign: isEn ? 'left' : 'right', cursor: 'pointer', width: '100%' }}>
                  {isEn ? 'Log Out' : 'خروج'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button className="btn-ghost" onClick={goLogin}>{signinLabel}</button>
            <button className="btn-primary" onClick={goRegister}>{registerLabel}</button>
          </>
        )}
      </div>
      <button
        className={`landing-nav-burger ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen((v) => !v)}
        aria-label={mobMenuLabel}
      >
        <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
      </button>
      {mobileMenuOpen && (
        <div className="landing-mobile-menu">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={(e) => handleScroll(e, l.href)}>{l.label}</a>
          ))}
          {user ? (
            <>
              <button className="btn-ghost full" onClick={() => { setMobileMenuOpen(false); router.push('/dashboard'); }}>
                {isEn ? 'Dashboard' : 'پنل کاربری'}
              </button>
              <button className="btn-primary full" onClick={() => { setMobileMenuOpen(false); handleLogout(); }}>
                {isEn ? 'Log Out' : 'خروج'}
              </button>
            </>
          ) : (
            <button className="btn-primary full" onClick={() => { setMobileMenuOpen(false); goRegister(); }}>
              {registerLabel}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
