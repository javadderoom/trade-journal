'use client';

import React, { useState, useEffect, useMemo } from 'react';
import './trades.scss';
import { toPersianDigits, formatPersianCurrency } from '../utils/farsi';

export interface Trade {
  id: string;
  ticket?: number | null;
  symbol: string;
  direction: 'BUY' | 'SELL';
  openTime: string;
  closeTime: string | null;
  openPrice: number;
  closePrice: number | null;
  lotSize: number;
  stopLoss: number | null;
  takeProfit: number | null;
  profitUsd: number;
  commission: number;
  swap: number;
  pips: number;
  rMultiple: number;
  tags: string[];
  setupName: string | null;
  emotion: 'FOMO' | 'CONFIDENT' | 'NEUTRAL' | 'ANXIOUS' | 'REVENGE' | null;
  notes: string | null;
}

interface TradesTableProps {
  initialTrades: Trade[];
  onRefresh?: () => void;
  onImportMT4?: () => void;
  onAddManualTrade?: () => void;
  onUpdateTrade?: (updatedTrade: Trade) => Promise<boolean>;
  onDeleteTrade?: (tradeId: string) => Promise<boolean>;
}

export default function TradesTable({
  initialTrades,
  onRefresh,
  onImportMT4,
  onAddManualTrade,
  onUpdateTrade,
  onDeleteTrade,
}: TradesTableProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTrades, setSelectedTrades] = useState<Set<string>>(new Set());
  const [activeTradeId, setActiveTradeId] = useState<string | null>(null);

  // Filter states
  const [dateRange, setDateRange] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('همه نمادها');
  const [selectedDirection, setSelectedDirection] = useState('همه جهت‌ها');
  const [selectedStrategy, setSelectedStrategy] = useState('همه استراتژی‌ها');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sync initialTrades to state
  useEffect(() => {
    setTrades(initialTrades);
  }, [initialTrades]);

  // Extract unique filter options
  const symbolOptions = useMemo(() => {
    const symbols = new Set<string>();
    trades.forEach(t => symbols.add(t.symbol));
    return ['همه نمادها', ...Array.from(symbols)];
  }, [trades]);

  const strategyOptions = useMemo(() => {
    const strategies = new Set<string>();
    trades.forEach(t => {
      if (t.setupName) strategies.add(t.setupName);
    });
    return ['همه استراتژی‌ها', ...Array.from(strategies)];
  }, [trades]);

  // Handle active trade details editing
  const activeTrade = useMemo(() => {
    return trades.find(t => t.id === activeTradeId) || null;
  }, [trades, activeTradeId]);

  // Filtered trades
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      // Symbol filter
      if (selectedSymbol !== 'همه نمادها' && trade.symbol !== selectedSymbol) {
        return false;
      }
      // Direction filter
      if (selectedDirection !== 'همه جهت‌ها') {
        const dir = selectedDirection === 'خرید (Buy)' ? 'BUY' : 'SELL';
        if (trade.direction !== dir) return false;
      }
      // Strategy filter
      if (selectedStrategy !== 'همه استراتژی‌ها' && trade.setupName !== selectedStrategy) {
        return false;
      }
      // Date filter (simple substring match for now)
      if (dateRange && !trade.openTime.includes(dateRange)) {
        return false;
      }
      return true;
    });
  }, [trades, selectedSymbol, selectedDirection, selectedStrategy, dateRange]);

  // Summary Metrics
  const summary = useMemo(() => {
    const count = filteredTrades.length;
    const wins = filteredTrades.filter(t => t.profitUsd > 0).length;
    const winRate = count > 0 ? Math.round((wins / count) * 100) : 0;
    const totalProfit = filteredTrades.reduce((sum, t) => sum + t.profitUsd, 0);
    return { count, winRate, totalProfit };
  }, [filteredTrades]);

  // Paginated trades
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTrades.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTrades, currentPage]);

  const totalPages = Math.max(Math.ceil(filteredTrades.length / itemsPerPage), 1);

  // Handle pagination navigation
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Row checkbox selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const ids = paginatedTrades.map(t => t.id);
      setSelectedTrades(new Set(ids));
    } else {
      setSelectedTrades(new Set());
    }
  };

  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    e.stopPropagation(); // Avoid opening the detail panel
    const newSelected = new Set(selectedTrades);
    if (e.target.checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedTrades(newSelected);
  };

  // Handle saving details from the panel
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrade) return;

    if (onUpdateTrade) {
      const success = await onUpdateTrade(activeTrade);
      if (success) {
        alert('تغییرات با موفقیت ذخیره شد.');
      }
    } else {
      // Local updates if no callback
      alert('تغییرات به صورت محلی ذخیره شد.');
    }
  };

  // Handle deleting a trade
  const handleDeleteClick = async () => {
    if (!activeTradeId) return;
    const confirmDelete = window.confirm('آیا از حذف این معامله اطمینان دارید؟');
    if (!confirmDelete) return;

    let success = true;
    if (onDeleteTrade) {
      success = await onDeleteTrade(activeTradeId);
    }

    if (success) {
      setTrades(prev => prev.filter(t => t.id !== activeTradeId));
      setSelectedTrades(prev => {
        const next = new Set(prev);
        next.delete(activeTradeId);
        return next;
      });
      setActiveTradeId(null);
    }
  };

  // Format Helper for Currency & P&L
  const formatCurrency = (val: number) => {
    return formatPersianCurrency(val);
  };

  const PERSIAN_DAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

  // Returns { date: '۱۴۰۵/۰۳/۲۵ - ۱۳:۳۰', day: 'دوشنبه' }
  const formatDate = (dateStr: string): { date: string; day: string } => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { date: dateStr, day: '' };

      const pad = (num: number) => String(num).padStart(2, '0');
      const year = d.getFullYear();
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());

      return {
        date: toPersianDigits(`${year}/${month}/${day} - ${hours}:${minutes}`),
        day: PERSIAN_DAYS[d.getDay()],
      };
    } catch {
      return { date: toPersianDigits(dateStr), day: '' };
    }
  };

  // Form field update handlers for active trade
  const updateActiveTradeField = (key: keyof Trade, value: any) => {
    if (!activeTradeId) return;
    setTrades(prev =>
      prev.map(t => (t.id === activeTradeId ? { ...t, [key]: value } : t))
    );
  };

  return (
    <div className="trades-workspace">
      {/* Center Main Column */}
      <div className="trades-main-content">
        {/* 1. Header */}
        <header className="trades-page-header">
          <h1>معاملات</h1>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={onImportMT4}>
              <span className="material-symbols-outlined">cloud_download</span>
              واردات MT4
            </button>
            <button className="btn btn-primary" onClick={onAddManualTrade}>
              <span className="material-symbols-outlined">add</span>
              ثبت معامله دستی
            </button>
          </div>
        </header>

        {/* 2. Filter Bar */}
        <div className="filters-bar">
          <div className="filter-input-wrapper">
            <span className="material-symbols-outlined filter-icon">calendar_today</span>
            <input
              type="text"
              placeholder="جستجو تاریخ..."
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
            />
          </div>

          <div className="filter-select-wrapper">
            <select value={selectedSymbol} onChange={e => setSelectedSymbol(e.target.value)}>
              {symbolOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined select-arrow">keyboard_arrow_down</span>
          </div>

          <div className="filter-select-wrapper">
            <select value={selectedDirection} onChange={e => setSelectedDirection(e.target.value)}>
              <option value="همه جهت‌ها">همه جهت‌ها</option>
              <option value="خرید (Buy)">خرید (Buy)</option>
              <option value="فروش (Sell)">فروش (Sell)</option>
            </select>
            <span className="material-symbols-outlined select-arrow">keyboard_arrow_down</span>
          </div>

          <div className="filter-select-wrapper">
            <select value={selectedStrategy} onChange={e => setSelectedStrategy(e.target.value)}>
              {strategyOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined select-arrow">keyboard_arrow_down</span>
          </div>

          <div className="filter-actions">
            <button
              className="icon-btn"
              title="پاک کردن فیلترها"
              onClick={() => {
                setDateRange('');
                setSelectedSymbol('همه نمادها');
                setSelectedDirection('همه جهت‌ها');
                setSelectedStrategy('همه استراتژی‌ها');
              }}
            >
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button className="icon-btn" title="بروزرسانی" onClick={onRefresh}>
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </div>

        {/* 3. Summary Bar */}
        <div className="summary-bar">
          <div className="summary-card">
            <div className="dot dot-secondary"></div>
            <span className="label">تعداد:</span>
            <span className="value">
              {toPersianDigits(summary.count)} <span className="unit">معامله</span>
            </span>
          </div>
          <div className="summary-card">
            <div className="dot dot-primary"></div>
            <span className="label">وین‌ریت:</span>
            <span className="value" style={{ color: '#61f9b1' }}>
              {toPersianDigits(summary.winRate)}٪
            </span>
          </div>
          <div className="summary-card glow-profit-card">
            <span className="material-symbols-outlined card-icon">account_balance_wallet</span>
            <span className="label">مجموع سود:</span>
            <span className="value" dir="ltr">
              {formatCurrency(summary.totalProfit)}
            </span>
          </div>
        </div>

        {/* 4. Trade Table */}
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
                  <th>نماد</th>
                  <th>جهت</th>
                  <th>حجم</th>
                  <th>R</th>
                  <th style={{ textAlign: 'left' }}>سود/زیان</th>
                  <th style={{ textAlign: 'center' }}>استراتژی</th>
                  <th style={{ textAlign: 'center' }}>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrades.map(trade => {
                  const isBuy = trade.direction === 'BUY';
                  const isClosed = trade.closeTime !== null;
                  const isActive = trade.id === activeTradeId;
                  
                  // P&L color logic
                  let profitClass = 'profit-zero';
                  if (trade.profitUsd > 0) profitClass = 'profit-positive';
                  else if (trade.profitUsd < 0) profitClass = 'profit-negative';
                  if (!isClosed) profitClass = 'profit-open';

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
                        <span className="date-value">{formatDate(trade.openTime).date}</span>
                        <span className="day-badge">{formatDate(trade.openTime).day}</span>
                      </td>
                      <td className="col-symbol">{trade.symbol}</td>
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
                        className={`col-number ${
                          trade.rMultiple > 0 ? 'text-primary' : trade.rMultiple < 0 ? 'text-error' : ''
                        }`}
                      >
                        {trade.rMultiple > 0 ? '+' : ''}
                        {toPersianDigits(trade.rMultiple.toFixed(1))}R
                      </td>
                      <td className={`col-profit ${profitClass}`}>
                        {formatCurrency(trade.profitUsd)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {trade.setupName ? (
                          <span className="strategy-badge">{trade.setupName}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`material-symbols-outlined status-icon ${
                            isClosed ? 'status-closed' : 'status-open'
                          }`}
                          title={isClosed ? 'بسته شده' : 'باز'}
                        >
                          {isClosed ? 'check_circle' : 'sync'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {paginatedTrades.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                      معامله‌ای یافت نشد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Pagination */}
        <div className="pagination-container">
          <div>
            نمایش {toPersianDigits((currentPage - 1) * itemsPerPage + 1)} تا{' '}
            {toPersianDigits(Math.min(currentPage * itemsPerPage, filteredTrades.length))} از {toPersianDigits(filteredTrades.length)}{' '}
            معامله
          </div>
          <div className="pagination-actions">
            <button
              className="nav-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="material-symbols-outlined btn-icon">arrow_forward</span>
              قبلی
            </button>
            <span className="page-indicator">
              صفحه {toPersianDigits(currentPage)} از {toPersianDigits(totalPages)}
            </span>
            <button
              className="nav-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              بعدی
              <span className="material-symbols-outlined btn-icon">arrow_back</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. Slide-out Detail Panel */}
      {activeTrade && (
        <aside className="detail-panel">
          {/* Panel Header */}
          <div className="panel-header">
            <div className="header-info">
              <div
                className={`icon-wrapper ${
                  activeTrade.direction === 'SELL' ? 'sell-icon-wrapper' : ''
                }`}
              >
                <span className="material-symbols-outlined dir-icon">
                  {activeTrade.direction === 'BUY' ? 'trending_up' : 'trending_down'}
                </span>
              </div>
              <div className="title-text">
                <h2>{activeTrade.symbol}</h2>
                <p dir="ltr">
                  {activeTrade.direction === 'BUY' ? 'Buy' : 'Sell'} {toPersianDigits(activeTrade.lotSize)} Lots
                </p>
              </div>
            </div>
            <button className="close-btn" onClick={() => setActiveTradeId(null)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Panel Content */}
          <div className="panel-body">
            {/* Financial Summary Box */}
            <div
              className={`financial-box ${
                activeTrade.profitUsd < 0 ? 'loss-box' : ''
              }`}
            >
              <div className="box-bar"></div>
              <div className="box-header">
                <span className="label">سود خالص (P&L)</span>
                <span className="status">
                  {activeTrade.closeTime ? 'بسته شده' : 'باز'}
                </span>
              </div>
              <div className="pnl-value">
                {formatCurrency(activeTrade.profitUsd)}
              </div>
              <div className="metrics-grid">
                <div className="metric-item">
                  <span className="stat-label">پیپ</span>
                  <span className="stat-value">
                    {activeTrade.pips > 0 ? '+' : ''}
                    {toPersianDigits(activeTrade.pips.toFixed(1))}
                  </span>
                </div>
                <div className="divider"></div>
                <div className="metric-item">
                  <span className="stat-label">ریسک به ریوارد</span>
                  <span className="stat-value">
                    {activeTrade.rMultiple > 0 ? '+' : ''}
                    {toPersianDigits(activeTrade.rMultiple.toFixed(1))}R
                  </span>
                </div>
              </div>
            </div>

            {/* Execution Details */}
            <div className="details-section">
              <h3>جزئیات اجرا</h3>
              <div className="details-grid">
                <span className="grid-label">زمان ورود:</span>
                <span className="grid-value direction-ltr">
                  {formatDate(activeTrade.openTime).date}
                </span>

                <span className="grid-label">قیمت ورود:</span>
                <span className="grid-value font-mono direction-ltr">
                  {toPersianDigits(activeTrade.openPrice.toFixed(5).replace(/\.?0+$/, ''))}
                </span>

                <span className="grid-label">حد ضرر (SL):</span>
                <span className="grid-value font-mono direction-ltr value-negative">
                  {activeTrade.stopLoss ? toPersianDigits(activeTrade.stopLoss.toFixed(5).replace(/\.?0+$/, '')) : '-'}
                </span>

                <span className="grid-label">حد سود (TP):</span>
                <span className="grid-value font-mono direction-ltr value-positive">
                  {activeTrade.takeProfit ? toPersianDigits(activeTrade.takeProfit.toFixed(5).replace(/\.?0+$/, '')) : '-'}
                </span>

                {activeTrade.closeTime && (
                  <>
                    <span className="grid-label">زمان خروج:</span>
                    <span className="grid-value direction-ltr">
                      {formatDate(activeTrade.closeTime).date}
                    </span>

                    <span className="grid-label">قیمت خروج:</span>
                    <span className="grid-value font-mono direction-ltr">
                      {activeTrade.closePrice ? toPersianDigits(activeTrade.closePrice.toFixed(5).replace(/\.?0+$/, '')) : '-'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Strategy & Emotions */}
            <div className="form-group">
              <label>استراتژی اعمال شده</label>
              <select
                value={activeTrade.setupName || ''}
                onChange={e => updateActiveTradeField('setupName', e.target.value || null)}
              >
                <option value="">-- بدون استراتژی --</option>
                <option value="پرایس اکشن">پرایس اکشن</option>
                <option value="شکست ساختار">شکست ساختار</option>
                <option value="روند گیری">روند گیری</option>
                <option value="اسکالپ">اسکالپ</option>
              </select>
            </div>

            <div className="form-group">
              <label>برچسب‌های احساسی</label>
              <div className="tags-container">
                {activeTrade.emotion && (
                  <span className="tag">
                    <span className="material-symbols-outlined tag-icon">
                      {activeTrade.emotion === 'CONFIDENT' ? 'verified' : 'self_improvement'}
                    </span>
                    {activeTrade.emotion === 'CONFIDENT' && 'با اطمینان'}
                    {activeTrade.emotion === 'FOMO' && 'FOMO'}
                    {activeTrade.emotion === 'NEUTRAL' && 'آرام/خنثی'}
                    {activeTrade.emotion === 'ANXIOUS' && 'مضطرب'}
                    {activeTrade.emotion === 'REVENGE' && 'انتقام'}
                  </span>
                )}
                <button
                  className="add-tag-btn"
                  onClick={() => {
                    const emotions: Array<Trade['emotion']> = [
                      'CONFIDENT',
                      'FOMO',
                      'NEUTRAL',
                      'ANXIOUS',
                      'REVENGE',
                    ];
                    const currentIdx = activeTrade.emotion ? emotions.indexOf(activeTrade.emotion) : -1;
                    const nextIdx = (currentIdx + 1) % (emotions.length + 1);
                    const nextEmotion = nextIdx === emotions.length ? null : emotions[nextIdx];
                    updateActiveTradeField('emotion', nextEmotion);
                  }}
                >
                  <span className="material-symbols-outlined btn-icon">add</span>
                  {activeTrade.emotion ? 'تغییر احساس' : 'افزودن احساس'}
                </button>
              </div>
            </div>

            {/* Notes Area */}
            <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label>یادداشت‌های ژورنال</label>
              <textarea
                placeholder="دلیل ورود به این معامله چه بود؟ شرایط بازار چگونه بود...؟"
                value={activeTrade.notes || ''}
                onChange={e => updateActiveTradeField('notes', e.target.value)}
              />
            </div>
          </div>

          {/* Panel Footer Actions */}
          <div className="panel-footer">
            <button className="btn-save" onClick={handleSaveDetails}>
              ذخیره تغییرات
            </button>
            <button className="btn-delete" onClick={handleDeleteClick} title="حذف معامله">
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
