# API Progress — معامله‌یار

## Tech Stack
- **Runtime:** Node.js + Express
- **Database:** PostgreSQL via Prisma 7 ORM (`src/prisma/schema.prisma`)
- **Key deps:** `node-html-parser`, `csv-parser`, `express`, `@prisma/client`

## What's Done

### Database Schema (`prisma/schema.prisma`)
7 models: User, Account, Trade, Setup, JournalEntry, ImportJob, Subscription
Enums: Plan, Emotion, Mood, Direction, ImportSource (incl. MT5_EA), ImportStatus, SubscriptionStatus

**Trade model** has `ticket` field (Int?) with `@@unique([account_id, ticket])` for MT5 deduplication.

**Prisma 7 note:** `url` moved to `prisma.config.ts` (not in schema). Generate with: `npx prisma generate --schema apps/api/src/prisma/schema.prisma`

### MT4/MT5 Parser (`services/mt4Parser.ts`)
Parses MT4 HTML, MT4 CSV (tab-delimited), MT5 CSV (comma-delimited). Auto-detects format.
**Export:** `parseTrades(file: MulterFile) → ParsedTrade[]`

### Trade Sync from MT5 EA (`services/tradeSync.ts` + `routes/tradeSync.ts`)
- `POST /api/trades/sync` — receives JSON array of trades from EA
- Deduplicates by `(account_id + ticket)`
- Creates Trade records via Prisma with `import_source: MT5_EA`

### Express Server (`server.ts`)
Minimal server with CORS, JSON parsing, health check at `/api/health`.
Run: `npx ts-node apps/api/src/server.ts` (or compile first)

### TypeScript
`tsconfig.json` at project root. All type errors resolved (as of 2026-06-17).

## What's NOT Done (Next Steps)
- Auth (JWT/session, phone OTP for Iran) — currently dev-mode (no auth)
- Multer upload middleware for file-based imports
- REST endpoints: trades CRUD, journal, analytics, setups
- Subscription/payment gateway (Iran-native)
- Error handling middleware
- API tests
- Prisma migrations (need PostgreSQL running)
