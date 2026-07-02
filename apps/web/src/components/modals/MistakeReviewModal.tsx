'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { notify } from '../../lib/notify';
import './mistake-review-modal.scss';

export interface SuggestedMistake {
  ruleKey: string;
  label: string;
  reason: string;
  costUsd: number;
}

interface MistakeStat {
  ruleKey: string;
  label: string;
  count: number;
  totalCostUsd: number;
}

interface ChipDecision {
  ruleKey: string;
  label: string;
  costUsd: number;
  confirmed: boolean | null; // null = undecided
}

interface MistakeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeId: string;
  tradeSummary: {
    symbol: string;
    direction: 'BUY' | 'SELL';
    profitUsd: number;
  };
  suggestions: SuggestedMistake[];
}

function ordinalFa(n: number): string {
  const ordinals: Record<number, string> = {
    1: 'اول', 2: 'دوم', 3: 'سوم', 4: 'چهارم', 5: 'پنجم',
    6: 'ششم', 7: 'هفتم', 8: 'هشتم', 9: 'نهم', 10: 'دهم',
  };
  return ordinals[n] ?? `${n}م`;
}

export default function MistakeReviewModal({
  isOpen,
  onClose,
  tradeId,
  tradeSummary,
  suggestions,
}: MistakeReviewModalProps) {
  const [decisions, setDecisions] = useState<ChipDecision[]>([]);
  const [stats, setStats] = useState<MistakeStat[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReasons, setShowReasons] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) return;
    setDecisions(suggestions.map(s => ({
      ruleKey: s.ruleKey,
      label: s.label,
      costUsd: s.costUsd,
      confirmed: null,
    })));
    // Fetch existing stats for recurrence messaging
    api.get('/api/trades/mistakes/stats')
      .then(r => setStats(r.data))
      .catch(() => {});
  }, [isOpen, suggestions]);

  if (!isOpen) return null;

  const setDecision = (ruleKey: string, confirmed: boolean) => {
    setDecisions(prev => prev.map(d =>
      d.ruleKey === ruleKey ? { ...d, confirmed } : d
    ));
  };

  const toggleReason = (ruleKey: string) => {
    setShowReasons(prev => ({ ...prev, [ruleKey]: !prev[ruleKey] }));
  };

  const handleSubmit = async () => {
    // All undecided chips are treated as confirmed by default
    const incidents = decisions.map(d => ({
      tradeId,
      ruleKey: d.ruleKey,
      label: d.label,
      costUsd: d.costUsd,
      confirmed: d.confirmed !== null ? d.confirmed : true,
    }));

    setIsSubmitting(true);
    try {
      await api.post('/api/trades/mistakes/confirm', { incidents });
    } catch (err) {
      notify.error('خطا در ذخیره تصمیم‌ها');
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  const handleSkip = () => {
    onClose(); // No API call — dismissed
  };

  return (
    <div className="mistake-review-overlay" onClick={onClose}>
      <div className="mistake-review-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="header-text">
            <h3>🔍 تشخیص خودکار اشتباه</h3>
            <p>هوش مصنوعی نشد، قوانین ساده روی داده‌های خودت</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Trade Summary Strip */}
        <div className="trade-summary-strip">
          <span className="symbol">{tradeSummary.symbol}</span>
          <span className={`direction-badge ${tradeSummary.direction.toLowerCase()}`}>
            {tradeSummary.direction === 'BUY' ? 'خرید' : 'فروش'}
          </span>
          <span className="pnl loss">
            {tradeSummary.profitUsd.toFixed(2)}$
          </span>
        </div>

        {/* Mistake Chips */}
        <div className="mistakes-section">
          <span className="section-label">اشتباهات احتمالی شناسایی شده:</span>
          {suggestions.map(s => {
            const d = decisions.find(dec => dec.ruleKey === s.ruleKey);
            const existingStat = stats.find(st => st.ruleKey === s.ruleKey);
            const isConfirmed = d?.confirmed === true;
            const isDismissed = d?.confirmed === false;
            const showReason = showReasons[s.ruleKey];

            return (
              <div
                key={s.ruleKey}
                className={`mistake-chip ${isConfirmed ? 'confirmed' : isDismissed ? 'dismissed' : ''}`}
              >
                <div className="chip-top">
                  <span className="robot-badge">🤖</span>
                  <span className="chip-label">{s.label}</span>
                  <div className="chip-actions">
                    <button
                      className={`btn-confirm ${isConfirmed ? 'active' : ''}`}
                      onClick={() => setDecision(s.ruleKey, true)}
                      title="تأیید این اشتباه"
                    >
                      ✅ تأیید
                    </button>
                    <button
                      className={`btn-dismiss ${isDismissed ? 'active' : ''}`}
                      onClick={() => setDecision(s.ruleKey, false)}
                      title="رد این پیشنهاد"
                    >
                      ✕ رد
                    </button>
                  </div>
                </div>

                {/* Recurrence message */}
                {existingStat && existingStat.count > 0 && (
                  <div className="recurrence-msg">
                    این {ordinalFa(existingStat.count + 1)}مین باره که این اشتباه رو تکرار میکنی
                    {' '}— تا الان ${existingStat.totalCostUsd.toFixed(0)} برات هزینه داشته
                  </div>
                )}

                {/* Reason toggle */}
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'right' }}
                  onClick={() => toggleReason(s.ruleKey)}
                >
                  <span className="chip-reason">
                    {showReason ? s.reason : `${s.reason.slice(0, 80)}${s.reason.length > 80 ? '... (بیشتر)' : ''}`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-skip" onClick={handleSkip}>
            رد کردن همه
          </button>
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'در حال ذخیره...' : 'ذخیره تصمیم‌ها'}
          </button>
        </div>
      </div>
    </div>
  );
}
