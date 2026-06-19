import { Router, Request, Response } from 'express';
import { getTradesForAccount, syncTradesFromEA, prisma } from '../services/tradeSync';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const router = Router();

/**
 * POST /api/trades/sync
 * Receives trade data from MT5 Expert Advisor and stores in DB.
 *
 * Body: { userId: string, accountId: string, trades: EATrade[] }
 * Or:   EATrade[] (defaults to first user/account for development)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const body = req.query as any;

    // Development defaults (no auth in this repo yet)
    const userId = (body.userId as string | undefined) || 'dev-user';
    const accountId = (body.accountId as string | undefined) || 'dev-account';

    const limitRaw = body.limit as string | undefined;
    const offsetRaw = body.offset as string | undefined;

    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
    const offset = offsetRaw ? Number.parseInt(offsetRaw, 10) : undefined;

    const items = await getTradesForAccount({ userId, accountId, limit, offset });

    res.status(200).json({
      items,
      limit: limit ?? 100,
      offset: offset ?? 0,
      count: items.length,
    });
  } catch (err: any) {
    console.error('Trade list error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * POST /api/trades/sync
 * Receives trade data from MT5 Expert Advisor and stores in DB.
 *
 * Body: { userId: string, accountId: string, trades: EATrade[] }
 * Or:   EATrade[] (defaults to first user/account for development)
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    /**
     * Supported request payloads:
     * 1) EA format: EATrade[]  (array root)
     * 2) Web/API format: { userId?: string, accountId?: string, trades: TradeData[] }
     */
    const body = req.body as any;

    const trades: any[] = Array.isArray(body)
      ? body
      : (Array.isArray(body?.trades) ? body.trades : []);

    if (!Array.isArray(trades) || trades.length === 0) {
      res.status(400).json({
        error: 'trades array is required and must not be empty',
        hint: 'Send either an array payload (EA) or { userId, accountId, trades } (web/API).',
      });
      return;
    }

    const targetUserId = Array.isArray(body) ? 'dev-user' : (body?.userId || 'dev-user');
    const targetAccountId = Array.isArray(body) ? 'dev-account' : (body?.accountId || 'dev-account');

    const result = await syncTradesFromEA(targetUserId, targetAccountId, trades);

    res.status(201).json({
      message: `Synced ${result.created} new trades`,
      ...result,
    });
  } catch (err: any) {
    console.error('Trade sync error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * PUT /api/trades/:ticket
 * Updates trade notes, emotion, setup, stop_loss, and take_profit.
 */
router.put('/:ticket', async (req: Request, res: Response) => {
  try {
    const ticket = Number.parseInt(req.params.ticket as string, 10);
    if (Number.isNaN(ticket)) {
      res.status(400).json({ error: 'Invalid ticket' });
      return;
    }

    const { notes, emotion, stopLoss, takeProfit, tags } = req.body;

    const existing = await prisma.trade.findFirst({
      where: { ticket },
    });

    if (!existing) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }

    // Setup database lookup removed - strategy entity decommissioned

    // Recalculate r_multiple when stop_loss is modified
    let rMultipleUpdate: number | undefined = undefined;
    if (stopLoss !== undefined) {
      const stopLossVal = stopLoss === null ? null : parseFloat(stopLoss);
      if (stopLossVal && stopLossVal > 0 && existing.open_price) {
        const isBuy = existing.direction === 'BUY';
        const risk = isBuy ? (existing.open_price - stopLossVal) : (stopLossVal - existing.open_price);
        if (risk > 0) {
          const exitPrice = existing.close_price ?? existing.open_price;
          const reward = isBuy ? (exitPrice - existing.open_price) : (existing.open_price - exitPrice);
          rMultipleUpdate = reward / risk;
        } else {
          rMultipleUpdate = 0;
        }
      } else {
        // Clear R value to 0 if stop loss is removed
        rMultipleUpdate = 0;
      }
    }

    const updated = await prisma.trade.update({
      where: { id: existing.id },
      data: {
        notes: notes !== undefined ? notes : undefined,
        emotion: emotion !== undefined ? emotion : undefined,
        stop_loss: stopLoss !== undefined ? (stopLoss === null ? null : parseFloat(stopLoss)) : undefined,
        take_profit: takeProfit !== undefined ? (takeProfit === null ? null : parseFloat(takeProfit)) : undefined,
        r_multiple: rMultipleUpdate !== undefined ? rMultipleUpdate : undefined,
        tags: tags !== undefined ? tags : undefined,
      },
    });

    res.status(200).json(updated);
  } catch (err: any) {
    console.error('Update trade error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * DELETE /api/trades/:ticket
 * Deletes a trade by ticket.
 */
router.delete('/:ticket', async (req: Request, res: Response) => {
  try {
    const ticket = Number.parseInt(req.params.ticket as string, 10);
    if (Number.isNaN(ticket)) {
      res.status(400).json({ error: 'Invalid ticket' });
      return;
    }

    const existing = await prisma.trade.findFirst({
      where: { ticket },
    });

    if (!existing) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }

    await prisma.trade.delete({
      where: { id: existing.id },
    });

    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Delete trade error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});


// Ensure uploads/screenshots folder exists dynamically
const uploadDir = path.join(__dirname, '../../uploads/screenshots');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${crypto.randomUUID()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // limit 10MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpg, jpeg, png, gif, webp) are allowed'));
  },
});

/**
 * POST /api/trades/:ticket/screenshots
 * Uploads a screenshot for a trade and appends its URL to the screenshots list.
 */
router.post('/:ticket/screenshots', upload.single('screenshot'), async (req: Request, res: Response) => {
  try {
    const ticket = Number.parseInt(req.params.ticket as string, 10);
    if (Number.isNaN(ticket)) {
      res.status(400).json({ error: 'Invalid ticket' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const trade = await prisma.trade.findFirst({
      where: { ticket },
    });

    if (!trade) {
      // Remove uploaded file if trade is not found
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(404).json({ error: 'Trade not found' });
      return;
    }

    const relativeUrl = `/uploads/screenshots/${req.file.filename}`;
    const updatedScreenshots = [...trade.screenshots, relativeUrl];

    await prisma.trade.update({
      where: { id: trade.id },
      data: {
        screenshots: updatedScreenshots,
      },
    });

    res.status(200).json({ screenshots: updatedScreenshots });
  } catch (err: any) {
    console.error('Screenshot upload error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * DELETE /api/trades/:ticket/screenshots
 * Deletes a screenshot for a trade from disk and DB.
 */
router.delete('/:ticket/screenshots', async (req: Request, res: Response) => {
  try {
    const ticket = Number.parseInt(req.params.ticket as string, 10);
    if (Number.isNaN(ticket)) {
      res.status(400).json({ error: 'Invalid ticket' });
      return;
    }

    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: 'Screenshot URL is required' });
      return;
    }

    const trade = await prisma.trade.findFirst({
      where: { ticket },
    });

    if (!trade) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }

    // Filter out the URL from the screenshots list
    const updatedScreenshots = trade.screenshots.filter(s => s !== url);

    // Delete the file from the filesystem if it belongs to this trade's uploads
    if (url.startsWith('/uploads/screenshots/')) {
      const filename = url.replace('/uploads/screenshots/', '');
      const filepath = path.join(__dirname, '../../uploads/screenshots', filename);
      if (fs.existsSync(filepath)) {
        try {
          fs.unlinkSync(filepath);
        } catch (e) {
          console.error(`Failed to delete file from disk: ${filepath}`, e);
        }
      }
    }

    await prisma.trade.update({
      where: { id: trade.id },
      data: {
        screenshots: updatedScreenshots,
      },
    });

    res.status(200).json({ screenshots: updatedScreenshots });
  } catch (err: any) {
    console.error('Screenshot deletion error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router;
