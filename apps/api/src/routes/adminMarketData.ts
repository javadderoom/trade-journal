import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  refreshAllHistoricalData,
  refreshSymbolData,
  getCandleCacheStatus,
  getJobStatus,
} from '../services/historicalDataCron';
import { SUPPORTED_SYMBOLS, SUPPORTED_TIMEFRAMES } from '../config/symbols';

const router = Router();

// All routes require admin auth
router.use(authenticate);
router.use((req: AuthRequest, res: Response, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
});

/**
 * GET /api/admin/market-data/status
 * Returns freshness info for all cached symbols.
 */
router.get('/status', async (_req, res) => {
  try {
    const status = await getCandleCacheStatus();
    const jobStatus = getJobStatus();

    res.json({
      symbols: SUPPORTED_SYMBOLS.map(s => ({ name: s.name, provider: s.provider, category: s.category })),
      timeframes: [...SUPPORTED_TIMEFRAMES],
      cache: status,
      job: jobStatus,
      totalPairs: SUPPORTED_SYMBOLS.length * SUPPORTED_TIMEFRAMES.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/market-data/refresh
 * Trigger manual refresh.
 * Body: { symbol?: string, timeframes?: string[] }
 */
router.post('/refresh', async (req, res) => {
  try {
    const { symbol, timeframes } = req.body;

    if (symbol) {
      // Refresh specific symbol
      const result = await refreshSymbolData(symbol, timeframes);
      res.json({ message: `Refresh triggered for ${symbol}`, result });
    } else {
      // Refresh all
      // Run in background so we don't block the response
      res.json({ message: 'Full refresh triggered. Check /status for progress.' });
      refreshAllHistoricalData().catch(err => {
        console.error('[Admin] Background refresh failed:', err);
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/market-data/refresh/status
 * Get current job status.
 */
router.get('/refresh/status', (_req, res) => {
  res.json(getJobStatus());
});

export default router;
