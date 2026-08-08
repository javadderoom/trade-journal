export interface CandleData {
  time: number; // Unix timestamp in seconds (for lightweight-charts)
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

import { api } from '../lib/api';

const SYMBOL_MAP: Record<string, { binanceSymbol?: string; yahooSymbol?: string; basePrice: number }> = {
  XAUUSD: { yahooSymbol: 'XAUUSD=X', basePrice: 2700.0 },
  EURUSD: { yahooSymbol: 'EURUSD=X', basePrice: 1.0850 },
  GBPUSD: { yahooSymbol: 'GBPUSD=X', basePrice: 1.3050 },
  USDJPY: { yahooSymbol: 'JPY=X', basePrice: 152.50 },
  BTCUSD: { binanceSymbol: 'BTCUSDT', yahooSymbol: 'BTC-USD', basePrice: 68000.0 },
  ETHUSD: { binanceSymbol: 'ETHUSDT', yahooSymbol: 'ETH-USD', basePrice: 2650.0 },
  SOLUSD: { binanceSymbol: 'SOLUSDT', yahooSymbol: 'SOL-USD', basePrice: 175.0 },
};

/**
 * Fetch zero-cost historical candlestick data from backend cache.
 */
export async function fetchHistoricalCandles(
  symbol: string,
  timeframe: Timeframe = '15m',
  limit: number = 500
): Promise<CandleData[]> {
  const normSymbol = symbol.toUpperCase().trim();

  try {
    const res = await api.get('/api/market-data/history', {
      params: {
        symbol: normSymbol,
        timeframe,
        limit
      }
    });
    
    if (res.data && Array.isArray(res.data.candles) && res.data.candles.length > 0) {
      return res.data.candles;
    }
  } catch (err: any) {
    console.warn('[MarketData] Cache fetch failed:', err.message || err);
    throw err;
  }

  throw new Error(`Market data unavailable for ${normSymbol}`);
}

/**
 * Fetch candles for a specific trade's chart.
 * Fetches 15m candles around the trade's open/close times.
 */
export async function fetchTradeChartCandles(
  symbol: string,
  openTime: string,
  closeTime: string | null
): Promise<CandleData[]> {
  const normSymbol = symbol.toUpperCase().trim();

  try {
    const res = await api.get('/api/market-data/history', {
      params: { symbol: normSymbol, timeframe: '15m', limit: 500 }
    });

    if (res.data?.candles) {
      // Filter to relevant time range (200 candles before open, 50 after close)
      const openTs = Math.floor(new Date(openTime).getTime() / 1000);
      const closeTs = closeTime ? Math.floor(new Date(closeTime).getTime() / 1000) : openTs;
      const rangeStart = openTs - 200 * 900; // 200 candles * 15min
      const rangeEnd = closeTs + 50 * 900;   // 50 candles * 15min

      return res.data.candles.filter((c: CandleData) =>
        c.time >= rangeStart && c.time <= rangeEnd
      );
    }
  } catch (err: any) {
    console.warn('[TradeChart] Fetch failed:', err.message);
  }

  return [];
}

/**
 * Parse custom CSV file uploaded by the user (MetaTrader 4/5 or TradingView format).
 */
export function parseCSVHistory(csvText: string): CandleData[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const candles: CandleData[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.toLowerCase().startsWith('date') || line.toLowerCase().startsWith('time')) continue; // Skip header

    const parts = line.split(/[,;\t]/).map((p) => p.trim());
    if (parts.length < 5) continue;

    // MT4 format: Date, Time, Open, High, Low, Close, Volume
    // OR Date, Open, High, Low, Close, Volume
    let timeSec = 0;
    let open = 0, high = 0, low = 0, close = 0, vol = 0;

    if (parts.length >= 7) {
      // Date + Time format
      const dateStr = `${parts[0]} ${parts[1]}`;
      timeSec = Math.floor(new Date(dateStr).getTime() / 1000);
      open = parseFloat(parts[2]);
      high = parseFloat(parts[3]);
      low = parseFloat(parts[4]);
      close = parseFloat(parts[5]);
      vol = parseFloat(parts[6]);
    } else if (parts.length >= 5) {
      timeSec = Math.floor(new Date(parts[0]).getTime() / 1000);
      open = parseFloat(parts[1]);
      high = parseFloat(parts[2]);
      low = parseFloat(parts[3]);
      close = parseFloat(parts[4]);
      vol = parts[5] ? parseFloat(parts[5]) : 0;
    }

    if (!isNaN(timeSec) && !isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close)) {
      candles.push({ time: timeSec, open, high, low, close, volume: vol });
    }
  }

  return candles.sort((a, b) => a.time - b.time);
}
