import { Router, Request, Response } from 'express';
import axios from 'axios';
import { prisma } from '../services/tradeSync';

const router = Router();

const YAHOO_SYMBOL_MAP: Record<string, string> = {
  XAUUSD: 'XAUUSD=X',
  EURUSD: 'EURUSD=X',
  GBPUSD: 'GBPUSD=X',
  USDJPY: 'JPY=X',
  BTCUSD: 'BTC-USD',
  ETHUSD: 'ETH-USD',
  SOLUSD: 'SOL-USD',
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
      // Fetch from Yahoo (Forex & Commodities)
      let yahooSymbol = YAHOO_SYMBOL_MAP[symbol] || symbol;
      if (symbol === 'XAUUSD' && timeframe !== '1d') {
        yahooSymbol = 'GC=F';
      }

      let interval = '15m';
      let range = '60d';

      if (timeframe === '1m') { interval = '1m'; range = '7d'; }
      else if (timeframe === '5m') { interval = '5m'; range = '60d'; }
      else if (timeframe === '15m') { interval = '15m'; range = '60d'; }
      else if (timeframe === '1h') { interval = '60m'; range = '2y'; }
      else if (timeframe === '4h') { interval = '60m'; range = '2y'; }
      else if (timeframe === '1d') { interval = '1d'; range = '2y'; }

      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${interval}&range=${range}`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 8000,
      });

      const result = response.data?.chart?.result?.[0];
      if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
        throw new Error('Market data not found in Yahoo Finance response');
      }

      const timestamps = result.timestamp;
      const quote = result.indicators.quote[0];
      const opens = quote.open || [];
      const highs = quote.high || [];
      const lows = quote.low || [];
      const closes = quote.close || [];
      const volumes = quote.volume || [];

      for (let i = 0; i < timestamps.length; i++) {
        if (
          opens[i] !== null &&
          highs[i] !== null &&
          lows[i] !== null &&
          closes[i] !== null &&
          !isNaN(opens[i])
        ) {
          candles.push({
            time: timestamps[i],
            open: parseFloat(opens[i].toFixed(symbol.includes('JPY') ? 3 : 5)),
            high: parseFloat(highs[i].toFixed(symbol.includes('JPY') ? 3 : 5)),
            low: parseFloat(lows[i].toFixed(symbol.includes('JPY') ? 3 : 5)),
            close: parseFloat(closes[i].toFixed(symbol.includes('JPY') ? 3 : 5)),
            volume: volumes[i] ? Math.round(volumes[i]) : 0,
          });
        }
      }

      // Automatically back-adjust rollover gaps for Gold Futures (GC=F)
      // Restricted to 07:00 - 08:00 UTC to prevent false positives during US news events
      if (yahooSymbol === 'GC=F' && candles.length > 1) {
        for (let i = candles.length - 1; i > 0; i--) {
          const curr = candles[i];
          const prev = candles[i - 1];
          const gap = Math.abs(curr.open - prev.close);
          
          if (gap > 30 && (curr.time - prev.time) < 7200) {
            const date = new Date(curr.time * 1000);
            const utcHour = date.getUTCHours();
            
            // Yahoo batch jobs for rollover usually happen around 07:30 UTC
            if (utcHour === 7) {
              const spread = curr.open - prev.close;
              console.log(`[MarketData] Detected Gold rollover gap of ${spread} at ${date.toISOString()}. Back-adjusting...`);
              // Adjust all previous candles backwards
              for (let j = 0; j < i; j++) {
                candles[j].open = parseFloat((candles[j].open + spread).toFixed(3));
                candles[j].high = parseFloat((candles[j].high + spread).toFixed(3));
                candles[j].low = parseFloat((candles[j].low + spread).toFixed(3));
                candles[j].close = parseFloat((candles[j].close + spread).toFixed(3));
              }
            }
          }
        }
      }
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
