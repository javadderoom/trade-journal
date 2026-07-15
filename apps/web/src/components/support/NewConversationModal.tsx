'use client';

import React, { useState } from 'react';
import { useTranslation } from '../../store/useAppStore';

const CATEGORIES = ['GENERAL', 'TECHNICAL', 'BILLING', 'FEATURE_REQUEST', 'BUG_REPORT'];

interface NewConversationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (subject: string, category: string, body: string) => Promise<void>;
}

export default function NewConversationModal({ open, onClose, onSubmit }: NewConversationModalProps) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const categoryLabels: Record<string, string> = {
    GENERAL: t('support.catGeneral'),
    TECHNICAL: t('support.catTechnical'),
    BILLING: t('support.catBilling'),
    FEATURE_REQUEST: t('support.catFeatureRequest'),
    BUG_REPORT: t('support.catBugReport'),
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !body.trim()) return;
    setLoading(true);
    try {
      await onSubmit(subject.trim(), category, body.trim());
      setSubject('');
      setCategory('GENERAL');
      setBody('');
      onClose();
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#1e1f26',
          border: '1px solid rgba(60, 74, 65, 0.4)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(60, 74, 65, 0.3)',
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, color: '#e2e2eb' }}>{t('support.newTicket')}</span>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.06)',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>
              {t('support.ticketSubject')}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('support.subjectPlaceholder')}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(60, 74, 65, 0.4)',
                background: '#282a30',
                color: '#e2e2eb',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>
              {t('support.categoryLabel')}
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: `1px solid ${category === cat ? '#61f9b1' : 'rgba(60, 74, 65, 0.4)'}`,
                    background: category === cat ? 'rgba(97, 249, 177, 0.1)' : '#282a30',
                    color: category === cat ? '#61f9b1' : '#94a3b8',
                    fontSize: 13,
                    fontWeight: category === cat ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>
              {t('support.messageBody')}
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('support.bodyPlaceholder')}
              rows={5}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(60, 74, 65, 0.4)',
                background: '#282a30',
                color: '#e2e2eb',
                fontSize: 14,
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '12px 20px',
            borderTop: '1px solid rgba(60, 74, 65, 0.3)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid rgba(60, 74, 65, 0.4)',
              background: '#282a30',
              color: '#94a3b8',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {t('support.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !subject.trim() || !body.trim()}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#61f9b1',
              color: '#003822',
              fontSize: 13,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading || !subject.trim() || !body.trim() ? 0.5 : 1,
            }}
          >
            {loading ? t('support.sending') : t('support.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
