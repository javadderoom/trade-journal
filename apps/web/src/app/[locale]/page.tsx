'use client';

import { useEffect, useState, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../lib/auth';
import { toPersianDigits } from '../../utils/farsi';
import { usePrices } from '../../hooks/usePrices';
import { useCryptoDetails } from '../../hooks/useCryptoDetails';
import '../landing.scss';

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

// ─── Data Arrays (Persian & English translations) ────────────────────────────────

const DATA = {
  fa: {
    navLinks: [
      { href: '#how', label: 'روش کار' },
      { href: '#features', label: 'امکانات' },
      { href: '#pricing', label: 'قیمت' },
      { href: '#faq', label: 'سوالات' },
    ],
    stats: [
      { value: 500, suffix: '+', label: 'معامله‌گر فعال' },
      { value: 50000, suffix: '+', label: 'معامله ثبت‌شده', compact: true },
      { value: 23, suffix: '٪', label: 'میانگین بهبود نرخ موفقیت' },
    ],
    painPoints: [
      { icon: 'edit_note', title: 'یادداشت کاغذی فراموش می‌شه', body: 'معاملاتت رو توی دفتر یا نوت گوشی می‌نویسی و هیچ‌وقت برنمی‌گردی بخونی.' },
      { icon: 'visibility_off', title: 'نمی‌دونی کدوم سشن‌ها سوددهه', body: 'بدون آمار، انتخاب بهترین زمان و سشن معاملاتی فقط حدسه.' },
      { icon: 'psychology', title: 'هیجان روی نتیجه اثر می‌ذاره', body: 'ترس و طمع بدون ردیابی، الگوهای مخرب معاملاتی رو تکرار می‌کنه.' },
    ],
    steps: [
      { icon: 'upload_file', title: 'وارد کن', body: 'فایل HTML اکسپرت MT4/MT5 رو آپلود کن یا با اکسپرت EA همگام‌ساز خودکار ثبت کن.' },
      { icon: 'analytics', title: 'تحلیل کن', body: 'آمار خودکار: نرخ موفقیت، ضریب سود، R:R، منحنی سرمایه و کشف برتری معاملاتی.' },
      { icon: 'trending_up', title: 'بهبود بده', body: 'با ژورنال روزانه و تگ‌گذاری، نقاط ضعف رو پیدا کن و سودت رو بیشتر کن.' },
    ],
    bento: [
      { id: 'import', icon: 'upload_file', title: 'بررسی خودکار MT4/MT5', body: 'فایل اکسپرت یا HTML رو آپلود کن، همه چیز خودکار پردازش می‌شه.', span: 'wide', preview: 'import' },
      { id: 'equity', icon: 'show_chart', title: 'منحنی سرمایه', body: 'نمودار سود تجمعی و میزان افت سرمایه.', span: 'sm', preview: 'equity' },
      { id: 'calendar', icon: 'calendar_month', title: 'تقویم معاملاتی ', body: 'نمای روزانه سود و زیان به‌صورت نقشه حرارتی.', span: 'sm', preview: 'calendar' },
      { id: 'emotion', icon: 'mood', title: 'ردیابی هیجانات', body: 'رابطه میان حال درونی و نتیجه معامله.', span: 'sm', preview: 'emotion' },
      { id: 'edge', icon: 'insights', title: 'کشف برتری معاملاتی', body: 'سیستم هوشمند که قوی‌ترین سشن، استراتژی یا روز هفته‌ات رو پیدا می‌کنه.', span: 'sm', preview: 'edge' },
    ],
    comparison: [
      { type: 'section', label: 'ورود داده' } as CompareSection,
      { type: 'row', feature: 'ورود از MT4 / MT5', excel: 'دستی', notion: 'دستی', tradekav: 'check' } as CompareRow,
      { type: 'row', feature: 'ثبت دستی معامله', excel: 'check', notion: 'check', tradekav: 'check' } as CompareRow,
      { type: 'row', feature: 'تگ احساسات', excel: 'دستی', notion: 'محدود', tradekav: 'check' } as CompareRow,
      { type: 'row', feature: 'تگ استراتژی', excel: 'دستی', notion: 'محدود', tradekav: 'check' } as CompareRow,
      { type: 'section', label: 'ژورنال و تجربه' } as CompareSection,
      { type: 'row', feature: 'ژورنال روزانه', excel: 'cross', notion: 'check', tradekav: 'check' } as CompareRow,
      { type: 'row', feature: 'تقویم جلالی', excel: 'cross', notion: 'cross', tradekav: 'check' } as CompareRow,
      { type: 'row', feature: 'رابط کاربری فارسی', excel: 'cross', notion: 'cross', tradekav: 'check' } as CompareRow,
      { type: 'section', label: 'هزینه و نحوه استفاده' } as CompareSection,
      { type: 'row', feature: 'پرداخت ریالی', excel: 'رایگان', notion: 'cross', tradekav: 'check' } as CompareRow,
      { type: 'row', feature: 'نیاز به دانش فنی', excel: 'زیاد', notion: 'متوسط', tradekav: 'صفر' } as CompareRow,
      { type: 'row', feature: 'هزینه ماهانه', excel: 'رایگان*', notion: '~$۱۶', tradekav: '۱۹۹ هزار ت' } as CompareRow,
    ],
    faqs: [
      { q: 'آیا برای شروع باید هزینه کنم؟', a: 'خیر. ثبت‌نام و استفاده از پلن رایگان کاملاً بدون هزینه‌ است و در کمتر از ۳۰ ثانیه آماده‌ست.' },
      { q: 'با کدام بروکرها و پلتفرم‌ها کار می‌کنه؟', a: 'هر بروکری که از MetaTrader 4 یا 5 پشتیبانی کنه. همچنین صرافی‌های ارز دیجیتال از طریق API پشتیبانی میشن. فایل HTML اکسپرت رو وارد کن یا از اکسپرت EA برای همگام‌سازی زنده استفاده کن.' },
      { q: 'تفاوت تریدکاو با اکسل و نوشن در چیست؟', a: 'تریدکاو نیاز به فرمول‌نویسی دستی یا وارد کردن دیتای عددی معاملات نداره. تمام محاسبات pips، سود تجمعی، مدیریت ریسک، R:R و هیتمپ به صورت کاملاً اتوماتیک انجام می‌شه و الگوهای سودده شما شناسایی می‌شن.' },
      { q: 'داده‌های من امن هستند؟', a: 'همه داده‌ها روی سرور امن ذخیره می‌شن و فقط با توکن اختصاصی خودت قابل دسترسیه.' },
    ],
    planFree: ['۱ حساب بروکر', 'ثبت ۳۰ معامله در ماه', 'بازه زمانی ۱ ماهه محاسبات', 'ژورنال روزانه'],
    planStd: ['۳ حساب بروکر', 'واردات فایل (تا ۱۵۰ ردیف)', 'بازه ۶ ماهه محاسبات', 'همگام‌سازی EA (هر ۱ ساعت)'],
    planPro: ['حساب نامحدود', 'همگام‌سازی ۶۰ ثانیه‌ای EA', 'کل تاریخچه محاسبات (نامحدود)', 'خروجی داده‌ها و پشتیبانی ویژه'],
    heroTitle: 'ژورنال هوشمند ترید',
    heroSubtitle: 'معاملاتت رو وارد کن، الگوها رو پیدا کن، سودت رو بیشتر کن.',
    startFree: 'شروع رایگان',
    signinLabel: 'ورود',
    registerLabel: 'ثبت‌نام رایگان',
    problemHeadline: 'اکثر تریدرا، بدون ژورنال، با چشم بسته معامله می‌کنه.',
    howTitle: '۳ قدم تا تبدیل شدن به معامله‌گر حرفه‌ای',
    featuresTitle: 'ابزارهایی که معامله‌گر حرفه‌ای نیاز داره',
    featuresSub: 'هرچیزی که برای تبدیل شدن به یک معامله‌گر حرفه‌ای نیاز داری',
    compareTitle: 'تریدکاو در برابر بقیه',
    compareNote: '* اکسل رایگان است اما زمان راه‌اندازی و نگهداری هزینه واقعی دارد',
    pricingTitle: 'قیمت مناسب برای معامله‌گر ایرانی',
    pricingSub: 'پرداخت به تومان، بدون کارت بانکی بین‌المللی.',
    faqTitle: 'سوالات رایج',
    finalCtaTitle: 'آماده کشف برتری معاملاتی خودت هستی؟',
    finalCtaSub: 'رایگان، بدون محدودیت زمانی.',
    finalCtaBtn: 'همین الان شروع کن',
    footerDesc: 'ژورنال معاملاتی هوشمند فارسی، ساخته‌شده برای معامله‌گران ایرانی.',
    footerProduct: 'محصول',
    footerAccount: 'حساب کاربری',
    footerSupport: 'پشتیبانی',
    footerCopyright: 'تریدکاو. تمامی حقوق محفوظ است.',
    mobMenu: 'منو',
    compExcel: 'اکسل',
    compNotion: 'Notion',
    compTradekav: 'تریدکاو'
  },
  en: {
    navLinks: [
      { href: '#how', label: 'How it works' },
      { href: '#features', label: 'Features' },
      { href: '#pricing', label: 'Pricing' },
      { href: '#faq', label: 'FAQ' },
    ],
    stats: [
      { value: 500, suffix: '+', label: 'Active Traders' },
      { value: 50000, suffix: '+', label: 'Trades Logged', compact: true },
      { value: 23, suffix: '%', label: 'Average Success Rate Increase' },
    ],
    painPoints: [
      { icon: 'edit_note', title: 'Paper logs get forgotten', body: 'Writing trades in a notebook or phone app means you never look back at them.' },
      { icon: 'visibility_off', title: 'Don\'t know which session is profitable', body: 'Without statistics, choosing your best trading hours is pure guesswork.' },
      { icon: 'psychology', title: 'Emotions sabotage results', body: 'Fear and greed without tracking repeat destructive trading behaviors.' },
    ],
    steps: [
      { icon: 'upload_file', title: 'Import', body: 'Upload your MT4/MT5 HTML statement or sync automatically with our EA.' },
      { icon: 'analytics', title: 'Analyze', body: 'Automatic stats: win rate, profit factor, R:R, equity curve, and edge metrics.' },
      { icon: 'trending_up', title: 'Improve', body: 'Find weaknesses with daily journals and strategy tagging to boost profits.' },
    ],
    bento: [
      { id: 'import', icon: 'upload_file', title: 'Auto MT4/MT5 Processing', body: 'Upload statement files or use our EA, everything processes automatically.', span: 'wide', preview: 'import' },
      { id: 'equity', icon: 'show_chart', title: 'Equity Curve', body: 'Interactive charts of cumulative profit and drawdown metrics.', span: 'sm', preview: 'equity' },
      { id: 'calendar', icon: 'calendar_month', title: 'Trading Calendar', body: 'Daily performance map in a beautiful visual calendar.', span: 'sm', preview: 'calendar' },
      { id: 'emotion', icon: 'mood', title: 'Emotion Tracking', body: 'Analyze the direct connection between mindset and trade outcomes.', span: 'sm', preview: 'emotion' },
      { id: 'edge', icon: 'insights', title: 'Discover Your Edge', body: 'Smart system locating your strongest sessions, strategies, or weekdays.', span: 'sm', preview: 'edge' },
    ],
    comparison: [
      { type: 'section', label: 'Data Entry' } as CompareSection,
      { type: 'row', feature: 'MT4/MT5 Statement Sync', excel: 'Manual', notion: 'Manual', tradekav: 'check' } as CompareRow,
      { type: 'row', feature: 'Manual Trade Entry', excel: 'check', notion: 'check', tradekav: 'check' } as CompareRow,
      { type: 'row', feature: 'Mindset Tags', excel: 'Manual', notion: 'Limited', tradekav: 'check' } as CompareRow,
      { type: 'row', feature: 'Strategy Tags', excel: 'Manual', notion: 'Limited', tradekav: 'check' } as CompareRow,
      { type: 'section', label: 'Journaling Experience' } as CompareSection,
      { type: 'row', feature: 'Daily Journal Notes', excel: 'cross', notion: 'check', tradekav: 'check' } as CompareRow,
      { type: 'row', feature: 'RTL/Persian Calendar support', excel: 'cross', notion: 'cross', tradekav: 'check' } as CompareRow,
      { type: 'row', feature: 'Bilingual Interface', excel: 'cross', notion: 'cross', tradekav: 'check' } as CompareRow,
      { type: 'section', label: 'Pricing & Setup' } as CompareSection,
      { type: 'row', feature: 'Crypto/Local Payment', excel: 'Free', notion: 'cross', tradekav: 'check' } as CompareRow,
      { type: 'row', feature: 'Technical Knowledge Required', excel: 'High', notion: 'Medium', tradekav: 'None' } as CompareRow,
      { type: 'row', feature: 'Monthly Subscription', excel: 'Free*', notion: '~$16', tradekav: '~$5' } as CompareRow,
    ],
    faqs: [
      { q: 'Do I have to pay to start?', a: 'No! Registration and using the Free plan are completely free, taking less than 30 seconds.' },
      { q: 'Which brokers and platforms are supported?', a: 'Any broker that supports MetaTrader 4 or 5. Crypto exchanges are also supported via API. Simply import the HTML report or use our EA for live sync.' },
      { q: 'How is TradeKav different from Excel or Notion?', a: 'No manual formulas or data entry required. TradeKav automatically processes pips, risk management, R:R multipliers, equity curves, and performance heatmaps.' },
      { q: 'Are my data secure?', a: 'All data are stored securely on our encrypted servers and accessible only via your unique authorization token.' },
    ],
    planFree: ['1 Broker Account', 'Log 30 trades/month', '1-month calculation period', 'Daily Journal'],
    planStd: ['3 Broker Accounts', 'File Import (up to 150 rows)', '6-month calculation period', 'EA Sync (every 1 hour)'],
    planPro: ['Unlimited Accounts', '60-sec EA live sync', 'All history calculations', 'Data exports & priority support'],
    heroTitle: 'Smart Trading Journal',
    heroSubtitle: 'Log your trades automatically, find structural patterns, and boost your edge.',
    startFree: 'Start Free',
    signinLabel: 'Sign In',
    registerLabel: 'Sign Up Free',
    problemHeadline: 'Most traders fly blind without logging and analyzing their data.',
    howTitle: '3 Steps to Become a Professional Trader',
    featuresTitle: 'Everything a Professional Trader Needs',
    featuresSub: 'Advanced analytical tools to locate your mathematical edge.',
    compareTitle: 'TradeKav vs The Alternatives',
    compareNote: '* Excel is free, but setup, maintenance, and formula writing carry a real time cost.',
    pricingTitle: 'Flexible Pricing for Every Trader',
    pricingSub: 'Pay with local card gateways or cryptocurrency options.',
    faqTitle: 'Frequently Asked Questions',
    finalCtaTitle: 'Ready to Discover Your Mathematical Edge?',
    finalCtaSub: 'Completely free to start, no card required.',
    finalCtaBtn: 'Start Free Now',
    footerDesc: 'Smart Trading Journal, engineered to streamline execution analytics.',
    footerProduct: 'Product',
    footerAccount: 'Account',
    footerSupport: 'Support',
    footerCopyright: 'TradeKav. All rights reserved.',
    mobMenu: 'Menu',
    compExcel: 'Excel',
    compNotion: 'Notion',
    compTradekav: 'TradeKav'
  }
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function LandingPage({ params }: PageProps) {
  const { locale } = use(params);
  const isEn = locale === 'en';
  const copy = isEn ? DATA.en : DATA.fa;

  const { user, isInitialized } = useAuthStore();
  const router = useRouter();



  // Dynamically update page title and meta description based on locale
  useEffect(() => {
    document.title = isEn ? 'TradeKav | Smart Trading Journal' : 'تریدکاو | ژورنال معاملاتی هوشمند';
    document.querySelector('meta[name="description"]')?.setAttribute(
      'content',
      isEn
        ? 'Automatic MT4/5 sync, advanced performance reports, daily heatmaps, risk management, and psychology journal.'
        : 'تریدکاو اولین ژورنال معاملاتی هوشمند ایرانی؛ ثبت خودکار معاملات متاتریدر ۴ و ۵، تحلیل دقیق عملکرد، هیت‌مپ روزانه، مدیریت ریسک و روانشناسی معاملات.'
    );
  }, [isEn]);

  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const prices = usePrices();
  const cryptoDetails = useCryptoDetails();

  const plans = useMemo(() => {
    const formatPrice = (p: number) => {
      return p.toLocaleString('fa-IR');
    };

    const standardMonthly = isEn
      ? `$${(cryptoDetails?.standard?.monthlyUsd ?? 4.90).toFixed(2)}`
      : (prices ? formatPrice(prices.STANDARD.monthly) : '۲۴۹٬۰۰۰');
    const proMonthly = isEn
      ? `$${(cryptoDetails?.pro?.monthlyUsd ?? 9.90).toFixed(2)}`
      : (prices ? formatPrice(prices.PRO.monthly) : '۴۹۹٬۰۰۰');

    return [
      {
        name: isEn ? 'Free' : 'رایگان',
        price: '0',
        unit: isEn ? 'USD' : 'تومان',
        note: isEn ? 'Perfect for starting' : 'مناسب شروع',
        features: copy.planFree,
        cta: isEn ? 'Start Free' : 'شروع رایگان',
        featured: false,
      },
      {
        name: isEn ? 'Standard' : 'استاندارد',
        price: standardMonthly,
        unit: isEn ? 'USD / mo' : 'تومان / ماه',
        note: isEn ? 'Most Popular' : 'محبوب‌ترین',
        features: copy.planStd,
        cta: isEn ? 'Get Standard' : 'انتخاب استاندارد',
        featured: true,
      },
      {
        name: isEn ? 'PRO' : 'حرفه‌ای',
        price: proMonthly,
        unit: isEn ? 'USD / mo' : 'تومان / ماه',
        note: isEn ? 'For Professional Traders' : 'برای حرفه‌ای‌ها',
        features: copy.planPro,
        cta: isEn ? 'Get PRO' : 'انتخاب حرفه‌ای',
        featured: false,
      },
    ];
  }, [prices, isEn, copy]);

  const comparison = useMemo(() => {
    const rows = [...copy.comparison];
    const lastIdx = rows.length - 1;
    const lastRow = rows[lastIdx] as CompareRow;
    if (isEn) {
      const usd = `$${(cryptoDetails?.standard?.monthlyUsd ?? 4.90).toFixed(2)}`;
      rows[lastIdx] = { ...lastRow, tradekav: usd };
    } else {
      const formatted = prices ? prices.STANDARD.monthly.toLocaleString('fa-IR') : '۲۴۹٬۰۰۰';
      rows[lastIdx] = { ...lastRow, tradekav: `${formatted} ت` };
    }
    return rows;
  }, [prices, cryptoDetails, isEn, copy]);

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

  if (!isInitialized) {
    return null;
  }

  return (
    <div className={`landing ${isEn ? 'ltr' : 'rtl'}`} dir={isEn ? 'ltr' : 'rtl'}>
      {/* ─── Nav ─── */}
      <nav className={`landing-nav ${navScrolled ? 'scrolled' : ''}`}>
        <a className="landing-logo" href="#top" aria-label="TradeKav" onClick={(e) => handleScroll(e, '#top')}>
          <img src="/logo.png" alt="TradeKav" className="logo-img-landing" style={{ height: '34px', width: 'auto', objectFit: 'contain' }} />
          <span className="logo-text">{isEn ? 'TradeKav' : 'تریدکاو'}</span>
        </a>
        <div className="landing-nav-links">
          {copy.navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={(e) => handleScroll(e, l.href)}>{l.label}</a>
          ))}
        </div>
        <div className="landing-nav-cta">
          <button className="lang-switcher" onClick={() => router.push(isEn ? '/fa' : '/en')} style={{ marginInlineEnd: '16px', background: 'transparent', border: '1px solid #1e2535', color: '#f0f2f5', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
            {isEn ? 'فارسی' : 'English'}
          </button>
          <button className="btn-ghost" onClick={goLogin}>{copy.signinLabel}</button>
          <button className="btn-primary" onClick={goRegister}>{copy.registerLabel}</button>
        </div>
        <button
          className={`landing-nav-burger ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label={copy.mobMenu}
        >
          <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
        {mobileMenuOpen && (
          <div className="landing-mobile-menu">
            {copy.navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={(e) => handleScroll(e, l.href)}>{l.label}</a>
            ))}
            <button className="btn-primary full" onClick={() => { setMobileMenuOpen(false); goRegister(); }}>
              {copy.registerLabel}
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
              {isEn ? (
                <>
                  TradeKav Smart Trading <br />
                  <span className="gradient-text">Journal Log</span>
                </>
              ) : (
                <>
                  ژورنال معاملاتی هوشمند <br />
                  <span className="gradient-text">تریدکاو</span>
                </>
              )}
            </h1>
            <p className="hero-sub">{copy.heroSubtitle}</p>
            <div className="hero-ctas">
              <button className="btn-primary lg" onClick={goRegister}>
                {copy.startFree}
                <span className="material-symbols-outlined">{isEn ? 'arrow_forward' : 'arrow_back'}</span>
              </button>
              <button className="btn-ghost lg" onClick={goLogin}>{copy.signinLabel}</button>
            </div>
            <div className="hero-trust">
              <span><span className="material-symbols-outlined">check_circle</span> MT4 / MT5</span>
              <span><span className="material-symbols-outlined">check_circle</span> {isEn ? 'Manual Entry' : 'ورود دستی'}</span>
              <span><span className="material-symbols-outlined">check_circle</span> {isEn ? 'Crypto Exchange Auto-Sync' : 'همگام‌سازی خودکار صرافی‌ها'}</span>
            </div>
          </div>
          <div className="hero-mockup" aria-hidden="true">
            <DashboardMockup isEn={isEn} />
          </div>
        </div>
      </header>

      {/* ─── Problem Statement ─── */}
      <section className="landing-problem">
        <p className="problem-headline">{copy.problemHeadline}</p>
        <div className="pain-row">
          {copy.painPoints.map((p, i) => (
            <div className="pain-card" key={i}>
              <span className="material-symbols-outlined pain-icon">{p.icon}</span>
              <h3>{pointTitle(p, isEn)}</h3>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="landing-how" id="how">
        <div className="section-head">
          <h2>{copy.howTitle}</h2>
        </div>
        <div className="steps">
          {copy.steps.map((s, i) => (
            <div className="step" key={i}>
              <span className="step-num">{isEn ? (i + 1) : toPersianDigits(i + 1)}</span>
              <span className="material-symbols-outlined step-icon">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              {i < copy.steps.length - 1 && <span className="step-line" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Bento feature grid ─── */}
      <section className="landing-bento" id="features">
        <div className="section-head">
          <h2>{copy.featuresTitle}</h2>
          <p className="section-sub">{copy.featuresSub}</p>
        </div>
        <div className="bento-grid">
          {copy.bento.map((cell) => (
            <div className={`bento-cell ${cell.span === 'wide' ? 'wide' : ''}`} key={cell.id}>
              <div className="bento-preview">{renderPreview(cell.preview, isEn)}</div>
              <div className="bento-info">
                <span className="material-symbols-outlined">{cell.icon}</span>
                <h3>{cell.title}</h3>
                <p>{cell.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Comparison table ─── */}
      <section className="landing-compare">
        <div className="section-head">
          <h2>{copy.compareTitle}</h2>
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
                  {copy.compExcel}
                </th>
                <th className="col-head">
                  <span className="material-symbols-outlined head-icon">assignment</span>
                  {copy.compNotion}
                </th>
                <th className="col-head us-col">
                  <span className="material-symbols-outlined head-icon">trending_up</span>
                  {copy.compTradekav}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((item, idx) => {
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
                    <td>{renderCompareCell(item.excel, isEn)}</td>
                    <td>{renderCompareCell(item.notion, isEn)}</td>
                    <td className="us-col">{renderCompareCell(item.tradekav, isEn, true)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="compare-note-hint">{copy.compareNote}</p>
      </section>

      {/* ─── Pricing ─── */}
      <section className="landing-pricing" id="pricing">
        <div className="section-head">
          <h2>{copy.pricingTitle}</h2>
          <p className="section-sub">{copy.pricingSub}</p>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <div className={`price-card ${plan.featured ? 'featured' : ''}`} key={plan.name}>
              {plan.featured && <span className="price-badge">{isEn ? 'Popular' : 'محبوب‌ترین'}</span>}
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
          <h2>{copy.faqTitle}</h2>
        </div>
        <div className="faq-list">
          {copy.faqs.map((item, i) => {
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
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function pointTitle(p: any, isEn: boolean) {
  return p.title;
}

function renderCompareCell(v: CellType, isEn: boolean, isTradekav = false) {
  if (v === 'check') {
    return <span className="material-symbols-outlined cell-check">check_circle</span>;
  }
  if (v === 'cross') {
    return <span className="material-symbols-outlined cell-cross">cancel</span>;
  }
  
  // Localize text results inside cells
  if (isEn) {
    if (v === 'دستی') return <span className="cell-partial">Manual</span>;
    if (v === 'محدود') return <span className="cell-partial">Limited</span>;
    if (v === 'متوسط') return <span className="cell-partial">Medium</span>;
    if (v === 'فرمول') return <span className="cell-partial">Formulas</span>;
    if (v === 'نمودار دستی') return <span className="cell-partial">Manual Graph</span>;
    if (v === 'زیاد') return <span className="cell-partial">High</span>;
    if (v === 'نیاز به پیاده سازی') return <span className="cell-partial">Need Setup</span>;
    if (v === 'رایگان') return <span className="cell-text">Free</span>;
    if (v === 'رایگان*') return <span className="cell-text">Free*</span>;
    if (v === 'صفر') return <span className="cell-zero">None</span>;
  } else {
    if (v === 'دستی' || v === 'محدود' || v === 'متوسط' || v === 'فرمول' || v === 'نمودار دستی' || v === 'زیاد' || v === 'نیاز به پیاده سازی') {
      return <span className="cell-partial">{v}</span>;
    }
    if (v === 'صفر') {
      return <span className="cell-zero">{v}</span>;
    }
  }

  return <span className={`cell-text ${isTradekav ? 'us-col-text' : ''}`}>{v}</span>;
}

function renderPreview(kind: string, isEn: boolean) {
  switch (kind) {
    case 'equity':
      return <EquityMini />;
    case 'calendar':
      return <CalendarMini />;
    case 'emotion':
      return <EmotionMini isEn={isEn} />;
    case 'edge':
      return <EdgeMini isEn={isEn} />;
    case 'import':
      return <ImportMini isEn={isEn} />;
    default:
      return null;
  }
}

function CountUp({ end, compact, isEn }: { end: number; compact?: boolean; isEn?: boolean }) {
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
    const formattedVal = (val / 1000).toFixed(0);
    return (
      <span ref={setRef}>
        {isEn ? formattedVal : toPersianDigits(formattedVal)}
        <span className="compact-suffix">{isEn ? ',000' : '،۰۰۰'}</span>
      </span>
    );
  }
  return <span ref={setRef}>{isEn ? val.toLocaleString('en-US') : toPersianDigits(val.toLocaleString('en-US'))}</span>;
}

function DashboardMockup({ isEn }: { isEn: boolean }) {
  return (
    <div className="mockup">
      <div className="mockup-bar">
        <span className="mockup-dot" />
        <span className="mockup-dot" />
        <span className="mockup-dot" />
        <span className="mockup-url">{isEn ? 'TradeKav / Dashboard' : 'تریدکاو / داشبورد'}</span>
      </div>
      <div className="mockup-body">
        <div className="mockup-kpis">
          <div className="mk-kpi">
            <span className="mk-label">{isEn ? 'Today\'s Profit' : 'سود امروز'}</span>
            <span className="mk-val pos">+245 USD</span>
          </div>
          <div className="mk-kpi">
            <span className="mk-label">{isEn ? 'Win Rate' : 'نرخ موفقیت'}</span>
            <span className="mk-val">68%</span>
          </div>
          <div className="mk-kpi">
            <span className="mk-label">{isEn ? 'Profit Factor' : 'ضریب سود'}</span>
            <span className="mk-val">1.8</span>
          </div>
        </div>
        <div className="mockup-chart">
          <EquityMini />
        </div>
        <div className="mockup-rows">
          <div className="mk-row">
            <span className="mk-badge buy">B</span>
            <span className="mk-sym">XAUUSD</span>
            <span className="mk-pnl pos">+85</span>
          </div>
          <div className="mk-row">
            <span className="mk-badge sell">S</span>
            <span className="mk-sym">EURUSD</span>
            <span className="mk-pnl neg">-32</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EquityMini() {
  return (
    <svg className="mini-chart" viewBox="0 0 200 100" preserveAspectRatio="none" role="img" aria-label="Equity Curve">
      <defs>
        <linearGradient id="eq-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(61,220,151,0.3)" />
          <stop offset="100%" stopColor="rgba(61,220,151,0)" />
        </linearGradient>
      </defs>
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
      <path className="mini-line-glow" d="M0,85 L20,75 L35,80 L55,52 L75,54 L95,32 L115,60 L140,38 L160,42 L185,12 L200,8" />
      <path className="mini-line" d="M0,85 L20,75 L35,80 L55,52 L75,54 L95,32 L115,60 L140,38 L160,42 L185,12 L200,8" />
      <path d="M0,85 L20,75 L35,80 L55,52 L75,54 L95,32 L115,60 L140,38 L160,42 L185,12 L200,8 L200,100 L0,100 Z" fill="url(#eq-fill)" />
      <circle cx="200" cy="8" r="3" className="mini-dot-pulse" />
      <circle cx="200" cy="8" r="3" className="mini-dot" />
    </svg>
  );
}

function CalendarMini() {
  const cells = Array.from({ length: 35 });
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

function EmotionMini({ isEn }: { isEn: boolean }) {
  const moods = isEn
    ? [
        { e: '😄', label: 'Confident', val: '+85%', pos: true },
        { e: '😐', label: 'Neutral', val: '+4%', pos: true },
        { e: '😣', label: 'Anxious', val: '-42%', pos: false },
      ]
    : [
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

function EdgeMini({ isEn }: { isEn: boolean }) {
  return (
    <div className="mini-edge">
      <div className="edge-label">{isEn ? 'Your Trading Edge' : 'برتری معاملاتی شما'}</div>
      {isEn ? (
        <div className="edge-sentence">
          Your strongest performance is in the <b>London</b> session with a <b>72%</b> win rate across 18 trades.
        </div>
      ) : (
        <div className="edge-sentence">
          بهترین عملکرد تو در سشن <b>لندن</b> با نرخ موفقیت <b>۷۲٪</b> در ۱۸ معامله.
        </div>
      )}
      <div className="edge-meta">{isEn ? 'Based on last 30 days' : 'بر اساس ۳۰ روز گذشته'}</div>
    </div>
  );
}

function ImportMini({ isEn }: { isEn: boolean }) {
  const [step, setStep] = useState(0); 
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

      setStep(0);
      setProgress(15);

      schedule(() => {
        setStep(1);
        setProgress(50);
      }, 1000);

      schedule(() => {
        setStep(2);
        setProgress(85);
      }, 2200);

      schedule(() => {
        setStep(3);
        setProgress(100);
      }, 3400);

      schedule(() => {
        setStep(4);
      }, 3900);

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
            {step === 0 && (isEn ? 'Uploading file...' : 'آپلود فایل...')}
            {step === 1 && (isEn ? 'Reading data...' : 'خواندن فایل...')}
            {step === 2 && (isEn ? 'Analyzing setups...' : 'تحلیل داده‌ها...')}
            {step >= 3 && (isEn ? 'Processed Successfully' : 'پردازش موفق')}
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
        {isEn ? '12 trades identified and analyzed' : '۱۲ معامله شناسایی و تحلیل شد'}
      </div>
    </div>
  );
}
