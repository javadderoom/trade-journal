import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TOPICS_DATA } from '../../../../constants/topicsData';

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
    <div className="landing-root" dir={isEn ? 'ltr' : 'rtl'}>
      {/* 1. TOPIC HERO SECTION */}
      <section className="hero-section" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
        <div className="container text-center">
          <div className="badge-pill">
            <span className="material-symbols-outlined icon">verified</span>
            <span>{isEn ? topic.badge.en : topic.badge.fa}</span>
          </div>

          <h1 className="hero-title">
            {isEn ? topic.heroHeadline.en : topic.heroHeadline.fa}
          </h1>

          <p className="hero-subtitle">
            {isEn ? topic.heroSubheadline.en : topic.heroSubheadline.fa}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn btn-primary">
              {isEn ? 'Start Free Registration' : 'شروع رایگان در تریدکاو'}
            </Link>
            <Link href="/backtest" className="btn btn-outline">
              {isEn ? 'Try Live Backtester' : 'تست آنلاین بک‌تستر'}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. TOPIC FEATURES GRID */}
      <section className="features-section" style={{ padding: '60px 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '1.8rem', fontWeight: 700 }}>
            {isEn ? 'Key Features & Capabilities' : 'ویژگی‌ها و امکانات کلیدی'}
          </h2>

          <div className="features-grid">
            {topic.features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">
                  <span className="material-symbols-outlined">{f.icon}</span>
                </div>
                <h3>{isEn ? f.title.en : f.title.fa}</h3>
                <p>{isEn ? f.desc.en : f.desc.fa}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FREQUENTLY ASKED QUESTIONS */}
      <section className="faq-section" style={{ padding: '60px 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '1.6rem', fontWeight: 700 }}>
            {isEn ? 'Frequently Asked Questions' : 'سوالات متداول'}
          </h2>

          <div className="faq-list">
            {topic.faqs.map((faq, idx) => (
              <div key={idx} className="faq-item">
                <h4>{isEn ? faq.q.en : faq.q.fa}</h4>
                <p>{isEn ? faq.a.en : faq.a.fa}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FINAL CTA */}
      <section className="cta-section" style={{ padding: '60px 0 100px', textAlign: 'center' }}>
        <div className="container">
          <div className="cta-card">
            <h2>
              {isEn ? 'Ready to Upgrade Your Trading Discipline?' : 'آماده بهینه‌سازی استراتژی معاملاتی خود هستید؟'}
            </h2>
            <p>
              {isEn ? 'Join 500+ active traders analyzing their trades with TradeKav.' : 'به بیش از ۵۰۰ معامله‌گر فعال تریدکاو بپیوندید.'}
            </p>
            <Link href="/register" className="btn btn-primary">
              {isEn ? 'Create Free Account' : 'ساخت حساب کاربری رایگان'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
