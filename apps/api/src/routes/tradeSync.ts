import { Router, Request, Response } from 'express';
import { syncTradesFromEA } from '../services/tradeSync';

const router = Router();

/**
 * POST /api/trades/sync
 * Receives trade data from MT5 Expert Advisor and stores in DB.
 *
 * Body: { userId: string, accountId: string, trades: EATrade[] }
 * Or:   EATrade[] (defaults to first user/account for development)
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { userId, accountId, trades } = req.body;

    if (!Array.isArray(trades) || trades.length === 0) {
      res.status(400).json({ error: 'trades array is required and must not be empty' });
      return;
    }

    // For development: allow missing userId/accountId
    // In production, these should come from auth middleware
    const targetUserId = userId || 'dev-user';
    const targetAccountId = accountId || 'dev-account';

    const result = await syncTradesFromEA(targetUserId, targetAccountId, trades);

    res.status(201).json({
      message: `Synced ${result.created} new trades`,
      ...result,
    });
  } catch (err: any) {
    console.error('Trade sync error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router;
