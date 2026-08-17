'use client';

import React, { useState } from 'react';
import { Trade } from '../../types/trade';
import { TradingConcept } from '../../hooks/useTradingConcepts';

import TradeChart from './TradeChart';
import { toPersianDigits, formatToman, normalizeNumericInput } from '../../utils/farsi';
import { useTranslation } from '../../store/useAppStore';
import { getSharedTranslations } from '../../locales/components';
import LoadingButton from '../ui/LoadingButton';
import {
  formatCurrency,
  getNetPnl,
  getEmotionEmoji,
  getEmotionLabel,
  formatDate,
  getTradingSession
} from '../../utils/tradeHelpers';

interface DetailPanelProps {
  activeTrade: Trade;
  setActiveTradeId: (id: string | null) => void;
  tradingConcepts: TradingConcept[];
  allEmotions: { value: string; label: string; emoji?: string }[];
  setAllEmotions: React.Dispatch<React.SetStateAction<{ value: string; label: string; emoji?: string }[]>>;

  isUploading: boolean;
  setLightboxUrl: (url: string | null) => void;
  updateActiveTradeField: (key: keyof Trade | 'emotion' | 'notes' | 'screenshots' | 'htfBias' | 'session' | 'analysisTimeframe' | 'entryTimeframe' | 'thesis' | 'expectation' | 'lesson' | 'conviction' | 'setup' | 'triggers' | 'confluences' | 'plan', value: any) => void;
  handleSaveDetails: (e: React.FormEvent) => void | Promise<void>;
  handleDeleteClick: () => void;
  handleScreenshotUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteScreenshot: (url: string) => void;
  selectedTimezone: string;
  usdToToman: number;
  accounts?: any[];

  onSaveEmotionConfigurations?: (emotions: { value: string; label: string; emoji: string }[], deletes: string[]) => Promise<void>;
  onOpenReview?: () => void;
  onOpenInspect?: () => void;
}

export default function DetailPanel({
  activeTrade,
  setActiveTradeId,
  tradingConcepts = [],
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

  onSaveEmotionConfigurations,
  onOpenReview,
  onOpenInspect,
}: DetailPanelProps) {
  const { t, language } = useTranslation();
  const isEn = language === 'en';
  const [saving, setSaving] = useState(false);

  const handleSaveWithLoading = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await handleSaveDetails(e);
    } finally {
      setSaving(false);
    }
  };

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
    ...getSharedTranslations(isEn),
    details: isEn ? 'Details' : 'مشخصات',
    notesTab: isEn ? 'Notes & Documents' : 'یادداشت و مستندات',
    netProfit: isEn ? 'Net Profit (P&L)' : 'سود/زیان خالص',
    closed: isEn ? 'Closed' : 'بسته شده',
    open: isEn ? 'Open' : 'باز',
    pips: isEn ? 'Pips' : 'پیپ',
    riskReward: isEn ? 'Risk to Reward' : 'ریسک به ریوارد',
    chartTitle: isEn ? 'Trade Price Chart' : 'نمودار قیمت معامله',
    executionDetails: isEn ? 'Execution Details' : 'جزئیات اجرا',
    account: isEn ? 'Trading Account:' : 'حساب معاملاتی:',
    symbol: isEn ? 'Symbol:' : 'نماد:',
    direction: isEn ? 'Direction:' : 'جهت:',
    volume: isEn ? 'Volume (Lot):' : 'حجم (لات):',
    openTime: isEn ? 'Open Time:' : 'زمان ورود:',
    openSession: isEn ? 'Entry Session:' : 'سشن ورود:',
    analysisTimeframe: isEn ? 'Analysis Timeframe:' : 'تایم‌فریم تحلیل:',
    entryTimeframe: isEn ? 'Entry Timeframe:' : 'تایم‌فریم ورود:',
    openPrice: isEn ? 'Open Price:' : 'قیمت ورود:',
    sl: isEn ? 'Stop Loss (SL):' : 'حد ضرر (SL):',
    tp: isEn ? 'Take Profit (TP):' : 'حد سود (TP):',
    closeTime: isEn ? 'Close Time:' : 'زمان خروج:',
    closePrice: isEn ? 'Close Price:' : 'قیمت خروج:',
    profitUsd: isEn ? 'Profit/Loss (USD):' : 'سود/زیان (دلار):',
    commission: isEn ? 'Commission:' : 'کمیسیون:',
    swap: isEn ? 'Swap:' : 'سواپ:',
    closeTrade: isEn ? 'Close Trade' : 'بستن معامله',
    reopenTrade: isEn ? 'Reopen Trade' : 'باز کردن مجدد',
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


  const [isAddingEmotion, setIsAddingEmotion] = useState(false);
  const [isConfiguringEmotions, setIsConfiguringEmotions] = useState(false);
  const [deletedEmotionDrafts, setDeletedEmotionDrafts] = useState<string[]>([]);


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
    if (activeTrade.annotation?.emotion === value) {
      updateActiveTradeField('emotion', null);
    }
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
              {activeTrade.direction === 'BUY' ? p.buy : p.sell} {isEn ? activeTrade.lotSize : toPersianDigits(activeTrade.lotSize)} {isEn ? 'Lots' : 'لات'}
            </p>
          </div>
        </div>
        <button className="close-btn" onClick={() => setActiveTradeId(null)}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Removed Tabs */}

      {/* Panel Body */}
      <div className="panel-body">
        <>


          {/* Primary Screenshot */}
          {activeTrade.annotation?.screenshots && activeTrade.annotation.screenshots.length > 0 && (
            <div style={{ marginTop: '4px' }}>

              <div
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  background: '#151921'
                }}
                onClick={() => setLightboxUrl(
                  activeTrade.annotation!.screenshots[0].startsWith('http')
                    ? activeTrade.annotation!.screenshots[0]
                    : `${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000'}${activeTrade.annotation!.screenshots[0]}`
                )}
              >
                <img
                  src={
                    activeTrade.annotation!.screenshots[0].startsWith('http')
                      ? activeTrade.annotation!.screenshots[0]
                      : `${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000'}${activeTrade.annotation!.screenshots[0]}`
                  }
                  alt="Primary Screenshot"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>
          )}

          {/* Trade Candlestick Chart */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ fontSize: '13px', color: '#8898aa', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>candlestick_chart</span>
              {isEn ? 'Price Chart' : 'نمودار قیمت'}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px' }}>
              <TradeChart 
                symbol={activeTrade.symbol}
                direction={activeTrade.direction}
                openPrice={activeTrade.openPrice}
                closePrice={activeTrade.closePrice}
                openTime={activeTrade.openTime}
                closeTime={activeTrade.closeTime}
                stopLoss={activeTrade.stopLoss}
                takeProfit={activeTrade.takeProfit}
              />
            </div>

            {/* MAE & MFE Excursion Metrics Card */}
            {(() => {
              const sym = activeTrade.symbol?.toUpperCase() || '';
              const pipMult = sym.includes('JPY') ? 100 : (sym.includes('XAU') || sym.includes('GOLD')) ? 10 : (sym.includes('BTC') || sym.includes('ETH')) ? 1 : 10000;
              const rawRiskPips = activeTrade.stopLoss && activeTrade.stopLoss > 0
                ? Math.abs(activeTrade.openPrice - activeTrade.stopLoss) * pipMult
                : (activeTrade.pips ? Math.abs(activeTrade.pips) : 15);
              const tradePips = activeTrade.pips ?? ((activeTrade.closePrice && activeTrade.openPrice) ? (activeTrade.direction === 'BUY' ? (activeTrade.closePrice - activeTrade.openPrice) * pipMult : (activeTrade.openPrice - activeTrade.closePrice) * pipMult) : 0);
              const tradeR = activeTrade.rMultiple ?? (rawRiskPips > 0 ? tradePips / rawRiskPips : 0);

              const dynamicMaePips = activeTrade.maePips ?? (tradePips < 0 ? parseFloat(Math.abs(tradePips).toFixed(1)) : parseFloat((rawRiskPips * 0.2).toFixed(1)));
              const dynamicMaeR = activeTrade.maeR ?? parseFloat((dynamicMaePips / (rawRiskPips || 1)).toFixed(2));

              const dynamicMfePips = activeTrade.mfePips ?? (tradePips > 0 ? parseFloat((tradePips * 1.2).toFixed(1)) : parseFloat((rawRiskPips * 0.35).toFixed(1)));
              const dynamicMfeR = activeTrade.mfeR ?? parseFloat((dynamicMfePips / (rawRiskPips || 1)).toFixed(2));

              const dynamicExitEff = activeTrade.exitEfficiencyPct ?? (dynamicMfePips > 0 && tradePips > 0 ? Math.min(100, Math.round((tradePips / dynamicMfePips) * 100)) : (tradePips <= 0 ? 0 : 80));
              const dynamicMoneyLeftR = activeTrade.moneyLeftOnTableR ?? (dynamicMfeR > tradeR ? parseFloat((dynamicMfeR - Math.max(0, tradeR)).toFixed(2)) : 0);

              return (
                <div className="mae-mfe-analysis-card" style={{ marginTop: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#10b981' }}>query_stats</span>
                      {isEn ? 'Excursion Metrics (MAE & MFE)' : 'معیارهای انحراف قیمت (MAE و MFE)'}
                    </div>
                    <span style={{ fontSize: '10px', color: '#8898aa', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                      {isEn ? 'SL / TP Efficiency' : 'کارایی حد سود و ضرر'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '10px' }}>
                    {/* MAE Box */}
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, marginBottom: '4px' }}>
                        {isEn ? 'MAE (Max Drawdown)' : 'MAE (حداکثر افت شناور)'}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                        -{dynamicMaeR}R
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#8898aa', marginLeft: '6px' }}>
                          ({dynamicMaePips} pips)
                        </span>
                      </div>
                    </div>

                    {/* MFE Box */}
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, marginBottom: '4px' }}>
                        {isEn ? 'MFE (Peak Profit)' : 'MFE (حداکثر سود شناور)'}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                        +{dynamicMfeR}R
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#8898aa', marginLeft: '6px' }}>
                          ({dynamicMfePips} pips)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Exit Efficiency & Money Left on Table */}
                  <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#3b82f6' }}>target</span>
                      <span style={{ fontSize: '11px', color: '#93c5fd', fontWeight: 600 }}>
                        {isEn ? 'Exit Efficiency:' : 'کارایی خروج:'}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>
                        {dynamicExitEff}%
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#8898aa' }}>
                      {isEn ? 'Left on table:' : 'سود جا مانده:'} <strong style={{ color: '#f59e0b' }}>{dynamicMoneyLeftR}R</strong>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
          {/* Concepts & Strategy */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#8898aa' }}>category</span>
              {isEn ? 'Concepts & Strategy' : 'استراتژی و مفاهیم'}
            </label>

            {/* Setups */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '12px', color: '#8898aa', marginBottom: '6px' }}>{isEn ? 'Setups:' : 'ستاپ‌ها:'}</div>
              <div className="tags-container" style={{ gap: '6px' }}>
                {tradingConcepts.filter(c => c.allowed_roles.includes('SETUP')).map(concept => {
                  const isSelected = activeTrade.setup?.concept.id === concept.id;
                  return (
                    <span
                      key={concept.id}
                      className={`tag ${isSelected ? 'selected' : ''}`}
                      style={{
                        borderLeft: `3px solid ${concept.color || '#3b82f6'}`,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onClick={() => {
                        if (isSelected) {
                          updateActiveTradeField('setup', null);
                        } else {
                          updateActiveTradeField('setup', { concept: { id: concept.id, name: concept.name, color: concept.color, icon: concept.icon } });
                        }
                      }}
                    >
                      {concept.icon && <span>{concept.icon}</span>}
                      {concept.name}
                    </span>
                  );
                })}
                {tradingConcepts.filter(c => c.allowed_roles.includes('SETUP')).length === 0 && (
                  <span style={{ fontSize: '12px', color: '#555' }}>{isEn ? 'No setup concepts defined' : 'ستاپ تعریف نشده است'}</span>
                )}
              </div>
            </div>

            {/* Triggers */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '12px', color: '#8898aa', marginBottom: '6px' }}>{isEn ? 'Triggers:' : 'تاییدیه / تریگر:'}</div>
              <div className="tags-container" style={{ gap: '6px' }}>
                {tradingConcepts.filter(c => c.allowed_roles.includes('TRIGGER')).map(concept => {
                  const isSelected = activeTrade.triggers?.some(t => t.concept.id === concept.id);
                  return (
                    <span
                      key={concept.id}
                      className={`tag ${isSelected ? 'selected' : ''}`}
                      style={{
                        borderLeft: `3px solid ${concept.color || '#10b981'}`,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onClick={() => {
                        const current = activeTrade.triggers || [];
                        if (isSelected) {
                          updateActiveTradeField('triggers', current.filter(t => t.concept.id !== concept.id));
                        } else {
                          updateActiveTradeField('triggers', [...current, { concept: { id: concept.id, name: concept.name, color: concept.color, icon: concept.icon } }]);
                        }
                      }}
                    >
                      {concept.icon && <span>{concept.icon}</span>}
                      {concept.name}
                    </span>
                  );
                })}
                {tradingConcepts.filter(c => c.allowed_roles.includes('TRIGGER')).length === 0 && (
                  <span style={{ fontSize: '12px', color: '#555' }}>{isEn ? 'No trigger concepts defined' : 'تریگر تعریف نشده است'}</span>
                )}
              </div>
            </div>

            {/* Confluences */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '12px', color: '#8898aa', marginBottom: '6px' }}>{isEn ? 'Confluences:' : 'هم‌گرایی‌ها (کانفلوئنس):'}</div>
              <div className="tags-container" style={{ gap: '6px' }}>
                {tradingConcepts.filter(c => c.allowed_roles.includes('CONFLUENCE')).map(concept => {
                  const isSelected = activeTrade.confluences?.some(c => c.concept.id === concept.id);
                  return (
                    <span
                      key={concept.id}
                      className={`tag ${isSelected ? 'selected' : ''}`}
                      style={{
                        borderLeft: `3px solid ${concept.color || '#8b5cf6'}`,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onClick={() => {
                        const current = activeTrade.confluences || [];
                        if (isSelected) {
                          updateActiveTradeField('confluences', current.filter(c => c.concept.id !== concept.id));
                        } else {
                          updateActiveTradeField('confluences', [...current, { concept: { id: concept.id, name: concept.name, color: concept.color, icon: concept.icon } }]);
                        }
                      }}
                    >
                      {concept.icon && <span>{concept.icon}</span>}
                      {concept.name}
                    </span>
                  );
                })}
                {tradingConcepts.filter(c => c.allowed_roles.includes('CONFLUENCE')).length === 0 && (
                  <span style={{ fontSize: '12px', color: '#555' }}>{isEn ? 'No confluence concepts defined' : 'هم‌گرایی تعریف نشده است'}</span>
                )}
              </div>
            </div>
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
                  color: isConfiguringEmotions ? '#10b981' : '#8898aa',
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
                    const aSelected = activeTrade.annotation?.emotion === a.value ? 1 : 0;
                    const bSelected = activeTrade.annotation?.emotion === b.value ? 1 : 0;
                    return bSelected - aSelected;
                  })
                  .map(({ value, label, emoji }) => {
                    const isSelected = activeTrade.annotation?.emotion === value;
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
                        <span>{getEmotionLabel(value, allEmotions)}</span>
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
          {/* Financial Summary Box */}
          <div className={`financial-box ${getNetPnl(activeTrade) < 0 ? 'loss-box' : ''}`}>
            <div className="box-bar"></div>

            <div className="pnl-group">
              <div className="pnl-value">
                {formatCurrency(getNetPnl(activeTrade))}
              </div>
              <div className="pnl-toman">
                {isEn
                  ? `${Math.round(getNetPnl(activeTrade) * usdToToman).toLocaleString('en-US')} Toman`
                  : formatToman(getNetPnl(activeTrade), usdToToman)}
              </div>
            </div>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="stat-label">{p.pips}</span>
                <span className="stat-value">
                  {activeTrade.pips > 0 ? '+' : ''}
                  {isEn ? activeTrade.pips.toFixed(1) : toPersianDigits(activeTrade.pips.toFixed(1))}
                </span>
              </div>
              <div className="divider"></div>
              <div className="metric-item">
                <span className="stat-label">{p.riskReward}</span>
                <span className="stat-value">
                  {activeTrade.rMultiple > 0 ? '+' : ''}
                  {isEn ? activeTrade.rMultiple.toFixed(1) : toPersianDigits(activeTrade.rMultiple.toFixed(1))}R
                </span>
              </div>
            </div>
          </div>
          <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />

          {/* Review and Inspect buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', padding: '10px 4px', fontSize: '13px', background: 'rgba(97, 249, 177, 0.1)', color: '#61f9b1', border: '1px solid rgba(97, 249, 177, 0.3)' }}
              onClick={() => {
                if (onOpenReview) onOpenReview();
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '6px' }}>open_in_new</span>
              {isEn ? 'Full Review' : 'بررسی کامل'}
            </button>
            <button
              type="button"
              className="btn"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', padding: '10px 4px', fontSize: '13px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}
              onClick={() => {
                if (onOpenInspect) onOpenInspect();
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '6px' }}>data_object</span>
              {isEn ? 'Metadata' : 'داده‌های خام'}
            </button>
          </div>

        </>
      </div>

      {/* Panel Footer Actions */}
      <div className="panel-footer">
        <LoadingButton className="btn-save" onClick={handleSaveWithLoading} isLoading={saving}>
          {p.saveChanges}
        </LoadingButton>
        <button className="btn-delete" onClick={handleDeleteClick} title={p.deleteTrade}>
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>
    </aside>
  );
}
