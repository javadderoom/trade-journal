import { Router, Response } from 'express';
import { prisma } from '../services/tradeSync';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requestPayment, verifyPayment } from '../services/zarinpal';
import { Plan, SubscriptionStatus } from '@prisma/client';

const router = Router();

// Price configuration in Tomans
export const PLAN_PRICES: Record<Exclude<Plan, 'FREE'>, Record<'monthly' | '4-month' | 'annual', number>> = {
  STANDARD: {
    monthly: 150000,
    '4-month': 500000, // discounted
    annual: 1440000,   // discounted
  },
  PRO: {
    monthly: 350000,
    '4-month': 1200000, // discounted
    annual: 3360000,    // discounted
  },
};

/**
 * POST /api/payments/checkout
 * Request ZarinPal payment URL
 */
router.post('/checkout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { plan, period } = req.body;

    if (!plan || !['STANDARD', 'PRO'].includes(plan)) {
      return res.status(400).json({ error: 'پلن انتخابی معتبر نیست' });
    }

    if (!period || !['monthly', '4-month', 'annual'].includes(period)) {
      return res.status(400).json({ error: 'دوره زمانی معتبر نیست' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'کاربر یافت نشد' });
    }

    const price = PLAN_PRICES[plan as Exclude<Plan, 'FREE'>][period as 'monthly' | '4-month' | 'annual'];
    const description = `خرید پلن ${plan === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'} - دوره ${period === 'monthly' ? 'ماهانه' : period === '4-month' ? '۴ ماهه' : 'سالانه'}`;
    
    // Front-end callback url, e.g. http://localhost:3001/payments/callback
    const frontendBase = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3001';
    const callbackUrl = `${frontendBase}/payments/callback?plan=${plan}&period=${period}&amount=${price}`;

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
    const { authority, status, amount, plan, period } = req.body;

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
    } else if (period === '4-month') {
      endDate.setDate(startDate.getDate() + 120);
    } else if (period === 'annual') {
      endDate.setDate(startDate.getDate() + 365);
    }

    // Start a Prisma transaction to update both user plan and create subscription
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

export default router;
