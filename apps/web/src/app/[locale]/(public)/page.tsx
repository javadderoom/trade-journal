'use client';

import { useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/auth';
import { usePrices } from '../../../hooks/usePrices';
import { useCryptoDetails } from '../../../hooks/useCryptoDetails';
import '../../landing.scss';

// Import V2 Redesign Landing Components
import HeroSection from '@/components/landing/HeroSection';
import ProblemSection from '@/components/landing/ProblemSection';
import CoreLoopSection from '@/components/landing/CoreLoopSection';
import JournalShowcase from '@/components/landing/JournalShowcase';
import AnalyticsShowcase from '@/components/landing/AnalyticsShowcase';
import TradeReviewShowcase from '@/components/landing/TradeReviewShowcase';
import CommunityShowcase from '@/components/landing/CommunityShowcase';
import EdgeDiscoveryShowcase from '@/components/landing/EdgeDiscoveryShowcase';
import PricingSection from '@/components/landing/PricingSection';
import FaqSection from '@/components/landing/FaqSection';

const FAQS = {
  fa: [
    {
      q: 'آیا برای شروع ثبت معاملات باید هزینه پرداخت کنم؟',
      a: 'خیر. ثبت‌نام و استفاده از پلن رایگان کاملاً بدون هزینه است و در کمتر از ۳۰ ثانیه آماده می‌شود.',
    },
    {
      q: 'با کدام بروکرها و پلتفرم‌ها همگام‌سازی انجام می‌شود؟',
      a: 'هر بروکری که از متاتریدر ۴ یا ۵ پشتیبانی کند. همچنین صرافی‌های ارز دیجیتال به صورت مستقیم یا از طریق اکسپرت EA پشتیبانی می‌شوند.',
    },
    {
      q: 'تفاوت تریدکاو با اکسل و Notion چیست؟',
      a: 'تریدکاو تمام محاسبات پیپ، سود تجمعی، ریسک به ریوارد، افت سرمایه و تقویم سود و زیان را بدون فرمول‌نویسی دستی و کاملاً اتوماتیک انجام می‌دهد.',
    },
    {
      q: 'آیا داده‌های ژورنال من امن و خصوصی هستند؟',
      a: 'بله. تمامی داده‌ها روی سرورهای رمزنگاری‌شده ذخیره می‌شوند و ژورنال شما به صورت پیش‌فرض ۱۰۰٪ خصوصی است.',
    },
  ],
  en: [
    {
      q: 'Do I need a credit card to start?',
      a: 'No! Registration and using the Free plan are 100% free with no credit card required.',
    },
    {
      q: 'Which platforms and brokers are supported?',
      a: 'Any broker supporting MetaTrader 4 or 5. Crypto exchanges are also supported via report imports or automated EA sync.',
    },
    {
      q: 'How is TradeKav different from Excel or Notion?',
      a: 'TradeKav automates pip calculation, equity curves, R:R ratios, session heatmaps, and psychological analytics with zero manual formulas.',
    },
    {
      q: 'Is my trading data kept private?',
      a: 'Yes. All data are encrypted and your journal is 100% private by default unless you choose to share a setup to the community.',
    },
  ],
};

const PLAN_FREE_FEATS = {
  fa: ['۱ حساب بروکر', 'ثبت ۳۰ معامله در ماه', 'محاسبات ۱ ماه گذشته', 'ژورنال روزانه و تگ‌گذاری'],
  en: ['1 Broker Account', 'Log 30 trades / month', '1-month calculation window', 'Daily Journal & Tags'],
};

const PLAN_STD_FEATS = {
  fa: ['۳ حساب بروکر', 'واردات فایل متاتریدر (نامحدود)', 'محاسبات ۶ ماه گذشته', 'همگام‌سازی EA خودکار (هر ۱ ساعت)'],
  en: ['3 Broker Accounts', 'Unlimited Statement File Import', '6-month calculation window', 'Automated EA Sync (1h frequency)'],
};

const PLAN_PRO_FEATS = {
  fa: ['حساب‌های بروکر نامحدود', 'همگام‌سازی زنده ۶۰ ثانیه‌ای EA', 'کل تاریخچه محاسبات (نامحدود)', 'خروجی داده‌ها و پشتیبانی اختصاصی'],
  en: ['Unlimited Broker Accounts', 'Live 60s EA Sync', 'All-time Calculation History', 'Data Export & Priority Support'],
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function LandingPage({ params }: PageProps) {
  const { locale } = use(params);
  const isEn = locale === 'en';
  const router = useRouter();

  const { isInitialized } = useAuthStore();
  const prices = usePrices();
  const cryptoDetails = useCryptoDetails();

  // Dynamically update page title and meta description based on locale
  useEffect(() => {
    document.title = isEn ? 'TradeKav | Learn from Every Trade' : 'تریدکاو | ژورنال معاملاتی و یادگیری از هر معامله';
    document.querySelector('meta[name="description"]')?.setAttribute(
      'content',
      isEn
        ? 'Trade better by learning from every trade. Automated MT4/5 sync, structured trade reviews, analytics, and community sharing.'
        : 'با یادگیری از هر معامله، بهتر معامله کنید. ثبت خودکار متاتریدر، تحلیل پیشرفته، بررسی عمیق معاملات و انجمن تریدکاو.'
    );
  }, [isEn]);

  const plans = useMemo(() => {
    const formatPrice = (p: number) => p.toLocaleString('fa-IR');

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
        note: isEn ? 'Perfect for starting out' : 'مناسب شروع معامله‌گری',
        features: isEn ? PLAN_FREE_FEATS.en : PLAN_FREE_FEATS.fa,
        cta: isEn ? 'Start Free' : 'شروع رایگان',
        featured: false,
      },
      {
        name: isEn ? 'Standard' : 'استاندارد',
        price: standardMonthly,
        unit: isEn ? 'USD / mo' : 'تومان / ماه',
        note: isEn ? 'Most Popular for Active Traders' : 'محبوب‌ترین انتخاب معامله‌گران',
        features: isEn ? PLAN_STD_FEATS.en : PLAN_STD_FEATS.fa,
        cta: isEn ? 'Get Standard' : 'انتخاب استاندراد',
        featured: true,
      },
      {
        name: isEn ? 'PRO' : 'حرفه‌ای',
        price: proMonthly,
        unit: isEn ? 'USD / mo' : 'تومان / ماه',
        note: isEn ? 'For Full-Time & Professional Traders' : 'برای معامله‌گران حرفه‌ای',
        features: isEn ? PLAN_PRO_FEATS.en : PLAN_PRO_FEATS.fa,
        cta: isEn ? 'Get PRO' : 'انتخاب حرفه‌ای',
        featured: false,
      },
    ];
  }, [prices, cryptoDetails, isEn]);

  const handleSelectPlan = (planName: string) => {
    router.push('/register');
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <div className={`landing ${isEn ? 'ltr' : 'rtl'}`} dir={isEn ? 'ltr' : 'rtl'}>
      {/* 1. Hero Section V2 */}
      <HeroSection isEn={isEn} locale={locale} />

      {/* 2. Problem Statement */}
      <ProblemSection isEn={isEn} />

      {/* 3. The Core Growth Loop */}
      <CoreLoopSection isEn={isEn} />

      {/* 4. Smart Trade Journal Showcase */}
      <JournalShowcase isEn={isEn} />

      {/* 5. Advanced Analytics Showcase */}
      <AnalyticsShowcase isEn={isEn} />

      {/* 6. Deep Trade Review Showcase */}
      <TradeReviewShowcase isEn={isEn} />

      {/* 7. TradeKav Community Flow */}
      <CommunityShowcase isEn={isEn} locale={locale} />

      {/* 8. Discover Your Edge */}
      <EdgeDiscoveryShowcase isEn={isEn} />

      {/* 9. Transparent Pricing */}
      <PricingSection isEn={isEn} plans={plans} onSelectPlan={handleSelectPlan} />

      {/* 10. Frequently Asked Questions */}
      <FaqSection isEn={isEn} faqs={isEn ? FAQS.en : FAQS.fa} />
    </div>
  );
}
