import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TOPICS_DATA } from '../../../../constants/topicsData';
import './topic.scss';

interface TopicPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = Object.keys(TOPICS_DATA);
  const params: { locale: string; slug: string }[] = [];
  
  for (const slug of slugs) {
    params.push({ locale: 'fa', slug });
    params.push({ locale: 'en', slug });
  }

  return params;
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const topic = TOPICS_DATA[slug];

  if (!topic) {
    return {
      title: 'صفحه یافت نشد | تریدکاو',
    };
  }

  const isEn = locale === 'en';

  return {
    title: isEn ? topic.seoTitle.en : topic.seoTitle.fa,
    description: isEn ? topic.metaDescription.en : topic.metaDescription.fa,
    keywords: topic.keywords,
    alternates: {
      canonical: `https://tradekav.ir/${locale}/topic/${slug}`,
      languages: {
        fa: `https://tradekav.ir/fa/topic/${slug}`,
        en: `https://tradekav.ir/en/topic/${slug}`,
      },
    },
    openGraph: {
      title: isEn ? topic.seoTitle.en : topic.seoTitle.fa,
      description: isEn ? topic.metaDescription.en : topic.metaDescription.fa,
      url: `https://tradekav.ir/${locale}/topic/${slug}`,
      siteName: 'TradeKav',
      type: 'website',
    },
  };
}

export default async function TopicSEOPage({ params }: TopicPageProps) {
  const { locale, slug } = await params;
  const topic = TOPICS_DATA[slug];

  if (!topic) {
    notFound();
  }

  const isEn = locale === 'en';

  return (
    <div className="topic-page" dir={isEn ? 'ltr' : 'rtl'}>
      {/* ── 1. NAVIGATION HEADER ── */}
      <header className="topic-nav">
        <div className="nav-container">
          <Link href="/" className="brand-logo">
            <img src="/logo.png" alt="TradeKav Logo" />
            <span>تریدکاو</span>
          </Link>
          <div className="nav-actions">
            <Link href="/login" className="btn-ghost">
              {isEn ? 'Log In' : 'ورود'}
            </Link>
            <Link href="/register" className="btn-accent">
              {isEn ? 'Free Trial' : 'ثبت نام رایگان'}
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. HERO SECTION ── */}
      <section className="topic-hero">
        <div className="hero-container">
          <div className="topic-badge">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified</span>
            <span>{isEn ? topic.badge.en : topic.badge.fa}</span>
          </div>

          <h1>{isEn ? topic.heroHeadline.en : topic.heroHeadline.fa}</h1>

          <p className="subtitle">
            {isEn ? topic.heroSubheadline.en : topic.heroSubheadline.fa}
          </p>

          <div className="hero-cta">
            <Link href="/register" className="btn-accent" style={{ padding: '14px 32px', fontSize: '1rem' }}>
              {isEn ? 'Start Free Today' : 'شروع رایگان در تریدکاو'}
            </Link>
            <Link href="/backtest" className="btn-ghost" style={{ padding: '14px 28px', fontSize: '1rem' }}>
              {isEn ? 'Try Live Backtester' : 'تست آنلاین بک‌تستر'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. FEATURES GRID ── */}
      <section className="topic-features">
        <h2 className="section-title">
          {isEn ? 'Key Features & Capabilities' : 'امکانات و ابزارهای کلیدی تریدکاو'}
        </h2>

        <div className="features-grid">
          {topic.features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="icon-wrapper">
                <span className="material-symbols-outlined">{f.icon}</span>
              </div>
              <h3>{isEn ? f.title.en : f.title.fa}</h3>
              <p>{isEn ? f.desc.en : f.desc.fa}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. FREQUENTLY ASKED QUESTIONS ── */}
      <section className="topic-faq">
        <div className="faq-container">
          <h2 className="section-title">
            {isEn ? 'Frequently Asked Questions' : 'سوالات متداول'}
          </h2>

          {topic.faqs.map((faq, idx) => (
            <div key={idx} className="faq-item">
              <h4>{isEn ? faq.q.en : faq.q.fa}</h4>
              <p>{isEn ? faq.a.en : faq.a.fa}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. FINAL BANNER CTA ── */}
      <section className="topic-cta-banner">
        <div className="banner-card">
          <h2>
            {isEn ? 'Ready to Upgrade Your Trading Discipline?' : 'آماده ارتقای نظم و استراتژی تریدینگ خود هستید؟'}
          </h2>
          <p>
            {isEn ? 'Join early traders analyzing their trades with TradeKav.' : 'به تریدرهای هوشمند تریدکاو بپیوندید و معاملات خود را پیشرفته تحلیل کنید.'}
          </p>
          <Link href="/register" className="btn-accent" style={{ padding: '16px 36px', fontSize: '1.05rem' }}>
            {isEn ? 'Create Free Account' : 'ساخت رایگان حساب تریدکاو'}
          </Link>
        </div>
      </section>

      {/* ── 6. FOOTER ── */}
      <footer className="topic-footer">
        <p>© {new Date().getFullYear()} TradeKav (تریدکاو). تمامی حقوق محفوظ است.</p>
      </footer>
    </div>
  );
}
