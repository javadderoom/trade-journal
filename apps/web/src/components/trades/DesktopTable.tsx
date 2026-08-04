'use client';

import React from 'react';
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
  tradingConcepts: any[];
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
  tradingConcepts,
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
              // P&L color logic
              // const isMissed = false; // Add missed status logic later if needed
              const netPnl = getNetPnl(trade);
              let profitClass = 'profit-zero';
              if (netPnl > 0) profitClass = 'profit-positive';
              else if (netPnl < 0) profitClass = 'profit-negative';
              if (!isClosed) profitClass = 'profit-open';
              // if (isMissed) profitClass = 'profit-missed';

              const account = accounts.find(a => a.id === trade.accountId);
              const initialBalance = account?.initial_balance || 0;
              const pnlPercent = initialBalance > 0 ? (netPnl / initialBalance) * 100 : null;

              // Render setups instead of tags
              const setups = trade.setups?.map((s: any) => s.concept) || [];


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
                    </div>
                  </td>
                  <td className="col-symbol">
                    <div className="symbol-cell-content">
                      <span className="symbol-name">{trade.symbol}</span>
                      {(trade.annotation?.emotion || setups.length > 0) && (
                        <div className="symbol-metadata">
                          {trade.annotation?.emotion && (
                            <span className={`emotion-mini-badge emotion-${trade.annotation?.emotion.toLowerCase()}`} title={`${t('trades.emotion')}: ${getEmotionLabel(trade.annotation?.emotion, allEmotions)}`}>
                              {getEmotionEmoji(trade.annotation?.emotion, allEmotions)} {getEmotionLabel(trade.annotation?.emotion, allEmotions)}
                            </span>
                          )}
                          {setups.slice(0, 2).map((setup: any) => {
                            return (
                              <span key={setup.id} className="tag-mini-pill important" style={{ borderLeft: `2px solid ${setup.color || '#3b82f6'}` }}>
                                {setup.name}
                              </span>
                            );
                          })}
                          {setups.length > 2 && (
                            <span className="tag-mini-more" title={setups.slice(2).map((s:any) => s.name).join(', ')}>
                              +{toPersianDigits(setups.length - 2)}
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
                  </td>
                  <td style={{ textAlign: 'center' }}>
                      <span className={`status-icon ${isClosed ? 'status-closed' : 'status-open'}`} title={isClosed ? t('trades.closed') : t('trades.open')}>
                        {isClosed ? 'check_circle' : 'timelapse'}
                      </span>
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
