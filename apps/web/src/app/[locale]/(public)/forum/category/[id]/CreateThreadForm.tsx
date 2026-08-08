'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export function CreateThreadForm({ categoryId, locale }: { categoryId: string, locale: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const isFa = locale === 'fa';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setIsSubmitting(true);
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    try {
      const res = await axios.post(`${API_URL}/api/community/forum/thread`, {
        title,
        content,
        categoryId
      }, { withCredentials: true });
      
      router.push(`/${locale}/forum/thread/${res.data.id}`);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        style={{
          background: 'var(--primary)',
          color: 'var(--on-primary)',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          width: '100%'
        }}
      >
        {isFa ? 'ایجاد تاپیک جدید' : 'Start a New Thread'}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'var(--surface)',
      border: '1px solid rgba(var(--outline-variant-rgb), 0.4)',
      padding: '24px',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <h3 style={{ margin: 0, fontSize: '18px' }}>{isFa ? 'ایجاد تاپیک' : 'Create Thread'}</h3>
      <input 
        type="text" 
        placeholder={isFa ? 'عنوان' : 'Title'}
        value={title}
        onChange={e => setTitle(e.target.value)}
        disabled={isSubmitting}
        style={{
          background: 'var(--surface-container-low)',
          border: '1px solid rgba(var(--outline-variant-rgb), 0.4)',
          padding: '12px',
          borderRadius: '6px',
          color: 'var(--text)',
          fontFamily: 'inherit'
        }}
        required
      />
      <textarea
        placeholder={isFa ? 'محتوا...' : 'Content...'}
        value={content}
        onChange={e => setContent(e.target.value)}
        disabled={isSubmitting}
        style={{
          background: 'var(--surface-container-low)',
          border: '1px solid rgba(var(--outline-variant-rgb), 0.4)',
          padding: '12px',
          borderRadius: '6px',
          color: 'var(--text)',
          fontFamily: 'inherit',
          minHeight: '120px',
          resize: 'vertical'
        }}
        required
      />
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button 
          type="button" 
          onClick={() => setIsExpanded(false)}
          style={{
            background: 'transparent',
            border: '1px solid rgba(var(--outline-variant-rgb), 0.4)',
            color: 'var(--text)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {isFa ? 'لغو' : 'Cancel'}
        </button>
        <button 
          type="submit"
          disabled={isSubmitting || !title.trim() || !content.trim()}
          style={{
            background: 'var(--primary)',
            border: 'none',
            color: 'var(--on-primary)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isFa ? 'ارسال' : 'Post'}
        </button>
      </div>
    </form>
  );
}
