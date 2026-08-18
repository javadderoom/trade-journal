'use client';

import React from 'react';
import { Trade } from './TradesTable';
import ConceptIcon from '../ui/ConceptIcon';
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
  const isEn = language === 'en';
  const sortIcon = (key: string) => {
    if (sortKey !== key) return isRtl ? 'arrow_upward' : 'arrow_downward';
    return sortDir === 'asc' ? (isRtl ? 'arrow_downward' : 'arrow_upward') : (isRtl ? 'arrow_upward' : 'arrow_downward');
  };

  const defaultCols = ['date', 'day', 'symbol', 'account', 'direction', 'volume', 'rr', 'pnl', 'status'];
  const [visibleCols, setVisibleCols] = React.useState<string[]>(defaultCols);
  const [isColsMenuOpen, setIsColsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem('desktop_table_columns');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVisibleCols(parsed);
        }
      } catch (e) {}
    }
  }, []);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsColsMenuOpen(false);
      }
    };
    if (isColsMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isColsMenuOpen]);

  const toggleCol = (colKey: string) => {
    setVisibleCols(prev => {
      const next = prev.includes(colKey) ? prev.filter(k => k !== colKey) : [...prev, colKey];
      localStorage.setItem('desktop_table_columns', JSON.stringify(next));
      return next;
    });
  };

  const colLabels: Record<string, string> = {
    date: t('trades.date'),
    day: t('trades.day'),
    symbol: t('trades.symbol'),
    account: t('trades.account'),
    direction: t('trades.direction'),
    volume: t('trades.volume'),
    rr: t('trades.rr'),
    pnl: t('trades.pnl'),
    status: t('trades.status')
  };

  return (
    <div className="table-section-container" style={{ position: 'relative' }}>
      
      {/* Column Visibility Toggle */}
      <div className="table-columns-toggle" ref={menuRef} style={{ position: 'absolute', top: '-40px', right: isRtl ? 'auto' : '16px', left: isRtl ? '16px' : 'auto', zIndex: 10 }}>
        <button 
          className="icon-button" 
          onClick={() => setIsColsMenuOpen(!isColsMenuOpen)}
          title={isEn ? 'Columns' : 'ستون‌ها'}
          style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>view_column</span>
        </button>
        {isColsMenuOpen && (
          <div className="columns-menu" style={{ 
            position: 'absolute', 
            top: '100%', 
            right: isRtl ? 'auto' : 0, 
            left: isRtl ? 0 : 'auto', 
            marginTop: '4px',
            background: 'var(--surface-color)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '8px', 
            padding: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            minWidth: '150px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', padding: '0 8px', color: 'var(--text-secondary)' }}>
              {isEn ? 'Visible Columns' : 'ستون‌های نمایشی'}
            </div>
            {Object.keys(colLabels).map(key => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', cursor: 'pointer', borderRadius: '4px' }} className="hover-bg">
                <input 
                  type="checkbox" 
                  checked={visibleCols.includes(key)}
                  onChange={() => toggleCol(key)}
                />
                <span style={{ fontSize: '13px' }}>{colLabels[key]}</span>
              </label>
            ))}
          </div>
        )}
      </div>

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
              {visibleCols.includes('date') && (
                <th className="sortable-th" onClick={() => onSort('date')}>
                  {t('trades.date')} <span className="material-symbols-outlined sort-icon">{sortIcon('date')}</span>
                </th>
              )}
              {visibleCols.includes('day') && <th>{t('trades.day')}</th>}
              {visibleCols.includes('symbol') && (
                <th className="sortable-th" onClick={() => onSort('symbol')}>
                  {t('trades.symbol')} <span className="material-symbols-outlined sort-icon">{sortIcon('symbol')}</span>
                </th>
              )}
              {visibleCols.includes('account') && <th>{t('trades.account')}</th>}
              {visibleCols.includes('direction') && (
                <th className="sortable-th" onClick={() => onSort('direction')}>
                  {t('trades.direction')} <span className="material-symbols-outlined sort-icon">{sortIcon('direction')}</span>
                </th>
              )}
              {visibleCols.includes('volume') && (
                <th className="sortable-th" onClick={() => onSort('volume')}>
                  {t('trades.volume')} <span className="material-symbols-outlined sort-icon">{sortIcon('volume')}</span>
                </th>
              )}
              {visibleCols.includes('rr') && (
                <th className="sortable-th" onClick={() => onSort('rr')}>
                  {t('trades.rr')} <span className="material-symbols-outlined sort-icon">{sortIcon('rr')}</span>
                </th>
              )}
              {visibleCols.includes('pnl') && (
                <th className="sortable-th" style={{ textAlign: 'left' }} onClick={() => onSort('pnl')}>
                  {t('trades.pnl')} <span className="material-symbols-outlined sort-icon">{sortIcon('pnl')}</span>
                </th>
              )}
              {visibleCols.includes('status') && <th style={{ textAlign: 'center' }}>{t('trades.status')}</th>}
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

              // Render setup instead of tags
              const setup = trade.setup?.concept;


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
                  {visibleCols.includes('date') && (
                    <td className="col-time">
                      <span className="date-value">{formatDate(trade.openTime, selectedTimezone).date}</span>
                      {trade.closeTime && (
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>logout</span>
                          {t('trades.exit')}: {formatDate(trade.closeTime, selectedTimezone).date}
                        </div>
                      )}
                    </td>
                  )}
                  {visibleCols.includes('day') && (
                    <td>
                      <div className="day-session-wrapper">
                        <span className="day-badge">{formatDate(trade.openTime, selectedTimezone).day}</span>
                        {(() => {
                          const sess = getTradingSession(trade.openTime, trade.annotation?.session);
                          return (
                            <span className={`session-badge ${sess.className}`} title={sess.label}>
                              {sess.emoji} {sess.label}
                            </span>
                          );
                        })()}
                      </div>
                    </td>
                  )}
                  {visibleCols.includes('symbol') && (
                    <td className="col-symbol">
                      <div className="symbol-cell-content">
                        <span className="symbol-name">{trade.symbol}</span>
                        {(trade.annotation?.emotion || setup || (trade.triggers && trade.triggers.length > 0) || (trade.confluences && trade.confluences.length > 0)) && (
                          <div className="symbol-metadata" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                            {trade.annotation?.emotion && (
                              <span className={`emotion-mini-badge emotion-${trade.annotation?.emotion.toLowerCase()}`} title={`${t('trades.emotion')}: ${getEmotionLabel(trade.annotation?.emotion, allEmotions)}`}>
                                {getEmotionEmoji(trade.annotation?.emotion, allEmotions)} {getEmotionLabel(trade.annotation?.emotion, allEmotions)}
                              </span>
                            )}
                            {setup && (
                              <span key={setup.id} className="tag-mini-pill" style={{ borderLeft: `3px solid ${setup.color || '#3b82f6'}`, backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                {setup.icon && <ConceptIcon icon={setup.icon} size={12} />}
                                {setup.name}
                              </span>
                            )}
                            {trade.triggers && trade.triggers.map((t, idx) => (
                              <span key={`trigger-${idx}`} className="tag-mini-pill" style={{ border: `1px solid ${t.concept.color || '#f59e0b'}`, backgroundColor: 'rgba(245, 158, 11, 0.05)', padding: '1px 5px', borderRadius: '4px', fontSize: '11px', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                {t.concept.icon ? (
                                  <ConceptIcon icon={t.concept.icon} size={12} style={{ color: t.concept.color || '#f59e0b' }} />
                                ) : (
                                  <span className="material-symbols-outlined" style={{ fontSize: '12px', color: t.concept.color || '#f59e0b' }}>bolt</span>
                                )}
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
                        )}
                      </div>
                    </td>
                  )}
                  {visibleCols.includes('account') && (
                    <td>
                      {(() => {
                        const account = accounts.find(a => a.id === trade.accountId);
                        return account
                          ? `${account.broker_name || 'MT5'} (${account.account_number || account.id})`
                          : (trade.accountId === 'dev-account' ? t('trades.defaultAccount') : '-');
                      })()}
                    </td>
                  )}
                  {visibleCols.includes('direction') && (
                    <td>
                      <span className={`direction-badge ${isBuy ? 'buy' : 'sell'}`}>
                        <span className="material-symbols-outlined badge-icon">
                          {isBuy ? 'trending_up' : 'trending_down'}
                        </span>
                        {isBuy ? t('trades.buy') : t('trades.sell')}
                      </span>
                    </td>
                  )}
                  {visibleCols.includes('volume') && <td className="col-number">{toPersianDigits(trade.lotSize)}</td>}
                  {visibleCols.includes('rr') && (
                    <td
                      className={`col-number ${trade.rMultiple > 0 ? 'text-primary' : trade.rMultiple < 0 ? 'text-error' : ''
                        }`}
                    >
                      {trade.rMultiple > 0 ? '+' : ''}
                      {toPersianDigits(trade.rMultiple.toFixed(1))}R
                    </td>
                  )}
                  {visibleCols.includes('pnl') && (
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
                  )}
                  {visibleCols.includes('status') && (
                    <td style={{ textAlign: 'center' }}>
                        <span className={`material-symbols-outlined status-icon ${isClosed ? 'status-closed' : 'status-open'}`} title={isClosed ? t('trades.closed') : t('trades.open')}>
                          {isClosed ? 'check_circle' : 'timelapse'}
                        </span>
                    </td>
                  )}
                </tr>
              );
            })}
            {paginatedTrades.length === 0 && (
              <tr>
                <td colSpan={visibleCols.length + 1} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
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
