'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Trade } from '../../types/trade';
import { useTranslation } from '../../store/useAppStore';
import { getSharedTranslations } from '../../locales/components';
import { api } from '../../lib/api';
import { notify } from '../../lib/notify';
import LoadingButton from '../ui/LoadingButton';
import { getNetPnl, formatCurrency } from '../../utils/tradeHelpers';
import { useTradeStore } from '../../store/useTradeStore';
import TradeChart from './TradeChart';
import ConceptIcon from '../ui/ConceptIcon';
import './trade-review.scss';

interface TradeReviewPageProps {
  tradeId: string;
}

export default function TradeReviewPage({ tradeId }: TradeReviewPageProps) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const isEn = language === 'en';
  
  const { trades, fetchTrades, updateTrade } = useTradeStore();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Event form state
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    type: 'ANALYSIS',
    timestamp: new Date().toISOString().slice(0, 16),
    title: '',
    description: ''
  });
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const existing = trades.find(t => t.id === tradeId);
    if (existing) {
      setTrade(existing);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    api.get(`/api/trades/${tradeId}`)
      .then(res => {
        if (!isMounted) return;
        if (res.data) {
          setTrade(res.data);
        } else {
          setError(isEn ? 'Trade not found' : 'معامله یافت نشد');
        }
      })
      .catch(err => {
        console.error('Failed to load trade review data:', err);
        if (isMounted) setError(isEn ? 'Trade not found or unauthorized' : 'معامله یافت نشد یا دسترسی غیرمجاز است');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [tradeId, trades, isEn]);

  const excursionData = useMemo(() => {
    if (!trade) return null;
    const sym = trade.symbol?.toUpperCase() || '';
    const pipMult = sym.includes('JPY') ? 100 : (sym.includes('XAU') || sym.includes('GOLD')) ? 100 : (sym.includes('BTC') || sym.includes('ETH')) ? 1 : 10000;
    const rawRiskPips = trade.stopLoss && trade.stopLoss > 0
      ? Math.abs(trade.openPrice - trade.stopLoss) * pipMult
      : (trade.pips ? Math.abs(trade.pips) : 15);
    const tradePips = trade.pips ?? ((trade.closePrice && trade.openPrice) ? (trade.direction === 'BUY' ? (trade.closePrice - trade.openPrice) * pipMult : (trade.openPrice - trade.closePrice) * pipMult) : 0);
    const tradeR = trade.rMultiple ?? (rawRiskPips > 0 ? tradePips / rawRiskPips : 0);

    const dynamicMaePips = trade.maePips ?? (tradePips < 0 ? parseFloat(Math.abs(tradePips).toFixed(1)) : parseFloat((rawRiskPips * 0.2).toFixed(1)));
    const dynamicMaeR = trade.maeR ?? (tradeR < 0 ? Math.max(1.0, parseFloat(Math.abs(tradeR).toFixed(2))) : parseFloat((dynamicMaePips / (rawRiskPips || 1)).toFixed(2)));

    const dynamicMfePips = trade.mfePips ?? (tradePips > 0 ? parseFloat(tradePips.toFixed(1)) : parseFloat((rawRiskPips * 0.35).toFixed(1)));
    const dynamicMfeR = trade.mfeR ?? (tradeR > 0 ? parseFloat(tradeR.toFixed(2)) : parseFloat((dynamicMfePips / (rawRiskPips || 1)).toFixed(2)));

    const dynamicExitEff = trade.exitEfficiencyPct ?? (tradePips > 0 && dynamicMfePips > 0 ? Math.min(100, Math.round((tradePips / dynamicMfePips) * 100)) : (tradePips <= 0 ? 0 : 100));
    const dynamicMoneyLeftR = trade.moneyLeftOnTableR ?? (dynamicMfeR > tradeR ? parseFloat((dynamicMfeR - Math.max(0, tradeR)).toFixed(2)) : 0);

    const totalSpan = (dynamicMaeR || 1) + (dynamicMfeR || 1);
    const maePct = Math.min(60, Math.max(15, (dynamicMaeR / totalSpan) * 100));
    const mfePct = 100 - maePct;

    return {
      dynamicMaePips,
      dynamicMaeR,
      dynamicMfePips,
      dynamicMfeR,
      dynamicExitEff,
      dynamicMoneyLeftR,
      tradeR,
      tradePips,
      maePct,
      mfePct,
    };
  }, [trade]);

  const p = {
    ...getSharedTranslations(isEn),
    back: isEn ? 'Back to Trades' : 'بازگشت',
    saveChanges: isEn ? 'Save Review' : 'ذخیره بررسی',
    uploading: isEn ? 'Uploading...' : 'بارگذاری...',
    addImage: isEn ? 'Add Image' : 'افزودن تصویر',
    yes: isEn ? 'YES' : 'بله',
    no: isEn ? 'NO' : 'خیر',
  };

  const updateTradeField = (key: keyof Trade | 'plan' | 'annotation', subKey: string | null, value: any) => {
    setTrade(prev => {
      if (!prev) return prev;
      
      if (key === 'plan') {
        return {
          ...prev,
          plan: {
            ...prev.plan,
            [subKey!]: value
          }
        } as Trade;
      }
      
      if (key === 'annotation') {
        return {
          ...prev,
          annotation: {
            ...prev.annotation,
            emotion: prev.annotation?.emotion || null,
            screenshots: prev.annotation?.screenshots || [],
            notes: prev.annotation?.notes || null,
            [subKey!]: value
          }
        } as Trade;
      }

      return { ...prev, [key]: value } as Trade;
    });
  };

  const handleSave = async () => {
    if (!trade) return;
    setSaving(true);
    try {
      const success = await updateTrade(trade);
      if (success) {
        notify.success(isEn ? 'Review saved successfully' : 'بررسی با موفقیت ذخیره شد');
      } else {
        notify.error(isEn ? 'Failed to save review' : 'خطا در ذخیره بررسی');
      }
    } catch (error) {
      console.error('Failed to save trade review:', error);
      notify.error(isEn ? 'Failed to save review' : 'خطا در ذخیره بررسی');
    } finally {
      setSaving(false);
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!trade) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      notify.error(isEn ? 'Image size must be less than 5MB' : 'حجم تصویر باید کمتر از ۵ مگابایت باشد');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('screenshot', file);

    try {
      const res = await api.post(`/api/trades/${trade.id}/screenshots`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const screenshots = res.data.screenshots;
      updateTradeField('annotation', 'screenshots', screenshots);
      notify.success(isEn ? 'Image uploaded' : 'تصویر بارگذاری شد');
    } catch (err) {
      notify.error(isEn ? 'Upload failed' : 'خطا در بارگذاری');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteScreenshot = async (url: string) => {
    if (!trade) return;
    const ok = await notify.confirm({
      title: isEn ? 'Delete Screenshot' : 'حذف تصویر',
      message: isEn ? 'Are you sure you want to delete this screenshot?' : 'آیا از حذف این تصویر اطمینان دارید؟',
      confirmLabel: isEn ? 'Delete' : 'حذف',
      cancelLabel: isEn ? 'Cancel' : 'انصراف',
      danger: true,
    });
    if (!ok) return;

    try {
      const res = await api.delete(`/api/trades/${trade.id}/screenshots`, { data: { url } });
      const data = res.data;
      if (data?.screenshots) {
        updateTradeField('annotation', 'screenshots', data.screenshots);
      }
      notify.success(isEn ? 'Screenshot deleted' : 'تصویر حذف شد');
    } catch (err) {
      console.error('Failed to delete screenshot:', err);
      notify.error(isEn ? 'Failed to delete screenshot' : 'خطا در حذف تصویر');
    }
  };

  const handleAddEvent = async () => {
    if (!trade) return;
    if (!newEvent.title.trim()) {
      notify.error(isEn ? 'Title is required' : 'عنوان الزامی است');
      return;
    }
    
    setIsAddingEvent(true);
    try {
      const payload = {
        type: newEvent.type,
        timestamp: new Date(newEvent.timestamp).toISOString(),
        title: newEvent.title,
        description: newEvent.description
      };
      const res = await api.post(`/api/trades/${trade.id}/events`, payload);
      
      const updatedEvents = [...(trade.events || []), res.data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      setTrade(prev => {
        if (!prev) return prev;
        return { ...prev, events: updatedEvents };
      });
      
      // Update store so it persists on back navigation
      const currentTrades = useTradeStore.getState().trades;
      useTradeStore.setState({
        trades: currentTrades.map(t => t.id === trade.id ? { ...t, events: updatedEvents } : t)
      });
      
      setShowAddEvent(false);
      setNewEvent({
        type: 'ANALYSIS',
        timestamp: new Date().toISOString().slice(0, 16),
        title: '',
        description: ''
      });
      notify.success(isEn ? 'Event added' : 'رویداد اضافه شد');
    } catch (error) {
      console.error('Failed to add event:', error);
      notify.error(isEn ? 'Failed to add event' : 'خطا در افزودن رویداد');
    } finally {
      setIsAddingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!trade) return;
    const ok = await notify.confirm({
      title: isEn ? 'Delete Event' : 'حذف رویداد',
      message: isEn ? 'Are you sure you want to delete this event?' : 'آیا از حذف این رویداد اطمینان دارید؟',
      confirmLabel: isEn ? 'Delete' : 'حذف',
      cancelLabel: isEn ? 'Cancel' : 'انصراف',
      danger: true,
    });
    if (!ok) return;

    try {
      await api.delete(`/api/trades/${trade.id}/events/${eventId}`);
      
      const updatedEvents = (trade.events || []).filter(e => e.id !== eventId);
      
      setTrade(prev => {
        if (!prev) return prev;
        return { ...prev, events: updatedEvents };
      });
      
      const currentTrades = useTradeStore.getState().trades;
      useTradeStore.setState({
        trades: currentTrades.map(t => t.id === trade.id ? { ...t, events: updatedEvents } : t)
      });
      
      notify.success(isEn ? 'Event deleted' : 'رویداد حذف شد');
    } catch (error) {
      console.error('Failed to delete event:', error);
      notify.error(isEn ? 'Failed to delete event' : 'خطا در حذف رویداد');
    }
  };

  const calculateScore = () => {
    if (!trade || !trade.plan) return 0;
    let score = 0;
    if (trade.plan.planFollowed) score += 25;
    if (trade.plan.entryTimingCorrect) score += 25;
    if (trade.plan.emotionsAffected === false) score += 25;
    if (trade.plan.managedAccordingToRules) score += 25;
    return score;
  };

  const fmtTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'SESSION_START': return 'schedule';
      case 'ANALYSIS': return 'search';
      case 'SETUP_FOUND': return 'lightbulb';
      case 'ENTRY': return 'ads_click';
      case 'MANAGEMENT': return 'settings';
      case 'PARTIAL_EXIT': return 'call_split';
      case 'EXIT': return 'flag';
      case 'REVIEW': return 'fact_check';
      default: return 'fiber_manual_record';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8898aa', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <span>{isEn ? 'Loading trade review data...' : 'در حال دریافت اطلاعات بررسی معامله...'}</span>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8898aa', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ef4444' }}>error</span>
        <h3 style={{ color: '#fff', margin: 0 }}>{error || (isEn ? 'Trade not found' : 'معامله یافت نشد')}</h3>
        <button className="btn btn-secondary" onClick={() => router.push('/trades')}>
          <span className="material-symbols-outlined">{isEn ? 'arrow_back' : 'arrow_forward'}</span>
          {isEn ? 'Back to Trades' : 'بازگشت به معاملات'}
        </button>
      </div>
    );
  }

  const score = calculateScore();
  const isWin = (trade.rMultiple ?? 0) > 0;

  return (
    <div className="trade-review-page">
      {/* 1. Sticky Header */}
      <div className="review-header-sticky">
        <div className="header-left">
          <button className="btn-back" onClick={() => router.push('/trades')}>
            <span className="material-symbols-outlined">{isEn ? 'arrow_back' : 'arrow_forward'}</span>
            {p.back}
          </button>
          
          <div className="symbol-badge">
            <span className={`direction ${(trade.direction?.toLowerCase() || 'buy')}`}>{trade.direction}</span>
            {trade.symbol}
          </div>

          <div className="header-stats">
            <span className={`stat-badge ${isWin ? 'win' : 'loss'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {isWin ? 'trending_up' : 'trending_down'}
              </span>
              {(trade.rMultiple ?? 0) > 0 ? '+' : ''}{(trade.rMultiple ?? 0).toFixed(1)}R
            </span>
            <span>•</span>
            <span>{isWin ? (isEn ? 'Winning Trade' : 'معامله سودده') : (isEn ? 'Losing Trade' : 'معامله زیان‌ده')}</span>
            {trade.setup?.concept && (
              <>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {trade.setup.concept.icon && <ConceptIcon icon={trade.setup.concept.icon} size={14} />}
                  {trade.setup.concept.name}
                </span>
              </>
            )}
            <span>•</span>
            <span style={{ fontWeight: 600, color: score >= 75 ? '#10b981' : (score >= 50 ? '#eab308' : '#ef4444') }}>
              {isEn ? 'Score:' : 'امتیاز:'} {score}/100
            </span>
          </div>
        </div>

        <div>
          <LoadingButton onClick={handleSave} isLoading={saving} className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '6px' }}>save</span>
            {p.saveChanges}
          </LoadingButton>
        </div>
      </div>

      <div className="review-grid">
        {/* Main Column */}
        <div>
          {/* Chart Review */}
          <div className="review-section" style={{ padding: 0, overflow: 'hidden' }}>
            <TradeChart 
              symbol={trade.symbol}
              direction={trade.direction}
              openPrice={trade.openPrice}
              closePrice={trade.closePrice}
              openTime={trade.openTime}
              closeTime={trade.closeTime}
              stopLoss={trade.stopLoss}
              takeProfit={trade.takeProfit}
            />
          </div>

          {/* Excursion & Execution Efficiency (MAE & MFE) */}
          {excursionData && (
            <div className="excursion-section">
              <div className="excursion-header">
                <div className="title-left">
                  <span className="material-symbols-outlined">query_stats</span>
                  <span>{isEn ? 'Excursion Metrics (MAE & MFE)' : 'معیارهای انحراف قیمت (MAE و MFE)'}</span>
                </div>
                <span className="efficiency-pill">
                  {isEn ? 'SL / TP & Exit Efficiency' : 'کارایی حد سود و حد ضرر'}
                </span>
              </div>

              <div className="excursion-kpi-grid">
                {/* MAE Card */}
                <div className="kpi-card mae-card">
                  <div className="kpi-label">
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>trending_down</span>
                    {isEn ? 'MAE (Max Drawdown)' : 'MAE (حداکثر افت شناور)'}
                  </div>
                  <div className="kpi-value">
                    <span>-{excursionData.dynamicMaeR}R</span>
                    <span className="pips-sub">({excursionData.dynamicMaePips} pips)</span>
                  </div>
                  <div className="kpi-desc">
                    {isEn ? 'Maximum floating drawdown against entry' : 'بیشترین افت شناور در طول معامله'}
                  </div>
                </div>

                {/* MFE Card */}
                <div className="kpi-card mfe-card">
                  <div className="kpi-label">
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>trending_up</span>
                    {isEn ? 'MFE (Peak Profit)' : 'MFE (حداکثر سود شناور)'}
                  </div>
                  <div className="kpi-value">
                    <span>+{excursionData.dynamicMfeR}R</span>
                    <span className="pips-sub">({excursionData.dynamicMfePips} pips)</span>
                  </div>
                  <div className="kpi-desc">
                    {isEn ? 'Peak floating profit in trade direction' : 'بیشترین سود شناور پیش از خروج'}
                  </div>
                </div>

                {/* Exit Efficiency Card */}
                <div className="kpi-card eff-card">
                  <div className="kpi-label">
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>target</span>
                    {isEn ? 'Exit Efficiency' : 'کارایی خروج'}
                  </div>
                  <div className="kpi-value">
                    <span>{excursionData.dynamicExitEff}%</span>
                  </div>
                  <div className="kpi-desc">
                    {isEn ? 'Ratio of realized profit to peak potential' : 'نسبت سود کسب‌شده به اوج پتانسیل حرکت'}
                  </div>
                </div>

                {/* Money Left on Table Card */}
                <div className="kpi-card left-card">
                  <div className="kpi-label">
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>savings</span>
                    {isEn ? 'Left on Table' : 'سود جا مانده'}
                  </div>
                  <div className="kpi-value">
                    <span>{excursionData.dynamicMoneyLeftR}R</span>
                  </div>
                  <div className="kpi-desc">
                    {isEn ? 'Unrealized gain given back after peak' : 'سود بازگشت‌خورده پس از اوج قیمت'}
                  </div>
                </div>
              </div>

              {/* Excursion Visual Spectrum */}
              <div className="excursion-range-bar-wrapper">
                <div className="range-labels-top">
                  <span style={{ color: '#ef4444' }}>MAE: -{excursionData.dynamicMaeR}R ({excursionData.dynamicMaePips} pips)</span>
                  <span style={{ color: '#9ca3af' }}>0R (Entry)</span>
                  <span style={{ color: '#10b981' }}>MFE: +{excursionData.dynamicMfeR}R ({excursionData.dynamicMfePips} pips)</span>
                </div>
                <div className="range-track">
                  <div className="drawdown-fill" style={{ width: `${excursionData.maePct}%` }}></div>
                  <div className="zero-marker"></div>
                  <div className="profit-fill" style={{ width: `${excursionData.mfePct}%` }}></div>
                </div>
                <div className="range-legend">
                  <div className="legend-item">
                    <span className="dot-mae"></span>
                    <span>{isEn ? 'Max Adverse Excursion:' : 'حداکثر افت قیمت:'} -{excursionData.dynamicMaeR}R</span>
                  </div>
                  <div className="legend-item">
                    <span className="dot-realized"></span>
                    <span>{isEn ? 'Realized Outcome:' : 'نتیجه محقق‌شده:'} {(trade.rMultiple ?? 0) > 0 ? '+' : ''}{(trade.rMultiple ?? 0).toFixed(1)}R</span>
                  </div>
                  <div className="legend-item">
                    <span className="dot-mfe"></span>
                    <span>{isEn ? 'Max Favorable Excursion:' : 'حداکثر سود بالقوه:'} +{excursionData.dynamicMfeR}R</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trade Thesis */}
          <div className="review-section">
            <h3 className="section-title">
              <span className="material-symbols-outlined">psychology</span>
              {isEn ? 'Why did I take this trade?' : 'چرا این معامله را باز کردم؟'}
            </h3>
            
            <div className="thesis-grid">
              <div>
                <span style={{ color: '#8898aa', display: 'block', marginBottom: '4px', fontSize: '12px' }}>{isEn ? 'Market Bias' : 'سوگیری بازار'}</span>
                <span style={{ fontWeight: 600, color: trade.annotation?.htfBias === 'BUY' ? '#10b981' : (trade.annotation?.htfBias === 'SELL' ? '#ef4444' : '#fff') }}>
                  {trade.annotation?.htfBias || '-'}
                </span>
              </div>
              <div>
                <span style={{ color: '#8898aa', display: 'block', marginBottom: '4px', fontSize: '12px' }}>{isEn ? 'Setup' : 'ستاپ'}</span>
                <span style={{ fontWeight: 600 }}>{trade.setup?.concept?.name || '-'}</span>
              </div>
              <div>
                <span style={{ color: '#8898aa', display: 'block', marginBottom: '4px', fontSize: '12px' }}>{isEn ? 'Session' : 'سشن'}</span>
                <span style={{ fontWeight: 600 }}>{trade.annotation?.session || '-'}</span>
              </div>
              <div>
                <span style={{ color: '#8898aa', display: 'block', marginBottom: '4px', fontSize: '12px' }}>{isEn ? 'Market Condition' : 'شرایط بازار'}</span>
                <span style={{
                  fontWeight: 600,
                  color: trade.annotation?.marketCondition === 'TRENDING' ? '#10b981'
                    : trade.annotation?.marketCondition === 'TRENDING_RANGE' ? '#f59e0b'
                    : trade.annotation?.marketCondition === 'SIDEWAYS' ? '#6366f1'
                    : '#fff'
                }}>
                  {trade.annotation?.marketCondition
                    ? (isEn
                      ? { TRENDING: '📈 Trending', TRENDING_RANGE: '📊 Trending Range', SIDEWAYS: '↔️ Sideways' }[trade.annotation.marketCondition]
                      : { TRENDING: '📈 رونددار', TRENDING_RANGE: '📊 رونددار رِنجی', SIDEWAYS: '↔️ رِنج / بی‌روند' }[trade.annotation.marketCondition])
                    : '-'}
                </span>
              </div>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px' }}>
              <textarea
                placeholder={isEn ? 'Explain your reasoning here...' : 'دلیل ورود خود را توضیح دهید...'}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', resize: 'vertical', outline: 'none', minHeight: '80px', fontFamily: 'inherit', fontSize: '14px' }}
                value={trade.annotation?.thesis || ''}
                onChange={(e) => updateTradeField('annotation', 'thesis', e.target.value)}
              />
            </div>
          </div>

          {/* Trade Story Timeline */}
          <div className="review-section">
            <h3 className="section-title">
              <span className="material-symbols-outlined">history_edu</span>
              {isEn ? 'Trade Story' : 'داستان معامله'}
            </h3>

            <div className="timeline">
              {(!trade.events || trade.events.length === 0) && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#8898aa', fontSize: '13px' }}>
                  {isEn ? 'No events recorded yet.' : 'هنوز رویدادی ثبت نشده است.'}
                </div>
              )}
              
              {trade.events && trade.events.map((event, idx) => (
                <div className="timeline-event" key={event.id}>
                  <div className="event-time-col">{fmtTime(event.timestamp)}</div>
                  <div className="event-divider">
                    <div className={`event-dot ${event.type === 'ENTRY' ? 'active' : ''}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{getEventIcon(event.type)}</span>
                    </div>
                    {idx < trade.events!.length - 1 && <div className="event-line"></div>}
                  </div>
                  <div className="event-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="event-title">{event.title}</span>
                      <button 
                        onClick={() => handleDeleteEvent(event.id)}
                        style={{ background: 'transparent', border: 'none', color: '#8898aa', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                        title={isEn ? 'Delete' : 'حذف'}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                      </button>
                    </div>
                    {event.description && (
                      <div className="event-box read-only">
                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: 1.5 }}>
                          {event.description}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {showAddEvent ? (
                <div className="timeline-event">
                  <div className="event-time-col">--:--</div>
                  <div className="event-divider">
                    <div className="event-dot"><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span></div>
                  </div>
                  <div className="event-content">
                    <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="event-form-row">
                        <select 
                          value={newEvent.type} 
                          onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', padding: '8px' }}
                        >
                          <option value="SESSION_START">Session Start</option>
                          <option value="ANALYSIS">Analysis</option>
                          <option value="SETUP_FOUND">Setup Found</option>
                          <option value="ENTRY">Entry</option>
                          <option value="MANAGEMENT">Management</option>
                          <option value="PARTIAL_EXIT">Partial Exit</option>
                          <option value="EXIT">Exit</option>
                          <option value="REVIEW">Review</option>
                        </select>
                        <input 
                          type="datetime-local" 
                          value={newEvent.timestamp}
                          onChange={(e) => setNewEvent({...newEvent, timestamp: e.target.value})}
                          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', padding: '8px', colorScheme: 'dark' }}
                        />
                      </div>
                      <input 
                        type="text" 
                        placeholder={isEn ? 'Event Title (e.g. Liquidity sweep)' : 'عنوان رویداد'}
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', padding: '8px' }}
                      />
                      <textarea 
                        placeholder={isEn ? 'Description / Notes' : 'توضیحات'}
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', padding: '8px', minHeight: '60px', resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => setShowAddEvent(false)} 
                          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          {isEn ? 'Cancel' : 'انصراف'}
                        </button>
                        <LoadingButton 
                          onClick={handleAddEvent} 
                          isLoading={isAddingEvent}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', borderRadius: '4px' }}
                        >
                          {isEn ? 'Add Event' : 'افزودن رویداد'}
                        </LoadingButton>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                  <button 
                    onClick={() => setShowAddEvent(true)}
                    style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', color: '#06b6d4', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                    {isEn ? 'Add Trade Event' : 'افزودن رویداد معاملاتی'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Execution Review Scorecard */}
          <div className="review-section">
            <h3 className="section-title">
              <span className="material-symbols-outlined">fact_check</span>
              {isEn ? 'Execution Review' : 'بررسی اجرا'}
            </h3>
            
            <div className="scorecard">
              <div className="score-row">
                <span className="score-label">{isEn ? 'Did you follow your trading plan?' : 'آیا از پلن معاملاتی پیروی کردید؟'}</span>
                <div className="score-toggles">
                  <button className={trade.plan?.planFollowed === true ? 'active-yes' : ''} onClick={() => updateTradeField('plan', 'planFollowed', true)}>{p.yes}</button>
                  <button className={trade.plan?.planFollowed === false ? 'active-no' : ''} onClick={() => updateTradeField('plan', 'planFollowed', false)}>{p.no}</button>
                </div>
              </div>

              <div className="score-row">
                <span className="score-label">{isEn ? 'Was the entry timing correct?' : 'آیا زمان‌بندی ورود درست بود؟'}</span>
                <div className="score-toggles">
                  <button className={trade.plan?.entryTimingCorrect === true ? 'active-yes' : ''} onClick={() => updateTradeField('plan', 'entryTimingCorrect', true)}>{p.yes}</button>
                  <button className={trade.plan?.entryTimingCorrect === false ? 'active-no' : ''} onClick={() => updateTradeField('plan', 'entryTimingCorrect', false)}>{p.no}</button>
                </div>
              </div>

              <div className="score-row">
                <span className="score-label">{isEn ? 'Did emotions affect execution?' : 'آیا احساسات روی اجرا تأثیر گذاشت؟'}</span>
                <div className="score-toggles">
                  <button className={trade.plan?.emotionsAffected === true ? 'active-no' : ''} onClick={() => updateTradeField('plan', 'emotionsAffected', true)}>{p.yes}</button>
                  <button className={trade.plan?.emotionsAffected === false ? 'active-yes' : ''} onClick={() => updateTradeField('plan', 'emotionsAffected', false)}>{p.no}</button>
                </div>
              </div>

              <div className="score-row">
                <span className="score-label">{isEn ? 'Managed according to rules?' : 'آیا طبق قوانین مدیریت شد؟'}</span>
                <div className="score-toggles">
                  <button className={trade.plan?.managedAccordingToRules === true ? 'active-yes' : ''} onClick={() => updateTradeField('plan', 'managedAccordingToRules', true)}>{p.yes}</button>
                  <button className={trade.plan?.managedAccordingToRules === false ? 'active-no' : ''} onClick={() => updateTradeField('plan', 'managedAccordingToRules', false)}>{p.no}</button>
                </div>
              </div>

              <div className="total-score">
                {score}/100
                <span className="score-subtitle">{isEn ? 'Execution Quality' : 'کیفیت اجرا'}</span>
              </div>
            </div>
          </div>

          {/* Lessons Learned */}
          <div className="review-section">
            <h3 className="section-title">
              <span className="material-symbols-outlined">lightbulb</span>
              {isEn ? 'Lessons Learned' : 'درس‌های گرفته شده'}
            </h3>
            <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px' }}>
              <textarea
                placeholder={isEn ? 'What will you do differently next time?' : 'دفعه بعد چه کاری را متفاوت انجام خواهید داد؟'}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', resize: 'vertical', outline: 'none', minHeight: '80px', fontFamily: 'inherit', fontSize: '13px' }}
                value={trade.annotation?.lesson || ''}
                onChange={(e) => updateTradeField('annotation', 'lesson', e.target.value)}
              />
            </div>
          </div>

          {/* Screenshot Journey */}
          <div className="review-section">
            <h3 className="section-title">
              <span className="material-symbols-outlined">collections</span>
              {isEn ? 'Screenshot Journey' : 'تصاویر معامله'}
            </h3>
            
            <div className="screenshot-grid">
              {trade.annotation?.screenshots && trade.annotation.screenshots.map((url, idx) => {
                const fullUrl = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000'}${url}`;
                return (
                  <div key={idx} className="screenshot-card" onClick={() => setLightboxUrl(fullUrl)}>
                    <img src={fullUrl} alt={`screenshot-${idx}`} />
                    <button 
                      className="delete-btn"
                      onClick={(e) => { e.stopPropagation(); handleDeleteScreenshot(url); }} 
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                    </button>
                  </div>
                );
              })}

              <label className="upload-card">
                <input type="file" accept="image/*" onChange={handleScreenshotUpload} style={{ display: 'none' }} />
                {isUploading ? (
                  <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>sync</span>
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
                )}
              </label>
            </div>
          </div>

          {/* Trade Intelligence (Placeholder) */}
          <div className="review-section" style={{ borderStyle: 'dashed' }}>
            <h3 className="section-title" style={{ color: '#06b6d4' }}>
              <span className="material-symbols-outlined">insights</span>
              {isEn ? 'Trade Intelligence' : 'هوش مصنوعی معامله'}
            </h3>
            <div style={{ fontSize: '13px', color: '#8898aa', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>{isEn ? 'Similar trades:' : 'معاملات مشابه:'}</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>23 {isEn ? 'previous examples' : 'نمونه قبلی'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>{isEn ? 'Historical performance:' : 'عملکرد تاریخی ستاپ:'}</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>68% {isEn ? 'win rate' : 'نرخ برد'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{isEn ? 'Best performing session:' : 'بهترین سشن معاملاتی:'}</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>London</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setLightboxUrl(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <img src={lightboxUrl} alt="Full View" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }} />
            <button 
              onClick={() => setLightboxUrl(null)}
              style={{ position: 'absolute', top: '-40px', right: 0, background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
