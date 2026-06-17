import { Router, Request, Response } from 'express';
import { getTradesForAccount, syncTradesFromEA } from '../services/tradeSync';

const router = Router();

/**
 * POST /api/trades/sync
 * Receives trade data from MT5 Expert Advisor and stores in DB.
 *
 * Body: { userId: string, accountId: string, trades: EATrade[] }
 * Or:   EATrade[] (defaults to first user/account for development)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const body = req.query as any;

    // Development defaults (no auth in this repo yet)
    const userId = (body.userId as string | undefined) || 'dev-user';
    const accountId = (body.accountId as string | undefined) || 'dev-account';

    const limitRaw = body.limit as string | undefined;
    const offsetRaw = body.offset as string | undefined;

    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
    const offset = offsetRaw ? Number.parseInt(offsetRaw, 10) : undefined;

    const items = await getTradesForAccount({ userId, accountId, limit, offset });

    res.status(200).json({
      items,
      limit: limit ?? 100,
      offset: offset ?? 0,
      count: items.length,
    });
  } catch (err: any) {
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
router.post('/sync', async (req: Request, res: Response) => {
  try {
    /**
     * Supported request payloads:
     * 1) EA format: EATrade[]  (array root)
     * 2) Web/API format: { userId?: string, accountId?: string, trades: TradeData[] }
     */
    const body = req.body as any;

    const trades: any[] = Array.isArray(body)
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
