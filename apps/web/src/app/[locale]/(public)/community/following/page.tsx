import React from 'react';
import { Metadata } from 'next';
import { FollowingManager } from '@/components/community/FollowingManager';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Following | TradeKav Community',
  description: 'Manage the users, symbols, and categories you follow.',
};

export default function FollowingPage({ params }: { params: { locale: string } }) {
  const isFa = params.locale === 'fa';
  
  return (
    <div className="main-content-wrapper">
      <div style={{ padding: '32px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href={`/${params.locale}/community`} style={{ color: 'var(--primary)', fontWeight: 500 }}>
            &larr; {isFa ? 'بازگشت به انجمن' : 'Back to Community'}
          </Link>
        </div>
        
        <h1 style={{ marginBottom: '8px' }}>{isFa ? 'دنبال شوندگان' : 'Following'}</h1>
        <p className="larg" style={{ color: 'var(--muted)', marginBottom: '32px' }}>
          {isFa ? 'کاربران، نمادها و دسته‌بندی‌هایی که دنبال می‌کنید.' : 'Manage the users, symbols, and categories you follow.'}
        </p>
        
        <FollowingManager />
      </div>
    </div>
  );
}
