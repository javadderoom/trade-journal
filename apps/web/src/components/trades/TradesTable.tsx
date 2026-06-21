'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toPersianDigits } from '../../utils/farsi';
import ConfirmModal from '../ui/ConfirmModal';
import SummaryBar from './SummaryBar';
import FilterBar from './FilterBar';
import DesktopTable from './DesktopTable';
import MobileCardsList from './MobileCardsList';
import DetailPanel from './DetailPanel';
import { getMainPair } from '../../utils/tradeHelpers';

export interface Trade {
  id: string;
  accountId?: string;
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
  initialDateFilter?: string | null;
  onRefresh?: () => void;
  onAddManualTrade?: () => void;
  onImportMT4?: () => void;
  onUpdateTrade?: (updatedTrade: Trade) => Promise<boolean>;
  onDeleteTrade?: (tradeId: string) => Promise<boolean>;
  onDeleteMultipleTrades?: (tradeIds: string[]) => Promise<boolean>;
  initialActiveTradeId?: string | null;
  accounts?: any[];
  selectedAccountId?: string;
  onAccountIdChange?: (val: string) => void;
}

const DEFAULT_TAGS = [
  'پرایس اکشن',
  'شکست ساختار',
  'برگشت از حمایت',
  'برگشت از مقاومت',
  'روند گیری',
  'واگرایی',
  'اسکالپ',
  'سوئینگ',
  'خبری',
  'تله خرسی',
  'تله گاوی',
  'نقض قانون',
  'مدیریت خوب',
  'خروج زود',
  'حجم اضافه',
  'فرصت از دست رفته',
];

const DEFAULT_EMOTIONS = [
  { value: 'CONFIDENT', label: 'با اطمینان' },
  { value: 'NEUTRAL', label: 'آرام/خنثی' },
  { value: 'ANXIOUS', label: 'مضطرب' },
  { value: 'FOMO', label: 'FOMO' },
  { value: 'REVENGE', label: 'انتقام' },
];

const getJalaliDisplayDate = (gregorianDateStr: string) => {
  try {
    const d = new Date(`${gregorianDateStr}T12:00:00Z`);
    if (isNaN(d.getTime())) return gregorianDateStr;
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Tehran'
    });
    return formatter.format(d);
  } catch {
    return toPersianDigits(gregorianDateStr);
  }
};

const getLocalDateStr = (dateStr: string | null, timezone: string): string | null => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.format(d).split('/');
    return `${parts[2]}-${parts[0]}-${parts[1]}`;
  } catch {
    return dateStr.substring(0, 10);
  }
};

export default function TradesTable({
  initialTrades,
  initialUsdToToman = 90_000,
  initialDateFilter,
  onRefresh,
  onImportMT4,
  onAddManualTrade,
  onUpdateTrade,
  onDeleteTrade,
  onDeleteMultipleTrades,
  initialActiveTradeId,
  accounts = [],
  selectedAccountId = 'all',
  onAccountIdChange,
}: TradesTableProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTrades, setSelectedTrades] = useState<Set<string>>(new Set());
  const [activeTradeId, setActiveTradeId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<string | null>(null);

  // Sync prop-level initialDateFilter if provided by parent
  useEffect(() => {
    setDateFilter(initialDateFilter || null);
    setCurrentPage(1);
  }, [initialDateFilter]);

  // Parse dateFilter into an array of date strings
  const filterDatesArray = useMemo(() => {
    if (!dateFilter) return [];
    return dateFilter.split(',').map(d => d.trim()).filter(Boolean);
  }, [dateFilter]);

  // Dialog state for custom alerts & confirmations
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'confirm' | 'error' | 'success';
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlertDialog = (
    title: string,
    message: string,
    type: 'info' | 'confirm' | 'error' | 'success' = 'info',
    onConfirm?: () => void,
    confirmLabel?: string,
    cancelLabel?: string
  ) => {
    setDialogConfig({
      isOpen: true,
      title,
      message,
      type,
      confirmLabel,
      cancelLabel,
      onConfirm,
    });
  };

  // Sync prop-level activeTradeId if provided by parent
  useEffect(() => {
    if (initialActiveTradeId !== undefined) {
      setActiveTradeId(initialActiveTradeId);
    }
  }, [initialActiveTradeId]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('همه نمادها');
  const [selectedDirection, setSelectedDirection] = useState('همه جهت‌ها');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'OPEN' | 'CLOSED' | 'MISSED'>('ALL');
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [allEmotions, setAllEmotions] = useState<{ value: string; label: string }[]>(DEFAULT_EMOTIONS);
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Tehran');

  // USD → Toman exchange rate
  const [usdToToman, setUsdToToman] = useState<number>(initialUsdToToman);

  // Sync rate when parent delivers
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

  const [allTags, setAllTags] = useState<string[]>(DEFAULT_TAGS);

  // Seed allTags from trades
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

  // Seed allEmotions from trades
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

  const activeTrade = useMemo(() => {
    return trades.find(t => t.id === activeTradeId) || null;
  }, [trades, activeTradeId]);

  // Filtered trades
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      if (filterDatesArray.length > 0) {
        const closeDate = getLocalDateStr(trade.closeTime, selectedTimezone);
        const matchClose = closeDate ? filterDatesArray.includes(closeDate) : false;
        if (!matchClose) {
          return false;
        }
      }
      if (selectedSymbol !== 'همه نمادها') {
        if (selectedSymbol.startsWith('main:')) {
          const mainPair = selectedSymbol.substring(5);
          if (getMainPair(trade.symbol) !== mainPair) {
            return false;
          }
        } else if (trade.symbol !== selectedSymbol) {
          return false;
        }
      }
      if (selectedDirection !== 'همه جهت‌ها') {
        const dir = selectedDirection === 'خرید (Buy)' ? 'BUY' : 'SELL';
        if (trade.direction !== dir) return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        const symbolMatch = trade.symbol.toLowerCase().includes(query);
        const ticketMatch = trade.ticket ? String(trade.ticket).includes(query) : false;
        const notesMatch = trade.notes ? trade.notes.toLowerCase().includes(query) : false;
        const dateMatch = trade.openTime.includes(query);
        if (!symbolMatch && !ticketMatch && !notesMatch && !dateMatch) {
          return false;
        }
      }
      if (selectedStatus === 'OPEN' && trade.closeTime !== null) return false;
      if (selectedStatus === 'CLOSED' && trade.closeTime === null) return false;
      if (selectedStatus === 'MISSED') {
        const isMissed = trade.tags?.includes('فرصت از دست رفته') || trade.tags?.includes('Missed');
        if (!isMissed) return false;
      }
      return true;
    });
  }, [trades, selectedSymbol, selectedDirection, searchQuery, selectedStatus, filterDatesArray, selectedTimezone]);

  // Summary Metrics
  const summary = useMemo(() => {
    const activeTrades = filteredTrades.filter(
      t => !t.tags?.includes('فرصت از دست رفته') && !t.tags?.includes('Missed')
    );
    const count = activeTrades.length;
    const wins = activeTrades.filter(t => t.profitUsd > 0).length;
    const winRate = count > 0 ? Math.round((wins / count) * 100) : 0;
    const totalProfit = activeTrades.reduce((sum, t) => sum + t.profitUsd, 0);
    return { count, winRate, totalProfit };
  }, [filteredTrades]);

  // Paginated trades
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTrades.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTrades, currentPage]);

  const totalPages = Math.max(Math.ceil(filteredTrades.length / itemsPerPage), 1);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const ids = paginatedTrades.map(t => t.id);
      setSelectedTrades(new Set(ids));
    } else {
      setSelectedTrades(new Set());
    }
  };

  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    e.stopPropagation();
    const newSelected = new Set(selectedTrades);
    if (e.target.checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedTrades(newSelected);
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrade) return;

    if (onUpdateTrade) {
      const success = await onUpdateTrade(activeTrade);
      if (success) {
        showAlertDialog('ذخیره موفقیت‌آمیز', 'تغییرات با موفقیت ذخیره شد.', 'success');
      }
    } else {
      showAlertDialog('ذخیره محلی', 'تغییرات به صورت محلی ذخیره شد.', 'info');
    }
  };

  const handleDeleteClick = async () => {
    if (!activeTradeId) return;

    showAlertDialog(
      'تایید حذف معامله',
      'آیا از حذف این معامله اطمینان دارید؟ این عمل غیرقابل بازگشت است.',
      'confirm',
      async () => {
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
      },
      'حذف معامله',
      'انصراف'
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedTrades.size === 0) return;

    showAlertDialog(
      'تایید حذف گروهی',
      `آیا از حذف ${toPersianDigits(selectedTrades.size)} معامله انتخاب شده اطمینان دارید؟ این عمل غیرقابل بازگشت است.`,
      'confirm',
      async () => {
        let success = true;
        const idsArray = Array.from(selectedTrades);
        if (onDeleteMultipleTrades) {
          success = await onDeleteMultipleTrades(idsArray);
        } else if (onDeleteTrade) {
          const results = await Promise.all(idsArray.map(id => onDeleteTrade(id)));
          success = results.every(res => res === true);
        }

        if (success) {
          setTrades(prev => prev.filter(t => !selectedTrades.has(t.id)));
          setSelectedTrades(new Set());
          if (activeTradeId && selectedTrades.has(activeTradeId)) {
            setActiveTradeId(null);
          }
        }
      },
      'حذف گروهی',
      'انصراف'
    );
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTrade) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('screenshot', file);

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
      const res = await fetch(`${baseUrl}/api/trades/${activeTrade.id}/screenshots`, {
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
      showAlertDialog('خطا در بارگذاری', 'خطا در بارگذاری تصویر. لطفا دوباره تلاش کنید.', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteScreenshot = async (url: string) => {
    if (!activeTrade) return;

    showAlertDialog(
      'تایید حذف تصویر',
      'آیا از حذف این تصویر اطمینان دارید؟',
      'confirm',
      async () => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
          const res = await fetch(`${baseUrl}/api/trades/${activeTrade.id}/screenshots`, {
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
          showAlertDialog('خطا در حذف', 'خطا در حذف تصویر. لطفا دوباره تلاش کنید.', 'error');
        }
      },
      'حذف تصویر',
      'انصراف'
    );
  };

  const updateActiveTradeField = (key: keyof Trade, value: any) => {
    if (!activeTradeId) return;
    setTrades(prev =>
      prev.map(t => {
        if (t.id !== activeTradeId) return t;

        const updated = { ...t, [key]: value };

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
              واردات MT4/MT5
            </button>
            <button className="btn btn-primary" onClick={onAddManualTrade}>
              <span className="material-symbols-outlined">edit_note</span>
              ثبت معامله دستی
            </button>
          </div>
        </header>

        {/* Date Filter Active Badge */}
        {dateFilter && (
          <div className="active-date-filter-badge-container animate-fade-in">
            <span className="material-symbols-outlined badge-icon-calendar">calendar_month</span>
            <span className="badge-text">
              {filterDatesArray.length === 1 
                ? `نمایش معاملات تاریخ: ${getJalaliDisplayDate(filterDatesArray[0])}` 
                : `نمایش معاملات: ${toPersianDigits(filterDatesArray.length)} روز انتخاب شده`
              }
            </span>
            <button 
              onClick={() => {
                setDateFilter(null);
                setCurrentPage(1);
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('date');
                  window.history.pushState({}, '', url.toString());
                }
              }}
              className="badge-clear-btn"
              title="پاک کردن فیلتر تاریخ"
            >
              <span className="material-symbols-outlined badge-icon-close">close</span>
            </button>
          </div>
        )}

        {/* 2. Filter Bar */}
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          setCurrentPage={setCurrentPage}
          isAdvancedFiltersOpen={isAdvancedFiltersOpen}
          setIsAdvancedFiltersOpen={setIsAdvancedFiltersOpen}
          onRefresh={onRefresh}
          selectedSymbol={selectedSymbol}
          setSelectedSymbol={setSelectedSymbol}
          symbolOptions={symbolOptions}
          selectedDirection={selectedDirection}
          setSelectedDirection={setSelectedDirection}
          selectedTimezone={selectedTimezone}
          setSelectedTimezone={setSelectedTimezone}
          usdToToman={usdToToman}
          setUsdToToman={setUsdToToman}
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onAccountIdChange={onAccountIdChange}
        />

        {/* 3. Summary Bar */}
        <SummaryBar
          count={summary.count}
          winRate={summary.winRate}
          totalProfit={summary.totalProfit}
          usdToToman={usdToToman}
        />

        {/* 4. Desktop Table View */}
        <div className="desktop-table-view">
          <DesktopTable
            paginatedTrades={paginatedTrades}
            selectedTrades={selectedTrades}
            activeTradeId={activeTradeId}
            setActiveTradeId={setActiveTradeId}
            handleSelectAll={handleSelectAll}
            handleSelectRow={handleSelectRow}
            selectedTimezone={selectedTimezone}
            usdToToman={usdToToman}
            allEmotions={allEmotions}
            accounts={accounts}
          />
        </div>

        {/* 5. Mobile Cards View */}
        <MobileCardsList
          filteredTrades={filteredTrades}
          selectedTrades={selectedTrades}
          setSelectedTrades={setSelectedTrades}
          activeTradeId={activeTradeId}
          setActiveTradeId={setActiveTradeId}
          handleSelectRow={handleSelectRow}
          selectedTimezone={selectedTimezone}
          usdToToman={usdToToman}
          allEmotions={allEmotions}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
        />

        {/* 6. Pagination */}
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

      {/* 7. Slide-out Detail Panel Drawer */}
      {activeTrade && (
        <DetailPanel
          key={activeTrade.id}
          activeTrade={activeTrade}
          setActiveTradeId={setActiveTradeId}
          allTags={allTags}
          setAllTags={setAllTags}
          allEmotions={allEmotions}
          setAllEmotions={setAllEmotions}
          isUploading={isUploading}
          setLightboxUrl={setLightboxUrl}
          updateActiveTradeField={updateActiveTradeField}
          handleSaveDetails={handleSaveDetails}
          handleDeleteClick={handleDeleteClick}
          handleScreenshotUpload={handleScreenshotUpload}
          handleDeleteScreenshot={handleDeleteScreenshot}
          selectedTimezone={selectedTimezone}
          usdToToman={usdToToman}
          accounts={accounts}
        />
      )}

      {/* 8. Floating Contextual Bulk Action Bar */}
      {selectedTrades.size > 0 && (
        <div className="floating-bulk-actions-bar animate-slide-up">
          <div className="selection-count">
            <span className="count-badge">{toPersianDigits(selectedTrades.size)}</span>
            <span>معامله انتخاب شده است</span>
          </div>
          <div className="divider-vertical"></div>
          <div className="action-buttons">
            <button className="btn btn-danger" onClick={handleDeleteSelected}>
              <span className="material-symbols-outlined">delete</span>
              حذف گروهی
            </button>
            <button className="btn-cancel-selection" onClick={() => setSelectedTrades(new Set())}>
              <span className="material-symbols-outlined">close</span>
              لغو انتخاب
            </button>
          </div>
        </div>
      )}

      {/* 9. Floating Action Button (FAB) Speed Dial */}
      <div className={`fab-container ${isFabOpen ? 'active' : ''}`} onMouseLeave={() => setIsFabOpen(false)}>
        <div className="fab-options">
          <button
            className="fab-sub-btn"
            onClick={() => {
              onAddManualTrade?.();
              setIsFabOpen(false);
            }}
            title="ثبت معامله دستی"
          >
            <span className="fab-label">ثبت معامله دستی</span>
            <div className="fab-icon-wrapper">
              <span className="material-symbols-outlined">edit_note</span>
            </div>
          </button>
          <button
            className="fab-sub-btn"
            onClick={() => {
              onImportMT4?.();
              setIsFabOpen(false);
            }}
            title="واردات MT4/MT5"
          >
            <span className="fab-label">واردات MT4/MT5</span>
            <div className="fab-icon-wrapper">
              <span className="material-symbols-outlined">cloud_download</span>
            </div>
          </button>
        </div>
        <button
          className="fab-main-btn"
          onClick={() => setIsFabOpen(!isFabOpen)}
          title="افزودن معامله"
        >
          <span className="material-symbols-outlined fab-icon">add</span>
        </button>
      </div>

      {/* 10. Reusable Dialog Modal */}
      <ConfirmModal
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        confirmLabel={dialogConfig.confirmLabel}
        cancelLabel={dialogConfig.cancelLabel}
        onConfirm={dialogConfig.onConfirm}
        onClose={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* 11. Lightbox Modal Overlay */}
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
