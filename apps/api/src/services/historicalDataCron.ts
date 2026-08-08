import cron from 'node-cron';
import axios from 'axios';
import { prisma } from './tradeSync';
import { RequestThrottler } from '../utils/rateLimiter';
import {
  SUPPORTED_SYMBOLS,
  SUPPORTED_TIMEFRAMES,
  isCrypto,
  getSymbolConfig,
  SymbolConfig,
  Timeframe,
} from '../config/symbols';

const LSE_BASE_URL = 'https://api.londonstrategicedge.com/vault';

// Separate rate limiters for each provider
const tdLimiter = new RequestThrottler(7, 60000);   // Twelve Data: 7 req/min (1 buffer from 8)
const lseLimiter = new RequestThrottler(10, 60000);  // LSE: 10 req/min (conservative)

let isJobRunning = false;
let lastRunTime: Date | null = null;
let lastRunResult: CronJobResult | null = null;

export interface CronJobResult {
  startTime: Date;
  endTime: Date;
  duration: number;
  totalJobs: number;
  successes: number;
  failures: number;
  skipped: number;
  errors: Array<{ symbol: string; timeframe: string; error: string }>;
}

export interface CacheStatus {
  symbol: string;
  timeframe: string;
  provider: string;
  category: string;
  candleCount: number;
  lastFetched: Date;
  isStale: boolean;
  ageMinutes: number;
}

export function startHistoricalDataCron(): void {
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Historical data refresh triggered');
    await refreshAllHistoricalData();
  });

  setTimeout(async () => {
    console.log('[Cron] Running initial historical data refresh on startup...');
    await refreshAllHistoricalData();
  }, 5000);

  console.log('[Cron] Historical data cron job scheduled (every hour)');
}

export async function refreshAllHistoricalData(): Promise<CronJobResult> {
  if (isJobRunning) {
    console.log('[Cron] Job already running, skipping...');
    return lastRunResult!;
  }

  isJobRunning = true;
  const startTime = new Date();
  const errors: CronJobResult['errors'] = [];
  let successes = 0;
  let failures = 0;
  let skipped = 0;

  try {
    for (const symbol of SUPPORTED_SYMBOLS) {
      for (const timeframe of SUPPORTED_TIMEFRAMES) {
        const jobKey = `${symbol.name}-${timeframe}`;

        try {
          const existing = await prisma.candleCache.findUnique({
            where: { symbol_timeframe: { symbol: symbol.name, timeframe } },
          });

          const expiryMs = getTimeframeExpiryMs(timeframe);
          const isStale = existing
            ? Date.now() - new Date(existing.fetched_at).getTime() > expiryMs
            : true;

          if (!isStale && existing && existing.count >= 4500) {
            console.log(`[Cron] Skipping ${jobKey} (fresh, ${existing.count} candles)`);
            skipped++;
            continue;
          }

          console.log(`[Cron] Fetching ${jobKey} (${symbol.provider})...`);
          const candles = await fetchAndCache(symbol, timeframe);

          if (candles > 0) {
            successes++;
            console.log(`[Cron] ${jobKey}: cached ${candles} candles`);
          } else {
            failures++;
            errors.push({ symbol: symbol.name, timeframe, error: 'No data returned' });
          }
        } catch (err: any) {
          failures++;
          errors.push({ symbol: symbol.name, timeframe, error: err.message });
          console.error(`[Cron] ${jobKey} failed:`, err.message);
        }
      }
    }
  } finally {
    isJobRunning = false;
    lastRunTime = new Date();
    lastRunResult = {
      startTime,
      endTime: new Date(),
      duration: Date.now() - startTime.getTime(),
      totalJobs: SUPPORTED_SYMBOLS.length * SUPPORTED_TIMEFRAMES.length,
      successes,
      failures,
      skipped,
      errors,
    };
    console.log(`[Cron] Refresh complete: ${successes} success, ${failures} failed, ${skipped} skipped`);
  }

  return lastRunResult;
}

export async function refreshSymbolData(
  symbolName: string,
  timeframes?: Timeframe[]
): Promise<CronJobResult> {
  const symbol = getSymbolConfig(symbolName);
  if (!symbol) throw new Error(`Unknown symbol: ${symbolName}`);

  const tfs = timeframes ?? [...SUPPORTED_TIMEFRAMES];
  const startTime = new Date();
  const errors: CronJobResult['errors'] = [];
  let successes = 0;
  let failures = 0;

  for (const tf of tfs) {
    try {
      console.log(`[Admin] Manual refresh: ${symbolName}-${tf} (${symbol.provider})`);
      const candles = await fetchAndCache(symbol, tf);
      if (candles > 0) {
        successes++;
      } else {
        failures++;
        errors.push({ symbol: symbolName, timeframe: tf, error: 'No data returned' });
      }
    } catch (err: any) {
      failures++;
      errors.push({ symbol: symbolName, timeframe: tf, error: err.message });
    }
  }

  return {
    startTime,
    endTime: new Date(),
    duration: Date.now() - startTime.getTime(),
    totalJobs: tfs.length,
    successes,
    failures,
    skipped: 0,
    errors,
  };
}

export async function getCandleCacheStatus(): Promise<CacheStatus[]> {
  const all = await prisma.candleCache.findMany();
  const statusMap = new Map(all.map(c => [`${c.symbol}-${c.timeframe}`, c]));

  const result: CacheStatus[] = [];

  for (const symbol of SUPPORTED_SYMBOLS) {
    for (const tf of SUPPORTED_TIMEFRAMES) {
      const cached = statusMap.get(`${symbol.name}-${tf}`);
      const expiryMs = getTimeframeExpiryMs(tf);
      const ageMs = cached ? Date.now() - new Date(cached.fetched_at).getTime() : Infinity;
      const isStale = ageMs > expiryMs;

      result.push({
        symbol: symbol.name,
        timeframe: tf,
        provider: symbol.provider,
        category: symbol.category,
        candleCount: cached?.count ?? 0,
        lastFetched: cached?.fetched_at ?? new Date(0),
        isStale,
        ageMinutes: Math.round(ageMs / 60000),
      });
    }
  }

  return result;
}

export function getJobStatus() {
  return {
    isRunning: isJobRunning,
    lastRunTime,
    lastRunResult,
    nextRunTime: getNextCronRunTime(),
  };
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

async function fetchAndCache(symbol: SymbolConfig, timeframe: string): Promise<number> {
  if (symbol.provider === 'lse') {
    return fetchAndCacheLse(symbol, timeframe);
  } else {
    return fetchAndCacheTwelveData(symbol, timeframe);
  }
}

// ─── Twelve Data ─────────────────────────────────────────────────────────────

async function fetchAndCacheTwelveData(symbol: SymbolConfig, timeframe: string): Promise<number> {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    console.warn('TWELVEDATA_API_KEY is not set. Data fetching will likely fail on non-free symbols.');
  }
  if (!symbol.twelveSymbol) throw new Error(`No Twelve Data symbol for ${symbol.name}`);

  const limit = 5000;
  const twelveInterval = timeframeToTwelveInterval(timeframe);
  const fetchLimit = timeframe === '4h' ? limit * 4 : limit;

  const allCandles = await fetchTwelveDataPaginated(symbol.twelveSymbol, twelveInterval, fetchLimit, apiKey || '', isCrypto(symbol.name));

  let candles = allCandles;
  if (timeframe === '4h') {
    candles = aggregate4HourCandles(candles);
  }

  candles = candles.slice(-limit);

  if (candles.length === 0) return 0;

  await prisma.candleCache.upsert({
    where: { symbol_timeframe: { symbol: symbol.name, timeframe } },
    update: { candles, count: candles.length, fetched_at: new Date() },
    create: { symbol: symbol.name, timeframe, candles, count: candles.length, fetched_at: new Date() },
  });

  return candles.length;
}

async function fetchTwelveDataPaginated(
  twelveSymbol: string,
  interval: string,
  limit: number,
  apiKey: string,
  isCrypto: boolean
): Promise<any[]> {
  let allCandles: any[] = [];
  let currentEndDate: string | null = null;
  const maxRequests = Math.ceil(limit / 5000) + 1;

  for (let i = 0; i < maxRequests; i++) {
    const fetchLimit = Math.min(5000, limit - allCandles.length);
    if (fetchLimit <= 0) break;

    let url = `https://api.twelvedata.com/time_series?symbol=${twelveSymbol}&interval=${interval}&outputsize=${fetchLimit}&timezone=UTC&apikey=${apiKey}`;
    if (currentEndDate) {
      url += `&end_date=${encodeURIComponent(currentEndDate)}`;
    }

    await tdLimiter.waitForSlot();

    const response = await axios.get(url, { timeout: 15000 });
    const rawData = response.data;

    if (rawData.status !== 'ok' || !Array.isArray(rawData.values) || rawData.values.length === 0) {
      if (rawData.status === 'error') {
        console.error(`[TwelveData Error]:`, rawData.message);
      }
      break;
    }

    let chunk: any[] = rawData.values.map((item: any) => ({
      time: Math.floor(new Date(item.datetime + 'Z').getTime() / 1000),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: item.volume ? parseFloat(item.volume) : 0,
    }));

    const oldestTimeMs = chunk[chunk.length - 1].time * 1000;
    currentEndDate = new Date(oldestTimeMs - 1000).toISOString().replace('T', ' ').substring(0, 19);

    if (!isCrypto) {
      chunk = chunk.filter((c: any) => {
        const d = new Date(c.time * 1000);
        const day = d.getUTCDay();
        const hrs = d.getUTCHours();
        const isWeekend = day === 6 || (day === 5 && hrs >= 22) || (day === 0 && hrs < 21);
        return !isWeekend;
      });
    }

    chunk.reverse();
    allCandles = [...chunk, ...allCandles];

    if (rawData.values.length < fetchLimit) break;
  }

  const uniqueCandles = Array.from(new Map(allCandles.map(c => [c.time, c])).values());
  return uniqueCandles.sort((a, b) => a.time - b.time).slice(-limit);
}

function aggregate4HourCandles(
  rawCandles: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>
): any[] {
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

    aggregated.push({ time: chunk[0].time, open, high, low, close, volume });
  }
  return aggregated;
}

function timeframeToTwelveInterval(timeframe: string): string {
  const map: Record<string, string> = {
    '1m': '1min',
    '5m': '5min',
    '15m': '15min',
    '1h': '1h',
    '4h': '1h', // aggregate from 1h
    '1d': '1day',
  };
  return map[timeframe] || '15min';
}

// ─── LSE ─────────────────────────────────────────────────────────────────────

async function fetchAndCacheLse(symbol: SymbolConfig, timeframe: string): Promise<number> {
  const apiKey = process.env.LSE_API_KEY;
  if (!apiKey) {
    console.warn('LSE_API_KEY is not set. Data fetching will likely fail on LSE symbols.');
  }
  if (!symbol.lseSymbol) throw new Error(`No LSE symbol for ${symbol.name}`);

  const limit = 5000;
  const startDate = getStartDate(timeframe, limit);

  const url = `${LSE_BASE_URL}/candles?symbol=${encodeURIComponent(symbol.lseSymbol)}&timeframe=${timeframe}&start=${startDate}`;

  await lseLimiter.waitForSlot();

  const response = await axios.get(url, {
    headers: { 'x-api-key': apiKey || '' },
    timeout: 15000,
  });

  const rawData = response.data;

  // Parse LSE response (list of dicts)
  let candles: any[];
  if (Array.isArray(rawData)) {
    candles = rawData.map((item: any) => ({
      time: Math.floor(new Date(item.time || item.datetime || item.timestamp).getTime() / 1000),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: item.volume ? parseFloat(item.volume) : 0,
    }));
  } else if (rawData.candles && Array.isArray(rawData.candles)) {
    candles = rawData.candles.map((item: any) => ({
      time: Math.floor(new Date(item.time || item.datetime).getTime() / 1000),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: item.volume ? parseFloat(item.volume) : 0,
    }));
  } else {
    throw new Error('Unexpected LSE response format');
  }

  // Filter weekend candles for commodities
  if (!isCrypto(symbol.name)) {
    candles = candles.filter((c: any) => {
      const d = new Date(c.time * 1000);
      const day = d.getUTCDay();
      const hrs = d.getUTCHours();
      const isWeekend = day === 6 || (day === 5 && hrs >= 22) || (day === 0 && hrs < 21);
      return !isWeekend;
    });
  }

  candles = candles.sort((a: any, b: any) => a.time - b.time).slice(-limit);

  if (candles.length === 0) return 0;

  await prisma.candleCache.upsert({
    where: { symbol_timeframe: { symbol: symbol.name, timeframe } },
    update: { candles, count: candles.length, fetched_at: new Date() },
    create: { symbol: symbol.name, timeframe, candles, count: candles.length, fetched_at: new Date() },
  });

  return candles.length;
}

function getStartDate(timeframe: string, candleCount: number): string {
  const msPerCandle: Record<string, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };

  const msNeeded = (msPerCandle[timeframe] || 15 * 60 * 1000) * candleCount;
  const startDate = new Date(Date.now() - msNeeded);

  return startDate.toISOString().split('T')[0];
}

// ─── Shared Helpers ──────────────────────────────────────────────────────────

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

function getNextCronRunTime(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next;
}
