import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../services/tradeSync';
import { rateLimit } from '../middleware/rateLimit';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Middleware to restrict access to Pro users and Admins
const requireProOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.plan !== 'PRO' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'This feature is only available for Pro users.' });
  }
  next();
};

const historyQuerySchema = z.object({
  symbol: z.string().min(1).max(50),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']),
  limit: z.coerce.number().min(1).max(10000).default(500),
});

const MAX_CANDLE_LIMIT = 10000;

/**
 * GET /api/market-data/history
 * Fetch historical candles. Serves purely from DB Cache.
 */
router.get('/history', rateLimit(60 * 1000, 30), async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const symbol = (req.query.symbol as string || 'XAUUSD').toUpperCase();
  const timeframe = (req.query.timeframe as string || '15m').toLowerCase();
  const parsedLimit = parseInt(req.query.limit as string || '10000', 10);
  const limit = Math.min(
    Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : MAX_CANDLE_LIMIT,
    MAX_CANDLE_LIMIT
  );

  try {
    const cached = await prisma.candleCache.findUnique({
      where: { symbol_timeframe: { symbol, timeframe } }
    });

    if (cached) {
      const allCandles = cached.candles as any[];
      res.json({ symbol, timeframe, candles: allCandles.slice(-limit) });
      return;
    }

    // No cache available
    res.status(404).json({
      error: 'Data not available. Admin must run a refresh.',
      symbol,
      timeframe,
    });
  } catch (err: any) {
    console.error('[MarketData] Cache query error:', err.message);
    res.status(500).json({ error: 'Failed to query candle cache' });
  }
});

export default router;
