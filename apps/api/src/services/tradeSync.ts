import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { SyncResult, TradeData } from '../types';
import { logError } from './logger';

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

  console.log(`[Sync] accountId=${accountId} incoming=${trades.length} tickets=${trades.map(t => t.ticket).join(',')}`);

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

  console.log(`[Sync] existingInDB=${existingTrades.length} tickets=${existingTrades.map(t => t.ticket).join(',')}`);

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
      console.log(`[Sync] SKIP ticket=${trade.ticket} reason=invalid_ticket`);
      result.skipped++;
      continue;
    }

    const existing = existingMap.get(trade.ticket);

    if (!existing) {
      // Prepare CREATE operation
      operations.push(async () => {
        try {
          console.log(`[Sync] CREATE ticket=${trade.ticket} symbol=${trade.symbol} dir=${trade.direction}`);
          const newTrade = await prisma.trade.create({
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

          // Create ENTRY execution
          await prisma.execution.create({
            data: {
              trade_id: newTrade.id,
              type: 'ENTRY',
              lot_size: trade.lotSize,
              price: trade.openPrice,
              profit_usd: 0,
              commission: trade.commission,
              swap: 0,
              pips: 0,
              r_multiple: 0,
              executed_at: new Date(trade.openTime),
            },
          });

          // If already closed on first sync, create EXIT execution too
          if (trade.closeTime && trade.closePrice !== null && trade.closePrice !== undefined) {
            await prisma.execution.create({
              data: {
                trade_id: newTrade.id,
                type: 'EXIT',
                lot_size: trade.lotSize,
                price: trade.closePrice,
                profit_usd: trade.profitUsd,
                commission: 0,
                swap: trade.swap,
                pips: trade.pips ?? 0,
                r_multiple: trade.rMultiple,
                close_time: new Date(trade.closeTime),
                executed_at: new Date(trade.closeTime),
              },
            });
          }

          result.created++;
          console.log(`[Sync] CREATED ticket=${trade.ticket}`);
        } catch (err: any) {
          console.error(`[Sync] ERROR ticket=${trade.ticket} [Create]: ${err.message}`);
          result.errors.push(`Ticket ${trade.ticket} [Create]: ${err.message}`);
          logError('SYNC', `CREATE failed ticket=${trade.ticket}: ${err.message}`, { ticket: trade.ticket, accountId, operation: 'CREATE' });
        }
      });
    } else if (existing.close_time === null) {
      // Prepare UPDATE operation for active (open) trades
      operations.push(async () => {
        try {
          console.log(`[Sync] UPDATE ticket=${trade.ticket} closing=${!!trade.closeTime}`);
          // MT5 strips SL/TP from the payload when a trade closes.
          // Only overwrite stop_loss / take_profit when the incoming value is a real
          // positive number — otherwise keep whatever was recorded while trade was open.
          const slUpdate = (trade.stopLoss && trade.stopLoss > 0)
            ? { stop_loss: trade.stopLoss }
            : {};
          const tpUpdate = (trade.takeProfit && trade.takeProfit > 0)
            ? { take_profit: trade.takeProfit }
            : {};

          const isClosing = !!trade.closeTime;

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
              ...(isClosing
                ? {
                    close_time: new Date(trade.closeTime!),
                    close_price: trade.closePrice ?? null,
                  }
                : {}),
            },
          });

          // If closing, create EXIT execution
          if (isClosing && trade.closePrice !== null && trade.closePrice !== undefined) {
            await prisma.execution.create({
              data: {
                trade_id: existing.id,
                type: 'EXIT',
                lot_size: existing.lot_size,
                price: trade.closePrice,
                profit_usd: trade.profitUsd,
                commission: trade.commission,
                swap: trade.swap,
                pips: trade.pips ?? 0,
                r_multiple: trade.rMultiple,
                close_time: new Date(trade.closeTime!),
                executed_at: new Date(trade.closeTime!),
              },
            });
            await syncTradeAggregates(existing.id);
          }

          result.updated++;
          console.log(`[Sync] UPDATED ticket=${trade.ticket}`);
        } catch (err: any) {
          console.error(`[Sync] ERROR ticket=${trade.ticket} [Update]: ${err.message}`);
          result.errors.push(`Ticket ${trade.ticket} [Update]: ${err.message}`);
          logError('SYNC', `UPDATE failed ticket=${trade.ticket}: ${err.message}`, { ticket: trade.ticket, accountId, operation: 'UPDATE' });
        }
      });
    } else {
      // Skipped closed trades (finalized in DB already)
      console.log(`[Sync] SKIP ticket=${trade.ticket} reason=already_closed`);
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

  console.log(`[Sync] RESULT created=${result.created} updated=${result.updated} skipped=${result.skipped} errors=${result.errors.length}`);
  if (result.errors.length > 0) {
    console.error(`[Sync] ERRORS:`, result.errors);
    logError('SYNC', `Batch errors (${result.errors.length}): ${result.errors.join('; ')}`, { accountId, created: result.created, updated: result.updated, skipped: result.skipped, errors: result.errors });
  }

  return result;
}


/**
 * Syncs Trade-level aggregate fields from its Executions.
 * Call after creating/updating/deleting Executions.
 *
 * Aggregates:
 * - profit_usd: sum of EXIT.profit_usd
 * - commission: sum of all Execution.commission
 * - swap: sum of all Execution.swap
 * - close_price: last EXIT.price (null if no exits)
 * - close_time: last EXIT.close_time (null if no exits)
 * - pips: last EXIT.pips
 * - r_multiple: last EXIT.r_multiple
 */
export async function syncTradeAggregates(tradeId: string, prismaClient?: typeof prisma) {
  const db = prismaClient || prisma;
  const executions = await db.execution.findMany({
    where: { trade_id: tradeId },
    orderBy: { executed_at: 'asc' },
  });

  if (executions.length === 0) return;

  const exits = executions.filter(e => e.type === 'EXIT');
  const lastExit = exits.length > 0 ? exits[exits.length - 1] : null;

  const totalProfitUsd = exits.reduce((sum, e) => sum + e.profit_usd, 0);
  const totalCommission = executions.reduce((sum, e) => sum + e.commission, 0);
  const totalSwap = executions.reduce((sum, e) => sum + e.swap, 0);

  await db.trade.update({
    where: { id: tradeId },
    data: {
      profit_usd: totalProfitUsd,
      commission: totalCommission,
      swap: totalSwap,
      close_price: lastExit?.price ?? null,
      close_time: lastExit?.close_time ?? null,
      pips: lastExit?.pips ?? 0,
      r_multiple: lastExit?.r_multiple ?? 0,
    },
  });
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
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  plan?: string;
}): Promise<TradeListRow[]> {
  const { userId, accountId } = params;
  const limit = Math.min(Math.max(params.limit ?? 100, 1), 500);
  const offset = Math.max(params.offset ?? 0, 0);

  const filterAccount = accountId && accountId !== 'all';

  // Map client sort keys to Prisma column names
  const sortColumnMap: Record<string, string> = {
    date: 'open_time',
    symbol: 'symbol',
    direction: 'direction',
    volume: 'lot_size',
    pnl: 'profit_usd',
    rr: 'r_multiple',
  };
  const sortCol = sortColumnMap[params.sortKey || ''] || 'open_time';
  const sortDir = params.sortDir === 'asc' ? 'asc' : 'desc';

  let plan = params.plan;
  if (!plan) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    plan = user?.plan || 'FREE';
  }

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
    orderBy: { [sortCol]: sortDir },
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
      import_source: true,
      account: { select: { account_type: true } },
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
    importSource: t.import_source,
    accountType: t.account.account_type,
  }));
}
