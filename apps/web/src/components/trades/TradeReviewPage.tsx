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
  const [saving, setSaving] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const existing = trades.find(t => t.id === tradeId);
    if (existing) {
      setTrade(existing);
    } else {
      fetchTrades().then(() => {
        const found = useTradeStore.getState().trades.find(t => t.id === tradeId);
        if (found) setTrade(found);
      });
    }
  }, [tradeId, trades, fetchTrades]);

  if (!trade) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#8898aa' }}>
        {isEn ? 'Loading trade data...' : 'در حال دریافت اطلاعات معامله...'}
      </div>
    );
  }

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
    const ok = window.confirm(isEn ? 'Are you sure you want to delete this screenshot?' : 'آیا از حذف این تصویر اطمینان دارید؟');
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

  const calculateScore = () => {
    if (!trade.plan) return 0;
    let score = 0;
    if (trade.plan.planFollowed) score += 25;
    if (trade.plan.entryTimingCorrect) score += 25;
    if (trade.plan.emotionsAffected === false) score += 25;
    if (trade.plan.managedAccordingToRules) score += 25;
    return score;
  };

  const score = calculateScore();
  const isWin = trade.rMultiple > 0;

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
            <span className={`direction ${trade.direction.toLowerCase()}`}>{trade.direction}</span>
            {trade.symbol}
          </div>

          <div className="header-stats">
            <span className={`stat-badge ${isWin ? 'win' : 'loss'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {isWin ? 'trending_up' : 'trending_down'}
              </span>
              {trade.rMultiple > 0 ? '+' : ''}{trade.rMultiple.toFixed(1)}R
            </span>
            <span>•</span>
            <span>{isWin ? (isEn ? 'Winning Trade' : 'معامله سودده') : (isEn ? 'Losing Trade' : 'معامله زیان‌ده')}</span>
            {trade.setup?.concept && (
              <>
                <span>•</span>
                <span>{trade.setup.concept.name}</span>
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
          {trade.chartData && Array.isArray(trade.chartData) && trade.chartData.length > 0 && (
            <div className="review-section" style={{ padding: 0, overflow: 'hidden' }}>
              <TradeChart 
                candlesticks={trade.chartData}
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
          )}

          {/* Trade Thesis */}
          <div className="review-section">
            <h3 className="section-title">
              <span className="material-symbols-outlined">psychology</span>
              {isEn ? 'Why did I take this trade?' : 'چرا این معامله را باز کردم؟'}
            </h3>
            
            <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', fontSize: '14px' }}>
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
              {/* Event 1 */}
              <div className="timeline-event">
                <div className="event-dot"><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>search</span></div>
                <div className="event-content">
                  <span className="event-title">{isEn ? 'Analysis & Context' : 'تحلیل و زمینه'}</span>
                  <div className="event-box">
                    <textarea
                      placeholder={isEn ? 'What was the higher timeframe context?' : 'زمینه تایم‌فریم بالاتر چه بود؟'}
                      value={trade.annotation?.expectation || ''}
                      onChange={(e) => updateTradeField('annotation', 'expectation', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Event 2 */}
              <div className="timeline-event">
                <div className="event-dot active"><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>ads_click</span></div>
                <div className="event-content">
                  <span className="event-title">{isEn ? 'Entry Decision' : 'تصمیم برای ورود'}</span>
                  <div className="event-box">
                    <textarea
                      placeholder={isEn ? 'What triggered the entry?' : 'چه چیزی باعث ورود شد؟'}
                      value={trade.plan?.entryCondition || ''}
                      onChange={(e) => updateTradeField('plan', 'entryCondition', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Event 3 */}
              <div className="timeline-event">
                <div className="event-dot"><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>timeline</span></div>
                <div className="event-content">
                  <span className="event-title">{isEn ? 'Trade Management' : 'مدیریت معامله'}</span>
                  <div className="event-box">
                    <textarea
                      placeholder={isEn ? 'How did you manage the trade while it was open?' : 'هنگامی که معامله باز بود، چگونه آن را مدیریت کردید؟'}
                      value={trade.annotation?.notes || ''}
                      onChange={(e) => updateTradeField('annotation', 'notes', e.target.value)}
                    />
                  </div>
                </div>
              </div>
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
