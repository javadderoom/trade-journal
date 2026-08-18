import { Router, Response } from 'express';
import { getTradesForAccount, syncTradesFromEA, syncTradeAggregates, prisma } from '../services/tradeSync';
import { detectMistakes } from '../services/mistakeDetector';
import { authenticate, authenticateAccountToken, AuthRequest } from '../middleware/auth';
import { checkTradeLimit, checkSyncPermission } from '../middleware/checkPlanLimits';
import { createTradeSchema, updateTradeSchema } from '../validators/trade';

const router = Router();

/**
 * POST /api/trades/bulk-tags
 * Bulk apply or remove tags (setup, triggers, confluences) to trades.
 */
router.post('/bulk-tags', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { tradeIds, action, setupId, triggerIds, confluenceIds } = req.body;

    if (!Array.isArray(tradeIds) || tradeIds.length === 0) {
      return res.status(400).json({ error: 'tradeIds required' });
    }
    if (action !== 'ADD' && action !== 'REMOVE' && action !== 'SET') {
      return res.status(400).json({ error: 'invalid action' });
    }

    // Verify all trades belong to user
    const userTrades = await prisma.trade.findMany({
      where: {
        id: { in: tradeIds },
        user_id: userId
      },
      select: { id: true }
    });

    if (userTrades.length !== tradeIds.length) {
      return res.status(403).json({ error: 'Some trades not found or unauthorized' });
    }

    const validTradeIds = userTrades.map(t => t.id);

    await prisma.$transaction(async (tx) => {
      for (const tradeId of validTradeIds) {
        if (action === 'SET' || action === 'ADD') {
          if (setupId !== undefined) {
            if (setupId === null) {
              await tx.tradeSetup.deleteMany({ where: { trade_id: tradeId } });
            } else {
              await tx.tradeSetup.upsert({
                where: { trade_id: tradeId },
                update: { concept_id: setupId },
                create: { trade_id: tradeId, concept_id: setupId }
              });
            }
          }

          if (triggerIds && triggerIds.length > 0) {
            if (action === 'SET') {
              await tx.tradeTrigger.deleteMany({ where: { trade_id: tradeId } });
            }
            await tx.tradeTrigger.createMany({
              data: triggerIds.map((cId: string) => ({ trade_id: tradeId, concept_id: cId })),
              skipDuplicates: true
            });
          }

          if (confluenceIds && confluenceIds.length > 0) {
            if (action === 'SET') {
              await tx.tradeConfluence.deleteMany({ where: { trade_id: tradeId } });
            }
            await tx.tradeConfluence.createMany({
              data: confluenceIds.map((cId: string) => ({ trade_id: tradeId, concept_id: cId })),
              skipDuplicates: true
            });
          }
        } else if (action === 'REMOVE') {
          if (triggerIds && triggerIds.length > 0) {
            await tx.tradeTrigger.deleteMany({
              where: { trade_id: tradeId, concept_id: { in: triggerIds } }
            });
          }
          if (confluenceIds && confluenceIds.length > 0) {
            await tx.tradeConfluence.deleteMany({
              where: { trade_id: tradeId, concept_id: { in: confluenceIds } }
            });
          }
        }
      }
    });

    res.status(200).json({ success: true, count: validTradeIds.length });
  } catch (err: any) {
    console.error('Bulk tags error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/trades/sync
 * Receives trade data from MT5 Expert Advisor and stores in DB.
 *
 * Body: { userId: string, accountId: string, trades: EATrade[] }
 * Or:   EATrade[] (defaults to first user/account for development)
 */
router.get('/accounts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Auto-create default account if no accounts exist
    let accounts = await prisma.account.findMany({
      where: { user_id: userId },
    });

    if (accounts.length === 0) {
      const defaultAccount = await prisma.account.create({
        data: {
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
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const body = req.query as any;

    const userId = req.user!.userId;
    const accountId = (body.accountId as string | undefined) || 'all';

    if (accountId !== 'all') {
      const account = await prisma.account.findFirst({
        where: { id: accountId, user_id: userId }
      });
      if (!account) {
        return res.status(403).json({ error: 'شما به این حساب دسترسی ندارید' });
      }
    }

    const limitRaw = body.limit as string | undefined;
    const offsetRaw = body.offset as string | undefined;
    const sortKey = body.sortKey as string | undefined;
    const sortDir = (body.sortDir as string | undefined) === 'asc' ? 'asc' : 'desc';

    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
    const offset = offsetRaw ? Number.parseInt(offsetRaw, 10) : undefined;

    const search = body.search as string | undefined;
    const emotion = body.emotion as string | undefined;
    const symbol = body.symbol as string | undefined;
    const direction = body.direction as 'BUY' | 'SELL' | undefined;
    const status = body.status as 'OPEN' | 'CLOSED' | undefined;
    const dates = body.dates ? (body.dates as string).split(',') : undefined;

    const { items, totalCount } = await getTradesForAccount({
      userId,
      accountId,
      limit,
      offset,
      sortKey,
      sortDir,
      plan: req.user?.plan,
      search,
      emotion,
      symbol,
      direction,
      status,
      dates,
    });

    res.status(200).json({
      items,
      limit: limit ?? 100,
      offset: offset ?? 0,
      count: items.length,
      totalCount,
    });
  } catch (err: any) {
    console.error('Trade list error:', err);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * POST /api/trades/sync
 * Receives trade data from MT5 Expert Advisor and stores in DB.
 *
 * Body: { userId: string, accountId: string, trades: EATrade[] }
 * Or:   EATrade[] (defaults to first user/account for development)
 */
router.post('/sync', authenticateAccountToken, checkSyncPermission, async (req: AuthRequest, res: Response) => {
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
        hint: 'Send either an array payload (EA) or { trades } (web/API).',
      });
      return;
    }

    const targetUserId = req.account!.user_id;
    const targetAccountId = req.account!.id;

    if (body && typeof body.balance === 'number') {
      const currentAccount = await prisma.account.findUnique({ where: { id: targetAccountId } });
      if (currentAccount && currentAccount.initial_balance === null) {
        await prisma.account.update({
          where: { id: targetAccountId },
          data: { initial_balance: body.balance, current_balance: body.balance }
        });
      } else if (currentAccount) {
        await prisma.account.update({
          where: { id: targetAccountId },
          data: { current_balance: body.balance }
        });
      }
    }

    const result = await syncTradesFromEA(targetUserId, targetAccountId, trades);

    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const ipStr = Array.isArray(ip) ? ip[0] : ip;
      await prisma.eALog.create({
        data: {
          user_id: targetUserId,
          account_id: targetAccountId,
          action: 'SYNC',
          message: `Synced ${result.created} new trades`,
          ip_address: typeof ipStr === 'string' ? ipStr : undefined,
        }
      });
    } catch (logErr) {
      console.error('Failed to write EALog:', logErr);
    }

    res.status(201).json({
      message: `Synced ${result.created} new trades`,
      ...result,
    });
  } catch (err: any) {
    console.error('Trade sync error:', err);
    try {
      const targetUserId = req.account?.user_id;
      const targetAccountId = req.account?.id;
      if (targetUserId) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const ipStr = Array.isArray(ip) ? ip[0] : ip;
        await prisma.eALog.create({
          data: {
            user_id: targetUserId,
            account_id: targetAccountId,
            level: 'ERROR',
            action: 'SYNC_ERROR',
            message: err.message || 'Unknown sync error',
            ip_address: typeof ipStr === 'string' ? ipStr : undefined,
          }
        });
      }
    } catch (logErr) {}
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * POST /api/trades
 * Manually logs a new trade.
 */
router.post('/', authenticate, checkTradeLimit, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createTradeSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }
    const {
      symbol, direction, lotSize, openPrice, openTime,
      stopLoss, takeProfit, closePrice, closeTime,
      profitUsd, commission, swap, accountId, emotion, notes,
      htfBias, session, marketCondition, analysisTimeframe, entryTimeframe, thesis, expectation, lesson, conviction,
    } = parsed.data;

    const userId = req.user!.userId;
    if (!accountId) {
      res.status(400).json({ error: 'انتخاب حساب معاملاتی الزامی است' });
      return;
    }

    const account = await prisma.account.findFirst({
      where: { id: accountId, user_id: userId }
    });
    if (!account) {
      res.status(403).json({ error: 'شما به این حساب دسترسی ندارید' });
      return;
    }

    const openPriceNum = openPrice;
    const lotSizeNum = lotSize;
    const stopLossNum = stopLoss ?? null;
    const takeProfitNum = takeProfit ?? null;
    const closePriceNum = closePrice ?? null;
    const profitUsdNum = profitUsd ?? 0;
    const commissionNum = commission ?? 0;
    const swapNum = swap ?? 0;

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
      digits = 0;
    } else if (sym.includes('XAU') || sym.includes('GOLD')) {
      digits = 1;
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

    // 4. Save to Database (Trade + initial ENTRY Execution in a transaction)
    const newTrade = await prisma.$transaction(async (tx) => {
      const trade = await tx.trade.create({
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

        // Create user-generated annotation fields separately
        await tx.tradeAnnotation.create({
          data: {
            trade_id: trade.id,
            emotion: emotion ?? null,
            notes: notes ?? null,
            market_condition: marketCondition ?? null,
            htf_bias: htfBias ?? null,
            session: session ?? null,
            analysis_timeframe: analysisTimeframe ?? null,
            entry_timeframe: entryTimeframe ?? null,
            thesis: thesis ?? null,
            expectation: expectation ?? null,
            lesson: lesson ?? null,
            conviction: conviction ?? null,
          },
        });

      // Create ENTRY execution
      await tx.execution.create({
        data: {
          trade_id: trade.id,
          type: 'ENTRY',
          lot_size: lotSizeNum,
          price: openPriceNum,
          profit_usd: 0,
          commission: commissionNum,
          swap: swapNum,
          pips: 0,
          r_multiple: 0,
          executed_at: new Date(openTime),
        },
      });

      // If closed on creation, also create EXIT execution
      if (closePriceNum !== null && closeTime) {
        await tx.execution.create({
          data: {
            trade_id: trade.id,
            type: 'EXIT',
            lot_size: lotSizeNum,
            price: closePriceNum,
            profit_usd: profitUsdNum,
            commission: 0,
            swap: 0,
            pips: pips,
            r_multiple: rMultiple,
            close_time: new Date(closeTime),
            executed_at: new Date(closeTime),
          },
        });
      }

      return trade;
    });

    // 5. Run mistake detection on closed losing trades
    const suggestedMistakes = await detectMistakes(newTrade as any, prisma);

    res.status(201).json({ ...newTrade, suggestedMistakes });
  } catch (err: any) {
    console.error('Create manual trade error:', err);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * PUT /api/trades/:id
 * Updates trade fields — notes, emotion, tags, SL/TP, close/reopen, or core trade data.
 */
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;

    const parsed = updateTradeSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }
    const {
      notes, emotion, stopLoss, takeProfit, accountId,
      closeTime, closePrice, profitUsd, commission, swap,
      symbol, direction, lotSize, openPrice, openTime,
      htfBias, session, marketCondition, analysisTimeframe, entryTimeframe, thesis, expectation, lesson, conviction,
      setupId, triggerIds, confluenceIds, plan
    } = parsed.data;

    const existing = await prisma.trade.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }

    if (accountId) {
      const account = await prisma.account.findFirst({
        where: { id: accountId, user_id: userId }
      });
      if (!account) {
        res.status(403).json({ error: 'شما به این حساب دسترسی ندارید' });
        return;
      }
    }

    // Resolve the effective values (existing or incoming) for calculations
    const effDirection = direction !== undefined ? direction : existing.direction;
    const effOpenPrice = openPrice !== undefined ? openPrice : existing.open_price;
    const effClosePrice = closePrice !== undefined
      ? closePrice
      : existing.close_price;
    const effCloseTime = closeTime !== undefined
      ? (closeTime === null ? null : new Date(closeTime))
      : existing.close_time;
    const effStopLoss = stopLoss !== undefined
      ? stopLoss
      : existing.stop_loss;
    const effProfitUsd = profitUsd !== undefined ? profitUsd : existing.profit_usd;
    const effCommission = commission !== undefined ? commission : existing.commission;
    const effSwap = swap !== undefined ? swap : existing.swap;

    // Calculate pips when closePrice or openPrice changes
    let pipsUpdate: number | undefined = undefined;
    const isPipsChange = closePrice !== undefined || openPrice !== undefined || closeTime !== undefined;
    if (isPipsChange && effClosePrice !== null && effOpenPrice > 0) {
      let digits = 5;
      const sym = (symbol || existing.symbol).toUpperCase();
      if (sym.includes('JPY')) digits = 3;
      else if (sym.includes('BTC') || sym.includes('ETH')) digits = 0;
      else if (sym.includes('XAU') || sym.includes('GOLD')) digits = 1;

      let pipSize = Math.pow(10, -digits);
      if (digits === 3 || digits === 5) pipSize *= 10;

      pipsUpdate = effDirection === 'BUY'
        ? (effClosePrice - effOpenPrice) / pipSize
        : (effOpenPrice - effClosePrice) / pipSize;
    }

    // Calculate r_multiple when stopLoss or closePrice changes
    let rMultipleUpdate: number | undefined = undefined;
    const isRChange = stopLoss !== undefined || closePrice !== undefined || openPrice !== undefined || closeTime !== undefined;
    if (isRChange && effStopLoss && effStopLoss > 0 && effOpenPrice > 0) {
      const isBuy = effDirection === 'BUY';
      const risk = isBuy ? (effOpenPrice - effStopLoss) : (effStopLoss - effOpenPrice);
      if (risk > 0) {
        const exitPrice = effClosePrice !== null ? effClosePrice : effOpenPrice;
        const reward = isBuy ? (exitPrice - effOpenPrice) : (effOpenPrice - exitPrice);
        rMultipleUpdate = reward / risk;
      } else {
        rMultipleUpdate = 0;
      }
    }

    // Recompute profit_usd when core pricing fields change (skip if user explicitly set profitUsd)
    let profitUsdUpdate: number | undefined = undefined;
    if (profitUsd !== undefined) {
      // User explicitly provided profitUsd — use it directly
      profitUsdUpdate = profitUsd;
    } else {
      const isPnlChange = openPrice !== undefined || closePrice !== undefined || lotSize !== undefined || direction !== undefined;
      if (isPnlChange && effClosePrice !== null && effOpenPrice > 0) {
        const isBuy = effDirection === 'BUY';
        const effLot = lotSize !== undefined ? lotSize : existing.lot_size;
        const priceDiff = isBuy ? (effClosePrice - effOpenPrice) : (effOpenPrice - effClosePrice);
        // Use symbol-appropriate multiplier based on digits
        const sym = (symbol || existing.symbol).toUpperCase();
        let multiplier = 10000;
        if (sym.includes('JPY')) multiplier = 1000;
        else if (sym.includes('XAU') || sym.includes('GOLD')) multiplier = 100;
        else if (sym.includes('BTC')) multiplier = 1;
        else if (sym.includes('ETH')) multiplier = 1;
        profitUsdUpdate = priceDiff * effLot * multiplier + effCommission + effSwap;
      }
    }

const updated = await prisma.$transaction(async (tx) => {
       const trade = await tx.trade.update({
         where: { id },
         data: {
           account_id: accountId !== undefined ? accountId : undefined,
           stop_loss: stopLoss !== undefined ? stopLoss : undefined,
           take_profit: takeProfit !== undefined ? takeProfit : undefined,
           r_multiple: rMultipleUpdate !== undefined ? rMultipleUpdate : undefined,
           symbol: symbol !== undefined ? symbol : undefined,
           direction: direction !== undefined ? direction : undefined,
           lot_size: lotSize !== undefined ? lotSize : undefined,
           open_price: openPrice !== undefined ? openPrice : undefined,
           open_time: openTime !== undefined ? new Date(openTime) : undefined,
           close_time: closeTime !== undefined ? (closeTime === null ? null : new Date(closeTime)) : undefined,
           close_price: closePrice !== undefined ? closePrice : undefined,
           profit_usd: profitUsdUpdate !== undefined ? profitUsdUpdate : (profitUsd !== undefined ? profitUsd : undefined),
           commission: commission !== undefined ? commission : undefined,
           swap: swap !== undefined ? swap : undefined,
           pips: pipsUpdate !== undefined ? pipsUpdate : undefined,
         },
       });

       // Update user-generated annotation fields separately
       const annotationData: any = {};
       if (notes !== undefined) annotationData.notes = notes;
       if (emotion !== undefined) annotationData.emotion = emotion;
       if (htfBias !== undefined) annotationData.htf_bias = htfBias;
       if (session !== undefined) annotationData.session = session;
       if (marketCondition !== undefined) annotationData.market_condition = marketCondition;
       if (analysisTimeframe !== undefined) annotationData.analysis_timeframe = analysisTimeframe;
       if (entryTimeframe !== undefined) annotationData.entry_timeframe = entryTimeframe;
       if (thesis !== undefined) annotationData.thesis = thesis;
       if (expectation !== undefined) annotationData.expectation = expectation;
       if (lesson !== undefined) annotationData.lesson = lesson;
       if (conviction !== undefined) annotationData.conviction = conviction;

       if (Object.keys(annotationData).length > 0) {
         await tx.tradeAnnotation.upsert({
           where: { trade_id: id },
           create: { trade_id: id, ...annotationData },
           update: annotationData,
         });
       }

       if (setupId !== undefined) {
         if (setupId === null) {
           await tx.tradeSetup.deleteMany({ where: { trade_id: id } });
         } else {
           await tx.tradeSetup.upsert({
             where: { trade_id: id },
             create: { trade_id: id, concept_id: setupId },
             update: { concept_id: setupId }
           });
         }
       }

       if (triggerIds !== undefined) {
         await tx.tradeTrigger.deleteMany({ where: { trade_id: id } });
         if (triggerIds && triggerIds.length > 0) {
           await tx.tradeTrigger.createMany({
             data: triggerIds.map(concept_id => ({ trade_id: id, concept_id }))
           });
         }
       }

       if (confluenceIds !== undefined) {
         await tx.tradeConfluence.deleteMany({ where: { trade_id: id } });
         if (confluenceIds && confluenceIds.length > 0) {
           await tx.tradeConfluence.createMany({
             data: confluenceIds.map(concept_id => ({ trade_id: id, concept_id }))
           });
         }
       }

       if (plan !== undefined) {
         if (plan === null) {
           await tx.tradePlan.deleteMany({ where: { trade_id: id } });
         } else {
           await tx.tradePlan.upsert({
             where: { trade_id: id },
             create: {
               trade_id: id,
               max_risk: plan.maxRisk ?? null,
               expected_rr: plan.expectedRr ?? null,
               entry_condition: plan.entryCondition ?? null,
               invalidation: plan.invalidation ?? null,
               target_zone: plan.targetZone ?? null,
               expected_hold_time: plan.expectedHoldTime ?? null,
               plan_followed: plan.planFollowed ?? null,
               entry_timing_correct: plan.entryTimingCorrect ?? null,
               emotions_affected: plan.emotionsAffected ?? null,
               managed_according_to_rules: plan.managedAccordingToRules ?? null,
             },
             update: {
               max_risk: plan.maxRisk !== undefined ? plan.maxRisk : undefined,
               expected_rr: plan.expectedRr !== undefined ? plan.expectedRr : undefined,
               entry_condition: plan.entryCondition !== undefined ? plan.entryCondition : undefined,
               invalidation: plan.invalidation !== undefined ? plan.invalidation : undefined,
               target_zone: plan.targetZone !== undefined ? plan.targetZone : undefined,
               expected_hold_time: plan.expectedHoldTime !== undefined ? plan.expectedHoldTime : undefined,
               plan_followed: plan.planFollowed !== undefined ? plan.planFollowed : undefined,
               entry_timing_correct: plan.entryTimingCorrect !== undefined ? plan.entryTimingCorrect : undefined,
               emotions_affected: plan.emotionsAffected !== undefined ? plan.emotionsAffected : undefined,
               managed_according_to_rules: plan.managedAccordingToRules !== undefined ? plan.managedAccordingToRules : undefined,
             },
           });
         }
       }

      // Handle EXIT execution creation on close
      const isBeingClosed = closeTime !== undefined && closeTime !== null && closePrice !== undefined && closePrice !== null;
      const isBeingReopened = closeTime !== undefined && closeTime === null;

      if (isBeingClosed) {
        // Remove any existing EXIT executions (replace with new one)
        await tx.execution.deleteMany({
          where: { trade_id: id, type: 'EXIT' },
        });

        const closePriceVal = closePrice!;
        const closeTimeVal = new Date(closeTime);
        const lotSizeVal = lotSize !== undefined ? lotSize : existing.lot_size;
        const openPriceVal = openPrice !== undefined ? openPrice : existing.open_price;
        const dir = direction || existing.direction;

        // Calculate pips for this exit
        let exitPips = 0;
        let digits = 5;
        const sym = (symbol || existing.symbol).toUpperCase();
        if (sym.includes('JPY')) digits = 3;
        else if (sym.includes('BTC') || sym.includes('ETH')) digits = 0;
        else if (sym.includes('XAU') || sym.includes('GOLD')) digits = 1;
        let pipSize = Math.pow(10, -digits);
        if (digits === 3 || digits === 5) pipSize *= 10;
        exitPips = dir === 'BUY'
          ? (closePriceVal - openPriceVal) / pipSize
          : (openPriceVal - closePriceVal) / pipSize;

        // Calculate R-multiple for this exit
        let exitR = 0;
        const sl = stopLoss !== undefined ? stopLoss : existing.stop_loss;
        if (sl && sl > 0 && openPriceVal > 0) {
          const isBuy = dir === 'BUY';
          const risk = isBuy ? (openPriceVal - sl) : (sl - openPriceVal);
          if (risk > 0) {
            const reward = isBuy ? (closePriceVal - openPriceVal) : (openPriceVal - closePriceVal);
            exitR = reward / risk;
          }
        }

        const exitProfitUsd = profitUsdUpdate !== undefined ? profitUsdUpdate : (profitUsd !== undefined ? profitUsd : 0);

        await tx.execution.create({
          data: {
            trade_id: id,
            type: 'EXIT',
            lot_size: lotSizeVal,
            price: closePriceVal,
            profit_usd: exitProfitUsd,
            commission: commission !== undefined ? commission : 0,
            swap: swap !== undefined ? swap : 0,
            pips: exitPips,
            r_multiple: exitR,
            close_time: closeTimeVal,
            executed_at: closeTimeVal,
          },
        });
      } else if (isBeingReopened) {
        // Remove all EXIT executions when reopening
        await tx.execution.deleteMany({
          where: { trade_id: id, type: 'EXIT' },
        });
      }

      return trade;
    });

    // Sync aggregates from executions
    await syncTradeAggregates(id);

    res.status(200).json(updated);
  } catch (err: any) {
    console.error('Update trade error:', err);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * POST /api/trades/bulk-delete
 * Deletes multiple trades by their IDs.
 */
router.post('/bulk-delete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    const userId = req.user!.userId;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'IDs array is required and must not be empty' });
      return;
    }

    const result = await prisma.trade.deleteMany({
      where: {
        id: {
          in: ids,
        },
        user_id: userId,
      },
    });

    res.status(200).json({ success: true, count: result.count });
  } catch (err: any) {
    console.error('Bulk delete error:', err);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * POST /api/trades/mistakes/confirm
 * Stores confirmed mistake incidents; silently ignores dismissed ones.
 * Body: { incidents: [{ tradeId, ruleKey, label, costUsd, confirmed }] }
 */
router.post('/mistakes/confirm', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { incidents } = req.body as {
      incidents: Array<{
        tradeId: string;
        ruleKey: string;
        label: string;
        costUsd: number;
        confirmed: boolean;
      }>;
    };

    if (!Array.isArray(incidents) || incidents.length === 0) {
      res.status(400).json({ error: 'incidents array is required' });
      return;
    }

    for (const inc of incidents) {
      if (!inc.confirmed) continue; // dismissed — never stored

      // Verify trade belongs to user
      const trade = await prisma.trade.findFirst({
        where: { id: inc.tradeId, user_id: userId },
      });
      if (!trade) continue;

      await (prisma as any).mistakeIncident.upsert({
        where: { trade_id_rule_key: { trade_id: inc.tradeId, rule_key: inc.ruleKey } },
        create: {
          user_id: userId,
          trade_id: inc.tradeId,
          rule_key: inc.ruleKey,
          label: inc.label,
          cost_usd: inc.costUsd,
        },
        update: {
          label: inc.label,
          cost_usd: inc.costUsd,
        },
      });
    }

    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Mistake confirm error:', err);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * GET /api/trades/mistakes/stats
 * Returns per-rule aggregated recurrence stats for the current user.
 */
router.get('/mistakes/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const incidents = await (prisma as any).mistakeIncident.findMany({
      where: { user_id: userId },
      select: { rule_key: true, label: true, cost_usd: true },
    });

    // Group by rule_key
    const grouped: Record<string, { label: string; count: number; totalCostUsd: number }> = {};
    for (const inc of incidents) {
      if (!grouped[inc.rule_key]) {
        grouped[inc.rule_key] = { label: inc.label, count: 0, totalCostUsd: 0 };
      }
      grouped[inc.rule_key].count += 1;
      grouped[inc.rule_key].totalCostUsd += inc.cost_usd;
    }

    const stats = Object.entries(grouped).map(([ruleKey, data]) => ({
      ruleKey,
      label: data.label,
      count: data.count,
      totalCostUsd: Math.round(data.totalCostUsd * 100) / 100,
    }));

    res.status(200).json(stats);
  } catch (err: any) {
    console.error('Mistake stats error:', err);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * GET /api/trades/:id
 * Fetches a single trade by ID.
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;

    const trade = await prisma.trade.findFirst({
      where: { id, user_id: userId },
      include: {
        annotation: true,
        account: {
          select: {
            id: true,
            broker_name: true,
            account_number: true,
            account_type: true,
          }
        },
        setup: {
          include: {
            concept: true,
          }
        },
        triggers: {
          include: {
            concept: true,
          }
        },
        confluences: {
          include: {
            concept: true,
          }
        },
        plan: true,
        events: {
          orderBy: { timestamp: 'asc' },
        },
      }
    });

    if (!trade) {
      return res.status(404).json({ error: 'معامله یافت نشد' });
    }

    const isBuy = trade.direction === 'BUY';
    const isClosed = trade.close_time !== null;
    const openPrice = trade.open_price ?? 0;
    const closePrice = trade.close_price ?? null;

    let pips = 0;
    if (isClosed && closePrice) {
      const multiplier = trade.symbol.includes('JPY') || trade.symbol.includes('XAU') ? 100 : 10000;
      pips = isBuy ? (closePrice - openPrice) * multiplier : (openPrice - closePrice) * multiplier;
    }

    let rMultiple = trade.r_multiple ?? 0;
    const stopLossVal = trade.stop_loss ?? 0;
    if (stopLossVal > 0 && openPrice > 0) {
      const risk = isBuy ? (openPrice - stopLossVal) : (stopLossVal - openPrice);
      if (risk > 0) {
        const exitPrice = closePrice ?? openPrice;
        const reward = isBuy ? (exitPrice - openPrice) : (openPrice - exitPrice);
        rMultiple = reward / risk;
      }
    }

    const formattedTrade = {
      id: trade.id,
      accountId: trade.account_id,
      ticket: trade.ticket,
      symbol: trade.symbol,
      direction: trade.direction,
      openTime: trade.open_time.toISOString(),
      closeTime: trade.close_time ? trade.close_time.toISOString() : null,
      openPrice: trade.open_price,
      closePrice: trade.close_price,
      lotSize: trade.lot_size,
      stopLoss: trade.stop_loss,
      takeProfit: trade.take_profit,
      profitUsd: trade.profit_usd,
      commission: trade.commission,
      swap: trade.swap,
      pips: trade.pips ?? pips,
      rMultiple: rMultiple,
      maePips: trade.mae_pips,
      maeR: trade.mae_r,
      mfePips: trade.mfe_pips,
      mfeR: trade.mfe_r,
      exitEfficiencyPct: trade.exit_efficiency_pct,
      moneyLeftOnTableR: trade.money_left_on_table_r,
      account: trade.account ? {
        id: trade.account.id,
        brokerName: trade.account.broker_name,
        accountNumber: trade.account.account_number,
        accountType: trade.account.account_type,
      } : null,
      annotation: trade.annotation ? {
        htfBias: trade.annotation.htf_bias ?? null,
        session: trade.annotation.session ?? null,
        marketCondition: trade.annotation.market_condition ?? null,
        analysisTimeframe: trade.annotation.analysis_timeframe ?? null,
        entryTimeframe: trade.annotation.entry_timeframe ?? null,
        thesis: trade.annotation.thesis ?? null,
        expectation: trade.annotation.expectation ?? null,
        lesson: trade.annotation.lesson ?? null,
        conviction: trade.annotation.conviction ?? null,
        emotion: trade.annotation.emotion ?? null,
        notes: trade.annotation.notes ?? null,
        screenshots: trade.annotation.screenshots ?? [],
      } : null,
      setup: trade.setup ? {
        conceptId: trade.setup.concept_id,
        concept: trade.setup.concept ? {
          id: trade.setup.concept.id,
          name: trade.setup.concept.name,
          color: trade.setup.concept.color,
          icon: trade.setup.concept.icon,
        } : null,
      } : null,
      triggers: trade.triggers?.map(t => ({
        conceptId: t.concept_id,
        concept: t.concept ? {
          id: t.concept.id,
          name: t.concept.name,
          color: t.concept.color,
          icon: t.concept.icon,
        } : null,
      })) ?? [],
      confluences: trade.confluences?.map(c => ({
        conceptId: c.concept_id,
        concept: c.concept ? {
          id: c.concept.id,
          name: c.concept.name,
          color: c.concept.color,
          icon: c.concept.icon,
        } : null,
      })) ?? [],
      plan: trade.plan ? {
        maxRisk: trade.plan.max_risk,
        expectedRr: trade.plan.expected_rr,
        entryCondition: trade.plan.entry_condition,
        invalidation: trade.plan.invalidation,
        targetZone: trade.plan.target_zone,
        expectedHoldTime: trade.plan.expected_hold_time,
        planFollowed: trade.plan.plan_followed,
        entryTimingCorrect: trade.plan.entry_timing_correct,
        emotionsAffected: trade.plan.emotions_affected,
        managedAccordingToRules: trade.plan.managed_according_to_rules,
      } : null,
      events: trade.events?.map(e => ({
        id: e.id,
        tradeId: e.trade_id,
        type: e.type,
        timestamp: e.timestamp.toISOString(),
        title: e.title,
        description: e.description,
        metadata: e.metadata,
        attachments: e.attachments,
        createdAt: e.created_at.toISOString(),
      })) ?? [],
      importSource: trade.import_source,
    };

    res.status(200).json(formattedTrade);
  } catch (err: any) {
    console.error('Fetch single trade error:', err);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * DELETE /api/trades/:id
 * Deletes a trade by ID.
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;

    const existing = await prisma.trade.findFirst({
      where: { id, user_id: userId },
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
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;

