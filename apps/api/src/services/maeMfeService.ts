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
  takeProfit?: number | null;
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
}

/**
 * Derives pip multiplier for a given financial symbol (e.g. JPY pairs = 100, Gold = 10, FX = 10000)
 */
export function getPipMultiplier(symbol: string): number {
  const sym = symbol.toUpperCase();
  if (sym.includes('JPY')) return 100;
  if (sym.includes('XAU') || sym.includes('GOLD')) return 10;
  if (sym.includes('BTC') || sym.includes('ETH')) return 1;
  return 10000; // Standard Forex pair (EURUSD, GBPUSD, etc.)
}

/**
 * Calculates MAE and MFE values, price levels, R-multiples, and SL/TP efficiencies.
 */
export function calculateMaeMfe(input: MaeMfeInput): MaeMfeResult {
  const { direction, openPrice, closePrice, stopLoss, takeProfit, symbol, candles, peakHighPrice, peakLowPrice } = input;
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

  // 2. Calculate initial risk in pips for R-multiple conversion
  let riskPips = 0;
  if (stopLoss && stopLoss > 0) {
    riskPips = Math.abs(openPrice - stopLoss) * pipMult;
  } else {
    // Default fallback risk estimation based on MAE or exit distance
    riskPips = Math.max(maePips, Math.abs(openPrice - closePrice) * pipMult, 10);
  }

  const maeR = riskPips > 0 ? parseFloat((maePips / riskPips).toFixed(2)) : 0;
  const mfeR = riskPips > 0 ? parseFloat((mfePips / riskPips).toFixed(2)) : 0;

  // 3. Efficiency Calculations
  // SL Efficiency: % of risk room used (100% means price touched SL exactly)
  const slEfficiency = riskPips > 0 ? Math.min(100, Math.round((maePips / riskPips) * 100)) : 0;

  // TP Efficiency: Realized profit vs peak unrealized MFE profit
  const realizedPips = direction === 'BUY'
    ? (closePrice - openPrice) * pipMult
    : (openPrice - closePrice) * pipMult;

  const tpEfficiency = mfePips > 0 ? Math.max(0, Math.min(100, Math.round((realizedPips / mfePips) * 100))) : 0;

  return {
    mae_pips: parseFloat(maePips.toFixed(1)),
    mfe_pips: parseFloat(mfePips.toFixed(1)),
    mae_price: parseFloat(maePrice.toFixed(5)),
    mfe_price: parseFloat(mfePrice.toFixed(5)),
    mae_r: maeR,
    mfe_r: mfeR,
    sl_efficiency_pct: slEfficiency,
    tp_efficiency_pct: tpEfficiency,
  };
}
