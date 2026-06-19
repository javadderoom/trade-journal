# API Progress — معامله‌یار

## Tech Stack
- **Runtime:** Node.js + Express 5
- **Database:** PostgreSQL via Prisma 7 ORM (`src/prisma/schema.prisma`)
- **DB adapter:** `@prisma/adapter-pg` (PrismaPg driver adapter — Prisma 7 pattern, no direct `url` in schema)
- **Key deps:** `node-html-parser`, `csv-parser`, `express@5`, `@prisma/client`, `pg`, `dotenv`

---

## ✅ Done

### Database Schema (`src/prisma/schema.prisma`)
- 6 models: `User`, `Account`, `Trade`, `JournalEntry`, `ImportJob`, `Subscription`
- Enums: `Plan`, `Emotion`, `Mood`, `Direction`, `ImportSource` (incl. `MT5_EA`), `ImportStatus`, `SubscriptionStatus`
- `Trade` model has `ticket` (Int?) with `@@unique([account_id, ticket])` for MT5 deduplication
- `Trade.tags` field (String[]) for per-trade tags
- `Setup` model **removed** — migration `20260618192211_remove_setup` dropped `Setup` table and `Trade.setup_id` FK
- **Prisma 7 note:** `url` moved to `prisma.config.ts` (`PrismaPg` adapter reads `DATABASE_URL` from env). Generate with:
  `npx prisma generate --schema apps/api/src/prisma/schema.prisma --config apps/api/src/prisma/prisma.config.ts`
- **Migrate script:** `npm run --workspace=api prisma:migrate` (runs `prisma migrate dev --config=src/prisma/prisma.config.ts`)

### Express Server (`src/server.ts`)
- CORS enabled (all origins), JSON body parsing (10MB limit)
- Health check: `GET /api/health`
- Trade router mounted at `/api/trades`
- Env loaded via `dotenv/config`

### MT4/MT5 Parser (`src/services/mt4Parser.ts`)
- Parses MT4 HTML, MT4 CSV (tab-delimited), MT5 CSV (comma-delimited) — auto-detects format via content sniffing
- Calculates derived fields: pips (assumes 5-digit pricing) and R-multiple (from SL distance)
- Export: `parseTrades(file: MulterFile) → ParsedTrade[]`

### Trade Sync Service (`src/services/tradeSync.ts`)
- `syncTradesFromEA(userId, accountId, trades[])` — 3-way upsert by `(account_id, ticket)`:
  - **Not found** → CREATE (new trade, open or closed)
  - **Exists + open in DB** → UPDATE (refresh SL/TP/profit if still open, or finalize with close data)
  - **Exists + closed in DB** → SKIP (already final)
- `getTradesForAccount({ userId, accountId, limit?, offset? })` — returns paginated trade list (max 500, default 100)
- Uses `PrismaPg` adapter (reads `DATABASE_URL` from env)
- Creates user/account if missing (dev mode)

### Trade Routes (`src/routes/tradeSync.ts`) — mounted at `/api/trades`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/trades` | List trades for account (query: `userId`, `accountId`, `limit`, `offset`) |
| `POST` | `/api/trades/sync` | Sync trades from MT5 EA (accepts EA array or `{ userId, accountId, trades }`) |
| `PUT` | `/api/trades/:ticket` | Update trade: `notes`, `emotion`, `stopLoss`, `takeProfit`, `tags` |
| `DELETE` | `/api/trades/:ticket` | Delete trade by ticket |

- `PUT` recalculates `r_multiple` when `stopLoss` is updated
- `PUT` saves `tags` array directly to `Trade.tags`
- `PUT` does **not** handle `setupName` — strategy entity was decommissioned
- Dev mode: no auth — defaults to `userId=dev-user`, `accountId=dev-account`

### TypeScript
- `tsconfig.json` at API root. All type errors resolved.
- Shared types in `src/types/` (`TradeData`, `SyncResult`, `MulterFile`, `ImportSource`, `TradeDirection`)

---

## ❌ Not Done (Next Steps)

### High Priority
- **Persistent tags library** — no dedicated tags table; tags live only on trade records. A user-level tag pool that survives tag removal from all trades is needed
- **Auth** — JWT/session, phone OTP for Iran. Currently all endpoints are unauthenticated dev-mode
- **Multer upload middleware** — file-based MT4/MT5 HTML/CSV import via browser (parser exists, no upload route)

### Medium Priority
- `GET /api/trades/:ticket` — single trade detail endpoint
- Journal entries CRUD (`JournalEntry` model exists, no routes)
- Analytics endpoints (win rate, P&L over time, emotion breakdown)
- Error handling middleware (global Express error handler)
- Strategy/setup system — `Setup` model was removed; if re-needed, consider a simpler approach (e.g., string field on Trade or a tags-based strategy system)

### Low Priority
- Subscription / payment gateway (Iran-native)
- API tests
- `csv-parser` dep is installed but not used (MT4 CSV parsing uses manual string splitting)
