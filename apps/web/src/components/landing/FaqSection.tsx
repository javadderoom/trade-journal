'use client';

import React, { useState } from 'react';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqSectionProps {
  isEn: boolean;
  faqs: FaqItem[];
}

export default function FaqSection({ isEn, faqs }: FaqSectionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIdx((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className="landing-faq-section">
      <div className="section-container">
        <div className="faq-head">
          <span className="section-label-chip blue">{isEn ? 'FREQUENTLY ASKED QUESTIONS' : 'سوالات متداول'}</span>
          <h2 className="faq-title">
            {isEn ? 'Got questions? We have answers.' : 'سوالاتی دارید؟ پاسخ شما اینجاست.'}
          </h2>
        </div>

        <div className="faq-accordion-list">
          {faqs.map((f, idx) => (
            <div key={idx} className={`faq-item ${openIdx === idx ? 'open' : ''}`}>
              <button className="faq-question-btn" onClick={() => toggleFaq(idx)}>
                <span>{f.q}</span>
                <span className="material-symbols-outlined expand-icon">
                  {openIdx === idx ? 'remove' : 'add'}
                </span>
              </button>
              {openIdx === idx && (
                <div className="faq-answer-body">
                  <p>{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
