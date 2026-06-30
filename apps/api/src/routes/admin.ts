import { Router, Response } from 'express';
import { prisma } from '../services/tradeSync';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { Plan, ReceiptStatus } from '@prisma/client';

const router = Router();

// Protect all admin routes
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/stats
 * Retrieve system stats (counts of users by plan, total earnings, pending receipts)
 */
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const freeUsers = await prisma.user.count({ where: { plan: 'FREE' } });
    const standardUsers = await prisma.user.count({ where: { plan: 'STANDARD' } });
    const proUsers = await prisma.user.count({ where: { plan: 'PRO' } });

    // Aggregate approved payments revenue
    const approvedReceipts = await prisma.manualReceipt.findMany({
      where: { status: 'APPROVED' },
      select: { amount: true },
    });
    const totalRevenue = approvedReceipts.reduce((acc, curr) => acc + curr.amount, 0);

    const pendingReceiptsCount = await prisma.manualReceipt.count({
      where: { status: 'PENDING' },
    });

    return res.status(200).json({
      totalUsers,
      freeUsers,
      standardUsers,
      proUsers,
      totalRevenue,
      pendingReceiptsCount,
    });
  } catch (err: any) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ error: 'خطا در دریافت آمار مدیریت' });
  }
});

/**
 * GET /api/admin/users
 * Retrieve list of users with their active plan and sign up date
 */
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        plan: true,
        role: true,
        created_at: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          select: { end_date: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted = users.map((u) => {
      const activeSub = u.subscriptions[0];
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        plan: u.plan,
        role: u.role,
        created_at: u.created_at,
        expires_at: activeSub ? activeSub.end_date : null,
      };
    });

    return res.status(200).json(formatted);
  } catch (err: any) {
    console.error('Admin list users error:', err);
    return res.status(500).json({ error: 'خطا در دریافت لیست کاربران' });
  }
});

/**
 * PUT /api/admin/users/:id/plan
 * Manually update a user's plan and set subscription expiry
 */
router.put('/users/:id/plan', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { plan, durationDays } = req.body; // durationDays can be null for permanent/unspecified

    if (!['FREE', 'STANDARD', 'PRO'].includes(plan)) {
      return res.status(400).json({ error: 'پلن نامعتبر است' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update user
      await tx.user.update({
        where: { id },
        data: { plan: plan as Plan },
      });

      // 2. Expire old active subs
      await tx.subscription.updateMany({
        where: { user_id: id, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      });

      // 3. Create new subscription if plan is not FREE
      if (plan !== 'FREE') {
        const startDate = new Date();
        const endDate = durationDays ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000) : null;

        await tx.subscription.create({
          data: {
            user_id: id,
            plan: plan as Plan,
            status: 'ACTIVE',
            start_date: startDate,
            end_date: endDate,
          },
        });
      }
    });

    return res.status(200).json({ message: 'پلن کاربر با موفقیت تغییر یافت' });
  } catch (err: any) {
    console.error('Admin edit user plan error:', err);
    return res.status(500).json({ error: 'خطا در تغییر پلن کاربر' });
  }
});

/**
 * GET /api/admin/receipts
 * Retrieve all manual transaction receipts
 */
router.get('/receipts', async (req: AuthRequest, res: Response) => {
  try {
    const receipts = await prisma.manualReceipt.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    return res.status(200).json(receipts);
  } catch (err: any) {
    console.error('Admin fetch receipts error:', err);
    return res.status(500).json({ error: 'خطا در دریافت لیست فیش‌ها' });
  }
});

/**
 * POST /api/admin/receipts/:id/verify
 * Approve or reject a user transaction receipt
 */
router.post('/receipts/:id/verify', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, rejectionReason } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'وضعیت ارسال شده معتبر نیست' });
    }

    const receipt = await prisma.manualReceipt.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'فیش یافت نشد' });
    }

    if (receipt.status !== 'PENDING') {
      return res.status(400).json({ error: 'این فیش قبلاً تعیین وضعیت شده است' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update receipt status
      await tx.manualReceipt.update({
        where: { id },
        data: {
          status: status as ReceiptStatus,
          rejectionReason: status === 'REJECTED' ? (rejectionReason || 'نامشخص') : null,
        },
      });

      // 2. If approved, activate user subscription
      if (status === 'APPROVED') {
        const startDate = new Date();
        const durationDays = receipt.period === 'annual' ? 365 : 30;
        const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

        // Expire older active subscriptions
        await tx.subscription.updateMany({
          where: { user_id: receipt.user_id, status: 'ACTIVE' },
          data: { status: 'EXPIRED' },
        });

        // Create new active subscription
        await tx.subscription.create({
          data: {
            user_id: receipt.user_id,
            plan: receipt.plan,
            status: 'ACTIVE',
            start_date: startDate,
            end_date: endDate,
          },
        });

        // Update user plan status
        await tx.user.update({
          where: { id: receipt.user_id },
          data: { plan: receipt.plan },
        });

        // Update coupon usage count if used
        if (receipt.discountCode) {
          const codeClean = String(receipt.discountCode).trim().toUpperCase();
          const coupon = await tx.discountCode.findUnique({ where: { code: codeClean } });
          if (coupon) {
            await tx.discountCode.update({
              where: { id: coupon.id },
              data: { usedCount: { increment: 1 } },
            });
            await tx.userDiscount.upsert({
              where: {
                user_id_discount_id: {
                  user_id: receipt.user_id,
                  discount_id: coupon.id,
                },
              },
              create: {
                user_id: receipt.user_id,
                discount_id: coupon.id,
              },
              update: {},
            });
          }
        }
      }
    });

    return res.status(200).json({ message: `فیش پرداخت با موفقیت ${status === 'APPROVED' ? 'تایید' : 'رد'} شد` });
  } catch (err: any) {
    console.error('Admin verify receipt error:', err);
    return res.status(500).json({ error: 'خطا در ثبت وضعیت فیش پرداخت' });
  }
});

/**
 * GET /api/admin/coupons
 * List all discount coupon codes
 */
router.get('/coupons', async (req: AuthRequest, res: Response) => {
  try {
    const coupons = await prisma.discountCode.findMany({
      orderBy: { created_at: 'desc' },
    });
    return res.status(200).json(coupons);
  } catch (err: any) {
    console.error('Admin fetch coupons error:', err);
    return res.status(500).json({ error: 'خطا در دریافت کدهای تخفیف' });
  }
});

/**
 * POST /api/admin/coupons
 * Create a new discount coupon code
 */
router.post('/coupons', async (req: AuthRequest, res: Response) => {
  try {
    const { code, discountPercent, maxUses, expireDate, isAccountBound } = req.body;

    if (!code || !discountPercent || !maxUses || !expireDate) {
      return res.status(400).json({ error: 'وارد کردن تمامی فیلدهای الزامی است' });
    }

    const codeClean = String(code).trim().toUpperCase();
    const exists = await prisma.discountCode.findUnique({ where: { code: codeClean } });
    if (exists) {
      return res.status(400).json({ error: 'این کد تخفیف از قبل وجود دارد' });
    }

    const coupon = await prisma.discountCode.create({
      data: {
        code: codeClean,
        discountPercent: Number(discountPercent),
        maxUses: Number(maxUses),
        expireDate: new Date(expireDate),
        isAccountBound: !!isAccountBound,
      },
    });

    return res.status(201).json(coupon);
  } catch (err: any) {
    console.error('Admin create coupon error:', err);
    return res.status(500).json({ error: 'خطا در ساخت کد تخفیف جدید' });
  }
});

/**
 * DELETE /api/admin/coupons/:id
 * Delete/Remove a discount code
 */
router.delete('/coupons/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.discountCode.delete({ where: { id } });
    return res.status(200).json({ message: 'کد تخفیف با موفقیت حذف شد' });
  } catch (err: any) {
    console.error('Admin delete coupon error:', err);
    return res.status(500).json({ error: 'خطا در حذف کد تخفیف' });
  }
});

/**
 * PUT /api/admin/settings/prices
 * Update dynamic pricing config
 */
router.put('/settings/prices', async (req: AuthRequest, res: Response) => {
  try {
    const { prices } = req.body; // e.g. { STANDARD: { monthly: 249000, annual: 2390000 }, ... }

    if (!prices || !prices.STANDARD || !prices.PRO) {
      return res.status(400).json({ error: 'فرمت قیمت‌ها صحیح نیست' });
    }

    await prisma.systemSetting.upsert({
      where: { key: 'PRICING_PLANS' },
      create: { key: 'PRICING_PLANS', value: prices },
      update: { value: prices },
    });

    return res.status(200).json({ message: 'تنظیمات قیمت‌گذاری با موفقیت بروزرسانی شد' });
  } catch (err: any) {
    console.error('Admin update prices error:', err);
    return res.status(500).json({ error: 'خطا در ذخیره‌سازی تنظیمات قیمت‌گذاری' });
  }
});

/**
 * PUT /api/admin/settings/contact
 * Update contact settings
 */
router.put('/settings/contact', async (req: AuthRequest, res: Response) => {
  try {
    const { email, mobile, landline, address } = req.body;

    await prisma.systemSetting.upsert({
      where: { key: 'CONTACT_INFO' },
      create: {
        key: 'CONTACT_INFO',
        value: { email, mobile, landline, address },
      },
      update: {
        value: { email, mobile, landline, address },
      },
    });

    return res.status(200).json({ message: 'اطلاعات تماس با موفقیت بروزرسانی شد' });
  } catch (err: any) {
    console.error('Admin update contact info error:', err);
    return res.status(500).json({ error: 'خطا در ذخیره‌سازی تنظیمات اطلاعات تماس' });
  }
});

/**
 * PUT /api/admin/settings/card-details
 * Update card settings
 */
router.put('/settings/card-details', async (req: AuthRequest, res: Response) => {
  try {
    const { cardNumber, bankName, ownerName } = req.body;

    await prisma.systemSetting.upsert({
      where: { key: 'CARD_DETAILS' },
      create: {
        key: 'CARD_DETAILS',
        value: { cardNumber, bankName, ownerName },
      },
      update: {
        value: { cardNumber, bankName, ownerName },
      },
    });

    return res.status(200).json({ message: 'مشخصات کارت بانکی با موفقیت بروزرسانی شد' });
  } catch (err: any) {
    console.error('Admin update card details error:', err);
    return res.status(500).json({ error: 'خطا در ذخیره‌سازی تنظیمات کارت بانکی' });
  }
});

export default router;
