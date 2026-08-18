import { Router, Response } from 'express';
import { prisma } from '../services/tradeSync';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/trades/emotions
 * Fetches all persistent user-specific emotions from database.
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    let emotions = await prisma.emotion.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'asc' },
    });

    // Auto-seed default emotions in the database for the user if none exist
    if (emotions.length === 0) {
      const defaultSystemEmotions = [
        { value: 'CONFIDENT', label: 'با اطمینان', emoji: '😌' },
        { value: 'NEUTRAL', label: 'آرام/خنثی', emoji: '😐' },
        { value: 'ANXIOUS', label: 'مضطرب', emoji: '😰' },
        { value: 'FOMO', label: 'FOMO', emoji: '🎯' },
        { value: 'REVENGE', label: 'انتقام', emoji: '😡' },
      ];

      await prisma.emotion.createMany({
        data: defaultSystemEmotions.map(e => ({
          user_id: userId,
          value: e.value,
          label: e.label,
          emoji: e.emoji,
        })),
        skipDuplicates: true,
      });

      emotions = await prisma.emotion.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'asc' },
      });
    }

    res.status(200).json(emotions);
  } catch (err: any) {
    console.error('Fetch emotions error:', err);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * POST /api/trades/emotions/bulk
 * Bulk updates/upserts emotion options and handles deletions.
 */
router.post('/bulk', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { emotions, deletes } = req.body;
    const userId = req.user!.userId;

    // 1. Handle deletes
    if (Array.isArray(deletes) && deletes.length > 0) {
      // Delete from Emotion library
      await prisma.emotion.deleteMany({
        where: {
          user_id: userId,
          value: { in: deletes },
        },
      });

      // Clear emotion on all matching trade annotations
      await prisma.tradeAnnotation.updateMany({
        where: {
          trade: { user_id: userId },
          emotion: { in: deletes },
        },
        data: {
          emotion: null,
        },
      });
    }

    // 2. Handle updates/upserts
    if (Array.isArray(emotions)) {
      for (const e of emotions) {
        await prisma.emotion.upsert({
          where: {
            user_id_value: {
              user_id: userId,
              value: e.value,
            },
          },
          create: {
            user_id: userId,
            value: e.value,
            label: e.label,
            emoji: e.emoji || '💭',
          },
          update: {
            label: e.label,
            emoji: e.emoji || '💭',
          },
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Bulk emotion update error:', err);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
