import { Router, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../services/tradeSync';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Helper to check if an account belongs to the authenticated user
const verifyAccountOwnership = async (accountId: string, userId: string) => {
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      user_id: userId,
    },
  });
  return !!account;
};

// ─── GET /api/accounts/:accountId/tokens ──────────────────────────────────────
router.get('/accounts/:accountId/tokens', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const accountId = req.params.accountId as string;
    const userId = req.user!.userId;

    const isOwner = await verifyAccountOwnership(accountId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'شما به این حساب دسترسی ندارید' });
    }

    const tokens = await prisma.accountToken.findMany({
      where: { account_id: accountId },
      orderBy: { created_at: 'desc' },
    });

    // Mask the token string before sending to client
    const safeTokens = tokens.map(t => ({
      id: t.id,
      name: t.name,
      created_at: t.created_at,
      token_preview: t.token.substring(0, 7) + '...' + t.token.substring(t.token.length - 4),
    }));

    return res.json(safeTokens);
  } catch (err: any) {
    console.error('List tokens error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── POST /api/accounts/:accountId/tokens ─────────────────────────────────────
router.post('/accounts/:accountId/tokens', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const accountId = req.params.accountId as string;
    const { name } = req.body;
    const userId = req.user!.userId;

    const isOwner = await verifyAccountOwnership(accountId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'شما به این حساب دسترسی ندارید' });
    }

    // Generate a secure API token: tj_ + 32 hex chars (16 bytes)
    const rawToken = 'tj_' + crypto.randomBytes(16).toString('hex');

    const accountToken = await prisma.accountToken.create({
      data: {
        account_id: accountId,
        token: rawToken,
        name: name || 'MT5 EA Token',
      },
    });

    // Return the unmasked token (this is the only time the user will see it)
    return res.status(201).json({
      id: accountToken.id,
      name: accountToken.name,
      created_at: accountToken.created_at,
      token: rawToken,
    });
  } catch (err: any) {
    console.error('Create token error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── DELETE /api/accounts/:accountId/tokens/:id ───────────────────────────────
router.delete('/accounts/:accountId/tokens/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const accountId = req.params.accountId as string;
    const id = req.params.id as string;
    const userId = req.user!.userId;

    const isOwner = await verifyAccountOwnership(accountId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'شما به این حساب دسترسی ندارید' });
    }

    const tokenRecord = await prisma.accountToken.findFirst({
      where: {
        id,
        account_id: accountId,
      },
    });

    if (!tokenRecord) {
      return res.status(404).json({ error: 'توکن یافت نشد' });
    }

    await prisma.accountToken.delete({
      where: { id },
    });

    return res.json({ success: true, message: 'توکن با موفقیت حذف شد' });
  } catch (err: any) {
    console.error('Delete token error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
