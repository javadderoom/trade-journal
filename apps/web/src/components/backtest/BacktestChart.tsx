'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, PriceLineOptions } from 'lightweight-charts';
import { CandleData } from '../../services/marketData';

export interface PositionState {
  type: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  lotSize: number;
}

interface BacktestChartProps {
  candles: CandleData[];
  visibleCount: number;
  position: PositionState | null;
  onPriceSelect?: (price: number) => void;
}

export default function BacktestChart({
  candles,
  visibleCount,
  position,
  onPriceSelect,
}: BacktestChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const entryLineRef = useRef<any>(null);
  const slLineRef = useRef<any>(null);
  const tpLineRef = useRef<any>(null);

  // 1. Initialize TradingView Lightweight Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#94a3b8',
        fontSize: 12,
        fontFamily: 'IRANSans, Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        autoScale: true,
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Responsive resize handler
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  // 2. Update visible candle data slice on replay step
  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;

    const visibleSlice = candles.slice(0, Math.min(visibleCount, candles.length));
    seriesRef.current.setData(visibleSlice as any);

    if (chartRef.current && visibleSlice.length > 0) {
      chartRef.current.timeScale().scrollToPosition(0, false);
    }
  }, [candles, visibleCount]);

  // 3. Render Position Lines (Entry, Stop Loss, Take Profit) on Chart
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    // Remove existing lines
    if (entryLineRef.current) {
      series.removePriceLine(entryLineRef.current);
      entryLineRef.current = null;
    }
    if (slLineRef.current) {
      series.removePriceLine(slLineRef.current);
      slLineRef.current = null;
    }
    if (tpLineRef.current) {
      series.removePriceLine(tpLineRef.current);
      tpLineRef.current = null;
    }

    if (!position) return;

    // Entry Line
    const entryOptions = {
      price: position.entryPrice,
      color: '#3b82f6',
      lineWidth: 2,
      lineStyle: 0, // Solid
      axisLabelVisible: true,
      title: `${position.type} @ ${position.entryPrice}`,
    };
    entryLineRef.current = series.createPriceLine(entryOptions as any);

    // Stop Loss Line
    if (position.stopLoss) {
      const slOptions = {
        price: position.stopLoss,
        color: '#ef4444',
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: `SL @ ${position.stopLoss}`,
      };
      slLineRef.current = series.createPriceLine(slOptions as any);
    }

    // Take Profit Line
    if (position.takeProfit) {
      const tpOptions = {
        price: position.takeProfit,
        color: '#10b981',
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: `TP @ ${position.takeProfit}`,
      };
      tpLineRef.current = series.createPriceLine(tpOptions as any);
    }
  }, [position]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '480px' }}>
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
