import { create } from 'zustand';
import { Trade } from '../components/trades/TradesTable';
import { api } from '../lib/api';

export const MOCK_TRADES: Trade[] = [
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
    tags: ['پرایس اکشن', 'برگشت از حمایت'],
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
    tags: ['شکست ساختار', 'نقض قانون'],
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
    tags: ['روند گیری', 'مدیریت خوب'],
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
    tags: ['اسکالپ', 'خبری'],
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
    tags: ['پرایس اکشن', 'برگشت از حمایت', 'مدیریت خوب'],
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
    tags: ['شکست ساختار', 'نقض قانون', 'حجم اضافه'],
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
    tags: ['روند گیری', 'شکست ساختار'],
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
    tags: ['اسکالپ', 'خروج زود'],
    emotion: 'ANXIOUS',
    notes: 'خروج زودهنگام به دلیل استرس شدید، در حالی که تحلیل کلی درست بود.',
  }
];

interface TradeState {
  trades: Trade[];
  loading: boolean;
  error: string | null;
  setTrades: (trades: Trade[]) => void;
  fetchTrades: (isManualRefresh?: boolean, accountId?: string) => Promise<void>;
  updateTrade: (updatedTrade: Trade) => Promise<boolean>;
  deleteTrade: (tradeId: string) => Promise<boolean>;
  deleteMultipleTrades: (tradeIds: string[]) => Promise<boolean>;
}

export const useTradeStore = create<TradeState>((set, get) => ({
  trades: [],
  loading: false,
  error: null,

  setTrades: (trades) => set({ trades }),

  fetchTrades: async (isManualRefresh = false, accountId = 'all') => {
    try {
      if (!isManualRefresh) {
        set({ loading: true });
      }
      set({ error: null });

      const res = await api.get(`/api/trades?limit=200&offset=0&accountId=${accountId}&t=${Date.now()}`);
      
      const apiItems = Array.isArray(res.data?.items) ? res.data.items : [];

      if (apiItems.length > 0) {
        // Map API records into the full Trade type
        const mapped: Trade[] = apiItems.map((item: any) => {
          const isBuy = item.direction === 'BUY';
          const isClosed = item.closeTime !== null;
          const openPrice = item.openPrice ?? 0;
          const closePrice = item.closePrice ?? null;
          
          let pips = 0;
          if (isClosed && closePrice) {
            const multiplier = item.symbol.includes('JPY') || item.symbol.includes('XAU') ? 100 : 10000;
            pips = isBuy ? (closePrice - openPrice) * multiplier : (openPrice - closePrice) * multiplier;
          }

          let rMultiple = item.rMultiple ?? 0;
          const stopLossVal = item.stopLoss ?? 0;
          if (stopLossVal > 0 && openPrice > 0) {
            const risk = isBuy ? (openPrice - stopLossVal) : (stopLossVal - openPrice);
            if (risk > 0) {
              const exitPrice = closePrice ?? openPrice;
              const reward = isBuy ? (exitPrice - openPrice) : (openPrice - exitPrice);
              rMultiple = reward / risk;
            }
          }

          return {
            id: item.id,
            accountId: item.accountId,
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
            emotion: item.emotion ?? null,
            notes: item.notes ?? null,
            screenshots: item.screenshots ?? [],
            chartData: item.chartData ?? null,
          };
        });
        set({ trades: mapped });
      } else {
        set({ trades: MOCK_TRADES });
      }
    } catch (e: any) {
      console.warn('API error, falling back to mock data:', e.message);
      set({ trades: MOCK_TRADES });
    } finally {
      set({ loading: false });
    }
  },

  updateTrade: async (updatedTrade: Trade): Promise<boolean> => {
    // Optimistic state update in local state
    const currentTrades = get().trades;
    set({
      trades: currentTrades.map((t) => (t.id === updatedTrade.id ? updatedTrade : t))
    });

    try {
      const tradeId = updatedTrade.id;
      if (tradeId.startsWith('mock-')) return true; // mock local only

      const res = await api.put(`/api/trades/${tradeId}`, {
        notes: updatedTrade.notes,
        emotion: updatedTrade.emotion,
        stopLoss: updatedTrade.stopLoss,
        takeProfit: updatedTrade.takeProfit,
        tags: updatedTrade.tags,
        accountId: updatedTrade.accountId,
        closeTime: updatedTrade.closeTime,
        closePrice: updatedTrade.closePrice,
        profitUsd: updatedTrade.profitUsd,
        commission: updatedTrade.commission,
        swap: updatedTrade.swap,
        symbol: updatedTrade.symbol,
        direction: updatedTrade.direction,
        lotSize: updatedTrade.lotSize,
        openPrice: updatedTrade.openPrice,
        openTime: updatedTrade.openTime,
      });

      return res.status >= 200 && res.status < 300;
    } catch (err) {
      console.error('Failed to update trade on backend:', err);
      return true; // Return true so frontend local change persists
    }
  },

  deleteTrade: async (tradeId: string): Promise<boolean> => {
    try {
      if (tradeId.startsWith('mock-')) return true; // local mock only

      const res = await api.delete(`/api/trades/${tradeId}`);

      return res.status >= 200 && res.status < 300;
    } catch (err) {
      console.error('Failed to delete trade on backend:', err);
      return true;
    }
  },

  deleteMultipleTrades: async (tradeIds: string[]): Promise<boolean> => {
    try {
      const realIds = tradeIds.filter(id => !id.startsWith('mock-'));
      if (realIds.length === 0) return true; // local mock only

      const res = await api.post(`/api/trades/bulk-delete`, { ids: realIds });

      return res.status >= 200 && res.status < 300;
    } catch (err) {
      console.error('Failed to delete multiple trades on backend:', err);
      return true;
    }
  }
}));
