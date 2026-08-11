'use client';

import React from 'react';
import { useTranslation } from '@/store/useAppStore';

export function EmptyFeedState({ onAction }: { onAction: () => void }) {
  const { language } = useTranslation();
  const isFa = language === 'fa';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      backgroundColor: 'var(--surface-container-low)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.04)',
      textAlign: 'center',
      animation: 'fadeIn 0.5s ease-out forwards',
      opacity: 0,
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
        color: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px'
      }}>
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
        {isFa ? 'هنوز کسی را دنبال نمی‌کنید' : 'You aren’t following anyone yet'}
      </h3>
      <p style={{ color: 'var(--muted)', fontSize: '15px', maxWidth: '400px', marginBottom: '24px', lineHeight: 1.6 }}>
        {isFa 
          ? 'برای دیدن تحلیل‌ها و موقعیت‌های معاملاتی در اینجا، معامله‌گران دیگر را دنبال کنید.' 
          : 'Follow other traders to see their setups, analysis, and reviews here in your feed.'}
      </p>
      <button 
        onClick={onAction}
        style={{
          backgroundColor: 'var(--primary)',
          color: 'var(--on-primary)',
          border: 'none',
          padding: '10px 24px',
          borderRadius: '24px',
          fontWeight: 600,
          fontSize: '15px',
          cursor: 'pointer',
          transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1)',
        }}
        onMouseOver={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
        onMouseOut={(e) => (e.currentTarget.style.filter = 'none')}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {isFa ? 'کشف معامله‌گران' : 'Discover Traders'}
      </button>
    </div>
  );
}
