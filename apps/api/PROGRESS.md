# API Progress — TradeKav (تریدکاو)

## Tech Stack
- **Runtime:** Node.js + Express 5
- **Database:** PostgreSQL via Prisma 7 ORM (`src/prisma/schema.prisma`)
- **DB adapter:** `@prisma/adapter-pg` (PrismaPg driver — Prisma 7 pattern, no `url` in schema)
- **Auth:** JWT access tokens (in-memory) + HttpOnly refresh token cookie (30-day), Zod validation
- **OTP:** Kavenegar SMS gateway (`src/services/sms.ts`)
- **Payments:** ZarinPal + PayPing gateways (`src/services/zarinpal.ts`, `src/services/payping.ts`)
- **File uploads:** Multer — disk storage for screenshots/avatars/receipts, memory storage for MT4/MT5 import
- **Key deps:** `express@5`, `@prisma/client@7`, `@prisma/adapter-pg`, `pg`, `bcryptjs`, `jsonwebtoken`, `zod`, `cookie-parser`, `multer`, `node-cron`, `node-html-parser`

---

## ✅ Done

### Database Schema (`src/prisma/schema.prisma`)
**14 models:**

| Model | Purpose |
|---|---|
| `User` | Core user: email, phone, password_hash, plan, role, display_currency, avatar_url, soft-delete |
| `Account` | Broker account per user (broker_name, account_number, currency, last_sync_at) |
| `Trade` | Trade record with all MT4/MT5 fields + tags[], emotion, notes, screenshots[], chart_data |
| `JournalEntry` | Daily text journal with mood enum |
| `ImportJob` | Tracks file import jobs (filename, status, row counts, errors) |
| `Subscription` | Subscription record per user (plan, status, start/end dates) |
| `Tag` | User-level tag library (`is_ignored`, `show_first` flags); `@@unique([user_id, name])` |
| `Emotion` | User-customisable emotion list (value, label, emoji); `@@unique([user_id, value])` |
| `RefreshToken` | Stored refresh tokens with expiry, user-agent, last_used_at |
| `AccountToken` | Per-account API tokens for the MT4/MT5 EA; masked on read |
| `DiscountCode` | Coupon codes with max uses, expiry, account-binding flag |
| `UserDiscount` | Junction table: which user used which discount code |
| `SystemSetting` | Key-value store for admin-editable config (e.g. `PRICING_PLANS`) |
| `ManualReceipt` | Manual payment receipt uploads (image, status: PENDING/APPROVED/REJECTED) |
| `Otp` | Phone OTP records (code, expires_at, used flag) |

**Enums:** `Role`, `Plan` (FREE/STANDARD/PRO), `Direction` (BUY/SELL), `Mood`, `ImportSource` (MANUAL/MT4\_CSV/MT4\_HTM/MT5\_CSV/MT5\_EA), `ImportStatus`, `SubscriptionStatus`, `DisplayCurrency` (USD/TOMAN/BOTH), `ReceiptStatus`

**Prisma 7 note:** Connection URL is in `prisma.config.ts` via `PrismaPg` adapter. Generate with:
```
npx prisma generate --schema apps/api/src/prisma/schema.prisma --config apps/api/src/prisma/prisma.config.ts
```
Migrate with: `npm run --workspace=api prisma:migrate`

---

### Express Server (`src/server.ts`)
- Dynamic CORS (matches request origin, credentials: true)
- JSON body parser (10MB limit), cookie-parser
- Static file serving: `/uploads` → `../uploads/`
- All routers mounted (see routes below)
- Health check: `GET /api/health`
- **Cron job:** Daily at 03:00 Tehran time — clears expired `RefreshToken` rows

---

### Auth Routes (`src/routes/auth.ts`) — `/api/auth`

| Method | Path | Description |
|---|---|---|
| `POST` | `/register` | Email+phone+password registration; Zod validation |
| `POST` | `/login` | Email+password login; sets HttpOnly refresh cookie |
| `POST` | `/logout` | Clears refresh cookie, deletes token from DB |
| `POST` | `/refresh` | Rotates refresh token, returns new access token |
| `GET` | `/me` | Returns authenticated user profile |
| `POST` | `/otp/send` | Sends OTP SMS via Kavenegar to phone number |
| `POST` | `/otp/verify` | Verifies OTP; returns `{ isNewUser, registerToken? }` or logs in existing user |
| `POST` | `/otp/register` | Completes registration for new OTP user (name, email, password + registerToken) |
| `POST` | `/avatar` | Uploads avatar image (Multer, 2MB, JPG/PNG) |

- Access token TTL: from `JWT_EXPIRES_IN` env (default `15m`)
- Refresh token TTL: 30 days, rotated on each use
- `authenticate` middleware: validates Bearer token, attaches `req.user`
- `requireAdmin` middleware: enforces `role === 'ADMIN'`
- `authenticateAccountToken` middleware: validates EA account tokens (x-api-token header)

---

### Trade Routes (`src/routes/tradeSync.ts`) — `/api/trades`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | JWT | List trades (filters: accountId, limit, offset) — max 500 |
| `GET` | `/accounts` | JWT | List user's accounts (auto-creates default if none) |
| `POST` | `/` | JWT | Create manual trade |
| `POST` | `/sync` | AccountToken | Sync trades from MT5 EA (upsert by `account_id + ticket`) |
| `PUT` | `/:id` | JWT | Update trade: notes, emotion, stopLoss, takeProfit, tags, screenshots |
| `DELETE` | `/:id` | JWT | Delete single trade |
| `POST` | `/bulk-delete` | JWT | Bulk delete multiple trades |
| `POST` | `/:id/screenshots` | JWT | Upload screenshot (Multer disk, image files only) |
| `DELETE` | `/:id/screenshots` | JWT | Delete screenshot file |
| `POST` | `/import-mt4` | JWT | Upload + parse MT4/MT5 HTML or CSV statement |
| `GET` | `/tags` | JWT | List user's tag library |
| `POST` | `/tags` | JWT | Create a new tag |
| `DELETE` | `/tags/:name` | JWT | Delete a tag |
| `PATCH` | `/tags/:name` | JWT | Update tag (is_ignored, show_first) |

- `PUT /:id` recalculates `r_multiple` when `stop_loss` is updated
- Plan limits enforced by `checkTradeLimit`, `checkImportPermission`, `checkSyncPermission` middlewares

---

### Account Token Routes (`src/routes/accountTokens.ts`) — `/api`

| Method | Path | Description |
|---|---|---|
| `GET` | `/accounts/:accountId/tokens` | List tokens for an account (masked display) |
| `POST` | `/accounts/:accountId/tokens` | Generate new API token for EA |
| `DELETE` | `/accounts/:accountId/tokens/:tokenId` | Delete an EA token |

---

### Journal Routes (`src/routes/journal.ts`) — `/api/journal`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Fetch journal entry by date (`?date=YYYY-MM-DD`) |
| `POST` | `/` | Create or update (upsert) journal entry for a date |

- Accepts `body` (string) and `mood` (Mood enum)

---

### Dashboard Routes (`src/routes/dashboard.ts`) — `/api/dashboard`

- Full server-side analytics with Tehran timezone awareness:
  - Today's P&L, trade count, win rate
  - Monthly equity curve data points
  - Weekday P&L breakdown (Sat→Fri)
  - 24-hour heatmap (Tehran local time)
  - Session breakdown (NY/London/Tokyo)
  - Symbol performance stats
  - Edge insights (streaks, best/worst day, etc.)
- All endpoints authenticated with JWT

---

### Settings Routes (`src/routes/settings.ts`) — `/api/settings`

| Area | Endpoints |
|---|---|
| **Profile** | `GET /profile`, `PUT /profile` (name, email, display_currency) |
| **Password** | `PUT /password` (current + new, bcrypt) |
| **Avatar** | `POST /avatar` (Multer 2MB JPG/PNG) |
| **Accounts** | `GET /accounts`, `POST /accounts` (plan-gated), `PUT /accounts/:id`, `DELETE /accounts/:id` |
| **Tags** | `GET /tags`, `POST /tags`, `DELETE /tags/:name`, `PATCH /tags/:name` |
| **Emotions** | `GET /emotions`, `POST /emotions`, `PUT /emotions/:id`, `DELETE /emotions/:id` |
| **Subscription** | `GET /subscription` |

---

### Payments Routes (`src/routes/payments.ts`) — `/api/payments`

| Method | Path | Description |
|---|---|---|
| `GET` | `/plans` | Returns plan pricing (from `SystemSetting` or hardcoded defaults) |
| `POST` | `/checkout` | Initiate ZarinPal or PayPing payment |
| `GET` | `/callback` | Payment gateway return URL; verifies and activates subscription |
| `POST` | `/manual-receipt` | Upload manual bank receipt image (5MB, JPG/PNG) |
| `GET` | `/my-receipts` | List user's own manual receipts |
| `GET` | `/discount/validate` | Validate a coupon code |

- Prices from `SystemSetting.PRICING_PLANS` (admin-editable); falls back to `DEFAULT_PRICES`
- STANDARD monthly: 249,000 Toman; annual: 2,390,000 (20% off)
- PRO monthly: 499,000 Toman; annual: 4,790,000 (20% off)

---

### Admin Routes (`src/routes/admin.ts`) — `/api/admin`
All routes require `authenticate` + `requireAdmin`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/stats` | Total users by plan, total revenue, pending receipts count |
| `GET` | `/users` | Paginated user list with plan + signup date |
| `PUT` | `/users/:id/plan` | Manually change a user's plan |
| `DELETE` | `/users/:id` | Soft-delete a user |
| `GET` | `/receipts` | List manual receipts (filter by status) |
| `PUT` | `/receipts/:id/approve` | Approve receipt → upgrade user plan |
| `PUT` | `/receipts/:id/reject` | Reject receipt with reason |
| `GET` | `/discounts` | List all discount codes |
| `POST` | `/discounts` | Create a discount code |
| `DELETE` | `/discounts/:id` | Delete a discount code |
| `PUT` | `/pricing` | Update plan prices in `SystemSetting` |

---

### Plan Limit Middleware (`src/middleware/checkPlanLimits.ts`)

| Guard | Enforces |
|---|---|
| `checkAccountLimit` | FREE: 1 account, STANDARD: 3, PRO: unlimited |
| `checkTradeLimit` | FREE: 30 trades/month |
| `checkImportPermission` | Blocks MT4/MT5 file import on FREE plan |
| `checkSyncPermission` | Blocks EA live sync on FREE plan |

---

### Services

| File | Purpose |
|---|---|
| `src/services/tradeSync.ts` | `syncTradesFromEA()` (3-way upsert), `getTradesForAccount()`, shared Prisma client |
| `src/services/mt4Parser.ts` | Auto-detects and parses MT4 HTML, MT4 CSV, MT5 CSV — calculates pips + R-multiple |
| `src/services/sms.ts` | `sendOtpSms(phone, code)` via Kavenegar REST API |
| `src/services/zarinpal.ts` | `requestPayment()`, `verifyPayment()` — ZarinPal gateway |
| `src/services/payping.ts` | `requestPaypingPayment()`, `verifyPaypingPayment()` — PayPing gateway |

---

### Validators & Lib

| File | Purpose |
|---|---|
| `src/validators/auth.ts` | Zod schemas: `registerSchema`, `loginSchema` |
| `src/lib/tokens.ts` | `generateAccessToken()`, `generateRefreshToken()` |
| `src/middleware/auth.ts` | `authenticate`, `requireAdmin`, `authenticateAccountToken` |

---

## ❌ Not Done (Next Steps)

### High Priority
- **`GET /api/trades/:id`** — single trade detail endpoint (not implemented; frontend fetches full list and filters client-side)
- **Global error handler middleware** — no centralized Express error handler; errors are caught per-route

### Medium Priority
- **Strategy/setup field** — `Setup` model was fully removed (migration `20260618192211_remove_setup`). Decision pending: use tags (simplest) or add `setup_name: String?` to `Trade` model
- **Analytics endpoints** — dashboard stats currently computed client-side; server-side equivalents in `dashboard.ts` exist but may not be fully consumed by frontend

### Low Priority
- **API tests** — no automated test suite (no Jest/Vitest setup)
- **`csv-parser` dep** — installed but unused; MT4/MT5 CSV parsing uses manual string splitting in `mt4Parser.ts`
- **Journal list endpoint** — `GET /api/journal` only fetches by single date; no list/range endpoint
