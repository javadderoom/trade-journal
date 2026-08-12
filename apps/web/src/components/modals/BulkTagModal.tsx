import React, { useState } from 'react';
import { useTranslation } from '../../store/useAppStore';
import { getSharedTranslations } from '../../locales/components';
import LoadingButton from '../ui/LoadingButton';
import { TradingConcept } from '../../hooks/useTradingConcepts';

interface BulkTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  tradingConcepts: TradingConcept[];
  onApply: (data: {
    action: 'ADD' | 'SET' | 'REMOVE';
    setupId?: string | null;
    triggerIds?: string[];
    confluenceIds?: string[];
  }) => Promise<void>;
}

export default function BulkTagModal({
  isOpen,
  onClose,
  selectedCount,
  tradingConcepts,
  onApply
}: BulkTagModalProps) {
  const { t, language } = useTranslation();
  const isEn = language === 'en';
  const p = getSharedTranslations(isEn);

  const [action, setAction] = useState<'ADD' | 'SET' | 'REMOVE'>('ADD');
  const [setupId, setSetupId] = useState<string | null>(null);
  const [triggerIds, setTriggerIds] = useState<Set<string>>(new Set());
  const [confluenceIds, setConfluenceIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onApply({
        action,
        setupId: setupId === 'none' ? null : setupId,
        triggerIds: Array.from(triggerIds),
        confluenceIds: Array.from(confluenceIds)
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTrigger = (id: string) => {
    setTriggerIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleConfluence = (id: string) => {
    setConfluenceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
        <div className="modal-header">
          <h2>{isEn ? 'Bulk Assign Tags' : 'تخصیص گروهی برچسب‌ها'}</h2>
          <button className="icon-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {isEn 
              ? `You are applying changes to ${selectedCount} selected trades.` 
              : `شما در حال اعمال تغییرات روی ${selectedCount} معامله انتخاب شده هستید.`}
          </p>

          <div className="form-group">
            <label>{isEn ? 'Action' : 'عملیات'}</label>
            <div className="segmented-status-selector" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button 
                type="button" 
                className={action === 'ADD' ? 'active' : ''} 
                onClick={() => setAction('ADD')}
                style={{ flex: 1 }}
              >
                {isEn ? 'Add (Append)' : 'افزودن'}
              </button>
              <button 
                type="button" 
                className={action === 'SET' ? 'active' : ''} 
                onClick={() => setAction('SET')}
                style={{ flex: 1 }}
              >
                {isEn ? 'Set (Overwrite)' : 'جایگزینی کامل'}
              </button>
              <button 
                type="button" 
                className={action === 'REMOVE' ? 'active' : ''} 
                onClick={() => setAction('REMOVE')}
                style={{ flex: 1 }}
              >
                {isEn ? 'Remove' : 'حذف'}
              </button>
            </div>
          </div>

          {(action === 'ADD' || action === 'SET') && (
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>{isEn ? 'Setup' : 'ستاپ'}</label>
              <select 
                value={setupId || ''} 
                onChange={e => setSetupId(e.target.value || null)}
                className="form-input"
              >
                <option value="">{isEn ? '-- Select Setup (Optional) --' : '-- انتخاب ستاپ (اختیاری) --'}</option>
                <option value="none">{isEn ? 'No Setup (Clear)' : 'بدون ستاپ (حذف)'}</option>
                {tradingConcepts.filter(c => c.allowed_roles.includes('SETUP')).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>{isEn ? 'Triggers' : 'تریگرها'}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {tradingConcepts.filter(c => c.allowed_roles.includes('TRIGGER')).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleTrigger(c.id)}
                  className={`tag-mini-pill ${triggerIds.has(c.id) ? 'active' : ''}`}
                  style={{
                    border: `1px solid ${c.color || '#f59e0b'}`,
                    backgroundColor: triggerIds.has(c.id) ? (c.color || '#f59e0b') : 'transparent',
                    color: triggerIds.has(c.id) ? '#fff' : (c.color || '#f59e0b'),
                    padding: '4px 12px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>{isEn ? 'Confluences' : 'تاییدیه‌ها'}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {tradingConcepts.filter(c => c.allowed_roles.includes('CONFLUENCE')).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleConfluence(c.id)}
                  className={`tag-mini-pill ${confluenceIds.has(c.id) ? 'active' : ''}`}
                  style={{
                    border: `1px solid ${c.color || '#10b981'}`,
                    backgroundColor: confluenceIds.has(c.id) ? (c.color || '#10b981') : 'transparent',
                    color: confluenceIds.has(c.id) ? '#fff' : (c.color || '#10b981'),
                    padding: '4px 12px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              {p.cancel}
            </button>
            <LoadingButton 
              type="submit" 
              className="btn btn-primary" 
              isLoading={isSubmitting}
              disabled={isSubmitting || (setupId === null && triggerIds.size === 0 && confluenceIds.size === 0)}
            >
              {isEn ? 'Apply Tags' : 'اعمال برچسب‌ها'}
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}
