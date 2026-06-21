'use client';

import React, { useState } from 'react';
import { Trade } from './TradesTable';
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
  allTags: string[];
  setAllTags: React.Dispatch<React.SetStateAction<string[]>>;
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
}: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'journal'>('stats');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isAddingEmotion, setIsAddingEmotion] = useState(false);

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
