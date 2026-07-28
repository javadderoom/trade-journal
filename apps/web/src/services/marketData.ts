export interface CandleData {
  time: number; // Unix timestamp in seconds (for lightweight-charts)
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

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
  const symbolInfo = SYMBOL_MAP[normSymbol] || { basePrice: 100.0 };

  // 1. Try Binance Public API for Crypto
  if (symbolInfo.binanceSymbol) {
    try {
      const intervalMap: Record<Timeframe, string> = {
        '1m': '1m',
        '5m': '5m',
        '15m': '15m',
        '1h': '1h',
        '4h': '4h',
        '1d': '1d',
      };
      const binanceInterval = intervalMap[timeframe] || '15m';
      const url = `https://api.binance.com/api/v3/klines?symbol=${symbolInfo.binanceSymbol}&interval=${binanceInterval}&limit=${limit}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const rawData = await response.json();
        if (Array.isArray(rawData) && rawData.length > 0) {
          const candles: CandleData[] = rawData.map((item: any) => ({
            time: Math.floor(Number(item[0]) / 1000), // convert ms to unix timestamp (seconds)
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5]),
          }));

          // Sort ascending by time
          return candles.sort((a, b) => a.time - b.time);
        }
      }
    } catch (err) {
      console.warn('[MarketData] Binance API fetch failed, trying backend proxy:', err);
    }
  }

  // 2. Try direct Yahoo Finance or Backend Proxy for Forex & Commodities
  try {
    const yahooSym = symbolInfo.yahooSymbol || 'XAUUSD=X';
    let interval = '15m';
    let range = '1mo';

    if (timeframe === '1m') { interval = '1m'; range = '7d'; }
    else if (timeframe === '5m') { interval = '5m'; range = '1mo'; }
    else if (timeframe === '15m') { interval = '15m'; range = '1mo'; }
    else if (timeframe === '1h') { interval = '60m'; range = '3mo'; }
    else if (timeframe === '4h') { interval = '60m'; range = '1y'; }
    else if (timeframe === '1d') { interval = '1d'; range = '2y'; }

    // Try API Proxy first
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const proxyUrl = `${apiBase}/api/market-data/history?symbol=${encodeURIComponent(normSymbol)}&timeframe=${timeframe}&limit=${limit}`;
    
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.candles) && data.candles.length > 0) {
        return data.candles;
      }
    }
  } catch (err) {
    console.warn('[MarketData] Proxy fetch failed:', err);
  }

  // 3. No fallback — throw so the UI can show an error
  throw new Error(`Market data unavailable for ${normSymbol}`);
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
