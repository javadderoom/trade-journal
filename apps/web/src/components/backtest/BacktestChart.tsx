'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { CandleData } from '../../services/marketData';

export interface PositionState {
  type: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  lotSize: number;
}

export interface DrawingShape {
  id: string;
  type: 'trendline' | 'rectangle' | 'horizontal';
  price1: number;
  time1: number;
  price2?: number;
  time2?: number;
}

interface BacktestChartProps {
  candles: CandleData[];
  visibleCount: number;
  position: PositionState | null;
  onPriceSelect?: (price: number) => void;
  onUpdateSLTP?: (sl: number | null, tp: number | null) => void;
  activeDrawingTool?: string;
  onCutBarSelect?: (candleIndex: number) => void;
  drawings?: DrawingShape[];
  onDrawingsChange?: (drawings: DrawingShape[]) => void;
}

export default function BacktestChart({
  candles,
  visibleCount,
  position,
  onPriceSelect,
  onUpdateSLTP,
  activeDrawingTool = 'cursor',
  onCutBarSelect,
  drawings = [],
  onDrawingsChange,
}: BacktestChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  
  const entryLineRef = useRef<any>(null);
  const slLineRef = useRef<any>(null);
  const tpLineRef = useRef<any>(null);

  // Store latest props in a ref so chart event handlers always see fresh state without re-creating chart
  const propsRef = useRef({
    candles,
    activeDrawingTool,
    onCutBarSelect,
    onPriceSelect,
  });

  useEffect(() => {
    propsRef.current = {
      candles,
      activeDrawingTool,
      onCutBarSelect,
      onPriceSelect,
    };
  }, [candles, activeDrawingTool, onCutBarSelect, onPriceSelect]);

  // 1. Initialize TradingView Lightweight Chart ONCE on mount
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#bbcabe',
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(60, 74, 65, 0.25)' },
        horzLines: { color: 'rgba(60, 74, 65, 0.25)' },
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
      },
      rightPriceScale: {
        borderColor: 'rgba(60, 74, 65, 0.4)',
        autoScale: true,
      },
      timeScale: {
        borderColor: 'rgba(60, 74, 65, 0.4)',
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

    // Handle Chart Clicks (Cut Tool & Price Pick)
    chart.subscribeClick((param) => {
      if (!param || !param.time || !seriesRef.current) return;

      const { candles: currentCandles, activeDrawingTool: tool, onCutBarSelect: cbCut, onPriceSelect: cbPrice } = propsRef.current;
      const candleTime = Number(param.time);
      const clickedIdx = currentCandles.findIndex((c) => c.time === candleTime);

      if (tool === 'cut' && clickedIdx >= 0 && cbCut) {
        cbCut(clickedIdx + 1);
      } else if (cbPrice && param.seriesData && param.seriesData.get(seriesRef.current)) {
        const priceObj = param.seriesData.get(seriesRef.current) as any;
        if (priceObj && priceObj.close) {
          cbPrice(priceObj.close);
        }
      }
    });

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
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []); // Run ONLY ONCE on mount!

  // 2. Update visible candle data slice on replay step or candle update
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

    // Remove existing price lines
    if (entryLineRef.current) {
      try { series.removePriceLine(entryLineRef.current); } catch (e) {}
      entryLineRef.current = null;
    }
    if (slLineRef.current) {
      try { series.removePriceLine(slLineRef.current); } catch (e) {}
      slLineRef.current = null;
    }
    if (tpLineRef.current) {
      try { series.removePriceLine(tpLineRef.current); } catch (e) {}
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
        title: `SL @ ${position.stopLoss.toFixed(2)}`,
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
        title: `TP @ ${position.takeProfit.toFixed(2)}`,
      };
      tpLineRef.current = series.createPriceLine(tpOptions as any);
    }
  }, [position]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '480px' }}>
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
      {activeDrawingTool === 'cut' && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            color: '#f8fafc',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          ✂️ Cut Tool Active: Click any candle on the chart to jump replay to that bar!
        </div>
      )}
    </div>
  );
}
