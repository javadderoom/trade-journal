import cron from 'node-cron';
import axios from 'axios';
import { prisma } from './tradeSync';
import { RequestThrottler } from '../utils/rateLimiter';
import { QuotaExhaustedError, hasDailyBudget, recordSpend, markExhaustedUntilMidnight } from '../utils/dailyQuota';
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

// Daily hard stop (see utils/dailyQuota.ts). Abort a run entirely once tripped.
let quotaAborted = false;

let isJobRunning = false;
let lastRunTime: Date | null = null;
let lastRunResult: CronJobResult | null = null;

// Unattended fetching (cron schedule + startup refresh) must not run from a
// dev machine unless explicitly opted in via ENABLE_HISTORICAL_CRON=1.
// Manual/admin-triggered refreshes stay available everywhere — the per-minute
// throttle and TD_DAILY_BUDGET cap them either way.
function isUnattendedFetchingEnabled(): boolean {
  return process.env.NODE_ENV !== 'development' || process.env.ENABLE_HISTORICAL_CRON === '1';
}

interface CachedCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type CandleCacheRow = {
  symbol: string;
  timeframe: string;
  candles: any;
  count: number;
  fetched_at: Date;
  last_candle_at: Date | null;
};

export interface CronJobResult {
  startTime: Date;
  endTime: Date;
  duration: number;
  totalJobs: number;
  successes: number;
  failures: number;
  skipped: number;
  aborted?: string;
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
  if (!isUnattendedFetchingEnabled()) {
    console.log('[Cron] Scheduled historical data refresh disabled in development (set ENABLE_HISTORICAL_CRON=1 to force)');
    return;
  }

  cron.schedule('0 */4 * * *', async () => {
    console.log('[Cron] Historical data refresh triggered');
    await refreshAllHistoricalData();
  });

  setTimeout(async () => {
    try {
      const newest = await prisma.candleCache.aggregate({ _max: { fetched_at: true } });
      const newestAt = newest._max.fetched_at;
      const ageHours = newestAt ? (Date.now() - new Date(newestAt).getTime()) / 3600000 : Infinity;

      if (!newestAt || ageHours > 12) {
        console.log(`[Cron] Running startup historical data refresh (cache ${Number.isFinite(ageHours) ? `${ageHours.toFixed(1)}h` : 'empty'})...`);
        await refreshAllHistoricalData();
      } else {
        console.log(`[Cron] Skipping startup refresh — cache is fresh (${ageHours.toFixed(1)}h old)`);
      }
    } catch (err: any) {
      console.error('[Cron] Startup refresh check failed:', err.message);
    }
  }, 5000);

  console.log('[Cron] Historical data cron job scheduled (every 4 hours)');
}

export async function refreshAllHistoricalData(): Promise<CronJobResult> {
  if (isJobRunning) {
    console.log('[Cron] Job already running, skipping...');
    return lastRunResult!;
  }

  isJobRunning = true;
  quotaAborted = false;
  const startTime = new Date();
  const errors: CronJobResult['errors'] = [];
  let successes = 0;
  let failures = 0;
  let skipped = 0;
  let aborted: string | undefined;

  try {
    outer:
    for (const symbol of SUPPORTED_SYMBOLS) {
      for (const timeframe of SUPPORTED_TIMEFRAMES) {
        if (quotaAborted) break outer;

        const jobKey = `${symbol.name}-${timeframe}`;

        try {
          const existing = await prisma.candleCache.findUnique({
            where: { symbol_timeframe: { symbol: symbol.name, timeframe } },
          });

          if (isCacheFresh(existing, timeframe, isCrypto(symbol.name))) {
            console.log(`[Cron] Skipping ${jobKey} (fresh, ${existing!.count} candles)`);
            skipped++;
            continue;
          }

          console.log(`[Cron] Fetching ${jobKey} (${symbol.provider})...`);
          const candles = await fetchAndCache(symbol, timeframe, existing);

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

          if (err instanceof QuotaExhaustedError) {
            quotaAborted = true;
            aborted = `Twelve Data daily quota exhausted at ${symbol.name}-${timeframe}`;
            console.error(`[Cron] ${aborted} — aborting remaining jobs until midnight UTC`);
          }
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
      aborted,
      errors,
    };
    console.log(`[Cron] Refresh complete: ${successes} success, ${failures} failed, ${skipped} skipped${aborted ? `, ABORTED (${aborted})` : ''}`);
  }

  return lastRunResult;
}

export async function refreshSymbolData(
  symbolName: string,
  timeframes?: Timeframe[]
): Promise<CronJobResult> {
  if (isJobRunning) {
    throw new Error('Another refresh job is already running');
  }

  const symbol = getSymbolConfig(symbolName);
  if (!symbol) throw new Error(`Unknown symbol: ${symbolName}`);

  isJobRunning = true;
  quotaAborted = false;
  const tfs = timeframes ?? [...SUPPORTED_TIMEFRAMES];
  const startTime = new Date();
  const errors: CronJobResult['errors'] = [];
  let successes = 0;
  let failures = 0;

  try {
    for (const tf of tfs) {
      if (quotaAborted) break;

      try {
        const existing = await prisma.candleCache.findUnique({
          where: { symbol_timeframe: { symbol: symbolName, timeframe: tf } },
        });

        console.log(`[Admin] Manual refresh: ${symbolName}-${tf} (${symbol.provider})`);
        const candles = await fetchAndCache(symbol, tf, existing);
        if (candles > 0) {
          successes++;
        } else {
          failures++;
          errors.push({ symbol: symbolName, timeframe: tf, error: 'No data returned' });
        }
      } catch (err: any) {
        failures++;
        errors.push({ symbol: symbolName, timeframe: tf, error: err.message });
        if (err instanceof QuotaExhaustedError) {
          quotaAborted = true;
          errors.push({ symbol: symbolName, timeframe: tf, error: 'Daily quota exhausted — run aborted' });
        }
      }
    }
  } finally {
    isJobRunning = false;
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
      const isStale = !isCacheFresh(cached as CandleCacheRow | null, tf, isCrypto(symbol.name));

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

// ─── Freshness ───────────────────────────────────────────────────────────────

function isCacheFresh(existing: CandleCacheRow | null, timeframe: string, crypto: boolean): boolean {
  if (!existing || existing.count === 0) return false;

  // Age gate: fetched recently enough for the cron cadence
  const ageMs = Date.now() - new Date(existing.fetched_at).getTime();
  if (ageMs > getTimeframeExpiryMs(timeframe)) return false;

  // Coverage gate: data actually reaches near-now. Tolerates weekend gaps for
  // non-crypto markets (~52h from Fri 22:00 UTC to Sun 22:00 UTC).
  // Rows written before last_candle_at existed are treated as stale once.
  if (!existing.last_candle_at) return false;
  const coverageMs = crypto
    ? getCoverageToleranceMs(timeframe)
    : Math.max(getCoverageToleranceMs(timeframe), 52 * 60 * 60 * 1000);
  if (Date.now() - new Date(existing.last_candle_at).getTime() > coverageMs) return false;

  return true;
}

function getCoverageToleranceMs(timeframe: string): number {
  return getTimeframeMs(timeframe) * 8;
}

function getTimeframeMs(timeframe: string): number {
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

// ─── Internal Helpers ────────────────────────────────────────────────────────

async function fetchAndCache(symbol: SymbolConfig, timeframe: string, existing: CandleCacheRow | null): Promise<number> {
  if (symbol.provider === 'lse') {
    return fetchAndCacheLse(symbol, timeframe);
  } else {
    return fetchAndCacheTwelveData(symbol, timeframe, existing);
  }
}

// ─── Twelve Data ─────────────────────────────────────────────────────────────

async function fetchAndCacheTwelveData(symbol: SymbolConfig, timeframe: string, existing: CandleCacheRow | null): Promise<number> {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    console.warn('TWELVEDATA_API_KEY is not set. Data fetching will likely fail on non-free symbols.');
  }
  if (!symbol.twelveSymbol) throw new Error(`No Twelve Data symbol for ${symbol.name}`);

  const limit = 5000;
  const twelveInterval = timeframeToTwelveInterval(timeframe);

  // Incremental top-up when we have usable cache; full backfill only when cold.
  const incremental = !!existing && existing.count > 0 && !!existing.last_candle_at;
  const fetchLimit = incremental ? getIncrementalOutputSize(timeframe, isCrypto(symbol.name)) : limit;

  let candles = await fetchTwelveDataPaginated(symbol.twelveSymbol, twelveInterval, fetchLimit, apiKey || '', isCrypto(symbol.name));

  if (incremental) {
    // An empty top-up means the provider returned nothing usable — surface it
    // as a failure instead of silently re-marking stale cache as fresh.
    if (candles.length === 0) {
      throw new Error('Incremental fetch returned no candles');
    }
    candles = mergeCandles(parseCachedCandles(existing.candles), candles, limit);
  }

  candles = candles.slice(-limit);

  if (candles.length === 0) return 0;

  const lastTime = candles[candles.length - 1].time;

  await prisma.candleCache.upsert({
    where: { symbol_timeframe: { symbol: symbol.name, timeframe } },
    update: {
      candles,
      count: candles.length,
      fetched_at: new Date(),
      last_candle_at: new Date(lastTime * 1000),
    },
    create: {
      symbol: symbol.name,
      timeframe,
      candles,
      count: candles.length,
      fetched_at: new Date(),
      last_candle_at: new Date(lastTime * 1000),
    },
  });

  return candles.length;
}

function parseCachedCandles(raw: any): CachedCandle[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(c => c && typeof c.time === 'number') as CachedCandle[];
}

function mergeCandles(existing: CachedCandle[], fresh: CachedCandle[], limit: number): CachedCandle[] {
  if (existing.length === 0) return fresh;
  const map = new Map<number, CachedCandle>();
  for (const c of existing) map.set(c.time, c);
  // Fresh values win on collision (last bar may still have been forming)
  for (const c of fresh) map.set(c.time, c);
  return Array.from(map.values()).sort((a, b) => a.time - b.time).slice(-limit);
}

// Large enough to bridge the longest gap between 4-hourly runs, including a
// full weekend for non-crypto markets (~52h). Always ≤ 5000 → exactly 1 credit.
function getIncrementalOutputSize(timeframe: string, crypto: boolean): number {
  const gapHours = crypto ? 5 : 53;
  const bars = Math.ceil((gapHours * 60) / (getTimeframeMs(timeframe) / 60000)) + 20;
  return Math.min(5000, Math.max(50, bars));
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

    if (!(await hasDailyBudget())) {
      throw new QuotaExhaustedError();
    }

    await tdLimiter.waitForSlot();

    // Reserve the credit before firing so concurrent runs cannot overshoot
    await recordSpend(1);

    let rawData: any;
    try {
      const response = await axios.get(url, { timeout: 15000 });
      rawData = response.data;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429 || status === 402) {
        await markExhaustedUntilMidnight();
        throw new QuotaExhaustedError(`Twelve Data HTTP ${status}`);
      }
      throw err;
    }

    if (rawData.status !== 'ok' || !Array.isArray(rawData.values) || rawData.values.length === 0) {
      if (rawData.status === 'error') {
        console.error(`[TwelveData Error]:`, rawData.message);
        if (isCreditLimitError(rawData)) {
          await markExhaustedUntilMidnight();
          throw new QuotaExhaustedError(`Twelve Data: ${rawData.message}`);
        }
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

function isCreditLimitError(rawData: any): boolean {
  const message = String(rawData?.message || '').toLowerCase();
  const code = Number(rawData?.code);
  return (
    code === 429 ||
    /daily limit|run over|credits?|exhausted|too many requests/.test(message)
  );
}

function timeframeToTwelveInterval(timeframe: string): string {
  const map: Record<string, string> = {
    '1m': '1min',
    '5m': '5min',
    '15m': '15min',
    '1h': '1h',
    '4h': '4h',
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

  const lastTime = candles[candles.length - 1].time;

  await prisma.candleCache.upsert({
    where: { symbol_timeframe: { symbol: symbol.name, timeframe } },
    update: {
      candles,
      count: candles.length,
      fetched_at: new Date(),
      last_candle_at: new Date(lastTime * 1000),
    },
    create: {
      symbol: symbol.name,
      timeframe,
      candles,
      count: candles.length,
      fetched_at: new Date(),
      last_candle_at: new Date(lastTime * 1000),
    },
  });

  return candles.length;
}

function getStartDate(timeframe: string, candleCount: number): string {
  const msNeeded = getTimeframeMs(timeframe) * candleCount;
  const startDate = new Date(Date.now() - msNeeded);

  return startDate.toISOString().split('T')[0];
}

// ─── Shared Helpers ──────────────────────────────────────────────────────────

// Aligned with the 4-hour cron cadence: intraday TFs refresh every cycle,
// 1d only needs one refresh per day.
function getTimeframeExpiryMs(timeframe: string): number {
  const map: Record<string, number> = {
    '1m': 4 * 60 * 60 * 1000,
    '5m': 4 * 60 * 60 * 1000,
    '15m': 4 * 60 * 60 * 1000,
    '1h': 4 * 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };
  return map[timeframe] || 4 * 60 * 60 * 1000;
}

function getNextCronRunTime(): Date {
  const now = Date.now();
  const fourHours = 4 * 60 * 60 * 1000;
  return new Date(now + (fourHours - (now % fourHours)));
}
