'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/auth';
import { toPersianDigits } from '../utils/farsi';
import './landing.scss';

// ─── Data (Persian copy + plan values matching settings page) ──────────────────
const NAV_LINKS = [
  { href: '#features', label: 'امکانات' },
  { href: '#how', label: 'روش کار' },
  { href: '#pricing', label: 'قیمت' },
  { href: '#faq', label: 'سوالات' },
];

const STATS = [
  { value: 500, suffix: '+', label: 'معامله‌گر فعال' },
  { value: 50000, suffix: '+', label: 'معامله ثبت‌شده', compact: true },
  { value: 23, suffix: '٪', label: 'میانگین بهبود نرخ موفقیت' },
];

const PAIN_POINTS = [
  { icon: 'edit_note', title: 'یادداشت کاغذی فراموش می‌شه', body: 'معاملاتت رو توی دفتر یا نوت گوشی می‌نویسی و هیچ‌وقت برنمی‌گردی بخونی.' },
  { icon: 'visibility_off', title: 'نمی‌دونی کدوم سشن‌ها سوددهه', body: 'بدون آمار، انتخاب بهترین زمان و سشن معاملاتی فقط حدسه.' },
  { icon: 'psychology', title: 'هیجان روی نتیجه اثر می‌ذاره', body: 'ترس و طمع بدون ردیابی، الگوهای مخرب معاملاتی رو تکرار می‌کنه.' },
];

const STEPS = [
  { icon: 'upload_file', title: 'وارد کن', body: 'فایل HTML اکسپرت MT4/MT5 رو آپلود کن یا با اکسپرت EA همگام‌ساز خودکار ثبت کن.' },
  { icon: 'analytics', title: 'تحلیل کن', body: 'آمار خودکار: نرخ موفقیت، ضریب سود، R:R، منحنی سرمایه و کشف لبه معاملاتی.' },
  { icon: 'trending_up', title: 'بهبود بده', body: 'با ژورنال روزانه و تگ‌گذاری، نقاط ضعف رو پیدا کن و سودت رو بیشتر کن.' },
];

const BENTO = [
  { id: 'import', icon: 'upload_file', title: 'واردات یک‌کلیکی MT4/MT5', body: 'فایل اکسپرت یا HTML رو آپلود کن، همه چیز خودکار پردازش می‌شه.', span: 'wide', preview: 'import' },
  { id: 'equity', icon: 'show_chart', title: 'منحنی سرمایه', body: 'نمودار سود تجمعی و میزان افت سرمایه.', span: 'sm', preview: 'equity' },
  { id: 'calendar', icon: 'calendar_month', title: 'تقویم معاملاتی جلالی', body: 'نمای روزانه سود و زیان به‌صورت نقشه حرارتی.', span: 'sm', preview: 'calendar' },
  { id: 'emotion', icon: 'mood', title: 'ردیابی هیجانات', body: 'رابطه میان حال درونی و نتیجه معامله.', span: 'sm', preview: 'emotion' },
  { id: 'edge', icon: 'insights', title: 'کشف لبه معاملاتی', body: 'سیستم هوشمند که قوی‌ترین سشن، استراتژی یا روز هفته‌ات رو پیدا می‌کنه.', span: 'wide', preview: 'edge' },
];

type Cell = 'yes' | 'no' | 'manual' | 'none';

const COMPARISON_ROWS: { feature: string; excel: Cell; none: Cell; us: Cell }[] = [
  { feature: 'واردات خودکار MT4/MT5', excel: 'no', none: 'no', us: 'yes' },
  { feature: 'تحلیل آماری', excel: 'manual', none: 'no', us: 'yes' },
  { feature: 'تقویم جلالی', excel: 'no', none: 'no', us: 'yes' },
  { feature: 'ردیابی هیجانات', excel: 'no', none: 'no', us: 'yes' },
  { feature: 'کشف لبه معاملاتی', excel: 'no', none: 'no', us: 'yes' },
  { feature: 'پرداخت تومانی', excel: 'none', none: 'none', us: 'yes' },
];

const PLANS = [
  {
    name: 'رایگان',
    price: '۰',
    unit: 'تومان',
    note: 'مناسب شروع',
    features: ['۱ حساب بروکر', 'واردات نامحدود', 'تحلیل پایه', 'ژورنال روزانه'],
    cta: 'شروع رایگان',
    featured: false,
  },
  {
    name: 'استاندارد',
    price: '۱۵۰٬۰۰۰',
    unit: 'تومان / ماه',
    note: 'محبوب‌ترین',
    features: ['۳ حساب بروکر', 'واردات نامحدود', 'تحلیل کامل و کشف لبه', 'تقویم و نقشه حرارتی'],
    cta: 'انتخاب استاندارد',
    featured: true,
  },
  {
    name: 'حرفه‌ای',
    price: '۳۵۰٬۰۰۰',
    unit: 'تومان / ماه',
    note: 'برای حرفه‌ای‌ها',
    features: ['حساب نامحدود', 'همه امکانات استاندارد', 'همگام‌سازی زنده EA', 'اولویت پشتیبانی'],
    cta: 'انتخاب حرفه‌ای',
    featured: false,
  },
];

const FAQS = [
  { q: 'آیا برای شروع به کارت بانکی نیاز دارم؟', a: 'خیر. ثبت‌نام و استفاده از پلن رایگان کاملاً بدون کارت بانکیه و در کمتر از ۳۰ ثانیه آماده‌ست.' },
  { q: 'با کدام بروکرها و پلتفرم‌ها کار می‌کنه؟', a: 'هر بروکری که از MetaTrader 4 یا 5 پشتیبانی کنه. فایل HTML اکسپرت رو وارد کن یا از اکسپرت EA برای همگام‌سازی زنده استفاده کن.' },
  { q: 'پرداخت چطور انجام می‌شه؟', a: 'پرداخت به تومان و از درگاه‌های ایرانی انجام می‌شه. بدون نیاز به ارز خارجی یا کارت بین‌المللی.' },
  { q: 'آیا می‌تونم هر زمان اشتراکم رو لغو کنم؟', a: 'بله، هر زمان و بدون قفل. در بخش تنظیمات با یک کلیک لغو کن، دسترسی تا پایان دوره باقی می‌مونه.' },
  { q: 'داده‌های من امن هستند؟', a: 'همه داده‌ها روی سرور امن ذخیره می‌شن و فقط با توکن اختصاصی خودت قابل دسترسیه.' },
];

export default function LandingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  // Logged-in users skip the landing and go straight to the app
  useEffect(() => {
    if (isInitialized && user) {
      router.replace('/dashboard');
    }
  }, [isInitialized, user, router]);

  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goRegister = () => router.push('/register');
  const goLogin = () => router.push('/login');

  return (
    <div className="landing">
      {/* ─── Nav ─── */}
      <nav className={`landing-nav ${navScrolled ? 'scrolled' : ''}`}>
        <a className="landing-logo" href="#top" aria-label="معامله‌یار">
          <span className="logo-mark" aria-hidden="true">
            <span className="material-symbols-outlined">candlestick_chart</span>
          </span>
          <span className="logo-text">معامله‌یار</span>
        </a>
        <div className="landing-nav-links">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </div>
        <div className="landing-nav-cta">
          <button className="btn-ghost" onClick={goLogin}>ورود</button>
          <button className="btn-primary" onClick={goRegister}>ثبت‌نام رایگان</button>
        </div>
        <button
          className={`landing-nav-burger ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="منو"
        >
          <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
        {mobileMenuOpen && (
          <div className="landing-mobile-menu">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)}>{l.label}</a>
            ))}
            <button className="btn-primary full" onClick={() => { setMobileMenuOpen(false); goRegister(); }}>
              ثبت‌نام رایگان
            </button>
          </div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <header className="landing-hero" id="top">
        <div className="hero-grid-bg" aria-hidden="true" />
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-copy">
            <h1 className="hero-title">
              ژورنال هوشمند <br />
              معاملات فارکس
            </h1>
            <p className="hero-sub">
              معاملاتت رو وارد کن، الگوها رو پیدا کن، سودت رو بیشتر کن. همه‌چیز به فارسی، با تقویم جلالی و پرداخت تومانی.
            </p>
            <div className="hero-ctas">
              <button className="btn-primary lg" onClick={goRegister}>
                شروع رایگان
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <button className="btn-ghost lg" onClick={goLogin}>ورود</button>
            </div>
            <p className="hero-micro">ثبت‌نام در ۳۰ ثانیه، بدون کارت بانکی</p>
            <div className="hero-trust">
              <span><span className="material-symbols-outlined">check_circle</span> MT4 / MT5</span>
              <span><span className="material-symbols-outlined">check_circle</span> تقویم جلالی</span>
              <span><span className="material-symbols-outlined">check_circle</span> پرداخت تومانی</span>
            </div>
          </div>
          <div className="hero-mockup" aria-hidden="true">
            <DashboardMockup />
          </div>
        </div>
      </header>

      {/* ─── Stats Bar (from Spec C) ─── */}
      <section className="landing-stats" aria-label="آمار معامله‌یار">
        {STATS.map((s, i) => (
          <div className="stat" key={i}>
            <div className="stat-value">
              <CountUp end={s.value} compact={s.compact} />
              {s.suffix}
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ─── Problem statement (from Spec B: one bold sentence on dark) ─── */}
      <section className="landing-problem">
        <p className="problem-headline">معامله‌گر ایرانی، بدون ژورنال، با چشم بسته معامله می‌کنه.</p>
        <div className="pain-row">
          {PAIN_POINTS.map((p, i) => (
            <div className="pain-card" key={i}>
              <span className="material-symbols-outlined pain-icon">{p.icon}</span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="landing-how" id="how">
        <div className="section-head">
          <h2>۳ قدم تا تبدیل شدن به معامله‌گر حرفه‌ای</h2>
        </div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div className="step" key={i}>
              <span className="step-num">{toPersianDigits(i + 1)}</span>
              <span className="material-symbols-outlined step-icon">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              {i < STEPS.length - 1 && <span className="step-line" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Bento feature grid (Spec A core) ─── */}
      <section className="landing-bento" id="features">
        <div className="section-head">
          <h2>ابزارهایی که معامله‌گر حرفه‌ای نیاز داره</h2>
          <p className="section-sub">هر امکان، همون‌طور که توی اپ کار می‌کنه، همین‌جا نمایش داده می‌شه.</p>
        </div>
        <div className="bento-grid">
          {BENTO.map((cell) => (
            <div className={`bento-cell ${cell.span === 'wide' ? 'wide' : ''}`} key={cell.id}>
              <div className="bento-preview">{renderPreview(cell.preview)}</div>
              <div className="bento-info">
                <span className="material-symbols-outlined">{cell.icon}</span>
                <h3>{cell.title}</h3>
                <p>{cell.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Comparison table (from Spec C) ─── */}
      <section className="landing-compare">
        <div className="section-head">
          <h2>معامله‌یار در برابر بقیه</h2>
        </div>
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>امکان</th>
                <th>اکسل</th>
                <th>بدون ژورنال</th>
                <th className="us-col">معامله‌یار</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((r, i) => (
                <tr key={i}>
                  <td className="feature-name">{r.feature}</td>
                  <td>{renderCell(r.excel)}</td>
                  <td>{renderCell(r.none)}</td>
                  <td className="us-col">{renderCell(r.us)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="landing-pricing" id="pricing">
        <div className="section-head">
          <h2>قیمت مناسب برای معامله‌گر ایرانی</h2>
          <p className="section-sub">پرداخت به تومان، بدون کارت بانکی بین‌المللی.</p>
        </div>
        <div className="pricing-grid">
          {PLANS.map((plan) => (
            <div className={`price-card ${plan.featured ? 'featured' : ''}`} key={plan.name}>
              {plan.featured && <span className="price-badge">محبوب‌ترین</span>}
              <h3 className="price-name">{plan.name}</h3>
              <div className="price-amount">
                <span className="price-num">{plan.price}</span>
                <span className="price-unit">{plan.unit}</span>
              </div>
              <p className="price-note">{plan.note}</p>
              <ul className="price-features">
                {plan.features.map((f) => (
                  <li key={f}>
                    <span className="material-symbols-outlined">check_circle</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`btn-primary ${plan.featured ? '' : 'muted'}`}
                onClick={goRegister}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="landing-faq" id="faq">
        <div className="section-head">
          <h2>سوالات رایج</h2>
        </div>
        <div className="faq-list">
          {FAQS.map((item, i) => {
            const open = openFaq === i;
            return (
              <div className={`faq-item ${open ? 'open' : ''}`} key={i}>
                <button className="faq-q" onClick={() => setOpenFaq(open ? null : i)}>
                  <span>{item.q}</span>
                  <span className="material-symbols-outlined chevron">{open ? 'expand_less' : 'expand_more'}</span>
                </button>
                <div className="faq-a"><p>{item.a}</p></div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="landing-final-cta">
        <div className="final-glow" aria-hidden="true" />
        <h2>آماده کشف لبه معاملاتی خودت هستی؟</h2>
        <p>رایگان، بدون کارت بانکی، بدون محدودیت زمانی.</p>
        <button className="btn-primary lg glow" onClick={goRegister}>
          همین الان شروع کن
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="logo-mark" aria-hidden="true">
              <span className="material-symbols-outlined">candlestick_chart</span>
            </span>
            <span className="logo-text">معامله‌یار</span>
          </div>
          <p className="footer-tag">ژورنال معاملاتی هوشمند فارسی، ساخته‌شده برای معامله‌گران ایرانی.</p>
          <div className="footer-links">
            <div>
              <h4>محصول</h4>
              <a href="#features">امکانات</a>
              <a href="#pricing">قیمت</a>
              <a href="#how">روش کار</a>
            </div>
            <div>
              <h4>حساب کاربری</h4>
              <a href="/register">ثبت‌نام</a>
              <a href="/login">ورود</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {toPersianDigits(1405)} معامله‌یار. تمامی حقوق محفوظ است.</span>
        </div>
      </footer>

      {/* ─── Floating mobile CTA (from Spec C) ─── */}
      <button className="landing-fab" onClick={goRegister} aria-label="شروع رایگان">
        <span className="material-symbols-outlined">rocket_launch</span>
        شروع رایگان
      </button>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
function renderCell(v: 'yes' | 'no' | 'manual' | 'none') {
  if (v === 'yes') return <span className="material-symbols-outlined cell yes">check_circle</span>;
  if (v === 'manual') return <span className="cell manual">دستی</span>;
  if (v === 'none') return <span className="cell dash">-</span>;
  return <span className="material-symbols-outlined cell no">cancel</span>;
}

function renderPreview(kind: string) {
  switch (kind) {
    case 'equity':
      return <EquityMini />;
    case 'calendar':
      return <CalendarMini />;
    case 'emotion':
      return <EmotionMini />;
    case 'edge':
      return <EdgeMini />;
    case 'import':
      return <ImportMini />;
    default:
      return null;
  }
}

// Count-up on view using IntersectionObserver, respects reduced motion.
function CountUp({ end, compact }: { end: number; compact?: boolean }) {
  const [val, setVal] = useState(0);
  const [ref, setRef] = useState<HTMLSpanElement | null>(null);
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!ref) return;
    if (reduce) { setVal(end); return; }
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const duration = 1100;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 4);
          setVal(Math.round(end * eased));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    }, { threshold: 0.4 });
    obs.observe(ref);
    return () => obs.disconnect();
  }, [ref, end, reduce]);

  if (compact && val >= 1000) {
    return <span ref={setRef}>{toPersianDigits((val / 1000).toFixed(0))}<span className="compact-suffix">،۰۰۰</span></span>;
  }
  return <span ref={setRef}>{toPersianDigits(val.toLocaleString('en-US'))}</span>;
}

// ─── Dashboard mockup (real component preview, not div-slop) ────────────────────
function DashboardMockup() {
  return (
    <div className="mockup">
      <div className="mockup-bar">
        <span className="mockup-dot" />
        <span className="mockup-dot" />
        <span className="mockup-dot" />
        <span className="mockup-url">معامله‌یار / داشبورد</span>
      </div>
      <div className="mockup-body">
        <div className="mockup-kpis">
          <div className="mk-kpi"><span className="mk-label">سود امروز</span><span className="mk-val pos">+۲۴۵ دلار</span></div>
          <div className="mk-kpi"><span className="mk-label">نرخ موفقیت</span><span className="mk-val">۶۸٪</span></div>
          <div className="mk-kpi"><span className="mk-label">ضریب سود</span><span className="mk-val">۱.۸</span></div>
        </div>
        <div className="mockup-chart">
          <EquityMini />
        </div>
        <div className="mockup-rows">
          <div className="mk-row"><span className="mk-badge buy">B</span><span className="mk-sym">XAUUSD</span><span className="mk-pnl pos">+۸۵</span></div>
          <div className="mk-row"><span className="mk-badge sell">S</span><span className="mk-sym">EURUSD</span><span className="mk-pnl neg">-۳۲</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── Mini previews for bento cells ─────────────────────────────────────────────
function EquityMini() {
  // smooth-ish ascending path with a dip
  return (
    <svg className="mini-chart" viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label="منحنی سرمایه">
      <defs>
        <linearGradient id="eq-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(61,220,151,0.35)" />
          <stop offset="100%" stopColor="rgba(61,220,151,0)" />
        </linearGradient>
      </defs>
      <path className="mini-line" d="M0,30 L15,26 L28,32 L42,22 L55,18 L70,24 L84,10 L100,6" />
      <path d="M0,30 L15,26 L28,32 L42,22 L55,18 L70,24 L84,10 L100,6 L100,40 L0,40 Z" fill="url(#eq-fill)" />
      <circle cx="100" cy="6" r="2.5" className="mini-dot" />
    </svg>
  );
}

function CalendarMini() {
  const cells = Array.from({ length: 35 });
  // deterministic pseudo-random intensities
  const heat = cells.map((_, i) => {
    const seed = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    return Math.abs(seed);
  });
  return (
    <div className="mini-calendar">
      {heat.map((h, i) => (
        <span
          className="cal-cell"
          key={i}
          style={{ opacity: 0.15 + h * 0.85 }}
        />
      ))}
    </div>
  );
}

function EmotionMini() {
  const moods = [
    { e: '😄', label: 'آروم', val: '+۸۵٪', pos: true },
    { e: '😐', label: 'خنثی', val: '+۴٪', pos: true },
    { e: '😣', label: 'استرس', val: '-۴۲٪', pos: false },
  ];
  return (
    <div className="mini-emotion">
      {moods.map((m) => (
        <div className="emo-row" key={m.label}>
          <span className="emo-emoji">{m.e}</span>
          <span className="emo-label">{m.label}</span>
          <span className={`emo-val ${m.pos ? 'pos' : 'neg'}`}>{m.val}</span>
        </div>
      ))}
    </div>
  );
}

function EdgeMini() {
  return (
    <div className="mini-edge">
      <div className="edge-label">لبه معاملاتی شما</div>
      <div className="edge-sentence">
        بهترین عملکرد تو در سشن <b>لندن</b> با نرخ موفقیت <b>۷۲٪</b> در ۱۸ معامله.
      </div>
      <div className="edge-meta">بر اساس ۳۰ روز گذشته</div>
    </div>
  );
}

function ImportMini() {
  return (
    <div className="mini-import">
      <div className="imp-card">
        <span className="material-symbols-outlined imp-icon">description</span>
        <div className="imp-info">
          <span className="imp-name">report.htm</span>
          <span className="imp-status">در حال پردازش</span>
        </div>
      </div>
      <div className="imp-progress"><span className="imp-bar" /></div>
      <div className="imp-result">
        <span className="material-symbols-outlined">check_circle</span>
        ۱۲ معامله شناسایی شد
      </div>
    </div>
  );
}
