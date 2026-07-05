'use client';

import React from 'react';
import Select from '../ui/Select';
import { getSymbolFilterOptions } from '../../utils/tradeHelpers';
import { useTranslation } from '../../store/useAppStore';

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
  const { t, language } = useTranslation();

  return (
    <div className="filters-bar-container">
      <div className="filters-main-row">
        {/* Search Input */}
        <div className="filter-input-wrapper search-wrapper">
          <span className="material-symbols-outlined filter-icon">search</span>
          <input
            type="text"
            placeholder={t('filters.searchPlaceholder')}
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
            {t('filters.statusAll')}
          </button>
          <button
            type="button"
            className={selectedStatus === 'OPEN' ? 'active' : ''}
            onClick={() => {
              setSelectedStatus('OPEN');
              setCurrentPage(1);
            }}
          >
            {t('filters.statusOpen')}
          </button>
          <button
            type="button"
            className={selectedStatus === 'CLOSED' ? 'active' : ''}
            onClick={() => {
              setSelectedStatus('CLOSED');
              setCurrentPage(1);
            }}
          >
            {t('filters.statusClosed')}
          </button>
          <button
            type="button"
            className={selectedStatus === 'MISSED' ? 'active' : ''}
            onClick={() => {
              setSelectedStatus('MISSED');
              setCurrentPage(1);
            }}
          >
            {t('filters.statusMissed')}
          </button>
        </div>

        {/* Actions: Toggle Advanced & Refresh */}
        <div className="filters-action-group">
          <button
            type="button"
            className={`btn-toggle-advanced ${isAdvancedFiltersOpen ? 'active' : ''}`}
            onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
            title={t('filters.advancedFilters')}
          >
            <span className="material-symbols-outlined">tune</span>
            <span>{t('filters.advancedFilters')}</span>
          </button>
          
          <button className="icon-btn refresh-btn" title={t('filters.refresh')} onClick={onRefresh}>
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>

      {/* Collapsible Advanced Filters Drawer */}
      {isAdvancedFiltersOpen && (
        <div className="filters-advanced-panel animate-slide-down">
          <div className="advanced-fields-grid">
            <div className="advanced-field">
              <label>{t('filters.tradingAccount')}</label>
              <Select
                value={selectedAccountId || 'all'}
                onChange={(val) => {
                  onAccountIdChange?.(val);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'all', label: t('filters.allAccounts') },
                  ...accounts.map(acc => ({
                    value: acc.id,
                    label: `${acc.broker_name || 'MT5'} (${acc.account_number || acc.id})`,
                  })),
                ]}
              />
            </div>

            <div className="advanced-field">
              <label>{t('filters.tradingSymbol')}</label>
              <Select
                value={selectedSymbol}
                onChange={(val) => {
                  setSelectedSymbol(val);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'همه نمادها', label: t('filters.allSymbols') },
                  ...getSymbolFilterOptions(symbolOptions.filter(s => s !== 'همه نمادها'))
                ]}
              />
            </div>

            <div className="advanced-field">
              <label>{t('filters.tradeDirection')}</label>
              <Select
                value={selectedDirection}
                onChange={(val) => {
                  setSelectedDirection(val);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'همه جهت‌ها', label: t('filters.allDirections') },
                  { value: 'خرید (Buy)', label: t('filters.buy') },
                  { value: 'فروش (Sell)', label: t('filters.sell') },
                ]}
              />
            </div>

            <div className="advanced-field">
              <label>{t('filters.timeframe')}</label>
              <Select
                value={selectedTimeframe}
                onChange={(val) => {
                  setSelectedTimeframe(val);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'ALL', label: t('filters.allTimeframes') },
                  { value: 'M1',  label: 'M1' },
                  { value: 'M5',  label: 'M5' },
                  { value: 'M15', label: 'M15' },
                  { value: 'M30', label: 'M30' },
                  { value: 'H1',  label: 'H1' },
                  { value: 'H4',  label: 'H4' },
                  { value: 'D1',  label: 'D1' },
                  { value: 'W1',  label: 'W1' },
                  { value: 'MN',  label: 'MN' },
                ]}
              />
            </div>

            <div className="advanced-field">
              <label>{t('filters.timezone')}</label>
              <Select
                value={selectedTimezone}
                onChange={setSelectedTimezone}
                options={[
                  { value: 'Asia/Tehran',     label: language === 'fa' ? '🇮🇷 تهران (GMT+۳:۳۰)' : '🇮🇷 Tehran (GMT+3:30)' },
                  { value: 'UTC',             label: '🌐 UTC (GMT+0)' },
                  { value: 'Europe/London',   label: language === 'fa' ? '🇬🇧 لندن (GMT+۰ / تابستان +۱)' : '🇬🇧 London (GMT+0 / BST+1)' },
                  { value: 'America/New_York',label: language === 'fa' ? '🇺🇸 نیویورک (GMT−۵ / تابستان −۴)' : '🇺🇸 New York (GMT-5 / EDT-4)' },
                ]}
              />
            </div>

            {/* USD to Toman Rate Field - Only display if active language is Farsi (fa) */}
            {language === 'fa' && (
              <div className="advanced-field">
                <label>{t('filters.usdToTomanRate')}</label>
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
            )}
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
              {t('filters.clearFilters')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
