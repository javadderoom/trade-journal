'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface FinalCtaSectionProps {
  isEn: boolean;
}

export default function FinalCtaSection({ isEn }: FinalCtaSectionProps) {
  const router = useRouter();

  const goRegister = () => router.push('/register');

  return (
    <section className="landing-final-cta-section">
      <div className="section-container">
        <div className="final-cta-card">
          <div className="cta-glow" aria-hidden="true" />
          <h2 className="final-cta-title">
            {isEn
              ? 'Start your journey to better trading today.'
              : 'از همین امروز مسیر تبدیل به معامله‌گر برتر را آغاز کنید.'}
          </h2>
          <p className="final-cta-sub">
            {isEn
              ? 'Join thousands of traders who turn every execution into data and lessons into progress.'
              : 'به هزاران معامله‌گری بپیوندید که معاملات خود را به داده و درس‌هایشان را به پیشرفت تبدیل می‌کنند.'}
          </p>

          <div className="final-cta-btn-group">
            <button className="btn-primary lg" onClick={goRegister}>
              <span>{isEn ? 'Start Journaling Free' : 'همین حالا رایگان شروع کنید'}</span>
              <span className="material-symbols-outlined">{isEn ? 'arrow_forward' : 'arrow_back'}</span>
            </button>
          </div>

          <div className="final-cta-note">
            <span className="material-symbols-outlined">verified</span>
            <span>{isEn ? 'No credit card required • Setup in under 30 seconds' : 'بدون نیاز به کارت اعتباری • راه‌اندازی زیر ۳۰ ثانیه'}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
