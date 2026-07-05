'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { notify } from '../../lib/notify';
import { useTranslation } from '../../store/useAppStore';
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

function ordinalFa(n: number, isEn: boolean): string {
  if (isEn) {
    const ordinals: Record<number, string> = {
      1: 'first', 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth',
      6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth',
    };
    return ordinals[n] ?? `${n}th`;
  } else {
    const ordinals: Record<number, string> = {
      1: 'اول', 2: 'دوم', 3: 'سوم', 4: 'چهارم', 5: 'پنجم',
      6: 'ششم', 7: 'هفتم', 8: 'هشتم', 9: 'نهم', 10: 'دهم',
    };
    return ordinals[n] ?? `${n}م`;
  }
}

export default function MistakeReviewModal({
  isOpen,
  onClose,
  tradeId,
  tradeSummary,
  suggestions,
}: MistakeReviewModalProps) {
  const { t, language } = useTranslation();
  const isEn = language === 'en';

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
      notify.error(isEn ? 'Error saving decisions.' : 'خطا در ذخیره تصمیم‌ها');
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const p = {
    title: isEn ? '🔍 Auto Mistake Detection' : '🔍 تشخیص خودکار اشتباه',
    desc: isEn ? 'Simple rules checked on your actual trade details' : 'هوش مصنوعی نشد، قوانین ساده روی داده‌های خودت',
    potentialMistakes: isEn ? 'Potential mistakes identified:' : 'اشتباهات احتمالی شناسایی شده:',
    confirm: isEn ? 'Confirm' : '✅ تأیید',
    confirmTitle: isEn ? 'Confirm this mistake' : 'تأیید این اشتباه',
    reject: isEn ? 'Reject' : '✕ رد',
    rejectTitle: isEn ? 'Reject suggestion' : 'رد این پیشنهاد',
    more: isEn ? '... (more)' : '... (بیشتر)',
    rejectAll: isEn ? 'Reject All' : 'رد کردن همه',
    save: isEn ? 'Save Decisions' : 'ذخیره تصمیم‌ها',
    saving: isEn ? 'Saving...' : 'در حال ذخیره...',
  };

  return (
    <div className="mistake-review-overlay" onClick={onClose}>
      <div className="mistake-review-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="header-text">
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Trade Summary Strip */}
        <div className="trade-summary-strip">
          <span className="symbol">{tradeSummary.symbol}</span>
          <span className={`direction-badge ${tradeSummary.direction.toLowerCase()}`}>
            {tradeSummary.direction === 'BUY' ? (isEn ? 'Buy' : 'خرید') : (isEn ? 'Sell' : 'فروش')}
          </span>
          <span className="pnl loss">
            {tradeSummary.profitUsd.toFixed(2)}$
          </span>
        </div>

        {/* Mistake Chips */}
        <div className="mistakes-section">
          <span className="section-label">{p.potentialMistakes}</span>
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
                      title={p.confirmTitle}
                    >
                      {p.confirm}
                    </button>
                    <button
                      className={`btn-dismiss ${isDismissed ? 'active' : ''}`}
                      onClick={() => setDecision(s.ruleKey, false)}
                      title={p.rejectTitle}
                    >
                      {p.reject}
                    </button>
                  </div>
                </div>

                {/* Recurrence message */}
                {existingStat && existingStat.count > 0 && (
                  <div className="recurrence-msg">
                    {isEn 
                      ? `This is the ${ordinalFa(existingStat.count + 1, true)} time you repeat this mistake — cost you $${existingStat.totalCostUsd.toFixed(0)} so far` 
                      : `این ${ordinalFa(existingStat.count + 1, false)}مین باره که این اشتباه رو تکرار میکنی — تا الان $${existingStat.totalCostUsd.toFixed(0)} برات هزینه داشته`
                    }
                  </div>
                )}

                {/* Reason toggle */}
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: isEn ? 'left' : 'right', width: '100%' }}
                  onClick={() => toggleReason(s.ruleKey)}
                >
                  <span className="chip-reason">
                    {showReason ? s.reason : `${s.reason.slice(0, 80)}${s.reason.length > 80 ? p.more : ''}`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-skip" onClick={handleSkip}>
            {p.rejectAll}
          </button>
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? p.saving : p.save}
          </button>
        </div>
      </div>
    </div>
  );
}
