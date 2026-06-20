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

  // Auto-create user if not exists (development mode)
  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: userId,
        password_hash: 'dev-hash',
        name: userId,
      },
    });
  }

  // Auto-create account if not exists (development mode)
  let account = await prisma.account.findFirst({
    where: { id: accountId, user_id: userId },
  });
  if (!account) {
    account = await prisma.account.create({
      data: {
        id: accountId,
        user_id: userId,
        broker_name: 'MT5',
      },
    });
  }

  for (const trade of trades) {
    try {
      // Skip trades without a valid ticket
      if (!trade.ticket || trade.ticket <= 0) {
        result.skipped++;
        continue;
      }

      const existing = await prisma.trade.findUnique({
        where: {
          account_id_ticket: {
            account_id: accountId,
            ticket: trade.ticket,
          },
        },
      });

      if (!existing) {
        // ── CREATE: new trade ──
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
            import_source: (trade.closeTime ? 'MT5_EA' : 'MT5_EA') as any,
            chart_data: trade.chartData ? trade.chartData : undefined,
          },
        });
        result.created++;
      } else if (existing.close_time === null) {
        // ── UPDATE: trade is currently open in DB ──
        // Either refreshing live data (still open) or finalizing (now closed)
        await prisma.trade.update({
          where: { id: existing.id },
          data: {
            stop_loss: trade.stopLoss ?? null,
            take_profit: trade.takeProfit ?? null,
            profit_usd: trade.profitUsd,
            commission: trade.commission,
            swap: trade.swap,
            pips: trade.pips ?? 0,
            r_multiple: trade.rMultiple,
            chart_data: trade.chartData ? trade.chartData : undefined,
            // Fill close data only if the trade is now closed
            ...(trade.closeTime
              ? {
                  close_time: new Date(trade.closeTime),
                  close_price: trade.closePrice ?? null,
                }
              : {}),
          },
        });
        result.updated++;
      } else {
        // ── SKIP: trade already closed in DB — final record ──
        result.skipped++;
      }
    } catch (err: any) {
      result.errors.push(`Ticket ${trade.ticket}: ${err.message}`);
    }
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

  const trades = await prisma.trade.findMany({
    where: {
      user_id: userId,
      ...(filterAccount ? { account_id: accountId } : {}),
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
  }));
}
