import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../services/tradeSync';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Middleware to restrict access to Pro users and Admins
const requireProOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.plan !== 'PRO' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'ویژگی بک‌تست تنها برای کاربران حرفه‌ای در دسترس است.' });
  }
  next();
};

const MAX_SESSIONS_PER_USER = 50;

const createSessionSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  symbol: z.string().min(1).max(50),
  timeframe: z.string().min(1).max(20),
  initialBalance: z.coerce.number().positive().max(1e12).optional().nullable(),
  finalBalance: z.coerce.number().max(1e12).optional().nullable(),
  totalTrades: z.coerce.number().int().min(0).max(1_000_000).optional().nullable(),
  winRate: z.coerce.number().min(0).max(100).optional().nullable(),
  profitFactor: z.coerce.number().min(0).max(1e6).optional().nullable(),
  maxDrawdown: z.coerce.number().min(0).max(100).optional().nullable(),
  tradeLog: z.array(z.record(z.string(), z.unknown())).max(10_000).optional().nullable(),
  equityCurve: z.array(z.record(z.string(), z.unknown())).max(10_000).optional().nullable(),
});

/**
 * GET /api/backtest
 * List saved backtest sessions for current user.
 */
router.get('/', authenticate, requireProOrAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const sessions = await prisma.backtestSession.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    res.json(sessions);
  } catch (err: any) {
    console.error('Failed to list backtest sessions:', err);
    res.status(500).json({ error: 'Failed to list backtest sessions' });
  }
});

/**
 * POST /api/backtest
 * Save a completed backtest session report.
 */
router.post('/', authenticate, requireProOrAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'اطلاعات سشن بک‌تست معتبر نیست',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }
    const {
      title,
      symbol,
      timeframe,
      initialBalance,
      finalBalance,
      totalTrades,
      winRate,
      profitFactor,
      maxDrawdown,
      tradeLog,
      equityCurve,
    } = parsed.data;

    // Enforce per-user session cap: delete oldest beyond the limit
    const existing = await prisma.backtestSession.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      select: { id: true },
    });
    if (existing.length >= MAX_SESSIONS_PER_USER) {
      const toDelete = existing.slice(MAX_SESSIONS_PER_USER - 1).map((s) => s.id);
      await prisma.backtestSession.deleteMany({ where: { id: { in: toDelete } } });
    }

    const newSession = await prisma.backtestSession.create({
      data: {
        user_id: userId,
        title: title || `${symbol} ${timeframe} Backtest`,
        symbol: symbol || 'XAUUSD',
        timeframe: timeframe || '15m',
        initial_balance: initialBalance ?? 10000,
        final_balance: finalBalance ?? 10000,
        total_trades: totalTrades ?? 0,
        win_rate: winRate ?? 0,
        profit_factor: profitFactor ?? 0,
        max_drawdown: maxDrawdown ?? 0,
        trade_log: (tradeLog as any) ?? [],
        equity_curve: (equityCurve as any) ?? [],
      },
    });

    res.status(201).json(newSession);
  } catch (err: any) {
    console.error('Failed to save backtest session:', err);
    res.status(500).json({ error: 'Failed to save backtest session' });
  }
});

/**
 * DELETE /api/backtest/:id
 * Delete a backtest session.
 */
router.delete('/:id', authenticate, requireProOrAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const session = await prisma.backtestSession.findUnique({ where: { id } });
    if (!session || session.user_id !== userId) {
      res.status(404).json({ error: 'Backtest session not found' });
      return;
    }

    await prisma.backtestSession.delete({ where: { id } });
    res.json({ success: true, message: 'Backtest session deleted' });
  } catch (err: any) {
    console.error('Failed to delete backtest session:', err);
    res.status(500).json({ error: 'Failed to delete backtest session' });
  }
});

export default router;
