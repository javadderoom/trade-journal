import { Router, Response } from 'express';
import { prisma } from '../services/tradeSync';
import { authenticate, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { DisplayCurrency, Plan } from '@prisma/client';
import { checkAccountLimit } from '../middleware/checkPlanLimits';

const router = Router();

// ─── Avatar upload setup ──────────────────────────────────────────────────────
const avatarDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const mimetype = allowed.test(file.mimetype);
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only JPG/PNG images are allowed'));
  },
});

// ─── Plan limits ──────────────────────────────────────────────────────────────
const PLAN_ACCOUNT_LIMITS: Record<Plan, number | null> = {
  FREE: 1,
  STANDARD: 3,
  PRO: null, // unlimited
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONSOLIDATED ENDPOINT — single round-trip for settings page
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_PRICES = {
  FREE: { monthly: 0, annual: 0 },
  STANDARD: { monthly: 249000, annual: 2390000 },
  PRO: { monthly: 499000, annual: 4790000 },
};

const DEFAULT_CARD_DETAILS = {
  cardNumber: '۶۰۳۷-۹۹۷۵-۹۴۴۴-۴۱۲۸',
  bankName: 'ملی ایران',
  ownerName: 'جواد شیخ اعظمی',
};

const DEFAULT_CRYPTO_DETAILS = {
  usdtAddress: '',
  trxAddress: '',
  standard: { monthlyUsd: 5.0, annualUsd: 45.0 },
  pro: { monthlyUsd: 10.0, annualUsd: 90.0 },
};

/**
 * GET /api/settings/all
 * Returns profile, accounts, subscription, prices, card-details, crypto-details, and sessions
 * in a single round-trip using parallel queries.
 */
router.get('/all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const currentToken = req.cookies?.refreshToken;

    const [
      user,
      rawAccounts,
      subscription,
      pendingReceipt,
      pricesSetting,
      cardSetting,
      cryptoSetting,
      refreshTokens,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          plan: true,
          display_currency: true,
          avatar_url: true,
          created_at: true,
        },
      }),
      prisma.account.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        include: {
          _count: { select: { trades: true } },
          trades: {
            orderBy: { created_at: 'desc' },
            take: 1,
            select: { created_at: true },
          },
        },
      }),
      prisma.subscription.findFirst({
        where: { user_id: userId, status: 'ACTIVE' },
        orderBy: { created_at: 'desc' },
      }),
      prisma.manualReceipt.findFirst({
        where: { user_id: userId, status: { in: ['PENDING', 'REJECTED'] } },
        orderBy: { created_at: 'desc' },
      }),
      prisma.systemSetting.findUnique({ where: { key: 'PRICING_PLANS' } }),
      prisma.systemSetting.findUnique({ where: { key: 'CARD_DETAILS' } }),
      prisma.systemSetting.findUnique({ where: { key: 'CRYPTO_DETAILS' } }),
      prisma.refreshToken.findMany({
        where: { user_id: userId, expires_at: { gt: new Date() } },
        orderBy: { last_used_at: 'desc' },
      }),
    ]);

    if (!user) return res.status(404).json({ error: 'کاربر یافت نشد' });

    const accounts = rawAccounts.map((acc) => ({
      id: acc.id,
      broker_name: acc.broker_name,
      account_number: acc.account_number,
      currency: acc.currency,
      created_at: acc.created_at,
      trade_count: acc._count.trades,
      last_import: acc.trades[0]?.created_at || null,
    }));

    const sessions = refreshTokens.map((t) => ({
      id: t.id,
      user_agent: t.user_agent || 'نامشخص',
      created_at: t.created_at,
      last_used_at: t.last_used_at,
      is_current: t.token === (currentToken as string),
    }));

    return res.json({
      user,
      accounts,
      subscription: {
        plan: user.plan,
        subscription: subscription
          ? {
              start_date: subscription.start_date,
              end_date: subscription.end_date,
              status: subscription.status,
            }
          : null,
        pendingReceipt: pendingReceipt
          ? {
              id: pendingReceipt.id,
              plan: pendingReceipt.plan,
              period: pendingReceipt.period,
              amount: pendingReceipt.amount,
              status: pendingReceipt.status,
              rejectionReason: pendingReceipt.rejectionReason,
              created_at: pendingReceipt.created_at,
            }
          : null,
      },
      prices: pricesSetting?.value || DEFAULT_PRICES,
      cardDetails: cardSetting?.value || DEFAULT_CARD_DETAILS,
      cryptoDetails: cryptoSetting?.value || DEFAULT_CRYPTO_DETAILS,
      sessions,
    });
  } catch (err: any) {
    console.error('Settings all fetch error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/settings/profile
 */
router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        plan: true,
        display_currency: true,
        avatar_url: true,
        created_at: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'کاربر یافت نشد' });
    return res.json({ user });
  } catch (err: any) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * PUT /api/settings/profile
 */
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, displayCurrency } = req.body;
    const userId = req.user!.userId;

    // Validate display currency if provided
    let currencyUpdate: DisplayCurrency | undefined;
    if (displayCurrency !== undefined) {
      if (!['USD', 'TOMAN', 'BOTH'].includes(displayCurrency)) {
        return res.status(400).json({ error: 'ارز نمایش معتبر نیست' });
      }
      currencyUpdate = displayCurrency as DisplayCurrency;
    }

    // Check phone uniqueness if changing
    if (phone !== undefined) {
      const existing = await prisma.user.findFirst({
        where: { phone, NOT: { id: userId } },
      });
      if (existing) {
        return res.status(409).json({ error: 'این شماره موبایل قبلاً ثبت شده است' });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(currencyUpdate ? { display_currency: currencyUpdate } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        plan: true,
        display_currency: true,
        avatar_url: true,
        created_at: true,
      },
    });

    return res.json({ user: updated, message: 'پروفایل با موفقیت ذخیره شد' });
  } catch (err: any) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * POST /api/settings/avatar
 */
router.post('/avatar', authenticate, avatarUpload.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'فایلی آپلود نشده است' });
    }

    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Delete old avatar file if exists
    if (user?.avatar_url) {
      const oldFilename = user.avatar_url.replace('/uploads/avatars/', '');
      const oldPath = path.join(avatarDir, oldFilename);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch {}
      }
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await prisma.user.update({
      where: { id: userId },
      data: { avatar_url: avatarUrl },
    });

    return res.json({ avatar_url: avatarUrl, message: 'عکس پروفایل با موفقیت تغییر کرد' });
  } catch (err: any) {
    console.error('Avatar upload error:', err);
    return res.status(500).json({ error: 'خطا در بارگذاری تصویر' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// BROKER ACCOUNTS ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/settings/accounts
 * Returns accounts with trade count + last import date
 */
router.get('/accounts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const accounts = await prisma.account.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        _count: { select: { trades: true } },
        trades: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: { created_at: true },
        },
      },
    });

    const result = accounts.map((acc) => ({
      id: acc.id,
      broker_name: acc.broker_name,
      account_number: acc.account_number,
      currency: acc.currency,
      created_at: acc.created_at,
      trade_count: acc._count.trades,
      last_import: acc.trades[0]?.created_at || null,
    }));

    return res.json({ accounts: result });
  } catch (err: any) {
    console.error('Accounts list error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * POST /api/settings/accounts
 */
router.post('/accounts', authenticate, checkAccountLimit, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { broker_name, account_number, currency, description } = req.body;

    if (!broker_name) {
      return res.status(400).json({ error: 'نام بروکر الزامی است' });
    }

    const account = await prisma.account.create({
      data: {
        user_id: userId,
        broker_name,
        account_number: account_number || null,
        currency: currency || 'USD',
      },
    });

    return res.status(201).json({ account });
  } catch (err: any) {
    console.error('Create account error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * PUT /api/settings/accounts/:id
 */
router.put('/accounts/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const accountId = req.params.id as string;
    const userId = req.user!.userId;
    const { broker_name, account_number, currency } = req.body;

    const account = await prisma.account.findFirst({
      where: { id: accountId, user_id: userId },
    });
    if (!account) {
      return res.status(404).json({ error: 'حساب یافت نشد' });
    }

    const updated = await prisma.account.update({
      where: { id: accountId },
      data: {
        ...(broker_name !== undefined ? { broker_name } : {}),
        ...(account_number !== undefined ? { account_number } : {}),
        ...(currency !== undefined ? { currency } : {}),
      },
    });

    return res.json({ account: updated });
  } catch (err: any) {
    console.error('Update account error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * DELETE /api/settings/accounts/:id
 * Deletes account and all associated trades
 */
router.delete('/accounts/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const accountId = req.params.id as string;
    const userId = req.user!.userId;

    const account = await prisma.account.findFirst({
      where: { id: accountId, user_id: userId },
      include: { _count: { select: { trades: true } } },
    });
    if (!account) {
      return res.status(404).json({ error: 'حساب یافت نشد' });
    }

    const tradeCount = account._count.trades;

    // Delete all trades, then the account
    await prisma.trade.deleteMany({ where: { account_id: accountId } });
    await prisma.accountToken.deleteMany({ where: { account_id: accountId } });
    await prisma.account.delete({ where: { id: accountId } });

    return res.json({
      success: true,
      message: `حساب و ${tradeCount} معامله مرتبط حذف شد`,
    });
  } catch (err: any) {
    console.error('Delete account error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION ENDPOINTS (mock for v1)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/settings/subscription
 */
router.get('/subscription', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    // Check for active subscription
    const subscription = await prisma.subscription.findFirst({
      where: { user_id: userId, status: 'ACTIVE' },
      orderBy: { created_at: 'desc' },
    });

    const pendingReceipt = await prisma.manualReceipt.findFirst({
      where: { user_id: userId, status: { in: ['PENDING', 'REJECTED'] } },
      orderBy: { created_at: 'desc' },
    });

    return res.json({
      plan: user!.plan,
      subscription: subscription
        ? {
            start_date: subscription.start_date,
            end_date: subscription.end_date,
            status: subscription.status,
          }
        : null,
      pendingReceipt: pendingReceipt
        ? {
            id: pendingReceipt.id,
            plan: pendingReceipt.plan,
            period: pendingReceipt.period,
            amount: pendingReceipt.amount,
            status: pendingReceipt.status,
            rejectionReason: pendingReceipt.rejectionReason,
            created_at: pendingReceipt.created_at,
          }
        : null,
      // Plan pricing info for display
      pricing: {
        FREE: { monthly: 0, annual: 0 },
        STANDARD: { monthly: 249000, annual: 2390000 },
        PRO: { monthly: 499000, annual: 4790000 },
      },
    });
  } catch (err: any) {
    console.error('Subscription fetch error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * GET /api/settings/subscription/history
 */
router.get('/subscription/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const subscriptions = await prisma.subscription.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 6,
    });

    const history = subscriptions.map((s) => ({
      id: s.id,
      date: s.created_at,
      amount: s.plan === 'PRO' ? 350000 : s.plan === 'STANDARD' ? 150000 : 0,
      plan: s.plan,
      status: s.status,
    }));

    return res.json({ history });
  } catch (err: any) {
    console.error('Subscription history error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PUT /api/settings/password
 * Change password — invalidate all other refresh tokens
 */
router.put('/password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'رمز فعلی و جدید الزامی است' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'رمز جدید باید حداقل ۶ کاراکتر باشد' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'کاربر یافت نشد' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'رمز فعلی اشتباه است' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: newHash },
    });

    // Invalidate all refresh tokens except the current session
    const currentToken = req.cookies?.refreshToken;
    if (currentToken) {
      await prisma.refreshToken.deleteMany({
        where: {
          user_id: userId,
          NOT: { token: currentToken },
        },
      });
    } else {
      await prisma.refreshToken.deleteMany({ where: { user_id: userId } });
    }

    return res.json({ message: 'رمز عبور با موفقیت تغییر کرد' });
  } catch (err: any) {
    console.error('Password change error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * GET /api/settings/sessions
 * List active refresh tokens
 */
router.get('/sessions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const currentToken = req.cookies?.refreshToken;

    const tokens = await prisma.refreshToken.findMany({
      where: {
        user_id: userId,
        expires_at: { gt: new Date() },
      },
      orderBy: { last_used_at: 'desc' },
    });

    const sessions = tokens.map((t) => ({
      id: t.id,
      user_agent: t.user_agent || 'نامشخص',
      created_at: t.created_at,
      last_used_at: t.last_used_at,
      is_current: t.token === (currentToken as string),
    }));

    return res.json({ sessions });
  } catch (err: any) {
    console.error('Sessions list error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * DELETE /api/settings/sessions/:id
 * Revoke a specific session
 */
router.delete('/sessions/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const tokenId = req.params.id as string;
    const userId = req.user!.userId;

    const token = await prisma.refreshToken.findFirst({
      where: { id: tokenId, user_id: userId },
    });
    if (!token) {
      return res.status(404).json({ error: 'نشست یافت نشد' });
    }

    const currentToken = req.cookies?.refreshToken;
    if (token.token === (currentToken as string)) {
      return res.status(400).json({ error: 'نمی‌توانید نشست فعلی را حذف کنید' });
    }

    await prisma.refreshToken.delete({ where: { id: tokenId } });
    return res.json({ message: 'نشست با موفقیت حذف شد' });
  } catch (err: any) {
    console.error('Session revoke error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * DELETE /api/settings/sessions
 * Revoke all sessions except current
 */
router.delete('/sessions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const currentToken = req.cookies?.refreshToken;

    const result = await prisma.refreshToken.deleteMany({
      where: {
        user_id: userId,
        ...(currentToken ? { NOT: { token: currentToken } } : {}),
      },
    });

    return res.json({
      message: `${result.count} نشست دیگر بسته شد`,
      revoked_count: result.count,
    });
  } catch (err: any) {
    console.error('Revoke all sessions error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * DELETE /api/settings/account
 * Soft delete user account
 */
router.delete('/account', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { confirmEmail } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'کاربر یافت نشد' });

    if (confirmEmail !== user.email) {
      return res.status(400).json({ error: 'تایید ایمیل الزامی است' });
    }

    // Soft delete
    await prisma.user.update({
      where: { id: userId },
      data: { deleted_at: new Date() },
    });

    // Invalidate all sessions
    await prisma.refreshToken.deleteMany({ where: { user_id: userId } });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.tradekav.ir' : undefined,
      path: '/',
    });

    return res.json({ message: 'حساب کاربری برای حذف علامت‌گذاری شد' });
  } catch (err: any) {
    console.error('Account deletion error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * GET /api/settings/contact
 * Public route to retrieve contact information
 */
router.get('/contact', async (req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'CONTACT_INFO' },
    });

    if (setting && setting.value) {
      return res.status(200).json(setting.value);
    }

    // Default fallback
    return res.status(200).json({
      email: 'support@tradekav.ir',
      mobile: '09123456789',
      landline: '02188888888',
      address: 'تهران، میدان ونک، خیابان ولیعصر، پلاک ۱',
    });
  } catch (err: any) {
    console.error('Fetch contact settings error:', err);
    return res.status(500).json({ error: 'خطا در دریافت اطلاعات تماس' });
  }
});

/**
 * GET /api/settings/card-details
 * Retrieve manual card-to-card payment credentials
 */
router.get('/card-details', async (req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'CARD_DETAILS' },
    });

    if (setting && setting.value) {
      return res.status(200).json(setting.value);
    }

    // Default fallback
    return res.status(200).json({
      cardNumber: '۶۰۳۷-۹۹۷۵-۹۴۴۴-۴۱۲۸',
      bankName: 'ملی ایران',
      ownerName: 'جواد شیخ اعظمی',
    });
  } catch (err: any) {
    console.error('Fetch card details error:', err);
    return res.status(500).json({ error: 'خطا در دریافت اطلاعات کارت بانکی' });
  }
});

/**
 * GET /api/settings/exchange-rate
 * Retrieve custom USD -> Toman exchange rate
 */
router.get('/exchange-rate', async (req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'EXCHANGE_RATE' },
    });

    if (setting && setting.value) {
      return res.status(200).json(setting.value);
    }

    return res.status(200).json({ rate: null });
  } catch (err: any) {
    console.error('Fetch exchange rate error:', err);
    return res.status(500).json({ error: 'خطا در دریافت نرخ ارز' });
  }
});

/**
 * GET /api/settings/crypto-details
 * Retrieve manual crypto deposit wallet addresses & plans pricing
 */
router.get('/crypto-details', async (req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'CRYPTO_DETAILS' },
    });

    if (setting && setting.value) {
      return res.status(200).json(setting.value);
    }

    // Default fallback
    return res.status(200).json({
      usdtAddress: 'TYTRX20USDTADDRESSxxxxxxxxxxxxxx',
      trxAddress: 'TYTRXNATIVEADDRESSxxxxxxxxxxxxx',
      standard: {
        monthlyUsd: 5.0,
        annualUsd: 45.0
      },
      pro: {
        monthlyUsd: 10.0,
        annualUsd: 90.0
      }
    });
  } catch (err: any) {
    console.error('Fetch crypto details error:', err);
    return res.status(500).json({ error: 'خطا در دریافت اطلاعات پرداخت رمزارز' });
  }
});

export default router;