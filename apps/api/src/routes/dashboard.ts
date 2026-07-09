import { Router, Response } from 'express';
import { prisma } from '../services/tradeSync';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── Tehran timezone helpers ──────────────────────────────────────────────────

/** Returns YYYY-MM-DD for a given UTC date in Asia/Tehran timezone */
function getTehranDateStr(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Returns the Jalali (Persian) month name for a given date */
function getJalaliMonthName(date: Date): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(date);
  } catch {
    return '';
  }
}

/** Returns YYYY-MM for a given UTC date in Asia/Tehran timezone */
function getTehranMonthStr(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
  }).format(date);
}

/** Returns an array of all date strings (YYYY-MM-DD) in the current Tehran month so far */
function getMonthDateStrings(monthStr: string): string[] {
  const [yearStr, monthStr2] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr2, 10); // 1-12
  const now = new Date();
  const todayInTehran = getTehranDateStr(now);
  const todayDay = parseInt(todayInTehran.split('-')[2], 10);

  const dates: string[] = [];
  for (let day = 1; day <= todayDay; day++) {
    dates.push(
      `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    );
  }
  return dates;
}

/** Convert a UTC Date to a Tehran-day string for grouping */
function dateToTehranDay(date: Date | null | undefined): string | null {
  if (!date) return null;
  return getTehranDateStr(date);
}

// ─── Trading session helper (mirrors frontend getTradingSession) ────────────────
function getTradingSession(date: Date): string {
  try {
    const getNYDateTime = (d: Date) => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        weekday: 'short',
        hour: 'numeric',
        hour12: false,
      });
      const formatted = formatter.format(d);
      const match = formatted.match(/^([A-Za-z]+),\s*(\d+)$/);
      if (!match) return { weekday: '', hour: 0 };
      return { weekday: match[1], hour: parseInt(match[2], 10) };
    };

    const nyInfo = getNYDateTime(date);
    if (
      (nyInfo.weekday === 'Fri' && nyInfo.hour >= 17) ||
      nyInfo.weekday === 'Sat' ||
      (nyInfo.weekday === 'Sun' && nyInfo.hour < 17)
    ) {
      return 'آخر هفته';
    }

    const getHourInTimezone = (tz: string): number => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        hour12: false,
      });
      return parseInt(formatter.format(date), 10);
    };

    const nyHour = getHourInTimezone('America/New_York');
    const londonHour = getHourInTimezone('Europe/London');
    const tokyoHour = getHourInTimezone('Asia/Tokyo');
    const sydneyHour = getHourInTimezone('Australia/Sydney');

    if (londonHour >= 8 && londonHour < 17 && nyHour >= 8 && nyHour < 17) return 'لندن+نیویورک';
    if (londonHour >= 8 && londonHour < 17) return 'لندن';
    if (nyHour >= 8 && nyHour < 17) return 'نیویورک';
    if (tokyoHour >= 9 && tokyoHour < 18) return 'توکیو';
    if (sydneyHour >= 7 && sydneyHour < 16) return 'سیدنی';
    if (sydneyHour >= 16 || sydneyHour < 7) return 'سیدنی';
    return 'نامشخص';
  } catch {
    return 'نامشخص';
  }
}

// ─── Persian weekday names ────────────────────────────────────────────────────
const WEEKDAY_NAMES = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

// ─── Edge insight generation ───────────────────────────────────────────────────
interface EdgeInsight {
  type: 'session' | 'strategy' | 'weekday' | 'emotion' | 'timeframe' | 'fallback';
  insight: string;
  winRate: number;
  sampleSize: number;
}

function generateEdgeInsight(recentTrades: any[], locale = 'fa'): EdgeInsight {
  const MIN_TRADES = 5;
  const closedTrades = recentTrades.filter((t) => t.close_time !== null);
  const isFa = locale === 'fa';

  const getSessionName = (sess: string, isFa: boolean) => {
    if (isFa) return sess;
    const map: Record<string, string> = {
      'آخر هفته': 'Weekend',
      'لندن+نیویورک': 'London + New York',
      'لندن': 'London',
      'نیویورک': 'New York',
      'توکیو': 'Tokyo',
      'سیدنی': 'Sydney',
      'نامشخص': 'Unknown',
    };
    return map[sess] || sess;
  };

  const getWeekdayName = (day: string, isFa: boolean) => {
    if (isFa) return day;
    const map: Record<string, string> = {
      'یکشنبه': 'Sunday',
      'دوشنبه': 'Monday',
      'سه‌شنبه': 'Tuesday',
      'چهارشنبه': 'Wednesday',
      'پنج‌شنبه': 'Thursday',
      'جمعه': 'Friday',
      'شنبه': 'Saturday',
    };
    return map[day] || day;
  };

  const getEmotionName = (emoKey: string, isFa: boolean) => {
    const faMap: Record<string, string> = {
      CONFIDENT: 'با اعتماد به نفس',
      NEUTRAL: 'بی‌تفاوت (خنثی)',
      ANXIOUS: 'مضطرب',
      FOMO: 'طمع‌کار (FOMO)',
      REVENGE: 'خشمگین (انتقام‌جو)',
      UNKNOWN: 'آرام / نامشخص'
    };
    const enMap: Record<string, string> = {
      CONFIDENT: 'Confident',
      NEUTRAL: 'Neutral',
      ANXIOUS: 'Anxious',
      FOMO: 'FOMO',
      REVENGE: 'Revenge',
      UNKNOWN: 'Calm / Unknown'
    };
    const map = isFa ? faMap : enMap;
    return map[emoKey] || emoKey;
  };

  if (closedTrades.length < MIN_TRADES) {
    return {
      type: 'fallback',
      insight: isFa
        ? `بعد از ${MIN_TRADES - closedTrades.length} معامله بیشتر، برتری معاملاتیت رو بهت نشون می‌دیم`
        : `We'll show your trading edge after ${MIN_TRADES - closedTrades.length} more trades`,
      winRate: 0,
      sampleSize: closedTrades.length,
    };
  }

  interface GroupStat {
    label: string;
    wins: number;
    total: number;
    pnl: number;
  }

  // 1. Sessions
  const sessions: Record<string, GroupStat> = {};
  // 2. Strategy tags
  const strategies: Record<string, GroupStat> = {};
  // 3. Weekdays
  const weekdays: Record<string, GroupStat & { idx: number }> = {};
  // 4. Emotions
  const emotions: Record<string, GroupStat> = {};
  // 5. Timeframes
  const analysisTfs: Record<string, GroupStat> = {};
  const entryTfs: Record<string, GroupStat> = {};
  
  for (const t of closedTrades) {
    const isWin = t.profit_usd > 0;
    const net = t.profit_usd + (t.commission ?? 0) + (t.swap ?? 0);
    const openDate = new Date(t.open_time);
    
    // Analysis Timeframe
    if (t.analysis_timeframe) {
      if (!analysisTfs[t.analysis_timeframe]) {
        analysisTfs[t.analysis_timeframe] = { label: t.analysis_timeframe, wins: 0, total: 0, pnl: 0 };
      }
      analysisTfs[t.analysis_timeframe].total++;
      analysisTfs[t.analysis_timeframe].pnl += net;
      if (isWin) analysisTfs[t.analysis_timeframe].wins++;
    }

    // Entry Timeframe
    if (t.entry_timeframe) {
      if (!entryTfs[t.entry_timeframe]) {
        entryTfs[t.entry_timeframe] = { label: t.entry_timeframe, wins: 0, total: 0, pnl: 0 };
      }
      entryTfs[t.entry_timeframe].total++;
      entryTfs[t.entry_timeframe].pnl += net;
      if (isWin) entryTfs[t.entry_timeframe].wins++;
    }

    // Session
    const session = getTradingSession(openDate);
    if (!sessions[session]) sessions[session] = { label: session, wins: 0, total: 0, pnl: 0 };
    sessions[session].total++;
    sessions[session].pnl += net;
    if (isWin) sessions[session].wins++;

    // Strategy tags
    const tags = Array.isArray(t.tags) ? t.tags : [];
    for (const tag of tags) {
      if (!strategies[tag]) strategies[tag] = { label: tag, wins: 0, total: 0, pnl: 0 };
      strategies[tag].total++;
      strategies[tag].pnl += net;
      if (isWin) strategies[tag].wins++;
    }

    // Weekday
    const dayIdx = openDate.getDay();
    const dayName = WEEKDAY_NAMES[dayIdx];
    if (!weekdays[dayName]) weekdays[dayName] = { label: dayName, idx: dayIdx, wins: 0, total: 0, pnl: 0 };
    weekdays[dayName].total++;
    weekdays[dayName].pnl += net;
    if (isWin) weekdays[dayName].wins++;

    // Emotion
    const emo = t.emotion || 'UNKNOWN';
    if (!emotions[emo]) emotions[emo] = { label: emo, wins: 0, total: 0, pnl: 0 };
    emotions[emo].total++;
    emotions[emo].pnl += net;
    if (isWin) emotions[emo].wins++;
  }

  const pickBest = (group: Record<string, GroupStat>): GroupStat | null => {
    const candidates = Object.values(group).filter((g) => g.total >= MIN_TRADES);
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.wins / b.total - a.wins / a.total);
    return candidates[0];
  };

  // Priority 1: Best session
  const bestSession = pickBest(sessions);
  if (bestSession) {
    const wr = Math.round((bestSession.wins / bestSession.total) * 100);
    return {
      type: 'session',
      insight: isFa
        ? `این ماه بهترین عملکردت رو تو سشن ${getSessionName(bestSession.label, true)} داشتی — ${wr}٪ موفقیت`
        : `This month you had your best performance in the ${getSessionName(bestSession.label, false)} session — ${wr}% win rate`,
      winRate: wr,
      sampleSize: bestSession.total,
    };
  }

  // Priority 2: Best strategy tag
  const bestStrategy = pickBest(strategies);
  if (bestStrategy) {
    const wr = Math.round((bestStrategy.wins / bestStrategy.total) * 100);
    return {
      type: 'strategy',
      insight: isFa
        ? `استراتژی ${bestStrategy.label} با ${wr}٪ موفقیت بهترین setup توئه`
        : `Strategy ${bestStrategy.label} is your best setup with a ${wr}% win rate`,
      winRate: wr,
      sampleSize: bestStrategy.total,
    };
  }

  // Priority 2.5: Best analysis or entry timeframe
  const bestAnalysisTf = pickBest(analysisTfs);
  const bestEntryTf = pickBest(entryTfs);
  if (bestAnalysisTf && (!bestEntryTf || (bestAnalysisTf.wins / bestAnalysisTf.total >= bestEntryTf.wins / bestEntryTf.total))) {
    const wr = Math.round((bestAnalysisTf.wins / bestAnalysisTf.total) * 100);
    return {
      type: 'timeframe',
      insight: isFa
        ? `بیشترین سوددهی را در تایم‌فریم تحلیل ${bestAnalysisTf.label} با ${wr}٪ موفقیت داشته‌ای`
        : `You had the highest profitability using ${bestAnalysisTf.label} analysis timeframe with a ${wr}% win rate`,
      winRate: wr,
      sampleSize: bestAnalysisTf.total,
    };
  } else if (bestEntryTf) {
    const wr = Math.round((bestEntryTf.wins / bestEntryTf.total) * 100);
    return {
      type: 'timeframe',
      insight: isFa
        ? `بهترین عملکردت برای ورود در تایم‌فریم ${bestEntryTf.label} با ${wr}٪ موفقیت بوده`
        : `Your best entry performance was in the ${bestEntryTf.label} timeframe with a ${wr}% win rate`,
      winRate: wr,
      sampleSize: bestEntryTf.total,
    };
  }

  // Priority 3: Best weekday
  const bestWeekday = pickBest(weekdays as unknown as Record<string, GroupStat>);
  if (bestWeekday) {
    const avgPnl = bestWeekday.pnl / bestWeekday.total;
    const sign = avgPnl >= 0 ? '+' : '';
    return {
      type: 'weekday',
      insight: isFa
        ? `${getWeekdayName(bestWeekday.label, true)} بهترین روز تریدته — میانگین ${sign}$${Math.round(avgPnl)} سود`
        : `${getWeekdayName(bestWeekday.label, false)} is your best trading day — average ${sign}$${Math.round(avgPnl)} profit`,
      winRate: Math.round((bestWeekday.wins / bestWeekday.total) * 100),
      sampleSize: bestWeekday.total,
    };
  }

  // Priority 4: Emotion vs outcome
  const emotionEntries = Object.entries(emotions).filter(([, g]) => g.total >= MIN_TRADES);
  if (emotionEntries.length >= 2) {
    emotionEntries.sort((a, b) => b[1].wins / b[1].total - a[1].wins / a[1].total);
    const best = emotionEntries[0][1];
    const worst = emotionEntries[emotionEntries.length - 1][1];
    const bestWr = Math.round((best.wins / best.total) * 100);
    const worstWr = Math.round((worst.wins / worst.total) * 100);
    const bestLabel = getEmotionName(best.label, isFa);
    const worstLabel = getEmotionName(worst.label, isFa);
    return {
      type: 'emotion',
      insight: isFa
        ? `وقتی ${bestLabel} تریدی، ${bestWr}٪ موفقیتی. وقتی ${worstLabel}، ${worstWr}٪`
        : `When you are ${bestLabel}, you have a ${bestWr}% win rate. When ${worstLabel}, it is ${worstWr}%`,
      winRate: bestWr,
      sampleSize: best.total,
    };
  }

  return {
    type: 'fallback',
    insight: isFa
      ? `بعد از ${MIN_TRADES} معامله بیشتر، برتری معاملاتیت رو بهت نشون می‌دیم`
      : `We'll show your trading edge after ${MIN_TRADES} more trades`,
    winRate: 0,
    sampleSize: closedTrades.length,
  };
}

// ─── Main dashboard summary endpoint ───────────────────────────────────────────
/**
 * GET /api/dashboard/summary
 * Returns combined dashboard data: today, month, edge, recent.
 * Single call to avoid waterfall requests on page load.
 */
router.get('/summary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const accountId = (req.query.accountId as string | undefined) || 'all';
    const locale = (req.query.locale as string) || 'fa';

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'کاربر یافت نشد' });
    }

    const plan = user.plan;
    let dateLimit: Date | null = null;
    if (plan === 'FREE') {
      dateLimit = new Date();
      dateLimit.setMonth(dateLimit.getMonth() - 1);
    } else if (plan === 'STANDARD') {
      dateLimit = new Date();
      dateLimit.setMonth(dateLimit.getMonth() - 6);
    }

    const filterAccount = accountId && accountId !== 'all';
    const accountWhere = {
      user_id: userId,
      ...(filterAccount ? { account_id: accountId } : {}),
      ...(dateLimit ? { open_time: { gte: dateLimit } } : {}),
    };

    const now = new Date();
    const todayStr = getTehranDateStr(now);
    const monthStr = getTehranMonthStr(now);

    // ─── Fetch all user trades (we'll filter in JS for the various groupings) ────
    const allTrades = await prisma.trade.findMany({
      where: accountWhere,
      orderBy: { open_time: 'desc' },
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
        tags: true,
        emotion: true,
        notes: true,
        import_source: true,
        analysis_timeframe: true,
        entry_timeframe: true,
      },
    });

    // ─── SECTION 1: TODAY ──────────────────────────────────────────────────────
    const todayTrades = allTrades.filter((t) => {
      // Trade "today" if it was closed today OR opened today and still open
      const closeDay = dateToTehranDay(t.close_time);
      const openDay = dateToTehranDay(t.open_time);
      return closeDay === todayStr || openDay === todayStr;
    });

    const todayClosed = todayTrades.filter((t) => t.close_time !== null);
    const todayPnl = todayClosed.reduce(
      (sum, t) => sum + t.profit_usd + (t.commission ?? 0) + (t.swap ?? 0),
      0
    );
    const todayWins = todayClosed.filter((t) => t.profit_usd > 0).length;
    const todayLosses = todayClosed.filter((t) => t.profit_usd <= 0).length;

    // Current streak: walk backward from most recent closed trade
    let streak = { count: 0, type: 'none' as 'win' | 'loss' | 'none' };
    const closedChrono = allTrades
      .filter((t) => t.close_time !== null)
      .sort(
        (a, b) => new Date(b.close_time!).getTime() - new Date(a.close_time!).getTime()
      );

    if (closedChrono.length > 0) {
      const lastTrade = closedChrono[0];
      const lastNet = lastTrade.profit_usd + (lastTrade.commission ?? 0) + (lastTrade.swap ?? 0);
      if (lastNet > 0) {
        streak.type = 'win';
        for (const t of closedChrono) {
          const net = t.profit_usd + (t.commission ?? 0) + (t.swap ?? 0);
          if (net > 0) streak.count++;
          else break;
        }
      } else if (lastNet < 0) {
        streak.type = 'loss';
        for (const t of closedChrono) {
          const net = t.profit_usd + (t.commission ?? 0) + (t.swap ?? 0);
          if (net < 0) streak.count++;
          else break;
        }
      }
    }

    // Journal status today
    const todayJournalDate = new Date(`${todayStr}T00:00:00.000Z`);
    const todayEntry = await prisma.journalEntry.findFirst({
      where: {
        user_id: userId,
        date: todayJournalDate,
      },
    });

    const today = {
      pnl: todayPnl,
      tradeCount: todayClosed.length,
      wins: todayWins,
      losses: todayLosses,
      streak,
      journal: {
        written: !!todayEntry,
        mood: todayEntry?.mood ?? null,
        preview: todayEntry?.body?.slice(0, 80) ?? '',
      },
      hasTradedToday: todayTrades.length > 0,
    };

    // ─── SECTION 2: THIS MONTH ─────────────────────────────────────────────────
    const monthTrades = allTrades.filter((t) => {
      const closeDay = dateToTehranDay(t.close_time);
      const openDay = dateToTehranDay(t.open_time);
      const day = closeDay || openDay;
      return day !== null && day.startsWith(monthStr);
    });

    const monthClosed = monthTrades.filter((t) => t.close_time !== null);

    // Equity curve: daily cumulative P&L
    const dailyPnl: Record<string, number> = {};
    for (const t of monthClosed) {
      const day = dateToTehranDay(t.close_time)!;
      const net = t.profit_usd + (t.commission ?? 0) + (t.swap ?? 0);
      if (!dailyPnl[day]) dailyPnl[day] = 0;
      dailyPnl[day] += net;
    }

    const sortedDays = Object.keys(dailyPnl).sort();
    let cumPnl = 0;
    const equityCurve = sortedDays.map((day) => {
      cumPnl += dailyPnl[day];
      return { date: day, cumPnl: parseFloat(cumPnl.toFixed(2)) };
    });

    // Month KPIs
    const monthWinners = monthClosed.filter((t) => t.profit_usd > 0);
    const monthLosers = monthClosed.filter((t) => t.profit_usd <= 0);
    const grossProfit = monthWinners.reduce((s, t) => s + t.profit_usd, 0);
    const grossLoss = Math.abs(monthLosers.reduce((s, t) => s + t.profit_usd, 0));

    const winRate = monthClosed.length > 0
      ? Math.round((monthWinners.length / monthClosed.length) * 100)
      : 0;
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 99 : 0) : grossProfit / grossLoss;
    const avgR = monthClosed.length > 0
      ? monthClosed.reduce((s, t) => s + (t.r_multiple ?? 0), 0) / monthClosed.length
      : 0;

    // Max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let runningSum = 0;
    const chronoMonth = [...monthClosed].sort(
      (a, b) => new Date(a.close_time!).getTime() - new Date(b.close_time!).getTime()
    );
    for (const t of chronoMonth) {
      const net = t.profit_usd + (t.commission ?? 0) + (t.swap ?? 0);
      runningSum += net;
      if (runningSum > peak) peak = runningSum;
      const dd = peak - runningSum;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    const month = {
      equityCurve,
      kpis: {
        winRate,
        profitFactor: parseFloat(profitFactor.toFixed(2)),
        avgR: parseFloat(avgR.toFixed(2)),
        maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
        totalTrades: monthClosed.length,
      },
      monthName: getJalaliMonthName(now),
      hasTrades: monthClosed.length > 0,
    };

    // ─── SECTION 3: EDGE INSIGHT (last 30 days) ────────────────────────────────
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recent30 = allTrades.filter(
      (t) => new Date(t.open_time) >= thirtyDaysAgo
    );
    const edge = generateEdgeInsight(recent30, locale);

    // ─── SECTION 4: RECENT ACTIVITY ────────────────────────────────────────────
    // Last 5 trades (by close_time desc, then open_time for open trades)
    const recentTradesList = [...allTrades]
      .sort((a, b) => {
        const aTime = a.close_time ? new Date(a.close_time).getTime() : new Date(a.open_time).getTime();
        const bTime = b.close_time ? new Date(b.close_time).getTime() : new Date(b.open_time).getTime();
        return bTime - aTime;
      })
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        ticket: t.ticket,
        symbol: t.symbol,
        direction: t.direction,
        openTime: t.open_time.toISOString(),
        closeTime: t.close_time ? t.close_time.toISOString() : null,
        openPrice: t.open_price,
        closePrice: t.close_price,
        profitUsd: t.profit_usd,
        commission: t.commission,
        swap: t.swap,
        pips: t.pips,
        rMultiple: t.r_multiple,
        tags: t.tags,
        emotion: t.emotion,
        direction_is_buy: t.direction === 'BUY',
      }));

    // Last journal entry
    const lastJournal = await prisma.journalEntry.findFirst({
      where: { user_id: userId },
      orderBy: { date: 'desc' },
    });

    const recent = {
      trades: recentTradesList,
      journalEntry: lastJournal
        ? {
          date: lastJournal.date.toISOString(),
          mood: lastJournal.mood,
          preview: lastJournal.body.slice(0, 150),
        }
        : null,
    };

    // ─── Total trade count (for empty-state decisions) ────────────────────────
    const totalTrades = allTrades.length;

    return res.status(200).json({
      today,
      month,
      edge,
      recent,
      totalTrades,
    });
  } catch (err: any) {
    console.error('Dashboard summary error:', err);
    return res.status(500).json({ error: err.message || 'خطای داخلی سرور' });
  }
});

export default router;