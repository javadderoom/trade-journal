'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Trade } from './TradesTable';
import { toPersianDigits, formatToman } from '../../utils/farsi';
import { useTranslation } from '../../store/useAppStore';
import {
  formatCurrency,
  getNetPnl,
  getEmotionEmoji,
  getEmotionLabel,
  formatDate,
  getTradingSession
} from '../../utils/tradeHelpers';

interface MobileCardsListProps {
  filteredTrades: Trade[];
  selectedTrades: Set<string>;
  setSelectedTrades: React.Dispatch<React.SetStateAction<Set<string>>>;
  activeTradeId: string | null;
  setActiveTradeId: (id: string | null) => void;
  handleSelectRow: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
  selectedTimezone: string;
  usdToToman: number;
  allEmotions: { value: string; label: string; emoji?: string }[];
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  tradingConcepts: any[];
  accounts?: any[];
}

export default function MobileCardsList({
  filteredTrades,
  selectedTrades,
  setSelectedTrades,
  activeTradeId,
  setActiveTradeId,
  handleSelectRow,
  selectedTimezone,
  usdToToman,
  allEmotions,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  tradingConcepts,
  accounts = [],
}: MobileCardsListProps) {
  const { t, language } = useTranslation();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);

    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  const displayedTrades = React.useMemo(() => {
    return filteredTrades.slice(0, currentPage * itemsPerPage);
  }, [filteredTrades, currentPage, itemsPerPage]);

  const hasMore = currentPage * itemsPerPage < filteredTrades.length;

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMobile) return;
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = observerRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
      observer.disconnect();
    };
  }, [isMobile, hasMore, setCurrentPage]);

  const handleMobileSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const ids = displayedTrades.map(t => t.id);
      setSelectedTrades(new Set(ids));
    } else {
      setSelectedTrades(new Set());
    }
  };

  return (
    <>
      {/* Mobile select all bar */}
      <div className="mobile-select-all-bar">
        <input
          type="checkbox"
          id="mobile-select-all"
          onChange={handleMobileSelectAll}
          checked={
            displayedTrades.length > 0 &&
            displayedTrades.every(t => selectedTrades.has(t.id))
          }
        />
        <label htmlFor="mobile-select-all">{t('trades.selectLoadedTrades') || 'انتخاب همه معاملات بارگذاری شده'}</label>
      </div>

      {/* Mobile Cards List Layout */}
      <div className="mobile-cards-view">
        {displayedTrades.map(trade => {
          const isBuy = trade.direction === 'BUY';
          const isClosed = trade.closeTime !== null;
          const isActive = trade.id === activeTradeId;
          // const isMissed = false; // logic placeholder
          const netPnl = getNetPnl(trade);

          let profitClass = 'profit-zero';
          if (netPnl > 0) profitClass = 'profit-positive';
          else if (netPnl < 0) profitClass = 'profit-negative';
          if (!isClosed) profitClass = 'profit-open';
          // if (isMissed) profitClass = 'profit-missed';

          const account = accounts?.find(a => a.id === trade.accountId);
          const initialBalance = account?.initial_balance || 0;
          const pnlPercent = initialBalance > 0 ? (netPnl / initialBalance) * 100 : null;

          return (
            <div
              key={`card-${trade.id}`}
              className={`trade-mobile-card ${isActive ? 'active-card' : ''} ${!isClosed ? 'open-card' : ''}`}
              onClick={() => setActiveTradeId(trade.id)}
            >
              {/* Top Row: Checkbox, Symbol, Direction, Status icon */}
              <div className="card-top-row">
                <div className="top-right-group">
                  <input
                    type="checkbox"
                    checked={selectedTrades.has(trade.id)}
                    onChange={e => handleSelectRow(e, trade.id)}
                    onClick={e => e.stopPropagation()}
                  />
                  <span className="symbol-name">{trade.symbol}</span>
                  <span className={`direction-badge ${isBuy ? 'buy' : 'sell'}`}>
                    <span className="material-symbols-outlined badge-icon">
                      {isBuy ? 'trending_up' : 'trending_down'}
                    </span>
                    {isBuy ? t('trades.buy') : t('trades.sell')}
                  </span>
                </div>
                <div className="top-left-group">
                  {/* Status Block */}
                  <span
                    className={`material-symbols-outlined status-icon ${isClosed ? 'status-closed' : 'status-open'}`}
                    title={isClosed ? t('trades.closed') : t('trades.open')}
                  >
                    {isClosed ? 'check_circle' : 'sync'}
                  </span>
                </div>
              </div>

              {/* Middle Row: Volume (Lots), R:R, Profit/Loss (USD & Toman) */}
              <div className="card-middle-row">
                <div className="card-metric">
                  <span className="metric-label">{t('trades.volume')}:</span>
                  <span className="metric-value">{toPersianDigits(trade.lotSize)}</span>
                </div>
                <div className="card-metric">
                  <span className="metric-label">{t('trades.rr')}:</span>
                  <span className={`metric-value ${trade.rMultiple > 0 ? 'text-primary' : trade.rMultiple < 0 ? 'text-error' : ''}`}>
                    {trade.rMultiple > 0 ? '+' : ''}
                    {toPersianDigits(trade.rMultiple.toFixed(1))}R
                  </span>
                </div>
                <div className={`col-profit ${profitClass}`}>
                  <span className="profit-usd">
                    {formatCurrency(netPnl)}
                    {pnlPercent !== null && (
                      <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: '4px' }}>
                        ({pnlPercent > 0 ? '+' : ''}{toPersianDigits(pnlPercent.toFixed(2))}%)
                      </span>
                    )}
                  </span>
                  {language === 'fa' && (
                    <span className="profit-toman">{formatToman(netPnl, usdToToman)}</span>
                  )}
                </div>
              </div>

              {/* Bottom Row: Date & Time, Trading Session */}
              <div className="card-bottom-row">
                <div className="date-time-group">
                  <span className="date-value">
                    <span className="material-symbols-outlined card-icon">calendar_month</span>
                    {formatDate(trade.openTime, selectedTimezone).date} ({formatDate(trade.openTime, selectedTimezone).day})
                  </span>
                  {trade.closeTime && (
                    <span className="date-value close-date-val">
                      <span className="material-symbols-outlined card-icon close-icon">logout</span>
                      {t('trades.exit')}: {formatDate(trade.closeTime, selectedTimezone).date}
                    </span>
                  )}
                </div>
                {(() => {
                  const sess = getTradingSession(trade.openTime, trade.annotation?.session);
                  return (
                    <span className={`session-badge ${sess.className}`} title={sess.label}>
                      {sess.emoji} {sess.label}
                    </span>
                  );
                })()}
              </div>

              {(() => {
                const setup = trade.setup?.concept;
                return (trade.annotation?.emotion || setup || (trade.triggers && trade.triggers.length > 0) || (trade.confluences && trade.confluences.length > 0)) && (
                  <div className="card-tags-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {trade.annotation?.emotion && (
                      <span className={`emotion-mini-badge emotion-${trade.annotation?.emotion.toLowerCase()}`} title={`${t('trades.emotion')}: ${getEmotionLabel(trade.annotation?.emotion, allEmotions)}`}>
                        {getEmotionEmoji(trade.annotation?.emotion, allEmotions)} {getEmotionLabel(trade.annotation?.emotion, allEmotions)}
                      </span>
                    )}
                    {setup && (
                      <span key={setup.id} className="tag-mini-pill" style={{ borderLeft: `3px solid ${setup.color || '#3b82f6'}`, backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#fff' }}>
                        {setup.icon && <span style={{ marginRight: '4px' }}>{setup.icon}</span>}
                        {setup.name}
                      </span>
                    )}
                    {trade.triggers && trade.triggers.map((t, idx) => (
                      <span key={`trigger-${idx}`} className="tag-mini-pill" style={{ border: `1px solid ${t.concept.color || '#f59e0b'}`, backgroundColor: 'rgba(245, 158, 11, 0.05)', padding: '1px 5px', borderRadius: '4px', fontSize: '11px', color: '#fff', display: 'flex', alignItems: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '12px', marginRight: '2px', color: t.concept.color || '#f59e0b' }}>bolt</span>
                        {t.concept.name}
                      </span>
                    ))}
                    {trade.confluences && trade.confluences.length > 0 && (
                      <span className="tag-mini-pill" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1px 6px', borderRadius: '12px', fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center' }} title={`${trade.confluences.length} Confluences`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '12px', marginRight: '2px' }}>layers</span>
                        +{trade.confluences.length}
                      </span>
                    )}
                  </div>
                );
              })()}

            </div>
          );
        })}
        {displayedTrades.length === 0 && (
          <div className="no-trades-card">
            {t('trades.searchNoResults')}
          </div>
        )}
      </div>

      {/* Infinite Scroll observer element */}
      {hasMore && isMobile && (
        <div
          ref={observerRef}
          className="infinite-scroll-trigger"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px 0',
            color: '#10b981'
          }}
        >
          <span
            className="material-symbols-outlined spinner-icon"
            style={{
              fontSize: '28px',
              animation: 'pulse-glow 1.5s infinite'
            }}
          >
            sync
          </span>
        </div>
      )}
    </>
  );
}
