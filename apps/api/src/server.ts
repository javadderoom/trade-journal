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

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// CORS — allow credentials and dynamically match request origin
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
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
app.use('/api/trades', tradeSyncRouter);
app.use('/api/journal', journalRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/payments', paymentsRouter);

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

// Start server
app.listen(PORT, () => {
  console.log(`معامله‌یار API running on http://localhost:${PORT}`);
  console.log(`Trade sync endpoint: POST http://localhost:${PORT}/api/trades/sync`);
});

export default app;