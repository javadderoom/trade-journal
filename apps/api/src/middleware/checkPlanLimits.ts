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
 */
export const checkAccountLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'کاربر یافت نشد' });
    }

    const currentCount = await prisma.account.count({
      where: { user_id: userId },
    });

    const limit = PLAN_ACCOUNT_LIMITS[user.plan];
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
 * Middleware to enforce trade limits (50 trades/month for FREE users).
 */
export const checkTradeLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'کاربر یافت نشد' });
    }

    // Only FREE plan is restricted
    if (user.plan === 'FREE') {
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
 */
export const checkImportPermission = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'کاربر یافت نشد' });
    }

    if (user.plan === 'FREE') {
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
 */
export const checkSyncPermission = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده است' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'کاربر یافت نشد' });
    }

    if (user.plan === 'FREE') {
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

        if (user.plan === 'STANDARD' && diffSeconds < 3600) {
          const remainMins = Math.ceil((3600 - diffSeconds) / 60);
          return res.status(429).json({
            error: `همگام‌سازی خودکار در پلن استاندارد به هر ۱ ساعت یک‌بار محدود است. لطفاً ${remainMins} دقیقه دیگر تلاش کنید یا برای همگام‌سازی سریع‌تر (۶۰ ثانیه)، پلن خود را به حرفه‌ای ارتقا دهید.`,
          });
        }

        if (user.plan === 'PRO' && diffSeconds < 60) {
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
