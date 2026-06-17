# معامله‌یار — Run Commands

## Prerequisites
- Node.js 18+
- Docker Desktop running
- MetaTrader 5 (for EA)

## 1. Start Database
```bash
cd g:\Code\trade-journal
docker-compose up -d
```
PostgreSQL runs on port **5433**.

## 2. Run Database Migrations
```bash
npm run --workspace=api prisma:migrate
```

## 3. Generate Prisma Client
```bash
npx prisma generate --schema apps/api/src/prisma/schema.prisma --config apps/api/src/prisma/prisma.config.ts
```



## 3. Start API Server (port 3000)
```bash
npx ts-node apps/api/src/server.ts
```

## 4. Start Web App (port 3001)
```bash
npx next dev apps/web --port 3001
```

## 5. Install MT5 Expert Advisor
1. Copy `apps/ea/TradeJournal_EA.mq5` to `MQL5/Experts/`
2. Open in MetaEditor → Compile
3. In MT5: Tools → Options → Expert Advisors → Allow WebRequest for `http://localhost:3000`
4. Drag EA onto any chart

## Quick Start (All at Once)
Open 3 terminals and run:
```bash
# Terminal 1 - Database
docker-compose up -d

# Terminal 2 - API
npx ts-node apps/api/src/server.ts

# Terminal 3 - Web
npx next dev apps/web --port 3001
```

## Endpoints
- Health: `GET http://localhost:3000/api/health`
- Trade Sync: `POST http://localhost:3000/api/trades/sync`
- Web App: `http://localhost:3001`
