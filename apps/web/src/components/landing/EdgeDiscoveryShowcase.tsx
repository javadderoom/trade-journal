'use client';

import React from 'react';

interface EdgeDiscoveryShowcaseProps {
  isEn: boolean;
}

export default function EdgeDiscoveryShowcase({ isEn }: EdgeDiscoveryShowcaseProps) {
  const edges = isEn
    ? [
        {
          tag: 'BEST SESSION',
          title: 'London Session Open',
          desc: 'Your highest win rate (76%) occurs during the first 2 hours of London session.',
          metric: '76% Win Rate',
          icon: 'schedule',
        },
        {
          tag: 'TOP SETUP',
          title: 'Liquidity Sweep + MSS',
          desc: 'This setup yields a 3.1 Profit Factor with an average return of +2.4R per trade.',
          metric: 'PF: 3.1',
          icon: 'star',
        },
        {
          tag: 'OPTIMAL TIMEFRAME',
          title: 'H1 Analysis / M15 Entry',
          desc: 'Combining H1 structure with M15 entry produces your cleanest risk-reward setups.',
          metric: 'Avg R:R 1:2.8',
          icon: 'layers',
        },
        {
          tag: 'BEHAVIORAL WARNING',
          title: 'Friday Overtrading Alert',
          desc: 'Trading after 18:00 on Fridays reduces your monthly profit by 22%.',
          metric: '-22% Impact',
          icon: 'warning',
          isWarning: true,
        },
      ]
    : [
        {
          tag: 'بهترین سشن',
          title: 'شروع سشن لندن',
          desc: 'بالاترین وین‌ریت شما (۷۶٪) در ۲ ساعت اول سشن لندن رخ می‌دهد.',
          metric: '۷۶٪ وین‌ریت',
          icon: 'schedule',
        },
        {
          tag: 'بهترین استراتژی',
          title: 'Liquidity Sweep + MSS',
          desc: 'این استراتژی ضریب سود ۳.۱ با میانگین سود +۲.۴R ایجاد می‌کند.',
          metric: 'ضریب سود: ۳.۱',
          icon: 'star',
        },
        {
          tag: 'تایم‌فریم بهینه',
          title: 'تحلیل H1 / ورود M15',
          desc: 'ترکیب ساختار H1 با ورود M15 تمیزترین ریسک به ریوارد را می‌سازد.',
          metric: 'میانگین R:R ۱:۲.۸',
          icon: 'layers',
        },
        {
          tag: 'هشدار رفتاری',
          title: 'معامله در ساعات پایانی جمعه',
          desc: 'معامله بعد از ساعت ۱۸:۰۰ جمعه سود ماهانه شما را ۲۲٪ کاهش می‌دهد.',
          metric: '۲۲٪ افت سود',
          icon: 'warning',
          isWarning: true,
        },
      ];

  return (
    <section className="landing-edge-section">
      <div className="section-container">
        <div className="edge-head">
          <span className="section-label-chip purple">{isEn ? 'EDGE DISCOVERY' : 'کشف برتری'}</span>
          <h2 className="edge-title">
            {isEn ? 'Discover Your Mathematical Edge' : 'برتری ریاضی و معاملاتی خود را کشف کنید'}
          </h2>
          <p className="edge-sub">
            {isEn
              ? 'Our engine analyzes your trade history to uncover exactly when you make money and when you lose it.'
              : 'موتور تحلیلی تریدکاو تاریخچه معاملات شما را بررسی کرده و دقیقا مشخص می‌کند چه زمانی بیشترین سود را می‌سازید.'}
          </p>
        </div>

        <div className="edge-cards-grid">
          {edges.map((ed, idx) => (
            <div key={idx} className={`edge-card ${ed.isWarning ? 'warning' : ''}`}>
              <div className="edge-card-top">
                <span className={`edge-tag-pill ${ed.isWarning ? 'red' : 'green'}`}>{ed.tag}</span>
                <span className="material-symbols-outlined edge-icon">{ed.icon}</span>
              </div>
              <h3 className="edge-card-title">{ed.title}</h3>
              <p className="edge-card-desc">{ed.desc}</p>
              <div className="edge-metric-box font-mono">{ed.metric}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
