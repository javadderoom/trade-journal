import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../services/tradeSync';

const router = Router();

/**
 * GET /api/backtest
 * List saved backtest sessions for current user.
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
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
    } = req.body;

    const newSession = await prisma.backtestSession.create({
      data: {
        user_id: userId,
        title: title || `${symbol} ${timeframe} Backtest`,
        symbol: symbol || 'XAUUSD',
        timeframe: timeframe || '15m',
        initial_balance: parseFloat(initialBalance) || 10000,
        final_balance: parseFloat(finalBalance) || 10000,
        total_trades: parseInt(totalTrades, 10) || 0,
        win_rate: parseFloat(winRate) || 0,
        profit_factor: parseFloat(profitFactor) || 0,
        max_drawdown: parseFloat(maxDrawdown) || 0,
        trade_log: tradeLog || [],
        equity_curve: equityCurve || [],
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
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

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
