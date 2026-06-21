'use client';

import React from 'react';
import { Trade } from './TradesTable';
import { toPersianDigits, formatPersianCurrency, formatToman } from '../../utils/farsi';
import {
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
  allEmotions: { value: string; label: string }[];
  accounts?: any[];
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
}: DesktopTableProps) {
  const formatCurrency = (val: number) => {
    return formatPersianCurrency(val);
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
              <th className="sortable-th">
                تاریخ <span className="material-symbols-outlined sort-icon">arrow_downward</span>
              </th>
              <th>روز</th>
              <th>نماد</th>
              <th>حساب</th>
              <th>جهت</th>
              <th>حجم</th>
              <th>R:R</th>
              <th style={{ textAlign: 'left' }}>سود/زیان</th>
              <th style={{ textAlign: 'center' }}>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTrades.map(trade => {
              const isBuy = trade.direction === 'BUY';
              const isClosed = trade.closeTime !== null;
              const isActive = trade.id === activeTradeId;

              // P&L color logic
              const isMissed = trade.tags?.includes('فرصت از دست رفته') || trade.tags?.includes('Missed');
              let profitClass = 'profit-zero';
              if (trade.profitUsd > 0) profitClass = 'profit-positive';
              else if (trade.profitUsd < 0) profitClass = 'profit-negative';
              if (!isClosed) profitClass = 'profit-open';
              if (isMissed) profitClass = 'profit-missed';

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
                        خروج: {formatDate(trade.closeTime, selectedTimezone).date}
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
                      {(trade.emotion || (trade.tags && trade.tags.length > 0)) && (
                        <div className="symbol-metadata">
                          {trade.emotion && (
                            <span className={`emotion-mini-badge emotion-${trade.emotion.toLowerCase()}`} title={`احساس: ${getEmotionLabel(trade.emotion, allEmotions)}`}>
                              {getEmotionEmoji(trade.emotion)} {getEmotionLabel(trade.emotion, allEmotions)}
                            </span>
                          )}
                          {trade.tags && trade.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="tag-mini-pill">
                              {tag}
                            </span>
                          ))}
                          {trade.tags && trade.tags.length > 2 && (
                            <span className="tag-mini-more" title={trade.tags.slice(2).join('، ')}>
                              +{toPersianDigits(trade.tags.length - 2)}
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
                        : (trade.accountId === 'dev-account' ? 'حساب پیش‌فرض' : '-');
                    })()}
                  </td>
                  <td>
                    <span className={`direction-badge ${isBuy ? 'buy' : 'sell'}`}>
                      <span className="material-symbols-outlined badge-icon">
                        {isBuy ? 'trending_up' : 'trending_down'}
                      </span>
                      {isBuy ? 'خرید' : 'فروش'}
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
                    <span className="profit-toman">{formatToman(trade.profitUsd, usdToToman)}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {isMissed ? (
                      <span
                        className="material-symbols-outlined status-icon status-missed"
                        title="فرصت از دست رفته"
                        style={{ color: '#9ca3af' }}
                      >
                        block
                      </span>
                    ) : (
                      <span
                        className={`material-symbols-outlined status-icon ${isClosed ? 'status-closed' : 'status-open'
                          }`}
                        title={isClosed ? 'بسته شده' : 'باز'}
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
                  معامله‌ای یافت نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
