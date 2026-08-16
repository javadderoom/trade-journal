'use client';

import React from 'react';

interface AnalyticsShowcaseProps {
  isEn: boolean;
}

export default function AnalyticsShowcase({ isEn }: AnalyticsShowcaseProps) {
  return (
    <section className="landing-analytics-section">
      <div className="section-container">
        <div className="analytics-head">
          <span className="section-label-chip blue">{isEn ? 'ADVANCED ANALYTICS' : 'تحلیل‌های پیشرفته'}</span>
          <h2 className="analytics-title">
            {isEn ? 'What does your trading actually look like?' : 'عملکرد واقعی معاملاتی شما چگونه است؟'}
          </h2>
          <p className="analytics-sub">
            {isEn
              ? 'Uncover hidden statistical edges. Track cumulative growth, drawdown metrics, daily heatmaps, and win ratios.'
              : 'الگوهای پنهان معاملاتی، منحنی سرمایه، میزان افت سرمایه و تقویم سود و زیان روزانه را شفاف ببینید.'}
          </p>
        </div>

        <div className="analytics-grid">
          {/* Main Chart Box */}
          <div className="analytics-card curve-card">
            <div className="card-top-row">
              <div>
                <h3 className="card-title">{isEn ? 'Cumulative Equity Curve' : 'منحنی سرمایه تجمعی'}</h3>
                <span className="card-sub">{isEn ? 'Net Return: +42.8% (3 Months)' : 'بازده کل: +۴۲.۸٪ (۳ ماه گذشته)'}</span>
              </div>
              <span className="pnl-pill positive">+42.8%</span>
            </div>

            <div className="chart-preview-box">
              <svg viewBox="0 0 500 180" preserveAspectRatio="none" className="curve-svg">
                <defs>
                  <linearGradient id="eqGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(16, 185, 129, 0.4)" />
                    <stop offset="100%" stopColor="rgba(16, 185, 129, 0.0)" />
                  </linearGradient>
                </defs>
                <path
                  d="M 10 150 L 50 140 L 90 145 L 130 110 L 170 120 L 210 90 L 250 95 L 290 60 L 330 75 L 370 40 L 410 50 L 450 25 L 490 20"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                />
                <path
                  d="M 10 150 L 50 140 L 90 145 L 130 110 L 170 120 L 210 90 L 250 95 L 290 60 L 330 75 L 370 40 L 410 50 L 450 25 L 490 20 L 490 180 L 10 180 Z"
                  fill="url(#eqGlow)"
                />
              </svg>
            </div>
          </div>

          {/* Win Rate Donut & Stats */}
          <div className="analytics-card stat-donut-card">
            <h3 className="card-title">{isEn ? 'Win Rate & Risk Metrics' : 'نرخ موفقیت و ضریب سود'}</h3>
            <div className="donut-flex">
              <div className="donut-graphic">
                <svg viewBox="0 0 100 100" className="donut-svg">
                  <circle cx="50" cy="50" r="40" stroke="#1f293d" strokeWidth="12" fill="none" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#10b981"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray="170 80"
                    strokeDashoffset="25"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="donut-center-text">
                  <span className="rate-val font-mono">68%</span>
                  <span className="rate-lbl">{isEn ? 'Win Rate' : 'وین‌ریت'}</span>
                </div>
              </div>

              <div className="stat-side-list">
                <div className="side-stat">
                  <span className="lbl">{isEn ? 'Profit Factor' : 'ضریب سود'}</span>
                  <span className="val text-green">2.34</span>
                </div>
                <div className="side-stat">
                  <span className="lbl">{isEn ? 'Avg MAE (Max Drawdown)' : 'میانگین افت (MAE)'}</span>
                  <span className="val text-red">-0.45R</span>
                </div>
                <div className="side-stat">
                  <span className="lbl">{isEn ? 'Avg MFE (Peak Profit)' : 'میانگین اوج سود (MFE)'}</span>
                  <span className="val text-green">+2.85R</span>
                </div>
                <div className="side-stat">
                  <span className="lbl">{isEn ? 'Avg Exit Efficiency' : 'میانگین کارایی خروج'}</span>
                  <span className="val text-blue">82%</span>
                </div>
                <div className="side-stat">
                  <span className="lbl">{isEn ? 'Max Drawdown' : 'حداکثر افت سرمایه'}</span>
                  <span className="val text-red">-4.2%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Calendar Heatmap */}
          <div className="analytics-card calendar-card">
            <h3 className="card-title">{isEn ? 'Trading Calendar Heatmap' : 'تقویم معاملاتی'}</h3>
            <p className="card-sub">{isEn ? 'Daily profit & loss visual overview' : 'نمای روزانه سود و زیان'}</p>
            <div className="heatmap-grid">
              {(isEn
                ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
                : ['دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']
              ).map((d, i) => (
                <span key={i} className="day-head">{d}</span>
              ))}
              <div className="heat-cell pos" dir="ltr">{isEn ? '+2.4R' : '+۲.۴R'}</div>
              <div className="heat-cell pos" dir="ltr">{isEn ? '+1.1R' : '+۱.۱R'}</div>
              <div className="heat-cell neg" dir="ltr">{isEn ? '-0.8R' : '-۰.۸R'}</div>
              <div className="heat-cell pos" dir="ltr">{isEn ? '+3.2R' : '+۳.۲R'}</div>
              <div className="heat-cell zero" dir="ltr">{isEn ? '0.0R' : '۰.۰R'}</div>
              <div className="heat-cell pos" dir="ltr">{isEn ? '+1.5R' : '+۱.۵R'}</div>
              <div className="heat-cell pos" dir="ltr">{isEn ? '+2.0R' : '+۲.۰R'}</div>
              <div className="heat-cell pos" dir="ltr">{isEn ? '+0.9R' : '+۰.۹R'}</div>
              <div className="heat-cell neg" dir="ltr">{isEn ? '-1.0R' : '-۱.۰R'}</div>
              <div className="heat-cell pos" dir="ltr">{isEn ? '+1.8R' : '+۱.۸R'}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
