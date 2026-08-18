import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { SyncResult, TradeData } from '../types';
import { logError } from './logger';
import { parseBrokerDate } from './brokerDateParser';
import { getTradesForAccount, TradeListRow } from './tradeQueryService';

export { parseBrokerDate, getTradesForAccount, TradeListRow };

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
    .map(t => t.ticket ? String(t.ticket) : null)
    .filter((t): t is string => typeof t === 'string' && t.trim() !== '');

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
  const existingMap = new Map<string, typeof existingTrades[0]>();
  for (const t of existingTrades) {
    if (t.ticket !== null) {
      existingMap.set(t.ticket, t);
    }
  }

  // Define operations array to execute in chunked parallel batches
  const operations: (() => Promise<void>)[] = [];

  for (const trade of trades) {
    const ticketStr = trade.ticket ? String(trade.ticket) : '';
    // Skip trades without a valid ticket
    if (!ticketStr || ticketStr.trim() === '') {
      console.log(`[Sync] SKIP ticket=${trade.ticket} reason=invalid_ticket`);
      result.skipped++;
      continue;
    }

    const existing = existingMap.get(ticketStr);

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
              open_time: parseBrokerDate(trade.openTime, account.broker_tz) || new Date(trade.openTime),
              close_time: trade.closeTime ? (parseBrokerDate(trade.closeTime, account.broker_tz) || new Date(trade.closeTime)) : null,
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
              ticket: ticketStr,
              import_source: 'MT5_EA',
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
              executed_at: parseBrokerDate(trade.openTime, account.broker_tz) || new Date(trade.openTime),
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
                close_time: parseBrokerDate(trade.closeTime!, account.broker_tz) || new Date(trade.closeTime!),
                executed_at: parseBrokerDate(trade.closeTime!, account.broker_tz) || new Date(trade.closeTime!),
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
              ...(isClosing
                ? {
                    close_time: parseBrokerDate(trade.closeTime!, account.broker_tz) || new Date(trade.closeTime!),
                    close_price: trade.closePrice ?? null,
                  }
                : {}),
            },
          });

          // If closing, create EXIT execution
          if (isClosing && trade.closePrice !== null && trade.closePrice !== undefined) {
            const existingExecs = await prisma.execution.findMany({ where: { trade_id: existing.id } });
            const sumComm = existingExecs.reduce((sum, e) => sum + e.commission, 0);
            const sumSwap = existingExecs.reduce((sum, e) => sum + e.swap, 0);
            const sumProfit = existingExecs.filter(e => e.type === 'EXIT').reduce((sum, e) => sum + e.profit_usd, 0);

            await prisma.execution.create({
              data: {
                trade_id: existing.id,
                type: 'EXIT',
                lot_size: existing.lot_size,
                price: trade.closePrice,
                profit_usd: trade.profitUsd - sumProfit,
                commission: trade.commission - sumComm,
                swap: trade.swap - sumSwap,
                pips: trade.pips ?? 0,
                r_multiple: trade.rMultiple,
                close_time: parseBrokerDate(trade.closeTime!, account.broker_tz) || new Date(trade.closeTime!),
                executed_at: parseBrokerDate(trade.closeTime!, account.broker_tz) || new Date(trade.closeTime!),
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

