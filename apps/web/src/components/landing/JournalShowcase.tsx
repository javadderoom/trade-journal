'use client';

import React from 'react';

interface JournalShowcaseProps {
  isEn: boolean;
}

export default function JournalShowcase({ isEn }: JournalShowcaseProps) {
  return (
    <section className="landing-showcase-section" id="features">
      <div className="section-container">
        <div className="showcase-head">
          <span className="section-label-chip green">{isEn ? 'SMART TRADE JOURNAL' : 'ژورنال هوشمند'}</span>
          <h2 className="showcase-title">
            {isEn ? 'Automated logging. Zero hassle.' : 'ثبت خودکار معاملات. بدون اتلاف وقت.'}
          </h2>
          <p className="showcase-sub">
            {isEn
              ? 'Connect MetaTrader 4/5 or import reports. TradeKav automatically parses pips, profit factor, risk-reward ratios, and market sessions.'
              : 'متاتریدر ۴ و ۵ را متصل کنید یا فایل گزارش را آپلود کنید. تریدکاو تمام محاسبات پیپ، ریسک به ریوارد و سشن‌ها را خودکار انجام می‌دهد.'}
          </p>
        </div>

        {/* Large Product Interface Card */}
        <div className="journal-product-frame">
          <div className="frame-topbar">
            <div className="dots">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>
            <div className="bar-title">tradekav.com/app/journal</div>
            <div className="sync-status">
              <span className="status-dot green-pulse" />
              <span>{isEn ? 'MT5 Auto-Synced 1m ago' : 'همگام‌سازی متاتریدر ۵ (۱ دقیقه قبل)'}</span>
            </div>
          </div>

          <div className="frame-body">
            {/* Table Mockup */}
            <div className="journal-table-mock">
              <div className="table-header-row">
                <span>{isEn ? 'Date / Time' : 'تاریخ / زمان'}</span>
                <span>{isEn ? 'Symbol' : 'نماد'}</span>
                <span>{isEn ? 'Type' : 'نوع'}</span>
                <span>{isEn ? 'Setup / Strategy' : 'استراتژی'}</span>
                <span>{isEn ? 'Lot' : 'حجم'}</span>
                <span>{isEn ? 'Entry' : 'ورود'}</span>
                <span>{isEn ? 'Exit' : 'خروج'}</span>
                <span>{isEn ? 'PnL ($)' : 'سود/زیان'}</span>
                <span>{isEn ? 'R:R' : 'R:R'}</span>
                <span>{isEn ? 'Emotion' : 'روانشناسی'}</span>
              </div>

              <div className="table-row">
                <span className="font-mono text-dim">2024-03-14 15:30</span>
                <span className="font-bold">XAUUSD</span>
                <span><span className="pill-side buy">BUY</span></span>
                <span><span className="chip-tag">Liquidity Sweep</span></span>
                <span className="font-mono">1.50</span>
                <span className="font-mono">2162.40</span>
                <span className="font-mono">2175.80</span>
                <span className="font-mono text-green font-bold">+$2,010.00</span>
                <span className="font-mono text-green font-bold">+2.8R</span>
                <span><span className="chip-emotion green">Focused</span></span>
              </div>

              <div className="table-row">
                <span className="font-mono text-dim">2024-03-14 10:15</span>
                <span className="font-bold">EURUSD</span>
                <span><span className="pill-side sell">SELL</span></span>
                <span><span className="chip-tag">FVG Fill</span></span>
                <span className="font-mono">2.00</span>
                <span className="font-mono">1.0920</span>
                <span className="font-mono">1.0895</span>
                <span className="font-mono text-green font-bold">+$500.00</span>
                <span className="font-mono text-green font-bold">+1.5R</span>
                <span><span className="chip-emotion neutral">Calm</span></span>
              </div>

              <div className="table-row">
                <span className="font-mono text-dim">2024-03-13 18:45</span>
                <span className="font-bold">BTCUSDT</span>
                <span><span className="pill-side buy">BUY</span></span>
                <span><span className="chip-tag">Breakout</span></span>
                <span className="font-mono">0.50</span>
                <span className="font-mono">72,400</span>
                <span className="font-mono">71,800</span>
                <span className="font-mono text-red font-bold">-$300.00</span>
                <span className="font-mono text-red font-bold">-1.0R</span>
                <span><span className="chip-emotion red">FOMO</span></span>
              </div>

              <div className="table-row">
                <span className="font-mono text-dim">2024-03-12 14:00</span>
                <span className="font-bold">GBPUSD</span>
                <span><span className="pill-side buy">BUY</span></span>
                <span><span className="chip-tag">Order Block</span></span>
                <span className="font-mono">1.00</span>
                <span className="font-mono">1.2780</span>
                <span className="font-mono">1.2845</span>
                <span className="font-mono text-green font-bold">+$650.00</span>
                <span className="font-mono text-green font-bold">+2.2R</span>
                <span><span className="chip-emotion green">Disciplined</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
