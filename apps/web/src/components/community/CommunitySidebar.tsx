'use client';

import React from 'react';
import { useTranslation } from '@/store/useAppStore';
import Link from 'next/link';

export function CommunitySidebar() {
  const { language } = useTranslation();
  const isFa = language === 'fa';

  const trendingSymbols = [
    { symbol: 'BTCUSDT', volume: isFa ? '۳.۴ هزار پست' : '3.4k posts' },
    { symbol: 'XAUUSD', volume: isFa ? '۲.۱ هزار پست' : '2.1k posts' },
    { symbol: 'EURUSD', volume: isFa ? '۱.۲ هزار پست' : '1.2k posts' },
    { symbol: 'ETHUSDT', volume: isFa ? '۹۸۰ پست' : '980 posts' },
  ];

  const suggestedUsers = [
    { name: 'Ali Reza', handle: '@alireza', avatar: 'A' },
    { name: 'Crypto King', handle: '@cryptoking', avatar: 'C' },
    { name: 'Sara Trade', handle: '@saratrade', avatar: 'S' },
  ];

  return (
    <aside style={{ width: '320px', position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '24px', height: 'fit-content', paddingBottom: '32px' }}>
      
      {/* Trending Symbols Widget */}
      <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>
          {isFa ? 'نمادهای پرطرفدار' : 'Trending Symbols'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {trendingSymbols.map((item, idx) => (
            <Link href={`/${isFa ? 'fa' : 'en'}/community/symbols/${item.symbol}`} key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>${item.symbol}</span>
                <span style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>{item.volume}</span>
              </div>
              <div style={{ color: 'var(--muted)' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isFa ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  )}
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Suggested Users Widget */}
      <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>
          {isFa ? 'افراد پیشنهادی' : 'Suggested Traders'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {suggestedUsers.map((user, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--on-surface)' }}>
                  {user.avatar}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{user.name}</span>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{user.handle}</span>
                </div>
              </div>
              <button style={{ backgroundColor: 'var(--surface-variant)', color: 'var(--text)', border: 'none', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s ease' }}>
                {isFa ? 'دنبال کردن' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      </div>

    </aside>
  );
}
