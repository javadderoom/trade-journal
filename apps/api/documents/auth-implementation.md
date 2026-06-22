# Auth Implementation Guide
## JWT (Access + Refresh Tokens) — Express + Next.js + Prisma + PostgreSQL

---

## 1. Prisma Schema

Add to your `schema.prisma`:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  phone         String?   @unique
  name          String
  passwordHash  String
  plan          Plan      @default(FREE)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  refreshTokens RefreshToken[]
  accounts      Account[]
  trades        Trade[]
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
}

enum Plan {
  FREE
  STANDARD
  PRO
}
```

Run migration:
```bash
npx prisma migrate dev --name add_auth
```

---

## 2. Install Dependencies

```bash
# In your Express API package
npm install bcryptjs jsonwebtoken cookie-parser zod
npm install -D @types/bcryptjs @types/jsonwebtoken @types/cookie-parser
```

---

## 3. Environment Variables

```env
# apps/api/.env
DATABASE_URL="postgresql://..."
JWT_ACCESS_SECRET="your-access-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"
CLIENT_URL="http://localhost:3000"
```

```env
# apps/web/.env.local
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

---

## 4. Express Backend

### 4.1 Token utilities — `src/lib/tokens.ts`

```typescript
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

export interface AccessTokenPayload {
  userId: string
  email: string
  plan: string
}

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  })
}

export const generateRefreshToken = (): string => {
  // Opaque random token — stored in DB, not JWT
  return crypto.randomBytes(64).toString('hex')
}

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as AccessTokenPayload
}
```

### 4.2 Auth middleware — `src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../lib/tokens'

export interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
    plan: string
  }
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null

  if (!token) {
    return res.status(401).json({ error: 'توکن احراز هویت یافت نشد' })
  }

  try {
    const payload = verifyAccessToken(token)
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ error: 'توکن نامعتبر یا منقضی شده است' })
  }
}
```

### 4.3 Validation schemas — `src/validators/auth.ts`

```typescript
import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
  email: z.string().email('ایمیل معتبر نیست'),
  phone: z
    .string()
    .regex(/^09[0-9]{9}$/, 'شماره موبایل معتبر نیست')
    .optional(),
  password: z
    .string()
    .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد')
    .regex(/[A-Z]/, 'رمز عبور باید حداقل یک حرف بزرگ داشته باشد')
    .regex(/[0-9]/, 'رمز عبور باید حداقل یک عدد داشته باشد'),
})

export const loginSchema = z.object({
  email: z.string().email('ایمیل معتبر نیست'),
  password: z.string().min(1, 'رمز عبور الزامی است'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
```

### 4.4 Auth routes — `src/routes/auth.ts`

```typescript
import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import {
  generateAccessToken,
  generateRefreshToken,
} from '../lib/tokens'
import { authenticate, AuthRequest } from '../middleware/auth'
import { registerSchema, loginSchema } from '../validators/auth'

const router = Router()

const REFRESH_TOKEN_EXPIRES_DAYS = 30

// ─── Helper ──────────────────────────────────────────────────────────────────

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/auth',      // only sent to auth endpoints
  })
}

// ─── POST /api/auth/register ─────────────────────────────────────────────────

router.post('/register', async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      error: 'اطلاعات وارد شده معتبر نیست',
      details: result.error.flatten().fieldErrors,
    })
  }

  const { name, email, phone, password } = result.data

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] },
  })
  if (existing) {
    return res.status(409).json({
      error: 'این ایمیل یا شماره موبایل قبلاً ثبت شده است',
    })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash },
  })

  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    plan: user.plan,
  })
  const refreshToken = generateRefreshToken()

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(
        Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
      ),
    },
  })

  setRefreshCookie(res, refreshToken)

  return res.status(201).json({
    accessToken,
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
  })
})

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post('/login', async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'اطلاعات ورود معتبر نیست' })
  }

  const { email, password } = result.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    // Same message for both wrong email and wrong password (security)
    return res.status(401).json({ error: 'ایمیل یا رمز عبور اشتباه است' })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return res.status(401).json({ error: 'ایمیل یا رمز عبور اشتباه است' })
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    plan: user.plan,
  })
  const refreshToken = generateRefreshToken()

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(
        Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
      ),
    },
  })

  setRefreshCookie(res, refreshToken)

  return res.json({
    accessToken,
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
  })
})

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

router.post('/refresh', async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken
  if (!token) {
    return res.status(401).json({ error: 'توکن بازیابی یافت نشد' })
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!stored || stored.expiresAt < new Date()) {
    res.clearCookie('refreshToken', { path: '/api/auth' })
    return res.status(401).json({ error: 'توکن بازیابی منقضی شده است' })
  }

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { token } })

  const newRefreshToken = generateRefreshToken()
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: stored.userId,
      expiresAt: new Date(
        Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
      ),
    },
  })

  const accessToken = generateAccessToken({
    userId: stored.user.id,
    email: stored.user.email,
    plan: stored.user.plan,
  })

  setRefreshCookie(res, newRefreshToken)

  return res.json({
    accessToken,
    user: {
      id: stored.user.id,
      name: stored.user.name,
      email: stored.user.email,
      plan: stored.user.plan,
    },
  })
})

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

router.post('/logout', async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } })
  }
  res.clearCookie('refreshToken', { path: '/api/auth' })
  return res.json({ message: 'با موفقیت خارج شدید' })
})

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, phone: true, plan: true, createdAt: true },
  })
  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد' })
  return res.json({ user })
})

export default router
```

### 4.5 Register the router — `src/index.ts`

```typescript
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import authRouter from './routes/auth'

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,           // required for cookies
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRouter)
// ... other routes use authenticate middleware
```

### 4.6 Protect other routes

```typescript
// Example: trades route
import { authenticate } from '../middleware/auth'

router.get('/trades', authenticate, async (req: AuthRequest, res) => {
  const trades = await prisma.trade.findMany({
    where: { userId: req.user!.userId },  // user isolation
  })
  res.json(trades)
})
```

---

## 5. Next.js Frontend

### 5.1 Auth store — `lib/auth.ts` (Zustand)

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from './api'

interface User {
  id: string
  name: string
  email: string
  plan: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<boolean>
  setAuth: (user: User, token: string) => void
}

interface RegisterData {
  name: string
  email: string
  phone?: string
  password: string
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,

      setAuth: (user, accessToken) => set({ user, accessToken }),

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          set({ user: data.user, accessToken: data.accessToken })
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (registerData) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/register', registerData)
          set({ user: data.user, accessToken: data.accessToken })
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        await api.post('/auth/logout')
        set({ user: null, accessToken: null })
      },

      refresh: async () => {
        try {
          const { data } = await api.post('/auth/refresh')
          set({ user: data.user, accessToken: data.accessToken })
          return true
        } catch {
          set({ user: null, accessToken: null })
          return false
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
      // Don't persist accessToken — re-fetch on load via refresh
    }
  )
)
```

### 5.2 Axios instance with auto-refresh — `lib/api.ts`

```typescript
import axios from 'axios'
import { useAuth } from './auth'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api',
  withCredentials: true,       // send cookies
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => (token ? p.resolve(token) : p.reject(error)))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      const success = await useAuth.getState().refresh()
      isRefreshing = false

      if (success) {
        const newToken = useAuth.getState().accessToken!
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } else {
        processQueue(error, null)
        // Redirect to login
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api
```

### 5.3 Auth guard middleware — `middleware.ts` (Next.js root)

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register', '/']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith('/api')
  )

  // Check for refresh token cookie as a proxy for "logged in"
  const hasRefreshToken = request.cookies.has('refreshToken')

  if (!isPublic && !hasRefreshToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (hasRefreshToken && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### 5.4 Login page — `app/(auth)/login/page.tsx`

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطایی رخ داد')
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center" dir="rtl">
      <div className="bg-[#181C27] border border-[#252A3A] rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-[#E8EAF0] text-2xl font-bold mb-2 text-center">
          ورود به معامله‌یار
        </h1>
        <p className="text-[#6B7280] text-sm text-center mb-8">
          خوش برگشتی
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-[#E8EAF0] text-sm mb-1.5">ایمیل</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full bg-[#0F1117] border border-[#252A3A] text-[#E8EAF0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#3DDC97] transition-colors placeholder:text-[#6B7280]"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-[#E8EAF0] text-sm mb-1.5">رمز عبور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0F1117] border border-[#252A3A] text-[#E8EAF0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#3DDC97] transition-colors placeholder:text-[#6B7280]"
              dir="ltr"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-[#3DDC97] text-[#0F1117] font-bold rounded-lg py-3 text-sm hover:bg-[#35c589] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'در حال ورود...' : 'ورود به حساب'}
          </button>
        </div>

        <p className="text-center text-[#6B7280] text-sm mt-6">
          حساب ندارید؟{' '}
          <a href="/register" className="text-[#3DDC97] hover:underline">
            ثبت‌نام کنید
          </a>
        </p>
      </div>
    </div>
  )
}
```

---

## 6. Security Checklist

| Item | Status |
|---|---|
| Passwords hashed with bcrypt (cost 12) | ✅ in code above |
| Access token short-lived (15min) | ✅ |
| Refresh token httpOnly cookie | ✅ |
| Refresh token rotation on every use | ✅ |
| Same error message for wrong email/password | ✅ |
| CORS with credentials locked to CLIENT_URL | ✅ |
| Refresh cookie scoped to `/api/auth` path only | ✅ |
| All trade queries filtered by `userId` | ✅ implement in every route |
| Rate limiting on login endpoint | ⚠️ add `express-rate-limit` |
| Old refresh tokens cleaned up (cron job) | ⚠️ add weekly cleanup |

---

## 7. Cleanup Cron (add to Express startup)

```typescript
// Delete expired refresh tokens daily
import cron from 'node-cron'

cron.schedule('0 3 * * *', async () => {
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
})
```

```bash
npm install node-cron
npm install -D @types/node-cron
```

---

## 8. Build Order

1. Run Prisma migration (`User` + `RefreshToken` models)
2. Build Express routes (`/register`, `/login`, `/refresh`, `/logout`, `/me`)
3. Add `authenticate` middleware to all existing trade/analytics routes
4. Add `userId` filter to all existing Prisma queries
5. Build Zustand auth store + Axios interceptor
6. Build login + register pages
7. Add Next.js middleware for route protection
8. Test the full cycle: register → trade list (protected) → token expiry → auto-refresh → logout
