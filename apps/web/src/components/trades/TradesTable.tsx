'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toPersianDigits } from '../../utils/farsi';
import { useTranslation, useAppStore } from '../../store/useAppStore';
import { useTradeStore } from '../../store/useTradeStore';
import { getSharedTranslations } from '../../locales/components';
import { api } from '../../lib/api';
import { notify } from '../../lib/notify';
import { useTradingConcepts, TradingConcept } from '../../hooks/useTradingConcepts';
import { useTradesEmotions } from '../../hooks/useTradesEmotions';
import SummaryBar from './SummaryBar';
import FilterBar from './FilterBar';
import DesktopTable from './DesktopTable';
import MobileCardsList from './MobileCardsList';
import DetailPanel from './DetailPanel';
import { getMainPair, getNetPnl } from '../../utils/tradeHelpers';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ExportModal from '../modals/ExportModal';
import BulkTagModal from '../modals/BulkTagModal';
import { Trade } from '../../types/trade';
import { getDefaultEmotions } from '../../constants/emotions';
import { useAuthStore } from '../../lib/auth';

export type { Trade };
export type { TradingConcept } from '../../hooks/useTradingConcepts';

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
  const { t, language } = useTranslation();
  const isEn = language === 'en';

  const router = useRouter();
  const p = {
    ...getSharedTranslations(isEn),
    trades: isEn ? 'Trades' : 'معاملات',
    exportLabel: isEn ? 'Export Excel/CSV' : 'خروجی اکسل/CSV',
    importLabel: isEn ? 'Import MT4/5' : 'واردات MT4/MT5',
    manualLabel: isEn ? 'Record Manual Trade' : 'ثبت معامله دستی',
    proFeature: isEn ? 'Pro Feature Only' : 'قابلیت مخصوص کاربران حرفه‌ای',
    proFeatureMsg: isEn 
      ? 'Exporting data is only available for Pro users. Please upgrade your account to access this and other advanced features.'
      : 'خروجی داده فقط برای کاربران حرفه‌ای در دسترس است. برای دسترسی به این قابلیت و امکانات پیشرفته دیگر، لطفاً حساب خود را به حرفه‌ای ارتقا دهید.',
    upgradeAccount: isEn ? 'Upgrade Account' : 'ارتقای حساب',
    dateLabel: isEn ? 'Date:' : 'تاریخ:',
    daysSelected: isEn ? 'days selected' : 'روز انتخاب شده',
  };

  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTrades, setSelectedTrades] = useState<Set<string>>(new Set());
  const [activeTradeId, setActiveTradeId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const user = useAuthStore(state => state.user);

  const handleExportData = async () => {
    const isPro = user?.plan === 'PRO';
    if (!isPro) {
      const ok = await notify.confirm({
        title: isEn ? 'PRO Feature' : 'قابلیت مخصوص کاربران حرفه‌ای',
        message: isEn
          ? 'Data export is available exclusively for PRO users. Please upgrade your plan to access this feature.'
          : 'خروجی داده فقط برای کاربران حرفه‌ای در دسترس است. برای دسترسی به این قابلیت و امکانات پیشرفته دیگر، لطفاً حساب خود را به حرفه‌ای ارتقا دهید.',
        confirmLabel: isEn ? 'Upgrade Plan' : 'ارتقای حساب',
        cancelLabel: isEn ? 'Close' : 'بستن',
      });
      if (ok) {
        window.location.href = '/settings?tab=subscription';
      }
      return;
    }
    setIsExportModalOpen(true);
  };

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

  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Initialize activeTradeId from URL or prop
  useEffect(() => {
    const tradeIdParam = searchParams?.get('trade');
    if (tradeIdParam) {
      setActiveTradeId(tradeIdParam);
    } else if (initialActiveTradeId !== undefined) {
      setActiveTradeId(initialActiveTradeId);
    }
  }, [initialActiveTradeId, searchParams]);

  const handleSetActiveTradeId = (id: string | null) => {
    setActiveTradeId(id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (id) {
        url.searchParams.set('trade', id);
      } else {
        url.searchParams.delete('trade');
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  const { fetchTrades, totalCount: storeTotalCount } = useTradeStore();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [selectedSymbol, setSelectedSymbol] = useState(t('filters.allSymbols'));
  const [selectedDirection, setSelectedDirection] = useState(t('filters.allDirections'));
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [allEmotions, setAllEmotions] = useState<{ value: string; label: string; emoji?: string }[]>(() => getDefaultEmotions(language));
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Tehran');
  const [isBulkTagModalOpen, setIsBulkTagModalOpen] = useState(false);

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
    return [t('filters.allSymbols'), ...Array.from(symbols)];
  }, [trades]);
  const { concepts: tradingConcepts } = useTradingConcepts();

  // Fetch custom persistent emotions from database on mount
  const { emotions: fetchedEmotions } = useTradesEmotions();
  useEffect(() => {
    if (Array.isArray(fetchedEmotions) && fetchedEmotions.length > 0) {
      setAllEmotions(fetchedEmotions);
    }
  }, [fetchedEmotions]);


  const handleSaveEmotionConfigurations = async (emotionsList: { value: string; label: string; emoji: string }[], deletedValues: string[]) => {
    try {
      // Update local state for trades if there are deletions
      if (deletedValues.length > 0) {
        setTrades(prev => prev.map(t => ({
          ...t,
          emotion: t.annotation?.emotion && deletedValues.includes(t.annotation?.emotion) ? null : t.annotation?.emotion
        })));
      }

      // Send bulk save request to backend
      await api.post('/api/trades/emotions/bulk', { emotions: emotionsList, deletes: deletedValues });
    } catch (err) {
      console.error('Failed to save emotion configurations:', err);
    }
  };


  // Seed allEmotions from trades
  useEffect(() => {
    if (trades.length === 0) return;
    setAllEmotions(prev => {
      const existingValues = new Set(prev.map(e => e.value));
      const updated = [...prev];
      trades.forEach(t => {
        if (t.annotation?.emotion && !existingValues.has(t.annotation?.emotion)) {
          existingValues.add(t.annotation?.emotion);
          updated.push({ value: t.annotation?.emotion, label: t.annotation?.emotion, emoji: '💭' });
        }
      });
      return updated;
    });
  }, [trades]);

  const activeTrade = useMemo(() => {
    return trades.find(t => t.id === activeTradeId) || null;
  }, [trades, activeTradeId]);

  // Trigger fetch when filters change
  useEffect(() => {
    fetchTrades({
      isManualRefresh: true,
      accountId: selectedAccountId,
      limit: 500, // Fetch up to 500 for client-side pagination
      offset: 0,
      sortKey,
      sortDir,
      search: debouncedSearchQuery,
      symbol: selectedSymbol !== t('filters.allSymbols') ? selectedSymbol : undefined,
      direction: selectedDirection !== t('filters.allDirections') ? (selectedDirection === t('filters.buy') ? 'BUY' : 'SELL') : undefined,
      status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      dates: filterDatesArray
    });
    // Reset to page 1 on filter change
    setCurrentPage(1);
  }, [
    selectedAccountId,
    debouncedSearchQuery,
    selectedSymbol,
    selectedDirection,
    selectedStatus,
    filterDatesArray,
    sortKey,
    sortDir
  ]);

  // Filtered trades (now handled by backend, we just pass trades down)
  const filteredTrades = trades;

  // Summary Metrics
  const summary = useMemo(() => {
    const activeTrades = filteredTrades;
    const wins = activeTrades.filter(t => getNetPnl(t) > 0).length;
    const winRate = activeTrades.length > 0 ? Math.round((wins / activeTrades.length) * 100) : 0;
    const totalProfit = activeTrades.reduce((sum, t) => sum + getNetPnl(t), 0);
    const count = Math.max(activeTrades.length, storeTotalCount);
    return { count, winRate, totalProfit };
  }, [filteredTrades, storeTotalCount]);

  // Paginated trades (Load More logic)
  const paginatedTrades = useMemo(() => {
    return filteredTrades.slice(0, currentPage * itemsPerPage);
  }, [filteredTrades, currentPage]);

  // Keyboard navigation for activeTradeId
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeTradeId) return;

      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault(); // Prevent scrolling
        
        const currentIndex = paginatedTrades.findIndex(t => t.id === activeTradeId);
        if (currentIndex === -1) return; // Not in current page view
        
        if (e.key === 'ArrowUp' && currentIndex > 0) {
          handleSetActiveTradeId(paginatedTrades[currentIndex - 1].id);
        } else if (e.key === 'ArrowDown' && currentIndex < paginatedTrades.length - 1) {
          handleSetActiveTradeId(paginatedTrades[currentIndex + 1].id);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTradeId, paginatedTrades]);

  const totalPages = Math.max(Math.ceil(filteredTrades.length / itemsPerPage), 1);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSort = (key: string) => {
    setSortDir(prev => sortKey === key ? (prev === 'asc' ? 'desc' : 'asc') : 'desc');
    setSortKey(key);
    setCurrentPage(1);
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
        notify.success(isEn ? 'Changes saved successfully.' : 'تغییرات با موفقیت ذخیره شد.');
      } else {
        notify.error(isEn ? 'Failed to save trade changes. Please try again.' : 'خطا در ذخیره تغییرات معامله. لطفا دوباره تلاش کنید.');
      }
    } else {
      notify.info(isEn ? 'Changes saved locally.' : 'تغییرات به صورت محلی ذخیره شد.');
    }
  };

  const handleDeleteClick = async () => {
    if (!activeTradeId) return;

    const ok = await notify.confirm({
      title: isEn ? 'Delete Trade Confirmation' : 'تایید حذف معامله',
      message: isEn ? 'Are you sure you want to delete this trade? This action cannot be undone.' : 'آیا از حذف این معامله اطمینان دارید؟ این عمل غیرقابل بازگشت است.',
      confirmLabel: isEn ? 'Delete Trade' : 'حذف معامله',
      cancelLabel: isEn ? 'Cancel' : 'انصراف',
      danger: true,
    });
    if (!ok) return;

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
      handleSetActiveTradeId(null);
    }
  };

  // Bulk Delete
  const handleDeleteSelected = async () => {
    if (selectedTrades.size === 0) return;

    const ok = await notify.confirm({
      title: isEn ? 'Delete Selected Confirmation' : 'تایید حذف گروهی',
      message: isEn 
        ? `Are you sure you want to delete ${selectedTrades.size} selected trades? This action cannot be undone.` 
        : `آیا از حذف ${toPersianDigits(selectedTrades.size)} معامله انتخاب شده اطمینان دارید؟ این عمل غیرقابل بازگشت است.`,
      confirmLabel: isEn ? 'Delete Selected' : 'حذف گروهی',
      cancelLabel: isEn ? 'Cancel' : 'انصراف',
      danger: true,
    });
    if (!ok) return;

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
        handleSetActiveTradeId(null);
      }
    }
  };

  // Bulk Tag
  const handleBulkTagApply = async (data: any) => {
    try {
      const res = await api.post('/api/trades/bulk-tags', {
        tradeIds: Array.from(selectedTrades),
        ...data
      });
      if (res.data?.success) {
        notify.success(isEn ? 'Tags applied successfully' : 'برچسب‌ها با موفقیت اعمال شدند');
        onRefresh?.();
        setSelectedTrades(new Set());
      }
    } catch (err: any) {
      notify.error(isEn ? 'Failed to apply tags' : 'خطا در اعمال برچسب‌ها');
      console.error(err);
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTrade) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('screenshot', file);

      const res = await api.post(`/api/trades/${activeTrade.id}/screenshots`, formData);
      const data = res.data;
      if (data?.screenshots) {
        updateActiveTradeField('screenshots', data.screenshots);
      }
    } catch (err) {
      console.error('Failed to upload screenshot:', err);
      notify.error(isEn ? 'Failed to upload screenshot. Please try again.' : 'خطا در بارگذاری تصویر. لطفا دوباره تلاش کنید.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteScreenshot = async (url: string) => {
    if (!activeTrade) return;

    const ok = await notify.confirm({
      title: isEn ? 'Delete Screenshot Confirmation' : 'تایید حذف تصویر',
      message: isEn ? 'Are you sure you want to delete this screenshot?' : 'آیا از حذف این تصویر اطمینان دارید؟',
      confirmLabel: isEn ? 'Delete Screenshot' : 'حذف تصویر',
      cancelLabel: isEn ? 'Cancel' : 'انصراف',
      danger: true,
    });
    if (!ok) return;

    try {
      const res = await api.delete(`/api/trades/${activeTrade.id}/screenshots`, {
        data: { url }
      });
      const data = res.data;
      if (data?.screenshots) {
        updateActiveTradeField('screenshots', data.screenshots);
      }
    } catch (err) {
      console.error('Failed to delete screenshot:', err);
      notify.error(isEn ? 'Failed to delete screenshot. Please try again.' : 'خطا در حذف تصویر. لطفا دوباره تلاش کنید.');
    }
  };

  const ANNOTATION_FIELDS = new Set(['emotion', 'notes', 'screenshots', 'htfBias', 'session', 'analysisTimeframe', 'entryTimeframe', 'thesis', 'expectation', 'lesson', 'conviction']);

  const updateActiveTradeField = (key: keyof Trade | 'emotion' | 'notes' | 'screenshots' | 'htfBias' | 'session' | 'analysisTimeframe' | 'entryTimeframe' | 'thesis' | 'expectation' | 'lesson' | 'conviction' | 'setup' | 'triggers' | 'confluences' | 'plan', value: any) => {
    if (!activeTradeId) return;
    setTrades(prev =>
      prev.map(t => {
        if (t.id !== activeTradeId) return t;

        if (ANNOTATION_FIELDS.has(key)) {
          const updated = { ...t, annotation: { ...(t.annotation ?? {}), [key]: value } as NonNullable<Trade['annotation']> };
          return updated;
        }

        const updated = { ...t, [key]: value };

        // Recalc pips when closePrice or openPrice changes and we have both
        if ((key === 'closePrice' || key === 'openPrice') && updated.closePrice !== null && updated.openPrice > 0) {
          const sym = updated.symbol.toUpperCase();
          let digits = 5;
          if (sym.includes('JPY')) digits = 3;
          else if (sym.includes('BTC') || sym.includes('ETH')) digits = 2;
          else if (sym.includes('XAU') || sym.includes('GOLD')) digits = 2;
          const pipSize = Math.pow(10, -digits) * ((digits === 3 || digits === 5) ? 10 : 1);
          updated.pips = updated.direction === 'BUY'
            ? (updated.closePrice - updated.openPrice) / pipSize
            : (updated.openPrice - updated.closePrice) / pipSize;
        }

        // Recalc rMultiple when stopLoss, closePrice, or openPrice changes
        if ((key === 'stopLoss' || key === 'closePrice' || key === 'openPrice') && updated.stopLoss && updated.stopLoss > 0 && updated.openPrice > 0) {
          const isBuy = updated.direction === 'BUY';
          const risk = isBuy ? (updated.openPrice - updated.stopLoss) : (updated.stopLoss - updated.openPrice);
          if (risk > 0) {
            const exitPrice = updated.closePrice ?? updated.openPrice;
            const reward = isBuy ? (exitPrice - updated.openPrice) : (updated.openPrice - exitPrice);
            updated.rMultiple = reward / risk;
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
          <h1>{p.trades}</h1>
          <div className="header-actions">
            <button className="btn btn-secondary btn-export" onClick={handleExportData}>
              <span className="material-symbols-outlined">download</span>
              {p.exportLabel}
              <span className="pro-badge-mini">PRO</span>
            </button>
            <button className="btn btn-secondary" onClick={onImportMT4}>
              <span className="material-symbols-outlined">cloud_download</span>
              {p.importLabel}
            </button>
            <button className="btn btn-primary" onClick={onAddManualTrade}>
              <span className="material-symbols-outlined">edit_note</span>
              {p.manualLabel}
            </button>
          </div>
        </header>

        {/* Active Filter Badges */}
        {(dateFilter || searchQuery || selectedSymbol !== t('filters.allSymbols') || selectedDirection !== t('filters.allDirections') || selectedStatus !== 'ALL' || (selectedAccountId && selectedAccountId !== 'all')) && (
          <div className="active-filters-container animate-fade-in">
            {/* Date Filter */}
            {dateFilter && (
              <div className="active-filter-badge">
                <span className="material-symbols-outlined badge-icon-lead">calendar_month</span>
                <span className="badge-text">
                  {filterDatesArray.length === 1 
                    ? `${p.dateLabel} ${getJalaliDisplayDate(filterDatesArray[0])}` 
                    : isEn 
                      ? `${filterDatesArray.length} ${t('filters.badgeDaysSelected')}`
                      : `${toPersianDigits(filterDatesArray.length)} ${t('filters.badgeDaysSelected')}`
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
                  title={t('filters.badgeClearDate')}
                >
                  <span className="material-symbols-outlined badge-icon-close">close</span>
                </button>
              </div>
            )}

            {/* Search Query Filter */}
            {searchQuery && (
              <div className="active-filter-badge">
                <span className="material-symbols-outlined badge-icon-lead">search</span>
                <span className="badge-text">
                  {`${t('filters.badgeSearch')} "${searchQuery}"`}
                </span>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="badge-clear-btn"
                  title={t('filters.badgeClearSearch')}
                >
                  <span className="material-symbols-outlined badge-icon-close">close</span>
                </button>
              </div>
            )}

            {/* Symbol Filter */}
            {selectedSymbol !== t('filters.allSymbols') && (
              <div className="active-filter-badge">
                <span className="material-symbols-outlined badge-icon-lead">toll</span>
                <span className="badge-text">
                  {`${t('filters.badgeSymbol')} ${selectedSymbol.startsWith('main:') ? `${selectedSymbol.substring(5)} (${t('filters.badgeAll')})` : selectedSymbol}`}
                </span>
                <button 
                  onClick={() => {
                    setSelectedSymbol(t('filters.allSymbols'));
                    setCurrentPage(1);
                  }}
                  className="badge-clear-btn"
                  title={t('filters.badgeClearSymbol')}
                >
                  <span className="material-symbols-outlined badge-icon-close">close</span>
                </button>
              </div>
            )}

            {/* Direction Filter */}
            {selectedDirection !== t('filters.allDirections') && (
              <div className="active-filter-badge">
                <span className="material-symbols-outlined badge-icon-lead">swap_vert</span>
                <span className="badge-text">
                  {`${t('filters.badgeDirection')} ${selectedDirection === t('filters.buy') ? t('filters.badgeBuy') : t('filters.badgeSell')}`}
                </span>
                <button 
                  onClick={() => {
                    setSelectedDirection(t('filters.allDirections'));
                    setCurrentPage(1);
                  }}
                  className="badge-clear-btn"
                  title={t('filters.badgeClearDirection')}
                >
                  <span className="material-symbols-outlined badge-icon-close">close</span>
                </button>
              </div>
            )}

            {/* Status Filter */}
            {selectedStatus !== 'ALL' && (
              <div className="active-filter-badge">
                <span className="material-symbols-outlined badge-icon-lead">check_circle</span>
                <span className="badge-text">
                  {`${t('filters.badgeStatus')} ${selectedStatus === 'OPEN' ? t('filters.badgeStatusOpen') : selectedStatus === 'CLOSED' ? t('filters.badgeStatusClosed') : t('filters.badgeStatusMissed')}`}
                </span>
                <button 
                  onClick={() => {
                    setSelectedStatus('ALL');
                    setCurrentPage(1);
                  }}
                  className="badge-clear-btn"
                  title={t('filters.badgeClearStatus')}
                >
                  <span className="material-symbols-outlined badge-icon-close">close</span>
                </button>
              </div>
            )}

            {/* Account Filter */}
            {selectedAccountId && selectedAccountId !== 'all' && (
              <div className="active-filter-badge">
                <span className="material-symbols-outlined badge-icon-lead">account_balance_wallet</span>
                <span className="badge-text">
                  {`${t('filters.badgeAccount')} ${(() => {
                    const acc = accounts.find(a => a.id === selectedAccountId);
                    return acc ? `${acc.broker_name || 'MT5'} (${acc.account_number || acc.id})` : selectedAccountId;
                  })()}`}
                </span>
                <button 
                  onClick={() => {
                    if (onAccountIdChange) {
                      onAccountIdChange('all');
                    }
                    setCurrentPage(1);
                  }}
                  className="badge-clear-btn"
                  title={t('filters.badgeClearAccount')}
                >
                  <span className="material-symbols-outlined badge-icon-close">close</span>
                </button>
              </div>
            )}
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
            setActiveTradeId={handleSetActiveTradeId}
            handleSelectAll={handleSelectAll}
            handleSelectRow={handleSelectRow}
            selectedTimezone={selectedTimezone}
            usdToToman={usdToToman}
            allEmotions={allEmotions}
            accounts={accounts}
            tradingConcepts={tradingConcepts}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
        </div>

        {/* 5. Mobile Cards View */}
        <MobileCardsList
          filteredTrades={filteredTrades}
          selectedTrades={selectedTrades}
          setSelectedTrades={setSelectedTrades}
          activeTradeId={activeTradeId}
          setActiveTradeId={handleSetActiveTradeId}
          handleSelectRow={handleSelectRow}
          selectedTimezone={selectedTimezone}
          usdToToman={usdToToman}
          allEmotions={allEmotions}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          tradingConcepts={tradingConcepts}
          accounts={accounts}
        />

        {/* 6. Pagination / Load More */}
        <div className="pagination-container" style={{ display: 'none' }}>
          <div style={{ color: '#9ca3af', fontSize: '14px' }}>
            {isEn
              ? `Showing ${Math.min(currentPage * itemsPerPage, filteredTrades.length)} of ${filteredTrades.length} trades`
              : `نمایش ${toPersianDigits(Math.min(currentPage * itemsPerPage, filteredTrades.length))} از ${toPersianDigits(filteredTrades.length)} معامله`}
          </div>
        </div>

        {/* Load More Button for Desktop */}
        {currentPage * itemsPerPage < filteredTrades.length && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', marginBottom: '20px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentPage(p => p + 1)}
              style={{ width: '100%', maxWidth: '300px' }}
            >
              {isEn ? 'Load More' : 'نمایش بیشتر'}
            </button>
          </div>
        )}
      </div>

      {/* 7. Slide-out Detail Panel Drawer */}
      {activeTrade && (
        <DetailPanel
          key={activeTrade.id}
          activeTrade={activeTrade}
          setActiveTradeId={handleSetActiveTradeId}
          tradingConcepts={tradingConcepts}
          allEmotions={allEmotions}
          onSaveEmotionConfigurations={handleSaveEmotionConfigurations}
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
          onOpenReview={() => router.push(`/trades/${activeTrade.id}/review`)}
          onOpenInspect={() => {
            if (activeTradeId) {
              router.push(`/trades/${activeTradeId}/inspect`);
            }
          }}
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
            <button className="btn btn-secondary" onClick={() => setIsBulkTagModalOpen(true)} style={{ color: '#fff', borderColor: '#475569' }}>
              <span className="material-symbols-outlined">sell</span>
              {isEn ? 'Tag Selected' : 'برچسب‌گذاری گروهی'}
            </button>
            <button className="btn btn-danger" onClick={handleDeleteSelected}>
              <span className="material-symbols-outlined">delete</span>
              {isEn ? 'Bulk Delete' : 'حذف گروهی'}
            </button>
            <button className="btn-cancel-selection" onClick={() => setSelectedTrades(new Set())}>
              <span className="material-symbols-outlined">close</span>
              {isEn ? 'Clear Selection' : 'لغو انتخاب'}
            </button>
          </div>
        </div>
      )}

      {/* 9. Floating Action Button (FAB) Speed Dial */}
      <div
        className={`fab-container ${isFabOpen ? 'active' : ''}`}
        onMouseLeave={() => setIsFabOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsFabOpen(false);
        }}
      >
        <div className="fab-options">
          <button
            className="fab-sub-btn"
            onClick={() => {
              onAddManualTrade?.();
              setIsFabOpen(false);
            }}
            title="ثبت معامله دستی"
            tabIndex={isFabOpen ? 0 : -1}
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
            tabIndex={isFabOpen ? 0 : -1}
          >
            <span className="fab-label">واردات MT4/MT5</span>
            <div className="fab-icon-wrapper">
              <span className="material-symbols-outlined">cloud_download</span>
            </div>
          </button>
          <button
            className="fab-sub-btn"
            onClick={() => {
              handleExportData();
              setIsFabOpen(false);
            }}
            title="خروجی داده"
            tabIndex={isFabOpen ? 0 : -1}
          >
            <span className="fab-label">خروجی داده</span>
            <div className="fab-icon-wrapper">
              <span className="material-symbols-outlined">download</span>
            </div>
          </button>
        </div>
        <button
          className="fab-main-btn"
          onClick={() => setIsFabOpen(!isFabOpen)}
          title="افزودن معامله"
          aria-expanded={isFabOpen}
          aria-haspopup="true"
        >
          <span className="material-symbols-outlined fab-icon">add</span>
        </button>
      </div>

      {/* 10. Lightbox Modal Overlay */}
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

      {/* 11. Export Dialog Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        filteredCount={filteredTrades.length}
        totalCount={trades.length}
        activeFilters={{
          accountId: selectedAccountId,
          symbol: selectedSymbol,
          direction: selectedDirection,
          status: selectedStatus,
          searchQuery: searchQuery,
          dateFilter: dateFilter,
        }}
      />
      <BulkTagModal
        isOpen={isBulkTagModalOpen}
        onClose={() => setIsBulkTagModalOpen(false)}
        selectedCount={selectedTrades.size}
        tradingConcepts={tradingConcepts}
        onApply={handleBulkTagApply}
      />
    </div>
  );
}
