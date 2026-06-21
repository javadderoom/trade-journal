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
  allEmotions: { value: string; label: string; emoji?: string }[];
  setAllEmotions: React.Dispatch<React.SetStateAction<{ value: string; label: string; emoji?: string }[]>>;
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
  onSaveTagConfigurations?: (tags: TagObject[], deletes: string[]) => Promise<void>;
  onSaveEmotionConfigurations?: (emotions: { value: string; label: string; emoji: string }[], deletes: string[]) => Promise<void>;
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
  onSaveTagConfigurations,
  onSaveEmotionConfigurations,
}: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'journal'>('stats');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isAddingEmotion, setIsAddingEmotion] = useState(false);
  const [isConfiguringTags, setIsConfiguringTags] = useState(false);
  const [isConfiguringEmotions, setIsConfiguringEmotions] = useState(false);
  const [deletedTagDrafts, setDeletedTagDrafts] = useState<string[]>([]);
  const [deletedEmotionDrafts, setDeletedEmotionDrafts] = useState<string[]>([]);

  // Keep ref of state to save on unmount/drawer closure if needed
  const configStateRef = React.useRef({ allTags, deletedTagDrafts, isConfiguringTags });
  React.useEffect(() => {
    configStateRef.current = { allTags, deletedTagDrafts, isConfiguringTags };
  }, [allTags, deletedTagDrafts, isConfiguringTags]);

  const saveCallbackRef = React.useRef(onSaveTagConfigurations);
  React.useEffect(() => {
    saveCallbackRef.current = onSaveTagConfigurations;
  }, [onSaveTagConfigurations]);

  React.useEffect(() => {
    return () => {
      const { allTags: finalTags, deletedTagDrafts: finalDeletes, isConfiguringTags: wasConfiguring } = configStateRef.current;
      if (wasConfiguring && saveCallbackRef.current) {
        saveCallbackRef.current(finalTags, finalDeletes);
      }
    };
  }, []);

  const handleToggleConfigMode = async () => {
    if (isConfiguringTags) {
      if (onSaveTagConfigurations) {
        await onSaveTagConfigurations(allTags, deletedTagDrafts);
      }
      setDeletedTagDrafts([]);
    }
    setIsConfiguringTags(!isConfiguringTags);
  };

  const configEmotionsStateRef = React.useRef({ allEmotions, deletedEmotionDrafts, isConfiguringEmotions });
  React.useEffect(() => {
    configEmotionsStateRef.current = { allEmotions, deletedEmotionDrafts, isConfiguringEmotions };
  }, [allEmotions, deletedEmotionDrafts, isConfiguringEmotions]);

  const saveEmotionsCallbackRef = React.useRef(onSaveEmotionConfigurations);
  React.useEffect(() => {
    saveEmotionsCallbackRef.current = onSaveEmotionConfigurations;
  }, [onSaveEmotionConfigurations]);

  React.useEffect(() => {
    return () => {
      const { allEmotions: finalEmotions, deletedEmotionDrafts: finalDeletes, isConfiguringEmotions: wasConfiguring } = configEmotionsStateRef.current;
      if (wasConfiguring && saveEmotionsCallbackRef.current) {
        const mapped = finalEmotions.map(e => ({
          value: e.value,
          label: e.label,
          emoji: e.emoji || '💭'
        }));
        saveEmotionsCallbackRef.current(mapped, finalDeletes);
      }
    };
  }, []);

  const handleToggleEmotionsConfigMode = async () => {
    if (isConfiguringEmotions) {
      if (onSaveEmotionConfigurations) {
        const mapped = allEmotions.map(e => ({
          value: e.value,
          label: e.label,
          emoji: e.emoji || '💭'
        }));
        await onSaveEmotionConfigurations(mapped, deletedEmotionDrafts);
      }
      setDeletedEmotionDrafts([]);
    }
    setIsConfiguringEmotions(!isConfiguringEmotions);
  };

  const handleUpdateEmotionEmoji = (value: string, newEmoji: string) => {
    setAllEmotions(prev =>
      prev.map(e => (e.value === value ? { ...e, emoji: newEmoji } : e))
    );
  };

  const handleUpdateEmotionLabel = (value: string, newLabel: string) => {
    setAllEmotions(prev =>
      prev.map(e => (e.value === value ? { ...e, label: newLabel } : e))
    );
  };

  const handleDeleteEmotion = (value: string) => {
    setDeletedEmotionDrafts(prev => [...prev, value]);
    setAllEmotions(prev => prev.filter(e => e.value !== value));
    if (activeTrade.emotion === value) {
      updateActiveTradeField('emotion', null);
    }
  };


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
                  onClick={handleToggleConfigMode}
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
                          onClick={() => {
                            setAllTags(prev => prev.map(t => t.name === tag.name ? { ...t, is_ignored: !t.is_ignored } : t));
                          }}
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
                          onClick={() => {
                            setAllTags(prev => prev.map(t => t.name === tag.name ? { ...t, show_first: !t.show_first } : t));
                          }}
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
                          onClick={() => {
                            setDeletedTagDrafts(prev => [...prev, tag.name]);
                            setAllTags(prev => prev.filter(t => t.name !== tag.name));
                            if (activeTrade.tags?.includes(tag.name)) {
                              updateActiveTradeField('tags', activeTrade.tags.filter(t => t !== tag.name));
                            }
                          }}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ marginBottom: 0 }}>برچسب‌های احساسی</label>
                <button
                  type="button"
                  onClick={handleToggleEmotionsConfigMode}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isConfiguringEmotions ? '#61f9b1' : '#8898aa',
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
                    {isConfiguringEmotions ? 'check' : 'settings'}
                  </span>
                  {isConfiguringEmotions ? 'تأیید تنظیمات' : 'مدیریت ویژگی‌ها'}
                </button>
              </div>

              {isConfiguringEmotions ? (
                /* Emotions Management List View */
                <div className="emotions-management-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {allEmotions.map(emotion => {
                    const displayEmoji = emotion.emoji || getEmotionEmoji(emotion.value, allEmotions);
                    return (
                      <div key={emotion.value} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        {/* Emoji Input */}
                        <input
                          type="text"
                          value={displayEmoji}
                          onChange={(e) => handleUpdateEmotionEmoji(emotion.value, e.target.value)}
                          maxLength={4}
                          style={{
                            width: '40px',
                            height: '32px',
                            textAlign: 'center',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '16px',
                            outline: 'none',
                            fontFamily: 'Segoe UI Emoji, Apple Color Emoji, Vazirmatn'
                          }}
                          title="اموجی"
                        />
                        {/* Label Input */}
                        <input
                          type="text"
                          value={emotion.label}
                          onChange={(e) => handleUpdateEmotionLabel(emotion.value, e.target.value)}
                          style={{
                            flex: 1,
                            height: '32px',
                            padding: '0 8px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '13px',
                            outline: 'none',
                            fontFamily: 'Vazirmatn'
                          }}
                          placeholder="نام احساس..."
                        />
                        {/* Delete Emotion */}
                        <button
                          type="button"
                          onClick={() => handleDeleteEmotion(emotion.value)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ffb4ab',
                            cursor: 'pointer',
                            padding: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            outline: 'none',
                          }}
                          title="حذف احساس از کل کتابخانه"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Default Selection Pool View */
                <div className="tags-container">
                  {[...allEmotions]
                    .sort((a, b) => {
                      const aSelected = activeTrade.emotion === a.value ? 1 : 0;
                      const bSelected = activeTrade.emotion === b.value ? 1 : 0;
                      return bSelected - aSelected;
                    })
                    .map(({ value, label, emoji }) => {
                      const isSelected = activeTrade.emotion === value;
                      const displayEmoji = emoji || getEmotionEmoji(value, allEmotions);
                      return (
                        <span
                          key={value}
                          className={`tag${isSelected ? ' selected' : ''}`}
                          onClick={() =>
                            updateActiveTradeField('emotion', isSelected ? null : value)
                          }
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>{displayEmoji}</span>
                          <span>{label}</span>
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
                            const match = val.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*(.*)$/u);
                            let emojiVal = '💭';
                            let labelVal = val;
                            if (match) {
                              emojiVal = match[1];
                              labelVal = match[2].trim() || val;
                            }
                            const valueKey = labelVal.toUpperCase();

                            updateActiveTradeField('emotion', valueKey);
                            setAllEmotions(prev => {
                              if (prev.some(e => e.value === valueKey)) return prev;
                              return [...prev, { value: valueKey, label: labelVal, emoji: emojiVal }];
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
              )}
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
