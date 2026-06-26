import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../services/tradeSync';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../lib/tokens';
import { authenticate, AuthRequest } from '../middleware/auth';
import { registerSchema, loginSchema } from '../validators/auth';

const router = Router();

const REFRESH_TOKEN_EXPIRES_DAYS = 30;

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
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
          { phone },
        ],
      },
    });

    if (existing) {
      return res.status(409).json({
        error: 'این ایمیل یا شماره موبایل قبلاً ثبت شده است',
      });
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
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
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
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
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
      res.clearCookie('refreshToken', {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      });
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
    });

    setRefreshCookie(res, newRefreshToken);

    return res.json({
      accessToken,
      user: {
        id: stored.user.id,
        name: stored.user.name,
        email: stored.user.email,
        plan: stored.user.plan,
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
    res.clearCookie('refreshToken', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    });
    return res.json({ message: 'با موفقیت خارج شدید' });
  } catch (err: any) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, phone: true, plan: true, created_at: true },
    });
    if (!user) return res.status(404).json({ error: 'کاربر یافت نشد' });
    return res.json({ user });
  } catch (err: any) {
    console.error('Me query error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
