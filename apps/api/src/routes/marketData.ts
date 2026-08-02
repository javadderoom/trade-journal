import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { prisma } from '../services/tradeSync';
import { rateLimit } from '../middleware/rateLimit';
import { authenticate, AuthRequest } from '../middleware/auth';
import { RequestThrottler } from '../utils/rateLimiter';

const router = Router();

// Global sliding window queue limit for TwelveData (8 requests per 60 seconds)
const twelveDataLimiter = new RequestThrottler(8, 60000);

// Map to track in-flight requests to prevent Cache Stampedes (Thundering Herd)
const inFlightFetches = new Map<string, Promise<any>>();

// Middleware to restrict access to Pro users and Admins
const requireProOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.plan !== 'PRO' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'This feature is only available for Pro users.' });
  }
  next();
};

const historyQuerySchema = z.object({
  symbol: z.string().min(1).max(50),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']),
  limit: z.coerce.number().min(1).max(10000).default(500),
});

const MAX_CANDLE_LIMIT = 10000;

const TWELVEDATA_SYMBOL_MAP: Record<string, string> = {
  XAUUSD: 'XAU/USD',
  EURUSD: 'EUR/USD',
  GBPUSD: 'GBP/USD',
  USDJPY: 'USD/JPY',
  BTCUSD: 'BTC/USD',
  ETHUSD: 'ETH/USD',
  SOLUSD: 'SOL/USD',
};

function getTimeframeExpiryMs(timeframe: string): number {
  const map: Record<string, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };
  return map[timeframe] || 15 * 60 * 1000;
}

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
      // Wait for a rate limit slot before making the upstream request to avoid 429 errors
      await twelveDataLimiter.waitForSlot();
      const response = await axios.get(url, { timeout: 8000 });
      const rawData = response.data;
      if (rawData.status !== 'ok' || !Array.isArray(rawData.values) || rawData.values.length === 0) {
        if (rawData.status === 'error') {
            console.error(`[TwelveData Error]:`, rawData.message);
        }
        break;
      }

      // TwelveData returns newest to oldest. We parse and reverse to make it oldest to newest.
      let chunk: any[] = rawData.values.map((item: any) => ({
        time: Math.floor(new Date(item.datetime + 'Z').getTime() / 1000),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: item.volume ? parseFloat(item.volume) : 0,
      }));

      // Filter out weekend garbage data for Forex/Commodities
      chunk = chunk.filter((c: any) => {
        const d = new Date(c.time * 1000);
        const day = d.getUTCDay();
        const hrs = d.getUTCHours();
        if (day === 6) return false; // Saturday
        if (day === 5 && hrs >= 22) return false; // Friday after 22:00 UTC
        if (day === 0 && hrs < 21) return false; // Sunday before 21:00 UTC
        return true;
      });

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
router.get('/history', rateLimit(60 * 1000, 30), async (req: Request, res: Response): Promise<void> => {
  const symbol = (req.query.symbol as string || 'XAUUSD').toUpperCase();
  const timeframe = (req.query.timeframe as string || '15m').toLowerCase();
  const parsedLimit = parseInt(req.query.limit as string || '10000', 10);
  const limit = Math.min(
    Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : MAX_CANDLE_LIMIT,
    MAX_CANDLE_LIMIT
  );

  let cached;
  let isDeltaFetch = false;

  try {
    // 1. Check Cache
    cached = await prisma.candleCache.findUnique({
      where: {
        symbol_timeframe: { symbol, timeframe }
      }
    });

    const expiryMs = getTimeframeExpiryMs(timeframe);
    const isStale = cached ? (Date.now() - new Date(cached.fetched_at).getTime() > expiryMs) : true;

    if (cached && cached.count >= limit) {
      if (!isStale) {
        // Cache is perfectly fresh and has enough data
        const allCandles = cached.candles as any[];
        res.json({ symbol, timeframe, candles: allCandles.slice(-limit) });
        return;
      } else {
        // Cache is stale, but we have enough historical data. We only need to fetch the latest candles (delta).
        isDeltaFetch = true;
      }
    }
  } catch (dbErr: any) {
    console.warn('[DB Cache Query Warning]:', dbErr.message);
  }

  // 2. Cache miss or stale: Fetch from upstream
  const cacheKey = `${symbol}-${timeframe}-${limit}`;

  if (!inFlightFetches.has(cacheKey)) {
    const fetchPromise = (async () => {
      let candles: any[] = [];
      
      // Fetch from Twelve Data (Crypto, Forex & Commodities)
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
      const fetchCount = isDeltaFetch ? 50 : limit;
      const fetchLimit = timeframe === '4h' ? fetchCount * 4 : fetchCount;
      
      candles = await fetchTwelveDataCandles(twelveSymbol, twelveInterval, fetchLimit);

      if (timeframe === '4h') {
        candles = aggregate4HourCandles(candles);
      }

      // If this was a delta fetch, merge the newly fetched candles with the historical cached ones
      let finalCandles = candles;
      if (isDeltaFetch && cached) {
        const cachedCandles = cached.candles as any[];
        const mergedMap = new Map();
        
        for (const c of cachedCandles) mergedMap.set(c.time, c);
        for (const c of candles) mergedMap.set(c.time, c);

        finalCandles = Array.from(mergedMap.values()).sort((a, b) => a.time - b.time);
      }

      finalCandles = finalCandles.slice(-limit);

      if (finalCandles.length === 0) {
        throw new Error(`Upstream API returned no data for ${symbol} (rate limited or network error)`);
      }

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

      return finalCandles;
    })();

    inFlightFetches.set(cacheKey, fetchPromise);

    fetchPromise.finally(() => {
      inFlightFetches.delete(cacheKey);
    });
  }

  try {
    const finalCandles = await inFlightFetches.get(cacheKey);
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
