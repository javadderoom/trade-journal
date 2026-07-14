'use client';

import React from 'react';
import { Trade, TagObject } from './TradesTable';
import { toPersianDigits, formatToman } from '../../utils/farsi';
import { useTranslation } from '../../store/useAppStore';
import {
  formatCurrency,
  getEmotionEmoji,
  getEmotionLabel,
  formatDate,
  getTradingSession
} from '../../utils/tradeHelpers';

interface DesktopTableProps {
  paginatedTrades: Trade[];
  selectedTrades: Set<string>;
  activeTradeId: string | null;
  setActiveTradeId: (id: string | null) => void;
  handleSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectRow: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
  selectedTimezone: string;
  usdToToman: number;
  allEmotions: { value: string; label: string; emoji?: string }[];
  accounts?: any[];
  ignoredTags: Set<string>;
  allTags: TagObject[];
  sortKey: string;
  sortDir: 'asc' | 'desc';
  onSort: (key: string) => void;
}

export default function DesktopTable({
  paginatedTrades,
  selectedTrades,
  activeTradeId,
  setActiveTradeId,
  handleSelectAll,
  handleSelectRow,
  selectedTimezone,
  usdToToman,
  allEmotions,
  accounts = [],
  ignoredTags,
  allTags,
  sortKey,
  sortDir,
  onSort,
}: DesktopTableProps) {
  const { t, language } = useTranslation();
  const isRtl = language === 'fa';
  const sortIcon = (key: string) => {
    if (sortKey !== key) return isRtl ? 'arrow_upward' : 'arrow_downward';
    return sortDir === 'asc' ? (isRtl ? 'arrow_downward' : 'arrow_upward') : (isRtl ? 'arrow_upward' : 'arrow_downward');
  };

  return (
    <div className="table-section-container">
      <div className="table-responsive-wrapper">
        <table className="trades-data-table">
          <thead>
            <tr>
              <th className="checkbox-th">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    paginatedTrades.length > 0 &&
                    paginatedTrades.every(t => selectedTrades.has(t.id))
                  }
                />
              </th>
              <th className="sortable-th" onClick={() => onSort('date')}>
                {t('trades.date')} <span className="material-symbols-outlined sort-icon">{sortIcon('date')}</span>
              </th>
              <th>{t('trades.day')}</th>
              <th className="sortable-th" onClick={() => onSort('symbol')}>
                {t('trades.symbol')} <span className="material-symbols-outlined sort-icon">{sortIcon('symbol')}</span>
              </th>
              <th>{t('trades.account')}</th>
              <th className="sortable-th" onClick={() => onSort('direction')}>
                {t('trades.direction')} <span className="material-symbols-outlined sort-icon">{sortIcon('direction')}</span>
              </th>
              <th className="sortable-th" onClick={() => onSort('volume')}>
                {t('trades.volume')} <span className="material-symbols-outlined sort-icon">{sortIcon('volume')}</span>
              </th>
              <th className="sortable-th" onClick={() => onSort('rr')}>
                {t('trades.rr')} <span className="material-symbols-outlined sort-icon">{sortIcon('rr')}</span>
              </th>
              <th className="sortable-th" style={{ textAlign: 'left' }} onClick={() => onSort('pnl')}>
                {t('trades.pnl')} <span className="material-symbols-outlined sort-icon">{sortIcon('pnl')}</span>
              </th>
              <th style={{ textAlign: 'center' }}>{t('trades.status')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTrades.map(trade => {
              const isBuy = trade.direction === 'BUY';
              const isClosed = trade.closeTime !== null;
              const isActive = trade.id === activeTradeId;

              // P&L color logic
              const isMissed = trade.tags?.some(tag => ignoredTags.has(tag));
              let profitClass = 'profit-zero';
              if (trade.profitUsd > 0) profitClass = 'profit-positive';
              else if (trade.profitUsd < 0) profitClass = 'profit-negative';
              if (!isClosed) profitClass = 'profit-open';
              if (isMissed) profitClass = 'profit-missed';

              // Sort tags to show show_first (important) ones first
              const importantTagNames = new Set(
                (allTags || []).filter(t => t.show_first).map(t => t.name)
              );
              const sortedTags = [...(trade.tags || [])].sort((a, b) => {
                const aImp = importantTagNames.has(a);
                const bImp = importantTagNames.has(b);
                if (aImp && !bImp) return -1;
                if (!aImp && bImp) return 1;
                return 0;
              });

              return (
                <tr
                  key={trade.id}
                  className={`${isActive ? 'active-row' : ''} ${!isClosed ? 'open-row' : ''}`}
                  onClick={() => setActiveTradeId(trade.id)}
                >
                  <td className="checkbox-td">
                    <input
                      type="checkbox"
                      checked={selectedTrades.has(trade.id)}
                      onChange={e => handleSelectRow(e, trade.id)}
                    />
                  </td>
                  <td className="col-time">
                    <span className="date-value">{formatDate(trade.openTime, selectedTimezone).date}</span>
                    {trade.closeTime && (
                      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>logout</span>
                        {t('trades.exit')}: {formatDate(trade.closeTime, selectedTimezone).date}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="day-session-wrapper">
                      <span className="day-badge">{formatDate(trade.openTime, selectedTimezone).day}</span>
                      {(() => {
                        const sess = getTradingSession(trade.openTime);
                        return (
                          <span className={`session-badge ${sess.className}`} title={sess.label}>
                            {sess.emoji} {sess.label}
                          </span>
                        );
                      })()}
                      {(trade.analysisTimeframe || trade.entryTimeframe) && (
                        <div className="timeframe-badges">
                          {trade.analysisTimeframe && (
                            <span className="timeframe-badge analysis" title={t('trades.analysisTimeframe')}>
                              📊 {trade.analysisTimeframe}
                            </span>
                          )}
                          {trade.entryTimeframe && (
                            <span className="timeframe-badge entry" title={t('trades.entryTimeframe')}>
                              🎯 {trade.entryTimeframe}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="col-symbol">
                    <div className="symbol-cell-content">
                      <span className="symbol-name">{trade.symbol}</span>
                      {(trade.emotion || (sortedTags.length > 0)) && (
                        <div className="symbol-metadata">
                          {trade.emotion && (
                            <span className={`emotion-mini-badge emotion-${trade.emotion.toLowerCase()}`} title={`${t('trades.emotion')}: ${getEmotionLabel(trade.emotion, allEmotions)}`}>
                              {getEmotionEmoji(trade.emotion, allEmotions)} {getEmotionLabel(trade.emotion, allEmotions)}
                            </span>
                          )}
                          {sortedTags.slice(0, 2).map(tag => {
                            const isImportant = importantTagNames.has(tag);
                            return (
                              <span key={tag} className={`tag-mini-pill ${isImportant ? 'important' : ''}`}>
                                {isImportant ? '⭐ ' : ''}{tag}
                              </span>
                            );
                          })}
                          {sortedTags.length > 2 && (
                            <span className="tag-mini-more" title={sortedTags.slice(2).join(', ')}>
                              +{toPersianDigits(sortedTags.length - 2)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {(() => {
                      const account = accounts.find(a => a.id === trade.accountId);
                      return account
                        ? `${account.broker_name || 'MT5'} (${account.account_number || account.id})`
                        : (trade.accountId === 'dev-account' ? t('trades.defaultAccount') : '-');
                    })()}
                  </td>
                  <td>
                    <span className={`direction-badge ${isBuy ? 'buy' : 'sell'}`}>
                      <span className="material-symbols-outlined badge-icon">
                        {isBuy ? 'trending_up' : 'trending_down'}
                      </span>
                      {isBuy ? t('trades.buy') : t('trades.sell')}
                    </span>
                  </td>
                  <td className="col-number">{toPersianDigits(trade.lotSize)}</td>
                  <td
                    className={`col-number ${trade.rMultiple > 0 ? 'text-primary' : trade.rMultiple < 0 ? 'text-error' : ''
                      }`}
                  >
                    {trade.rMultiple > 0 ? '+' : ''}
                    {toPersianDigits(trade.rMultiple.toFixed(1))}R
                  </td>
                  <td className={`col-profit ${profitClass}`}>
                    <span className="profit-usd">{formatCurrency(trade.profitUsd)}</span>
                    {language === 'fa' && (
                      <span className="profit-toman">{formatToman(trade.profitUsd, usdToToman)}</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {isMissed ? (
                      <span
                        className="material-symbols-outlined status-icon status-missed"
                        title={t('trades.statusMissed')}
                        style={{ color: '#9ca3af' }}
                      >
                        block
                      </span>
                    ) : (
                      <span
                        className={`material-symbols-outlined status-icon ${isClosed ? 'status-closed' : 'status-open'
                          }`}
                        title={isClosed ? t('trades.statusClosed') : t('trades.statusOpen')}
                      >
                        {isClosed ? 'check_circle' : 'sync'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {paginatedTrades.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                  {t('trades.searchNoResults')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
