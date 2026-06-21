'use client';

import React, { useState } from 'react';
import { Trade, TagObject } from './TradesTable';
import TradeChart from './TradeChart';
import { toPersianDigits, formatPersianCurrency, formatToman } from '../../utils/farsi';
import {
  getEmotionEmoji,
  getEmotionLabel,
  formatDate,
  getTradingSession
} from '../../utils/tradeHelpers';

interface DetailPanelProps {
  activeTrade: Trade;
  setActiveTradeId: (id: string | null) => void;
  allTags: TagObject[];
  setAllTags: React.Dispatch<React.SetStateAction<TagObject[]>>;
  allEmotions: { value: string; label: string }[];
  setAllEmotions: React.Dispatch<React.SetStateAction<{ value: string; label: string }[]>>;
  isUploading: boolean;
  setLightboxUrl: (url: string | null) => void;
  updateActiveTradeField: (key: keyof Trade, value: any) => void;
  handleSaveDetails: (e: React.FormEvent) => void;
  handleDeleteClick: () => void;
  handleScreenshotUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteScreenshot: (url: string) => void;
  selectedTimezone: string;
  usdToToman: number;
  accounts?: any[];
  onAddCustomTag?: (newTag: string) => void;
  onUpdateTagOptions?: (tagName: string, options: { is_ignored?: boolean; show_first?: boolean }) => Promise<void>;
  onDeleteTagFromLibrary?: (tagName: string) => Promise<void>;
}

export default function DetailPanel({
  activeTrade,
  setActiveTradeId,
  allTags,
  setAllTags,
  allEmotions,
  setAllEmotions,
  isUploading,
  setLightboxUrl,
  updateActiveTradeField,
  handleSaveDetails,
  handleDeleteClick,
  handleScreenshotUpload,
  handleDeleteScreenshot,
  selectedTimezone,
  usdToToman,
  accounts = [],
  onAddCustomTag,
  onUpdateTagOptions,
  onDeleteTagFromLibrary,
}: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'journal'>('stats');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isAddingEmotion, setIsAddingEmotion] = useState(false);
  const [isConfiguringTags, setIsConfiguringTags] = useState(false);

  const formatCurrency = (val: number) => {
    return formatPersianCurrency(val);
  };

  return (
    <aside className="detail-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="header-info">
          <div className={`icon-wrapper ${activeTrade.direction === 'SELL' ? 'sell-icon-wrapper' : ''}`}>
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

      {/* Panel Body */}
      <div className="panel-body">
        {activeTab === 'stats' ? (
          <>
            {/* Financial Summary Box */}
            <div className={`financial-box ${activeTrade.profitUsd < 0 ? 'loss-box' : ''}`}>
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
                 <span className="grid-label">حساب معاملاتی:</span>
                 <span className="grid-value">
                   <select
                     className="grid-input"
                     value={activeTrade.accountId || 'dev-account'}
                     onChange={e => updateActiveTradeField('accountId', e.target.value)}
                     style={{
                       backgroundColor: 'transparent',
                       border: '1px solid rgba(255, 255, 255, 0.1)',
                       color: '#fff',
                       borderRadius: '4px',
                       padding: '2px 8px',
                       width: '100%',
                       fontFamily: 'Vazirmatn',
                       fontSize: '13px',
                       outline: 'none',
                       height: '32px',
                       cursor: 'pointer',
                     }}
                   >
                     {accounts.map((acc: any) => (
                       <option key={acc.id} value={acc.id} style={{ backgroundColor: '#1e222b', color: '#fff' }}>
                         {acc.broker_name || 'MT5'} ({acc.account_number || acc.id})
                       </option>
                     ))}
                   </select>
                 </span>

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ marginBottom: 0 }}>برچسب‌های معامله</label>
                <button
                  type="button"
                  onClick={() => setIsConfiguringTags(!isConfiguringTags)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isConfiguringTags ? '#61f9b1' : '#8898aa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontFamily: 'Vazirmatn',
                    outline: 'none',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    {isConfiguringTags ? 'check' : 'settings'}
                  </span>
                  {isConfiguringTags ? 'تأیید تنظیمات' : 'مدیریت ویژگی‌ها'}
                </button>
              </div>

              {isConfiguringTags ? (
                /* Management List View */
                <div className="tags-management-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {allTags.map(tag => (
                    <div key={tag.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{tag.name}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {/* Ignore toggle */}
                        <button
                          type="button"
                          onClick={() => onUpdateTagOptions?.(tag.name, { is_ignored: !tag.is_ignored })}
                          style={{
                            background: tag.is_ignored ? 'rgba(255, 180, 171, 0.15)' : 'transparent',
                            border: '1px solid ' + (tag.is_ignored ? '#ffb4ab' : 'rgba(255,255,255,0.15)'),
                            borderRadius: '4px',
                            color: tag.is_ignored ? '#ffb4ab' : '#8898aa',
                            padding: '2px 6px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            fontFamily: 'Vazirmatn',
                          }}
                          title="نادیده گرفتن از آمار"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>block</span>
                          نادیده
                        </button>

                        {/* Show first toggle */}
                        <button
                          type="button"
                          onClick={() => onUpdateTagOptions?.(tag.name, { show_first: !tag.show_first })}
                          style={{
                            background: tag.show_first ? 'rgba(97, 249, 177, 0.15)' : 'transparent',
                            border: '1px solid ' + (tag.show_first ? '#61f9b1' : 'rgba(255,255,255,0.15)'),
                            borderRadius: '4px',
                            color: tag.show_first ? '#61f9b1' : '#8898aa',
                            padding: '2px 6px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            fontFamily: 'Vazirmatn',
                          }}
                          title="نمایش در ابتدای لیست"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>star</span>
                          مهم
                        </button>

                        {/* Delete tag */}
                        <button
                          type="button"
                          onClick={() => onDeleteTagFromLibrary?.(tag.name)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ffb4ab',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                          title="حذف برچسب از کل کتابخانه"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Default Selection Pool View */
                <div className="tags-container">
                  {[...allTags]
                    .sort((a, b) => {
                      if (a.show_first && !b.show_first) return -1;
                      if (!a.show_first && b.show_first) return 1;
                      const aSelected = activeTrade.tags?.includes(a.name) ? 1 : 0;
                      const bSelected = activeTrade.tags?.includes(b.name) ? 1 : 0;
                      if (aSelected !== bSelected) return bSelected - aSelected;
                      return a.name.localeCompare(b.name, 'fa');
                    })
                    .map(tag => {
                      const isSelected = activeTrade.tags && activeTrade.tags.includes(tag.name);
                      return (
                        <span
                          key={tag.name}
                          className={`tag ${isSelected ? 'selected' : ''}`}
                          style={{
                            border: tag.show_first ? '1px dashed #61f9b1' : undefined,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onClick={() => {
                            const currentTags = activeTrade.tags || [];
                            const newTags = isSelected
                              ? currentTags.filter(t => t !== tag.name)
                              : [...currentTags, tag.name];
                            updateActiveTradeField('tags', newTags);
                          }}
                        >
                          {tag.show_first && (
                            <span className="material-symbols-outlined" style={{ fontSize: '10px', color: '#61f9b1' }}>star</span>
                          )}
                          {tag.name}
                          {tag.is_ignored && (
                            <span className="material-symbols-outlined" style={{ fontSize: '10px', color: '#ffb4ab' }} title="نادیده گرفته شده از آمار">block</span>
                          )}
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
                            onAddCustomTag?.(val);
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
              )}
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
  );
}
