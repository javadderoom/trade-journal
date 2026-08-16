'use client';

import React from 'react';

interface Plan {
  name: string;
  price: string;
  unit: string;
  note: string;
  features: string[];
  cta: string;
  featured: boolean;
}

interface PricingSectionProps {
  isEn: boolean;
  plans: Plan[];
  onSelectPlan: (planName: string) => void;
}

export default function PricingSection({ isEn, plans, onSelectPlan }: PricingSectionProps) {
  return (
    <section className="landing-pricing-section" id="pricing">
      <div className="section-container">
        <div className="pricing-head">
          <span className="section-label-chip green">{isEn ? 'TRANSPARENT PRICING' : 'تعرفه‌های شفاف'}</span>
          <h2 className="pricing-title">
            {isEn ? 'Flexible Plans for Every Trader' : 'تعرفه‌ مناسب برای هر سطح معامله‌گر'}
          </h2>
          <p className="pricing-sub">
            {isEn
              ? 'Start 100% free. Upgrade as your trading capital and accounts grow.'
              : 'کاملاً رایگان شروع کنید و همراه با رشد حساب معاملاتی خود ارتقا دهید.'}
          </p>
        </div>

        <div className="pricing-cards-grid">
          {plans.map((pl, idx) => (
            <div key={idx} className={`pricing-card ${pl.featured ? 'featured' : ''}`}>
              {pl.featured && (
                <div className="featured-badge">
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <span>{isEn ? 'MOST POPULAR' : 'محبوب‌ترین'}</span>
                </div>
              )}
              <h3 className="plan-name">{pl.name}</h3>
              <div className="plan-price-row">
                <span className="price-val font-mono">{pl.price}</span>
                <span className="price-unit">{pl.unit}</span>
              </div>
              <p className="plan-note">{pl.note}</p>

              <div className="plan-divider" />

              <ul className="plan-features">
                {pl.features.map((ft, fIdx) => (
                  <li key={fIdx}>
                    <span className="material-symbols-outlined check-ic">check_circle</span>
                    <span>{ft}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`btn-plan ${pl.featured ? 'btn-primary' : 'btn-ghost'} full`}
                onClick={() => onSelectPlan(pl.name)}
              >
                {pl.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
