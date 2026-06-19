'use client';

import React, { useState, useEffect, useMemo } from 'react';
import './trades.scss';
import { toPersianDigits, formatPersianCurrency, formatToman } from '../utils/farsi';
import Select from './Select';
import TradeChart from './TradeChart';

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

  emotion: string | null;
  notes: string | null;
  screenshots?: string[];
  chartData?: any;
}

interface TradesTableProps {
  initialTrades: Trade[];
  initialUsdToToman?: number;
  onRefresh?: () => void;
  onImportMT4?: () => void;
  onAddManualTrade?: () => void;
  onUpdateTrade?: (updatedTrade: Trade) => Promise<boolean>;
  onDeleteTrade?: (tradeId: string) => Promise<boolean>;
}


const DEFAULT_TAGS = [
  'پرایس اکشن',       // Price Action
  'شکست ساختار',     // Structure Break
  'برگشت از حمایت',  // Support Bounce
  'برگشت از مقاومت', // Resistance Bounce
  'روند گیری',        // Trend Following
  'واگرایی',          // Divergence
  'اسکالپ',           // Scalp
  'سوئینگ',           // Swing
  'خبری',             // News-based
  'تله خرسی',         // Bear Trap
  'تله گاوی',         // Bull Trap
  'نقض قانون',        // Rule Break
  'مدیریت خوب',      // Good Management
  'خروج زود',         // Early Exit
  'حجم اضافه',        // Oversize
];

const DEFAULT_EMOTIONS = [
  { value: 'CONFIDENT', label: 'با اطمینان' },
  { value: 'NEUTRAL', label: 'آرام/خنثی' },
  { value: 'ANXIOUS', label: 'مضطرب' },
  { value: 'FOMO', label: 'FOMO' },
  { value: 'REVENGE', label: 'انتقام' },
];

const getEmotionEmoji = (emotion: string | null): string => {
  switch (emotion) {
    case 'CONFIDENT': return '😌';
    case 'NEUTRAL': return '😐';
    case 'ANXIOUS': return '😰';
    case 'FOMO': return '🎯';
    case 'REVENGE': return '😡';
    default: return '💭';
  }
};

const getEmotionLabel = (emotion: string | null, emotionsList: { value: string; label: string }[]): string => {
  if (!emotion) return '';
  const found = emotionsList.find(e => e.value === emotion);
  return found ? found.label : emotion;
};

export default function TradesTable({
  initialTrades,
  initialUsdToToman = 90_000,
  onRefresh,
  onImportMT4,
  onAddManualTrade,
  onUpdateTrade,
  onDeleteTrade,
}: TradesTableProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTrades, setSelectedTrades] = useState<Set<string>>(new Set());
  const [activeTradeId, setActiveTradeId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Filter states
  const [dateRange, setDateRange] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('همه نمادها');
  const [selectedDirection, setSelectedDirection] = useState('همه جهت‌ها');
  const [selectedStrategy, setSelectedStrategy] = useState('همه استراتژی‌ها');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isAddingEmotion, setIsAddingEmotion] = useState(false);
  const [allEmotions, setAllEmotions] = useState<{ value: string; label: string }[]>(DEFAULT_EMOTIONS);
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Tehran');

  const [activeTab, setActiveTab] = useState<'stats' | 'journal'>('stats');

  // Reset active tab to stats whenever activeTradeId changes
  useEffect(() => {
    setActiveTab('stats');
  }, [activeTradeId]);

  // USD → Toman exchange rate (pre-filled from live Navasan rate, user-editable)
  const [usdToToman, setUsdToToman] = useState<number>(initialUsdToToman);

  // Sync when parent delivers the live rate after async fetch
  useEffect(() => {
    setUsdToToman(initialUsdToToman);
  }, [initialUsdToToman]);

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

  // const strategyOptions = useMemo(() => {
  //   const strategies = new Set<string>();
  //   trades.forEach(t => {
  //     if (t.setupName) strategies.add(t.setupName);
  //   });
  //   return ['همه استراتژی‌ها', ...Array.from(strategies)];
  // }, [trades]);

  const [allTags, setAllTags] = useState<string[]>(DEFAULT_TAGS);

  // Seed allTags from trades once they load — only ever adds, never removes
  useEffect(() => {
    if (trades.length === 0) return;
    setAllTags(prev => {
      const set = new Set(prev);
      trades.forEach(t => {
        if (t.tags && Array.isArray(t.tags)) {
          t.tags.forEach(tag => { if (tag) set.add(tag); });
        }
      });
      return Array.from(set);
    });
  }, [trades]);

  // Seed allEmotions from trades once they load — only ever adds, never removes
  useEffect(() => {
    if (trades.length === 0) return;
    setAllEmotions(prev => {
      const existingValues = new Set(prev.map(e => e.value));
      const updated = [...prev];
      trades.forEach(t => {
        if (t.emotion && !existingValues.has(t.emotion)) {
          existingValues.add(t.emotion);
          updated.push({ value: t.emotion, label: t.emotion });
        }
      });
      return updated;
    });
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
      // // Strategy filter
      // if (selectedStrategy !== 'همه استراتژی‌ها' && trade.setupName !== selectedStrategy) {
      //   return false;
      // }
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

  // Handle uploading a screenshot
  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTrade || !activeTrade.ticket) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('screenshot', file);

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
      const res = await fetch(`${baseUrl}/api/trades/${activeTrade.ticket}/screenshots`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      if (data?.screenshots) {
        updateActiveTradeField('screenshots', data.screenshots);
      }
    } catch (err) {
      console.error('Failed to upload screenshot:', err);
      alert('خطا در بارگذاری تصویر. لطفا دوباره تلاش کنید.');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  // Handle deleting a screenshot
  const handleDeleteScreenshot = async (url: string) => {
    if (!activeTrade || !activeTrade.ticket) return;
    const confirmDelete = window.confirm('آیا از حذف این تصویر اطمینان دارید؟');
    if (!confirmDelete) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
      const res = await fetch(`${baseUrl}/api/trades/${activeTrade.ticket}/screenshots`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        throw new Error('Deletion failed');
      }

      const data = await res.json();
      if (data?.screenshots) {
        updateActiveTradeField('screenshots', data.screenshots);
      }
    } catch (err) {
      console.error('Failed to delete screenshot:', err);
      alert('خطا در حذف تصویر. لطفا دوباره تلاش کنید.');
    }
  };

  // Format Helper for Currency & P&L
  const formatCurrency = (val: number) => {
    return formatPersianCurrency(val);
  };

  // Returns { date: '۱۴۰۵/۰۳/۲۵ - ۱۳:۳۰', day: 'دوشنبه' } in selected timezone
  const formatDate = (dateStr: string, timezone: string = selectedTimezone): { date: string; day: string } => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { date: dateStr, day: '' };

      // Format parts using Intl in the selected timezone
      const formatter = new Intl.DateTimeFormat('fa-IR', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const formatted = formatter.format(d);
      // Clean up separator formatted by Intl
      const cleanedDate = formatted.replace('،', ' -').replace(',', ' -');

      // Get day of week
      const dayFormatter = new Intl.DateTimeFormat('fa-IR', {
        timeZone: timezone,
        weekday: 'long'
      });
      const dayLabel = dayFormatter.format(d);

      return {
        date: cleanedDate,
        day: dayLabel,
      };
    } catch {
      return { date: toPersianDigits(dateStr), day: '' };
    }
  };

  const getTradingSession = (dateStr: string): { name: string; label: string; emoji: string; className: string } => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return { name: 'UNKNOWN', label: 'نامشخص', emoji: '❓', className: 'session-unknown' };
      }

      // 0. Check if the trade occurred on a weekend (Forex market closed)
      // Forex market closes Friday 5:00 PM NY time and opens Sunday 5:00 PM NY time.
      const getNYDateTime = (date: Date) => {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          weekday: 'short',
          hour: 'numeric',
          hour12: false,
        });
        const formatted = formatter.format(date);
        const match = formatted.match(/^([A-Za-z]+),\s*(\d+)$/);
        if (!match) return { weekday: '', hour: 0 };
        return { weekday: match[1], hour: parseInt(match[2], 10) };
      };

      const nyInfo = getNYDateTime(d);
      if (
        (nyInfo.weekday === 'Fri' && nyInfo.hour >= 17) ||
        nyInfo.weekday === 'Sat' ||
        (nyInfo.weekday === 'Sun' && nyInfo.hour < 17)
      ) {
        return { name: 'WEEKEND', label: 'آخر هفته (بسته)', emoji: '💤', className: 'session-weekend' };
      }

      // Helper to fetch the local hour in a specific timezone
      const getHourInTimezone = (tz: string): number => {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          hour: '2-digit',
          hour12: false,
        });
        return parseInt(formatter.format(d), 10);
      };

      const nyHour = getHourInTimezone('America/New_York');
      const londonHour = getHourInTimezone('Europe/London');
      const tokyoHour = getHourInTimezone('Asia/Tokyo');
      const sydneyHour = getHourInTimezone('Australia/Sydney');

      // Standard financial session hours (local time):
      // Sydney: 7:00 AM - 4:00 PM (7 to 16)
      // Tokyo: 9:00 AM - 6:00 PM (9 to 18)
      // London: 8:00 AM - 5:00 PM (8 to 17)
      // New York: 8:00 AM - 5:00 PM (8 to 17)

      // 1. London + New York overlap (highest volume)
      if (londonHour >= 8 && londonHour < 17 && nyHour >= 8 && nyHour < 17) {
        return { name: 'OVERLAP', label: 'لندن+نیویورک', emoji: '🤝', className: 'session-overlap' };
      }
      // 2. Primary London session
      if (londonHour >= 8 && londonHour < 17) {
        return { name: 'LONDON', label: 'لندن', emoji: '🇬🇧', className: 'session-london' };
      }
      // 3. Primary New York session
      if (nyHour >= 8 && nyHour < 17) {
        return { name: 'NEW_YORK', label: 'نیویورک', emoji: '🇺🇸', className: 'session-ny' };
      }
      // 4. Primary Tokyo/Asian session
      if (tokyoHour >= 9 && tokyoHour < 18) {
        return { name: 'ASIAN', label: 'توکیو', emoji: '🇯🇵', className: 'session-asian' };
      }
      // 5. Primary Sydney session
      if (sydneyHour >= 7 && sydneyHour < 16) {
        return { name: 'SYDNEY', label: 'سیدنی', emoji: '🇦🇺', className: 'session-sydney' };
      }

      // 6. Transition periods (e.g. after NY close, Sydney morning is active)
      if (sydneyHour >= 16 || sydneyHour < 7) {
        return { name: 'SYDNEY', label: 'سیدنی', emoji: '🇦🇺', className: 'session-sydney' };
      }

      return { name: 'UNKNOWN', label: 'نامشخص', emoji: '❓', className: 'session-unknown' };
    } catch {
      return { name: 'UNKNOWN', label: 'نامشخص', emoji: '❓', className: 'session-unknown' };
    }
  };

  // Form field update handlers for active trade
  const updateActiveTradeField = (key: keyof Trade, value: any) => {
    if (!activeTradeId) return;
    setTrades(prev =>
      prev.map(t => {
        if (t.id !== activeTradeId) return t;

        const updated = { ...t, [key]: value };

        // Recalculate rMultiple if stopLoss is updated
        if (key === 'stopLoss') {
          const isBuy = updated.direction === 'BUY';
          const stopLossVal = value ?? 0;
          if (stopLossVal > 0 && updated.openPrice > 0) {
            const risk = isBuy ? (updated.openPrice - stopLossVal) : (stopLossVal - updated.openPrice);
            if (risk > 0) {
              const exitPrice = updated.closePrice ?? updated.openPrice;
              const reward = isBuy ? (exitPrice - updated.openPrice) : (updated.openPrice - exitPrice);
              updated.rMultiple = reward / risk;
            } else {
              updated.rMultiple = 0;
            }
          } else {
            // Default R value to 0 if stop loss is removed/cleared
            updated.rMultiple = 0;
          }
        }

        return updated;
      })
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

          <Select
            value={selectedSymbol}
            onChange={setSelectedSymbol}
            options={symbolOptions.map(s => ({ value: s, label: s }))}
          />

          <Select
            value={selectedDirection}
            onChange={setSelectedDirection}
            options={[
              { value: 'همه جهت‌ها', label: 'همه جهت‌ها' },
              { value: 'خرید (Buy)', label: '↑ خرید' },
              { value: 'فروش (Sell)', label: '↓ فروش' },
            ]}
          />

          <Select
            value={selectedTimezone}
            onChange={setSelectedTimezone}
            title="منطقه زمانی"
            options={[
              { value: 'Asia/Tehran',     label: '🇮🇷 تهران (GMT+۳:۳۰)' },
              { value: 'UTC',             label: '🌐 UTC (GMT+۰)' },
              { value: 'Europe/London',   label: '🇬🇧 لندن (GMT+۰ / تابستان +۱)' },
              { value: 'America/New_York',label: '🇺🇸 نیویورک (GMT−۵ / تابستان −۴)' },
            ]}
          />

          {/* <div className="filter-select-wrapper">
            <select value={selectedStrategy} onChange={e => setSelectedStrategy(e.target.value)}>
              {strategyOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined select-arrow">keyboard_arrow_down</span>
          </div> */}

          <div className="filter-actions">
            <div className="rate-input-wrapper" title="نرخ دلار به تومان">
              <span className="rate-label">$=</span>
              <input
                type="number"
                className="rate-input"
                value={usdToToman}
                min={1}
                step={1000}
                onChange={e => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v > 0) setUsdToToman(v);
                }}
              />
              <span className="rate-label">ت</span>
            </div>
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
            <span className="toman-value">
              {formatToman(summary.totalProfit, usdToToman)}
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
                  <th>روز</th>
                  <th>نماد</th>
                  <th>جهت</th>
                  <th>حجم</th>
                  <th>R:R</th>
                  <th style={{ textAlign: 'left' }}>سود/زیان</th>
                  {/* <th style={{ textAlign: 'center' }}>استراتژی</th> */}
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
                        <span className="date-value">{formatDate(trade.openTime, selectedTimezone).date}</span>
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
                      {/* <td style={{ textAlign: 'center' }}>
                        {trade.setupName ? (
                          <span className="strategy-badge">{trade.setupName}</span>
                        ) : (
                          '-'
                        )}
                      </td> */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`material-symbols-outlined status-icon ${isClosed ? 'status-closed' : 'status-open'
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
                className={`icon-wrapper ${activeTrade.direction === 'SELL' ? 'sell-icon-wrapper' : ''
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

          {/* Panel Tabs */}
          <div className="panel-tabs">
            <button
              className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              <span className="material-symbols-outlined tab-icon">analytics</span>
              تحلیل و آمار
            </button>
            <button
              className={`tab-btn ${activeTab === 'journal' ? 'active' : ''}`}
              onClick={() => setActiveTab('journal')}
            >
              <span className="material-symbols-outlined tab-icon">rate_review</span>
              یادداشت و مستندات
            </button>
          </div>

          {/* Panel Content */}
          <div className="panel-body">
            {activeTab === 'stats' ? (
              <>
                {/* Financial Summary Box */}
                <div
                  className={`financial-box ${activeTrade.profitUsd < 0 ? 'loss-box' : ''
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
                  <div className="pnl-toman">
                    {formatToman(activeTrade.profitUsd, usdToToman)}
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

                {/* Trade Candlestick Chart */}
                {activeTrade.chartData && Array.isArray(activeTrade.chartData) && activeTrade.chartData.length > 0 && (
                  <div className="trade-chart-section">
                    <label className="section-label">نمودار قیمت معامله</label>
                    <TradeChart 
                      candlesticks={activeTrade.chartData}
                      direction={activeTrade.direction}
                      openPrice={activeTrade.openPrice}
                      closePrice={activeTrade.closePrice}
                      openTime={activeTrade.openTime}
                      closeTime={activeTrade.closeTime}
                      stopLoss={activeTrade.stopLoss}
                      takeProfit={activeTrade.takeProfit}
                    />
                  </div>
                )}

                {/* Execution Details */}
                <div className="details-section">
                  <h3>جزئیات اجرا</h3>
                  <div className="details-grid">
                    <span className="grid-label">زمان ورود:</span>
                    <span className="grid-value direction-ltr">
                      {formatDate(activeTrade.openTime, selectedTimezone).date}
                    </span>

                    <span className="grid-label">سشن ورود:</span>
                    <span className="grid-value">
                      {(() => {
                        const sess = getTradingSession(activeTrade.openTime);
                        return (
                          <span className={`session-badge ${sess.className}`}>
                            {sess.emoji} {sess.label}
                          </span>
                        );
                      })()}
                    </span>

                    <span className="grid-label">قیمت ورود:</span>
                    <span className="grid-value font-mono direction-ltr">
                      {toPersianDigits(activeTrade.openPrice.toFixed(5).replace(/\.?0+$/, ''))}
                    </span>

                    <span className="grid-label">حد ضرر (SL):</span>
                    <span className="grid-value">
                      <input
                        type="number"
                        step="any"
                        className="grid-input sl-input"
                        placeholder="--"
                        value={activeTrade.stopLoss !== null ? activeTrade.stopLoss : ''}
                        onChange={e => {
                          const val = e.target.value === '' ? null : parseFloat(e.target.value);
                          updateActiveTradeField('stopLoss', val);
                        }}
                      />
                    </span>

                    <span className="grid-label">حد سود (TP):</span>
                    <span className="grid-value">
                      <input
                        type="number"
                        step="any"
                        className="grid-input tp-input"
                        placeholder="--"
                        value={activeTrade.takeProfit !== null ? activeTrade.takeProfit : ''}
                        onChange={e => {
                          const val = e.target.value === '' ? null : parseFloat(e.target.value);
                          updateActiveTradeField('takeProfit', val);
                        }}
                      />
                    </span>

                    {activeTrade.closeTime && (
                      <>
                        <span className="grid-label">زمان خروج:</span>
                        <span className="grid-value direction-ltr">
                          {formatDate(activeTrade.closeTime, selectedTimezone).date}
                        </span>

                        <span className="grid-label">قیمت خروج:</span>
                        <span className="grid-value font-mono direction-ltr">
                          {activeTrade.closePrice ? toPersianDigits(activeTrade.closePrice.toFixed(5).replace(/\.?0+$/, '')) : '-'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Strategy & Emotions / Tags */}
                <div className="form-group">
                  <label>برچسب‌های معامله</label>
                  <div className="tags-container">
                    {[...allTags]
                      .sort((a, b) => {
                        const aSelected = activeTrade.tags?.includes(a) ? 1 : 0;
                        const bSelected = activeTrade.tags?.includes(b) ? 1 : 0;
                        return bSelected - aSelected;
                      })
                      .map(tag => {
                        const isSelected = activeTrade.tags && activeTrade.tags.includes(tag);
                        return (
                          <span
                            key={tag}
                            className={`tag ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              const currentTags = activeTrade.tags || [];
                              const newTags = isSelected
                                ? currentTags.filter(t => t !== tag)
                                : [...currentTags, tag];
                              updateActiveTradeField('tags', newTags);
                            }}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    {isAddingTag ? (
                      <input
                        type="text"
                        autoFocus
                        placeholder="برچسب..."
                        onBlur={() => setIsAddingTag(false)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val) {
                              const currentTags = activeTrade.tags || [];
                              if (!currentTags.includes(val)) {
                                updateActiveTradeField('tags', [...currentTags, val]);
                              }
                              setAllTags(prev => prev.includes(val) ? prev : [...prev, val]);
                            }
                            setIsAddingTag(false);
                          } else if (e.key === 'Escape') {
                            setIsAddingTag(false);
                          }
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 12px',
                          backgroundColor: 'rgba(97, 249, 177, 0.05)',
                          color: '#fff',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          border: '1px dashed rgba(97, 249, 177, 0.5)',
                          outline: 'none',
                          width: '100px',
                          fontFamily: 'Vazirmatn'
                        }}
                      />
                    ) : (
                      <span
                        className="add-tag-btn"
                        onClick={() => setIsAddingTag(true)}
                      >
                        <span className="material-symbols-outlined btn-icon" style={{ fontSize: '14px' }}>add</span>
                        افزودن برچسب
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>برچسب‌های احساسی</label>
                  <div className="tags-container">
                    {[...allEmotions]
                      .sort((a, b) => {
                        const aSelected = activeTrade.emotion === a.value ? 1 : 0;
                        const bSelected = activeTrade.emotion === b.value ? 1 : 0;
                        return bSelected - aSelected;
                      })
                      .map(({ value, label }) => {
                        const isSelected = activeTrade.emotion === value;
                        return (
                          <span
                            key={value}
                            className={`tag${isSelected ? ' selected' : ''}`}
                            onClick={() =>
                              updateActiveTradeField('emotion', isSelected ? null : value)
                            }
                          >
                            {label}
                          </span>
                        );
                      })}
                    {isAddingEmotion ? (
                      <input
                        type="text"
                        autoFocus
                        placeholder="احساس..."
                        onBlur={() => setIsAddingEmotion(false)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val) {
                              updateActiveTradeField('emotion', val);
                              setAllEmotions(prev => {
                                if (prev.some(e => e.value === val)) return prev;
                                return [...prev, { value: val, label: val }];
                              });
                            }
                            setIsAddingEmotion(false);
                          } else if (e.key === 'Escape') {
                            setIsAddingEmotion(false);
                          }
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 12px',
                          backgroundColor: 'rgba(97, 249, 177, 0.05)',
                          color: '#fff',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          border: '1px dashed rgba(97, 249, 177, 0.5)',
                          outline: 'none',
                          width: '100px',
                          fontFamily: 'Vazirmatn'
                        }}
                      />
                    ) : (
                      <span
                        className="add-tag-btn"
                        onClick={() => setIsAddingEmotion(true)}
                      >
                        <span className="material-symbols-outlined btn-icon" style={{ fontSize: '14px' }}>add</span>
                        افزودن احساس
                      </span>
                    )}
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

                {/* Screenshots Group */}
                <div className="form-group screenshots-group">
                  <label>تصاویر معامله (سند تصویری)</label>
                  
                  {!activeTrade.ticket ? (
                    <p className="no-ticket-warning">برای معاملات آزمایشی امکان ثبت تصویر وجود ندارد.</p>
                  ) : (
                    <div className="screenshots-grid">
                      {activeTrade.screenshots && activeTrade.screenshots.map((url, idx) => {
                        const fullUrl = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000'}${url}`;
                        return (
                          <div key={idx} className="screenshot-card">
                            <img src={fullUrl} alt={`screenshot-${idx}`} onClick={() => setLightboxUrl(fullUrl)} />
                            <button type="button" className="btn-delete-screenshot" onClick={(e) => { e.stopPropagation(); handleDeleteScreenshot(url); }} title="حذف تصویر">
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        );
                      })}

                      {/* Styled Upload Dropzone Card */}
                      <label className="upload-dropzone">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotUpload}
                          style={{ display: 'none' }}
                        />
                        {isUploading ? (
                          <div className="upload-loader">
                            <span className="material-symbols-outlined spinner-icon">sync</span>
                            <p>بارگذاری...</p>
                          </div>
                        ) : (
                          <div className="upload-prompt">
                            <span className="material-symbols-outlined upload-icon">add_photo_alternate</span>
                            <p>افزودن تصویر</p>
                          </div>
                        )}
                      </label>
                    </div>
                  )}
                </div>
              </>
            )}
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

      {/* Lightbox Modal Overlay */}
      {lightboxUrl && (
        <div className="lightbox-overlay" onClick={() => setLightboxUrl(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxUrl} alt="Screenshot Full View" />
            <button className="lightbox-close-btn" onClick={() => setLightboxUrl(null)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
