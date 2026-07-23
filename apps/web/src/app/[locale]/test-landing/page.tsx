'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../../lib/auth';
import './test-landing.scss';

export default function TestLandingPage() {
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="test-landing">
      {/* ── Nav ── */}
      <nav className="tl-nav">
        <div className="tl-nav__inner">
          <Link href="/" className="tl-nav__brand">
            <img src="/logo.png?v=2" alt="TradeKav" width={32} height={32} />
            <span>تریدکاو</span>
          </Link>
          <div className="tl-nav__links">
            <a href="#features">امکانات</a>
            <a href="#pricing">قیمت‌ها</a>
            <a href="#faq">سوالات</a>
          </div>
          <div className="tl-nav__actions">
            {user ? (
              <Link href="/dashboard" className="tl-btn tl-btn--ghost">پنل</Link>
            ) : (
              <>
                <Link href="/login" className="tl-btn tl-btn--ghost">ورود</Link>
                <Link href="/register" className="tl-btn tl-btn--primary">شروع رایگان</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={`tl-hero ${mounted ? 'tl-hero--visible' : ''}`}>
        <div className="tl-hero__inner">
          <div className="tl-hero__badge">
            <span className="material-symbols-outlined">bolt</span>
            <span>نسخه ۲.۰ منتشر شد</span>
          </div>

          <h1 className="tl-hero__title">
            معاملاتت رو <span className="tl-hero__accent">حرفه‌ای</span> ثبت کن
          </h1>

          <p className="tl-hero__subtitle">
            ژورنال هوشمند ترید برای معامله‌گران ایرانی. از MT4/MT5 وارد کن،
            الگوها رو کشف کن، سودت رو بیشتر کن.
          </p>

          <div className="tl-hero__ctas">
            <Link href="/register" className="tl-btn tl-btn--primary tl-btn--lg">
              <span>شروع رایگان</span>
              <span className="material-symbols-outlined">arrow_left</span>
            </Link>
            <Link href="/login" className="tl-btn tl-btn--outline tl-btn--lg">
              ورود به پنل
            </Link>
          </div>

          <div className="tl-hero__proof">
            <div className="tl-hero__avatars">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="tl-hero__avatar" style={{ background: `hsl(${i * 45}, 60%, 45%)` }}>
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span className="tl-hero__proof-text">
              +۵۰۰ معامله‌گر فعال
            </span>
          </div>
        </div>

        {/* Hero visual — dashboard preview */}
        <div className="tl-hero__visual">
          <div className="tl-hero__mockup">
            <div className="tl-mockup__bar">
              <div className="tl-mockup__dots">
                <span /><span /><span />
              </div>
              <span className="tl-mockup__title">TradeKav Dashboard</span>
            </div>
            <div className="tl-mockup__content">
              <div className="tl-mockup__sidebar">
                <div className="tl-mockup__nav-item active" />
                <div className="tl-mockup__nav-item" />
                <div className="tl-mockup__nav-item" />
                <div className="tl-mockup__nav-item" />
              </div>
              <div className="tl-mockup__main">
                <div className="tl-mockup__kpi-row">
                  <div className="tl-mockup__kpi">
                    <span className="tl-mockup__kpi-value" style={{ color: '#34d399' }}>+%۱۲.۴</span>
                    <span className="tl-mockup__kpi-label">سود ماهانه</span>
                  </div>
                  <div className="tl-mockup__kpi">
                    <span className="tl-mockup__kpi-value">٪۶۸</span>
                    <span className="tl-mockup__kpi-label">نرخ برد</span>
                  </div>
                  <div className="tl-mockup__kpi">
                    <span className="tl-mockup__kpi-value" style={{ color: '#60a5fa' }}>۲.۱R</span>
                    <span className="tl-mockup__kpi-label">R میانگین</span>
                  </div>
                </div>
                <div className="tl-mockup__chart">
                  <svg viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M0 100 Q50 90, 100 70 T200 50 T300 30 T400 10"
                      stroke="url(#chartGrad)"
                      strokeWidth="2.5"
                      fill="none"
                    />
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="400" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="tl-stats">
        {[
          { value: '+۵۰۰', label: 'معامله‌گر فعال' },
          { value: '+۵۰K', label: 'معامله ثبت‌شده' },
          { value: '٪۲۳', label: 'میانگین بهبود' },
          { value: '٪۹۹.۹', label: 'آپتایم سرور' },
        ].map((s, i) => (
          <div key={i} className="tl-stats__item">
            <span className="tl-stats__value">{s.value}</span>
            <span className="tl-stats__label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── Features grid (Bento) ── */}
      <section className="tl-features" id="features">
        <div className="tl-section__header">
          <h2>ابزارهایی که نیاز داری</h2>
          <p>همه چیز در یک پنل، از ورود داده تا تحلیل پیشرفته</p>
        </div>

        <div className="tl-bento">
          <div className="tl-bento__card tl-bento__card--wide">
            <div className="tl-bento__icon">
              <span className="material-symbols-outlined">upload_file</span>
            </div>
            <h3>ورود خودکار از MT4/MT5</h3>
            <p>فایل اکسپرت یا HTML رو آپلود کن، همه چیز خودکار پردازش می‌شه.</p>
            <div className="tl-bento__preview tl-bento__preview--import">
              <div className="tl-bento__file-row">
                <span className="material-symbols-outlined">description</span>
                <div className="tl-bento__file-info">
                  <span>Report_2026.htm</span>
                  <div className="tl-bento__progress"><div style={{ width: '72%' }} /></div>
                </div>
                <span className="tl-bento__file-status">٪۷۲</span>
              </div>
            </div>
          </div>

          <div className="tl-bento__card">
            <div className="tl-bento__icon">
              <span className="material-symbols-outlined">show_chart</span>
            </div>
            <h3>منحنی سرمایه</h3>
            <p>نمودار سود تجمعی و میزان افت سرمایه</p>
            <div className="tl-bento__preview tl-bento__preview--equity">
              <svg viewBox="0 0 200 60" fill="none">
                <path d="M0 50 Q25 45, 50 35 T100 20 T150 15 T200 5" stroke="#34d399" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>

          <div className="tl-bento__card">
            <div className="tl-bento__icon">
              <span className="material-symbols-outlined">mood</span>
            </div>
            <h3>ردیابی هیجانات</h3>
            <p>رابطه میان حال درونی و نتیجه معامله</p>
            <div className="tl-bento__preview tl-bento__preview--emotion">
              <div className="tl-bento__emojis">
                <span className="tl-bento__emoji tl-bento__emoji--good">😀</span>
                <span className="tl-bento__emoji tl-bento__emoji--ok">😐</span>
                <span className="tl-bento__emoji tl-bento__emoji--bad">😤</span>
              </div>
            </div>
          </div>

          <div className="tl-bento__card">
            <div className="tl-bento__icon">
              <span className="material-symbols-outlined">insights</span>
            </div>
            <h3>کشف برتری</h3>
            <p>قوی‌ترین سشن و استراتژیت رو پیدا کن</p>
            <div className="tl-bento__preview tl-bento__preview--edge">
              <div className="tl-bento__bar-chart">
                <div className="tl-bento__bar" style={{ height: '80%', background: '#34d399' }} />
                <div className="tl-bento__bar" style={{ height: '55%', background: '#60a5fa' }} />
                <div className="tl-bento__bar" style={{ height: '90%', background: '#a78bfa' }} />
                <div className="tl-bento__bar" style={{ height: '40%', background: '#f472b6' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="tl-final-cta">
        <h2>آماده‌ای؟</h2>
        <p>همین الان شروع کن. رایگان، بدون محدودیت زمانی.</p>
        <Link href="/register" className="tl-btn tl-btn--primary tl-btn--lg">
          <span>ساخت حساب رایگان</span>
          <span className="material-symbols-outlined">arrow_left</span>
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="tl-footer">
        <div className="tl-footer__inner">
          <div className="tl-footer__brand">
            <img src="/logo.png?v=2" alt="TradeKav" width={28} height={28} />
            <span>تریدکاو</span>
          </div>
          <div className="tl-footer__links">
            <Link href="/contact">تماس با ما</Link>
            <Link href="/help/ea-setup">راهنمای نصب</Link>
            <a href="#">حریم خصوصی</a>
          </div>
          <div className="tl-footer__copy">
            © ۲۰۲۶ تریدکاو. تمامی حقوق محفوظ است.
          </div>
        </div>
      </footer>
    </div>
  );
}
