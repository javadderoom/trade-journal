import { Router, Response } from 'express';
import { prisma } from '../services/tradeSync';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Mood } from '@prisma/client';

const router = Router();

// GET /api/journal?date=YYYY-MM-DD
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const dateStr = req.query.date as string;
    if (!dateStr) {
      return res.status(400).json({ error: 'تاریخ مورد نظر مشخص نشده است' });
    }

    const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'فرمت تاریخ معتبر نیست' });
    }

    const entry = await prisma.journalEntry.findFirst({
      where: {
        user_id: userId,
        date: targetDate,
      },
    });

    return res.status(200).json(entry);
  } catch (err: any) {
    console.error('Fetch journal entry error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// POST /api/journal
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { date, body, mood } = req.body;

    if (!date || body === undefined) {
      return res.status(400).json({ error: 'اطلاعات ارسالی کافی نیست' });
    }

    const targetDate = new Date(`${date}T00:00:00.000Z`);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'فرمت تاریخ معتبر نیست' });
    }

    // Validate mood if provided
    let finalMood: Mood | null = null;
    if (mood) {
      if (Object.values(Mood).includes(mood as Mood)) {
        finalMood = mood as Mood;
      }
    }

    // Find if an entry already exists for this date
    const existing = await prisma.journalEntry.findFirst({
      where: {
        user_id: userId,
        date: targetDate,
      },
    });

    let result;
    if (existing) {
      result = await prisma.journalEntry.update({
        where: { id: existing.id },
        data: {
          body,
          mood: finalMood,
        },
      });
    } else {
      result = await prisma.journalEntry.create({
        data: {
          user_id: userId,
          date: targetDate,
          body,
          mood: finalMood,
        },
      });
    }

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Save journal entry error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
