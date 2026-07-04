import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { SyncResult, TradeData } from '../types';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

/**
 * Sync trades from MT5 EA into the database.
 * 3-way upsert by (account_id + ticket):
 *   - Not found → CREATE
 *   - Exists + open (close_time IS NULL) + incoming open → UPDATE (refresh SL/TP/profit)
 *   - Exists + open (close_time IS NULL) + incoming closed → UPDATE (finalize with close data)
 *   - Exists + closed (close_time IS NOT NULL) → SKIP (already final)
 */
export async function syncTradesFromEA(
  userId: string,
  accountId: string,
  trades: TradeData[]
): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  // Verify account exists
  const account = await prisma.account.findFirst({
    where: { id: accountId, user_id: userId },
  });
  if (!account) {
    throw new Error(`حساب معاملاتی با شناسه ${accountId} یافت نشد.`);
  }

  // 1. Extract all ticket IDs for batch fetching
  const tickets = trades
    .map(t => t.ticket)
    .filter((t): t is number => typeof t === 'number' && t > 0);

  // 2. Fetch all existing trades matching the incoming tickets in a single DB query
  const existingTrades = tickets.length > 0
    ? await prisma.trade.findMany({
        where: {
          account_id: accountId,
          ticket: { in: tickets },
        },
      })
    : [];

  // Map existing trades by ticket ID for O(1) lookup
  const existingMap = new Map<number, typeof existingTrades[0]>();
  for (const t of existingTrades) {
    if (t.ticket !== null) {
      existingMap.set(t.ticket, t);
    }
  }

  // Define operations array to execute in chunked parallel batches
  const operations: (() => Promise<void>)[] = [];

  for (const trade of trades) {
    // Skip trades without a valid ticket
    if (!trade.ticket || trade.ticket <= 0) {
      result.skipped++;
      continue;
    }

    const existing = existingMap.get(trade.ticket);

    if (!existing) {
      // Prepare CREATE operation
      operations.push(async () => {
        try {
          await prisma.trade.create({
            data: {
              account_id: accountId,
              user_id: userId,
              symbol: trade.symbol,
              direction: trade.direction as any,
              open_time: new Date(trade.openTime),
              close_time: trade.closeTime ? new Date(trade.closeTime) : null,
              open_price: trade.openPrice,
              close_price: trade.closePrice ?? null,
              lot_size: trade.lotSize,
              stop_loss: trade.stopLoss ?? null,
              take_profit: trade.takeProfit ?? null,
              profit_usd: trade.profitUsd,
              commission: trade.commission,
              swap: trade.swap,
              pips: trade.pips ?? 0,
              r_multiple: trade.rMultiple,
              ticket: trade.ticket,
              import_source: 'MT5_EA',
              chart_data: trade.chartData ? trade.chartData : undefined,
            },
          });
          result.created++;
        } catch (err: any) {
          result.errors.push(`Ticket ${trade.ticket} [Create]: ${err.message}`);
        }
      });
    } else if (existing.close_time === null) {
      // Prepare UPDATE operation for active (open) trades
      operations.push(async () => {
        try {
          // MT5 strips SL/TP from the payload when a trade closes.
          // Only overwrite stop_loss / take_profit when the incoming value is a real
          // positive number — otherwise keep whatever was recorded while trade was open.
          const slUpdate = (trade.stopLoss && trade.stopLoss > 0)
            ? { stop_loss: trade.stopLoss }
            : {};
          const tpUpdate = (trade.takeProfit && trade.takeProfit > 0)
            ? { take_profit: trade.takeProfit }
            : {};

          await prisma.trade.update({
            where: { id: existing.id },
            data: {
              ...slUpdate,
              ...tpUpdate,
              profit_usd: trade.profitUsd,
              commission: trade.commission,
              swap: trade.swap,
              pips: trade.pips ?? 0,
              r_multiple: trade.rMultiple,
              chart_data: trade.chartData ? trade.chartData : undefined,
              ...(trade.closeTime
                ? {
                    close_time: new Date(trade.closeTime),
                    close_price: trade.closePrice ?? null,
                  }
                : {}),
            },
          });
          result.updated++;
        } catch (err: any) {
          result.errors.push(`Ticket ${trade.ticket} [Update]: ${err.message}`);
        }
      });
    } else {
      // Skipped closed trades (finalized in DB already)
      result.skipped++;
    }
  }

  // 3. Process database operations in parallel chunks (concurrency limit = 25)
  const chunkSize = 25;
  for (let i = 0; i < operations.length; i += chunkSize) {
    const chunk = operations.slice(i, i + chunkSize);
    await Promise.all(chunk.map(op => op()));
  }

  // Update last_sync_at for the account
  try {
    await prisma.account.update({
      where: { id: accountId },
      data: { last_sync_at: new Date() },
    });
  } catch (err: any) {
    console.error('Failed to update account last_sync_at:', err);
  }

  return result;
}


export type TradeListRow = {
  id: string;
  accountId: string;
  ticket: number | null;
  symbol: string;
  direction: 'BUY' | 'SELL';
  openTime: string;
  closeTime: string | null;
  openPrice: number;
  closePrice: number | null;
  lotSize: number;
  stopLoss: number | null;
  takeProfit: number | null;
  profitUsd: number;
  commission: number;
  swap: number;
  pips: number;
  rMultiple: number;
  tags: string[];
  emotion: string | null;
  notes: string | null;
  screenshots: string[];
  chartData?: any;
  analysisTimeframe: string | null;
  entryTimeframe: string | null;
};

export async function getTradesForAccount(params: {
  userId: string;
  accountId?: string;
  limit?: number;
  offset?: number;
}): Promise<TradeListRow[]> {
  const { userId, accountId } = params;
  const limit = Math.min(Math.max(params.limit ?? 100, 1), 500);
  const offset = Math.max(params.offset ?? 0, 0);

  const filterAccount = accountId && accountId !== 'all';

  // Retrieve user plan to apply historical limit
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  const plan = user?.plan || 'FREE';
  let dateLimit: Date | null = null;
  if (plan === 'FREE') {
    dateLimit = new Date();
    dateLimit.setMonth(dateLimit.getMonth() - 1);
  } else if (plan === 'STANDARD') {
    dateLimit = new Date();
    dateLimit.setMonth(dateLimit.getMonth() - 6);
  }

  const trades = await prisma.trade.findMany({
    where: {
      user_id: userId,
      ...(filterAccount ? { account_id: accountId } : {}),
      ...(dateLimit ? { open_time: { gte: dateLimit } } : {}),
    },
    orderBy: { open_time: 'desc' },
    skip: offset,
    take: limit,
    select: {
      id: true,
      account_id: true,
      ticket: true,
      symbol: true,
      direction: true,
      open_time: true,
      close_time: true,
      open_price: true,
      close_price: true,
      lot_size: true,
      stop_loss: true,
      take_profit: true,
      profit_usd: true,
      commission: true,
      swap: true,
      pips: true,
      r_multiple: true,
      tags: true,
      emotion: true,
      notes: true,
      screenshots: true,
      chart_data: true,
      analysis_timeframe: true,
      entry_timeframe: true,
    },
  });

  return trades.map(t => ({
    id: t.id,
    accountId: t.account_id,
    ticket: t.ticket,
    symbol: t.symbol,
    direction: t.direction as 'BUY' | 'SELL',
    openTime: t.open_time.toISOString(),
    closeTime: t.close_time ? t.close_time.toISOString() : null,
    openPrice: t.open_price,
    closePrice: t.close_price,
    lotSize: t.lot_size,
    stopLoss: t.stop_loss,
    takeProfit: t.take_profit,
    profitUsd: t.profit_usd,
    commission: t.commission,
    swap: t.swap,
    pips: t.pips,
    rMultiple: t.r_multiple,
    tags: t.tags,
    emotion: t.emotion,
    notes: t.notes,
    screenshots: t.screenshots,
    chartData: t.chart_data,
    analysisTimeframe: t.analysis_timeframe,
    entryTimeframe: t.entry_timeframe,
  }));
}
