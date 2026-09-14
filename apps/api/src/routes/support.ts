import { Router, Response } from 'express';
import { prisma } from '../services/tradeSync';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createMemoryUpload, saveUploadedFile } from '../utils/storage';

const router = Router();

// ─── File upload config ────────────────────────────────────────────────────────
const upload = createMemoryUpload(5, [/jpeg|jpg|png|gif|webp|pdf/]);

// ─── GET /api/support/conversations — list user's conversations ────────────────
router.get('/conversations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const status = req.query.status as string | undefined;

    const where: any = { user_id: userId };
    if (status) where.status = status;

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { updated_at: 'desc' },
      include: {
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: { body: true, sender_id: true, created_at: true },
        },
        _count: { select: { messages: true } },
      },
    });

    return res.status(200).json(conversations);
  } catch (err: any) {
    console.error('List conversations error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── POST /api/support/conversations — create new conversation ─────────────────
router.post('/conversations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { subject, category, body } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ error: 'موضوع و پیام الزامی هستند' });
    }

    const conversation = await prisma.conversation.create({
      data: {
        user_id: userId,
        subject,
        category: category || 'GENERAL',
        messages: {
          create: { sender_id: userId, body },
        },
      },
      include: { messages: true },
    });

    return res.status(201).json(conversation);
  } catch (err: any) {
    console.error('Create conversation error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── GET /api/support/conversations/:id — get conversation + messages ──────────
router.get('/conversations/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const conversationId = String(req.params.id);

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, user_id: userId },
      include: {
        messages: { orderBy: { created_at: 'asc' } },
        activities: { orderBy: { created_at: 'asc' } },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'مکالمه یافت نشد' });
    }

    // Mark unread messages as read
    const unreadIds = conversation.messages
      .filter((m: { sender_id: string; read_at: Date | null }) => m.sender_id !== userId && !m.read_at)
      .map((m: { id: string }) => m.id);

    if (unreadIds.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: unreadIds } },
        data: { read_at: new Date() },
      });
    }

    return res.status(200).json(conversation);
  } catch (err: any) {
    console.error('Get conversation error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── POST /api/support/conversations/:id/messages — send message ───────────────
router.post(
  '/conversations/:id/messages',
  authenticate,
  upload.array('attachments', 3),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const conversationId = String(req.params.id);
      const { body } = req.body;

      if (!body && (!req.files || (req.files as Express.Multer.File[]).length === 0)) {
        return res.status(400).json({ error: 'پیام الزامی است' });
      }

      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, user_id: userId },
      });

      if (!conversation) {
        return res.status(404).json({ error: 'مکالمه یافت نشد' });
      }

      if (conversation.status === 'CLOSED') {
        return res.status(400).json({ error: 'مکالمه بسته شده است' });
      }

      const files = (req.files as Express.Multer.File[]) || [];
      const attachments = await Promise.all(files.map((f) => saveUploadedFile(f, 'support')));

      const message = await prisma.message.create({
        data: {
          conversation_id: conversationId,
          sender_id: userId,
          body: body || '',
          attachments,
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updated_at: new Date() },
      });

      // If conversation was RESOLVED, reopen it
      if (conversation.status === 'RESOLVED') {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { status: 'OPEN', resolved_at: null },
        });
      }

      return res.status(201).json(message);
    } catch (err: any) {
      console.error('Send message error:', err);
      return res.status(500).json({ error: 'خطای داخلی سرور' });
    }
  }
);

// ─── PATCH /api/support/conversations/:id/close — close conversation ───────────
router.patch('/conversations/:id/close', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const conversationId = String(req.params.id);

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, user_id: userId },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'مکالمه یافت نشد' });
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'CLOSED', closed_at: new Date() },
    });

    return res.status(200).json(updated);
  } catch (err: any) {
    console.error('Close conversation error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
