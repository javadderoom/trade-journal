import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/tokens';
import { prisma } from '../services/tradeSync';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    plan: string;
    role: string;
  };
  account?: {
    id: string;
    user_id: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'توکن احراز هویت یافت نشد' });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'توکن نامعتبر یا منقضی شده است' });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'دسترسی غیرمجاز. فقط مدیران مجاز هستند.' });
  }
  next();
};

/**
 * Middleware to authenticate requests from MT5 EA using the account API token.
 * Token can be passed in:
 *   1. Authorization header: Bearer <token>
 *   2. Custom header: x-api-token
 */
export const authenticateAccountToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  const customHeader = req.headers['x-api-token'] as string;
  if (customHeader) {
    token = customHeader;
  }

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'توکن دسترسی حساب معاملاتی یافت نشد' });
  }

  try {
    const accountToken = await prisma.accountToken.findUnique({
      where: { token },
      include: {
        account: true,
      },
    });

    if (!accountToken) {
      return res.status(401).json({ error: 'توکن دسترسی نامعتبر است' });
    }

    req.account = {
      id: accountToken.account_id,
      user_id: accountToken.account.user_id,
    };
    
    // Look up the actual user's plan and email
    const user = await prisma.user.findUnique({
      where: { id: accountToken.account.user_id },
      select: { email: true, plan: true, role: true },
    });

    req.user = {
      userId: accountToken.account.user_id,
      email: user?.email || '',
      plan: user?.plan || 'FREE',
      role: user?.role || 'USER',
    };

    next();
  } catch (err: any) {
    console.error('Account token auth error:', err);
    return res.status(500).json({ error: 'خطای سرور در احراز هویت توکن' });
  }
};
