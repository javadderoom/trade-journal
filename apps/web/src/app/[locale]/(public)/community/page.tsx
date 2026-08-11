import React from 'react';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { CommunitySidebar } from '@/components/community/CommunitySidebar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Feed | TradeKav',
  description: 'Share and discuss trading setups, reviews, and market analysis with the TradeKav community.',
};

export default async function CommunityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isFa = locale === 'fa';
  
  return (
    <div style={{ flex: 1, width: '100%', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {/* 1080px max-width container for the 2-column layout */}
      <div style={{ padding: '32px 24px', maxWidth: '1080px', margin: '0 auto', width: '100%', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        
        {/* Main Feed Column */}
        <div style={{ flex: 1, maxWidth: '680px' }}>
          <h1 style={{ marginBottom: '8px' }}>{isFa ? 'انجمن' : 'Community'}</h1>
          <p className="larg" style={{ color: 'var(--muted)', marginBottom: '32px' }}>
            {isFa ? 'موقعیت‌های معاملاتی، بررسی‌ها و تحلیل‌های سایر معامله‌گران را کشف کنید.' : 'Discover trade setups, reviews, and analysis from other traders.'}
          </p>
          <CommunityFeed />
        </div>

        {/* Right Sidebar Column */}
        <div style={{ display: 'none' }} className="desktop-sidebar">
          <CommunitySidebar />
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 1024px) {
            .desktop-sidebar {
              display: block !important;
            }
          }
        `}} />
      </div>
    </div>
  );
}
