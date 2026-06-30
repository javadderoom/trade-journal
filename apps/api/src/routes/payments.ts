import { Router, Response } from 'express';
import { prisma } from '../services/tradeSync';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requestPayment, verifyPayment } from '../services/zarinpal';
import { requestPaypingPayment, verifyPaypingPayment } from '../services/payping';
import { Plan, SubscriptionStatus } from '@prisma/client';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const receiptDir = path.join(__dirname, '../../uploads/receipts');
if (!fs.existsSync(receiptDir)) {
  fs.mkdirSync(receiptDir, { recursive: true });
}

const receiptStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, receiptDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const receiptUpload = multer({
  storage: receiptStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const mimetype = allowed.test(file.mimetype);
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only JPG/PNG images are allowed'));
  },
});

const router = Router();

// Price configuration in Tomans (Fallback defaults)
export const DEFAULT_PRICES = {
  STANDARD: {
    monthly: 249000,
    annual: 2390000,   // discounted (20%)
  },
  PRO: {
    monthly: 499000,
    annual: 4790000,   // discounted (20%)
  },
};

export async function getPlanPrices() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'PRICING_PLANS' },
    });
    if (setting && setting.value) {
      return setting.value as typeof DEFAULT_PRICES;
    }
  } catch (err) {
    console.error('Error fetching dynamic prices:', err);
  }
  return DEFAULT_PRICES;
}

/**
 * GET /api/payments/prices
 * Retrieve standard and pro subscription pricing packages
 */
router.get('/prices', async (req, res) => {
  const prices = await getPlanPrices();
  return res.status(200).json(prices);
});

/**
 * POST /api/payments/discount/validate
 * Check if a discount code is valid for the authenticated user and return details
 */
router.post('/discount/validate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { code, plan, period } = req.body;

    if (!code || !plan || !period) {
      return res.status(400).json({ error: 'اطلاعات ارسالی کامل نیست' });
    }

    if (!['STANDARD', 'PRO'].includes(plan)) {
      return res.status(400).json({ error: 'پلن انتخابی معتبر نیست' });
    }

    if (!['monthly', 'annual'].includes(period)) {
      return res.status(400).json({ error: 'دوره زمانی معتبر نیست' });
    }

    const codeClean = String(code).trim().toUpperCase();
    const codeRecord = await prisma.discountCode.findUnique({
      where: { code: codeClean },
      include: { userDiscounts: { where: { user_id: userId } } },
    });

    if (!codeRecord) {
      return res.status(400).json({ error: 'کد تخفیف معتبر نیست' });
    }

    const hasUsed = codeRecord.userDiscounts.length > 0;
    const isExpired = new Date(codeRecord.expireDate).getTime() < Date.now();
    const isLimitReached = codeRecord.usedCount >= codeRecord.maxUses;

    if (hasUsed && !codeRecord.isAccountBound) {
      return res.status(400).json({ error: 'شما قبلاً از این کد تخفیف استفاده کرده‌اید' });
    }

    if (!hasUsed) {
      if (isExpired) {
        return res.status(400).json({ error: 'کد تخفیف منقضی شده است' });
      }
      if (isLimitReached) {
        return res.status(400).json({ error: 'ظرفیت استفاده از این کد تخفیف به پایان رسیده است' });
      }
    }

    const prices = await getPlanPrices();
    const originalPrice = prices[plan as Exclude<Plan, 'FREE'>][period as 'monthly' | 'annual'];
    const discountedPrice = Math.round(originalPrice * (1 - codeRecord.discountPercent / 100));

    return res.status(200).json({
      valid: true,
      discountPercent: codeRecord.discountPercent,
      originalPrice,
      discountedPrice,
    });
  } catch (err: any) {
    console.error('Discount validate error:', err);
    return res.status(500).json({ error: 'خطا در بررسی کد تخفیف' });
  }
});

/**
 * POST /api/payments/checkout
 * Request ZarinPal payment URL
 */
router.post('/checkout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { plan, period, discountCode } = req.body;

    if (!plan || !['STANDARD', 'PRO'].includes(plan)) {
      return res.status(400).json({ error: 'پلن انتخابی معتبر نیست' });
    }

    if (!period || !['monthly', 'annual'].includes(period)) {
      return res.status(400).json({ error: 'دوره زمانی معتبر نیست' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'کاربر یافت نشد' });
    }

    // Validate discount code if provided
    let discountPercent = 0;
    if (discountCode) {
      const codeClean = String(discountCode).trim().toUpperCase();
      const codeRecord = await prisma.discountCode.findUnique({
        where: { code: codeClean },
        include: { userDiscounts: { where: { user_id: userId } } },
      });

      if (!codeRecord) {
        return res.status(400).json({ error: 'کد تخفیف معتبر نیست' });
      }

      const hasUsed = codeRecord.userDiscounts.length > 0;
      const isExpired = new Date(codeRecord.expireDate).getTime() < Date.now();
      const isLimitReached = codeRecord.usedCount >= codeRecord.maxUses;

      if (hasUsed) {
        if (!codeRecord.isAccountBound) {
          return res.status(400).json({ error: 'شما قبلاً از این کد تخفیف استفاده کرده‌اید' });
        }
        discountPercent = codeRecord.discountPercent;
      } else {
        if (isExpired) {
          return res.status(400).json({ error: 'کد تخفیف منقضی شده است' });
        }
        if (isLimitReached) {
          return res.status(400).json({ error: 'ظرفیت استفاده از این کد تخفیف به پایان رسیده است' });
        }
        discountPercent = codeRecord.discountPercent;
      }
    }

    const prices = await getPlanPrices();
    let price = prices[plan as Exclude<Plan, 'FREE'>][period as 'monthly' | 'annual'];
    if (discountPercent > 0) {
      price = Math.round(price * (1 - discountPercent / 100));
    }

    const description = `خرید پلن ${plan === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'} - دوره ${period === 'monthly' ? 'ماهانه' : 'سالانه'}`;

    // Front-end callback url, e.g. http://localhost:3001/payments/callback
    const frontendBase = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3001';
    const callbackUrl = `${frontendBase}/payments/callback?plan=${plan}&period=${period}&amount=${price}${discountCode ? `&discountCode=${discountCode}` : ''}`;

    const { authority, redirectUrl } = await requestPayment(
      price,
      description,
      callbackUrl,
      { email: user.email, phone: user.phone || undefined }
    );

    return res.status(200).json({ authority, redirectUrl });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: err.message || 'خطا در برقراری ارتباط با درگاه پرداخت' });
  }
});

/**
 * POST /api/payments/verify
 * Callback verification from ZarinPal
 */
router.post('/verify', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { authority, status, amount, plan, period, discountCode } = req.body;

    if (!authority || !status || !amount || !plan || !period) {
      return res.status(400).json({ error: 'اطلاعات تایید پرداخت نامعتبر است' });
    }

    if (status !== 'OK') {
      return res.status(400).json({ error: 'پرداخت توسط کاربر لغو شده یا ناموفق بوده است' });
    }

    const verification = await verifyPayment(Number(amount), authority);

    if (!verification.success) {
      return res.status(400).json({ error: verification.message });
    }

    // Determine end date based on billing period
    const startDate = new Date();
    const endDate = new Date();
    if (period === 'monthly') {
      endDate.setDate(startDate.getDate() + 30);
    } else if (period === 'annual') {
      endDate.setDate(startDate.getDate() + 365);
    }

    // Start a Prisma transaction to update both user plan, create subscription, and record discount
    const result = await prisma.$transaction(async (tx) => {
      // 1. Expire any existing active subscriptions for this user
      await tx.subscription.updateMany({
        where: { user_id: userId, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      });

      // 2. Create the new subscription
      const subscription = await tx.subscription.create({
        data: {
          user_id: userId,
          plan: plan as Plan,
          status: 'ACTIVE',
          start_date: startDate,
          end_date: endDate,
        },
      });

      // 3. Update the user plan
      await tx.user.update({
        where: { id: userId },
        data: { plan: plan as Plan },
      });

      // 4. Record discount code usage if applicable
      if (discountCode) {
        const codeClean = String(discountCode).trim().toUpperCase();
        const codeRecord = await tx.discountCode.findUnique({
          where: { code: codeClean },
        });

        if (codeRecord) {
          // Increment usedCount
          await tx.discountCode.update({
            where: { id: codeRecord.id },
            data: { usedCount: { increment: 1 } },
          });

          // Create UserDiscount entry if not already exists (upsert)
          await tx.userDiscount.upsert({
            where: {
              user_id_discount_id: {
                user_id: userId,
                discount_id: codeRecord.id,
              },
            },
            create: {
              user_id: userId,
              discount_id: codeRecord.id,
            },
            update: {},
          });
        }
      }

      return subscription;
    });

    return res.status(200).json({
      success: true,
      refId: verification.refId,
      message: 'پرداخت با موفقیت انجام شد و پلن شما فعال گردید.',
      subscription: {
        plan: result.plan,
        end_date: result.end_date,
      },
    });
  } catch (err: any) {
    console.error('Verify error:', err);
    return res.status(500).json({ error: err.message || 'خطا در تایید تراکنش پرداخت' });
  }
});

/**
 * POST /api/payments/receipt
 * Submit manual card-to-card payment receipt screenshot
 */
router.post(
  '/receipt',
  authenticate,
  receiptUpload.single('receipt'),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { plan, period, discountCode } = req.body;

      if (!plan || !['STANDARD', 'PRO'].includes(plan)) {
        return res.status(400).json({ error: 'پلن انتخابی معتبر نیست' });
      }

      if (!period || !['monthly', 'annual'].includes(period)) {
        return res.status(400).json({ error: 'دوره زمانی معتبر نیست' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'فایل فیش پرداخت ارسال نشده است' });
      }

      // Check if user already has a PENDING receipt
      const existingPending = await prisma.manualReceipt.findFirst({
        where: { user_id: userId, status: 'PENDING' },
      });
      if (existingPending) {
        return res.status(400).json({ error: 'شما در حال حاضر یک فیش در حال بررسی دارید' });
      }

      // Compute total payable amount (incorporating dynamic discount)
      const prices = await getPlanPrices();
      let amount = prices[plan as 'STANDARD' | 'PRO'][period as 'monthly' | 'annual'];

      if (discountCode) {
        const codeClean = String(discountCode).trim().toUpperCase();
        const coupon = await prisma.discountCode.findUnique({
          where: { code: codeClean },
          include: { userDiscounts: { where: { user_id: userId } } },
        });

        if (coupon) {
          const hasUsed = coupon.userDiscounts.length > 0;
          const isExpired = new Date(coupon.expireDate).getTime() < Date.now();
          const isLimitReached = coupon.usedCount >= coupon.maxUses;

          let validCoupon = false;
          if (hasUsed && coupon.isAccountBound) {
            validCoupon = true;
          } else if (!hasUsed && !isExpired && !isLimitReached) {
            validCoupon = true;
          }

          if (validCoupon) {
            amount = Math.round(amount * (1 - coupon.discountPercent / 100));
          }
        }
      }

      // File path logic: e.g. /uploads/receipts/filename.png
      const receiptUrl = `/uploads/receipts/${req.file.filename}`;

      const receipt = await prisma.manualReceipt.create({
        data: {
          user_id: userId,
          plan: plan as Plan,
          period,
          amount,
          discountCode: discountCode || null,
          receipt_image: receiptUrl,
          status: 'PENDING',
        },
      });

      return res.status(201).json({
        message: 'فیش پرداخت با موفقیت ثبت شد و در حال بررسی توسط مدیریت است.',
        receipt,
      });
    } catch (err: any) {
      console.error('Submit receipt error:', err);
      return res.status(500).json({ error: 'خطا در ثبت فیش پرداخت' });
    }
  }
);

/**
 * GET /api/payments/status
 * Get subscription information, metrics, and plan limits
 */
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'کاربر یافت نشد' });
    }

    const activeSubscription = await prisma.subscription.findFirst({
      where: { user_id: userId, status: 'ACTIVE' },
      orderBy: { created_at: 'desc' },
    });

    // Calculate current usage this month
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

    const accountCount = await prisma.account.count({
      where: { user_id: userId },
    });

    const pendingReceipt = await prisma.manualReceipt.findFirst({
      where: { user_id: userId, status: { in: ['PENDING', 'REJECTED'] } },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({
      plan: user.plan,
      subscription: activeSubscription
        ? {
          id: activeSubscription.id,
          start_date: activeSubscription.start_date,
          end_date: activeSubscription.end_date,
          status: activeSubscription.status,
        }
        : null,
      usage: {
        monthlyTrades: monthlyTradeCount,
        accounts: accountCount,
      },
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
    });
  } catch (err: any) {
    console.error('Get payment status error:', err);
    return res.status(500).json({ error: 'خطا در دریافت وضعیت اشتراک' });
  }
});

/**
 * GET /api/payments/mock-gateway
 * Render mock gate for development testing
 */
router.get('/mock-gateway', async (req, res) => {
  const { Authority, Amount, CallbackUrl } = req.query;

  if (!Authority || !Amount || !CallbackUrl) {
    return res.status(400).send('پارامترهای درگاه پرداخت آزمایشی معتبر نیست');
  }

  const html = `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>شبیه‌ساز درگاه پرداخت زرین‌پال</title>
      <style>
        body {
          font-family: Tahoma, Geneva, sans-serif;
          background-color: #f7f9fc;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          background-color: #ffffff;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          max-width: 450px;
          width: 100%;
          text-align: center;
          border-top: 5px solid #ffcc00;
        }
        h2 {
          color: #333333;
          margin-bottom: 20px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px dashed #e2e8f0;
          font-size: 0.95rem;
        }
        .label {
          color: #718096;
        }
        .value {
          font-weight: bold;
          color: #2d3748;
        }
        .btn-group {
          margin-top: 30px;
          display: flex;
          gap: 15px;
        }
        button {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: bold;
          transition: background-color 0.2s;
        }
        .btn-success {
          background-color: #48bb78;
          color: white;
        }
        .btn-success:hover {
          background-color: #38a169;
        }
        .btn-danger {
          background-color: #e53e3e;
          color: white;
        }
        .btn-danger:hover {
          background-color: #c53030;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>شبیه‌ساز پرداخت زرین‌پال (تست محلی)</h2>
        <p style="color: #718096; font-size: 0.85rem; margin-bottom: 25px;">شما در حال شبیه‌سازی پرداخت برای سامانه معامله‌یار هستید.</p>
        
        <div class="info-row">
          <span class="label">شناسه مرجع (Authority):</span>
          <span class="value" style="font-family: monospace;">${Authority}</span>
        </div>
        <div class="info-row">
          <span class="label">مبلغ پرداخت:</span>
          <span class="value" style="color: #2b6cb0;">${Number(Amount).toLocaleString('fa-IR')} تومان</span>
        </div>
        
        <div class="btn-group">
          <button class="btn-success" onclick="redirect('OK')">پرداخت موفق</button>
          <button class="btn-danger" onclick="redirect('NOK')">انصراف از پرداخت</button>
        </div>
      </div>

      <script>
        function redirect(status) {
          const callback = decodeURIComponent("${CallbackUrl}");
          const hasQuery = callback.includes('?');
          const finalUrl = callback + (hasQuery ? '&' : '?') + 'Authority=${Authority}&Status=' + status;
          window.location.href = finalUrl;
        }
      </script>
    </body>
    </html>
  `;

  return res.status(200).send(html);
});

/**
 * POST /api/payments/payping/checkout
 * Request PayPing payment session URL
 */
router.post('/payping/checkout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { plan, period, discountCode } = req.body;

    if (!plan || !['STANDARD', 'PRO'].includes(plan)) {
      return res.status(400).json({ error: 'پلن انتخابی معتبر نیست' });
    }

    if (!period || !['monthly', 'annual'].includes(period)) {
      return res.status(400).json({ error: 'دوره زمانی معتبر نیست' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'کاربر یافت نشد' });
    }

    let discountPercent = 0;
    if (discountCode) {
      const codeClean = String(discountCode).trim().toUpperCase();
      const codeRecord = await prisma.discountCode.findUnique({
        where: { code: codeClean },
        include: { userDiscounts: { where: { user_id: userId } } },
      });

      if (!codeRecord) {
        return res.status(400).json({ error: 'کد تخفیف معتبر نیست' });
      }

      const hasUsed = codeRecord.userDiscounts.length > 0;
      const isExpired = new Date(codeRecord.expireDate).getTime() < Date.now();
      const isLimitReached = codeRecord.usedCount >= codeRecord.maxUses;

      if (hasUsed) {
        if (!codeRecord.isAccountBound) {
          return res.status(400).json({ error: 'شما قبلاً از این کد تخفیف استفاده کرده‌اید' });
        }
        discountPercent = codeRecord.discountPercent;
      } else {
        if (isExpired) {
          return res.status(400).json({ error: 'کد تخفیف منقضی شده است' });
        }
        if (isLimitReached) {
          return res.status(400).json({ error: 'ظرفیت استفاده از این کد تخفیف به پایان رسیده است' });
        }
        discountPercent = codeRecord.discountPercent;
      }
    }

    const prices = await getPlanPrices();
    let price = prices[plan as Exclude<Plan, 'FREE'>][period as 'monthly' | 'annual'];
    if (discountPercent > 0) {
      price = Math.round(price * (1 - discountPercent / 100));
    }

    const description = `خرید پلن ${plan === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'} - دوره ${period === 'monthly' ? 'ماهانه' : 'سالانه'}`;

    const frontendBase = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3001';
    const callbackUrl = `${frontendBase}/payments/callback?plan=${plan}&period=${period}&amount=${price}${discountCode ? `&discountCode=${discountCode}` : ''}&gateway=payping`;

    const { code, redirectUrl } = await requestPaypingPayment(
      price,
      description,
      callbackUrl,
      { email: user.email, phone: user.phone || undefined }
    );

    return res.status(200).json({ code, redirectUrl });
  } catch (err: any) {
    console.error('PayPing checkout error:', err);
    return res.status(500).json({ error: err.message || 'خطا در برقراری ارتباط با درگاه پرداخت پی‌پینگ' });
  }
});

/**
 * POST /api/payments/payping/verify
 * Callback verification from PayPing
 */
router.post('/payping/verify', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { refid, code, amount, plan, period, discountCode } = req.body;
    console.log('[PayPing Verify Route] Received Body:', { refid, code, amount, plan, period, discountCode });

    if (!refid || !amount || !plan || !period) {
      return res.status(400).json({ error: 'اطلاعات تایید پرداخت نامعتبر است' });
    }

    const verification = await verifyPaypingPayment(Number(amount), code || '', Number(refid));

    if (!verification.success) {
      return res.status(400).json({ error: verification.message });
    }

    const startDate = new Date();
    const endDate = new Date();
    if (period === 'monthly') {
      endDate.setDate(startDate.getDate() + 30);
    } else if (period === 'annual') {
      endDate.setDate(startDate.getDate() + 365);
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: { user_id: userId, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      });

      const subscription = await tx.subscription.create({
        data: {
          user_id: userId,
          plan: plan as Plan,
          status: 'ACTIVE',
          start_date: startDate,
          end_date: endDate,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { plan: plan as Plan },
      });

      if (discountCode) {
        const codeClean = String(discountCode).trim().toUpperCase();
        const codeRecord = await tx.discountCode.findUnique({
          where: { code: codeClean },
        });

        if (codeRecord) {
          await tx.discountCode.update({
            where: { id: codeRecord.id },
            data: { usedCount: { increment: 1 } },
          });

          await tx.userDiscount.upsert({
            where: {
              user_id_discount_id: {
                user_id: userId,
                discount_id: codeRecord.id,
              },
            },
            create: {
              user_id: userId,
              discount_id: codeRecord.id,
            },
            update: {},
          });
        }
      }

      return subscription;
    });

    return res.status(200).json({
      success: true,
      refId: verification.refId,
      message: 'پرداخت با موفقیت انجام شد و پلن شما فعال گردید.',
      subscription: {
        plan: result.plan,
        end_date: result.end_date,
      },
    });
  } catch (err: any) {
    console.error('PayPing verify error:', err);
    return res.status(500).json({ error: err.message || 'خطا در تایید تراکنش پرداخت پی‌پینگ' });
  }
});

/**
 * GET /api/payments/payping/mock-gateway
 * Render mock gate for PayPing development testing
 */
router.get('/payping/mock-gateway', async (req, res) => {
  const { Code, Amount, CallbackUrl } = req.query;

  if (!Code || !Amount || !CallbackUrl) {
    return res.status(400).send('پارامترهای درگاه پرداخت آزمایشی معتبر نیست');
  }

  const html = `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>شبیه‌ساز درگاه پرداخت پی‌پینگ</title>
      <style>
        body {
          font-family: Tahoma, Geneva, sans-serif;
          background-color: #f0f4f8;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          background-color: #ffffff;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          max-width: 450px;
          width: 100%;
          text-align: center;
          border-top: 5px solid #234f9a;
        }
        h2 {
          color: #234f9a;
          margin-bottom: 20px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px dashed #e2e8f0;
          font-size: 0.95rem;
        }
        .label {
          color: #718096;
        }
        .value {
          font-weight: bold;
          color: #2d3748;
        }
        .btn-group {
          margin-top: 30px;
          display: flex;
          gap: 15px;
        }
        button {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: bold;
          transition: background-color 0.2s;
        }
        .btn-success {
          background-color: #319795;
          color: white;
        }
        .btn-success:hover {
          background-color: #2c7a7b;
        }
        .btn-danger {
          background-color: #e53e3e;
          color: white;
        }
        .btn-danger:hover {
          background-color: #c53030;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>شبیه‌ساز پرداخت پی‌پینگ (تست محلی)</h2>
        <p style="color: #718096; font-size: 0.85rem; margin-bottom: 25px;">شما در حال شبیه‌سازی پرداخت برای سامانه معامله‌یار هستید.</p>
        
        <div class="info-row">
          <span class="label">کد پرداخت (Code):</span>
          <span class="value" style="font-family: monospace;">${Code}</span>
        </div>
        <div class="info-row">
          <span class="label">مبلغ پرداخت:</span>
          <span class="value" style="color: #2b6cb0;">${Number(Amount).toLocaleString('fa-IR')} تومان</span>
        </div>
        
        <div class="btn-group">
          <button class="btn-success" onclick="redirect('success')">پرداخت موفق</button>
          <button class="btn-danger" onclick="redirect('cancel')">انصراف از پرداخت</button>
        </div>
      </div>

      <script>
        function redirect(action) {
          const callback = decodeURIComponent("${CallbackUrl}");
          const hasQuery = callback.includes('?');
          const refid = action === 'success' ? 'PP-REF-' + Math.floor(10000000 + Math.random() * 90000000) : '';
          const finalUrl = callback + (hasQuery ? '&' : '?') + 'refid=' + refid + '&code=${Code}' + '&clientrefid=test-ref-id';
          window.location.href = finalUrl;
        }
      </script>
    </body>
    </html>
  `;

  return res.status(200).send(html);
});

export default router;
