'use client';

import React, { useState } from 'react';

interface TradeReviewShowcaseProps {
  isEn: boolean;
}

export default function TradeReviewShowcase({ isEn }: TradeReviewShowcaseProps) {
  const [activeTab, setActiveTab] = useState<'chart' | 'execution' | 'notes' | 'review' | 'lesson'>('review');

  const steps = isEn
    ? [
        { id: 'chart', label: '1. Chart Markup', icon: 'image' },
        { id: 'execution', label: '2. Execution Details', icon: 'list_alt' },
        { id: 'notes', label: '3. Pre-Trade Notes', icon: 'edit_note' },
        { id: 'review', label: '4. Trade Review', icon: 'rate_review' },
        { id: 'lesson', label: '5. Key Lesson', icon: 'psychology' },
      ]
    : [
        { id: 'chart', label: '۱. علامت‌گذاری نمودار', icon: 'image' },
        { id: 'execution', label: '۲. جزئیات اجرای معامله', icon: 'list_alt' },
        { id: 'notes', label: '۳. یادداشت‌های قبل ورود', icon: 'edit_note' },
        { id: 'review', label: '۴. ارزیابی و مرور', icon: 'rate_review' },
        { id: 'lesson', label: '۵. درس گرفته‌شده', icon: 'psychology' },
      ];

  return (
    <section className="landing-trade-review-section">
      <div className="section-container">
        <div className="review-head">
          <span className="section-label-chip gold">{isEn ? 'THE TRADE REVIEW EXPERIENCE' : 'تجربه مرور معامله'}</span>
          <h2 className="review-title">
            {isEn ? 'Master every execution with structured Trade Reviews' : 'بررسی عمیق و ساختاریافته هر معامله'}
          </h2>
          <p className="review-sub">
            {isEn
              ? 'Go beyond raw numbers. Transform every winning or losing trade into structured experience.'
              : 'فراتر از اعداد خامی مانند سود و زیان برويد. هر معامله را به یک کلاس درس عمیق تبدیل کنید.'}
          </p>
        </div>

        {/* Pipeline Navigation */}
        <div className="review-pipeline-nav">
          {steps.map((st) => (
            <button
              key={st.id}
              className={`pipeline-btn ${activeTab === st.id ? 'active' : ''}`}
              onClick={() => setActiveTab(st.id as any)}
            >
              <span className="material-symbols-outlined">{st.icon}</span>
              <span>{st.label}</span>
            </button>
          ))}
        </div>

        {/* Deep Review Card Container */}
        <div className="review-card-container">
          {/* Active Tab View Content */}
          <div className="review-content-card">
            {activeTab === 'chart' && (
              <div className="tab-pane-view">
                <div className="pane-header">
                  <h3>{isEn ? 'Chart Annotations & Multi-Timeframe Screenshots' : 'علامت‌گذاری نمودار و تایم‌فریم‌های مختلف'}</h3>
                  <span className="chip-tag">XAUUSD Long</span>
                </div>
                <div className="pane-chart-demo">
                  <div className="demo-chart-box">
                    <div className="demo-annotation top">{isEn ? 'H1 Liquidity Pool Swept' : 'جمع‌آوری نقدینگی H1'}</div>
                    <div className="demo-annotation entry">{isEn ? 'M15 Market Structure Shift (MSS)' : 'تغییر ساختار M15'}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'execution' && (
              <div className="tab-pane-view">
                <div className="pane-header">
                  <h3>{isEn ? 'Precision Execution Breakdown' : 'شکست جزئیات دقیق اجرا'}</h3>
                </div>
                <div className="execution-grid-details">
                  <div className="exec-box">
                    <span className="lbl">{isEn ? 'Entry Price' : 'قیمت ورود'}</span>
                    <span className="val font-mono">2154.20</span>
                  </div>
                  <div className="exec-box">
                    <span className="lbl">{isEn ? 'Exit Price' : 'قیمت خروج'}</span>
                    <span className="val font-mono">2175.50</span>
                  </div>
                  <div className="exec-box">
                    <span className="lbl">{isEn ? 'Position Size' : 'حجم معامله'}</span>
                    <span className="val font-mono">1.20 Lots</span>
                  </div>
                  <div className="exec-box">
                    <span className="lbl">{isEn ? 'Duration' : 'مدت زمان'}</span>
                    <span className="val font-mono">2h 14m</span>
                  </div>
                  <div className="exec-box">
                    <span className="lbl">{isEn ? 'Slippage' : 'اسلیپیج'}</span>
                    <span className="val font-mono text-green">0.2 pips</span>
                  </div>
                  <div className="exec-box">
                    <span className="lbl">{isEn ? 'Planned R:R' : 'ریسک به ریوارد برنامه'}</span>
                    <span className="val font-mono">1 : 2.5</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="tab-pane-view">
                <div className="pane-header">
                  <h3>{isEn ? 'Pre-Trade Analysis & Rationale' : 'تحلیل و دلایل ورود قبل از معامله'}</h3>
                </div>
                <div className="notes-box-demo">
                  <p>
                    {isEn
                      ? '"Price swept Asian session high at 2152.00, forming a clear liquidity grab. H1 remains bullish above 2140 level. Waiting for M15 displacement to enter."'
                      : '"قیمت نقدینگی سشن آسیا در ۲۱۵۲.۰۰ را جمع کرد. روند اصلی H1 صعودی است. منتظر تایید ورود در M15."'}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'review' && (
              <div className="tab-pane-view">
                <div className="pane-header">
                  <h3>{isEn ? 'Self-Assessment & Emotion Journal' : 'خودارزیابی و ژورنال احساسات'}</h3>
                </div>
                <div className="review-questions-list">
                  <div className="q-item">
                    <span className="q-title">{isEn ? 'Did you follow your trading plan?' : 'آیا دقیقاً طبق پلن عمل کردید؟'}</span>
                    <span className="ans-tag yes">
                      <span className="material-symbols-outlined">check_circle</span>
                      {isEn ? 'Yes (100%)' : 'بله (۱۰۰٪)'}
                    </span>
                  </div>
                  <div className="q-item">
                    <span className="q-title">{isEn ? 'Mindset during entry:' : 'حالت روحی موقع ورود:'}</span>
                    <span className="ans-tag calm">
                      <span className="material-symbols-outlined">mood</span>
                      {isEn ? 'Calm & Patient' : 'آرام و صبور'}
                    </span>
                  </div>
                  <div className="q-item">
                    <span className="q-title">{isEn ? 'Execution Score:' : 'امتیاز اجرای معامله:'}</span>
                    <span className="ans-tag score">9.5 / 10</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'lesson' && (
              <div className="tab-pane-view">
                <div className="pane-header">
                  <h3>{isEn ? 'Extracted Rule / Key Takeaway' : 'دستآورد و قانون استخراج‌شده'}</h3>
                </div>
                <div className="lesson-highlight-box">
                  <span className="material-symbols-outlined lesson-icon">lightbulb</span>
                  <div className="lesson-text">
                    <strong>{isEn ? 'Key Rule Added to Playbook:' : 'قانون اضافه شده به دفترچه معامله:'}</strong>
                    <p>
                      {isEn
                        ? '"Liquidity sweeps during NY session open have a 78% win rate when aligned with H1 market structure."'
                        : '"جمع‌آوری نقدینگی در ابتدای سشن نیویورک زمانی که هم‌جهت با ساختار H1 باشد، وین‌ریت بالای ۷۵٪ دارد."'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
