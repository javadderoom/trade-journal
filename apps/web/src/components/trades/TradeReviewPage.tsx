'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trade } from '../../types/trade';
import { useTranslation } from '../../store/useAppStore';
import { getSharedTranslations } from '../../locales/components';
import { api } from '../../lib/api';
import { notify } from '../../lib/notify';
import LoadingButton from '../ui/LoadingButton';
import { getNetPnl, formatCurrency, formatDate } from '../../utils/tradeHelpers';
import { toPersianDigits, formatToman } from '../../utils/farsi';
import { useTradeStore } from '../../store/useTradeStore';
import TradeChart from './TradeChart';

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
      // If direct navigation, might need to fetch trades if empty
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
    back: isEn ? 'Back to Trades' : 'بازگشت به معاملات',
    deepReview: isEn ? 'Deep Review' : 'بررسی عمیق',
    tradePlan: isEn ? 'Trade Plan' : 'پلن معاملاتی',
    expectation: isEn ? 'Expectation' : 'انتظار از معامله',
    notes: isEn ? 'Journal Notes' : 'یادداشت‌های ژورنال',
    screenshots: isEn ? 'Trade Screenshots' : 'تصاویر معامله',
    planFollowed: isEn ? 'Did you follow your plan?' : 'آیا به پلن خود پایبند بودید؟',
    lessonLearned: isEn ? 'Lesson Learned' : 'درس گرفته شده',
    saveChanges: isEn ? 'Save Review' : 'ذخیره بررسی',
    yes: isEn ? 'Yes' : 'بله',
    no: isEn ? 'No' : 'خیر',
    maxRisk: isEn ? 'Max Risk (%)' : 'حداکثر ریسک (%)',
    expectedRr: isEn ? 'Expected R:R' : 'نسبت R:R مورد انتظار',
    entryCondition: isEn ? 'Entry Condition' : 'شرط ورود',
    invalidation: isEn ? 'Invalidation Level' : 'سطح بی‌اعتباری',
    targetZone: isEn ? 'Target Zone' : 'محدوده هدف',
    expectedHoldTime: isEn ? 'Expected Hold Time' : 'زمان نگهداری پیش‌بینی شده',
    uploading: isEn ? 'Uploading...' : 'بارگذاری...',
    addImage: isEn ? 'Add Image' : 'افزودن تصویر',
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

      return {
        ...prev,
        [key]: value
      } as Trade;
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
    formData.append('image', file);

    try {
      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.url;
      
      const currentScreenshots = trade.annotation?.screenshots || [];
      updateTradeField('annotation', 'screenshots', [...currentScreenshots, url]);
      notify.success(isEn ? 'Image uploaded' : 'تصویر بارگذاری شد');
    } catch (err) {
      notify.error(isEn ? 'Upload failed' : 'خطا در بارگذاری');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteScreenshot = (url: string) => {
    const currentScreenshots = trade.annotation?.screenshots || [];
    updateTradeField('annotation', 'screenshots', currentScreenshots.filter(u => u !== url));
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    borderRadius: '4px',
    padding: '8px 12px',
    width: '100%',
    fontFamily: language === 'fa' ? 'Vazirmatn' : 'inherit',
    fontSize: '13px',
    outline: 'none',
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => router.push('/trades')}
            style={{ 
              background: 'transparent', border: 'none', color: '#8898aa', cursor: 'pointer', 
              display: 'flex', alignItems: 'center', gap: '4px' 
            }}
          >
            <span className="material-symbols-outlined">{isEn ? 'arrow_back' : 'arrow_forward'}</span>
            {p.back}
          </button>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className={`icon-wrapper ${trade.direction === 'SELL' ? 'sell-icon-wrapper' : ''}`} style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: trade.direction === 'BUY' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
              <span className="material-symbols-outlined" style={{ color: trade.direction === 'BUY' ? '#10b981' : '#ef4444' }}>
                {trade.direction === 'BUY' ? 'trending_up' : 'trending_down'}
              </span>
            </span>
            {trade.symbol} <span style={{ color: '#8898aa', fontWeight: 400 }}>| {p.deepReview}</span>
          </h1>
        </div>
        <div>
          <LoadingButton onClick={handleSave} isLoading={saving} className="btn btn-primary" style={{ padding: '10px 24px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '6px' }}>save</span>
            {p.saveChanges}
          </LoadingButton>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Trade Plan Section */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: '#61f9b1' }}>
              <span className="material-symbols-outlined">assignment</span>
              {p.tradePlan}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#8898aa' }}>{p.maxRisk}</label>
                <input 
                  type="number" 
                  step="any"
                  style={inputStyle} 
                  value={trade.plan?.maxRisk ?? ''} 
                  onChange={(e) => updateTradeField('plan', 'maxRisk', e.target.value ? parseFloat(e.target.value) : null)} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#8898aa' }}>{p.expectedRr}</label>
                <input 
                  type="number" 
                  step="any"
                  style={inputStyle} 
                  value={trade.plan?.expectedRr ?? ''} 
                  onChange={(e) => updateTradeField('plan', 'expectedRr', e.target.value ? parseFloat(e.target.value) : null)} 
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#8898aa' }}>{p.entryCondition}</label>
                <input 
                  type="text" 
                  style={inputStyle} 
                  value={trade.plan?.entryCondition || ''} 
                  onChange={(e) => updateTradeField('plan', 'entryCondition', e.target.value)} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#8898aa' }}>{p.invalidation}</label>
                <input 
                  type="text" 
                  style={inputStyle} 
                  value={trade.plan?.invalidation || ''} 
                  onChange={(e) => updateTradeField('plan', 'invalidation', e.target.value)} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#8898aa' }}>{p.targetZone}</label>
                <input 
                  type="text" 
                  style={inputStyle} 
                  value={trade.plan?.targetZone || ''} 
                  onChange={(e) => updateTradeField('plan', 'targetZone', e.target.value)} 
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#8898aa' }}>{p.expectedHoldTime}</label>
                <input 
                  type="text" 
                  style={inputStyle} 
                  value={trade.plan?.expectedHoldTime || ''} 
                  onChange={(e) => updateTradeField('plan', 'expectedHoldTime', e.target.value)} 
                />
              </div>
            </div>
          </section>

          {/* Expectation */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: '#3b82f6' }}>
              <span className="material-symbols-outlined">psychology</span>
              {p.expectation}
            </h3>
            <textarea
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              value={trade.annotation?.expectation || ''}
              onChange={(e) => updateTradeField('annotation', 'expectation', e.target.value)}
            />
          </section>

          {/* Notes */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: '#a855f7' }}>
              <span className="material-symbols-outlined">edit_note</span>
              {p.notes}
            </h3>
            <textarea
              style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
              value={trade.annotation?.notes || ''}
              onChange={(e) => updateTradeField('annotation', 'notes', e.target.value)}
            />
          </section>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Plan Followed & Lessons */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: '#eab308' }}>
              <span className="material-symbols-outlined">fact_check</span>
              Review & Lessons
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500 }}>{p.planFollowed}</label>
              <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
                <button
                  type="button"
                  onClick={() => updateTradeField('plan', 'planFollowed', true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: trade.plan?.planFollowed === true ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    color: trade.plan?.planFollowed === true ? '#10b981' : '#8898aa',
                    cursor: 'pointer',
                    fontWeight: trade.plan?.planFollowed === true ? 600 : 400,
                  }}
                >
                  {p.yes}
                </button>
                <button
                  type="button"
                  onClick={() => updateTradeField('plan', 'planFollowed', false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: trade.plan?.planFollowed === false ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                    color: trade.plan?.planFollowed === false ? '#ef4444' : '#8898aa',
                    cursor: 'pointer',
                    fontWeight: trade.plan?.planFollowed === false ? 600 : 400,
                  }}
                >
                  {p.no}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#8898aa' }}>{p.lessonLearned}</label>
              <textarea
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                value={trade.annotation?.lesson || ''}
                onChange={(e) => updateTradeField('annotation', 'lesson', e.target.value)}
              />
            </div>
          </section>

          {/* Screenshots Group */}
          <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: '#06b6d4' }}>
              <span className="material-symbols-outlined">image</span>
              {p.screenshots}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
              {trade.annotation?.screenshots && trade.annotation.screenshots.map((url, idx) => {
                const fullUrl = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000'}${url}`;
                return (
                  <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', aspectRatio: '1/1' }}>
                    <img src={fullUrl} alt={`screenshot-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => setLightboxUrl(fullUrl)} />
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); handleDeleteScreenshot(url); }} 
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px', cursor: 'pointer', display: 'flex' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                    </button>
                  </div>
                );
              })}

              <label style={{ border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', aspectRatio: '1/1', cursor: 'pointer', color: '#8898aa' }}>
                <input type="file" accept="image/*" onChange={handleScreenshotUpload} style={{ display: 'none' }} />
                {isUploading ? (
                  <>
                    <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>sync</span>
                    <span style={{ fontSize: '11px', marginTop: '4px' }}>{p.uploading}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>add_photo_alternate</span>
                    <span style={{ fontSize: '11px', marginTop: '4px' }}>{p.addImage}</span>
                  </>
                )}
              </label>
            </div>
          </section>

          {/* Trade Candlestick Chart */}
          {trade.chartData && Array.isArray(trade.chartData) && trade.chartData.length > 0 && (
            <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
               <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: '#f43f5e' }}>
                <span className="material-symbols-outlined">candlestick_chart</span>
                Chart
              </h3>
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
            </section>
          )}
        </div>
      </div>

      {/* Lightbox Modal Overlay */}
      {lightboxUrl && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setLightboxUrl(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <img src={lightboxUrl} alt="Screenshot Full View" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }} />
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
