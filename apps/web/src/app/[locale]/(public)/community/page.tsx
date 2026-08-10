import React from 'react';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Feed | TradeKav',
  description: 'Share and discuss trading setups, reviews, and market analysis with the TradeKav community.',
};

export default function CommunityPage({ params }: { params: { locale: string } }) {
  const isFa = params.locale === 'fa';
  
  return (
    <div className="main-content-wrapper">
      <div style={{ padding: '32px 24px' }}>
        <h1 style={{ marginBottom: '8px' }}>{isFa ? 'انجمن' : 'Community'}</h1>
        <p className="larg" style={{ color: 'var(--muted)', marginBottom: '32px' }}>
          {isFa ? 'موقعیت‌های معاملاتی، بررسی‌ها و تحلیل‌های سایر معامله‌گران را کشف کنید.' : 'Discover trade setups, reviews, and analysis from other traders.'}
        </p>
        <CommunityFeed />
      </div>
    </div>
  );
}
