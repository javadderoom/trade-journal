import { Router, Response } from 'express';
import { prisma } from '../services/tradeSync';
import { authenticate, AuthRequest } from '../middleware/auth';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Direction, Plan } from '@prisma/client';

const router = Router();

// Persian Headers mapping
const HEADERS = {
  ticket: 'تیکت',
  symbol: 'نماد',
  direction: 'جهت',
  lotSize: 'حجم (لات)',
  openTime: 'زمان ورود',
  openPrice: 'قیمت ورود',
  closeTime: 'زمان خروج',
  closePrice: 'قیمت خروج',
  stopLoss: 'حد ضرر (SL)',
  takeProfit: 'حد سود (TP)',
  commission: 'کمیسیون',
  swap: 'سواپ',
  pips: 'پیپ',
  rMultiple: 'ضریب R',
  profitUsd: 'سود/زیان (دلار)',
  emotion: 'احساس',
  tags: 'برچسب‌ها (استراتژی)',
  notes: 'یادداشت',
};

// Formats Date to YYYY.MM.DD HH:mm:ss in Tehran timezone using ASCII numbers
function formatTehranDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    
    // Format to Tehran timezone using Gregorian calendar and standard digits
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Tehran',
    });
    
    const parts = formatter.formatToParts(d);
    const map = new Map(parts.map(p => [p.type, p.value]));
    
    return `${map.get('year')}.${map.get('month')}.${map.get('day')} ${map.get('hour')}:${map.get('minute')}:${map.get('second')}`;
  } catch {
    return String(dateStr);
  }
}

// Convert direction values to Persian for CSV/Excel
function formatDirection(dir: Direction | string): string {
  return dir === 'BUY' ? 'خرید (BUY)' : 'فروش (SELL)';
}

// Export router
router.get('/export', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // 1. Plan Verification (PRO Exclusive Gate)
    const userObj = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!userObj || userObj.plan !== Plan.PRO) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'Data export is only available for PRO users.',
      });
    }

    // 2. Fetch filters
    const {
      format = 'csv',
      scope = 'all',
      accountId = 'all',
      symbol,
      direction,
      status,
      search,
      dates,
    } = req.query as any;

    // 3. Build Prisma where clauses
    const whereClause: any = { user_id: userId };

    if (accountId && accountId !== 'all') {
      whereClause.account_id = accountId;
    }

    if (scope === 'filtered') {
      if (symbol && symbol !== 'همه نمادها') {
        whereClause.symbol = { contains: symbol, mode: 'insensitive' };
      }
      if (direction && direction !== 'همه جهت‌ها') {
        const dirVal = direction.toUpperCase();
        if (dirVal === 'BUY' || dirVal === 'SELL') {
          whereClause.direction = dirVal;
        }
      }
      if (status && status !== 'ALL') {
        if (status === 'OPEN') {
          whereClause.close_time = null;
        } else if (status === 'CLOSED') {
          whereClause.close_time = { not: null };
        } else if (status === 'MISSED') {
          whereClause.tags = {
            hasSome: ['فرصت از دست رفته', 'Missed', 'ignore', 'Ignore', 'نادیده گرفتن'],
          };
        }
      }
      if (search) {
        whereClause.OR = [
          { symbol: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ];
      }
      if (dates) {
        const filterDates = dates.split(',').map((d: string) => d.trim()).filter(Boolean);
        if (filterDates.length > 0) {
          const ranges = filterDates.map((dateStr: string) => {
            const start = new Date(`${dateStr}T00:00:00.000Z`);
            const end = new Date(`${dateStr}T23:59:59.999Z`);
            return { open_time: { gte: start, lte: end } };
          });
          whereClause.AND = whereClause.AND || [];
          whereClause.AND.push({ OR: ranges });
        }
      }
    }

    // Retrieve ALL matched trades
    const trades = await prisma.trade.findMany({
      where: whereClause,
      orderBy: { open_time: 'desc' },
      include: {
        account: {
          select: { broker_name: true, account_number: true },
        },
      },
    });

    const stamp = new Date().toISOString().substring(0, 10);
    const filename = `tradekav-export-${stamp}`;

    // 4. Format outputs
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      
      // UTF-8 Byte Order Mark (BOM) to force Excel to load Persian in UTF-8
      res.write('\ufeff');

      // Write Header Row
      const rowHeader = Object.values(HEADERS).join(',') + '\n';
      res.write(rowHeader);

      // Write Data Rows
      for (const t of trades) {
        const rowData = [
          t.ticket || '',
          t.symbol,
          formatDirection(t.direction),
          t.lot_size,
          formatTehranDateTime(t.open_time),
          t.open_price,
          t.close_time ? formatTehranDateTime(t.close_time) : '',
          t.close_price || '',
          t.stop_loss || '',
          t.take_profit || '',
          t.commission,
          t.swap,
          t.pips,
          t.r_multiple,
          t.profit_usd,
          t.emotion || '',
          `"${(t.tags || []).join(' | ')}"`,
          `"${(t.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        ].join(',');
        res.write(rowData + '\n');
      }
      res.end();
      return;
    }

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Trades Report');

      // Right-to-Left sheet setup
      sheet.views = [{ showGridLines: true, rightToLeft: true }];

      // Define Columns
      sheet.columns = Object.keys(HEADERS).map((key) => ({
        header: HEADERS[key as keyof typeof HEADERS],
        key: key,
        width: 15,
      }));

      // Apply Header styling
      const headerRow = sheet.getRow(1);
      headerRow.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A237E' }, // Dark Blue Theme Header
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

      // Fill values
      trades.forEach((t) => {
        const row = sheet.addRow({
          ticket: t.ticket || '',
          symbol: t.symbol,
          direction: formatDirection(t.direction),
          lotSize: t.lot_size,
          openTime: formatTehranDateTime(t.open_time),
          openPrice: t.open_price,
          closeTime: t.close_time ? formatTehranDateTime(t.close_time) : '',
          closePrice: t.close_price || '',
          stopLoss: t.stop_loss || '',
          takeProfit: t.take_profit || '',
          commission: t.commission,
          swap: t.swap,
          pips: t.pips,
          rMultiple: t.r_multiple,
          profitUsd: t.profit_usd,
          emotion: t.emotion || '',
          tags: (t.tags || []).join(', '),
          notes: t.notes || '',
        });

        // Align details
        row.alignment = { horizontal: 'center', vertical: 'middle' };

        // Color-code Profit/Loss columns
        const pnlCell = row.getCell('profitUsd');
        if (t.profit_usd > 0) {
          pnlCell.font = { color: { argb: 'FF2E7D32' }, bold: true }; // Green
        } else if (t.profit_usd < 0) {
          pnlCell.font = { color: { argb: 'FFC62828' }, bold: true }; // Red
        }
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      await workbook.xlsx.write(res);
      res.end();
      return;
    }

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

      // Initialize PDF Document (Landscape layout, standard font)
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      doc.pipe(res);

      // PDF Title in English
      doc.fontSize(16).font('Helvetica-Bold').text('TradeKav Platform - Trade History Report', { align: 'left' });
      doc.moveDown();

      // Basic stats summaries
      const totalTrades = trades.length;
      const profitTrades = trades.filter((t) => t.profit_usd > 0).length;
      const winRate = totalTrades > 0 ? ((profitTrades / totalTrades) * 100).toFixed(2) : '0';
      const totalPnl = trades.reduce((sum, t) => sum + t.profit_usd, 0).toFixed(2);

      doc.fontSize(10).font('Helvetica')
        .text(`Total Trades: ${totalTrades}`, { align: 'left' })
        .text(`Win Rate: ${winRate}%`, { align: 'left' })
        .text(`Net P&L: $${totalPnl}`, { align: 'left' });

      doc.moveDown(2);

      // Table Header
      doc.fontSize(10).font('Helvetica-Bold').text('Positions History:', { align: 'left' });
      doc.moveDown(0.5);

      const tableTop = 180;
      doc.rect(30, tableTop, 780, 20).fill('#1a237e');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');

      // Left-to-Right columns for English PDF
      doc.text('Ticket', 40, tableTop + 5);
      doc.text('Open Time', 100, tableTop + 5);
      doc.text('Type', 210, tableTop + 5);
      doc.text('Symbol', 270, tableTop + 5);
      doc.text('Volume', 330, tableTop + 5);
      doc.text('Price In', 380, tableTop + 5);
      doc.text('S / L', 440, tableTop + 5);
      doc.text('T / P', 500, tableTop + 5);
      doc.text('Close Time', 560, tableTop + 5);
      doc.text('Price Out', 670, tableTop + 5);
      doc.text('Profit', 730, tableTop + 5);

      let y = tableTop + 20;
      doc.fillColor('#000000').font('Helvetica');

      // Print rows
      trades.forEach((t) => {
        // Simple page breaking if list is long
        if (y > 500) {
          doc.addPage({ margin: 30, size: 'A4', layout: 'landscape' });
          y = 50;
          doc.rect(30, y, 780, 20).fill('#1a237e');
          doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
          doc.text('Ticket', 40, y + 5);
          doc.text('Open Time', 100, y + 5);
          doc.text('Type', 210, y + 5);
          doc.text('Symbol', 270, y + 5);
          doc.text('Volume', 330, y + 5);
          doc.text('Price In', 380, y + 5);
          doc.text('S / L', 440, y + 5);
          doc.text('T / P', 500, y + 5);
          doc.text('Close Time', 560, y + 5);
          doc.text('Price Out', 670, y + 5);
          doc.text('Profit', 730, y + 5);
          y += 20;
          doc.fillColor('#000000').font('Helvetica');
        }

        doc.rect(30, y, 780, 20).stroke('#e0e0e0');
        doc.text(String(t.ticket || '-'), 40, y + 6);
        doc.text(formatTehranDateTime(t.open_time), 100, y + 6);
        doc.text(t.direction === 'BUY' ? 'buy' : 'sell', 210, y + 6);
        doc.text(t.symbol, 270, y + 6);
        doc.text(String(t.lot_size), 330, y + 6);
        doc.text(String(t.open_price), 380, y + 6);
        doc.text(String(t.stop_loss || '-'), 440, y + 6);
        doc.text(String(t.take_profit || '-'), 500, y + 6);
        doc.text(t.close_time ? formatTehranDateTime(t.close_time) : '-', 560, y + 6);
        doc.text(String(t.close_price || '-'), 670, y + 6);
        
        // P&L color indication
        if (t.profit_usd >= 0) {
          doc.fillColor('#2e7d32').text(`$${t.profit_usd.toFixed(2)}`, 730, y + 6).fillColor('#000000');
        } else {
          doc.fillColor('#c62828').text(`-$${Math.abs(t.profit_usd).toFixed(2)}`, 730, y + 6).fillColor('#000000');
        }

        y += 20;
      });

      doc.end();
      return;
    }

    res.status(400).json({ error: 'Invalid format' });
  } catch (err: any) {
    console.error('Export route error:', err);
    res.status(500).json({ error: 'خطای سرور در خروجی داده' });
  }
});

export default router;
