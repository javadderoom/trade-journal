import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import { prisma } from './services/tradeSync';
import tradeSyncRouter from './routes/tradeSync';
import authRouter from './routes/auth';
import accountTokensRouter from './routes/accountTokens';
import journalRouter from './routes/journal';
import dashboardRouter from './routes/dashboard';
import settingsRouter from './routes/settings';
import paymentsRouter from './routes/payments';
import adminRouter from './routes/admin';
import tradeExportRouter from './routes/tradeExport';
import cryptoSyncRouter from './routes/cryptoSync';
import { syncExchangeTrades } from './services/ccxtSync';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// CORS — allow only trusted origins
const ALLOWED_ORIGINS: (string | RegExp)[] = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// In development, allow localhost on any port
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push(/^http:\/\/localhost:\d+$/);
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    const allowed = ALLOWED_ORIGINS.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });
    if (allowed) {
      res.header('Access-Control-Allow-Origin', origin);
    }
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-token');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api', accountTokensRouter);
app.use('/api/trades/export', tradeExportRouter);
app.use('/api/trades', tradeSyncRouter);
app.use('/api/journal', journalRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/crypto', cryptoSyncRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cron job: Daily clean up expired refresh tokens at 03:00 AM
cron.schedule('0 3 * * *', async () => {
  try {
    const deleted = await prisma.refreshToken.deleteMany({
      where: { expires_at: { lt: new Date() } },
    });
    console.log(`[Cron] Cleared ${deleted.count} expired refresh tokens.`);
  } catch (err) {
    console.error('[Cron] Failed to clean up expired refresh tokens:', err);
  }
});

// Cron job: Sync exchange connections based on subscription plan rates
// Pro: every 5 minutes, Standard: every 1 hour
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('[Cron] Starting exchange connections sync...');
    const activeConnections = await prisma.exchangeConnection.findMany({
      where: { is_active: true },
      include: {
        account: {
          include: {
            user: true
          }
        }
      }
    });

    for (const conn of activeConnections) {
      try {
        const plan = conn.account.user.plan;

        if (plan === 'FREE') {
          // Skip FREE users in background sync
          continue;
        }

        const lastSync = conn.account.last_sync_at;
        const now = new Date();

        if (plan === 'STANDARD') {
          const oneHourAgo = new Date(now.getTime() - 55 * 60 * 1000); // 55 mins threshold for hourly standard sync
          if (lastSync && lastSync > oneHourAgo) {
            // Not enough time has elapsed for Standard plan users
            continue;
          }
        }

        // PRO users sync every 5 minutes (every cron run)
        console.log(`[Cron] Syncing trades for account ${conn.account_id} (${conn.exchange_id}) - Plan: ${plan}...`);
        const syncRes = await syncExchangeTrades(conn.account.user_id, conn.account_id);
        console.log(`[Cron] Sync finished for account ${conn.account_id}: created ${syncRes.created}, skipped ${syncRes.skipped}`);
      } catch (syncErr: any) {
        console.error(`[Cron] Failed to sync exchange connection for account ${conn.account_id}:`, syncErr);
      }
    }
  } catch (err) {
    console.error('[Cron] Exchange sync scheduler failed:', err);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`معامله‌یار API running on http://localhost:${PORT}`);
  console.log(`Trade sync endpoint: POST http://localhost:${PORT}/api/trades/sync`);
});

export default app;