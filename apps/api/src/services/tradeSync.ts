import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { SyncResult, TradeData } from '../types';
import { logError } from './logger';

export function parseBrokerDate(dateStr: string | number | Date, timezone: string = 'EET'): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  if (typeof dateStr === 'number') {
    return dateStr > 1e11 ? new Date(dateStr) : new Date(dateStr * 1000);
  }

  const cleanStr = String(dateStr).trim();
  if (!cleanStr) return null;

  if (cleanStr.includes('T') && (cleanStr.includes('Z') || cleanStr.includes('+'))) {
    const d = new Date(cleanStr);
    return isNaN(d.getTime()) ? null : d;
  }

  const parts = cleanStr.split(/[\sT]+/);
  if (parts.length < 2) {
    const d = new Date(cleanStr);
    return isNaN(d.getTime()) ? null : d;
  }

  const dateParts = parts[0].split(/[\.\-\/]/);
  const timeParts = parts[1].split(':');
  if (dateParts.length < 3 || timeParts.length < 2) {
    const d = new Date(cleanStr);
    return isNaN(d.getTime()) ? null : d;
  }

  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
  const day = parseInt(dateParts[2], 10);

  const hour = parseInt(timeParts[0], 10);
  const minute = parseInt(timeParts[1], 10);
  const second = timeParts.length > 2 ? parseInt(timeParts[2], 10) : 0;

  // Determine Offset based on Timezone
  let offsetHours = 0;
  if (timezone === 'GMT') {
    offsetHours = 0;
  } else if (timezone === 'EST') {
    // US Eastern Time (UTC-5, DST is UTC-4)
    // US DST: 2nd Sunday of March to 1st Sunday of November
    let isDST = false;
    if (month > 2 && month < 10) {
      isDST = true;
    } else if (month === 2) {
      const firstDay = new Date(Date.UTC(year, 2, 1));
      let secondSunday = 1 + (7 - firstDay.getUTCDay());
      if (firstDay.getUTCDay() === 0) secondSunday = 8;
      else secondSunday += 7;
      
      const dUTC = new Date(Date.UTC(year, 2, day));
      if (dUTC.getUTCDate() >= secondSunday) isDST = true;
    } else if (month === 10) {
      const firstDay = new Date(Date.UTC(year, 10, 1));
      let firstSunday = 1 + (7 - firstDay.getUTCDay());
      if (firstDay.getUTCDay() === 0) firstSunday = 1;
      
      const dUTC = new Date(Date.UTC(year, 10, day));
      if (dUTC.getUTCDate() < firstSunday) isDST = true;
    }
    offsetHours = isDST ? -4 : -5;
  } else {
    // Default to EET/EEST
    let isDST = false;
    if (month > 2 && month < 9) {
      isDST = true;
    } else if (month === 2) {
      const lastSunday = new Date(Date.UTC(year, 2, 31));
      lastSunday.setUTCDate(31 - lastSunday.getUTCDay());
      const dUTC = new Date(Date.UTC(year, 2, day));
      if (dUTC >= lastSunday) isDST = true;
    } else if (month === 9) {
      const lastSunday = new Date(Date.UTC(year, 9, 31));
      lastSunday.setUTCDate(31 - lastSunday.getUTCDay());
      const dUTC = new Date(Date.UTC(year, 9, day));
      if (dUTC < lastSunday) isDST = true;
    }
    offsetHours = isDST ? 3 : 2;
  }

  const d = new Date(Date.UTC(year, month, day, hour - offsetHours, minute, second));
  return isNaN(d.getTime()) ? null : d;
}

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


export type TradeListRow = {
  id: string;
  accountId: string;
  ticket: string | null;
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
  annotation: {
    htfBias: 'BUY' | 'SELL' | null;
    session: 'ASIA' | 'LONDON' | 'NEW_YORK' | 'OVERLAP' | null;
    thesis: string | null;
    expectation: string | null;
    lesson: string | null;
    conviction: number | null;
    emotion: string | null;
    notes: string | null;
    screenshots: string[];
  } | null;
  setup?: { concept: { id: string; name: string; color: string | null; icon: string | null } } | null;
  triggers?: { concept: { id: string; name: string; color: string | null; icon: string | null } }[];
  confluences?: { concept: { id: string; name: string; color: string | null; icon: string | null } }[];
  plan?: {
    maxRisk: number | null;
    expectedRr: number | null;
    entryCondition: string | null;
    invalidation: string | null;
    targetZone: string | null;
    expectedHoldTime: string | null;
    planFollowed: boolean | null;
  } | null;
  events: {
    id: string;
    tradeId: string;
    type: string;
    timestamp: string;
    title: string;
    description: string | null;
    metadata: any;
    attachments: string[];
    createdAt: string;
  }[];
  importSource?: string;
  accountType?: string;
};

export async function getTradesForAccount(params: {
  userId: string;
  accountId?: string;
  limit?: number;
  offset?: number;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  plan?: string;
  search?: string;
  emotion?: string;
  symbol?: string;
  direction?: 'BUY' | 'SELL';
  status?: 'OPEN' | 'CLOSED';
  dates?: string[];
}): Promise<{ items: TradeListRow[], totalCount: number }> {
  const { userId, accountId, search, emotion, symbol, direction, status, dates } = params;
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

  // Build the andConditions array to safely combine all filters
  const andConditions: any[] = [];

  if (filterAccount) {
    andConditions.push({ account_id: accountId });
  }

  if (dateLimit) {
    andConditions.push({ open_time: { gte: dateLimit } });
  }

  if (symbol && symbol !== 'همه نمادها' && symbol !== 'All Symbols') {
    if (symbol.startsWith('main:')) {
      const mainPair = symbol.substring(5);
      andConditions.push({ symbol: { contains: mainPair, mode: 'insensitive' } });
    } else {
      andConditions.push({ symbol });
    }
  }

  if (direction) {
    andConditions.push({ direction });
  }

  if (status === 'OPEN') {
    andConditions.push({ close_time: null });
  } else if (status === 'CLOSED') {
    andConditions.push({ close_time: { not: null } });
  }

  if (dates && dates.length > 0) {
    andConditions.push({
      OR: dates.map(dateStr => {
        const startDate = new Date(`${dateStr}T00:00:00.000Z`);
        const endDate = new Date(`${dateStr}T23:59:59.999Z`);
        return {
          close_time: {
            gte: startDate,
            lte: endDate
          }
        };
      })
    });
  }

  if (emotion && emotion.trim()) {
    andConditions.push({
      annotation: {
        emotion: { equals: emotion.trim(), mode: 'insensitive' }
      }
    });
  }

  if (search && search.trim()) {
    const q = search.trim();
    andConditions.push({
      OR: [
        { symbol: { contains: q, mode: 'insensitive' } },
        { ticket: { contains: q, mode: 'insensitive' } },
        { annotation: { emotion: { contains: q, mode: 'insensitive' } } },
        { annotation: { notes: { contains: q, mode: 'insensitive' } } },
        { annotation: { thesis: { contains: q, mode: 'insensitive' } } },
        { annotation: { lesson: { contains: q, mode: 'insensitive' } } },
        { setup: { concept: { name: { contains: q, mode: 'insensitive' } } } },
      ]
    });
  }

  const whereClause: any = {
    user_id: userId,
    ...(andConditions.length > 0 ? { AND: andConditions } : {})
  };

  const [totalCount, trades] = await Promise.all([
    prisma.trade.count({ where: whereClause }),
    prisma.trade.findMany({
      where: whereClause,
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
        import_source: true,
        account: { select: { account_type: true } },
        annotation: {
          select: {
            htf_bias: true,
            session: true,
            market_condition: true,
            thesis: true,
            expectation: true,
            lesson: true,
            conviction: true,
            emotion: true,
            notes: true,
            screenshots: true,
          },
        },
        setup: { select: { concept: { select: { id: true, name: true, color: true, icon: true } } } },
        triggers: { select: { concept: { select: { id: true, name: true, color: true, icon: true } } } },
        confluences: { select: { concept: { select: { id: true, name: true, color: true, icon: true } } } },
        plan: {
          select: {
            max_risk: true,
            expected_rr: true,
            entry_condition: true,
            invalidation: true,
            target_zone: true,
            expected_hold_time: true,
            plan_followed: true,
            entry_timing_correct: true,
            emotions_affected: true,
            managed_according_to_rules: true,
          }
        },
        events: {
          orderBy: { timestamp: 'asc' }
        }
      },
    })
  ]);

  const items = trades.map((t: any) => ({
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
    annotation: t.annotation ? {
      htfBias: t.annotation.htf_bias,
      session: t.annotation.session,
      marketCondition: t.annotation.market_condition,
      thesis: t.annotation.thesis,
      expectation: t.annotation.expectation,
      lesson: t.annotation.lesson,
      conviction: t.annotation.conviction,
      emotion: t.annotation.emotion,
      notes: t.annotation.notes,
      screenshots: t.annotation.screenshots,
    } : null,
    setup: (t as any).setup || null,
    triggers: t.triggers,
    confluences: t.confluences,
    plan: t.plan ? {
      maxRisk: t.plan.max_risk,
      expectedRr: t.plan.expected_rr,
      entryCondition: t.plan.entry_condition,
      invalidation: t.plan.invalidation,
      targetZone: t.plan.target_zone,
      expectedHoldTime: t.plan.expected_hold_time,
      planFollowed: t.plan.plan_followed,
      entryTimingCorrect: t.plan.entry_timing_correct,
      emotionsAffected: t.plan.emotions_affected,
      managedAccordingToRules: t.plan.managed_according_to_rules,
    } : null,
    events: t.events ? t.events.map((e: any) => ({
      id: e.id,
      tradeId: e.trade_id,
      type: e.type,
      timestamp: e.timestamp.toISOString(),
      title: e.title,
      description: e.description,
      metadata: e.metadata,
      attachments: e.attachments,
      createdAt: e.created_at.toISOString(),
    })) : [],
    importSource: t.import_source,
    accountType: t.account.account_type,
  }));
  return { items, totalCount };
}
