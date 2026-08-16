'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import HeroChartMock from './HeroChartMock';

interface HeroSectionProps {
  isEn: boolean;
  locale: string;
}

export default function HeroSection({ isEn, locale }: HeroSectionProps) {
  const router = useRouter();

  const goRegister = () => router.push('/register');
  const goCommunity = () => router.push(`/${locale}/community`);

  return (
    <header className="landing-hero-v2" id="top">
      <div className="hero-grid-bg" aria-hidden="true" />
      <div className="hero-glow-v2" aria-hidden="true" />

      <div className="hero-container">
        {/* Left / Hero Content */}
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            <span>{isEn ? 'SMART TRADING JOURNAL' : 'ژورنال معاملاتی هوشمند'}</span>
          </div>

          <h1 className="hero-headline">
            {isEn ? (
              <>
                Trade better by learning from <span className="highlight-green">every trade.</span>
              </>
            ) : (
              <>
                با یادگیری از هر معامله، <span className="highlight-green">بهتر معامله کنید.</span>
              </>
            )}
          </h1>

          <p className="hero-subtext">
            {isEn
              ? 'Record. Review. Analyze. Improve. TradeKav helps you turn every trade into data and every lesson into progress.'
              : 'ثبت کنید. بررسی کنید. تحلیل کنید. بهبود بیابید. تریدکاو به شما کمک می‌کند هر معامله را به داده و هر درس را به پیشرفت تبدیل کنید.'}
          </p>

          <div className="hero-cta-group">
            <button className="btn-primary lg hero-btn-main" onClick={goRegister}>
              <span>{isEn ? 'Start Journaling Free' : 'شروع رایگان ژورنال'}</span>
              <span className="material-symbols-outlined">{isEn ? 'arrow_forward' : 'arrow_back'}</span>
            </button>

            <button className="btn-ghost lg hero-btn-sec" onClick={goCommunity}>
              <span>{isEn ? 'Explore Community' : 'مشاهده انجمن'}</span>
            </button>
          </div>

          <div className="hero-trust-features">
            <span className="trust-pill">
              <span className="material-symbols-outlined">lock</span>
              {isEn ? 'Private by default' : 'حفظ حریم خصوصی'}
            </span>
            <span className="trust-pill">
              <span className="material-symbols-outlined">analytics</span>
              {isEn ? 'Advanced analytics' : 'تحلیل‌های پیشرفته'}
            </span>
            <span className="trust-pill">
              <span className="material-symbols-outlined">bolt</span>
              {isEn ? 'Built for traders' : 'ساخته‌شده برای معامله‌گران'}
            </span>
          </div>
        </div>

        {/* Right / Large Trade Review Mockup UI */}
        <div className="hero-visual">
          <div className="hero-mockup-card-v3">
            {/* Top Bar Header */}
            <div className="mockup-v3-topbar">
              <div className="symbol-info-box">
                <h3 className="symbol-title">
                  {isEn ? 'XAUUSD - TRADE REVIEW JOURNAL' : 'XAUUSD - ژورنال بررسی معامله'}
                </h3>
                <span className="status-badge-reviewed">
                  {isEn ? 'PROFITABLE (REVIEWED)' : 'سودده (بررسی‌شده)'}
                </span>
              </div>
              <div className="pnl-glow-display">
                {isEn ? '+2.4R ( +265 USD )' : '+۲.۴R ( +۲۶۵ دلار )'}
              </div>
            </div>

            <div className="mockup-v3-subdate">
              {isEn ? 'Mar 12, 2024 • 14:35, BTC AMTC+' : '۱۲ اسفند ۱۴۰۲ • ۱۴:۳۵، سشن نیویورک'}
            </div>

            {/* 4 Stat KPI Cards Grid */}
            <div className="mockup-v3-stats-grid">
              {/* Stat 1 */}
              <div className="stat-kpi-card">
                <div className="stat-kpi-header">
                  <div className="stat-icon-circle">
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <span className="stat-kpi-label">{isEn ? 'Risk-Reward' : 'ریسک به ریوارد'}</span>
                </div>
                <div className="stat-kpi-value">
                  {isEn ? '(Planned: 1:3, Actual: 1:2.4)' : '(برنامه: ۱:۳، واقعی: ۱:۲.۴)'}
                </div>
              </div>

              {/* Stat 2 */}
              <div className="stat-kpi-card">
                <div className="stat-kpi-header">
                  <div className="stat-icon-circle">
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <span className="stat-kpi-label">{isEn ? 'Trade Duration' : 'مدت زمان معامله'}</span>
                </div>
                <div className="stat-kpi-value">
                  {isEn ? '4h 15m' : '۴ ساعت و ۱۵ دقیقه'}
                </div>
              </div>

              {/* Stat 3 */}
              <div className="stat-kpi-card">
                <div className="stat-kpi-header">
                  <div className="stat-icon-circle">
                    <span className="material-symbols-outlined">arrow_outward</span>
                  </div>
                  <span className="stat-kpi-label">{isEn ? 'Profit Factor' : 'ضریب سود'}</span>
                </div>
                <div className="stat-kpi-value">
                  {isEn ? '1.9' : '۱.۹'}
                </div>
              </div>

              {/* Stat 4 */}
              <div className="stat-kpi-card">
                <div className="stat-kpi-header">
                  <div className="stat-icon-circle">
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                  <span className="stat-kpi-label">{isEn ? 'Discipline Score' : 'امتیاز انضباط'}</span>
                </div>
                <div className="stat-kpi-score-row">
                  <span className="score-val">{isEn ? '95%' : '۹۵٪'}</span>
                  <span className="score-badge-pill green">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>{isEn ? 'High' : 'عالی'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Authentic TradingView Chart Component */}
            <HeroChartMock isEn={isEn} />

            {/* Bottom 2-Column Section */}
            <div className="mockup-v3-bottom-grid">
              {/* Left Column: User Notes & AI Observation */}
              <div className="v3-notes-column">
                {/* User Review & Notes */}
                <div className="notes-block">
                  <h4 className="block-title">
                    {isEn ? 'User Review & Notes' : 'ارزیابی و یادداشت‌های معامله‌گر'}
                  </h4>
                  <p className="notes-text">
                    {isEn
                      ? 'Entry was precise on M15 re-test. Managed emotions well. Exited manually just before HTF resistance to lock in gains.'
                      : 'ورود در بازآزمایی M15 بسیار دقیق بود. مدیریت هیجانات عالی انجام شد. خروج دستی درست قبل از مقاومت تایم بالا برای تثبیت سود.'}
                  </p>
                  <div className="tag-row">
                    <span className="discipline-chip">
                      {isEn ? 'Discipline Tag: PATIENT' : 'تگ انضباط: صبورانه'}
                    </span>
                  </div>
                </div>

                {/* AI Observation */}
                <div className="notes-block ai-block">
                  <h4 className="block-title ai-title">
                    <span className="material-symbols-outlined ai-ic">auto_awesome</span>
                    <span>{isEn ? 'AI Observation' : 'تحلیل هوشمند AI'}</span>
                  </h4>
                  <p className="notes-text">
                    {isEn
                      ? 'Observation: Early exit reduced max potential profit from planned 3.1R. Check future trades for premature exits near HTF areas.'
                      : 'مشاهده: خروج زودهنگام حداکثر سود پتانسیل را از ۳.۱R کاهش داد. در معاملات بعدی خروج‌های قبل از موعد نزدیک مناطق تایم بالا را کنترل کنید.'}
                  </p>
                </div>

                {/* Strategy tags at bottom left */}
                <div className="strategy-tags-strip">
                  <span className="lbl">{isEn ? 'Strategy:' : 'استراتژی:'}</span>
                  <span className="strat-tag">{isEn ? 'Liquidity Sweep' : 'جمع‌آوری نقدینگی'}</span>
                  <span className="strat-tag">{isEn ? 'Gold' : 'طلا'}</span>
                  <span className="strat-tag">{isEn ? 'Scalp' : 'اسکالپ'}</span>
                  <span className="strat-tag">{isEn ? 'Trend Reversal' : 'بازگشت روند'}</span>
                </div>
              </div>

              {/* Right Column: Highlighted Key Learning Point Card */}
              <div className="v3-learning-column">
                <div className="key-learning-card">
                  <div className="card-top-header">
                    <div className="header-left">
                      <span className="material-symbols-outlined bulb-ic">lightbulb</span>
                      <span className="learning-title">
                        {isEn ? 'KEY LEARNING POINT' : 'نکته کلیدی آموزنده'}
                      </span>
                    </div>
                    <span className="lesson-badge">
                      {isEn ? 'LESSON LEARNED' : 'درس آموخته‌شده'}
                    </span>
                  </div>

                  <div className="quote-box">
                    <p className="quote-text">
                      {isEn ? (
                        <>› Trade better by learning from every trade.</>
                      ) : (
                        <>› با یادگیری از هر معامله، بهتر معامله کنید.</>
                      )}
                    </p>
                  </div>

                  <div className="actionable-advice-box">
                    <p className="advice-text">
                      <strong>{isEn ? 'Actionable Advice:' : 'توصیه عملی:'}</strong>{' '}
                      {isEn
                        ? 'Next time, consider scaling out half positions to capture more HTF movement, or trust the predefined profit target.'
                        : 'دفعه بعد، خروج پله‌ای را برای ثبت حرکت‌های بزرگ‌تر تایم‌فریم بالا در نظر بگیرید یا به حد سود اولیه وفادار بمانید.'}
                    </p>
                  </div>
                </div>

                {/* Bottom Right Action Buttons */}
                <div className="v3-actions-row">
                  <button className="btn-v3-sec">{isEn ? 'Detailed Analysis' : 'تحلیل جزئیات'}</button>
                  <button className="btn-v3-main" onClick={goRegister}>
                    {isEn ? 'Go to Full Journal' : 'ورود به ژورنال اصلی'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
