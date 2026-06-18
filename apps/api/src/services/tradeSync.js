"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.syncTradesFromEA = syncTradesFromEA;
exports.getTradesForAccount = getTradesForAccount;
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
exports.prisma = new client_1.PrismaClient({ adapter });
/**
 * Sync trades from MT5 EA into the database.
 * Deduplicates by (account_id + ticket).
 */
async function syncTradesFromEA(userId, accountId, trades) {
    const result = { created: 0, updated: 0, skipped: 0, errors: [] };
    // Auto-create user if not exists (development mode)
    let user = await exports.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        user = await exports.prisma.user.create({
            data: {
                id: userId,
                password_hash: 'dev-hash',
                name: userId,
            },
        });
    }
    // Auto-create account if not exists (development mode)
    let account = await exports.prisma.account.findFirst({
        where: { id: accountId, user_id: userId },
    });
    if (!account) {
        account = await exports.prisma.account.create({
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
            // Upsert: insert if new, skip if already exists (same account + ticket)
            const existing = await exports.prisma.trade.findUnique({
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
            await exports.prisma.trade.create({
                data: {
                    account_id: accountId,
                    user_id: userId,
                    symbol: trade.symbol,
                    direction: trade.direction,
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
                },
            });
            result.created++;
        }
        catch (err) {
            result.errors.push(`Ticket ${trade.ticket}: ${err.message}`);
        }
    }
    return result;
}
async function getTradesForAccount(params) {
    const { userId, accountId } = params;
    const limit = Math.min(Math.max(params.limit ?? 100, 1), 500);
    const offset = Math.max(params.offset ?? 0, 0);
    const trades = await exports.prisma.trade.findMany({
        where: { user_id: userId, account_id: accountId },
        orderBy: { open_time: 'desc' },
        skip: offset,
        take: limit,
        select: {
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
        },
    });
    return trades.map(t => ({
        ticket: t.ticket,
        symbol: t.symbol,
        direction: t.direction,
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
    }));
}
