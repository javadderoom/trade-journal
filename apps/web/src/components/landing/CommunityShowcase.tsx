'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface CommunityShowcaseProps {
  isEn: boolean;
  locale: string;
}

export default function CommunityShowcase({ isEn, locale }: CommunityShowcaseProps) {
  const router = useRouter();

  const goCommunity = () => router.push(`/${locale}/community`);

  return (
    <section className="landing-community-section">
      <div className="section-container">
        <div className="community-head">
          <span className="section-label-chip green">{isEn ? 'TRADEKAV COMMUNITY' : 'انجمن تریدکاو'}</span>
          <h2 className="community-title">
            {isEn ? 'Your private journal can become shared knowledge.' : 'ژورنال خصوصی شما می‌تواند به دانش مشترک تبدیل شود.'}
          </h2>
          <p className="community-sub">
            {isEn
              ? 'Keep your complete journal 100% private, or publish selected setups with 1 click to get feedback and inspire other traders.'
              : 'ژورنال شما به صورت پیش‌فرض ۱۰۰٪ خصوصی است. هر زمان تمایل داشتید، با یک کلیک ایده‌ها و تحلیل‌های خود را با جامعه معامله‌گران به اشتراک بگذارید.'}
          </p>
        </div>

        {/* Story Visual Pipeline */}
        <div className="community-pipeline-visual">
          {/* Card 1: Private Journal */}
          <div className="pipeline-card private-card">
            <div className="card-badge-row">
              <span className="badge-lock">
                <span className="material-symbols-outlined">lock</span>
                {isEn ? 'Private Journal' : 'ژورنال خصوصی'}
              </span>
            </div>
            <ul className="pipeline-list">
              <li>
                <span className="material-symbols-outlined check-ic">check</span>
                <span>{isEn ? 'All personal trades & account equity' : 'تمام معاملات شخصى و بالانس'}</span>
              </li>
              <li>
                <span className="material-symbols-outlined check-ic">check</span>
                <span>{isEn ? 'Private psychological notes' : 'یادداشت‌های روانی محرمانه'}</span>
              </li>
              <li>
                <span className="material-symbols-outlined check-ic">check</span>
                <span>{isEn ? 'Full multi-timeframe screenshots' : 'تصاویر تحلیل‌های شما'}</span>
              </li>
            </ul>
          </div>

          {/* Connector: Privacy Controls */}
          <div className="pipeline-connector">
            <div className="connector-icon-box">
              <span className="material-symbols-outlined">swap_horiz</span>
            </div>
            <span className="connector-text">{isEn ? 'You choose what to share' : 'شما انتخاب می‌کنید چه چیزی منتشر شود'}</span>
          </div>

          {/* Card 2: Community Post */}
          <div className="pipeline-card public-card">
            <div className="card-badge-row">
              <span className="badge-globe">
                <span className="material-symbols-outlined">public</span>
                {isEn ? 'Community Post' : 'پست عمومی انجمن'}
              </span>
            </div>
            <ul className="pipeline-list">
              <li>
                <span className="material-symbols-outlined check-ic">check</span>
                <span>{isEn ? 'Verified trade setup & context' : 'استراتژی و تحلیل تاییدشده'}</span>
              </li>
              <li>
                <span className="material-symbols-outlined check-ic">check</span>
                <span>{isEn ? 'Selected chart markup' : 'تصویر نمودار انتخابی'}</span>
              </li>
              <li>
                <span className="material-symbols-outlined check-ic">check</span>
                <span>{isEn ? 'Open for discussion & peer feedback' : 'گفتگو و دریافت بازخورد همکاران'}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="community-cta-box">
          <button className="btn-primary lg" onClick={goCommunity}>
            <span>{isEn ? 'Explore Community Setups' : 'مشاهده تحلیل‌های انجمن'}</span>
            <span className="material-symbols-outlined">{isEn ? 'arrow_forward' : 'arrow_back'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
