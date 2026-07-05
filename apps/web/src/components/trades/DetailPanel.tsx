'use client';

import React, { useState } from 'react';
import { Trade, TagObject } from './TradesTable';
import TradeChart from './TradeChart';
import { toPersianDigits, formatPersianCurrency, formatToman } from '../../utils/farsi';
import { useTranslation } from '../../store/useAppStore';
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
  const { t, language } = useTranslation();
  const isEn = language === 'en';

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    borderRadius: '4px',
    padding: '2px 8px',
    width: '100%',
    fontFamily: language === 'fa' ? 'Vazirmatn' : 'inherit',
    fontSize: '13px',
    outline: 'none',
    height: '32px',
  };

  const p = {
    details: isEn ? 'Details' : 'مشخصات',
    notesTab: isEn ? 'Notes & Documents' : 'یادداشت و مستندات',
    netProfit: isEn ? 'Net Profit (P&L)' : '{p.netProfit}',
    closed: isEn ? 'Closed' : 'بسته شده',
    open: isEn ? 'Open' : 'باز',
    pips: isEn ? 'Pips' : 'پیپ',
    riskReward: isEn ? 'Risk to Reward' : 'ریسک به ریوارد',
    chartTitle: isEn ? 'Trade Price Chart' : 'نمودار قیمت معامله',
    executionDetails: isEn ? 'Execution Details' : 'جزئیات اجرا',
    account: isEn ? 'Trading Account:' : '{p.account}',
    symbol: isEn ? 'Symbol:' : '{p.symbol}',
    direction: isEn ? 'Direction:' : '{p.direction}',
    volume: isEn ? 'Volume (Lot):' : '{p.volume}',
    openTime: isEn ? 'Open Time:' : '{p.openTime}',
    openSession: isEn ? 'Entry Session:' : '{p.openSession}',
    analysisTimeframe: isEn ? 'Analysis Timeframe:' : '{p.analysisTimeframe}',
    entryTimeframe: isEn ? 'Entry Timeframe:' : '{p.entryTimeframe}',
    openPrice: isEn ? 'Open Price:' : '{p.openPrice}',
    sl: isEn ? 'Stop Loss (SL):' : '{p.sl}',
    tp: isEn ? 'Take Profit (TP):' : '{p.tp}',
    closeTime: isEn ? 'Close Time:' : '{p.closeTime}',
    closePrice: isEn ? 'Close Price:' : '{p.closePrice}',
    profitUsd: isEn ? 'Profit/Loss (USD):' : '{p.profitUsd}',
    commission: isEn ? 'Commission:' : '{p.commission}',
    swap: isEn ? 'Swap:' : '{p.swap}',
    closeTrade: isEn ? 'Close Trade' : '{p.closeTrade}',
    reopenTrade: isEn ? 'Reopen Trade' : '{p.reopenTrade}',
    timeframe: isEn ? 'Timeframe' : 'تایم‌فریم',
    tradeEmotion: isEn ? 'Trade Emotion' : 'احساس معاملاتی',
    manageProps: isEn ? 'Manage Properties' : 'مدیریت ویژگی‌ها',
    confirmSettings: isEn ? 'Confirm Settings' : 'تأیید تنظیمات',
    emoji: isEn ? 'Emoji' : 'اموجی',
    emotionName: isEn ? 'Emotion name...' : 'نام احساس...',
    deleteEmotionTitle: isEn ? 'Delete emotion from library' : 'حذف احساس از کل کتابخانه',
    addEmotion: isEn ? 'Add Emotion' : 'افزودن احساس',
    journalNotes: isEn ? 'Journal Notes' : 'یادداشت‌های ژورنال',
    notesPlaceholder: isEn ? 'What was the reason for entering this trade? How were the market conditions...?' : 'دلیل ورود به این معامله چه بود؟ شرایط بازار چگونه بود...؟',
    screenshots: isEn ? 'Trade Screenshots (Visual Proof)' : 'تصاویر معامله (سند تصویری)',
    uploading: isEn ? 'Uploading...' : 'بارگذاری...',
    addImage: isEn ? 'Add Image' : 'افزودن تصویر',
    saveChanges: isEn ? 'Save Changes' : 'ذخیره تغییرات',
    deleteTrade: isEn ? 'Delete Trade' : 'حذف معامله',
    tagPlaceholder: isEn ? 'Tag...' : 'برچسب...',
    addTag: isEn ? 'Add Tag' : 'افزودن برچسب',
    tagNamePlaceholder: isEn ? 'Tag name...' : 'نام برچسب...',
    deleteTagTitle: isEn ? 'Delete tag from library' : 'حذف برچسب از کل کتابخانه',
    showFirst: isEn ? 'Show first' : 'نمایش اول صف',
    ignoreTag: isEn ? 'Ignore in stats' : 'نادیده گرفتن در گزارش',
    defaultAccount: isEn ? 'Default Account' : 'حساب پیش‌فرض',
    buy: isEn ? 'Buy' : 'خرید',
    sell: isEn ? 'Sell' : 'فروش',
  };

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
              {activeTrade.direction === 'BUY' ? p.buy : p.sell} {toPersianDigits(activeTrade.lotSize)} Lots
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
          {p.details}
        </button>
        <button
          className={`tab-btn ${activeTab === 'journal' ? 'active' : ''}`}
          onClick={() => setActiveTab('journal')}
        >
          <span className="material-symbols-outlined tab-icon">rate_review</span>
          {p.notesTab}
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
                <span className="label">{p.netProfit}</span>
                <span className="status">
                  {activeTrade.closeTime ? p.closed : p.open}
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
                  <span className="stat-label">{p.pips}</span>
                  <span className="stat-value">
                    {activeTrade.pips > 0 ? '+' : ''}
                    {toPersianDigits(activeTrade.pips.toFixed(1))}
                  </span>
                </div>
                <div className="divider"></div>
                <div className="metric-item">
                  <span className="stat-label">{p.riskReward}</span>
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
                <label className="section-label">{p.chartTitle}</label>
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
              <h3>{p.executionDetails}</h3>
              <div className="details-grid">
                 <span className="grid-label">{p.account}</span>
                 <span className="grid-value">
                    <select
                      className="grid-input"
                      value={activeTrade.accountId || 'dev-account'}
                      onChange={e => updateActiveTradeField('accountId', e.target.value)}
                      style={inputStyle}
                    >
                      {accounts.map((acc: any) => (
                        <option key={acc.id} value={acc.id} style={{ backgroundColor: '#1e222b', color: '#fff' }}>
                          {acc.broker_name || 'MT5'} ({acc.account_number || acc.id})
                        </option>
                      ))}
                    </select>
                  </span>

                 <span className="grid-label">{p.symbol}</span>
                 <span className="grid-value">
                   <input
                     type="text"
                     className="grid-input"
                     value={activeTrade.symbol}
                     onChange={e => updateActiveTradeField('symbol', e.target.value.toUpperCase())}
                     style={inputStyle}
                   />
                 </span>

                 <span className="grid-label">{p.direction}</span>
                 <span className="grid-value">
                   <select
                     className="grid-input"
                     value={activeTrade.direction}
                     onChange={e => updateActiveTradeField('direction', e.target.value)}
                     style={{ ...inputStyle, cursor: 'pointer' }}
                   >
                     <option value="BUY" style={{ backgroundColor: '#1e222b', color: '#fff' }}>Buy</option>
                     <option value="SELL" style={{ backgroundColor: '#1e222b', color: '#fff' }}>Sell</option>
                   </select>
                 </span>

                 <span className="grid-label">{p.volume}</span>
                 <span className="grid-value">
                   <input
                     type="number"
                     step="any"
                     className="grid-input"
                     value={activeTrade.lotSize}
                     onChange={e => updateActiveTradeField('lotSize', parseFloat(e.target.value) || 0)}
                     style={inputStyle}
                   />
                 </span>

                 <span className="grid-label">{p.openTime}</span>
                 <span className="grid-value">
                   <input
                     type="datetime-local"
                     className="grid-input"
                     value={activeTrade.openTime ? activeTrade.openTime.substring(0, 16) : ''}
                     onChange={e => updateActiveTradeField('openTime', e.target.value ? new Date(e.target.value).toISOString() : null)}
                     style={inputStyle}
                   />
                 </span>

<span className="grid-label">{p.openSession}</span>
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

                  <span className="grid-label">{p.analysisTimeframe}</span>
                  <span className="grid-value">
                    <select
                      className="grid-input"
                      value={activeTrade.analysisTimeframe || ''}
                      onChange={e => updateActiveTradeField('analysisTimeframe', e.target.value || null)}
                      style={inputStyle}
                    >
                      <option value="" style={{ backgroundColor: '#1e222b', color: '#fff' }}>—</option>
                      <option value="M1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۱ دقیقه (M1)' : '1 Minute (M1)'}</option>
                      <option value="M5" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۵ دقیقه (M5)' : '5 Minutes (M5)'}</option>
                      <option value="M15" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۱۵ دقیقه (M15)' : '15 Minutes (M15)'}</option>
                      <option value="M30" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۳۰ دقیقه (M30)' : '30 Minutes (M30)'}</option>
                      <option value="H1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۱ ساعته (H1)' : '1 Hour (H1)'}</option>
                      <option value="H4" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۴ ساعته (H4)' : '4 Hours (H4)'}</option>
                      <option value="D1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? 'روزانه (D1)' : 'Daily (D1)'}</option>
                      <option value="W1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? 'هفتگی (W1)' : 'Weekly (W1)'}</option>
                      <option value="MN" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? 'ماهانه (MN)' : 'Monthly (MN)'}</option>
                    </select>
                  </span>

                  <span className="grid-label">{p.entryTimeframe}</span>
                  <span className="grid-value">
                    <select
                      className="grid-input"
                      value={activeTrade.entryTimeframe || ''}
                      onChange={e => updateActiveTradeField('entryTimeframe', e.target.value || null)}
                      style={inputStyle}
                    >
                      <option value="" style={{ backgroundColor: '#1e222b', color: '#fff' }}>—</option>
                      <option value="M1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۱ دقیقه (M1)' : '1 Minute (M1)'}</option>
                      <option value="M5" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۵ دقیقه (M5)' : '5 Minutes (M5)'}</option>
                      <option value="M15" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۱۵ دقیقه (M15)' : '15 Minutes (M15)'}</option>
                      <option value="M30" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۳۰ دقیقه (M30)' : '30 Minutes (M30)'}</option>
                      <option value="H1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۱ ساعته (H1)' : '1 Hour (H1)'}</option>
                      <option value="H4" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۴ ساعته (H4)' : '4 Hours (H4)'}</option>
                      <option value="D1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? 'روزانه (D1)' : 'Daily (D1)'}</option>
                      <option value="W1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? 'هفتگی (W1)' : 'Weekly (W1)'}</option>
                      <option value="MN" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? 'ماهانه (MN)' : 'Monthly (MN)'}</option>
                    </select>
                  </span>

                  <span className="grid-label">{p.openPrice}</span>
                 <span className="grid-value font-mono direction-ltr">
                   <input
                     type="number"
                     step="any"
                     className="grid-input"
                     value={activeTrade.openPrice}
                     onChange={e => updateActiveTradeField('openPrice', parseFloat(e.target.value) || 0)}
                     style={{ ...inputStyle, fontFamily: "'Courier New', monospace" }}
                   />
                 </span>

                 <span className="grid-label">{p.sl}</span>
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

                 <span className="grid-label">{p.tp}</span>
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

                 <span className="grid-label">{p.closeTime}</span>
                 <span className="grid-value">
                   <input
                     type="datetime-local"
                     className="grid-input"
                     value={activeTrade.closeTime ? activeTrade.closeTime.substring(0, 16) : ''}
                     onChange={e => updateActiveTradeField('closeTime', e.target.value ? new Date(e.target.value).toISOString() : null)}
                     style={inputStyle}
                   />
                 </span>

                 <span className="grid-label">{p.closePrice}</span>
                 <span className="grid-value font-mono direction-ltr">
                   <input
                     type="number"
                     step="any"
                     className="grid-input"
                     value={activeTrade.closePrice !== null ? activeTrade.closePrice : ''}
                     placeholder="--"
                     onChange={e => {
                       const val = e.target.value === '' ? null : parseFloat(e.target.value);
                       updateActiveTradeField('closePrice', val);
                     }}
                     style={{ ...inputStyle, fontFamily: "'Courier New', monospace" }}
                   />
                 </span>

                 <span className="grid-label">{p.profitUsd}</span>
                 <span className="grid-value">
                   <input
                     type="number"
                     step="any"
                     className="grid-input"
                     value={activeTrade.profitUsd}
                     onChange={e => updateActiveTradeField('profitUsd', parseFloat(e.target.value) || 0)}
                     style={inputStyle}
                   />
                 </span>

                 <span className="grid-label">{p.commission}</span>
                 <span className="grid-value">
                   <input
                     type="number"
                     step="any"
                     className="grid-input"
                     value={activeTrade.commission}
                     onChange={e => updateActiveTradeField('commission', parseFloat(e.target.value) || 0)}
                     style={inputStyle}
                   />
                 </span>

                 <span className="grid-label">{p.swap}</span>
                 <span className="grid-value">
                   <input
                     type="number"
                     step="any"
                     className="grid-input"
                     value={activeTrade.swap}
                     onChange={e => updateActiveTradeField('swap', parseFloat(e.target.value) || 0)}
                     style={inputStyle}
                   />
                 </span>
               </div>

               {!activeTrade.closeTime ? (
                 <button
                   type="button"
                   className="btn-save"
                   style={{ marginTop: '12px', width: '100%' }}
                   onClick={() => {
                     const now = new Date().toISOString();
                     if (activeTrade.closePrice === null) {
                       updateActiveTradeField('closePrice', activeTrade.openPrice);
                     }
                     updateActiveTradeField('closeTime', now);
                   }}
                 >
                   <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                   {p.closeTrade}
                 </button>
               ) : (
                 <button
                   type="button"
                   className="btn-ghost"
                   style={{ marginTop: '12px', width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#8898aa', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: language === 'fa' ? 'Vazirmatn' : 'inherit', fontSize: '13px' }}
                   onClick={() => {
                     updateActiveTradeField('closeTime', null);
                     updateActiveTradeField('closePrice', null);
                   }}
                 >
                   <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>undo</span>
                   {p.reopenTrade}
                 </button>
               )}
              </div>
            </>
         ) : (
          <>
            {/* Timeframe Selectors */}
            <div className="form-group">
              <label>{p.timeframe}</label>
              <div className="details-grid" style={{ marginTop: '6px' }}>
                <span className="grid-label">{p.analysisTimeframe}</span>
                <span className="grid-value">
                  <select
                    className="grid-input"
                    value={activeTrade.analysisTimeframe || ''}
                    onChange={e => updateActiveTradeField('analysisTimeframe', e.target.value || null)}
                    style={inputStyle}
                  >
                    <option value="" style={{ backgroundColor: '#1e222b', color: '#fff' }}>—</option>
                    <option value="M1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۱ دقیقه (M1)' : '1 Minute (M1)'}</option>
                    <option value="M5" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۵ دقیقه (M5)' : '5 Minutes (M5)'}</option>
                    <option value="M15" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۱۵ دقیقه (M15)' : '15 Minutes (M15)'}</option>
                    <option value="M30" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۳۰ دقیقه (M30)' : '30 Minutes (M30)'}</option>
                    <option value="H1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۱ ساعته (H1)' : '1 Hour (H1)'}</option>
                    <option value="H4" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۴ ساعته (H4)' : '4 Hours (H4)'}</option>
                    <option value="D1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? 'روزانه (D1)' : 'Daily (D1)'}</option>
                    <option value="W1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? 'هفتگی (W1)' : 'Weekly (W1)'}</option>
                    <option value="MN" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? 'ماهانه (MN)' : 'Monthly (MN)'}</option>
                  </select>
                </span>

                <span className="grid-label">{p.entryTimeframe}</span>
                <span className="grid-value">
                  <select
                    className="grid-input"
                    value={activeTrade.entryTimeframe || ''}
                    onChange={e => updateActiveTradeField('entryTimeframe', e.target.value || null)}
                    style={inputStyle}
                  >
                    <option value="" style={{ backgroundColor: '#1e222b', color: '#fff' }}>—</option>
                    <option value="M1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۱ دقیقه (M1)' : '1 Minute (M1)'}</option>
                    <option value="M5" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۵ دقیقه (M5)' : '5 Minutes (M5)'}</option>
                    <option value="M15" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۱۵ دقیقه (M15)' : '15 Minutes (M15)'}</option>
                    <option value="M30" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۳۰ دقیقه (M30)' : '30 Minutes (M30)'}</option>
                    <option value="H1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۱ ساعته (H1)' : '1 Hour (H1)'}</option>
                    <option value="H4" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? '۴ ساعته (H4)' : '4 Hours (H4)'}</option>
                    <option value="D1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? 'روزانه (D1)' : 'Daily (D1)'}</option>
                    <option value="W1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? 'هفتگی (W1)' : 'Weekly (W1)'}</option>
                    <option value="MN" style={{ backgroundColor: '#1e222b', color: '#fff' }}>{language === 'fa' ? 'ماهانه (MN)' : 'Monthly (MN)'}</option>
                  </select>
                </span>
              </div>
            </div>

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
                    fontFamily: language === 'fa' ? 'Vazirmatn' : 'inherit',
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
                            fontFamily: language === 'fa' ? 'Vazirmatn' : 'inherit',
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
                            fontFamily: language === 'fa' ? 'Vazirmatn' : 'inherit',
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
                          title={p.deleteTagTitle}
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
                            <span className="material-symbols-outlined" style={{ fontSize: '10px', color: '#ffb4ab' }} title={p.ignoreTag}>block</span>
                          )}
                        </span>
                      );
                    })}
                  {isAddingTag ? (
                    <input
                      type="text"
                      autoFocus
                      placeholder={p.tagPlaceholder}
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
                        fontFamily: language === 'fa' ? 'Vazirmatn' : 'inherit'
                      }}
                    />
                  ) : (
                    <span
                      className="add-tag-btn"
                      onClick={() => setIsAddingTag(true)}
                    >
                      <span className="material-symbols-outlined btn-icon" style={{ fontSize: '14px' }}>add</span>
                      {p.addTag}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ marginBottom: 0 }}>{p.tradeEmotion}</label>
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
                    fontFamily: language === 'fa' ? 'Vazirmatn' : 'inherit',
                    outline: 'none',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    {isConfiguringEmotions ? 'check' : 'settings'}
                  </span>
                  {isConfiguringEmotions ? p.confirmSettings : p.manageProps}
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
                            fontFamily: language === 'fa' ? 'Vazirmatn' : 'inherit'
                          }}
                          placeholder={p.emotionName}
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
                          title={p.deleteEmotionTitle}
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
                      placeholder={p.emoji}
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
                        fontFamily: language === 'fa' ? 'Vazirmatn' : 'inherit'
                      }}
                    />
                  ) : (
                    <span
                      className="add-tag-btn"
                      onClick={() => setIsAddingEmotion(true)}
                    >
                      <span className="material-symbols-outlined btn-icon" style={{ fontSize: '14px' }}>add</span>
                      {p.addEmotion}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Notes Area */}
            <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label>{p.journalNotes}</label>
              <textarea
                placeholder={p.notesPlaceholder}
                value={activeTrade.notes || ''}
                onChange={e => updateActiveTradeField('notes', e.target.value)}
              />
            </div>

            {/* Screenshots Group */}
            <div className="form-group screenshots-group">
              <label>{p.screenshots}</label>
              
              <div className="screenshots-grid">
                {activeTrade.screenshots && activeTrade.screenshots.map((url, idx) => {
                  const fullUrl = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000'}${url}`;
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
                      <p>{p.uploading}</p>
                    </div>
                  ) : (
                    <div className="upload-prompt">
                      <span className="material-symbols-outlined upload-icon">add_photo_alternate</span>
                      <p>{p.addImage}</p>
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
          {p.saveChanges}
        </button>
        <button className="btn-delete" onClick={handleDeleteClick} title={p.deleteTrade}>
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>
    </aside>
  );
}
