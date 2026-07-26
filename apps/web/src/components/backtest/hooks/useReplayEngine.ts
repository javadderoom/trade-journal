'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CandleData } from '../../../services/marketData';
import { PositionState } from '../BacktestChart';
import { checkSLTPHit } from '../utils/pnl';

interface ReplayEngineOptions {
  candles: CandleData[];
  positions: PositionState[];
  onPositionHit: (positionId: string, exitPrice: number, reason: string) => void;
}

export function useReplayEngine({ candles, positions, onPositionHit }: ReplayEngineOptions) {
  const [visibleCount, setVisibleCount] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Step forward by 1 bar
  const handleStepForward = useCallback(() => {
    if (visibleCount >= candles.length) {
      setIsPlaying(false);
      return;
    }

    const nextCount = visibleCount + 1;
    setVisibleCount(nextCount);

    const nextCandle = candles[nextCount - 1];
    if (nextCandle && positions.length > 0) {
      for (const pos of positions) {
        const hit = checkSLTPHit(
          pos.type,
          nextCandle.high,
          nextCandle.low,
          pos.stopLoss,
          pos.takeProfit,
        );
        if (hit) {
          onPositionHit(pos.id, hit.exitPrice, hit.reason);
        }
      }
    }
  }, [visibleCount, candles, positions, onPositionHit]);

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(100, Math.round(1000 / speed));
      timerRef.current = setInterval(handleStepForward, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, handleStepForward]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleStepForward();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStepForward]);

  // Load new candle data resets position
  const loadCandles = useCallback((count: number) => {
    setVisibleCount(count);
    setIsPlaying(false);
  }, []);

  // Jump to bar
  const jumpToBar = useCallback((barIdx: number) => {
    setVisibleCount(barIdx);
  }, []);

  // Reset
  const resetReplay = useCallback(() => {
    setVisibleCount(candles.length);
    setIsPlaying(false);
  }, [candles.length]);

  return {
    visibleCount,
    isPlaying,
    speed,
    setIsPlaying,
    setSpeed,
    loadCandles,
    jumpToBar,
    stepForward: handleStepForward,
    resetReplay,
    currentCandle: candles[visibleCount - 1] || null,
  };
}
