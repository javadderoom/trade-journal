'use client';

import React from 'react';
import Select from '../ui/Select';
import { getSymbolFilterOptions } from '../../utils/tradeHelpers';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedStatus: 'ALL' | 'OPEN' | 'CLOSED' | 'MISSED';
  setSelectedStatus: (status: 'ALL' | 'OPEN' | 'CLOSED' | 'MISSED') => void;
  setCurrentPage: (page: number) => void;
  isAdvancedFiltersOpen: boolean;
  setIsAdvancedFiltersOpen: (open: boolean) => void;
  onRefresh?: () => void;
  selectedSymbol: string;
  setSelectedSymbol: (val: string) => void;
  symbolOptions: string[];
  selectedDirection: string;
  setSelectedDirection: (val: string) => void;
  selectedTimeframe: string;
  setSelectedTimeframe: (val: string) => void;
  selectedTimezone: string;
  setSelectedTimezone: (val: string) => void;
  usdToToman: number;
  setUsdToToman: (val: number) => void;
  accounts?: any[];
  selectedAccountId?: string;
  onAccountIdChange?: (val: string) => void;
}

export default function FilterBar({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  setCurrentPage,
  isAdvancedFiltersOpen,
  setIsAdvancedFiltersOpen,
  onRefresh,
  selectedSymbol,
  setSelectedSymbol,
  symbolOptions,
  selectedDirection,
  setSelectedDirection,
  selectedTimeframe,
  setSelectedTimeframe,
  selectedTimezone,
  setSelectedTimezone,
  usdToToman,
  setUsdToToman,
  accounts = [],
  selectedAccountId = 'all',
  onAccountIdChange,
}: FilterBarProps) {
  return (
    <div className="filters-bar-container">
      <div className="filters-main-row">
        {/* Search Input */}
        <div className="filter-input-wrapper search-wrapper">
          <span className="material-symbols-outlined filter-icon">search</span>
          <input
            type="text"
            placeholder="جستجو نماد، تیکت، یادداشت..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Quick Status Segmented Selector */}
        <div className="segmented-status-selector">
          <button
            type="button"
            className={selectedStatus === 'ALL' ? 'active' : ''}
            onClick={() => {
              setSelectedStatus('ALL');
              setCurrentPage(1);
            }}
          >
            همه
          </button>
          <button
            type="button"
            className={selectedStatus === 'OPEN' ? 'active' : ''}
            onClick={() => {
              setSelectedStatus('OPEN');
              setCurrentPage(1);
            }}
          >
            باز
          </button>
          <button
            type="button"
            className={selectedStatus === 'CLOSED' ? 'active' : ''}
            onClick={() => {
              setSelectedStatus('CLOSED');
              setCurrentPage(1);
            }}
          >
            بسته
          </button>
          <button
            type="button"
            className={selectedStatus === 'MISSED' ? 'active' : ''}
            onClick={() => {
              setSelectedStatus('MISSED');
              setCurrentPage(1);
            }}
          >
            فرصت سوخته
          </button>
        </div>

        {/* Actions: Toggle Advanced & Refresh */}
        <div className="filters-action-group">
          <button
            type="button"
            className={`btn-toggle-advanced ${isAdvancedFiltersOpen ? 'active' : ''}`}
            onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
            title="فیلترهای پیشرفته"
          >
            <span className="material-symbols-outlined">tune</span>
            <span>فیلترهای پیشرفته</span>
          </button>
          
          <button className="icon-btn refresh-btn" title="بروزرسانی" onClick={onRefresh}>
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>

      {/* Collapsible Advanced Filters Drawer */}
      {isAdvancedFiltersOpen && (
        <div className="filters-advanced-panel animate-slide-down">
          <div className="advanced-fields-grid">
            <div className="advanced-field">
              <label>حساب معاملاتی</label>
              <Select
                value={selectedAccountId || 'all'}
                onChange={(val) => {
                  onAccountIdChange?.(val);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'all', label: 'همه حساب‌ها' },
                  ...accounts.map(acc => ({
                    value: acc.id,
                    label: `${acc.broker_name || 'MT5'} (${acc.account_number || acc.id})`,
                  })),
                ]}
              />
            </div>

            <div className="advanced-field">
              <label>نماد معاملاتی</label>
              <Select
                value={selectedSymbol}
                onChange={(val) => {
                  setSelectedSymbol(val);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'همه نمادها', label: 'همه نمادها' },
                  ...getSymbolFilterOptions(symbolOptions.filter(s => s !== 'همه نمادها'))
                ]}
              />
            </div>

            <div className="advanced-field">
              <label>جهت معامله</label>
              <Select
                value={selectedDirection}
                onChange={(val) => {
                  setSelectedDirection(val);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'همه جهت‌ها', label: 'همه جهت‌ها' },
                  { value: 'خرید (Buy)', label: '↑ خرید' },
                  { value: 'فروش (Sell)', label: '↓ فروش' },
                ]}
              />
            </div>

            <div className="advanced-field">
              <label>تایم‌فریم</label>
              <Select
                value={selectedTimeframe}
                onChange={(val) => {
                  setSelectedTimeframe(val);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'ALL', label: 'همه تایم‌فریم‌ها' },
                  { value: 'M1',  label: '۱ دقیقه (M1)' },
                  { value: 'M5',  label: '۵ دقیقه (M5)' },
                  { value: 'M15', label: '۱۵ دقیقه (M15)' },
                  { value: 'M30', label: '۳۰ دقیقه (M30)' },
                  { value: 'H1',  label: '۱ ساعته (H1)' },
                  { value: 'H4',  label: '۴ ساعته (H4)' },
                  { value: 'D1',  label: 'روزانه (D1)' },
                  { value: 'W1',  label: 'هفتگی (W1)' },
                  { value: 'MN',  label: 'ماهانه (MN)' },
                ]}
              />
            </div>

            <div className="advanced-field">
              <label>منطقه زمانی</label>
              <Select
                value={selectedTimezone}
                onChange={setSelectedTimezone}
                options={[
                  { value: 'Asia/Tehran',     label: '🇮🇷 تهران (GMT+۳:۳۰)' },
                  { value: 'UTC',             label: '🌐 UTC (GMT+۰)' },
                  { value: 'Europe/London',   label: '🇬🇧 لندن (GMT+۰ / تابستان +۱)' },
                  { value: 'America/New_York',label: '🇺🇸 نیویورک (GMT−۵ / تابستان −۴)' },
                ]}
              />
            </div>

            <div className="advanced-field">
              <label>نرخ دلار به تومان</label>
              <div className="rate-input-wrapper">
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
            </div>
          </div>

          <div className="advanced-panel-footer">
            <button
              className="btn btn-secondary btn-clear"
              onClick={() => {
                setSearchQuery('');
                setSelectedSymbol('همه نمادها');
                setSelectedDirection('همه جهت‌ها');
                setSelectedTimeframe('ALL');
                setSelectedStatus('ALL');
                setCurrentPage(1);
              }}
            >
              <span className="material-symbols-outlined">filter_alt_off</span>
              پاک کردن فیلترها
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
