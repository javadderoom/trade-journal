import { prisma } from './tradeSync';

export type TradeListRow = {
  id: string;
  accountId: string;
  ticket: string | null;
  symbol: string;
  direction: 'BUY' | 'SELL';
  openTime: string;
  closeTime: string | null;
  openPrice: number;
  closePrice: number | null;
  lotSize: number;
  stopLoss: number | null;
  takeProfit: number | null;
  profitUsd: number;
  commission: number;
  swap: number;
  pips: number | null;
  rMultiple: number | null;
  annotation: {
    htfBias?: string | null;
    session?: string | null;
    marketCondition?: string | null;
    thesis?: string | null;
    expectation?: string | null;
    lesson?: string | null;
    conviction?: string | null;
    emotion?: string | null;
    notes?: string | null;
    screenshots?: string[];
  } | null;
  setup?: { concept: { id: string; name: string; color: string | null; icon: string | null } } | null;
  triggers?: { concept: { id: string; name: string; color: string | null; icon: string | null } }[];
  confluences?: { concept: { id: string; name: string; color: string | null; icon: string | null } }[];
  plan?: {
    maxRisk?: number | null;
    expectedRr?: number | null;
    entryCondition?: string | null;
    invalidation?: string | null;
    targetZone?: string | null;
    expectedHoldTime?: string | null;
    planFollowed?: boolean | null;
    entryTimingCorrect?: boolean | null;
    emotionsAffected?: boolean | null;
    managedAccordingToRules?: boolean | null;
  } | null;
  events?: {
    id: string;
    tradeId: string;
    type: string;
    timestamp: string;
    title: string;
    description: string | null;
    metadata: any;
    attachments: string[];
    createdAt: string;
  }[];
  importSource?: string;
  accountType?: string;
};

export async function getTradesForAccount(params: {
  userId: string;
  accountId?: string;
  limit?: number;
  offset?: number;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  plan?: string;
  search?: string;
  emotion?: string;
  symbol?: string;
  direction?: 'BUY' | 'SELL';
  status?: 'OPEN' | 'CLOSED';
  dates?: string[];
}): Promise<{ items: TradeListRow[]; totalCount: number }> {
  const { userId, accountId, search, emotion, symbol, direction, status, dates } = params;
  const limit = Math.min(Math.max(params.limit ?? 100, 1), 500);
  const offset = Math.max(params.offset ?? 0, 0);

  const filterAccount = accountId && accountId !== 'all';

  // Map client sort keys to Prisma column names
  const sortColumnMap: Record<string, string> = {
    date: 'open_time',
    symbol: 'symbol',
    direction: 'direction',
    volume: 'lot_size',
    pnl: 'profit_usd',
    rr: 'r_multiple',
  };
  const sortCol = sortColumnMap[params.sortKey || ''] || 'open_time';
  const sortDir = params.sortDir === 'asc' ? 'asc' : 'desc';

  let plan = params.plan;
  if (!plan) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    plan = user?.plan || 'FREE';
  }

  let dateLimit: Date | null = null;
  if (plan === 'FREE') {
    dateLimit = new Date();
    dateLimit.setMonth(dateLimit.getMonth() - 1);
  } else if (plan === 'STANDARD') {
    dateLimit = new Date();
    dateLimit.setMonth(dateLimit.getMonth() - 6);
  }

  // Build the andConditions array to safely combine all filters
  const andConditions: any[] = [];

  if (filterAccount) {
    andConditions.push({ account_id: accountId });
  }

  if (dateLimit) {
    andConditions.push({ open_time: { gte: dateLimit } });
  }

  if (symbol && symbol !== 'همه نمادها' && symbol !== 'All Symbols') {
    if (symbol.startsWith('main:')) {
      const mainPair = symbol.substring(5);
      andConditions.push({ symbol: { contains: mainPair, mode: 'insensitive' } });
    } else {
      andConditions.push({ symbol });
    }
  }

  if (direction) {
    andConditions.push({ direction });
  }

  if (status === 'OPEN') {
    andConditions.push({ close_time: null });
  } else if (status === 'CLOSED') {
    andConditions.push({ close_time: { not: null } });
  }

  if (dates && dates.length > 0) {
    andConditions.push({
      OR: dates.map((dateStr) => {
        const startDate = new Date(`${dateStr}T00:00:00.000Z`);
        const endDate = new Date(`${dateStr}T23:59:59.999Z`);
        return {
          close_time: {
            gte: startDate,
            lte: endDate,
          },
        };
      }),
    });
  }

  if (emotion && emotion.trim()) {
    andConditions.push({
      annotation: {
        emotion: { equals: emotion.trim(), mode: 'insensitive' },
      },
    });
  }

  if (search && search.trim()) {
    const q = search.trim();
    andConditions.push({
      OR: [
        { symbol: { contains: q, mode: 'insensitive' } },
        { ticket: { contains: q, mode: 'insensitive' } },
        { annotation: { emotion: { contains: q, mode: 'insensitive' } } },
        { annotation: { notes: { contains: q, mode: 'insensitive' } } },
        { annotation: { thesis: { contains: q, mode: 'insensitive' } } },
        { annotation: { lesson: { contains: q, mode: 'insensitive' } } },
        { setup: { concept: { name: { contains: q, mode: 'insensitive' } } } },
      ]
    });
  }

  const whereClause: any = {
    user_id: userId,
    ...(andConditions.length > 0 ? { AND: andConditions } : {})
  };

  const [totalCount, trades] = await Promise.all([
    prisma.trade.count({ where: whereClause }),
    prisma.trade.findMany({
      where: whereClause,
      orderBy: { [sortCol]: sortDir },
      skip: offset,
      take: limit,
      select: {
        id: true,
        account_id: true,
        ticket: true,
        symbol: true,
        direction: true,
        open_time: true,
        close_time: true,
        open_price: true,
        close_price: true,
        lot_size: true,
        stop_loss: true,
        take_profit: true,
        profit_usd: true,
        commission: true,
        swap: true,
        pips: true,
        r_multiple: true,
        import_source: true,
        account: { select: { account_type: true } },
        annotation: {
          select: {
            htf_bias: true,
            session: true,
            market_condition: true,
            thesis: true,
            expectation: true,
            lesson: true,
            conviction: true,
            emotion: true,
            notes: true,
            screenshots: true,
          },
        },
        setup: { select: { concept: { select: { id: true, name: true, color: true, icon: true } } } },
        triggers: { select: { concept: { select: { id: true, name: true, color: true, icon: true } } } },
        confluences: { select: { concept: { select: { id: true, name: true, color: true, icon: true } } } },
        plan: {
          select: {
            max_risk: true,
            expected_rr: true,
            entry_condition: true,
            invalidation: true,
            target_zone: true,
            expected_hold_time: true,
            plan_followed: true,
            entry_timing_correct: true,
            emotions_affected: true,
            managed_according_to_rules: true,
          }
        },
        events: {
          orderBy: { timestamp: 'asc' }
        }
      },
    })
  ]);

  const items = trades.map((t: any) => ({
    id: t.id,
    accountId: t.account_id,
    ticket: t.ticket,
    symbol: t.symbol,
    direction: t.direction as 'BUY' | 'SELL',
    openTime: t.open_time.toISOString(),
    closeTime: t.close_time ? t.close_time.toISOString() : null,
    openPrice: t.open_price,
    closePrice: t.close_price,
    lotSize: t.lot_size,
    stopLoss: t.stop_loss,
    takeProfit: t.take_profit,
    profitUsd: t.profit_usd,
    commission: t.commission,
    swap: t.swap,
    pips: t.pips,
    rMultiple: t.r_multiple,
    annotation: t.annotation ? {
      htfBias: t.annotation.htf_bias,
      session: t.annotation.session,
      marketCondition: t.annotation.market_condition,
      thesis: t.annotation.thesis,
      expectation: t.annotation.expectation,
      lesson: t.annotation.lesson,
      conviction: t.annotation.conviction,
      emotion: t.annotation.emotion,
      notes: t.annotation.notes,
      screenshots: t.annotation.screenshots,
    } : null,
    setup: (t as any).setup || null,
    triggers: t.triggers,
    confluences: t.confluences,
    plan: t.plan ? {
      maxRisk: t.plan.max_risk,
      expectedRr: t.plan.expected_rr,
      entryCondition: t.plan.entry_condition,
      invalidation: t.plan.invalidation,
      targetZone: t.plan.target_zone,
      expectedHoldTime: t.plan.expected_hold_time,
      planFollowed: t.plan.plan_followed,
      entryTimingCorrect: t.plan.entry_timing_correct,
      emotionsAffected: t.plan.emotions_affected,
      managedAccordingToRules: t.plan.managed_according_to_rules,
    } : null,
    events: t.events ? t.events.map((e: any) => ({
      id: e.id,
      tradeId: e.trade_id,
      type: e.type,
      timestamp: e.timestamp.toISOString(),
      title: e.title,
      description: e.description,
      metadata: e.metadata,
      attachments: e.attachments,
      createdAt: e.created_at.toISOString(),
    })) : [],
    importSource: t.import_source,
    accountType: t.account.account_type,
  }));

  return { items, totalCount };
}
