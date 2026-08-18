import { Router, Response } from 'express';
import multer from 'multer';
import { parse as parseHtml } from 'node-html-parser';
import { prisma } from '../services/tradeSync';
import { parseBrokerDate } from '../services/brokerDateParser';
import { detectMistakes } from '../services/mistakeDetector';
import { authenticate, AuthRequest } from '../middleware/auth';
import { checkImportPermission } from '../middleware/checkPlanLimits';

const router = Router();
const uploadMemory = multer({ storage: multer.memoryStorage() });

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
router.post('/import-mt4', authenticate, checkImportPermission, uploadMemory.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const userId = req.user!.userId;
    const accountId = req.body.accountId as string | undefined;

    if (!accountId) {
      res.status(400).json({ error: 'Account ID is required' });
      return;
    }

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: { id: accountId, user_id: userId }
    });
    if (!account) {
      res.status(403).json({ error: 'شما به این حساب دسترسی ندارید' });
      return;
    }

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
            const ticket = ticketStr.trim();
            if (!ticket) continue; // Must have ticket

            const typeIdx = mapping['type'];
            if (typeIdx === undefined || typeIdx >= cellTexts.length) continue;
            const typeStr = cellTexts[typeIdx].toLowerCase();
            if (typeStr !== 'buy' && typeStr !== 'sell') continue; // Skip balance, deposit, withdrawals

            const openTimeStr = (mapping['openTime'] !== undefined && mapping['openTime'] < cellTexts.length) ? cellTexts[mapping['openTime']] : '';
            const closeTimeStr = (mapping['closeTime'] !== undefined && mapping['closeTime'] < cellTexts.length) ? cellTexts[mapping['closeTime']] : '';
            
            const openTime = openTimeStr ? parseBrokerDate(openTimeStr, account.broker_tz) : null;
            const closeTime = closeTimeStr ? parseBrokerDate(closeTimeStr, account.broker_tz) : null;
            
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
              digits = 0;
            } else if (sym.includes('XAU') || sym.includes('GOLD')) {
              digits = 1;
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

    // Verify STANDARD user limits
    const userPlan = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });

    if (userPlan?.plan === 'STANDARD' && parsedTrades.length > 150) {
      res.status(400).json({
        error: `این فایل شامل ${parsedTrades.length} معامله است. در نسخه استاندارد حداکثر ۱۵۰ معامله در هر فایل پردازش می‌شود. برای واردات کامل، به نسخه حرفه‌ای ارتقا دهید.`
      });
      return;
    }

    let imported = 0;
    let skipped = 0;
    const newLosingTrades: any[] = []; // for mistake detection

    // Detect file source (MT4 report vs MT5 report)
    const fileSource = htmlContent.toLowerCase().includes('metatrader 5') ? 'MT5_CSV' : 'MT4_HTM';

    // Batch dedup: fetch all existing tickets for this account in one query
    const incomingTickets = parsedTrades.map(t => t.ticket).filter((t): t is string => t !== null);
    const existingTrades = await prisma.trade.findMany({
      where: {
        account_id: accountId,
        ticket: { in: incomingTickets },
      },
      select: { ticket: true },
    });
    const existingTicketSet = new Set(existingTrades.map(t => t.ticket));

    // Filter out duplicates before entering the transaction
    const tradesToImport = parsedTrades.filter(t => {
      if (t.ticket !== null && existingTicketSet.has(t.ticket)) {
        skipped++;
        return false;
      }
      if (t.ticket !== null) {
        existingTicketSet.add(t.ticket);
      }
      return true;
    });

    // Process imports inside a transaction for atomicity
    const importedTrades = await prisma.$transaction(async (tx) => {
      const results: any[] = [];
      for (const trade of tradesToImport) {
        const newTrade = await tx.trade.create({
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

        // Create ENTRY execution
        await tx.execution.create({
          data: {
            trade_id: newTrade.id,
            type: 'ENTRY',
            lot_size: trade.lotSize,
            price: trade.openPrice,
            profit_usd: 0,
            commission: trade.commission,
            swap: 0,
            pips: 0,
            r_multiple: 0,
            executed_at: trade.openTime,
          },
        });

        // Create EXIT execution if trade is closed
        if (trade.closeTime && trade.closePrice !== null) {
          await tx.execution.create({
            data: {
              trade_id: newTrade.id,
              type: 'EXIT',
              lot_size: trade.lotSize,
              price: trade.closePrice,
              profit_usd: trade.profitUsd,
              commission: 0,
              swap: trade.swap,
              pips: trade.pips,
              r_multiple: trade.rMultiple,
              close_time: trade.closeTime,
              executed_at: trade.closeTime,
            },
          });
        }

        results.push(newTrade);
      }
      return results;
    });

    imported = importedTrades.length;
    newLosingTrades.push(...importedTrades.filter((t: any) => t.profit_usd < 0 && t.close_time !== null));

    // Record the ImportJob
    try {
      await prisma.importJob.create({
        data: {
          user_id: userId,
          account_id: accountId,
          filename: req.file.originalname,
          status: 'COMPLETED',
          rows_total: parsedTrades.length,
          rows_imported: imported,
        },
      });
    } catch (err: any) {
      console.error('Failed to log import job:', err);
    }

    // Run mistake detection on newly imported losing trades (batch)
    const mistakeSummary: Array<{ tradeId: string; ticket: string | null; symbol: string; suggestedMistakes: any[] }> = [];
    for (const lossTrade of newLosingTrades) {
      try {
        const suggestions = await detectMistakes(lossTrade as any, prisma);
        if (suggestions.length > 0) {
          mistakeSummary.push({
            tradeId: lossTrade.id,
            ticket: lossTrade.ticket,
            symbol: lossTrade.symbol,
            suggestedMistakes: suggestions,
          });
        }
      } catch { /* non-critical — don't break import response */ }
    }

    res.status(200).json({
      message: `Successfully processed statement.`,
      found: parsedTrades.length,
      imported,
      skipped,
      mistakeSummary,
    });
  } catch (err: any) {
    console.error('MT4/MT5 import error:', err);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
