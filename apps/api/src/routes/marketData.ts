import { Router, Request, Response } from 'express';
import axios from 'axios';
import { prisma } from '../services/tradeSync';

const router = Router();

const TWELVEDATA_SYMBOL_MAP: Record<string, string> = {
  XAUUSD: 'XAU/USD',
  EURUSD: 'EUR/USD',
  GBPUSD: 'GBP/USD',
  USDJPY: 'USD/JPY',
};


const BINANCE_SYMBOL_MAP: Record<string, string> = {
  BTCUSD: 'BTCUSDT',
  ETHUSD: 'ETHUSDT',
  SOLUSD: 'SOLUSDT',
};

function aggregate4HourCandles(rawCandles: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>) {
  const aggregated = [];
  for (let i = 0; i < rawCandles.length; i += 4) {
    const chunk = rawCandles.slice(i, i + 4);
    if (chunk.length === 0) continue;

    const open = chunk[0].open;
    const close = chunk[chunk.length - 1].close;
    let high = chunk[0].high;
    let low = chunk[0].low;
    let volume = 0;

    for (const c of chunk) {
      if (c.high > high) high = c.high;
      if (c.low < low) low = c.low;
      volume += c.volume;
    }

    aggregated.push({
      time: chunk[0].time,
      open,
      high,
      low,
      close,
      volume,
    });
  }
  return aggregated;
}

// Helper to paginate Binance backwards to get up to 10k candles
async function fetchBinanceCandles(binanceSymbol: string, binanceInterval: string, limit: number): Promise<any[]> {
  let allCandles: any[] = [];
  let currentEndTime: number | null = null;
  const maxRequests = Math.ceil(limit / 1000) + 2; // Safeguard

  for (let i = 0; i < maxRequests; i++) {
    const fetchLimit = Math.min(1000, limit - allCandles.length);
    if (fetchLimit <= 0) break;

    let url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${fetchLimit}`;
    if (currentEndTime !== null) {
      url += `&endTime=${currentEndTime}`;
    }

    try {
      const response = await axios.get(url, { timeout: 6000 });
      const rawData = response.data;
      if (!Array.isArray(rawData) || rawData.length === 0) {
        break;
      }

      const chunk: any[] = rawData.map((item: any) => ({
        time: Math.floor(Number(item[0]) / 1000),
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]) || 0,
      }));

      allCandles = [...chunk, ...allCandles];
      currentEndTime = Number(rawData[0][0]) - 1;

      if (rawData.length < fetchLimit) {
        break;
      }
    } catch (err: any) {
      console.error(`[Binance Fetch Error] Page ${i}:`, err.message);
      break;
    }
  }

  const uniqueCandles = Array.from(new Map(allCandles.map(c => [c.time, c])).values());
  return uniqueCandles.sort((a, b) => a.time - b.time).slice(-limit);
}

// Helper to paginate TwelveData backwards to get up to 10k candles
async function fetchTwelveDataCandles(twelveSymbol: string, twelveInterval: string, limit: number): Promise<any[]> {
  let allCandles: any[] = [];
  let currentEndDate: string | null = null;
  const maxRequests = Math.ceil(limit / 5000) + 1; // Safeguard

  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) throw new Error("Missing TWELVEDATA_API_KEY");

  for (let i = 0; i < maxRequests; i++) {
    const fetchLimit = Math.min(5000, limit - allCandles.length);
    if (fetchLimit <= 0) break;

    let url = `https://api.twelvedata.com/time_series?symbol=${twelveSymbol}&interval=${twelveInterval}&outputsize=${fetchLimit}&timezone=UTC&apikey=${apiKey}`;
    if (currentEndDate !== null) {
      url += `&end_date=${encodeURIComponent(currentEndDate)}`;
    }

    try {
      const response = await axios.get(url, { timeout: 8000 });
      const rawData = response.data;
      if (rawData.status !== 'ok' || !Array.isArray(rawData.values) || rawData.values.length === 0) {
        if (rawData.status === 'error') {
            console.error(`[TwelveData Error]:`, rawData.message);
        }
        break;
      }

      // TwelveData returns newest to oldest. We parse and reverse to make it oldest to newest.
      const chunk: any[] = rawData.values.map((item: any) => ({
        time: Math.floor(new Date(item.datetime + 'Z').getTime() / 1000),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: item.volume ? parseFloat(item.volume) : 0,
      }));
      chunk.reverse();

      allCandles = [...chunk, ...allCandles];

      const oldestTimeMs = chunk[0].time * 1000;
      currentEndDate = new Date(oldestTimeMs - 1000).toISOString().replace('T', ' ').substring(0, 19);

      if (rawData.values.length < fetchLimit) {
        break;
      }
    } catch (err: any) {
      console.error(`[TwelveData Fetch Error] Page ${i}:`, err.message);
      break;
    }
  }

  const uniqueCandles = Array.from(new Map(allCandles.map(c => [c.time, c])).values());
  return uniqueCandles.sort((a, b) => a.time - b.time).slice(-limit);
}

/**
 * GET /api/market-data/history
 * Fetch historical candles with 0 API key required. Caches results in DB.
 */
router.get('/history', async (req: Request, res: Response): Promise<void> => {
  const symbol = (req.query.symbol as string || 'XAUUSD').toUpperCase();
  const timeframe = (req.query.timeframe as string || '15m').toLowerCase();
  const limit = parseInt(req.query.limit as string || '10000', 10);

  let cached;
  try {
    // 1. Check Cache
    cached = await prisma.candleCache.findUnique({
      where: {
        symbol_timeframe: { symbol, timeframe }
      }
    });

    const isStale = cached ? (Date.now() - new Date(cached.fetched_at).getTime() > 6 * 60 * 60 * 1000) : true;

    if (cached && !isStale && cached.count >= limit) {
      const allCandles = cached.candles as any[];
      res.json({ symbol, timeframe, candles: allCandles.slice(-limit) });
      return;
    }
  } catch (dbErr: any) {
    console.warn('[DB Cache Query Warning]:', dbErr.message);
  }

  // 2. Cache miss or stale: Fetch from upstream
  try {
    let candles: any[] = [];
    const binanceSymbol = BINANCE_SYMBOL_MAP[symbol];

    if (binanceSymbol) {
      // Fetch from Binance (Crypto)
      const intervalMap: Record<string, string> = {
        '1m': '1m',
        '5m': '5m',
        '15m': '15m',
        '1h': '1h',
        '4h': '1h', // will be aggregated below
        '1d': '1d',
      };
      const interval = intervalMap[timeframe] || '15m';
      const fetchLimit = timeframe === '4h' ? limit * 4 : limit;
      
      candles = await fetchBinanceCandles(binanceSymbol, interval, fetchLimit);
    } else {
      // Fetch from Twelve Data (Forex & Commodities)
      const twelveSymbol = TWELVEDATA_SYMBOL_MAP[symbol] || symbol;

      const twelveIntervalMap: Record<string, string> = {
        '1m': '1min',
        '5m': '5min',
        '15m': '15min',
        '1h': '1h',
        '4h': '1h', // aggregate 4h
        '1d': '1day',
      };
      const twelveInterval = twelveIntervalMap[timeframe] || '15min';
      const fetchLimit = timeframe === '4h' ? limit * 4 : limit;
      
      candles = await fetchTwelveDataCandles(twelveSymbol, twelveInterval, fetchLimit);
    }

    if (timeframe === '4h') {
      candles = aggregate4HourCandles(candles);
    }

    const finalCandles = candles.slice(-limit);

    if (finalCandles.length > 0) {
      try {
        // Upsert cache in DB
        await prisma.candleCache.upsert({
          where: {
            symbol_timeframe: { symbol, timeframe }
          },
          update: {
            candles: finalCandles as any,
            count: finalCandles.length,
            fetched_at: new Date()
          },
          create: {
            symbol,
            timeframe,
            candles: finalCandles as any,
            count: finalCandles.length,
            fetched_at: new Date()
          }
        });
      } catch (dbSaveErr: any) {
        console.error('[DB Cache Save Warning]:', dbSaveErr.message);
      }
    }

    res.json({ symbol, timeframe, candles: finalCandles });
  } catch (err: any) {
    console.error('Market data proxy error:', err.message);
    
    // Fallback: If cache exists (even if stale), serve it rather than returning 500 error
    if (cached) {
      console.log('Serving stale cache as fallback');
      res.json({ symbol, timeframe, candles: (cached.candles as any[]).slice(-limit) });
      return;
    }

    res.status(500).json({ error: 'Failed to fetch market data from proxy' });
  }
});

export default router;
