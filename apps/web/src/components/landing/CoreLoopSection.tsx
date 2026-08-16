'use client';

import React, { useState } from 'react';

interface CoreLoopSectionProps {
  isEn: boolean;
}

export default function CoreLoopSection({ isEn }: CoreLoopSectionProps) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = isEn
    ? [
        {
          num: '1',
          key: 'ANALYZE',
          title: 'Analyze',
          desc: 'Find high-probability setups with clarity before entering the market.',
          icon: 'search',
        },
        {
          num: '2',
          key: 'TRADE',
          title: 'Trade',
          desc: 'Execute your plan with strict risk parameters and confidence.',
          icon: 'show_chart',
        },
        {
          num: '3',
          key: 'REVIEW',
          title: 'Review',
          desc: 'Document execution details, screenshot markups, and emotional state.',
          icon: 'assignment',
        },
        {
          num: '4',
          key: 'LEARN',
          title: 'Learn',
          desc: 'Identify destructive habits, reinforce winning setups, and refine your edge.',
          icon: 'psychology',
        },
      ]
    : [
        {
          num: '۱',
          key: 'ANALYZE',
          title: 'تحلیل',
          desc: 'شناسایی موقعیت‌های معاملاتی با احتمال برد بالا قبل از ورود به بازار.',
          icon: 'search',
        },
        {
          num: '۲',
          key: 'TRADE',
          title: 'معامله',
          desc: 'اجرای دقیق استراتژی با رعایت مدیریت ریسک و انضباط کامل.',
          icon: 'show_chart',
        },
        {
          num: '۳',
          key: 'REVIEW',
          title: 'بررسی',
          desc: 'ثبت تمام جزئیات معامله، تصاویر نمودار و وضعیت روانی حین معامله.',
          icon: 'assignment',
        },
        {
          num: '۴',
          key: 'LEARN',
          title: 'یادگیری',
          desc: 'کشف الگوهای سودده، حذف اشتباهات مکرر و تقویت برتری معاملاتی.',
          icon: 'psychology',
        },
      ];

  return (
    <section className="landing-core-loop" id="how">
      <div className="section-container">
        <div className="loop-head">
          <span className="section-label-chip green">{isEn ? 'HOW IT WORKS' : 'نحوه کار'}</span>
          <h2 className="loop-title">
            {isEn ? 'A complete loop for your growth' : 'یک چرخه کامل برای رشد معاملاتی شما'}
          </h2>
          <p className="loop-sub">
            {isEn
              ? 'Consistency comes from an unbroken feedback loop. Turn past executions into future profits.'
              : 'ثبات در معامله‌گری از یک چرخه بازخورد منظم به دست می‌آید.'}
          </p>
        </div>

        <div className="loop-interactive-wrapper">
          {/* Steps List on the Left */}
          <div className="loop-steps-list">
            {steps.map((st, i) => (
              <div
                key={i}
                className={`loop-step-item ${activeStep === i ? 'active' : ''}`}
                onClick={() => setActiveStep(i)}
              >
                <div className="step-num-circle">{st.num}</div>
                <div className="step-text">
                  <div className="step-title-row">
                    <span className="material-symbols-outlined step-ic">{st.icon}</span>
                    <h3 className="step-title">{st.title}</h3>
                  </div>
                  <p className="step-desc">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Circular Diagram on the Right */}
          <div className="loop-diagram-container">
            <div className="loop-circle-outer">
              <svg className="loop-svg" viewBox="0 0 360 360">
                <circle cx="180" cy="180" r="140" fill="none" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="2" />
                <circle
                  cx="180"
                  cy="180"
                  r="140"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray="160 60"
                  strokeLinecap="round"
                  className="loop-rotating-ring"
                />
              </svg>

              {/* Node 1: Top (ANALYZE) */}
              <div
                className={`loop-node node-top ${activeStep === 0 ? 'active' : ''}`}
                onClick={() => setActiveStep(0)}
              >
                <div className="node-icon-box">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <span className="node-label">{isEn ? 'ANALYZE' : 'تحلیل'}</span>
              </div>

              {/* Node 2: Right (TRADE) */}
              <div
                className={`loop-node node-right ${activeStep === 1 ? 'active' : ''}`}
                onClick={() => setActiveStep(1)}
              >
                <div className="node-icon-box">
                  <span className="material-symbols-outlined">show_chart</span>
                </div>
                <span className="node-label">{isEn ? 'TRADE' : 'معامله'}</span>
              </div>

              {/* Node 3: Bottom (REVIEW) */}
              <div
                className={`loop-node node-bottom ${activeStep === 2 ? 'active' : ''}`}
                onClick={() => setActiveStep(2)}
              >
                <div className="node-icon-box">
                  <span className="material-symbols-outlined">assignment</span>
                </div>
                <span className="node-label">{isEn ? 'REVIEW' : 'بررسی'}</span>
              </div>

              {/* Node 4: Left (LEARN) */}
              <div
                className={`loop-node node-left ${activeStep === 3 ? 'active' : ''}`}
                onClick={() => setActiveStep(3)}
              >
                <div className="node-icon-box">
                  <span className="material-symbols-outlined">psychology</span>
                </div>
                <span className="node-label">{isEn ? 'LEARN' : 'یادگیری'}</span>
              </div>

              {/* Center Core */}
              <div className="loop-center-core">
                <span className="core-tag">{isEn ? 'Continuous Progress' : 'پیشرفت مستمر'}</span>
                <span className="core-title">{isEn ? 'Better Decisions' : 'تصمیمات بهتر'}</span>
                <span className="core-sub">
                  {isEn ? 'Better results come from better decisions.' : 'نتایج بهتر از تصمیمات بهتر حاصل می‌شوند.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
