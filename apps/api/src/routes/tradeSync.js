"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tradeSync_1 = require("../services/tradeSync");
const router = (0, express_1.Router)();
/**
 * POST /api/trades/sync
 * Receives trade data from MT5 Expert Advisor and stores in DB.
 *
 * Body: { userId: string, accountId: string, trades: EATrade[] }
 * Or:   EATrade[] (defaults to first user/account for development)
 */
router.get('/', async (req, res) => {
    try {
        const body = req.query;
        // Development defaults (no auth in this repo yet)
        const userId = body.userId || 'dev-user';
        const accountId = body.accountId || 'dev-account';
        const limitRaw = body.limit;
        const offsetRaw = body.offset;
        const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
        const offset = offsetRaw ? Number.parseInt(offsetRaw, 10) : undefined;
        const items = await (0, tradeSync_1.getTradesForAccount)({ userId, accountId, limit, offset });
        res.status(200).json({
            items,
            limit: limit ?? 100,
            offset: offset ?? 0,
            count: items.length,
        });
    }
    catch (err) {
        console.error('Trade list error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});
/**
 * POST /api/trades/sync
 * Receives trade data from MT5 Expert Advisor and stores in DB.
 *
 * Body: { userId: string, accountId: string, trades: EATrade[] }
 * Or:   EATrade[] (defaults to first user/account for development)
 */
router.post('/sync', async (req, res) => {
    try {
        /**
         * Supported request payloads:
         * 1) EA format: EATrade[]  (array root)
         * 2) Web/API format: { userId?: string, accountId?: string, trades: TradeData[] }
         */
        const body = req.body;
        const trades = Array.isArray(body)
            ? body
            : (Array.isArray(body?.trades) ? body.trades : []);
        if (!Array.isArray(trades) || trades.length === 0) {
            res.status(400).json({
                error: 'trades array is required and must not be empty',
                hint: 'Send either an array payload (EA) or { userId, accountId, trades } (web/API).',
            });
            return;
        }
        const targetUserId = Array.isArray(body) ? 'dev-user' : (body?.userId || 'dev-user');
        const targetAccountId = Array.isArray(body) ? 'dev-account' : (body?.accountId || 'dev-account');
        const result = await (0, tradeSync_1.syncTradesFromEA)(targetUserId, targetAccountId, trades);
        res.status(201).json({
            message: `Synced ${result.created} new trades`,
            ...result,
        });
    }
    catch (err) {
        console.error('Trade sync error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});
/**
 * PUT /api/trades/:ticket
 * Updates trade notes, emotion, setup, stop_loss, and take_profit.
 */
router.put('/:ticket', async (req, res) => {
    try {
        const ticket = Number.parseInt(req.params.ticket, 10);
        if (Number.isNaN(ticket)) {
            res.status(400).json({ error: 'Invalid ticket' });
            return;
        }
        const { notes, emotion, stopLoss, takeProfit, tags } = req.body;
        const existing = await tradeSync_1.prisma.trade.findFirst({
            where: { ticket },
        });
        if (!existing) {
            res.status(404).json({ error: 'Trade not found' });
            return;
        }
        // Setup database lookup removed - strategy entity decommissioned
        // Recalculate r_multiple when stop_loss is modified
        let rMultipleUpdate = undefined;
        if (stopLoss !== undefined) {
            const stopLossVal = stopLoss === null ? null : parseFloat(stopLoss);
            if (stopLossVal && stopLossVal > 0 && existing.open_price) {
                const isBuy = existing.direction === 'BUY';
                const risk = isBuy ? (existing.open_price - stopLossVal) : (stopLossVal - existing.open_price);
                if (risk > 0) {
                    const exitPrice = existing.close_price ?? existing.open_price;
                    const reward = isBuy ? (exitPrice - existing.open_price) : (existing.open_price - exitPrice);
                    rMultipleUpdate = reward / risk;
                }
                else {
                    rMultipleUpdate = 0;
                }
            }
            else {
                // Fallback to legacy/mock-like R value if stop loss is removed
                rMultipleUpdate = existing.profit_usd > 0 ? 1.5 : -1.0;
            }
        }
        const updated = await tradeSync_1.prisma.trade.update({
            where: { id: existing.id },
            data: {
                notes: notes !== undefined ? notes : undefined,
                emotion: emotion !== undefined ? emotion : undefined,
                stop_loss: stopLoss !== undefined ? (stopLoss === null ? null : parseFloat(stopLoss)) : undefined,
                take_profit: takeProfit !== undefined ? (takeProfit === null ? null : parseFloat(takeProfit)) : undefined,
                r_multiple: rMultipleUpdate !== undefined ? rMultipleUpdate : undefined,
                tags: tags !== undefined ? tags : undefined,
            },
        });
        res.status(200).json(updated);
    }
    catch (err) {
        console.error('Update trade error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});
/**
 * DELETE /api/trades/:ticket
 * Deletes a trade by ticket.
 */
router.delete('/:ticket', async (req, res) => {
    try {
        const ticket = Number.parseInt(req.params.ticket, 10);
        if (Number.isNaN(ticket)) {
            res.status(400).json({ error: 'Invalid ticket' });
            return;
        }
        const existing = await tradeSync_1.prisma.trade.findFirst({
            where: { ticket },
        });
        if (!existing) {
            res.status(404).json({ error: 'Trade not found' });
            return;
        }
        await tradeSync_1.prisma.trade.delete({
            where: { id: existing.id },
        });
        res.status(200).json({ success: true });
    }
    catch (err) {
        console.error('Delete trade error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});
exports.default = router;
