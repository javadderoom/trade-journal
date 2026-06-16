import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { TradeData, SyncResult } from '../types';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Sync trades from MT5 EA into the database.
 * Deduplicates by (account_id + ticket).
 */
export async function syncTradesFromEA(
  userId: string,
  accountId: string,
  trades: TradeData[]
): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  // Verify account belongs to user
  const account = await prisma.account.findFirst({
    where: { id: accountId, user_id: userId },
  });
  if (!account) {
    throw new Error(`Account ${accountId} not found for user ${userId}`);
  }

  for (const trade of trades) {
    try {
      // Skip trades without a valid ticket
      if (!trade.ticket || trade.ticket <= 0) {
        result.skipped++;
        continue;
      }

      // Upsert: insert if new, skip if already exists (same account + ticket)
      const existing = await prisma.trade.findUnique({
        where: {
          account_id_ticket: {
            account_id: accountId,
            ticket: trade.ticket,
          },
        },
      });

      if (existing) {
        result.skipped++;
        continue;
      }

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
          import_source: 'MT5_EA' as any,
        },
      });

      result.created++;
    } catch (err: any) {
      result.errors.push(`Ticket ${trade.ticket}: ${err.message}`);
    }
  }

  return result;
}
