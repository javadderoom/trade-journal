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
 * Fetch zero-cost historical candlestick data.
 * Tries Binance API first for crypto, Yahoo Finance proxy second, or generates realistic fallback data.
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
    console.warn('[MarketData] Proxy fetch failed:', err.message || err);
    throw err;
  }

  throw new Error(`Market data unavailable for ${normSymbol} (check rate limits or connectivity)`);
}

/**
 * Generate synthetic realistic OHLCV candles if offline or APIs are restricted.
 */
function generateSyntheticCandles(symbol: string, timeframe: Timeframe, count: number): CandleData[] {
  const symbolInfo = SYMBOL_MAP[symbol] || { basePrice: 100.0 };
  let currentPrice = symbolInfo.basePrice;

  const timeframeSecondsMap: Record<Timeframe, number> = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
  };

  const stepSeconds = timeframeSecondsMap[timeframe] || 900;
  const nowSec = Math.floor(Date.now() / 1000);
  const startSec = nowSec - count * stepSeconds;

  const candles: CandleData[] = [];
  let prevClose = currentPrice;

  for (let i = 0; i < count; i++) {
    const candleTime = startSec + i * stepSeconds;
    const volatility = prevClose * 0.003; // 0.3% volatility
    const change = (Math.random() - 0.49) * volatility * 2;
    const open = prevClose;
    const close = open + change;

    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    const volume = Math.round(100 + Math.random() * 5000);

    candles.push({
      time: candleTime,
      open: Number(open.toFixed(symbol.includes('JPY') ? 3 : 5)),
      high: Number(high.toFixed(symbol.includes('JPY') ? 3 : 5)),
      low: Number(low.toFixed(symbol.includes('JPY') ? 3 : 5)),
      close: Number(close.toFixed(symbol.includes('JPY') ? 3 : 5)),
      volume,
    });

    prevClose = close;
  }

  return candles;
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
