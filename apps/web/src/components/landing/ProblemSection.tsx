'use client';

import React from 'react';

interface ProblemSectionProps {
  isEn: boolean;
}

export default function ProblemSection({ isEn }: ProblemSectionProps) {
  const painPoints = isEn
    ? [
        {
          icon: 'psychology_alt',
          title: 'Overtrading',
          body: 'Emotions take over and the plan goes out the window.',
          accent: 'danger',
        },
        {
          icon: 'tune',
          title: 'Inconsistent Execution',
          body: 'Your execution today is not the same as yesterday.',
          accent: 'warning',
        },
        {
          icon: 'history_toggle_off',
          title: 'No Feedback Loop',
          body: 'You forget trades and repeat the same mistakes.',
          accent: 'purple',
        },
      ]
    : [
        {
          icon: 'psychology_alt',
          title: 'معامله بیش از حد',
          body: 'هیجانات کنترل را دست می‌گیرند و پلن معاملاتی فراموش می‌شود.',
          accent: 'danger',
        },
        {
          icon: 'tune',
          title: 'اجرای نامتوازن',
          body: 'کیفیت و نحوه اجرای امروز شما با دیروز یکسان نیست.',
          accent: 'warning',
        },
        {
          icon: 'history_toggle_off',
          title: 'نبود چرخه بازخورد',
          body: 'معاملات گذشته را فراموش می‌کنید و اشتباهات قبلی را تکرار می‌کنید.',
          accent: 'purple',
        },
      ];

  return (
    <section className="landing-problem-v2">
      <div className="section-container">
        <div className="problem-head">
          <span className="section-label-chip danger">{isEn ? 'THE PROBLEM' : 'چالش اصلی'}</span>
          <h2 className="problem-title">
            {isEn ? 'Trading is hard. Getting better is harder.' : 'معامله‌گری سخت است. بهتر شدن سخت‌تر است.'}
          </h2>
          <p className="problem-sub">
            {isEn
              ? 'Most traders struggle with the same challenges — TradeKav is built to solve them.'
              : 'اکثر معامله‌گران با چالش‌های ریشه‌ای سردرگمی دست‌وپنجه نرم می‌کنند — تریدکاو برای ساخت نظم طراحی شده است.'}
          </p>
        </div>

        <div className="pain-cards-grid">
          {painPoints.map((pt, idx) => (
            <div key={idx} className={`pain-card-v2 accent-${pt.accent}`}>
              <div className="pain-icon-wrapper">
                <span className="material-symbols-outlined">{pt.icon}</span>
              </div>
              <h3 className="pain-card-title">{pt.title}</h3>
              <p className="pain-card-body">{pt.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
