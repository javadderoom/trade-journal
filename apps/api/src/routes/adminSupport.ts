import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../services/tradeSync';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireAdmin);

// ─── File upload config ────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/support'),
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype.split('/')[1]);
    if (ext || mime) return cb(null, true);
    cb(new Error('File type not allowed'));
  },
});

// ─── GET /api/admin/support/stats — dashboard stats ───────────────────────────
router.get('/stats', async (_req: AuthRequest, res: Response) => {
  try {
    const [open, waiting, resolved, closed, total] = await Promise.all([
      prisma.conversation.count({ where: { status: 'OPEN' } }),
      prisma.conversation.count({ where: { status: 'WAITING' } }),
      prisma.conversation.count({ where: { status: 'RESOLVED' } }),
      prisma.conversation.count({ where: { status: 'CLOSED' } }),
      prisma.conversation.count(),
    ]);

    return res.status(200).json({ open, waiting, resolved, closed, total });
  } catch (err: any) {
    console.error('Support stats error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── GET /api/admin/support/conversations — list all conversations ─────────────
router.get('/conversations', async (req: AuthRequest, res: Response) => {
  try {
    const { status, assigned_admin_id, category, search } = req.query as Record<string, string>;

    const where: any = {};
    if (status) where.status = status;
    if (assigned_admin_id) where.assigned_admin_id = assigned_admin_id;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { updated_at: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, plan: true } },
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
    console.error('Admin list conversations error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── GET /api/admin/support/conversations/:id — get conversation detail ────────
router.get('/conversations/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, plan: true, phone: true } },
        messages: { orderBy: { created_at: 'asc' } },
        activities: { orderBy: { created_at: 'asc' } },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'مکالمه یافت نشد' });
    }

    // Mark admin-unread messages as read
    const adminId = req.user!.userId;
    const unreadIds = conversation.messages
      .filter((m) => m.sender_id !== adminId && !m.read_at)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: unreadIds } },
        data: { read_at: new Date() },
      });
    }

    return res.status(200).json(conversation);
  } catch (err: any) {
    console.error('Admin get conversation error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── POST /api/admin/support/conversations/:id/messages — admin reply ──────────
router.post(
  '/conversations/:id/messages',
  upload.array('attachments', 3),
  async (req: AuthRequest, res: Response) => {
    try {
      const adminId = req.user!.userId;
      const { id } = req.params;
      const { body } = req.body;

      if (!body && (!req.files || (req.files as Express.Multer.File[]).length === 0)) {
        return res.status(400).json({ error: 'پیام الزامی است' });
      }

      const conversation = await prisma.conversation.findUnique({ where: { id } });
      if (!conversation) {
        return res.status(404).json({ error: 'مکالمه یافت نشد' });
      }

      const files = (req.files as Express.Multer.File[]) || [];
      const attachments = files.map((f) => `/uploads/support/${f.filename}`);

      const message = await prisma.message.create({
        data: {
          conversation_id: id,
          sender_id: adminId,
          body: body || '',
          attachments,
        },
      });

      // Update conversation + set status to WAITING if it was OPEN
      await prisma.conversation.update({
        where: { id },
        data: {
          updated_at: new Date(),
          ...(conversation.status === 'OPEN' ? { status: 'WAITING' } : {}),
        },
      });

      return res.status(201).json(message);
    } catch (err: any) {
      console.error('Admin reply error:', err);
      return res.status(500).json({ error: 'خطای داخلی سرور' });
    }
  }
);

// ─── PATCH /api/admin/support/conversations/:id/assign ─────────────────────────
router.patch('/conversations/:id/assign', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { admin_id } = req.body;
    const actorId = req.user!.userId;

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) {
      return res.status(404).json({ error: 'مکالمه یافت نشد' });
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { assigned_admin_id: admin_id || null },
    });

    await prisma.conversationActivity.create({
      data: {
        conversation_id: id,
        actor_id: actorId,
        action: 'ASSIGNED',
        details: { admin_id: admin_id || null },
      },
    });

    return res.status(200).json(updated);
  } catch (err: any) {
    console.error('Assign conversation error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── PATCH /api/admin/support/conversations/:id/status ─────────────────────────
router.patch('/conversations/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const actorId = req.user!.userId;

    if (!['OPEN', 'WAITING', 'RESOLVED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ error: 'وضعیت نامعتبر' });
    }

    const data: any = { status };
    if (status === 'RESOLVED') data.resolved_at = new Date();
    if (status === 'CLOSED') data.closed_at = new Date();

    const updated = await prisma.conversation.update({ where: { id }, data });

    await prisma.conversationActivity.create({
      data: {
        conversation_id: id,
        actor_id: actorId,
        action: 'STATUS_CHANGE',
        details: { status },
      },
    });

    return res.status(200).json(updated);
  } catch (err: any) {
    console.error('Change status error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── PATCH /api/admin/support/conversations/:id/priority ───────────────────────
router.patch('/conversations/:id/priority', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    const actorId = req.user!.userId;

    if (!['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priority)) {
      return res.status(400).json({ error: 'اولویت نامعتبر' });
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { priority },
    });

    await prisma.conversationActivity.create({
      data: {
        conversation_id: id,
        actor_id: actorId,
        action: 'PRIORITY_CHANGE',
        details: { priority },
      },
    });

    return res.status(200).json(updated);
  } catch (err: any) {
    console.error('Change priority error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
