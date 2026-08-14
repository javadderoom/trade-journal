import React from 'react';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { Metadata } from 'next';
import { FollowButton } from '@/components/community/FollowButton';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Symbol | TradeKav',
  description: 'TradeKav symbol discussion',
};

async function getSymbol(symbolStr: string) {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${API_URL}/api/community/symbol/${symbolStr}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
}

export default async function SymbolPage({ params }: { params: { locale: string, symbol: string } }) {
  const decodedSymbol = decodeURIComponent(params.symbol);
  const symbolData = await getSymbol(decodedSymbol);

  if (!symbolData) {
    return notFound();
  }

  const isFa = params.locale === 'fa';

  return (
    <div className="main-content-wrapper">
      <div style={{ padding: '32px 24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Link href={`/${params.locale}/community`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
            &larr; {isFa ? 'بازگشت به کامیونیتی' : 'Back to Community'}
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid var(--outline-variant)' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px' }}>${symbolData.symbol}</h1>
            <div style={{ display: 'flex', gap: '16px', color: 'var(--muted)', fontSize: '14px' }}>
              <span>{symbolData._count?.posts || 0} {isFa ? 'پست' : 'Posts'}</span>
              <span>{symbolData._count?.follows || 0} {isFa ? 'دنبال‌کننده' : 'Followers'}</span>
            </div>
          </div>
          <div>
            <FollowButton targetId={symbolData.symbol} targetType="SYMBOL" />
          </div>
        </div>

        <CommunityFeed symbol={symbolData.symbol} />
      </div>
    </div>
  );
}
