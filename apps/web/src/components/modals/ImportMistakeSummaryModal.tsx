'use client';

import React, { useState } from 'react';
import { api } from '../../lib/api';
import { notify } from '../../lib/notify';
import { SuggestedMistake } from './MistakeReviewModal';
import { useTranslation } from '../../store/useAppStore';
import { getSharedTranslations } from '../../locales/components';
import './mistake-review-modal.scss';

export interface ImportMistakeEntry {
  tradeId: string;
  ticket: number | null;
  symbol: string;
  suggestedMistakes: SuggestedMistake[];
}

interface ImportMistakeSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mistakeSummary: ImportMistakeEntry[];
}

interface RuleGroup {
  ruleKey: string;
  label: string;
  totalCostUsd: number;
  entries: Array<{ tradeId: string; ticket: number | null; symbol: string; costUsd: number }>;
}

function groupByRule(summary: ImportMistakeEntry[]): RuleGroup[] {
  const map: Record<string, RuleGroup> = {};
  for (const entry of summary) {
    for (const m of entry.suggestedMistakes) {
      if (!map[m.ruleKey]) {
        map[m.ruleKey] = { ruleKey: m.ruleKey, label: m.label, totalCostUsd: 0, entries: [] };
      }
      map[m.ruleKey].totalCostUsd += m.costUsd;
      map[m.ruleKey].entries.push({
        tradeId: entry.tradeId,
        ticket: entry.ticket,
        symbol: entry.symbol,
        costUsd: m.costUsd,
      });
    }
  }
  return Object.values(map).sort((a, b) => b.totalCostUsd - a.totalCostUsd);
}

export default function ImportMistakeSummaryModal({
  isOpen,
  onClose,
  mistakeSummary,
}: ImportMistakeSummaryModalProps) {
  const { t, language } = useTranslation();
  const isEn = language === 'en';

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || mistakeSummary.length === 0) return null;

  const groups = groupByRule(mistakeSummary);
  const totalAffected = mistakeSummary.length;

  const toggleGroup = (ruleKey: string) => {
    setExpandedGroups(prev => ({ ...prev, [ruleKey]: !prev[ruleKey] }));
  };

  const buildIncidents = (confirmed: boolean) => {
    const incidents: Array<{ tradeId: string; ruleKey: string; label: string; costUsd: number; confirmed: boolean }> = [];
    for (const entry of mistakeSummary) {
      for (const m of entry.suggestedMistakes) {
        incidents.push({
          tradeId: entry.tradeId,
          ruleKey: m.ruleKey,
          label: m.label,
          costUsd: m.costUsd,
          confirmed,
        });
      }
    }
    return incidents;
  };

  const handleConfirmAll = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/api/trades/mistakes/confirm', { incidents: buildIncidents(true) });
      notify.success(isEn ? 'All mistakes recorded successfully.' : 'همه اشتباهات ثبت شدند.');
    } catch {
      notify.error(isEn ? 'Error saving mistakes.' : 'خطا در ذخیره اشتباهات');
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  const handleDismissAll = () => {
    onClose();
  };

  const p = {
    ...getSharedTranslations(isEn),
    title: isEn ? 'Losing Trade Patterns Detected' : 'الگوهای اشتباه در واردات',
    desc: isEn 
      ? `In this import, ${totalAffected} losing trades were identified with the following mistake patterns:`
      : `در این واردات، ${totalAffected} معامله ضررده با الگوهای زیر شناسایی شد:`,
    tradesCount: isEn ? 'trades' : 'معامله',
    rejectAll: isEn ? 'Dismiss All' : 'رد همه',
    confirmAll: isEn ? 'Confirm All' : 'تأیید همه',
    saving: isEn ? 'Saving...' : 'در حال ذخیره...',
  };

  return (
    <div className="mistake-review-overlay" onClick={onClose}>
      <div
        className="mistake-review-modal import-mistake-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="import-mistake-header">
          <span className="material-symbols-outlined warning-icon">warning</span>
          <div>
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
          </div>
        </div>

        {/* Grouped rule cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: '55vh' }}>
          {groups.map(group => {
            const isExpanded = !!expandedGroups[group.ruleKey];
            return (
              <div key={group.ruleKey} className="rule-group-card">
                <div className="rule-group-header" onClick={() => toggleGroup(group.ruleKey)}>
                  <span className="rule-label">🤖 {group.label}</span>
                  <div className="rule-meta">
                    <span className="count-badge">{group.entries.length} {p.tradesCount}</span>
                    <span className="cost-badge">-${group.totalCostUsd.toFixed(0)}</span>
                  </div>
                  <span className={`material-symbols-outlined expand-icon ${isExpanded ? 'open' : ''}`}>
                    expand_more
                  </span>
                </div>
                {isExpanded && (
                  <div className="ticket-list">
                    {group.entries.map(e => (
                      <span key={e.tradeId} className="ticket-chip">
                        {e.symbol} {e.ticket ? `#${e.ticket}` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="import-mistake-footer">
          <button
            className="btn-dismiss-all"
            onClick={handleDismissAll}
            disabled={isSubmitting}
          >
            {p.rejectAll}
          </button>
          <button
            className="btn-confirm-all"
            onClick={handleConfirmAll}
            disabled={isSubmitting}
          >
            {isSubmitting ? p.saving : p.confirmAll}
          </button>
        </div>
      </div>
    </div>
  );
}
