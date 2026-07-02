import { PrismaClient } from '@prisma/client';

export interface SuggestedMistake {
  ruleKey: string;
  label: string;
  reason: string;
  costUsd: number;
}

type PrismaTrade = {
  id: string;
  user_id: string;
  account_id: string;
  symbol: string;
  direction: string;
  open_time: Date;
  close_time: Date | null;
  open_price: number;
  close_price: number | null;
  lot_size: number;
  stop_loss: number | null;
  take_profit: number | null;
  profit_usd: number;
  tags: string[];
};

/**
 * Runs all 6 mistake-detection rules against a trade.
 * Only fires on closed losing trades (profit_usd < 0 AND close_time !== null).
 * Returns an array of SuggestedMistake — empty if no rules fire or trade is profitable.
 */
export async function detectMistakes(
  trade: PrismaTrade,
  prisma: PrismaClient
): Promise<SuggestedMistake[]> {
  if (trade.profit_usd >= 0 || trade.close_time === null) return [];

  const costUsd = Math.abs(trade.profit_usd);
  const results: SuggestedMistake[] = [];

  // Rule 1: NO_SL
  const noSl = checkNoSL(trade, costUsd);
  if (noSl) results.push(noSl);

  // Rule 2: SL_NOT_RESPECTED (only if SL is set — avoids double-firing with NO_SL)
  if (!noSl) {
    const slNotRespected = checkSLNotRespected(trade, costUsd);
    if (slNotRespected) results.push(slNotRespected);
  }

  // Rule 3: REVENGE_TRADE
  const revenge = await checkRevengeTrade(trade, prisma, costUsd);
  if (revenge) results.push(revenge);

  // Rule 4: UNUSUAL_SIZE
  const unusualSize = await checkUnusualSize(trade, prisma, costUsd);
  if (unusualSize) results.push(unusualSize);

  // Rule 5: WEAK_STRATEGY
  const weakStrategy = await checkWeakStrategy(trade, prisma, costUsd);
  if (weakStrategy) results.push(weakStrategy);

  // Rule 6: WEAK_HOUR
  const weakHour = await checkWeakHour(trade, prisma, costUsd);
  if (weakHour) results.push(weakHour);

  return results;
}

// ─── Rule Implementations ────────────────────────────────────────────────────

function checkNoSL(trade: PrismaTrade, costUsd: number): SuggestedMistake | null {
  if (trade.stop_loss && trade.stop_loss > 0) return null;
  return {
    ruleKey: 'NO_SL',
    label: 'بدون حد ضرر',
    reason: 'این معامله بدون تعیین حد ضرر وارد شد و به ضرر ختم شد.',
    costUsd,
  };
}

function checkSLNotRespected(trade: PrismaTrade, costUsd: number): SuggestedMistake | null {
  if (!trade.stop_loss || trade.stop_loss <= 0 || trade.close_price === null) return null;

  const isBuy = trade.direction === 'BUY';
  const slDistance = isBuy
    ? trade.open_price - trade.stop_loss
    : trade.stop_loss - trade.open_price;

  if (slDistance <= 0) return null;

  const actualMovement = isBuy
    ? trade.open_price - trade.close_price
    : trade.close_price - trade.open_price;

  const ratio = actualMovement / slDistance;
  if (ratio < 1.3) return null;

  return {
    ruleKey: 'SL_NOT_RESPECTED',
    label: 'حد ضرر رعایت نشد',
    reason: `ضرر واقعی ${ratio.toFixed(1)}× بزرگ‌تر از فاصله حد ضرر ثبت‌شده بود. (این یک استنتاج است — MT4/MT5 تاریخچه ویرایش سفارشات را ذخیره نمی‌کند.)`,
    costUsd,
  };
}

async function checkRevengeTrade(
  trade: PrismaTrade,
  prisma: PrismaClient,
  costUsd: number
): Promise<SuggestedMistake | null> {
  const windowStart = new Date(trade.open_time.getTime() - 15 * 60 * 1000);

  const priorLoss = await prisma.trade.findFirst({
    where: {
      user_id: trade.user_id,
      id: { not: trade.id },
      close_time: { gte: windowStart, lt: trade.open_time },
      profit_usd: { lt: 0 },
    },
    orderBy: { close_time: 'desc' },
    select: { lot_size: true, close_time: true },
  });

  if (!priorLoss) return null;
  if (trade.lot_size < priorLoss.lot_size * 1.5) return null;

  const minsSince = Math.round(
    (trade.open_time.getTime() - (priorLoss.close_time?.getTime() ?? 0)) / 60000
  );

  return {
    ruleKey: 'REVENGE_TRADE',
    label: 'ترید انتقامی',
    reason: `این معامله ${minsSince} دقیقه پس از یک ضرر، با حجم ${(trade.lot_size / priorLoss.lot_size).toFixed(1)}× بیشتر باز شد.`,
    costUsd,
  };
}

async function checkUnusualSize(
  trade: PrismaTrade,
  prisma: PrismaClient,
  costUsd: number
): Promise<SuggestedMistake | null> {
  const recent = await prisma.trade.findMany({
    where: {
      user_id: trade.user_id,
      id: { not: trade.id },
      close_time: { not: null },
    },
    orderBy: { close_time: 'desc' },
    take: 20,
    select: { lot_size: true },
  });

  if (recent.length < 5) return null;

  const avg = recent.reduce((s, t) => s + t.lot_size, 0) / recent.length;
  if (trade.lot_size < avg * 2) return null;

  return {
    ruleKey: 'UNUSUAL_SIZE',
    label: 'حجم غیرعادی',
    reason: `حجم این معامله (${trade.lot_size}) حدود ${(trade.lot_size / avg).toFixed(1)}× بیشتر از میانگین ۲۰ معامله اخیر (${avg.toFixed(2)}) بود.`,
    costUsd,
  };
}

async function checkWeakStrategy(
  trade: PrismaTrade,
  prisma: PrismaClient,
  costUsd: number
): Promise<SuggestedMistake | null> {
  if (!trade.tags || trade.tags.length === 0) return null;

  for (const tag of trade.tags) {
    const tagTrades = await prisma.trade.findMany({
      where: {
        user_id: trade.user_id,
        id: { not: trade.id },
        tags: { has: tag },
        close_time: { not: null },
      },
      orderBy: { close_time: 'desc' },
      take: 50,
      select: { profit_usd: true },
    });

    if (tagTrades.length < 10) continue;

    const wins = tagTrades.filter(t => t.profit_usd > 0).length;
    const winRate = wins / tagTrades.length;

    if (winRate < 0.35) {
      return {
        ruleKey: 'WEAK_STRATEGY',
        label: 'استراتژی ضعیف تکرار شده',
        reason: `استراتژی "${tag}" در ${tagTrades.length} معامله اخیر فقط ${Math.round(winRate * 100)}٪ نرخ برد داشته.`,
        costUsd,
      };
    }
  }

  return null;
}

function getTeheranHour(date: Date): number {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tehran',
      hour: '2-digit',
      hour12: false,
    });
    return parseInt(fmt.format(date), 10) % 24;
  } catch {
    return date.getUTCHours();
  }
}

async function checkWeakHour(
  trade: PrismaTrade,
  prisma: PrismaClient,
  costUsd: number
): Promise<SuggestedMistake | null> {
  const openHour = getTeheranHour(trade.open_time);

  const allClosed = await prisma.trade.findMany({
    where: {
      user_id: trade.user_id,
      id: { not: trade.id },
      close_time: { not: null },
    },
    orderBy: { close_time: 'desc' },
    take: 200,
    select: { open_time: true, profit_usd: true },
  });

  const sameHour = allClosed.filter(t => getTeheranHour(t.open_time) === openHour);
  if (sameHour.length < 10) return null;

  const wins = sameHour.filter(t => t.profit_usd > 0).length;
  const winRate = wins / sameHour.length;
  if (winRate >= 0.30) return null;

  return {
    ruleKey: 'WEAK_HOUR',
    label: 'معامله در ساعت ضعیف',
    reason: `در ساعت ${openHour}:00 تهران، نرخ برد شما ${Math.round(winRate * 100)}٪ است (از ${sameHour.length} معامله) — زیر آستانه ۳۰٪.`,
    costUsd,
  };
}
