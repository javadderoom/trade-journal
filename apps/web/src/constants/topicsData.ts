export interface TopicData {
  slug: string;
  badge: { fa: string; en: string };
  title: { fa: string; en: string };
  seoTitle: { fa: string; en: string };
  metaDescription: { fa: string; en: string };
  keywords: string[];
  heroHeadline: { fa: string; en: string };
  heroSubheadline: { fa: string; en: string };
  features: {
    icon: string;
    title: { fa: string; en: string };
    desc: { fa: string; en: string };
  }[];
  faqs: {
    q: { fa: string; en: string };
    a: { fa: string; en: string };
  }[];
}

export const TOPICS_DATA: Record<string, TopicData> = {
  'prop-firm-journal': {
    slug: 'prop-firm-journal',
    badge: { fa: 'ویژه تریدرهای پراپ', en: 'Prop Firm Special' },
    title: { fa: 'ژورنال ترید حساب‌های پراپ (Prop Firm)', en: 'Prop Firm Trading Journal' },
    seoTitle: {
      fa: 'ژورنال ترید پراپ فرم و مدیریت چالش | تریدکاو (TradeKav)',
      en: 'Prop Firm Trading Journal & Challenge Manager | TradeKav',
    },
    metaDescription: {
      fa: 'ژورنال ترید هوشمند ویژه تریدرهای حساب‌های پراپ؛ کنترل دروداون روزانه، محاسبه ROI، ثبت خودکار متاتریدر و جایگزین فارسی TradeZella.',
      en: 'Smart Prop Firm Trading Journal; track daily drawdown limits, calculate ROI, auto-sync MT4/MT5 trades, and manage challenges.',
    },
    keywords: [
      'ژورنال ترید پراپ',
      'ژورنال پراپ فرم',
      'پاس کردن چالش پراپ',
      'مدیریت دروداون پراپ',
      'ژورنال حساب فاندد',
      'TradeZella فارسی',
      'Prop firm trading journal',
      'Prop challenge manager',
      'Daily drawdown tracker',
    ],
    heroHeadline: {
      fa: 'اولین ژورنال ترید هوشمند ویژه چالش‌ها و تریدرهای پراپ (Prop Firm)',
      en: 'The #1 Smart Trading Journal Built for Prop Firm Challenge Traders',
    },
    heroSubheadline: {
      fa: 'دیگر نگران نقض قوانین دروداون روزانه نباشید. ثبت خودکار معاملات، هشدارهای مدیریت ریسک و تحلیل دقیق عملکرد چالش در یک پنل پیشرفته.',
      en: 'Never breach daily drawdown rules again. Automated trade syncing, risk management alerts, and challenge analytics in one powerful dashboard.',
    },
    features: [
      {
        icon: 'shield_lock',
        title: { fa: 'کنترل دقیق دروداون روزانه (Daily Drawdown)', en: 'Daily Drawdown Shield' },
        desc: {
          fa: 'محاسبه لحظه‌ای حد ضرر شناور و دروداون کل برای جلوگیری از سوختن حساب پراپ.',
          en: 'Real-time floating drawdown limits monitoring to prevent challenge breaches.',
        },
      },
      {
        icon: 'candlestick_chart',
        title: { fa: 'ثبت خودکار معاملات متاتریدر', en: 'Instant MT4/MT5 Auto-Sync' },
        desc: {
          fa: 'اتصال مستقیم به حساب متاتریدر و ثبت بدون تاخیر قیمت ورود، خروج، اسپرد و کمیسیون.',
          en: 'Direct MT4/MT5 connection logging entry, exit, spread, and commission zero delay.',
        },
      },
      {
        icon: 'calculate',
        title: { fa: 'محاسبه نرخ بازگشت سرمایه واقعی (Prop ROI)', en: 'True Prop ROI Calculator' },
        desc: {
          fa: 'محاسبه سود خالص بر اساس هزینه ورودی چالش (Challenge Fee) و سهم سود (Payout Share).',
          en: 'Calculate true out-of-pocket ROI comparing challenge fees against payout share.',
        },
      },
    ],
    faqs: [
      {
        q: { fa: 'آیا تریدکاو با تمام شرکت‌های پراپ سازگار است؟', en: 'Is TradeKav compatible with all Prop Firms?' },
        a: {
          fa: 'بله، تریدکاو با متاتریدر ۴ و ۵ تمام شرکت‌های پراپ از جمله FTMO، MFF، Funders Server و شرکت‌های ایرانی کاملاً سازگار است.',
          en: 'Yes, TradeKav works seamlessly with MT4 and MT5 servers across all global and regional prop firms.',
        },
      },
    ],
  },
  'metatrader-sync': {
    slug: 'metatrader-sync',
    badge: { fa: 'اتصال خودکار متاتریدر', en: 'MT4 / MT5 Auto Sync' },
    title: { fa: 'ثبت خودکار معاملات متاتریدر ۴ و ۵', en: 'Automated MT4 & MT5 Trade Journal' },
    seoTitle: {
      fa: 'ثبت خودکار معاملات متاتریدر ۴ و ۵ ویژه تریدرها | تریدکاو',
      en: 'Automated MT4 & MT5 Trading Journal - No Excel | TradeKav',
    },
    metaDescription: {
      fa: 'ژورنال ترید با اتصال مستقیم به متاتریدر ۴ و ۵؛ ثبت خودکار پوزیشن‌ها، محاسبه پیپ و سود خالص، هیت‌مپ تقویم و گزارش صوتی هوشمند.',
      en: 'Automated trading journal for MetaTrader 4 & 5. Auto-sync trades, calculate exact pips & net profit, and view calendar heatmaps.',
    },
    keywords: [
      'ثبت خودکار معاملات متاتریدر',
      'ژورنال متاتریدر ۴',
      'ژورنال متاتریدر ۵',
      'اکسپرت ژورنال نویسی',
      'سینک متاتریدر تریدکاو',
      'MT4 automated journal',
      'MT5 trade logger',
      'MetaTrader journal app',
    ],
    heroHeadline: {
      fa: 'ثبت خودکار ۱۰۰٪ معاملات متاتریدر ۴ و ۵ برای تریدرها بدون نیاز به فایل‌های دستگیر اکسل',
      en: '100% Automated MetaTrader 4 & 5 Trade Logging Without Manual Excel',
    },
    heroSubheadline: {
      fa: 'با نصب اکسپرت اختصاصی تریدکاو، تمام معاملات شما بلافاصله پس از بسته‌شدن وارد ژورنال شده و تحلیل‌های پیشرفته روی آن انجام می‌شود.',
      en: 'Install TradeKav EA once, and every executed position is instantly logged and analyzed in real-time.',
    },
    features: [
      {
        icon: 'sync_alt',
        title: { fa: 'همگام‌سازی لحظه‌ای بدون تاخیر', en: 'Instant Zero-Latency Sync' },
        desc: {
          fa: 'ثبت قیمت exact ورود، خروج، SL، TP، کمیسیون و سوآپ به محض بسته‌شدن معامله.',
          en: 'Instant recording of entry, exit, SL, TP, commission, and swap on close.',
        },
      },
      {
        icon: 'analytics',
        title: { fa: 'تحلیل عملکرد بر اساس تایم‌فریم و سشن', en: 'Session & Timeframe Analytics' },
        desc: {
          fa: 'شناسایی سودآورترین سشن معاملاتی (لندن، نیویورک، آسیا) و بهترین نمادها.',
          en: 'Identify your most profitable trading sessions (London, NY, Asia) and best symbols.',
        },
      },
    ],
    faqs: [
      {
        q: { fa: 'چگونه اکسپرت متاتریدر را نصب کنم؟', en: 'How do I install the MetaTrader EA?' },
        a: {
          fa: 'پس از ثبت‌نام، فایل اکسپرت اختصاصی به همراه آموزش ویدئویی ۲ دقیقه‌ای نصب در دسترس شما قرار می‌گیرد.',
          en: 'After registering, download the EA file with a 2-minute step-by-step video installation guide.',
        },
      },
    ],
  },
  'crypto-journal': {
    slug: 'crypto-journal',
    badge: { fa: 'ژورنال ترید کریپتو و فیوچرز', en: 'Crypto Futures Journal' },
    title: { fa: 'ژورنال ترید کریپتو و فیوچرز (Crypto Journal)', en: 'Crypto & Futures Trading Journal' },
    seoTitle: {
      fa: 'ژورنال ترید ارز دیجیتال و فیوچرز با مدیریت اهرم | تریدکاو',
      en: 'Crypto & Futures Trading Journal with Leverage Management | TradeKav',
    },
    metaDescription: {
      fa: 'ژورنال ترید تخصصی کریپتو، بیت‌کوین و فیوچرز برای تریدرها؛ مدیریت اهرم، سود و زیان دلاری و تومانی، تحلیل احساسات بازار و ثبت چک‌لیست استراتژی.',
      en: 'Specialized crypto & futures trading journal; leverage management, USD/IRR profit tracking, market sentiment analysis, and strategy checklist.',
    },
    keywords: [
      'ژورنال ارز دیجیتال',
      'ژورنال فیوچرز',
      'ژورنال بیت کوین',
      'ژورنال کریپتو فارسی',
      'ثبت معاملات فیوچرز',
      'Crypto trading journal',
      'Futures trade log',
      'Crypto leverage calculator',
    ],
    heroHeadline: {
      fa: 'ژورنال ترید حرفه‌ای معاملات کریپتو، ارز دیجیتال و بازار فیوچرز برای تریدرها',
      en: 'Professional Crypto & Futures Trading Journal for High-Performance Traders',
    },
    heroSubheadline: {
      fa: 'محاسبه دقیق سود و زیان دلاری و تومانی، تحلیل اثر اهرم (Leverage) بر وین‌ریت و مدیریت روانشناسی تریدینگ در بازار ارز دیجیتال.',
      en: 'Accurate USD and IRR profit tracking, leverage analytics, and psychological trade logging for crypto markets.',
    },
    features: [
      {
        icon: 'currency_bitcoin',
        title: { fa: 'پشتیبانی از تمام کوین‌ها و جفت‌ارزها', en: 'All Coins & Pairs Supported' },
        desc: {
          fa: 'ثبت معاملات بیت‌کوین، اتریوم، آلت‌کوین‌ها و شیت‌کوین‌ها با تبدیل لحظه‌ای نرخ دلار.',
          en: 'Log BTC, ETH, Altcoins, and leverage positions with live USD/IRR conversion.',
        },
      },
      {
        icon: 'psychology',
        title: { fa: 'ثبت روانشناسی و هیجانات (FOMO / Revenge)', en: 'Trader Psychology & Mood' },
        desc: {
          fa: 'ثبت احساسات زمان ورود به معامله (استرس، انتقام، اطمینان) برای جلوگیری از Over-trading.',
          en: 'Track pre-trade emotions (FOMO, revenge, stress) to stop emotional over-trading.',
        },
      },
    ],
    faqs: [
      {
        q: { fa: 'آیا نرخ دلار و تومان به‌روزرسانی می‌شود؟', en: 'Is the USD/IRR exchange rate updated live?' },
        a: {
          fa: 'بله، تریدکاو نرخ لحظه‌ای دلار تتر را دریافت کرده و سود شما را همزمان به دلار و تومان نمایش می‌دهد.',
          en: 'Yes, TradeKav fetches live Tether/IRR rates and displays profits simultaneously in USD and Toman.',
        },
      },
    ],
  },
  'forex-journal': {
    slug: 'forex-journal',
    badge: { fa: 'ژورنال ترید فارکس', en: 'Forex Trading Journal' },
    title: { fa: 'ژورنال ترید فارکس و طلا (XAUUSD)', en: 'Forex & Gold (XAUUSD) Journal' },
    seoTitle: {
      fa: 'ژورنال ترید فارکس و طلا | محاسبه پیپ و هیت‌مپ سود | تریدکاو',
      en: 'Forex & Gold (XAUUSD) Trading Journal | Pip Calculator | TradeKav',
    },
    metaDescription: {
      fa: 'ژورنال ترید اختصاصی تریدرهای فارکس و انس طلا (XAUUSD)؛ محاسبه دقیق پیپ، سود به دلار، تقویم معاملاتی و سیستم بک‌تستر هوشمند.',
      en: 'Dedicated Forex & Gold (XAUUSD) trading journal. Precise pip calculations, USD net profit tracking, calendar heatmaps, and interactive backtesting.',
    },
    keywords: [
      'ژورنال فارکس',
      'ژورنال طلا XAUUSD',
      'ژورنال انس طلا',
      'محاسبه پیپ فارکس',
      'ژورنال تریدینگ فارکس',
      'Forex trading journal',
      'Gold XAUUSD trade log',
      'Forex pip calculator',
    ],
    heroHeadline: {
      fa: 'ژورنال ترید اختصاصی برای تریدرهای فارکس و انس طلا (XAUUSD)',
      en: 'Dedicated Forex & Gold (XAUUSD) Trading Journal for Precision Traders',
    },
    heroSubheadline: {
      fa: 'محاسبه سود بر اساس لات‌سایز و ارزش هر پیپ، تحلیل سشن‌های لندن و نیویورک و بک‌تستر شبیه‌ساز حرکت قیمت.',
      en: 'Calculate pips per lot size, analyze London & NY session performance, and simulate tradingview historical price replay.',
    },
    features: [
      {
        icon: 'monitoring',
        title: { fa: 'محاسبه دقیق پیپ و ارزش هر لات', en: 'Exact Pip & Lot Multiplier' },
        desc: {
          fa: 'فرمول دقیق ارزش هر پیپ برای طلا ($100/lot)، جفت‌ارزهای اصلی (0.0001) و جفت‌های ین (JPY).',
          en: 'Exact pip value multiplier for Gold ($100/lot), majors (0.0001), and JPY pairs.',
        },
      },
      {
        icon: 'history_edu',
        title: { fa: 'شبیه‌ساز بک‌تستر پیشرفته (Backtester)', en: 'Interactive Market Backtester' },
        desc: {
          fa: 'تست استراتژی‌های فارکس روی ۶۰۰ کندل اخیر بازار با قابلیت ریپلی کندل به کندل.',
          en: 'Backtest forex strategies on 600 historical candles with bar-by-bar replay.',
        },
      },
    ],
    faqs: [
      {
        q: { fa: 'چگونه می‌توانم از ژورنال فارکس استفاده کنم؟', en: 'How do I start using the Forex journal?' },
        a: {
          fa: 'کافیست در تریدکاو حساب کاربری رایگان بسازید و متاتریدر خود را متصل کنید یا معاملات را دستی وارد نمایید.',
          en: 'Simply create a free TradeKav account, connect MetaTrader or enter trades manually.',
        },
      },
    ],
  },
};
