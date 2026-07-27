'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { PositionState } from '../BacktestChart';
import { ExecutedTrade } from '../OrderPanel';
import { getAssetClass, buildExecutedTrade } from '../utils/pnl';
import { CandleData } from '../../../services/marketData';
import { notify } from '../../../lib/notify';

interface TradingEngineOptions {
  symbol: string;
  initialBalance?: number;
  isEn: boolean;
}

export function useTradingEngine({ symbol, initialBalance = 10000, isEn }: TradingEngineOptions) {
  const [positions, setPositions] = useState<PositionState[]>([]);
  const [balance, setBalance] = useState<number>(initialBalance);
  const [tradeHistory, setTradeHistory] = useState<ExecutedTrade[]>([]);

  // Keep a ref in sync with positions so closePosition can read it outside a setState updater
  const positionsRef = useRef(positions);
  useEffect(() => { positionsRef.current = positions; }, [positions]);

  const asset = getAssetClass(symbol);

  // Open a new position
  const openPosition = useCallback((
    type: 'BUY' | 'SELL',
    lotSize: number,
    sl: number | null,
    tp: number | null,
    entryPrice: number,
  ) => {
    if (!entryPrice) return;

    const newPos: PositionState = {
      id: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      entryPrice,
      stopLoss: sl,
      takeProfit: tp,
      lotSize,
    };

    setPositions((prev) => [...prev, newPos]);
    notify.info(
      isEn
        ? `Opened ${type} @ ${entryPrice}`
        : `پوزیشن ${type === 'BUY' ? 'خرید' : 'فروش'} در قیمت ${entryPrice} باز شد`
    );
  }, [isEn]);

  // Close a specific position at a given price
  const closePosition = useCallback((
    positionId: string,
    exitPrice: number,
    exitReason: string,
    currentCandle: CandleData | null,
  ) => {
    if (!currentCandle) return;

    const pos = positionsRef.current.find((p) => p.id === positionId);
    if (!pos) return;

    const trade = buildExecutedTrade(pos, exitPrice, exitReason, asset, currentCandle.time);

    // Remove position
    setPositions((prev) => prev.filter((p) => p.id !== positionId));

    // Add trade to history and update balance
    setTradeHistory((history) => {
      if (history.some((t) => t.id === trade.id)) return history;
      return [trade, ...history];
    });
    setBalance((bal) => bal + trade.pnlUsd);

    const message =
      trade.result === 'WIN'
        ? isEn
          ? `Trade Hit ${exitReason}! Profit: +$${trade.pnlUsd.toFixed(2)}`
          : `معامله با سود بسته‌شد (${exitReason}): +$${trade.pnlUsd.toFixed(2)}`
        : isEn
          ? `Trade Hit ${exitReason}! Loss: -$${Math.abs(trade.pnlUsd).toFixed(2)}`
          : `معامله با حد ضرر بسته‌شد (${exitReason}): -$${Math.abs(trade.pnlUsd).toFixed(2)}`;

    if (trade.result === 'WIN') notify.success(message);
    else notify.error(message);
  }, [asset, isEn]);

  // Close at market price (manual close)
  const closeAtMarket = useCallback((
    positionId: string,
    currentPrice: number,
    reason: string = 'MANUAL',
    currentCandle: CandleData | null,
  ) => {
    closePosition(positionId, currentPrice, reason, currentCandle);
  }, [closePosition]);

  // Update SL/TP for a position
  const updateSLTP = useCallback((
    positionId: string,
    newSL: number | null,
    newTP: number | null,
  ) => {
    setPositions((prev) =>
      prev.map((p) =>
        p.id === positionId
          ? { ...p, stopLoss: newSL, takeProfit: newTP }
          : p
      )
    );
  }, []);

  // Reset session
  const resetTrading = useCallback(() => {
    setPositions([]);
    setTradeHistory([]);
    setBalance(initialBalance);
  }, [initialBalance]);

  // Restore from saved state
  const restoreTrading = useCallback((saved: {
    positions?: PositionState[];
    balance?: number;
    tradeHistory?: ExecutedTrade[];
  }) => {
    if (Array.isArray(saved.positions)) setPositions(saved.positions);
    if (typeof saved.balance === 'number') setBalance(saved.balance);
    if (Array.isArray(saved.tradeHistory)) setTradeHistory(saved.tradeHistory);
  }, []);

  return {
    positions,
    balance,
    tradeHistory,
    initialBalance,
    openPosition,
    closePosition,
    closeAtMarket,
    updateSLTP,
    resetTrading,
    restoreTrading,
  };
}
