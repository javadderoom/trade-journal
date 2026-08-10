import React, { useState } from 'react';
import axios from 'axios';
import styles from './ReportModal.module.scss';

export type ReportTargetType = 'POST' | 'COMMENT' | 'THREAD' | 'REPLY';

export interface ReportModalProps {
  targetId: string;
  targetType: ReportTargetType;
  onClose: () => void;
}

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'MISINFORMATION', label: 'Misinformation' },
  { value: 'SCAM', label: 'Scam' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate Content' },
  { value: 'OTHER', label: 'Other' },
];

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function ReportModal({ targetId, targetType, onClose }: ReportModalProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/community/feed/report`, {
        targetId,
        targetType,
        reason,
        note
      }, { withCredentials: true });
      
      alert('Report submitted successfully.');
      onClose();
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report. Please try again later.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Report Content</h3>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        
        <div className={styles.formGroup}>
          <label>Reason</label>
          <select value={reason} onChange={e => setReason(e.target.value)}>
            {REPORT_REASONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label>Additional Details (Optional)</label>
          <textarea 
            placeholder="Provide any additional context..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>
        
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
