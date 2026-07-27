import { PositionState } from '../BacktestChart';
import { ExecutedTrade } from '../OrderPanel';

/** Detect asset class from symbol */
export function getAssetClass(symbol: string): 'crypto' | 'gold' | 'jpy' | 'forex' {
  if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('SOL')) return 'crypto';
  if (symbol === 'XAUUSD') return 'gold';
  if (symbol.includes('JPY')) return 'jpy';
  return 'forex';
}

/** Pip divisor for a given asset class */
function pipDivider(asset: 'crypto' | 'gold' | 'jpy' | 'forex'): number {
  switch (asset) {
    case 'crypto': return 1;
    case 'gold': return 0.1;
    case 'jpy': return 0.01;
    case 'forex': return 0.0001;
  }
}

/** Calculate raw PnL and pip count for a closed trade */
export function calcPnL(
  asset: 'crypto' | 'gold' | 'jpy' | 'forex',
  type: 'BUY' | 'SELL',
  entryPrice: number,
  exitPrice: number,
  lotSize: number,
): { pnlUsd: number; pips: number } {
  const priceDiff = type === 'BUY'
    ? exitPrice - entryPrice
    : entryPrice - exitPrice;

  const pips = priceDiff / pipDivider(asset);

  let pnlUsd = 0;
  switch (asset) {
    case 'crypto':
      pnlUsd = priceDiff * lotSize;
      break;
    case 'gold':
      pnlUsd = priceDiff * 100 * lotSize;
      break;
    case 'jpy':
      pnlUsd = (priceDiff / exitPrice) * 100000 * lotSize;
      break;
    case 'forex':
      pnlUsd = priceDiff * 100000 * lotSize;
      break;
  }

  return { pnlUsd, pips };
}

/** Calculate R-multiple based on SL distance */
export function calcRMultiple(
  type: 'BUY' | 'SELL',
  entryPrice: number,
  exitPrice: number,
  stopLoss: number | null,
): number {
  if (!stopLoss) return 0;

  const priceDiff = type === 'BUY'
    ? exitPrice - entryPrice
    : entryPrice - exitPrice;

  const slDiff = Math.abs(entryPrice - stopLoss);
  return slDiff > 0 ? priceDiff / slDiff : 0;
}

/** Check if a candle hits SL or TP for a position */
export function checkSLTPHit(
  type: 'BUY' | 'SELL',
  candleHigh: number,
  candleLow: number,
  stopLoss: number | null,
  takeProfit: number | null,
): { exitPrice: number; reason: string } | null {
  if (type === 'BUY') {
    if (stopLoss && candleLow <= stopLoss) return { exitPrice: stopLoss, reason: 'SL' };
    if (takeProfit && candleHigh >= takeProfit) return { exitPrice: takeProfit, reason: 'TP' };
  } else {
    if (stopLoss && candleHigh >= stopLoss) return { exitPrice: stopLoss, reason: 'SL' };
    if (takeProfit && candleLow <= takeProfit) return { exitPrice: takeProfit, reason: 'TP' };
  }
  return null;
}

/** Build an ExecutedTrade from a closed position */
export function buildExecutedTrade(
  pos: PositionState,
  exitPrice: number,
  exitReason: string,
  asset: 'crypto' | 'gold' | 'jpy' | 'forex',
  candleTime: number,
): ExecutedTrade {
  const { pnlUsd, pips } = calcPnL(asset, pos.type, pos.entryPrice, exitPrice, pos.lotSize);
  const rMultiple = calcRMultiple(pos.type, pos.entryPrice, exitPrice, pos.stopLoss);
  const result = pnlUsd > 0 ? 'WIN' : pnlUsd < 0 ? 'LOSS' : 'BREAKEVEN';

  return {
    id: `bt-trade-${Date.now()}`,
    type: pos.type,
    entryPrice: pos.entryPrice,
    exitPrice,
    stopLoss: pos.stopLoss,
    takeProfit: pos.takeProfit,
    lotSize: pos.lotSize,
    pnlUsd,
    pips,
    rMultiple,
    result,
    openTime: candleTime,
    closeTime: candleTime,
  };
}

/** Compute session-level stats from trade history */
export function calcSessionStats(
  tradeHistory: ExecutedTrade[],
  initialBalance: number,
): { winRate: number; profitFactor: number; maxDrawdown: number } {
  if (tradeHistory.length === 0) {
    return { winRate: 0, profitFactor: 0, maxDrawdown: 0 };
  }

  const wins = tradeHistory.filter((t) => t.result === 'WIN').length;
  const winRate = Number(((wins / tradeHistory.length) * 100).toFixed(1));

  const grossProfit = tradeHistory
    .filter((t) => t.pnlUsd > 0)
    .reduce((sum, t) => sum + t.pnlUsd, 0);
  const grossLoss = Math.abs(
    tradeHistory
      .filter((t) => t.pnlUsd < 0)
      .reduce((sum, t) => sum + t.pnlUsd, 0)
  );
  const profitFactor = grossLoss > 0
    ? Number((grossProfit / grossLoss).toFixed(2))
    : grossProfit > 0 ? 999 : 0;

  let peak = initialBalance;
  let maxDrawdown = 0;
  let runningBalance = initialBalance;
  // tradeHistory is stored newest-first ([trade, ...history]), so index length - 1 is the oldest trade.
  // We iterate backwards from oldest to newest to compute running balance & drawdown chronologically.
  for (let i = tradeHistory.length - 1; i >= 0; i--) {
    runningBalance += tradeHistory[i].pnlUsd;
    if (runningBalance > peak) peak = runningBalance;
    const dd = ((peak - runningBalance) / peak) * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  return { winRate, profitFactor, maxDrawdown: Number(maxDrawdown.toFixed(2)) };
}
