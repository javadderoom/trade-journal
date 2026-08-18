'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trade } from '../../types/trade';
import { useTranslation, useAppStore } from '../../store/useAppStore';
import { getSharedTranslations } from '../../locales/components';
import { api } from '../../lib/api';
import { notify } from '../../lib/notify';
import LoadingButton from '../ui/LoadingButton';
import { useTradeStore } from '../../store/useTradeStore';
import { getTradingSession } from '../../utils/tradeHelpers';

interface TradeInspectPageProps {
  tradeId: string;
}

const normalizeNumericInput = (val: string): string => {
  return val.replace(/[۰-۹]/g, c => String.fromCharCode(c.charCodeAt(0) - 1728));
};

export default function TradeInspectPage({ tradeId }: TradeInspectPageProps) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const isEn = language === 'en';
  
  const { trades, fetchTrades, updateTrade } = useTradeStore();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const accounts = useAppStore(state => state.accounts || []);

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
        console.error('Failed to load trade inspect data:', err);
        if (isMounted) setError(isEn ? 'Trade not found or unauthorized' : 'معامله یافت نشد یا دسترسی غیرمجاز است');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [tradeId, isEn]);

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8898aa', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <span>{isEn ? 'Loading trade data...' : 'در حال دریافت اطلاعات معامله...'}</span>
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

  const p = {
    ...getSharedTranslations(isEn),
    back: isEn ? 'Back to Trades' : 'بازگشت به معاملات',
    inspectData: isEn ? 'Inspect Metadata' : 'بررسی داده‌های خام',
    saveChanges: isEn ? 'Save Changes' : 'ذخیره تغییرات',
    executionDetails: isEn ? 'Execution Details' : 'جزئیات اجرا',
    account: isEn ? 'Account' : 'حساب',
    symbol: isEn ? 'Symbol' : 'نماد',
    direction: isEn ? 'Direction' : 'جهت',
    volume: isEn ? 'Volume (Lots)' : 'حجم (لات)',
    openTime: isEn ? 'Open Time' : 'زمان باز شدن',
    openSession: isEn ? 'Open Session' : 'سشن باز شدن',
    openPrice: isEn ? 'Open Price' : 'قیمت باز شدن',
    sl: isEn ? 'Stop Loss' : 'حد ضرر',
    tp: isEn ? 'Take Profit' : 'حد سود',
    closeTime: isEn ? 'Close Time' : 'زمان بسته شدن',
    closePrice: isEn ? 'Close Price' : 'قیمت بسته شدن',
  };

  const updateActiveTradeField = (key: keyof Trade, value: any) => {
    setTrade(prev => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateTrade(trade);
      if (success) {
        notify.success(isEn ? 'Metadata updated successfully' : 'تغییرات با موفقیت ذخیره شد');
      } else {
        notify.error(isEn ? 'Failed to save metadata' : 'خطا در ذخیره تغییرات');
      }
    } catch (error) {
      console.error('Failed to save trade review:', error);
      notify.error(isEn ? 'Failed to save metadata' : 'خطا در ذخیره تغییرات');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: '#151921',
    border: '1px solid #2d3748',
    borderRadius: '6px',
    color: '#fff',
    outline: 'none',
    fontSize: '13px',
    fontFamily: language === 'fa' ? 'Vazirmatn' : 'inherit'
  };

  return (
    <div className="trade-review-page" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => router.back()}
            style={{ 
              background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px', padding: '0'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {isEn ? 'arrow_back' : 'arrow_forward'}
            </span>
            <span style={{ fontSize: '14px' }}>{p.back}</span>
          </button>
          
          <div style={{ width: '1px', height: '24px', backgroundColor: '#334155' }} />
          
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#3b82f6' }}>data_object</span>
            {p.inspectData}
          </h1>
        </div>
        
        <LoadingButton 
          onClick={handleSave} 
          isLoading={saving}
          style={{ 
            backgroundColor: '#3b82f6', color: '#fff', border: 'none', 
            padding: '8px 20px', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' 
          }}
        >
          {p.saveChanges}
        </LoadingButton>
      </div>

      <div style={{ backgroundColor: '#1e222b', borderRadius: '12px', padding: '24px', border: '1px solid #2d3748' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#e2e8f0' }}>{p.executionDetails}</h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(120px, auto) 1fr', 
          gap: '16px 24px',
          alignItems: 'center'
        }}>
          
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{p.account}</span>
          <span>
            <select
              value={trade.accountId || 'dev-account'}
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

          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{p.symbol}</span>
          <span>
            <input
              type="text"
              value={trade.symbol}
              onChange={e => updateActiveTradeField('symbol', e.target.value.toUpperCase())}
              style={inputStyle}
            />
          </span>

          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{p.direction}</span>
          <span>
            <select
              value={trade.direction}
              onChange={e => updateActiveTradeField('direction', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="BUY" style={{ backgroundColor: '#1e222b', color: '#fff' }}>Buy</option>
              <option value="SELL" style={{ backgroundColor: '#1e222b', color: '#fff' }}>Sell</option>
            </select>
          </span>

          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{p.volume}</span>
          <span>
            <input
              type="number"
              step="any"
              value={trade.lotSize}
              onChange={e => updateActiveTradeField('lotSize', parseFloat(normalizeNumericInput(e.target.value)) || 0)}
              style={inputStyle}
            />
          </span>

          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{p.openTime}</span>
          <span>
            <input
              type="datetime-local"
              value={trade.openTime ? trade.openTime.substring(0, 16) : ''}
              onChange={e => updateActiveTradeField('openTime', e.target.value ? new Date(e.target.value).toISOString() : null)}
              style={inputStyle}
            />
          </span>

          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{p.openSession}</span>
          <span>
            {(() => {
              const sess = getTradingSession(trade.openTime, trade.annotation?.session);
              return (
                <span className={`session-badge ${sess.className}`} style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '12px' }}>
                  {sess.emoji} {sess.label}
                </span>
              );
            })()}
          </span>

          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{p.openPrice}</span>
          <span>
            <input
              type="number"
              step="any"
              value={trade.openPrice}
              onChange={e => updateActiveTradeField('openPrice', parseFloat(normalizeNumericInput(e.target.value)) || 0)}
              style={{ ...inputStyle, fontFamily: "'Courier New', monospace" }}
              dir="ltr"
            />
          </span>

          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{p.sl}</span>
          <span>
            <input
              type="number"
              step="any"
              placeholder="--"
              value={trade.stopLoss !== null ? trade.stopLoss : ''}
              onChange={e => {
                const val = e.target.value === '' ? null : parseFloat(normalizeNumericInput(e.target.value));
                updateActiveTradeField('stopLoss', val);
              }}
              style={{ ...inputStyle, fontFamily: "'Courier New', monospace", borderLeft: '3px solid #ef4444' }}
              dir="ltr"
            />
          </span>

          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{p.tp}</span>
          <span>
            <input
              type="number"
              step="any"
              placeholder="--"
              value={trade.takeProfit !== null ? trade.takeProfit : ''}
              onChange={e => {
                const val = e.target.value === '' ? null : parseFloat(normalizeNumericInput(e.target.value));
                updateActiveTradeField('takeProfit', val);
              }}
              style={{ ...inputStyle, fontFamily: "'Courier New', monospace", borderLeft: '3px solid #10b981' }}
              dir="ltr"
            />
          </span>

          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{p.closeTime}</span>
          <span>
            <input
              type="datetime-local"
              value={trade.closeTime ? trade.closeTime.substring(0, 16) : ''}
              onChange={e => updateActiveTradeField('closeTime', e.target.value ? new Date(e.target.value).toISOString() : null)}
              style={inputStyle}
            />
          </span>

          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{p.closePrice}</span>
          <span>
            <input
              type="number"
              step="any"
              placeholder="--"
              value={trade.closePrice !== null ? trade.closePrice : ''}
              onChange={e => {
                const val = e.target.value === '' ? null : parseFloat(normalizeNumericInput(e.target.value));
                updateActiveTradeField('closePrice', val);
              }}
              style={{ ...inputStyle, fontFamily: "'Courier New', monospace" }}
              dir="ltr"
            />
          </span>

          <span style={{ color: '#94a3b8', fontSize: '13px' }}>Commission</span>
          <span>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={trade.commission !== null ? trade.commission : ''}
              onChange={e => {
                const val = e.target.value === '' ? null : parseFloat(normalizeNumericInput(e.target.value));
                updateActiveTradeField('commission', val);
              }}
              style={{ ...inputStyle, fontFamily: "'Courier New', monospace" }}
              dir="ltr"
            />
          </span>

          <span style={{ color: '#94a3b8', fontSize: '13px' }}>Swap</span>
          <span>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={trade.swap !== null ? trade.swap : ''}
              onChange={e => {
                const val = e.target.value === '' ? null : parseFloat(normalizeNumericInput(e.target.value));
                updateActiveTradeField('swap', val);
              }}
              style={{ ...inputStyle, fontFamily: "'Courier New', monospace" }}
              dir="ltr"
            />
          </span>

        </div>
      </div>
    </div>
  );
}
