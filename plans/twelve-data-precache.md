# Pre-Cached Historical Charts (Dual Provider)

## Overview

Replace MT5/MT4 EA chart data with pre-fetched historical candles stored in the database via a cron job. Uses **Two providers**:

- **Twelve Data**: Primary provider for symbols it supports (7 symbols)
- **London Strategic Edge (LSE)**: Covers the 5 symbols Twelve Data free tier doesn't support

The backtest feature becomes cache-only (no direct API fetches from frontend).

---

## Why Dual Provider?

Twelve Data free tier only supports **3 markets** (limited symbols). These 5 symbols from our list are **not available** on Twelve Data free tier:

| Symbol | Twelve Data | LSE |
|--------|-------------|-----|
| XAGUSD (Silver) | ❌ Not supported | ✅ |
| BRENT (Brent Oil) | ❌ Not supported | ✅ |
| US30 (Dow Jones) | ❌ Not supported | ✅ |
| NAS100 (Nasdaq) | ❌ Not supported | ✅ |
| SPX500 (S&P 500) | ❌ Not supported | ✅ |

---

## LSE API Reference

### Endpoint
```
GET https://api.londonstrategicedge.com/vault/candles
```

### Auth
```
x-api-key: $LSE_API_KEY
```

### Parameters
| Param | Type | Description |
|-------|------|-------------|
| `symbol` | string | e.g., `XAG/USD`, `BCO/USD`, `US30` |
| `timeframe` | string | e.g., `1m`, `5m`, `15m`, `1h`, `4h`, `1d` |
| `start` | string | ISO date (e.g., `2026-01-01`) |
| `end` | string | Optional end date |

### Response Format
Each call returns a **list of dicts**:
```json
[
  {"time": "2026-01-01T00:00:00Z", "open": 1.1234, "high": 1.1250, "low": 1.1220, "close": 1.1245, "volume": 12345},
  ...
]
```

### Example
```bash
curl -H "x-api-key: $KEY" \
  "https://api.londonstrategicedge.com/vault/candles?symbol=XAG/USD&timeframe=1d&start=2026-01-01"
```

---

## Symbol List (25 pairs)

### Twelve Data Symbols (20)
| Category | Symbols |
|----------|---------|
| **Forex Majors** | EURUSD, GBPUSD, USDJPY, USDCHF, AUDUSD, USDCAD, NZDUSD |
| **Forex Crosses** | EURGBP, EURJPY, GBPJPY, AUDJPY, CADJPY, CHFJPY |
| **Commodities** | XAUUSD |
| **Indices** | (none - all go to LSE) |
| **Crypto** | BTCUSD, ETHUSD, SOLUSD, XRPUSD, ADAUSD, DOGEUSD |

### LSE Symbols (5)
| Symbol | LSE Format | Category |
|--------|------------|----------|
| XAGUSD | XAG/USD | Commodity |
| BRENT | BCO/USD | Commodity |
| US30 | US30 | Index |
| NAS100 | NAS100 | Index |
| SPX500 | SPX500 | Index |

**Total: 25 symbols × 6 timeframes = 150 requests per refresh**

---

## Timeframes

1m, 5m, 15m, 1h, 4h, 1d (6 per symbol)

---

## Rate Limit Math

| Provider | Symbols | Timeframes | Requests | Rate | Time |
|----------|---------|------------|----------|------|------|
| Twelve Data | 20 | 6 | 120 | 7/min | ~17 min |
| LSE | 5 | 6 | 30 | 10/min | ~3 min |
| **Total** | **25** | **6** | **150** | - | **~20 min** |

| Metric | Value |
|--------|-------|
| Refresh interval | **1 hour** |
| TD daily usage | ~120 req/hour × 24 = 2,880 (if all stale) |
| TD free tier limit | 800/day - **will exceed** |

> **⚠️ TD Free Tier Issue**: At 120 requests/hour with 1-hour refresh, we'll exceed the 800/day limit. Options:
> 1. Increase staleness thresholds (e.g., 1d timeframe expires after 24h, not 1h)
> 2. Only refresh symbols with active user trades
> 3. Use 4-hour refresh interval instead of 1-hour
> 4. Upgrade to Twelve Data Grow plan ($79/mo, 377 req/min)

---

## Files to Create

### 1. `apps/api/src/config/symbols.ts`

```typescript
export interface SymbolConfig {
  name: string;           // Internal name (e.g., "EURUSD")
  provider: 'twelveData' | 'lse';
  twelveSymbol?: string;  // Twelve Data format (e.g., "EUR/USD")
  lseSymbol?: string;     // LSE format (e.g., "EUR/USD")
  category: 'forex' | 'commodity' | 'index' | 'crypto';
}

export const SUPPORTED_SYMBOLS: SymbolConfig[] = [
  // ─── Twelve Data Symbols ──────────────────────────────────────────────────
  // Forex Majors
  { name: 'EURUSD', provider: 'twelveData', twelveSymbol: 'EUR/USD', category: 'forex' },
  { name: 'GBPUSD', provider: 'twelveData', twelveSymbol: 'GBP/USD', category: 'forex' },
  { name: 'USDJPY', provider: 'twelveData', twelveSymbol: 'USD/JPY', category: 'forex' },
  { name: 'USDCHF', provider: 'twelveData', twelveSymbol: 'USD/CHF', category: 'forex' },
  { name: 'AUDUSD', provider: 'twelveData', twelveSymbol: 'AUD/USD', category: 'forex' },
  { name: 'USDCAD', provider: 'twelveData', twelveSymbol: 'USD/CAD', category: 'forex' },
  { name: 'NZDUSD', provider: 'twelveData', twelveSymbol: 'NZD/USD', category: 'forex' },

  // Forex Crosses
  { name: 'EURGBP', provider: 'twelveData', twelveSymbol: 'EUR/GBP', category: 'forex' },
  { name: 'EURJPY', provider: 'twelveData', twelveSymbol: 'EUR/JPY', category: 'forex' },
  { name: 'GBPJPY', provider: 'twelveData', twelveSymbol: 'GBP/JPY', category: 'forex' },
  { name: 'AUDJPY', provider: 'twelveData', twelveSymbol: 'AUD/JPY', category: 'forex' },
  { name: 'CADJPY', provider: 'twelveData', twelveSymbol: 'CAD/JPY', category: 'forex' },
  { name: 'CHFJPY', provider: 'twelveData', twelveSymbol: 'CHF/JPY', category: 'forex' },

  // Commodities
  { name: 'XAUUSD', provider: 'twelveData', twelveSymbol: 'XAU/USD', category: 'commodity' },

  // Crypto
  { name: 'BTCUSD', provider: 'twelveData', twelveSymbol: 'BTC/USD', category: 'crypto' },
  { name: 'ETHUSD', provider: 'twelveData', twelveSymbol: 'ETH/USD', category: 'crypto' },
  { name: 'SOLUSD', provider: 'twelveData', twelveSymbol: 'SOL/USD', category: 'crypto' },
  { name: 'XRPUSD', provider: 'twelveData', twelveSymbol: 'XRP/USD', category: 'crypto' },
  { name: 'ADAUSD', provider: 'twelveData', twelveSymbol: 'ADA/USD', category: 'crypto' },
  { name: 'DOGEUSD', provider: 'twelveData', twelveSymbol: 'DOGE/USD', category: 'crypto' },

  // ─── LSE Symbols (Twelve Data gaps) ──────────────────────────────────────
  { name: 'XAGUSD', provider: 'lse', lseSymbol: 'XAG/USD', category: 'commodity' },
  { name: 'BRENT', provider: 'lse', lseSymbol: 'BCO/USD', category: 'commodity' },
  { name: 'US30', provider: 'lse', lseSymbol: 'US30', category: 'index' },
  { name: 'NAS100', provider: 'lse', lseSymbol: 'NAS100', category: 'index' },
  { name: 'SPX500', provider: 'lse', lseSymbol: 'SPX500', category: 'index' },
];

export const SUPPORTED_TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;

export type Timeframe = typeof SUPPORTED_TIMEFRAMES[number];

export function isCrypto(symbol: string): boolean {
  return SUPPORTED_SYMBOLS.find(s => s.name === symbol)?.category === 'crypto';
}

export function getSymbolConfig(name: string): SymbolConfig | undefined {
  return SUPPORTED_SYMBOLS.find(s => s.name === name);
}

export function getTwelveSymbol(name: string): string | undefined {
  return SUPPORTED_SYMBOLS.find(s => s.name === name)?.twelveSymbol;
}

export function getLseSymbol(name: string): string | undefined {
  return SUPPORTED_SYMBOLS.find(s => s.name === name)?.lseSymbol;
}

export function getSymbolsByProvider(provider: 'twelveData' | 'lse'): SymbolConfig[] {
  return SUPPORTED_SYMBOLS.filter(s => s.provider === provider);
}
```

### 2. `apps/api/src/services/historicalDataCron.ts`

Core cron job service with dual-provider routing.

```typescript
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
  if (!apiKey) throw new Error('Missing TWELVEDATA_API_KEY');
  if (!symbol.twelveSymbol) throw new Error(`No Twelve Data symbol for ${symbol.name}`);

  const limit = 5000;
  const twelveInterval = timeframeToTwelveInterval(timeframe);
  const fetchLimit = timeframe === '4h' ? limit * 4 : limit;

  const allCandles = await fetchTwelveDataPaginated(symbol.twelveSymbol, twelveInterval, fetchLimit, apiKey, isCrypto(symbol.name));

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
  if (!apiKey) throw new Error('Missing LSE_API_KEY');
  if (!symbol.lseSymbol) throw new Error(`No LSE symbol for ${symbol.name}`);

  const limit = 5000;
  const startDate = getStartDate(timeframe, limit);

  const url = `${LSE_BASE_URL}/candles?symbol=${encodeURIComponent(symbol.lseSymbol)}&timeframe=${timeframe}&start=${startDate}`;

  await lseLimiter.waitForSlot();

  const response = await axios.get(url, {
    headers: { 'x-api-key': apiKey },
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
```

### 3. `apps/api/src/routes/adminMarketData.ts`

Admin endpoints for managing historical data.

```typescript
import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  refreshAllHistoricalData,
  refreshSymbolData,
  getCandleCacheStatus,
  getJobStatus,
} from '../services/historicalDataCron';
import { SUPPORTED_SYMBOLS, SUPPORTED_TIMEFRAMES } from '../config/symbols';

const router = Router();

router.use(authenticate);
router.use((req: AuthRequest, res: Response, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
});

/**
 * GET /api/admin/market-data/status
 * Returns freshness info for all cached symbols.
 */
router.get('/status', async (_req, res) => {
  try {
    const status = await getCandleCacheStatus();
    const jobStatus = getJobStatus();

    res.json({
      symbols: SUPPORTED_SYMBOLS.map(s => ({ name: s.name, provider: s.provider, category: s.category })),
      timeframes: [...SUPPORTED_TIMEFRAMES],
      cache: status,
      job: jobStatus,
      totalPairs: SUPPORTED_SYMBOLS.length * SUPPORTED_TIMEFRAMES.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/market-data/refresh
 * Trigger manual refresh.
 * Body: { symbol?: string, timeframes?: string[] }
 */
router.post('/refresh', async (req, res) => {
  try {
    const { symbol, timeframes } = req.body;

    if (symbol) {
      const result = await refreshSymbolData(symbol, timeframes);
      res.json({ message: `Refresh triggered for ${symbol}`, result });
    } else {
      res.json({ message: 'Full refresh triggered. Check /status for progress.' });
      refreshAllHistoricalData().catch(err => {
        console.error('[Admin] Background refresh failed:', err);
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/market-data/refresh/status
 * Get current job status.
 */
router.get('/refresh/status', (_req, res) => {
  res.json(getJobStatus());
});

export default router;
```

---

## Files to Modify

### 4. `apps/api/src/routes/marketData.ts`

**Remove upstream fetch capability.** The `/history` endpoint becomes cache-only.

**Remove:**
- `fetchTwelveDataCandles()` function
- `twelveDataLimiter` instance
- `aggregate4HourCandles()` function
- Staleness check logic
- `inFlightFetches` deduplication map
- All upstream fetch logic
- `TWELVEDATA_SYMBOL_MAP` (moved to `config/symbols.ts`)

**New `/history` endpoint:**

```typescript
router.get('/history', rateLimit(60 * 1000, 30), async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const symbol = (req.query.symbol as string || 'XAUUSD').toUpperCase();
  const timeframe = (req.query.timeframe as string || '15m').toLowerCase();
  const parsedLimit = parseInt(req.query.limit as string || '10000', 10);
  const limit = Math.min(
    Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : MAX_CANDLE_LIMIT,
    MAX_CANDLE_LIMIT
  );

  try {
    const cached = await prisma.candleCache.findUnique({
      where: { symbol_timeframe: { symbol, timeframe } }
    });

    if (cached) {
      const allCandles = cached.candles as any[];
      res.json({ symbol, timeframe, candles: allCandles.slice(-limit) });
      return;
    }

    res.status(404).json({
      error: 'Data not available. Admin must run a refresh.',
      symbol,
      timeframe,
    });
  } catch (err: any) {
    console.error('[MarketData] Cache query error:', err.message);
    res.status(500).json({ error: 'Failed to query candle cache' });
  }
});
```

### 5. `apps/api/src/server.ts`

```diff
+ import { startHistoricalDataCron } from './services/historicalDataCron';
+ import adminMarketDataRouter from './routes/adminMarketData';

+ app.use('/api/admin/market-data', adminMarketDataRouter);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
+   startHistoricalDataCron();
});
```

### 6. `apps/web/src/services/marketData.ts`

Add trade chart fetching function:

```typescript
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
      const openTs = Math.floor(new Date(openTime).getTime() / 1000);
      const closeTs = closeTime ? Math.floor(new Date(closeTime).getTime() / 1000) : openTs;
      const rangeStart = openTs - 200 * 900;
      const rangeEnd = closeTs + 50 * 900;

      return res.data.candles.filter((c: CandleData) =>
        c.time >= rangeStart && c.time <= rangeEnd
      );
    }
  } catch (err: any) {
    console.warn('[TradeChart] Fetch failed:', err.message);
  }

  return [];
}
```

Remove `generateSyntheticCandles()` function.

### 7. `apps/web/src/components/trades/TradeChart.tsx`

Add internal data fetching:

```typescript
export default function TradeChart({
  symbol,
  direction,
  openPrice,
  closePrice,
  openTime,
  closeTime,
  stopLoss,
  takeProfit,
}: TradeChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [candlesticks, setCandlesticks] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchChartData() {
      const data = await fetchTradeChartCandles(symbol ?? '', openTime, closeTime);
      if (!cancelled) {
        setCandlesticks(data);
        setLoading(false);
      }
    }

    fetchChartData();
    return () => { cancelled = true; };
  }, [symbol, openTime, closeTime]);

  // ... existing chart useEffect (unchanged)
}
```

### 8. `apps/web/src/components/trades/TradeReviewPage.tsx`

Remove `candlesticks` prop from `<TradeChart>`:

```diff
  <TradeChart
-   candlesticks={trade.chartData}
    symbol={trade.symbol}
    direction={trade.direction}
    openPrice={trade.openPrice}
    closePrice={trade.closePrice}
    openTime={trade.openTime}
    closeTime={trade.closeTime}
    stopLoss={trade.stopLoss}
    takeProfit={trade.takeProfit}
  />
```

### 9. Admin Frontend Page

**File: `apps/web/src/app/admin/market-data/page.tsx`** (NEW)

Features:
- Status table: 25 symbols × 6 timeframes with freshness indicators
- Shows provider (Twelve Data or LSE) for each symbol
- Per-symbol "Refresh" button
- "Refresh All" button
- Cron job status display (last run, next run, duration)

---

## Environment Variables

Add to `.env.example`:

```bash
# Twelve Data API Key (existing)
TWELVEDATA_API_KEY=your_twelvedata_key

# London Strategic Edge API Key (new - for 5 symbols TD doesn't support)
LSE_API_KEY=lse_live_xxxxxxxxxxxxxxxx
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CRON JOB (every hour)                     │
│  historicalDataCron.ts                                       │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  For each symbol:                                    │    │
│  │    if provider === 'twelveData':                     │    │
│  │      → fetchTwelveDataPaginated() (7 req/min)        │    │
│  │    else if provider === 'lse':                       │    │
│  │      → fetchAndCacheLse() (10 req/min)               │    │
│  │    → Upsert to CandleCache                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  25 symbols × 6 timeframes = 150 jobs                       │
│  ~20 minutes per full refresh                                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL                                │
│  CandleCache table (150 rows max)                            │
└─────────────────────────────────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│ Backtest Page   │ │ Trade Chart │ │ Admin Panel     │
│ (cache-only)    │ │ (cache-only)│ │ (manage/refresh)│
│ GET /api/...    │ │ GET /api/.. │ │ POST /api/...   │
└─────────────────┘ └─────────────┘ └─────────────────┘
```

---

## Implementation Order

| Step | File | Action |
|------|------|--------|
| 1 | `apps/api/src/config/symbols.ts` | Create dual-provider symbol config |
| 2 | `apps/api/src/services/historicalDataCron.ts` | Create cron job with TD + LSE routing |
| 3 | `apps/api/src/routes/adminMarketData.ts` | Create admin endpoints |
| 4 | `apps/api/src/routes/marketData.ts` | Remove upstream fetch, make cache-only |
| 5 | `apps/api/src/server.ts` | Register cron and admin routes |
| 6 | `.env.example` | Add LSE_API_KEY |
| 7 | `apps/web/src/services/marketData.ts` | Add `fetchTradeChartCandles`, remove synthetic fallback |
| 8 | `apps/web/src/components/trades/TradeChart.tsx` | Add internal data fetching |
| 9 | `apps/web/src/components/trades/TradeReviewPage.tsx` | Remove `chartData` prop |
| 10 | `apps/web/src/app/admin/market-data/page.tsx` | Create admin UI |

---

## Open Questions

1. **TD Free Tier Quota**: 120 TD requests/hour × 24 = 2,880/day exceeds 800/day limit. Need to adjust staleness thresholds or refresh interval.

2. **LSE Symbol Format**: Verify LSE uses `BCO/USD` for Brent, `NAS100` for Nasdaq, etc. Test with actual API calls.

3. **LSE Response Parsing**: GitHub says "list of dicts" but field names (`time` vs `datetime`) need verification.

4. **`chart_data` column**: Keep or remove from Trade table?

5. **Admin UI location**: New page `/admin/market-data` or integrate into existing admin?
