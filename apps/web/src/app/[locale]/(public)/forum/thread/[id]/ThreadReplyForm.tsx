'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export function ThreadReplyForm({ threadId, locale }: { threadId: string, locale: string }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const isFa = locale === 'fa';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    try {
      await axios.post(`${API_URL}/api/community/forum/thread/${threadId}/reply`, {
        content
      }, { withCredentials: true });
      
      setContent('');
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <h3 style={{ margin: 0 }}>{isFa ? 'ارسال پاسخ' : 'Post a Reply'}</h3>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={isFa ? 'متن پاسخ شما...' : 'Your reply...'}
        disabled={isSubmitting}
        style={{
          background: 'var(--surface-container-low)',
          border: '1px solid rgba(var(--outline-variant-rgb), 0.4)',
          padding: '16px',
          borderRadius: '8px',
          color: 'var(--text)',
          fontFamily: 'inherit',
          minHeight: '120px',
          resize: 'vertical'
        }}
        required
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          type="submit"
          disabled={isSubmitting || !content.trim()}
          style={{
            background: 'var(--primary)',
            border: 'none',
            color: 'var(--on-primary)',
            padding: '10px 24px',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isFa ? 'ارسال' : 'Submit'}
        </button>
      </div>
    </form>
  );
}
