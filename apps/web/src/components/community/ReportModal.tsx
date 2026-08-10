import React, { useState } from 'react';
import { api } from '@/lib/api';
import styles from './ReportModal.module.scss';
import { useTranslation } from '@/store/useAppStore';

export type ReportTargetType = 'POST' | 'COMMENT' | 'THREAD' | 'REPLY';

export interface ReportModalProps {
  targetId: string;
  targetType: ReportTargetType;
  onClose: () => void;
}

export function ReportModal({ targetId, targetType, onClose }: ReportModalProps) {
  const { language } = useTranslation();
  const isFa = language === 'fa';
  
  const REPORT_REASONS = [
    { value: 'SPAM', label: isFa ? 'اسپم' : 'Spam' },
    { value: 'HARASSMENT', label: isFa ? 'آزار و اذیت' : 'Harassment' },
    { value: 'MISINFORMATION', label: isFa ? 'اطلاعات غلط' : 'Misinformation' },
    { value: 'SCAM', label: isFa ? 'کلاهبرداری' : 'Scam' },
    { value: 'INAPPROPRIATE', label: isFa ? 'محتوای نامناسب' : 'Inappropriate Content' },
    { value: 'OTHER', label: isFa ? 'دیگر' : 'Other' },
  ];

  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/api/community/feed/report', {
        targetId,
        targetType,
        reason,
        note
      });
      
      alert(isFa ? 'گزارش با موفقیت ثبت شد.' : 'Report submitted successfully.');
      onClose();
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert(isFa ? 'ثبت گزارش با خطا مواجه شد. لطفاً دوباره تلاش کنید.' : 'Failed to submit report. Please try again later.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{isFa ? 'گزارش تخلف' : 'Report Content'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        
        <div className={styles.formGroup}>
          <label>{isFa ? 'دلیل' : 'Reason'}</label>
          <select value={reason} onChange={e => setReason(e.target.value)}>
            {REPORT_REASONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label>{isFa ? 'جزئیات بیشتر (اختیاری)' : 'Additional Details (Optional)'}</label>
          <textarea 
            placeholder={isFa ? 'توضیحات تکمیلی...' : 'Provide any additional context...'}
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>
        
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
            {isFa ? 'انصراف' : 'Cancel'}
          </button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={isSubmitting}>
            {isFa ? (isSubmitting ? 'در حال ثبت...' : 'ثبت گزارش') : (isSubmitting ? 'Submitting...' : 'Submit Report')}
          </button>
        </div>
      </div>
    </div>
  );
}
