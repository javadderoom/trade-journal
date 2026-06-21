import { Router, Request, Response } from 'express';
import { getTradesForAccount, syncTradesFromEA, prisma } from '../services/tradeSync';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { parse as parseHtml } from 'node-html-parser';

const router = Router();

/**
 * POST /api/trades/sync
 * Receives trade data from MT5 Expert Advisor and stores in DB.
 *
 * Body: { userId: string, accountId: string, trades: EATrade[] }
 * Or:   EATrade[] (defaults to first user/account for development)
 */
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'dev-user';

    // Auto-create dev-user if not exists (development mode)
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          password_hash: 'dev-hash',
          name: userId,
        },
      });
    }

    // Auto-create default account if no accounts exist
    let accounts = await prisma.account.findMany({
      where: { user_id: userId },
    });

    if (accounts.length === 0) {
      const defaultAccount = await prisma.account.create({
        data: {
          id: 'dev-account',
          user_id: userId,
          broker_name: 'MT5 پیش‌فرض',
          account_number: '123456',
        },
      });
      accounts = [defaultAccount];
    }

    res.status(200).json(accounts);
  } catch (err: any) {
    console.error('Accounts list error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const body = req.query as any;

    // Development defaults (no auth in this repo yet)
    const userId = (body.userId as string | undefined) || 'dev-user';
    const accountId = (body.accountId as string | undefined) || 'all';

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
 * POST /api/trades
 * Manually logs a new trade.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      symbol,
      direction,
      lotSize,
      openPrice,
      openTime,
      stopLoss,
      takeProfit,
      closePrice,
      closeTime,
      profitUsd,
      commission,
      swap,
    } = req.body;

    // Development defaults (no auth in this repo yet)
    const userId = req.body.userId || 'dev-user';
    const accountId = req.body.accountId || 'dev-account';

    // 1. Validation
    if (!symbol || !direction || !lotSize || !openPrice || !openTime) {
      res.status(400).json({ error: 'Missing required trade fields' });
      return;
    }

    // Ensure direction is BUY or SELL
    if (direction !== 'BUY' && direction !== 'SELL') {
      res.status(400).json({ error: 'Direction must be BUY or SELL' });
      return;
    }

    const openPriceNum = parseFloat(openPrice);
    const lotSizeNum = parseFloat(lotSize);
    const stopLossNum = stopLoss ? parseFloat(stopLoss) : null;
    const takeProfitNum = takeProfit ? parseFloat(takeProfit) : null;
    const closePriceNum = closePrice ? parseFloat(closePrice) : null;
    const profitUsdNum = profitUsd ? parseFloat(profitUsd) : 0;
    const commissionNum = commission ? parseFloat(commission) : 0;
    const swapNum = swap ? parseFloat(swap) : 0;

    // 2. Calculate Pips
    // Standard currency pairs (5 digits): EURUSD, GBPUSD -> 1 pip = 0.0001
    // Yen pairs (3 digits): USDJPY, EURJPY -> 1 pip = 0.01
    // Crypto (2 digits): BTCUSD -> 1 pip = 1.0
    // Gold (2 digits): XAUUSD -> 1 pip = 0.1
    let digits = 5;
    const sym = symbol.toUpperCase();
    if (sym.includes('JPY')) {
      digits = 3;
    } else if (sym.includes('BTC') || sym.includes('ETH')) {
      digits = 2;
    } else if (sym.includes('XAU') || sym.includes('GOLD')) {
      digits = 2;
    }

    let pipSize = Math.pow(10, -digits);
    if (digits === 3 || digits === 5) {
      pipSize *= 10;
    }

    let pips = 0;
    if (closePriceNum !== null) {
      if (direction === 'BUY') {
        pips = (closePriceNum - openPriceNum) / pipSize;
      } else {
        pips = (openPriceNum - closePriceNum) / pipSize;
      }
    }

    // 3. Calculate Risk to Reward (R-multiple)
    let rMultiple = 0;
    if (stopLossNum && stopLossNum > 0) {
      const risk = direction === 'BUY' ? (openPriceNum - stopLossNum) : (stopLossNum - openPriceNum);
      if (risk > 0) {
        const exitPrice = closePriceNum !== null ? closePriceNum : openPriceNum;
        const reward = direction === 'BUY' ? (exitPrice - openPriceNum) : (openPriceNum - exitPrice);
        rMultiple = reward / risk;
      }
    }

    // 4. Save to Database
    const newTrade = await prisma.trade.create({
      data: {
        account_id: accountId,
        user_id: userId,
        symbol: sym,
        direction: direction as any,
        open_time: new Date(openTime),
        close_time: closeTime ? new Date(closeTime) : null,
        open_price: openPriceNum,
        close_price: closePriceNum,
        lot_size: lotSizeNum,
        stop_loss: stopLossNum,
        take_profit: takeProfitNum,
        profit_usd: profitUsdNum,
        commission: commissionNum,
        swap: swapNum,
        pips: pips,
        r_multiple: rMultiple,
        import_source: 'MANUAL',
        ticket: null,
      },
    });

    res.status(201).json(newTrade);
  } catch (err: any) {
    console.error('Create manual trade error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * PUT /api/trades/:id
 * Updates trade notes, emotion, setup, stop_loss, and take_profit.
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { notes, emotion, stopLoss, takeProfit, tags, accountId } = req.body;

    const existing = await prisma.trade.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }

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
        rMultipleUpdate = 0;
      }
    }

    const updated = await prisma.trade.update({
      where: { id },
      data: {
        account_id: accountId !== undefined ? accountId : undefined,
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
 * POST /api/trades/bulk-delete
 * Deletes multiple trades by their IDs.
 */
router.post('/bulk-delete', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'IDs array is required and must not be empty' });
      return;
    }

    const result = await prisma.trade.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    res.status(200).json({ success: true, count: result.count });
  } catch (err: any) {
    console.error('Bulk delete error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * GET /api/trades/tags
 * Fetches all persistent user-specific tags from database.
 */
router.get('/tags', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'dev-user';
    const tags = await prisma.tag.findMany({
      where: { user_id: userId },
      orderBy: { name: 'asc' },
    });
    res.status(200).json(tags);
  } catch (err: any) {
    console.error('Fetch tags error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * POST /api/trades/tags
 * Creates/persists a custom tag in the user's library.
 */
router.post('/tags', async (req: Request, res: Response) => {
  try {
    const { name, is_ignored, show_first } = req.body;
    const userId = req.body.userId || 'dev-user';

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Tag name is required' });
      return;
    }

    const cleanName = name.trim();

    const tag = await prisma.tag.upsert({
      where: {
        user_id_name: {
          user_id: userId,
          name: cleanName,
        },
      },
      create: {
        user_id: userId,
        name: cleanName,
        is_ignored: is_ignored !== undefined ? Boolean(is_ignored) : false,
        show_first: show_first !== undefined ? Boolean(show_first) : false,
      },
      update: {
        is_ignored: is_ignored !== undefined ? Boolean(is_ignored) : undefined,
        show_first: show_first !== undefined ? Boolean(show_first) : undefined,
      },
    });

    res.status(201).json(tag);
  } catch (err: any) {
    console.error('Create tag error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * PUT /api/trades/tags/:name
 * Updates options (is_ignored, show_first) for a specific tag.
 */
router.put('/tags/:name', async (req: Request, res: Response) => {
  try {
    const name = req.params.name as string;
    const { is_ignored, show_first } = req.body;
    const userId = req.body.userId || 'dev-user';

    const updated = await prisma.tag.update({
      where: {
        user_id_name: {
          user_id: userId,
          name: name,
        },
      },
      data: {
        is_ignored: is_ignored !== undefined ? Boolean(is_ignored) : undefined,
        show_first: show_first !== undefined ? Boolean(show_first) : undefined,
      },
    });

    res.status(200).json(updated);
  } catch (err: any) {
    console.error('Update tag error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * DELETE /api/trades/tags/:name
 * Deletes a tag from the user's persistent library.
 */
router.delete('/tags/:name', async (req: Request, res: Response) => {
  try {
    const name = req.params.name as string;
    const userId = (req.query.userId as string) || 'dev-user';

    await prisma.tag.deleteMany({
      where: {
        user_id: userId,
        name: name,
      },
    });

    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Delete tag error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});



/**
 * DELETE /api/trades/:id
 * Deletes a trade by ID.
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.trade.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }

    await prisma.trade.delete({
      where: { id },
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
 * POST /api/trades/:id/screenshots
 * Uploads a screenshot for a trade and appends its URL to the screenshots list.
 */
router.post('/:id/screenshots', upload.single('screenshot'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const trade = await prisma.trade.findUnique({
      where: { id },
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
      where: { id },
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
 * DELETE /api/trades/:id/screenshots
 * Deletes a screenshot for a trade from disk and DB.
 */
router.delete('/:id/screenshots', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: 'Screenshot URL is required' });
      return;
    }

    const trade = await prisma.trade.findUnique({
      where: { id },
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
      where: { id },
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

const uploadMemory = multer({ storage: multer.memoryStorage() });

function parseMT4Date(dateStr: string): Date | null {
  const cleanStr = dateStr.trim();
  if (!cleanStr) return null;

  // Try standard JS date parser first (replace dot separators if any)
  const stdDate = new Date(cleanStr.replace(/\./g, '/'));
  if (!isNaN(stdDate.getTime())) return stdDate;

  // Custom parsing logic for safety
  const parts = cleanStr.split(/\s+/);
  if (parts.length < 2) return null;

  const dateParts = parts[0].split(/[\.\-\/]/);
  const timeParts = parts[1].split(':');
  if (dateParts.length < 3 || timeParts.length < 2) return null;

  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
  const day = parseInt(dateParts[2], 10);

  const hour = parseInt(timeParts[0], 10);
  const minute = parseInt(timeParts[1], 10);
  const second = timeParts.length > 2 ? parseInt(timeParts[2], 10) : 0;

  const d = new Date(year, month, day, hour, minute, second);
  return isNaN(d.getTime()) ? null : d;
}

function findHeaderMapping(cells: string[]): Record<string, number> | null {
  const mapping: Record<string, number> = {};
  const headers = cells.map(c => c.toLowerCase().trim());

  // Find ticket/order index
  const ticketIdx = headers.findIndex(h => h === 'ticket' || h === 'order' || h === 'deal' || h === 'position');
  if (ticketIdx !== -1) mapping['ticket'] = ticketIdx;

  // Find symbol/item index
  const symbolIdx = headers.findIndex(h => h === 'symbol' || h === 'item' || h === 'instrument');
  if (symbolIdx !== -1) mapping['symbol'] = symbolIdx;

  // Find type/action index
  const typeIdx = headers.findIndex(h => h === 'type' || h === 'action');
  if (typeIdx !== -1) mapping['type'] = typeIdx;

  // Find volume/size/lots index
  const sizeIdx = headers.findIndex(h => h === 'size' || h === 'volume' || h === 'lots');
  if (sizeIdx !== -1) mapping['lotSize'] = sizeIdx;

  // Find S/L index
  const slIdx = headers.findIndex(h => h.includes('s / l') || h.includes('s/l') || h === 'sl' || h.includes('stop loss'));
  if (slIdx !== -1) mapping['stopLoss'] = slIdx;

  // Find T/P index
  const tpIdx = headers.findIndex(h => h.includes('t / p') || h.includes('t/p') || h === 'tp' || h.includes('take profit'));
  if (tpIdx !== -1) mapping['takeProfit'] = tpIdx;

  // Find commission index
  const commIdx = headers.findIndex(h => h.includes('commission') || h === 'comm' || h === 'taxes');
  if (commIdx !== -1) mapping['commission'] = commIdx;

  // Find swap index
  const swapIdx = headers.findIndex(h => h === 'swap');
  if (swapIdx !== -1) mapping['swap'] = swapIdx;

  // Find profit index
  const profitIdx = headers.findIndex(h => h === 'profit' || h === 'p/l' || h.includes('p&l') || h === 'gain');
  if (profitIdx !== -1) mapping['profitUsd'] = profitIdx;

  // Find time indices (usually Open Time then Close Time)
  const timeIndices: number[] = [];
  headers.forEach((h, idx) => {
    if (h.includes('time') || h === 'date') timeIndices.push(idx);
  });
  if (timeIndices.length >= 2) {
    mapping['openTime'] = timeIndices[0];
    mapping['closeTime'] = timeIndices[1];
  } else if (timeIndices.length === 1) {
    mapping['openTime'] = timeIndices[0];
  }

  // Find price indices (usually Open Price then Close Price)
  const priceIndices: number[] = [];
  headers.forEach((h, idx) => {
    if (h === 'price') priceIndices.push(idx);
  });
  if (priceIndices.length >= 2) {
    mapping['openPrice'] = priceIndices[0];
    mapping['closePrice'] = priceIndices[1];
  } else if (priceIndices.length === 1) {
    mapping['openPrice'] = priceIndices[0];
  }

  const requiredKeys = ['ticket', 'symbol', 'type', 'lotSize', 'profitUsd'];
  const hasAllRequired = requiredKeys.every(k => mapping[k] !== undefined);
  
  return hasAllRequired ? mapping : null;
}

/**
 * POST /api/trades/import-mt4
 * Uploads and parses an MT4/MT5 detailed HTML statement, importing closed trades into the database.
 */
router.post('/import-mt4', uploadMemory.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const userId = (req.body.userId as string | undefined) || 'dev-user';
    const accountId = (req.body.accountId as string | undefined) || 'dev-account';

    // Decode file buffer with dynamic UTF-16LE / UTF-8 detection
    let htmlContent = '';
    const buffer = req.file.buffer;
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
      htmlContent = buffer.toString('utf16le');
    } else {
      const textLe = buffer.toString('utf16le');
      if (textLe.includes('<html') || textLe.includes('<body') || textLe.includes('<table')) {
        htmlContent = textLe;
      } else {
        htmlContent = buffer.toString('utf-8');
      }
    }

    const root = parseHtml(htmlContent);
    const tables = root.querySelectorAll('table');
    const parsedTrades: any[] = [];

    for (const table of tables) {
      const rows = table.querySelectorAll('tr');
      let mapping: Record<string, number> | null = null;

      for (const row of rows) {
        const cells = row.querySelectorAll('td, th');
        if (cells.length === 0) continue;

        // Filter out hidden cells (common in MT5 HTML position reports)
        const visibleCells = cells.filter(cell => {
          const classAttr = cell.getAttribute('class') || '';
          const styleAttr = cell.getAttribute('style') || '';
          const rawAttrs = cell.rawAttrs || '';
          return !classAttr.includes('hidden') && 
                 !styleAttr.includes('display:none') && 
                 !rawAttrs.includes('hidden');
        });

        if (visibleCells.length === 0) continue;

        const cellTexts = visibleCells.map(c => c.text.trim());

        // Try to identify header mapping for this table
        if (!mapping) {
          mapping = findHeaderMapping(cellTexts);
          if (mapping) {
            continue; // Skip header row
          }
        }

        // If mapping was successfully resolved, extract trade columns
        if (mapping) {
          try {
            const ticketIdx = mapping['ticket'];
            if (ticketIdx === undefined || ticketIdx >= cellTexts.length) continue;
            const ticketStr = cellTexts[ticketIdx];
            const ticket = parseInt(ticketStr, 10);
            if (isNaN(ticket)) continue; // Must be numeric ticket

            const typeIdx = mapping['type'];
            if (typeIdx === undefined || typeIdx >= cellTexts.length) continue;
            const typeStr = cellTexts[typeIdx].toLowerCase();
            if (typeStr !== 'buy' && typeStr !== 'sell') continue; // Skip balance, deposit, withdrawals

            const openTimeStr = (mapping['openTime'] !== undefined && mapping['openTime'] < cellTexts.length) ? cellTexts[mapping['openTime']] : '';
            const closeTimeStr = (mapping['closeTime'] !== undefined && mapping['closeTime'] < cellTexts.length) ? cellTexts[mapping['closeTime']] : '';
            
            const openTime = openTimeStr ? parseMT4Date(openTimeStr) : null;
            const closeTime = closeTimeStr ? parseMT4Date(closeTimeStr) : null;
            
            // Positions must have both open time and close time populated to import closed trades
            if (!openTime || !closeTime) continue;

            const lotSizeIdx = mapping['lotSize'];
            if (lotSizeIdx === undefined || lotSizeIdx >= cellTexts.length) continue;
            const lotSize = parseFloat(cellTexts[lotSizeIdx]);

            const symbolIdx = mapping['symbol'];
            if (symbolIdx === undefined || symbolIdx >= cellTexts.length) continue;
            const symbolStr = cellTexts[symbolIdx].trim();

            const openPriceIdx = mapping['openPrice'];
            const closePriceIdx = mapping['closePrice'];
            if (openPriceIdx === undefined || openPriceIdx >= cellTexts.length) continue;
            if (closePriceIdx === undefined || closePriceIdx >= cellTexts.length) continue;
            const openPrice = parseFloat(cellTexts[openPriceIdx]);
            const closePrice = parseFloat(cellTexts[closePriceIdx]);

            const cleanNumStr = (s: string) => s ? s.replace(/[\s,]+/g, '') : '';
            
            const profitIdx = mapping['profitUsd'];
            if (profitIdx === undefined || profitIdx >= cellTexts.length) continue;
            const profitStr = cellTexts[profitIdx];
            const profitUsd = parseFloat(cleanNumStr(profitStr));

            if (isNaN(lotSize) || isNaN(openPrice) || isNaN(closePrice) || isNaN(profitUsd)) continue;

            const commStr = (mapping['commission'] !== undefined && mapping['commission'] < cellTexts.length) ? cellTexts[mapping['commission']] : '';
            const swapStr = (mapping['swap'] !== undefined && mapping['swap'] < cellTexts.length) ? cellTexts[mapping['swap']] : '';
            const slStr = (mapping['stopLoss'] !== undefined && mapping['stopLoss'] < cellTexts.length) ? cellTexts[mapping['stopLoss']] : '';
            const tpStr = (mapping['takeProfit'] !== undefined && mapping['takeProfit'] < cellTexts.length) ? cellTexts[mapping['takeProfit']] : '';

            const commission = parseFloat(cleanNumStr(commStr)) || 0;
            const swap = parseFloat(cleanNumStr(swapStr)) || 0;
            const stopLoss = slStr && parseFloat(cleanNumStr(slStr)) > 0 ? parseFloat(cleanNumStr(slStr)) : null;
            const takeProfit = tpStr && parseFloat(cleanNumStr(tpStr)) > 0 ? parseFloat(cleanNumStr(tpStr)) : null;

            // Calculate Pips
            let digits = 5;
            const sym = symbolStr.toUpperCase();
            if (sym.includes('JPY')) {
              digits = 3;
            } else if (sym.includes('BTC') || sym.includes('ETH')) {
              digits = 2;
            } else if (sym.includes('XAU') || sym.includes('GOLD')) {
              digits = 2;
            }

            let pipSize = Math.pow(10, -digits);
            if (digits === 3 || digits === 5) {
              pipSize *= 10;
            }

            let pips = 0;
            if (typeStr === 'buy') {
              pips = (closePrice - openPrice) / pipSize;
            } else {
              pips = (openPrice - closePrice) / pipSize;
            }

            // Calculate R-multiple
            let rMultiple = 0;
            if (stopLoss && stopLoss > 0) {
              const risk = typeStr === 'buy' ? (openPrice - stopLoss) : (stopLoss - openPrice);
              if (risk > 0) {
                const reward = typeStr === 'buy' ? (closePrice - openPrice) : (openPrice - closePrice);
                rMultiple = reward / risk;
              }
            }

            parsedTrades.push({
              ticket,
              openTime,
              closeTime,
              direction: typeStr.toUpperCase() as 'BUY' | 'SELL',
              lotSize,
              symbol: sym,
              openPrice,
              closePrice,
              stopLoss,
              takeProfit,
              commission,
              swap,
              profitUsd,
              pips,
              rMultiple,
            });
          } catch (e) {
            continue; // Skip corrupted rows silently
          }
        }
      }
    }

    if (parsedTrades.length === 0) {
      res.status(400).json({ error: 'No valid trades found in the statement file.' });
      return;
    }

    let imported = 0;
    let skipped = 0;

    // Detect file source (MT4 report vs MT5 report)
    const fileSource = htmlContent.toLowerCase().includes('metatrader 5') ? 'MT5_CSV' : 'MT4_HTM';

    for (const trade of parsedTrades) {
      try {
        const existing = await prisma.trade.findFirst({
          where: {
            account_id: accountId,
            ticket: trade.ticket,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        await prisma.trade.create({
          data: {
            account_id: accountId,
            user_id: userId,
            ticket: trade.ticket,
            symbol: trade.symbol,
            direction: trade.direction,
            open_time: trade.openTime,
            close_time: trade.closeTime,
            open_price: trade.openPrice,
            close_price: trade.closePrice,
            lot_size: trade.lotSize,
            stop_loss: trade.stopLoss,
            take_profit: trade.takeProfit,
            profit_usd: trade.profitUsd,
            commission: trade.commission,
            swap: trade.swap,
            pips: trade.pips,
            r_multiple: trade.rMultiple,
            import_source: fileSource as any,
          },
        });
        imported++;
      } catch (err: any) {
        console.error(`Failed to insert trade ticket ${trade.ticket}:`, err.message);
      }
    }

    res.status(200).json({
      message: `Successfully processed statement.`,
      found: parsedTrades.length,
      imported,
      skipped,
    });
  } catch (err: any) {
    console.error('MT4/MT5 import error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router;
