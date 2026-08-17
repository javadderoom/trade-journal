/**
 * MAE (Maximum Adverse Excursion) and MFE (Maximum Favorable Excursion) Service
 * Calculates institutional drawdown and peak profit metrics for trades.
 */

export interface CandlePriceRange {
  high: number;
  low: number;
}

export interface MaeMfeInput {
  direction: 'BUY' | 'SELL';
  openPrice: number;
  closePrice: number;
  stopLoss?: number | null;
  initialStopLoss?: number | null;
  takeProfit?: number | null;
  realizedR?: number | null;
  symbol: string;
  candles?: CandlePriceRange[];
  peakHighPrice?: number;
  peakLowPrice?: number;
}

export interface MaeMfeResult {
  mae_pips: number;
  mfe_pips: number;
  mae_price: number;
  mfe_price: number;
  mae_r: number;
  mfe_r: number;
  sl_efficiency_pct: number;
  tp_efficiency_pct: number;
  exit_efficiency_pct: number;
  money_left_on_table_r: number;
  sl_widened: boolean;
}

/**
 * Derives pip multiplier for a given financial symbol (e.g. JPY pairs = 100, Gold = 100, FX = 10000)
 */
export function getPipMultiplier(symbol: string): number {
  const sym = symbol.toUpperCase();
  if (sym.includes('JPY')) return 100;
  if (sym.includes('XAU') || sym.includes('GOLD')) return 100; // Gold: $0.01 = 1 pip/point ($5.10 = 510 pips)
  if (sym.includes('BTC') || sym.includes('ETH')) return 1;
  return 10000; // Standard Forex pair (EURUSD, GBPUSD, etc.)
}

/**
 * Calculates MAE and MFE values, price levels, R-multiples, and SL/TP efficiencies.
 */
export function calculateMaeMfe(input: MaeMfeInput): MaeMfeResult {
  const { direction, openPrice, closePrice, stopLoss, initialStopLoss, takeProfit, realizedR, symbol, candles, peakHighPrice, peakLowPrice } = input;
  const pipMult = getPipMultiplier(symbol);

  // 1. Determine peak high and lowest low price during the trade lifetime
  let maxHigh = peakHighPrice ?? Math.max(openPrice, closePrice);
  let minLow = peakLowPrice ?? Math.min(openPrice, closePrice);

  if (candles && candles.length > 0) {
    for (const c of candles) {
      if (c.high > maxHigh) maxHigh = c.high;
      if (c.low < minLow) minLow = c.low;
    }
  }

  let maePrice = openPrice;
  let mfePrice = openPrice;
  let maePips = 0;
  let mfePips = 0;

  if (direction === 'BUY') {
    // BUY: MAE is how far price dropped below entry (openPrice - minLow)
    maePrice = minLow;
    maePips = Math.max(0, (openPrice - minLow) * pipMult);

    // BUY: MFE is how far price rallied above entry (maxHigh - openPrice)
    mfePrice = maxHigh;
    mfePips = Math.max(0, (maxHigh - openPrice) * pipMult);
  } else {
    // SELL: MAE is how far price rallied above entry (maxHigh - openPrice)
    maePrice = maxHigh;
    maePips = Math.max(0, (maxHigh - openPrice) * pipMult);

    // SELL: MFE is how far price dropped below entry (openPrice - minLow)
    mfePrice = minLow;
    mfePips = Math.max(0, (openPrice - minLow) * pipMult);
  }

  // 2. Initial Planned Risk vs Modified/Widened Stop Loss
  const baseSl = initialStopLoss ?? stopLoss;
  let initialRiskPips = 0;
  if (baseSl && baseSl > 0) {
    initialRiskPips = Math.abs(openPrice - baseSl) * pipMult;
  } else {
    initialRiskPips = Math.max(maePips, Math.abs(openPrice - closePrice) * pipMult, 15);
  }

  // Check if Stop Loss was widened (moved further into loss than initial SL)
  let slWidened = false;
  if (initialStopLoss && stopLoss && initialStopLoss !== stopLoss) {
    const initialDist = Math.abs(openPrice - initialStopLoss);
    const finalDist = Math.abs(openPrice - stopLoss);
    if (finalDist > initialDist) {
      slWidened = true;
    }
  }

  // Calculate MAE in R (if trade stopped out at initial SL, maeR is exactly 1.0R; if widened, it reflects the expanded ratio)
  let maeR = 0;
  if (realizedR !== undefined && realizedR !== null && realizedR < 0) {
    // For losing trade, if SL was widened, MAE equals the true negative multiple (e.g. -1.5R); if standard SL hit, it's 1.0R
    maeR = Math.max(1.0, parseFloat(Math.abs(realizedR).toFixed(2)));
  } else {
    maeR = initialRiskPips > 0 ? parseFloat((maePips / initialRiskPips).toFixed(2)) : 0;
  }

  const mfeR = initialRiskPips > 0 ? parseFloat((mfePips / initialRiskPips).toFixed(2)) : 0;

  // 3. Efficiency & Exit Calculations
  const realizedPips = direction === 'BUY'
    ? (closePrice - openPrice) * pipMult
    : (openPrice - closePrice) * pipMult;

  const tradeRealizedR = realizedR ?? (initialRiskPips > 0 ? realizedPips / initialRiskPips : 0);

  // SL Efficiency: % of risk room used (100% means price touched SL exactly)
  const slEfficiency = initialRiskPips > 0 ? Math.min(100, Math.round((maePips / initialRiskPips) * 100)) : 0;

  // TP Efficiency / Exit Efficiency: Realized profit vs peak unrealized MFE profit
  const exitEfficiencyPct = mfePips > 0 ? Math.max(0, Math.min(100, Math.round((realizedPips / mfePips) * 100))) : 0;

  // Money Left on Table (R-multiples): MFE R minus Realized R
  const moneyLeftOnTableR = parseFloat(Math.max(0, mfeR - (tradeRealizedR ?? 0)).toFixed(2));

  return {
    mae_pips: parseFloat(maePips.toFixed(1)),
    mfe_pips: parseFloat(mfePips.toFixed(1)),
    mae_price: parseFloat(maePrice.toFixed(5)),
    mfe_price: parseFloat(mfePrice.toFixed(5)),
    mae_r: maeR,
    mfe_r: mfeR,
    sl_efficiency_pct: slEfficiency,
    tp_efficiency_pct: exitEfficiencyPct,
    exit_efficiency_pct: exitEfficiencyPct,
    money_left_on_table_r: moneyLeftOnTableR,
    sl_widened: slWidened,
  };
}
