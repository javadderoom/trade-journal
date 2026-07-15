import { Router, Response } from 'express';
import { prisma } from '../services/tradeSync';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireAdmin);

// ─── GET /api/admin/diagnosis/logs — fetch logs with filtering ────────────────
router.get('/logs', async (req: AuthRequest, res: Response) => {
  try {
    const { level, source, search, days, limit: limitStr } = req.query as Record<string, string>;

    const where: any = {};

    if (level && level !== 'ALL') {
      where.level = level;
    }

    if (source && source !== 'ALL') {
      where.source = source;
    }

    if (search) {
      where.message = { contains: search, mode: 'insensitive' };
    }

    if (days) {
      const daysNum = parseInt(days, 10);
      if (!isNaN(daysNum) && daysNum > 0) {
        const since = new Date();
        since.setDate(since.getDate() - daysNum);
        where.created_at = { gte: since };
      }
    }

    const limit = Math.min(parseInt(limitStr || '100', 10) || 100, 500);

    const logs = await prisma.systemLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    // Get distinct sources for filter dropdown
    const sources = await prisma.systemLog.findMany({
      select: { source: true },
      distinct: ['source'],
      orderBy: { source: 'asc' },
    });

    return res.status(200).json({
      logs,
      sources: sources.map(s => s.source),
    });
  } catch (err: any) {
    console.error('Fetch diagnosis logs error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── DELETE /api/admin/diagnosis/logs — clear logs older than N days ──────────
router.delete('/logs', async (req: AuthRequest, res: Response) => {
  try {
    const { days } = req.query as Record<string, string>;
    const daysNum = parseInt(days || '30', 10);

    if (isNaN(daysNum) || daysNum < 1) {
      return res.status(400).json({ error: 'Invalid days parameter' });
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysNum);

    const result = await prisma.systemLog.deleteMany({
      where: {
        created_at: { lt: cutoff },
      },
    });

    return res.status(200).json({ deleted: result.count });
  } catch (err: any) {
    console.error('Clear diagnosis logs error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── GET /api/admin/diagnosis/stats — quick stats ────────────────────────────
router.get('/stats', async (_req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [errors24h, errors7d, total] = await Promise.all([
      prisma.systemLog.count({ where: { level: 'ERROR', created_at: { gte: last24h } } }),
      prisma.systemLog.count({ where: { level: 'ERROR', created_at: { gte: last7d } } }),
      prisma.systemLog.count({ where: { level: 'ERROR' } }),
    ]);

    return res.status(200).json({ errors24h, errors7d, total });
  } catch (err: any) {
    console.error('Diagnosis stats error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
