import { Response, NextFunction } from 'express';
import { prisma } from '../services/tradeSync';
import { AuthRequest } from './auth';
import { Plan } from '@prisma/client';

export const PLAN_ACCOUNT_LIMITS: Record<Plan, number | null> = {
  FREE: 1,
  STANDARD: 3,
  PRO: null, // unlimited
};

export const FREE_MONTHLY_TRADE_LIMIT = 30;

/**
 * Middleware to enforce account limits based on the user's plan.
 * Uses req.user.plan from JWT — no extra DB query needed.
 */
export const checkAccountLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const plan = req.user?.plan as Plan | undefined;
    if (!userId || !plan) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
    }

    const currentCount = await prisma.account.count({
      where: { user_id: userId },
    });

    const limit = PLAN_ACCOUNT_LIMITS[plan];
    if (limit !== null && currentCount >= limit) {
      return res.status(403).json({
        error: `سقف حساب‌های مجاز برای پلن شما (${limit} حساب) تکمیل شده است. لطفاً پلن خود را ارتقا دهید.`,
        limit,
        currentCount,
      });
    }

    next();
  } catch (err: any) {
    console.error('checkAccountLimit middleware error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور در بررسی محدودیت حساب' });
  }
};

/**
 * Middleware to enforce trade limits (30 trades/month for FREE users).
 * Uses req.user.plan from JWT — no extra DB query needed.
 */
export const checkTradeLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const plan = req.user?.plan as Plan | undefined;
    if (!userId || !plan) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
    }

    // Only FREE plan is restricted
    if (plan === 'FREE') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthlyTradeCount = await prisma.trade.count({
        where: {
          user_id: userId,
          created_at: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      if (monthlyTradeCount >= FREE_MONTHLY_TRADE_LIMIT) {
        return res.status(403).json({
          error: `سقف ثبت معاملات در ماه جاری برای پلن رایگان (${FREE_MONTHLY_TRADE_LIMIT} معامله) تکمیل شده است. لطفاً برای ثبت معاملات بیشتر پلن خود را ارتقا دهید.`,
          limit: FREE_MONTHLY_TRADE_LIMIT,
          currentCount: monthlyTradeCount,
        });
      }
    }

    next();
  } catch (err: any) {
    console.error('checkTradeLimit middleware error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور در بررسی محدودیت معاملات' });
  }
};

/**
 * Middleware to restrict MT4/MT5 file imports.
 * Uses req.user.plan from JWT — no extra DB query needed.
 */
export const checkImportPermission = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const plan = req.user?.plan as Plan | undefined;
    if (!userId || !plan) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
    }

    if (plan === 'FREE') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const importCount = await prisma.importJob.count({
        where: {
          user_id: userId,
          created_at: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      if (importCount >= 1) {
        return res.status(403).json({
          error: 'سقف واردات ۱ فایل در ماه برای پلن رایگان تکمیل شده است. برای واردات نامحدود، لطفا اشتراک خود را ارتقا دهید.',
        });
      }
    }

    next();
  } catch (err: any) {
    console.error('checkImportPermission middleware error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور در بررسی دسترسی واردات فایل' });
  }
};

/**
 * Middleware to restrict MT5 Expert Advisor sync access.
 * Uses req.user.plan from JWT — no extra DB query needed.
 */
export const checkSyncPermission = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const plan = req.user?.plan as Plan | undefined;
    if (!userId || !plan) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
    }

    if (plan === 'FREE') {
      return res.status(403).json({
        error: 'قابلیت همگام‌سازی خودکار با دستیار معاملاتی MT5 (EA) در پلن رایگان در دسترس نیست. لطفا پلن خود را ارتقا دهید.',
      });
    }

    const accountId = req.account?.id || req.body.accountId || req.query.accountId;
    if (accountId) {
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        select: { last_sync_at: true },
      });

      if (account && account.last_sync_at) {
        const lastSync = new Date(account.last_sync_at).getTime();
        const now = Date.now();
        const diffSeconds = (now - lastSync) / 1000;

        if (plan === 'STANDARD' && diffSeconds < 3600) {
          const remainMins = Math.ceil((3600 - diffSeconds) / 60);
          return res.status(429).json({
            error: `همگام‌سازی خودکار در پلن استاندارد به هر ۱ ساعت یک‌بار محدود است. لطفاً ${remainMins} دقیقه دیگر تلاش کنید یا برای همگام‌سازی سریع‌تر (۶۰ ثانیه)، پلن خود را به حرفه‌ای ارتقا دهید.`,
          });
        }

        if (plan === 'PRO' && diffSeconds < 60) {
          const remainSecs = Math.ceil(60 - diffSeconds);
          return res.status(429).json({
            error: `همگام‌سازی خودکار به هر ۶۰ ثانیه یک‌بار محدود است. لطفاً ${remainSecs} ثانیه دیگر تلاش کنید.`,
          });
        }
      }
    }

    next();
  } catch (err: any) {
    console.error('checkSyncPermission middleware error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور در بررسی دسترسی همگام‌سازی' });
  }
};

/**
 * Middleware to restrict Crypto Exchange (CCXT) sync access.
 * Uses req.user.plan from JWT — no extra DB query needed.
 */
export const checkCryptoPermission = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const plan = req.user?.plan as Plan | undefined;
    if (!plan) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
    }

    if (plan === 'FREE') {
      return res.status(403).json({
        error: 'قابلیت اتصال به صرافی‌های کریپتو در پلن رایگان در دسترس نیست. لطفا پلن خود را ارتقا دهید.',
      });
    }

    next();
  } catch (err: any) {
    console.error('checkCryptoPermission middleware error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور در بررسی دسترسی اتصال به صرافی' });
  }
};
