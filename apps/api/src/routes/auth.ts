import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/tradeSync';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../lib/tokens';
import { authenticate, AuthRequest } from '../middleware/auth';
import { registerSchema, loginSchema } from '../validators/auth';
import { sendOtpSms } from '../services/sms';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

// Rate limit: 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit(15 * 60 * 1000, 10);
// Rate limit: 5 registration attempts per hour per IP
const registerLimiter = rateLimit(60 * 60 * 1000, 5);

const REFRESH_TOKEN_EXPIRES_DAYS = 30;

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.tradekav.ir' : undefined,
    maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.tradekav.ir' : undefined,
    path: '/',
  });
};

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', registerLimiter, async (req: Request, res: Response) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'اطلاعات وارد شده معتبر نیست',
        details: result.error.flatten().fieldErrors,
      });
    }

    const { name, email, phone, password } = result.data;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existing) {
      const isEmail = existing.email === email;
      return res.status(409).json({
        error: isEmail ? 'این ایمیل قبلاً ثبت شده است' : 'این شماره موبایل قبلاً ثبت شده است',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password_hash: passwordHash,
      },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      plan: user.plan,
      role: user.role,
    });
    const refreshToken = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        user_id: user.id,
        expires_at: new Date(
          Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
        ),
        user_agent: req.headers['user-agent'] || null,
      },
    });

    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan, role: user.role },
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'اطلاعات ورود معتبر نیست' });
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'ایمیل یا رمز عبور اشتباه است' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'ایمیل یا رمز عبور اشتباه است' });
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      plan: user.plan,
      role: user.role,
    });
    const refreshToken = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        user_id: user.id,
        expires_at: new Date(
          Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
        ),
        user_agent: req.headers['user-agent'] || null,
      },
    });

    setRefreshCookie(res, refreshToken);

    return res.json({
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan, role: user.role },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ error: 'توکن بازیابی یافت نشد' });
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!stored || stored.expires_at < new Date()) {
      clearRefreshCookie(res);
      return res.status(401).json({ error: 'توکن بازیابی منقضی شده است' });
    }

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { token } });

    const newRefreshToken = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        user_id: stored.user_id,
        expires_at: new Date(
          Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
        ),
        user_agent: req.headers['user-agent'] || stored.user_agent || null,
      },
    });

    const accessToken = generateAccessToken({
      userId: stored.user.id,
      email: stored.user.email,
      plan: stored.user.plan,
      role: stored.user.role,
    });

    setRefreshCookie(res, newRefreshToken);

    return res.json({
      accessToken,
      user: {
        id: stored.user.id,
        name: stored.user.name,
        email: stored.user.email,
        plan: stored.user.plan,
        role: stored.user.role,
      },
    });
  } catch (err: any) {
    console.error('Refresh token error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
    }
    clearRefreshCookie(res);
    return res.json({ message: 'با موفقیت خارج شدید' });
  } catch (err: any) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── POST /api/auth/otp/send ──────────────────────────────────────────────────
router.post('/otp/send', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'شماره موبایل الزامی است' });
    }

    // Basic regex for Iranian phone numbers
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith('+98')) {
      formattedPhone = '0' + formattedPhone.substring(3);
    } else if (formattedPhone.startsWith('98')) {
      formattedPhone = '0' + formattedPhone.substring(2);
    }

    if (!/^09\d{9}$/.test(formattedPhone)) {
      return res.status(400).json({ error: 'شماره موبایل معتبر نیست (نمونه: ۰۹۱۲۳۴۵۶۷۸۹)' });
    }

    // Rate limit: check if an OTP was sent in the last 2 minutes
    const recentOtp = await prisma.otp.findFirst({
      where: {
        phone: formattedPhone,
        created_at: {
          gt: new Date(Date.now() - 2 * 60 * 1000),
        },
        used: false,
      },
    });

    if (recentOtp) {
      return res.status(429).json({ error: 'کد تایید قبلاً ارسال شده است. لطفاً ۲ دقیقه دیگر دوباره تلاش کنید.' });
    }

    // Generate a 5-digit verification code
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expires_at = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    await prisma.otp.create({
      data: {
        phone: formattedPhone,
        code,
        expires_at,
      },
    });

    const sent = await sendOtpSms(formattedPhone, code);
    if (!sent) {
      return res.status(500).json({ error: 'خطا در ارسال پیامک' });
    }

    return res.json({ message: 'کد تایید با موفقیت ارسال شد' });
  } catch (err: any) {
    console.error('OTP Send error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── POST /api/auth/otp/verify ────────────────────────────────────────────────
router.post('/otp/verify', async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code || typeof phone !== 'string' || typeof code !== 'string') {
      return res.status(400).json({ error: 'شماره موبایل و کد تایید الزامی هستند' });
    }

    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith('+98')) {
      formattedPhone = '0' + formattedPhone.substring(3);
    } else if (formattedPhone.startsWith('98')) {
      formattedPhone = '0' + formattedPhone.substring(2);
    }

    const record = await prisma.otp.findFirst({
      where: {
        phone: formattedPhone,
        code: code.trim(),
        expires_at: { gt: new Date() },
        used: false,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!record) {
      return res.status(400).json({ error: 'کد تایید نامعتبر یا منقضی شده است' });
    }

    // Mark code as used
    await prisma.otp.update({
      where: { id: record.id },
      data: { used: true },
    });

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    if (user) {
      // Log in immediately
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        plan: user.plan,
        role: user.role,
      });
      const refreshToken = generateRefreshToken();

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          user_id: user.id,
          expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000),
          user_agent: req.headers['user-agent'] || null,
        },
      });

      setRefreshCookie(res, refreshToken);

      return res.json({
        isNewUser: false,
        accessToken,
        user: { id: user.id, name: user.name, email: user.email, plan: user.plan, role: user.role },
      });
    } else {
      // Generate temporary registration token
      const registerToken = jwt.sign(
        { phone: formattedPhone, temp: true },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: '10m' }
      );
      return res.json({
        isNewUser: true,
        registerToken,
        phone: formattedPhone,
      });
    }
  } catch (err: any) {
    console.error('OTP Verify error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── POST /api/auth/otp/register ──────────────────────────────────────────────
router.post('/otp/register', async (req: Request, res: Response) => {
  try {
    const { registerToken, name, email, password } = req.body;
    if (!registerToken || !name || !email || !password) {
      return res.status(400).json({ error: 'تمامی فیلدها الزامی هستند' });
    }

    let payload: any;
    try {
      payload = jwt.verify(registerToken, process.env.JWT_ACCESS_SECRET!);
      if (!payload.temp || !payload.phone) {
        return res.status(400).json({ error: 'توکن ثبت‌نام نامعتبر است' });
      }
    } catch (e) {
      return res.status(401).json({ error: 'توکن ثبت‌نام منقضی شده یا نامعتبر است' });
    }

    const phone = payload.phone;

    // Verify unique email/phone
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone },
        ],
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'این ایمیل یا شماره موبایل قبلاً ثبت شده است' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password_hash: passwordHash,
      },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      plan: user.plan,
      role: user.role,
    });
    const refreshToken = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        user_id: user.id,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000),
        user_agent: req.headers['user-agent'] || null,
      },
    });

    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan, role: user.role },
    });
  } catch (err: any) {
    console.error('OTP Register error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, phone: true, plan: true, role: true, created_at: true },
    });
    if (!user) return res.status(404).json({ error: 'کاربر یافت نشد' });
    return res.json({ user });
  } catch (err: any) {
    console.error('Me query error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
