import { redis } from '../lib/redis';

const DAILY_BUDGET = parseInt(process.env.TD_DAILY_BUDGET || '700', 10);

export class QuotaExhaustedError extends Error {
  constructor(message = 'Twelve Data daily quota exhausted') {
    super(message);
    this.name = 'QuotaExhaustedError';
  }
}

// In-memory fallback when Redis is unavailable (single-process safe)
const memoryCounters = new Map<string, number>();
const memoryExhausted = new Set<string>();

function utcDateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function secondsUntilMidnightUtc(): number {
  const now = new Date();
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0);
  return Math.max(60, Math.ceil((midnight - now.getTime()) / 1000));
}

async function getSpent(dateKey: string): Promise<number> {
  try {
    const raw = await redis.get(`td:quota:${dateKey}`);
    if (raw !== null) return parseInt(raw, 10) || 0;
  } catch (err) {
    console.error('[DailyQuota] Redis read failed, using in-memory counter:', err);
  }
  return memoryCounters.get(dateKey) || 0;
}

export async function hasDailyBudget(cost: number = 1): Promise<boolean> {
  const dateKey = utcDateKey();

  try {
    if (await redis.exists(`td:quota:${dateKey}:exhausted`)) return false;
  } catch {
    if (memoryExhausted.has(dateKey)) return false;
  }

  const spent = await getSpent(dateKey);
  return spent + cost <= DAILY_BUDGET;
}

export async function recordSpend(cost: number = 1): Promise<void> {
  const dateKey = utcDateKey();
  memoryCounters.set(dateKey, (memoryCounters.get(dateKey) || 0) + cost);

  try {
    await redis.incrby(`td:quota:${dateKey}`, cost);
    // 48h TTL so keys self-clean and survive timezone edge cases
    await redis.expire(`td:quota:${dateKey}`, 172800);
  } catch (err) {
    console.error('[DailyQuota] Redis write failed:', err);
  }
}

export async function markExhaustedUntilMidnight(): Promise<void> {
  const ttl = secondsUntilMidnightUtc();
  const dateKey = utcDateKey();
  memoryExhausted.add(dateKey);

  try {
    await redis.set(`td:quota:${dateKey}:exhausted`, '1', 'EX', ttl);
  } catch (err) {
    console.error('[DailyQuota] Redis exhausted-flag write failed:', err);
  }
  console.warn(`[DailyQuota] Twelve Data marked exhausted until midnight UTC (${ttl}s)`);
}

export async function isExhausted(): Promise<boolean> {
  const dateKey = utcDateKey();
  try {
    return (await redis.exists(`td:quota:${dateKey}:exhausted`)) === 1;
  } catch {
    return memoryExhausted.has(dateKey);
  }
}

export async function getQuotaStatus(): Promise<{
  budget: number;
  spent: number;
  remaining: number;
  exhausted: boolean;
}> {
  const dateKey = utcDateKey();
  const spent = await getSpent(dateKey);
  return {
    budget: DAILY_BUDGET,
    spent,
    remaining: Math.max(0, DAILY_BUDGET - spent),
    exhausted: await isExhausted(),
  };
}
