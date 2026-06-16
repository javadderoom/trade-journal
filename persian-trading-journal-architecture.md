# معامله‌یار — Persian Trading Journal Platform
## Full Architecture Document (v1)

---

## 1. Project Overview

**Product name (suggested):** معامله‌یار (Mo'amele-yar — "Trade Companion")

**What it is:** A Farsi-native trade journaling and analytics platform for Iranian forex/crypto traders, targeting MT4/MT5 users trading via offshore brokers.

**Core design constraints:**
- Full RTL (right-to-left) UI in Persian
- Jalali (Solar Hijri) calendar throughout
- Iran-accessible hosting
- Iran-native payment gateway
- MT4/MT5 import as primary data entry method
- No dependency on sanctioned US cloud services (AWS, GCP, Stripe, etc.)

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Client (Browser)                    │
│              Next.js 14 — App Router — RTL              │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│                   Arvan Cloud CDN                        │
│         (Iranian CDN — keeps site fast in Iran)          │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              Node.js / Express API Server                │
│                   REST + file upload                     │
│              Hosted on Hetzner (Germany)                 │
└──────┬──────────────────────────────────┬───────────────┘
       │                                  │
┌──────▼──────┐                  ┌────────▼──────────┐
│ PostgreSQL  │                  │   Redis (cache +  │
│  (primary   │                  │   sessions +      │
│  database)  │                  │   job queue)      │
└─────────────┘                  └───────────────────┘
```

---

## 3. Tech Stack — Full Detail

### 3.1 Frontend

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR for fast initial load in Iran |
| Language | TypeScript | Type safety for trade data models |
| Styling | Tailwind CSS + `tailwindcss-rtl` plugin | RTL utility classes |
| RTL direction | `<html dir="rtl" lang="fa">` | Set at root level |
| Persian font | Vazirmatn | Best open-source Persian web font; load via local file, not Google Fonts CDN (blocked in Iran) |
| Charts | Apache ECharts (via `echarts-for-react`) | Better RTL + Persian axis label support than Recharts |
| Calendar | `react-date-picker` + `date-fns-jalali` | Jalali calendar input/display |
| Forms | React Hook Form + Zod | Validation with Persian error messages |
| State | Zustand | Lightweight, no boilerplate |
| HTTP client | Axios | Interceptors for auth token handling |
| Tables | TanStack Table v8 | Virtualized rows for large trade lists |

### 3.2 Backend

| Concern | Choice | Notes |
|---|---|---|
| Runtime | Node.js 20 LTS | Stable, wide ecosystem |
| Framework | Express.js | Familiar, lightweight |
| Language | TypeScript | Shared types with frontend (monorepo) |
| Auth | JWT (access + refresh tokens) | No third-party auth service needed |
| File parsing | Custom MT4/MT5 parser module | See Section 6 |
| Job queue | BullMQ (Redis-backed) | For async file import processing |
| Validation | Zod | Schema validation on all API inputs |
| ORM | Prisma | Type-safe DB queries, easy migrations |
| API docs | Swagger / OpenAPI | Self-documenting |

### 3.3 Database — PostgreSQL Schema (core tables)

```sql
-- Users
users (id, email, phone, password_hash, name, plan, created_at)

-- Accounts (a user can have multiple broker accounts)
accounts (id, user_id, broker_name, account_number, currency, created_at)

-- Trades (core table)
trades (
  id, account_id, user_id,
  symbol,           -- e.g. XAUUSD, EURUSD
  direction,        -- BUY | SELL
  open_time,        -- UTC timestamp
  close_time,       -- UTC timestamp
  open_price,
  close_price,
  lot_size,
  stop_loss,
  take_profit,
  profit_usd,       -- raw P&L in USD
  commission,
  swap,
  pips,
  r_multiple,       -- calculated: profit / (entry - SL)
  tags,             -- text[]
  setup_id,         -- FK to setups
  emotion,          -- FOMO | CONFIDENT | NEUTRAL | ANXIOUS | REVENGE
  notes,            -- free text
  import_source,    -- MANUAL | MT4_CSV | MT4_HTM | MT5_CSV
  created_at
)

-- Setups (user-defined trade strategies/patterns)
setups (id, user_id, name, description, color, created_at)

-- Daily journal entries
journal_entries (id, user_id, date, body, mood, created_at)

-- Import jobs (track file upload status)
import_jobs (id, user_id, account_id, filename, status, rows_total, rows_imported, errors, created_at)

-- Subscriptions
subscriptions (id, user_id, plan, status, start_date, end_date, gateway_ref)
```

### 3.4 Infrastructure

| Service | Provider | Why |
|---|---|---|
| App server | Hetzner Cloud (Germany) | Cheap, reliable, accessible from Iran, not sanctioned |
| CDN | Arvan Cloud (ابر آروان) | Iranian CDN, keeps latency low inside Iran |
| DNS | Arvan Cloud | Same provider, integrated |
| Object storage | Arvan Cloud Object Storage (S3-compatible) | Store uploaded MT4 files |
| Email | Postal (self-hosted) or Mailgun EU | Transactional emails |
| SSL | Let's Encrypt via Caddy | Free, auto-renew |
| Reverse proxy | Caddy | Simpler than Nginx for this setup |

### 3.5 Payments

| Option | Provider | Notes |
|---|---|---|
| Primary | ZarinPal | Most widely used Iranian gateway, good API |
| Fallback | IDPay | Good alternative, similar API |
| Crypto (optional) | NOWPayments or CoinGate | For diaspora users or those preferring crypto |

---

## 4. Monorepo Structure

```
/
├── apps/
│   ├── web/                  # Next.js frontend
│   │   ├── app/              # App Router pages
│   │   │   ├── (auth)/       # login, register, forgot-password
│   │   │   ├── dashboard/    # main dashboard
│   │   │   ├── trades/       # trade list + detail
│   │   │   ├── journal/      # daily journal
│   │   │   ├── analytics/    # charts & reports
│   │   │   ├── import/       # MT4/MT5 file import
│   │   │   ├── settings/     # account, broker accounts, plan
│   │   │   └── layout.tsx    # RTL root layout
│   │   ├── components/
│   │   │   ├── ui/           # buttons, inputs, modals (RTL-aware)
│   │   │   ├── charts/       # ECharts wrappers
│   │   │   ├── trades/       # TradeCard, TradeTable, TradeForm
│   │   │   ├── analytics/    # WinRate, ProfitFactor, EquityCurve
│   │   │   └── layout/       # Sidebar, Header, BottomNav (mobile)
│   │   └── lib/
│   │       ├── api.ts        # Axios instance
│   │       ├── jalali.ts     # Jalali date helpers
│   │       └── formatters.ts # currency, pips, R formatters
│   │
│   └── api/                  # Express backend
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   ├── trades.ts
│       │   │   ├── accounts.ts
│       │   │   ├── analytics.ts
│       │   │   ├── import.ts
│       │   │   ├── journal.ts
│       │   │   └── payments.ts
│       │   ├── services/
│       │   │   ├── mt4Parser.ts      # MT4/MT5 file parser
│       │   │   ├── analytics.ts      # win rate, PF, R:R calc
│       │   │   ├── zarinpal.ts       # payment gateway
│       │   │   └── importQueue.ts    # BullMQ job processor
│       │   ├── middleware/
│       │   │   ├── auth.ts           # JWT verification
│       │   │   ├── rateLimit.ts
│       │   │   └── upload.ts         # Multer file handling
│       │   ├── prisma/
│       │   │   └── schema.prisma
│       │   └── index.ts
│       └── tsconfig.json
│
└── packages/
    ├── types/                # Shared TypeScript types (Trade, User, etc.)
    ├── validators/           # Shared Zod schemas
    └── constants/            # Shared enums (symbols, emotions, etc.)
```

---

## 5. Feature Breakdown — V1

### 5.1 Authentication
- Email/password registration + login
- Phone number (optional, Iranian mobile format: 09xx)
- JWT access token (15min) + refresh token (30 days) in httpOnly cookie
- Password reset via email

### 5.2 Manual Trade Entry
Fields:
- Symbol (searchable dropdown: XAUUSD, EURUSD, BTCUSD, etc.)
- Direction: خرید (BUY) / فروش (SELL)
- Open/close datetime (Jalali calendar picker, stored as UTC)
- Open/close price
- Lot size
- Stop loss / Take profit
- Commission + swap (auto-filled from broker defaults if set)
- Setup tag (from user's saved setups)
- Emotional state: آرام / اضطراب / انتقام / اعتماد / FOMO
- Free-text notes

### 5.3 MT4/MT5 Import
- Upload `.htm` (MT4 account statement) or `.csv` (MT4/MT5 export)
- Async processing via BullMQ queue
- Duplicate detection (match on open_time + symbol + open_price)
- Import preview before confirm
- Error report for unparseable rows
- Support both MT4 and MT5 export formats (different column structures)

### 5.4 Analytics Dashboard
All stats filterable by: date range, account, symbol, setup, direction

**Key metrics (top of page):**
- Win Rate (نرخ موفقیت)
- Profit Factor (ضریب سود)
- Average R:R (نسبت ریسک به ریوارد)
- Total P&L in USD + Toman equivalent
- Max Drawdown
- Total trades / Winning / Losing

**Charts:**
- Equity curve (line chart) — cumulative P&L over time
- P&L by day of week (bar) — best/worst days
- P&L by hour (heatmap) — best/worst sessions
- Win rate by symbol (horizontal bar)
- Win rate by setup (horizontal bar)
- Emotion vs. outcome (grouped bar — do you trade worse when anxious?)
- Monthly P&L calendar heatmap

### 5.5 Trade List & Detail
- Paginated, sortable, filterable table
- Columns: date (Jalali), symbol, direction, lot, P&L, pips, R, setup, tags
- Click row → trade detail page with full breakdown + notes editor
- Bulk tag / bulk delete

### 5.6 Daily Journal
- One entry per day (Jalali date)
- Rich text (simple — bold, lists, no image embeds in v1)
- Daily mood selector
- Shows that day's trades below the entry

### 5.7 Setup / Playbook
- User creates named setups (e.g. "شکست سطح مقاومت", "پولبک به میانگین")
- Each setup tracks aggregate stats: win rate, avg R, total trades
- Attach setups to trades during manual entry or post-import tagging

### 5.8 Payments & Plans

| Plan | قیمت (Toman) | Limits |
|---|---|---|
| رایگان (Free) | ۰ | 50 trades/month, 1 account, no MT4 import |
| استاندارد | ~۱۵۰,۰۰۰/month | Unlimited trades, 3 accounts, MT4 import |
| حرفه‌ای (Pro) | ~۳۵۰,۰۰۰/month | Everything + API access (future) |

Payment via ZarinPal. Monthly and annual (20% discount) options.

---

## 6. MT4/MT5 Parser — Detail

This is the most critical technical component. Two formats to support:

### MT4 Account Statement (.htm)
MT4 exports an HTML file. Parse with `node-html-parser` or `cheerio`.
Table structure:
```
Ticket | Open Time | Type | Size | Item | Price | S/L | T/P | Close Time | Price | Commission | Swap | Profit
```

### MT4 CSV Export
Tab or comma separated:
```
#,Time,Type,Size,Item,Price,S/L,T/P,Time,Price,Commission,Taxes,Swap,Profit
```

### MT5 CSV Export
Different column names:
```
Position,Symbol,Action,Volume,Open Time,Open Price,S/L,T/P,Close Time,Close Price,Commission,Swap,Profit,Comment
```

### Parser logic:
1. Detect format (MT4 HTM / MT4 CSV / MT5 CSV) from file extension + content sniff
2. Parse rows into internal `RawTrade` type
3. Validate: reject rows with missing open/close time or price
4. Calculate derived fields: pips, R multiple (if SL present)
5. Deduplicate against existing trades in DB
6. Return preview payload to frontend
7. On user confirmation, bulk insert via Prisma `createMany`

---

## 7. RTL & Persian UI Guidelines

- Root HTML: `<html dir="rtl" lang="fa">`
- Font: Load Vazirmatn via `@font-face` from `/public/fonts/` (no Google CDN)
- Numbers: Use Persian numerals (۱۲۳) for display, store as integers/floats
- Use `persianjs` or `digit-to-farsi` npm package for number conversion
- Jalali dates: `date-fns-jalali` for formatting, store all dates as UTC in DB
- All form labels, error messages, tooltips in Farsi
- ECharts: set `rtl: true` in chart config, use Vazirmatn as chart font

---

## 8. API Design (key endpoints)

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout

GET    /api/accounts
POST   /api/accounts
DELETE /api/accounts/:id

GET    /api/trades               ?page&limit&symbol&setup&direction&from&to
POST   /api/trades               (manual entry)
GET    /api/trades/:id
PUT    /api/trades/:id
DELETE /api/trades/:id
POST   /api/trades/bulk-tag

POST   /api/import/upload        (multipart file upload → returns job_id)
GET    /api/import/:jobId        (poll import job status + preview)
POST   /api/import/:jobId/confirm

GET    /api/analytics/summary    ?from&to&account
GET    /api/analytics/equity     ?from&to&account
GET    /api/analytics/by-symbol
GET    /api/analytics/by-hour
GET    /api/analytics/by-weekday
GET    /api/analytics/by-setup
GET    /api/analytics/by-emotion

GET    /api/journal/:date
PUT    /api/journal/:date

GET    /api/setups
POST   /api/setups
PUT    /api/setups/:id
DELETE /api/setups/:id

POST   /api/payments/checkout    (returns ZarinPal payment URL)
POST   /api/payments/verify      (ZarinPal callback)
GET    /api/payments/status
```

---

## 9. Development Phases

### Phase 1 — Foundation (2–3 weeks)
- Monorepo setup (Turborepo)
- DB schema + Prisma migrations
- Auth (register/login/JWT)
- RTL layout skeleton + Vazirmatn font
- Manual trade entry + trade list

### Phase 2 — Import & Analytics (2–3 weeks)
- MT4/MT5 parser + BullMQ import queue
- Analytics calculations (win rate, PF, drawdown, R:R)
- Equity curve + key charts
- Jalali calendar integration throughout

### Phase 3 — Journal, Setups, Polish (1–2 weeks)
- Daily journal
- Setup/playbook system
- Emotion tracking + emotion vs. outcome chart
- Mobile responsive (RTL-aware)

### Phase 4 — Payments & Launch (1 week)
- ZarinPal integration
- Plan enforcement (middleware)
- Arvan Cloud CDN setup
- Beta launch

**Total estimated timeline: 6–9 weeks solo**

---

## 10. Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| MT4 format variations between brokers | Collect sample exports from Amarkets, LiteFinance, Errante — test parser against all |
| Site blocked inside Iran | Use Arvan Cloud CDN + monitor with Iranian VPN |
| ZarinPal requires Iranian company registration | Register as a sole proprietor (شخص حقیقی) or partner with someone who has a registered business |
| Sanctions — Hetzner ToS | Hetzner serves Iranian customers; review ToS, don't mention Iran-specific use in support tickets |
| Low trust from Iranian users for a new platform | Open beta, no credit card required, transparent about data storage location |

---

## 11. Suggested Next Steps

1. **Set up monorepo** with Turborepo + Next.js + Express + Prisma
2. **Build the MT4 parser first** — it's the riskiest unknown; validate it works with real broker exports before building the full UI around it
3. **Design the RTL UI system** — get the font, direction, and component library locked in early so you don't refactor later
4. **Manual trade entry as the MVP loop** — even before MT4 import, a working manual entry → analytics flow lets you start testing with real users

---

*Document version: 1.0 — June 2026*
