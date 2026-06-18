# API Progress — معامله‌یار

## Tech Stack
- **Runtime:** Node.js + Express
- **Database:** PostgreSQL via Prisma 7 ORM (`src/prisma/schema.prisma`)
- **Key deps:** `node-html-parser`, `csv-parser`, `express`, `@prisma/client`

---

## ✅ Done

### Database Schema (`src/prisma/schema.prisma`)
- 7 models: `User`, `Account`, `Trade`, `Setup`, `JournalEntry`, `ImportJob`, `Subscription`
- Enums: `Plan`, `Emotion`, `Mood`, `Direction`, `ImportSource` (incl. `MT5_EA`), `ImportStatus`, `SubscriptionStatus`
- `Trade` model has `ticket` (Int?) with `@@unique([account_id, ticket])` for MT5 deduplication
- `Trade.tags` field (String[]) for per-trade tags
- **Prisma 7 note:** `url` moved to `prisma.config.ts`. Generate with:
  `npx prisma generate --schema apps/api/src/prisma/schema.prisma`

### Express Server (`src/server.ts`)
- CORS enabled, JSON body parsing
- Health check: `GET /api/health`
- Trade router mounted at `/api/trades`

### MT4/MT5 Parser (`src/services/mt4Parser.ts`)
- Parses MT4 HTML, MT4 CSV (tab-delimited), MT5 CSV (comma-delimited) — auto-detects format
- Export: `parseTrades(file: MulterFile) → ParsedTrade[]`

### Trade Sync Service (`src/services/tradeSync.ts`)
- `syncTradesFromEA(userId, accountId, trades[])` — upserts trades by `(account_id, ticket)`, creates user/account if missing (dev mode)
- `getTradesForAccount({ userId, accountId, limit?, offset? })` — returns paginated trade list with `setupName` resolved from joined `Setup`

### Trade Routes (`src/routes/tradeSync.ts`) — mounted at `/api/trades`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/trades` | List trades for account (query: `userId`, `accountId`, `limit`, `offset`) |
| `POST` | `/api/trades/sync` | Sync trades from MT5 EA (accepts EA array or `{ userId, accountId, trades }`) |
| `PUT` | `/api/trades/:ticket` | Update trade: `notes`, `emotion`, `setupName`, `stopLoss`, `takeProfit`, `tags` |
| `DELETE` | `/api/trades/:ticket` | Delete trade by ticket |

- `PUT` auto-creates `Setup` record if `setupName` is new
- `PUT` recalculates `r_multiple` when `stopLoss` is updated
- `PUT` saves `tags` array directly to `Trade.tags`
- Dev mode: no auth — defaults to `userId=dev-user`, `accountId=dev-account`

### TypeScript
- `tsconfig.json` at project root (shared). All type errors resolved.

---

## ❌ Not Done (Next Steps)

### High Priority
- **Persistent tags library** — no dedicated tags table; tags live only on trade records. A user-level tag pool that survives tag removal from all trades is needed
- **Auth** — JWT/session, phone OTP for Iran. Currently all endpoints are unauthenticated dev-mode
- **Multer upload middleware** — file-based MT4/MT5 HTML/CSV import via browser

### Medium Priority
- `GET /api/trades/:ticket` — single trade detail endpoint
- Journal entries CRUD (`JournalEntry` model exists, no routes)
- Analytics endpoints (win rate, P&L over time, emotion breakdown)
- Setup management endpoints (list/create/delete strategies)
- Error handling middleware (global Express error handler)

### Low Priority
- Subscription / payment gateway (Iran-native)
- Prisma migrations (need PostgreSQL running; currently schema only)
- API tests
