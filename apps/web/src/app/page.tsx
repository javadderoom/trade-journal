'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/auth';
import { toPersianDigits } from '../utils/farsi';
import './landing.scss';

// ─── Data (Persian copy + plan values matching settings page) ──────────────────
const NAV_LINKS = [

  { href: '#how', label: 'روش کار' },
  { href: '#features', label: 'امکانات' },
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
  { id: 'import', icon: 'upload_file', title: 'بررسی خودکار MT4/MT5', body: 'فایل اکسپرت یا HTML رو آپلود کن، همه چیز خودکار پردازش می‌شه.', span: 'wide', preview: 'import' },
  { id: 'equity', icon: 'show_chart', title: 'منحنی سرمایه', body: 'نمودار سود تجمعی و میزان افت سرمایه.', span: 'sm', preview: 'equity' },
  { id: 'calendar', icon: 'calendar_month', title: 'تقویم معاملاتی ', body: 'نمای روزانه سود و زیان به‌صورت نقشه حرارتی.', span: 'sm', preview: 'calendar' },
  { id: 'emotion', icon: 'mood', title: 'ردیابی هیجانات', body: 'رابطه میان حال درونی و نتیجه معامله.', span: 'sm', preview: 'emotion' },
  { id: 'edge', icon: 'insights', title: 'کشف برتری معاملاتی', body: 'سیستم هوشمند که قوی‌ترین سشن، استراتژی یا روز هفته‌ات رو پیدا می‌کنه.', span: 'sm', preview: 'edge' },
];

type CellType = 'check' | 'cross' | 'partial' | string;

interface CompareRow {
  type: 'row';
  feature: string;
  excel: CellType;
  notion: CellType;
  tradekav: CellType;
}

interface CompareSection {
  type: 'section';
  label: string;
}

type CompareItem = CompareRow | CompareSection;

const COMPARISON_DATA: CompareItem[] = [
  { type: 'section', label: 'ورود داده' },
  { type: 'row', feature: 'ورود از MT4 / MT5', excel: 'دستی', notion: 'دستی', tradekav: 'check' },
  { type: 'row', feature: 'ثبت دستی معامله', excel: 'check', notion: 'check', tradekav: 'check' },
  { type: 'row', feature: 'تگ احساسات', excel: 'دستی', notion: 'محدود', tradekav: 'check' },
  { type: 'row', feature: 'تگ محدود', excel: 'دستی', notion: 'محدود', tradekav: 'check' },

  // { type: 'section', label: 'تحلیل عملکرد' },
  // { type: 'row', feature: 'نرخ موفقیت', excel: 'فرمول', notion: 'فرمول', tradekav: 'check' },
  // { type: 'row', feature: 'ضریب سود', excel: 'فرمول', notion: 'فرمول', tradekav: 'check' },
  // { type: 'row', feature: 'منحنی سرمایه', excel: 'نمودار دستی', notion: 'فرمول', tradekav: 'check' },
  // { type: 'row', feature: 'تحلیل بر اساس سشن', excel: 'cross', notion: 'cross', tradekav: 'check' },
  // { type: 'row', feature: 'تحلیل احساسات', excel: 'cross', notion: 'cross', tradekav: 'check' },
  // { type: 'row', feature: 'هیتمپ عملکرد ساعتی', excel: 'cross', notion: 'cross', tradekav: 'check' },

  { type: 'section', label: 'ژورنال و تجربه' },
  { type: 'row', feature: 'ژورنال روزانه', excel: 'cross', notion: 'check', tradekav: 'check' },
  { type: 'row', feature: 'تقویم جلالی', excel: 'cross', notion: 'cross', tradekav: 'check' },
  { type: 'row', feature: 'رابط کاربری فارسی', excel: 'cross', notion: 'cross', tradekav: 'check' },


  { type: 'section', label: 'هزینه و نحوه استفاده' },
  { type: 'row', feature: 'پرداخت ریالی', excel: 'رایگان', notion: 'cross', tradekav: 'check' },
  { type: 'row', feature: 'نیاز به دانش فنی', excel: 'زیاد', notion: 'متوسط', tradekav: 'صفر' },
  { type: 'row', feature: 'هزینه ماهانه', excel: 'رایگان*', notion: '~$۱۶', tradekav: '۱۹۹ هزار ت' },
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
  { q: 'آیا برای شروع باید هزینه کنم؟', a: 'خیر. ثبت‌نام و استفاده از پلن رایگان کاملاً بدون هزینه‌ است و در کمتر از ۳۰ ثانیه آماده‌ست.' },
  { q: 'با کدام بروکرها و پلتفرم‌ها کار می‌کنه؟', a: 'هر بروکری که از MetaTrader 4 یا 5 پشتیبانی کنه. فایل HTML اکسپرت رو وارد کن یا از اکسپرت EA برای همگام‌سازی زنده استفاده کن.' },
  { q: 'پرداخت چطور انجام می‌شه؟', a: 'پرداخت به تومان و از درگاه‌های ایرانی انجام می‌شه. بدون نیاز به ارز خارجی یا کارت بین‌المللی.' },
  // { q: 'آیا می‌تونم هر زمان اشتراکم رو لغو کنم؟', a: 'بله، هر زمان و بدون قفل. در بخش تنظیمات با یک کلیک لغو کن، دسترسی تا پایان دوره باقی می‌مونه.' },
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

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
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
  };

  return (
    <div className="landing">
      {/* ─── Nav ─── */}
      <nav className={`landing-nav ${navScrolled ? 'scrolled' : ''}`}>
        <a className="landing-logo" href="#top" aria-label="تریدکاو" onClick={(e) => handleScroll(e, '#top')}>
          <img src="/logo.png" alt="تریدکاو" className="logo-img-landing" style={{ height: '34px', width: 'auto', objectFit: 'contain' }} />
          <span className="logo-text">تریدکاو</span>
        </a>
        <div className="landing-nav-links">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={(e) => handleScroll(e, l.href)}>{l.label}</a>
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
              <a key={l.href} href={l.href} onClick={(e) => handleScroll(e, l.href)}>{l.label}</a>
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
              ژورنال هوشمند
              ترید
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
            {/* <p className="hero-micro">ثبت‌نام در ۳۰ ثانیه، بدون کارت بانکی</p> */}
            <div className="hero-trust">
              <span><span className="material-symbols-outlined">check_circle</span> MT4 / MT5</span>
              <span><span className="material-symbols-outlined">check_circle</span> ورود دستی </span>
              {/* <span><span className="material-symbols-outlined">check_circle</span> پرداخت تومانی</span> */}
            </div>
          </div>
          <div className="hero-mockup" aria-hidden="true">
            <DashboardMockup />
          </div>
        </div>
      </header>

      {/* ─── Stats Bar (from Spec C) ─── */}
      {/* <section className="landing-stats" aria-label="آمار تریدکاو">
        {STATS.map((s, i) => (
          <div className="stat" key={i}>
            <div className="stat-value">
              <CountUp end={s.value} compact={s.compact} />
              {s.suffix}
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section> */}

      {/* ─── Problem statement (from Spec B: one bold sentence on dark) ─── */}
      <section className="landing-problem">
        <p className="problem-headline">اکثر تریدرا، بدون ژورنال، با چشم بسته معامله می‌کنه.</p>
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
          <p className="section-sub">هرچیزی که برای تبدیل شدن به یک معامله‌گر حرفه‌ای نیاز داری</p>
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
          <h2>تریدکاو در برابر بقیه</h2>
        </div>
        <div className="compare-table-wrap">
          <table className="compare-table">
            <colgroup>
              <col style={{ width: '34%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '22%' }} />
            </colgroup>
            <thead>
              <tr>
                <th></th>
                <th className="col-head">
                  <span className="material-symbols-outlined head-icon">grid_on</span>
                  اکسل
                </th>
                <th className="col-head">
                  <span className="material-symbols-outlined head-icon">assignment</span>
                  Notion
                </th>
                <th className="col-head us-col">
                  <span className="material-symbols-outlined head-icon">trending_up</span>
                  تریدکاو
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_DATA.map((item, idx) => {
                if (item.type === 'section') {
                  return (
                    <tr key={idx} className="section-label">
                      <td colSpan={4}>{item.label}</td>
                    </tr>
                  );
                }
                return (
                  <tr key={idx}>
                    <td className="feature-name">{item.feature}</td>
                    <td>{renderCompareCell(item.excel)}</td>
                    <td>{renderCompareCell(item.notion)}</td>
                    <td className="us-col">{renderCompareCell(item.tradekav, true)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="compare-note-hint">* اکسل رایگان است اما زمان راه‌اندازی و نگهداری هزینه واقعی دارد</p>
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
      {/* <section className="landing-faq" id="faq">
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
      </section> */}

      {/* ─── Final CTA ─── */}
      <section className="landing-final-cta">
        <div className="final-glow" aria-hidden="true" />
        <h2>آماده کشف برتری معاملاتی خودت هستی؟</h2>
        <p>رایگان، بدون محدودیت زمانی.</p>
        <button className="btn-primary lg glow" onClick={goRegister}>
          همین الان شروع کن
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/logo.png" alt="تریدکاو" className="logo-img-landing" style={{ height: '34px', width: 'auto', objectFit: 'contain' }} />
            <span className="logo-text">تریدکاو</span>
          </div>
          <p className="footer-tag">ژورنال معاملاتی هوشمند فارسی، ساخته‌شده برای معامله‌گران ایرانی.</p>
          <div className="footer-links">
            <div>
              <h4>محصول</h4>
              <a href="#features" onClick={(e) => handleScroll(e, '#features')}>امکانات</a>
              <a href="#pricing" onClick={(e) => handleScroll(e, '#pricing')}>قیمت</a>
              <a href="#how" onClick={(e) => handleScroll(e, '#how')}>روش کار</a>
            </div>
            <div>
              <h4>حساب کاربری</h4>
              <a href="/register">ثبت‌نام</a>
              <a href="/login">ورود</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {toPersianDigits(1405)} تریدکاو. تمامی حقوق محفوظ است.</span>
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
function renderCompareCell(v: CellType, isTradekav = false) {
  if (v === 'check') {
    return <span className="material-symbols-outlined cell-check">check_circle</span>;
  }
  if (v === 'cross') {
    return <span className="material-symbols-outlined cell-cross">cancel</span>;
  }
  if (v === 'دستی' || v === 'محدود' || v === 'متوسط' || v === 'فرمول' || v === 'نمودار دستی' || v === 'زیاد' || v === 'نیاز به پیاده سازی') {
    return <span className="cell-partial">{v}</span>;
  }
  if (v === 'صفر') {
    return <span className="cell-zero">{v}</span>;
  }
  return <span className={`cell-text ${isTradekav ? 'us-col-text' : ''}`}>{v}</span>;
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
        <span className="mockup-url">تریدکاو / داشبورد</span>
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
  // realistic trading equity curve with grids, pullbacks, consolidation, and breakouts
  return (
    <svg className="mini-chart" viewBox="0 0 200 100" preserveAspectRatio="none" role="img" aria-label="منحنی سرمایه">
      <defs>
        <linearGradient id="eq-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(61,220,151,0.3)" />
          <stop offset="100%" stopColor="rgba(61,220,151,0)" />
        </linearGradient>
      </defs>
      {/* Grid Lines */}
      <g stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3 3">
        <line x1="0" y1="20" x2="200" y2="20" />
        <line x1="0" y1="40" x2="200" y2="40" />
        <line x1="0" y1="60" x2="200" y2="60" />
        <line x1="0" y1="80" x2="200" y2="80" />
        <line x1="40" y1="0" x2="40" y2="100" />
        <line x1="80" y1="0" x2="80" y2="100" />
        <line x1="120" y1="0" x2="120" y2="100" />
        <line x1="160" y1="0" x2="160" y2="100" />
      </g>
      {/* Glow path under the main line */}
      <path className="mini-line-glow" d="M0,85 L20,75 L35,80 L55,52 L75,54 L95,32 L115,60 L140,38 L160,42 L185,12 L200,8" />
      {/* Main sharp curve */}
      <path className="mini-line" d="M0,85 L20,75 L35,80 L55,52 L75,54 L95,32 L115,60 L140,38 L160,42 L185,12 L200,8" />
      {/* Shaded area under curve */}
      <path d="M0,85 L20,75 L35,80 L55,52 L75,54 L95,32 L115,60 L140,38 L160,42 L185,12 L200,8 L200,100 L0,100 Z" fill="url(#eq-fill)" />
      {/* Pulsing endpoint dot */}
      <circle cx="200" cy="8" r="3" className="mini-dot-pulse" />
      <circle cx="200" cy="8" r="3" className="mini-dot" />
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
      <div className="edge-label">برتری معاملاتی شما</div>
      <div className="edge-sentence">
        بهترین عملکرد تو در سشن <b>لندن</b> با نرخ موفقیت <b>۷۲٪</b> در ۱۸ معامله.
      </div>
      <div className="edge-meta">بر اساس ۳۰ روز گذشته</div>
    </div>
  );
}

function ImportMini() {
  const [step, setStep] = useState(0); // 0: upload, 1: reading, 2: analyzing, 3: completed, 4: result shown
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let active = true;
    const timeouts: NodeJS.Timeout[] = [];

    const schedule = (fn: () => void, delay: number) => {
      if (active) {
        timeouts.push(setTimeout(fn, delay));
      }
    };

    const runLoop = () => {
      if (!active) return;

      // Step 0: Upload starts
      setStep(0);
      setProgress(15);

      // Step 1: Reading file
      schedule(() => {
        setStep(1);
        setProgress(50);
      }, 1000);

      // Step 2: Analyzing
      schedule(() => {
        setStep(2);
        setProgress(85);
      }, 2200);

      // Step 3: Success / Finalizing
      schedule(() => {
        setStep(3);
        setProgress(100);
      }, 3400);

      // Step 4: Finished & holding
      schedule(() => {
        setStep(4);
      }, 3900);

      // Reset loop
      schedule(() => {
        setProgress(0);
        schedule(runLoop, 400);
      }, 7000);
    };

    runLoop();

    return () => {
      active = false;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="mini-import">
      <div className="imp-card">
        <span className={`material-symbols-outlined imp-icon ${step >= 3 ? 'success' : 'loading'}`}>
          {step >= 3 ? 'task_alt' : 'description'}
        </span>
        <div className="imp-info">
          <span className="imp-name">report.htm</span>
          <span className={`imp-status ${step >= 3 ? 'success' : ''}`}>
            {step === 0 && 'آپلود فایل...'}
            {step === 1 && 'خواندن فایل...'}
            {step === 2 && 'تحلیل داده‌ها...'}
            {step >= 3 && 'پردازش موفق'}
          </span>
        </div>
      </div>
      <div className="imp-progress">
        <span
          className={`imp-bar ${step >= 3 ? 'success' : ''}`}
          style={{ width: `${progress}%`, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </div>
      <div className={`imp-result ${step === 4 ? 'visible' : ''}`}>
        <span className="material-symbols-outlined">check_circle</span>
        ۱۲ معامله شناسایی و تحلیل شد
      </div>
    </div>
  );
}
