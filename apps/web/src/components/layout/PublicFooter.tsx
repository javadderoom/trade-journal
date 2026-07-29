'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { toPersianDigits } from '../../utils/farsi';

export default function PublicFooter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  
  const locale = (params?.locale as string) || 'fa';
  const isEn = locale === 'en';

  const goRegister = () => router.push('/register');

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const isLandingPage = pathname === `/${locale}` || pathname === `/${locale}/`;

    if (href.startsWith('#')) {
      if (!isLandingPage) {
        router.push(`/${locale}${href}`);
        return;
      }
      const targetId = href.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        const navHeight = 68;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - navHeight;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }
  };

  const copy = {
    finalCtaTitle: isEn ? 'Ready to discover your trading edge?' : 'آماده کشف برتری معاملاتی خودت هستی؟',
    finalCtaSub: isEn ? 'Free forever. No time limits.' : 'رایگان، بدون محدودیت زمانی.',
    finalCtaBtn: isEn ? 'Start Now' : 'همین الان شروع کن',
    footerDesc: isEn 
      ? 'Smart trading journal, built for professional traders.' 
      : 'ژورنال معاملاتی هوشمند فارسی، ساخته‌شده برای معامله‌گران ایرانی.',
    footerProduct: isEn ? 'Product' : 'محصول',
    footerAccount: isEn ? 'Account' : 'حساب کاربری',
    footerSupport: isEn ? 'Support' : 'پشتیبانی',
    footerCopyright: isEn ? 'TradeKav. All rights reserved.' : 'تریدکاو. تمامی حقوق محفوظ است.',
    startFree: isEn ? 'Start Free' : 'شروع رایگان'
  };

  return (
    <>
      {/* ─── Final CTA ─── */}
      <section className="landing-final-cta">
        <div className="final-glow" aria-hidden="true" />
        <h2>{copy.finalCtaTitle}</h2>
        <p>{copy.finalCtaSub}</p>
        <button className="btn-primary lg glow" onClick={goRegister}>
          {copy.finalCtaBtn}
          <span className="material-symbols-outlined">{isEn ? 'arrow_forward' : 'arrow_back'}</span>
        </button>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand-col">
            <div className="footer-brand">
              <img src="/logo.png" alt="TradeKav" className="logo-img-landing" style={{ height: '34px', width: 'auto', objectFit: 'contain' }} />
              <span className="logo-text">{isEn ? 'TradeKav' : 'تریدکاو'}</span>
            </div>
            <p className="footer-tag">{copy.footerDesc}</p>
            {/* e-namad logo shown only in Persian */}
            {!isEn && (
              <div className="footer-namad" style={{ marginTop: '16px' }}>
                <Link href="/namad">
                  <img
                    referrerPolicy="origin"
                    src="https://trustseal.enamad.ir/logo.aspx?id=750622&Code=ijlypx97VzY8LxxCpiKO81gBE1Ju0VRE"
                    alt="نماد اعتماد الکترونیکی تریدکاو"
                    style={{ cursor: 'pointer', width: '60px', height: '60px', backgroundColor: '#ffffff', padding: '6px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </Link>
              </div>
            )}
          </div>
          <div className="footer-links">
            <div>
              <h4>{copy.footerProduct}</h4>
              <a href="#features" onClick={(e) => handleScroll(e, '#features')}>{isEn ? 'Features' : 'امکانات'}</a>
              <a href="#pricing" onClick={(e) => handleScroll(e, '#pricing')}>{isEn ? 'Pricing' : 'قیمت'}</a>
              <a href="#how" onClick={(e) => handleScroll(e, '#how')}>{isEn ? 'How it works' : 'روش کار'}</a>
            </div>
            <div>
              <h4>{copy.footerAccount}</h4>
              <a href="/register">{isEn ? 'Sign Up' : 'ثبت‌نام'}</a>
              <a href="/login">{isEn ? 'Sign In' : 'ورود'}</a>
            </div>
            <div>
              <h4>{copy.footerSupport}</h4>
              <Link href={isEn ? '/en/contact' : '/fa/contact'}>{isEn ? 'Contact Support' : 'ارتباط با ما'}</Link>
              <Link href="/help/ea-setup">{isEn ? 'Expert Advisor Guide' : 'راهنمای اکسپرت'}</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {isEn ? new Date().getFullYear() : toPersianDigits(1405)} {copy.footerCopyright}</span>
        </div>
      </footer>

      {/* ─── Floating mobile CTA ─── */}
      <button className="landing-fab" onClick={goRegister} aria-label={copy.startFree}>
        <span className="material-symbols-outlined">rocket_launch</span>
        {copy.startFree}
      </button>
    </>
  );
}
