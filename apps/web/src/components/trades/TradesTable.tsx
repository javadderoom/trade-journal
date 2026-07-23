'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toPersianDigits } from '../../utils/farsi';
import { useTranslation, useAppStore } from '../../store/useAppStore';
import { getSharedTranslations } from '../../locales/components';
import { api } from '../../lib/api';
import { notify } from '../../lib/notify';
import { useTradesTags, TagObject } from '../../hooks/useTradesTags';
import { useTradesEmotions } from '../../hooks/useTradesEmotions';
import SummaryBar from './SummaryBar';
import FilterBar from './FilterBar';
import DesktopTable from './DesktopTable';
import MobileCardsList from './MobileCardsList';
import DetailPanel from './DetailPanel';
import { getMainPair, getNetPnl } from '../../utils/tradeHelpers';
import { useAuthStore } from '../../lib/auth';
import ExportModal from '../modals/ExportModal';
import { Trade } from '../../types/trade';
import { getDefaultEmotions } from '../../constants/emotions';

export type { Trade };
export type { TagObject } from '../../hooks/useTradesTags';

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

const getDefaultSystemTags = (isEn: boolean): TagObject[] => [
  { name: isEn ? 'Missed' : 'فرصت از دست رفته', is_ignored: true, show_first: false },
  { name: 'Missed', is_ignored: true, show_first: false },
  { name: 'ignore', is_ignored: true, show_first: false },
  { name: 'Ignore', is_ignored: true, show_first: false },
  { name: isEn ? 'Ignore' : 'نادیده گرفتن', is_ignored: true, show_first: false },
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
  const { t, language } = useTranslation();
  const isEn = language === 'en';

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

  // Sync prop-level activeTradeId if provided by parent
  useEffect(() => {
    if (initialActiveTradeId !== undefined) {
      setActiveTradeId(initialActiveTradeId);
    }
  }, [initialActiveTradeId]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState(t('filters.allSymbols'));
  const [selectedDirection, setSelectedDirection] = useState(t('filters.allDirections'));
  const [selectedTimeframe, setSelectedTimeframe] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'OPEN' | 'CLOSED' | 'MISSED'>('ALL');
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [allEmotions, setAllEmotions] = useState<{ value: string; label: string; emoji?: string }[]>(() => getDefaultEmotions(language));
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
    return [t('filters.allSymbols'), ...Array.from(symbols)];
  }, [trades]);

  const [allTags, setAllTags] = useState<TagObject[]>([]);
  const { tags: fetchedTags } = useTradesTags();

  useEffect(() => {
    if (Array.isArray(fetchedTags)) {
      setAllTags(prev => {
        const map = new Map<string, TagObject>();
        prev.forEach(t => map.set(t.name, t));
        fetchedTags.forEach((t: TagObject) => {
          map.set(t.name, {
            name: t.name,
            is_ignored: Boolean(t.is_ignored),
            show_first: Boolean(t.show_first),
          });
        });
        return Array.from(map.values());
      });
    }
  }, [fetchedTags]);

  const handleAddCustomTag = async (newTag: string) => {
    try {
      const res = await api.post('/api/trades/tags', { name: newTag, is_ignored: false, show_first: false });
      const persisted = res.data;
      setAllTags(prev => {
        const map = new Map<string, TagObject>();
        prev.forEach(t => map.set(t.name, t));
        map.set(newTag, {
          name: newTag,
          is_ignored: Boolean(persisted.is_ignored),
          show_first: Boolean(persisted.show_first),
        });
        return Array.from(map.values());
      });
    } catch (err) {
      console.error('Failed to persist custom tag:', err);
    }
  };

  const handleSaveTagConfigurations = async (tagsList: TagObject[], deletedNames: string[]) => {
    try {
      // Update local state for trades if there are deletions
      if (deletedNames.length > 0) {
        setTrades(prev => prev.map(t => ({
          ...t,
          tags: t.tags ? t.tags.filter(tag => !deletedNames.includes(tag)) : []
        })));
      }

      // Send bulk save request to backend
      await api.post('/api/trades/tags/bulk', { tags: tagsList, deletes: deletedNames });
    } catch (err) {
      console.error('Failed to save tag configurations:', err);
    }
  };

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
          emotion: t.emotion && deletedValues.includes(t.emotion) ? null : t.emotion
        })));
      }

      // Send bulk save request to backend
      await api.post('/api/trades/emotions/bulk', { emotions: emotionsList, deletes: deletedValues });
    } catch (err) {
      console.error('Failed to save emotion configurations:', err);
    }
  };

  // Seed allTags from trades
  useEffect(() => {
    if (trades.length === 0) return;
    setAllTags(prev => {
      const map = new Map<string, TagObject>();
      prev.forEach(t => map.set(t.name, t));
      trades.forEach(t => {
        if (t.tags && Array.isArray(t.tags)) {
          t.tags.forEach(tag => {
            if (tag && !map.has(tag)) {
              map.set(tag, { name: tag, is_ignored: false, show_first: false });
            }
          });
        }
      });
      return Array.from(map.values());
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
          updated.push({ value: t.emotion, label: t.emotion, emoji: '💭' });
        }
      });
      return updated;
    });
  }, [trades]);

  const activeTrade = useMemo(() => {
    return trades.find(t => t.id === activeTradeId) || null;
  }, [trades, activeTradeId]);

  const ignoredTagsSet = useMemo(() => {
    const set = new Set<string>();
    allTags.forEach(t => {
      if (t.is_ignored) set.add(t.name);
    });
    return set;
  }, [allTags]);

  // Filtered trades
  const filteredTrades = useMemo(() => {
    const result = trades.filter(trade => {
      if (filterDatesArray.length > 0) {
        const closeDate = getLocalDateStr(trade.closeTime, selectedTimezone);
        const matchClose = closeDate ? filterDatesArray.includes(closeDate) : false;
        if (!matchClose) {
          return false;
        }
      }
      if (selectedSymbol !== t('filters.allSymbols')) {
        if (selectedSymbol.startsWith('main:')) {
          const mainPair = selectedSymbol.substring(5);
          if (getMainPair(trade.symbol) !== mainPair) {
            return false;
          }
        } else if (trade.symbol !== selectedSymbol) {
          return false;
        }
      }
      if (selectedDirection !== t('filters.allDirections')) {
        const dir = selectedDirection === t('filters.buy') ? 'BUY' : 'SELL';
        if (trade.direction !== dir) return false;
      }
      if (selectedTimeframe !== 'ALL') {
        const matchAnalysis = trade.analysisTimeframe === selectedTimeframe;
        const matchEntry = trade.entryTimeframe === selectedTimeframe;
        if (!matchAnalysis && !matchEntry) return false;
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
      const isMissed = trade.tags?.some(tag => ignoredTagsSet.has(tag));
      if (selectedStatus === 'OPEN' && (isMissed || trade.closeTime !== null)) return false;
      if (selectedStatus === 'CLOSED' && (isMissed || trade.closeTime === null)) return false;
      if (selectedStatus === 'MISSED' && !isMissed) return false;
      return true;
    });

    // Client-side sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'date':
          cmp = new Date(a.openTime).getTime() - new Date(b.openTime).getTime();
          break;
        case 'symbol':
          cmp = a.symbol.localeCompare(b.symbol);
          break;
        case 'direction':
          cmp = a.direction.localeCompare(b.direction);
          break;
        case 'volume':
          cmp = a.lotSize - b.lotSize;
          break;
        case 'pnl':
          cmp = getNetPnl(a) - getNetPnl(b);
          break;
        case 'rr':
          cmp = a.rMultiple - b.rMultiple;
          break;
        default:
          cmp = new Date(a.openTime).getTime() - new Date(b.openTime).getTime();
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [trades, selectedSymbol, selectedDirection, selectedTimeframe, searchQuery, selectedStatus, filterDatesArray, selectedTimezone, ignoredTagsSet, sortKey, sortDir]);

  // Summary Metrics
  const summary = useMemo(() => {
    const activeTrades = filteredTrades.filter(
      t => !t.tags?.some(tag => ignoredTagsSet.has(tag))
    );
    const count = activeTrades.length;
    const wins = activeTrades.filter(t => getNetPnl(t) > 0).length;
    const winRate = count > 0 ? Math.round((wins / count) * 100) : 0;
    const totalProfit = activeTrades.reduce((sum, t) => sum + getNetPnl(t), 0);
    return { count, winRate, totalProfit };
  }, [filteredTrades, ignoredTagsSet]);

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
      setActiveTradeId(null);
    }
  };

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
        setActiveTradeId(null);
      }
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

  const updateActiveTradeField = (key: keyof Trade, value: any) => {
    if (!activeTradeId) return;
    setTrades(prev =>
      prev.map(t => {
        if (t.id !== activeTradeId) return t;

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
          selectedTimeframe={selectedTimeframe}
          setSelectedTimeframe={setSelectedTimeframe}
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
            ignoredTags={ignoredTagsSet}
            allTags={allTags}
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
          setActiveTradeId={setActiveTradeId}
          handleSelectRow={handleSelectRow}
          selectedTimezone={selectedTimezone}
          usdToToman={usdToToman}
          allEmotions={allEmotions}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          ignoredTags={ignoredTagsSet}
          allTags={allTags}
        />

        {/* 6. Pagination */}
        <div className="pagination-container">
          <div>
            {isEn
              ? `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, filteredTrades.length)} of ${filteredTrades.length} trades`
              : `نمایش ${toPersianDigits((currentPage - 1) * itemsPerPage + 1)} تا ${toPersianDigits(Math.min(currentPage * itemsPerPage, filteredTrades.length))} از ${toPersianDigits(filteredTrades.length)} معامله`}
          </div>
          <div className="pagination-actions">
            <button
              className="nav-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="material-symbols-outlined btn-icon">arrow_forward</span>
              {isEn ? 'Previous' : 'قبلی'}
            </button>
            <span className="page-indicator">
              {isEn
                ? `Page ${currentPage} of ${totalPages}`
                : `صفحه ${toPersianDigits(currentPage)} از ${toPersianDigits(totalPages)}`}
            </span>
            <button
              className="nav-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {isEn ? 'Next' : 'بعدی'}
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
          onAddCustomTag={handleAddCustomTag}
          onSaveTagConfigurations={handleSaveTagConfigurations}
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
    </div>
  );
}
