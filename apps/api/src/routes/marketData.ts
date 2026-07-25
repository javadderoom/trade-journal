import { Router, Request, Response } from 'express';
import axios from 'axios';

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

/**
 * GET /api/market-data/history
 * Fetch historical candles with 0 API key required via Yahoo Finance or Binance public REST API.
 */
router.get('/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const symbol = (req.query.symbol as string || 'XAUUSD').toUpperCase();
    const timeframe = (req.query.timeframe as string || '15m').toLowerCase();
    const limit = parseInt(req.query.limit as string || '500', 10);

    let yahooSymbol = YAHOO_SYMBOL_MAP[symbol] || symbol;
    if (symbol === 'XAUUSD' && timeframe !== '1d') {
      yahooSymbol = 'GC=F';
    }

    // Map timeframe to Yahoo Finance interval & range
    let interval = '15m';
    let range = '1mo';

    if (timeframe === '1m') { interval = '1m'; range = '7d'; }
    else if (timeframe === '5m') { interval = '5m'; range = '1mo'; }
    else if (timeframe === '15m') { interval = '15m'; range = '1mo'; }
    else if (timeframe === '1h') { interval = '60m'; range = '3mo'; }
    else if (timeframe === '4h') { interval = '60m'; range = '1y'; }
    else if (timeframe === '1d') { interval = '1d'; range = '2y'; }

    let url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${interval}&range=${range}`;

    let response;
    try {
      response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 8000,
      });
    } catch (fetchErr: any) {
      // Fallback for Gold if primary symbol returns 404
      if (symbol === 'XAUUSD') {
        const altSymbol = yahooSymbol === 'GC=F' ? 'XAUUSD=X' : 'GC=F';
        url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(altSymbol)}?interval=${interval}&range=${range}`;
        response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          timeout: 8000,
        });
      } else {
        throw fetchErr;
      }
    }

    const result = response.data?.chart?.result?.[0];
    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
      res.status(404).json({ error: 'Market data not found for symbol' });
      return;
    }

    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];
    const opens = quote.open || [];
    const highs = quote.high || [];
    const lows = quote.low || [];
    const closes = quote.close || [];
    const volumes = quote.volume || [];

    let candles = [];
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

    // If 4h timeframe, aggregate 1h candles into true 4-hour candles
    if (timeframe === '4h') {
      candles = aggregate4HourCandles(candles);
    }

    // Limit output count to requested limit
    const sliced = candles.slice(-limit);

    res.json({ symbol, timeframe, candles: sliced });
  } catch (err: any) {
    console.error('Market data proxy error:', err.message);
    res.status(500).json({ error: 'Failed to fetch market data from proxy' });
  }
});

export default router;
