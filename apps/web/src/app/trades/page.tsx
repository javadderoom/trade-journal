'use client';

import React, { useState, useEffect } from 'react';
import TradesTable, { Trade } from '../../components/TradesTable';

// Premium high-fidelity mock trades matching code.html
const MOCK_TRADES: Trade[] = [
  {
    id: 'mock-1',
    ticket: 12345678,
    symbol: 'XAUUSD',
    direction: 'BUY',
    openTime: '2026-06-15T10:30:00Z',
    closeTime: '2026-06-15T15:45:00Z',
    openPrice: 1984.50,
    closePrice: 1992.00,
    lotSize: 0.5,
    stopLoss: 1979.50,
    takeProfit: 1999.50,
    profitUsd: 375.00,
    commission: -2.50,
    swap: -0.50,
    pips: 75.0,
    rMultiple: 1.5,
    tags: ['آرام', 'با اطمینان'],
    setupName: 'پرایس اکشن',
    emotion: 'CONFIDENT',
    notes: 'در حمایت اصلی فریم زمانی ۴ ساعته الگو اینگالف صعودی تشکیل شد. ریسک به ریوارد مناسب بود. کمی زودتر از تارگت اصلی خارج شدم چون اخبار مهمی در راه بود.',
  },
  {
    id: 'mock-2',
    ticket: 12345679,
    symbol: 'EURUSD',
    direction: 'SELL',
    openTime: '2026-06-14T14:15:00Z',
    closeTime: '2026-06-14T16:30:00Z',
    openPrice: 1.0650,
    closePrice: 1.0670,
    lotSize: 1.0,
    stopLoss: 1.0670,
    takeProfit: 1.0610,
    profitUsd: -200.00,
    commission: -5.00,
    swap: 0.00,
    pips: -20.0,
    rMultiple: -1.0,
    tags: ['مضطرب'],
    setupName: 'شکست ساختار',
    emotion: 'ANXIOUS',
    notes: 'قیمت از ناحیه مقاومتی عبور کرد و حد ضرر من فعال شد. عجله کردم و تاییدیه دوم را نگرفتم.',
  },
  {
    id: 'mock-3',
    ticket: 12345680,
    symbol: 'GBPUSD',
    direction: 'BUY',
    openTime: '2026-06-13T09:00:00Z',
    closeTime: '2026-06-13T12:30:00Z',
    openPrice: 1.2240,
    closePrice: 1.2300,
    lotSize: 0.2,
    stopLoss: 1.2210,
    takeProfit: 1.2330,
    profitUsd: 120.00,
    commission: -1.20,
    swap: -0.10,
    pips: 60.0,
    rMultiple: 2.0,
    tags: ['آرام'],
    setupName: 'روند گیری',
    emotion: 'NEUTRAL',
    notes: 'روند صعودی قوی در تایم ۳۰ دقیقه. معامله با موفقیت به حد سود رسید.',
  },
  {
    id: 'mock-4',
    ticket: 12345681,
    symbol: 'BTCUSD',
    direction: 'SELL',
    openTime: '2026-06-15T16:45:00Z',
    closeTime: null, // Open trade
    openPrice: 34500.00,
    closePrice: null,
    lotSize: 0.05,
    stopLoss: 34800.00,
    takeProfit: 33500.00,
    profitUsd: 75.00,
    commission: -0.50,
    swap: 0.00,
    pips: 150.0,
    rMultiple: 0.5,
    tags: ['FOMO'],
    setupName: 'اسکالپ',
    emotion: 'FOMO',
    notes: 'معامله در حال حاضر باز است. حجم معامله کم است و مدیریت ریسک رعایت شده است.',
  },
  {
    id: 'mock-5',
    ticket: 12345682,
    symbol: 'AUDUSD',
    direction: 'BUY',
    openTime: '2026-06-12T11:20:00Z',
    closeTime: '2026-06-12T14:40:00Z',
    openPrice: 0.6350,
    closePrice: 0.6380,
    lotSize: 1.5,
    stopLoss: 0.6325,
    takeProfit: 0.6400,
    profitUsd: 450.00,
    commission: -7.50,
    swap: -0.80,
    pips: 30.0,
    rMultiple: 1.2,
    tags: ['با اطمینان'],
    setupName: 'پرایس اکشن',
    emotion: 'CONFIDENT',
    notes: 'برگشت قیمت از کف کانال صعودی.',
  },
  {
    id: 'mock-6',
    ticket: 12345683,
    symbol: 'USDCAD',
    direction: 'SELL',
    openTime: '2026-06-11T15:00:00Z',
    closeTime: '2026-06-11T17:10:00Z',
    openPrice: 1.3800,
    closePrice: 1.3840,
    lotSize: 0.8,
    stopLoss: 1.3840,
    takeProfit: 1.3720,
    profitUsd: -320.00,
    commission: -4.00,
    swap: 0.00,
    pips: -40.0,
    rMultiple: -1.0,
    tags: ['انتقام'],
    setupName: 'شکست ساختار',
    emotion: 'REVENGE',
    notes: 'معامله انتقامی بعد از ضرر روی EURUSD. متاسفانه باز هم با ضرر بسته شد. باید سیستم معاملاتی را رعایت کنم.',
  },
  {
    id: 'mock-7',
    ticket: 12345684,
    symbol: 'XAUUSD',
    direction: 'SELL',
    openTime: '2026-06-10T08:45:00Z',
    closeTime: '2026-06-10T11:15:00Z',
    openPrice: 1990.00,
    closePrice: 1980.00,
    lotSize: 0.3,
    stopLoss: 1994.00,
    takeProfit: 1970.00,
    profitUsd: 300.00,
    commission: -1.50,
    swap: 0.00,
    pips: 100.0,
    rMultiple: 2.5,
    tags: ['آرام'],
    setupName: 'روند گیری',
    emotion: 'NEUTRAL',
    notes: 'شکست پرقدرت مقاومت و ریزش تا اولین حمایت روزانه.',
  },
  {
    id: 'mock-8',
    ticket: 12345685,
    symbol: 'NZDUSD',
    direction: 'BUY',
    openTime: '2026-06-09T19:20:00Z',
    closeTime: '2026-06-09T20:30:00Z',
    openPrice: 0.5900,
    closePrice: 0.5885,
    lotSize: 1.0,
    stopLoss: 0.5885,
    takeProfit: 0.5930,
    profitUsd: -150.00,
    commission: -5.00,
    swap: 0.00,
    pips: -15.0,
    rMultiple: -1.0,
    tags: ['مضطرب'],
    setupName: 'اسکالپ',
    emotion: 'ANXIOUS',
    notes: 'خروج زودهنگام به دلیل استرس شدید، در حالی که تحلیل کلی درست بود.',
  }
];

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>(MOCK_TRADES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
      const res = await fetch(`${baseUrl}/api/trades?limit=200&offset=0`);
      
      if (!res.ok) {
        throw new Error(`Failed to load: ${res.status}`);
      }

      const data = await res.json();
      const apiItems = Array.isArray(data.items) ? data.items : [];

      if (apiItems.length > 0) {
        // Map API records into the full Trade type
        const mapped: Trade[] = apiItems.map((item: any, idx: number) => {
          const isBuy = item.direction === 'BUY';
          const isClosed = item.closeTime !== null;
          const openPrice = item.openPrice ?? 0;
          const closePrice = item.closePrice ?? null;
          
          // Calculate pips if not provided
          let pips = 0;
          if (isClosed && closePrice) {
            const multiplier = item.symbol.includes('JPY') || item.symbol.includes('XAU') ? 100 : 10000;
            pips = isBuy ? (closePrice - openPrice) * multiplier : (openPrice - closePrice) * multiplier;
          }

          // Calculate R multiple (default to 1.5/-1.0 if no SL, otherwise calculate from SL)
          let rMultiple = item.rMultiple ?? 0;
          const stopLossVal = item.stopLoss ?? 0;
          if (stopLossVal > 0 && openPrice > 0) {
            const risk = isBuy ? (openPrice - stopLossVal) : (stopLossVal - openPrice);
            if (risk > 0) {
              const exitPrice = closePrice ?? openPrice;
              const reward = isBuy ? (exitPrice - openPrice) : (openPrice - exitPrice);
              rMultiple = reward / risk;
            }
          } else if (rMultiple === 0 && item.profitUsd !== 0) {
            rMultiple = item.profitUsd > 0 ? 1.5 : -1.0;
          }

          return {
            id: item.ticket ? String(item.ticket) : `api-${idx}`,
            ticket: item.ticket ?? null,
            symbol: item.symbol,
            direction: item.direction,
            openTime: item.openTime,
            closeTime: item.closeTime,
            openPrice,
            closePrice,
            lotSize: item.lotSize ?? 0.1,
            stopLoss: item.stopLoss ?? null,
            takeProfit: item.takeProfit ?? null,
            profitUsd: item.profitUsd ?? 0,
            commission: item.commission ?? 0,
            swap: item.swap ?? 0,
            pips: item.pips ?? pips,
            rMultiple: rMultiple,
            tags: item.tags ?? [],
            setupName: item.setupName ?? null,
            emotion: item.emotion ?? null,
            notes: item.notes ?? null,
          };
        });
        setTrades(mapped);
      } else {
        // Default to mock trades if API has 0 records
        setTrades(MOCK_TRADES);
      }
    } catch (e: any) {
      console.warn('API error, falling back to mock data:', e.message);
      // Fallback silently to mock trades for testing
      setTrades(MOCK_TRADES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const handleUpdateTrade = async (updatedTrade: Trade): Promise<boolean> => {
    // Optimistic state update in local state
    setTrades(prev =>
      prev.map(t => (t.id === updatedTrade.id ? updatedTrade : t))
    );

    // Call update API
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
      const ticket = updatedTrade.ticket;

      if (!ticket) return true; // mock local only if no ticket

      const res = await fetch(`${baseUrl}/api/trades/${ticket}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: updatedTrade.notes,
          emotion: updatedTrade.emotion,
          setupName: updatedTrade.setupName,
          stopLoss: updatedTrade.stopLoss,
          takeProfit: updatedTrade.takeProfit,
          tags: updatedTrade.tags,
        }),
      });

      return res.ok;
    } catch (err) {
      console.error('Failed to update trade on backend:', err);
      return true; // Return true so frontend local change persists
    }
  };

  const handleDeleteTrade = async (tradeId: string): Promise<boolean> => {
    try {
      const target = trades.find(t => t.id === tradeId);
      if (!target || !target.ticket) return true; // local mock only

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
      const res = await fetch(`${baseUrl}/api/trades/${target.ticket}`, {
        method: 'DELETE',
      });

      return res.ok;
    } catch (err) {
      console.error('Failed to delete trade on backend:', err);
      return true;
    }
  };

  const handleImportMT4 = () => {
    alert('امکان واردات فایل در فازهای بعدی فعال خواهد شد.');
  };

  const handleAddManualTrade = () => {
    alert('ثبت معامله دستی در فازهای بعدی فعال خواهد شد.');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111319', color: '#61f9b1' }}>
        <div style={{ fontSize: '20px', fontFamily: 'Vazirmatn' }}>در حال دریافت اطلاعات معاملات...</div>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#111319' }}>
      <TradesTable
        initialTrades={trades}
        onRefresh={fetchTrades}
        onImportMT4={handleImportMT4}
        onAddManualTrade={handleAddManualTrade}
        onUpdateTrade={handleUpdateTrade}
        onDeleteTrade={handleDeleteTrade}
      />
    </main>
  );
}
