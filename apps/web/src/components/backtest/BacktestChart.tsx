'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { CandleData } from '../../services/marketData';
import { useTranslation } from '../../store/useAppStore';

export interface PositionState {
  id: string;
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
  positions: PositionState[];
  onPriceSelect?: (price: number) => void;
  onUpdateSLTP?: (positionId: string, sl: number | null, tp: number | null) => void;
  activeDrawingTool?: string;
  onCutBarSelect?: (candleIndex: number) => void;
  drawings?: DrawingShape[];
  onDrawingsChange?: (drawings: DrawingShape[]) => void;
}

/** When SL/TP not set, line sits exactly on entry price — user drags to set */
function resolvedSL(pos: PositionState): number {
  return pos.stopLoss ?? pos.entryPrice;
}
function resolvedTP(pos: PositionState): number {
  return pos.takeProfit ?? pos.entryPrice;
}

// Track lines per position
interface PositionLines {
  entry: any;
  sl: any;
  tp: any;
}

export default function BacktestChart({
  candles,
  visibleCount,
  positions,
  onPriceSelect,
  onUpdateSLTP,
  activeDrawingTool = 'cursor',
  onCutBarSelect,
  drawings = [],
  onDrawingsChange,
}: BacktestChartProps) {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // Lines tracked per position id
  const linesMapRef = useRef<Map<string, PositionLines>>(new Map());

  // Drag state
  const dragRef = useRef<{ positionId: string; field: 'sl' | 'tp' } | null>(null);
  const isDragging = useRef(false);

  // Track previous visibleCount to avoid resetting scroll position on single step forward/backward
  const prevVisibleCountRef = useRef<number | null>(null);

  // Store latest props in a ref so chart event handlers always see fresh state
  const propsRef = useRef({
    candles,
    activeDrawingTool,
    onCutBarSelect,
    onPriceSelect,
    positions,
    onUpdateSLTP,
  });

  useEffect(() => {
    propsRef.current = {
      candles,
      activeDrawingTool,
      onCutBarSelect,
      onPriceSelect,
      positions,
      onUpdateSLTP,
    };
  }, [candles, activeDrawingTool, onCutBarSelect, onPriceSelect, positions, onUpdateSLTP]);

  // ── 1. Initialize chart ONCE ──────────────────────────────────────────────
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
        vertLines: { color: 'rgba(60, 74, 65, 0.15)' },
        horzLines: { color: 'rgba(60, 74, 65, 0.15)' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderColor: 'rgba(60, 74, 65, 0.3)',
        autoScale: true,
      },
      timeScale: {
        borderColor: 'rgba(60, 74, 65, 0.3)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 20,
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

    // Responsive resize
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
  }, []); // Run ONLY ONCE on mount

  // ── 2. Update visible candle data ─────────────────────────────────────────
  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;
    const visibleSlice = candles.slice(0, Math.min(visibleCount, candles.length));
    seriesRef.current.setData(visibleSlice as any);

    const prevCount = prevVisibleCountRef.current;
    prevVisibleCountRef.current = visibleCount;

    // Only auto-scroll to the end on initial load, symbol change, or manual jumps/cuts.
    // Do not force scroll/reset position on step forward (+1) or step backward (-1).
    const isStep = prevCount !== null && Math.abs(visibleCount - prevCount) === 1;

    if (chartRef.current && visibleSlice.length > 0 && !isStep) {
      chartRef.current.timeScale().scrollToPosition(20, false);
    }
  }, [candles, visibleCount]);

  // ── 2b. Customize crosshair when cut tool is active ──────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (activeDrawingTool === 'cut') {
      chart.applyOptions({
        crosshair: {
          mode: 1,
          vertLine: {
            color: '#ef4444',
            width: 2,
            style: 0,
            labelBackgroundColor: '#ef4444',
            labelVisible: true,
          },
          horzLine: {
            visible: false,
            labelVisible: false,
          },
        },
      });
    } else {
      // Restore default crosshair options
      chart.applyOptions({
        crosshair: {
          mode: 1,
          vertLine: {
            color: 'rgba(60, 74, 65, 0.4)',
            width: 1,
            style: 3,
            labelVisible: true,
          },
          horzLine: {
            visible: true,
            labelVisible: true,
            color: 'rgba(60, 74, 65, 0.4)',
            width: 1,
            style: 3,
          },
        },
      });
    }
  }, [activeDrawingTool]);

  // Helper to draw or redraw all position lines
  const redrawPositionLines = useCallback((currentPositions: PositionState[]) => {
    const series = seriesRef.current;
    if (!series) return;

    const linesMap = linesMapRef.current;

    // Remove lines for positions that no longer exist
    const currentIds = new Set(currentPositions.map((p) => p.id));
    for (const [id, lines] of linesMap.entries()) {
      if (!currentIds.has(id)) {
        [lines.entry, lines.sl, lines.tp].forEach((line) => {
          if (line) { try { series.removePriceLine(line); } catch (e) {} }
        });
        linesMap.delete(id);
      }
    }

    // Create/update lines for ALL positions — similar brightness, latest only is draggable
    for (const pos of currentPositions) {
      let lines = linesMap.get(pos.id);

      if (!lines) {
        lines = { entry: null, sl: null, tp: null };
        linesMap.set(pos.id, lines);
      }

      // Remove old lines
      [lines.entry, lines.sl, lines.tp].forEach((line) => {
        if (line) { try { series.removePriceLine(line); } catch (e) {} }
      });

      const slPrice = resolvedSL(pos);
      const tpPrice = resolvedTP(pos);
      const slIsSet = pos.stopLoss !== null;
      const tpIsSet = pos.takeProfit !== null;

      // Entry line
      lines.entry = series.createPriceLine({
        price: pos.entryPrice,
        color: '#3b82f6',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `${pos.type} @ ${pos.entryPrice.toFixed(2)}`,
      } as any);

      // SL line
      lines.sl = series.createPriceLine({
        price: slPrice,
        color: '#ef4444',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: slIsSet ? `SL @ ${pos.stopLoss!.toFixed(2)}` : 'SL (drag to set)',
      } as any);

      // TP line
      lines.tp = series.createPriceLine({
        price: tpPrice,
        color: '#10b981',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: tpIsSet ? `TP @ ${pos.takeProfit!.toFixed(2)}` : 'TP (drag to set)',
      } as any);
    }
  }, []);

  // ── 3. Render Position Lines (Entry, SL, TP) for ALL positions ───────────
  useEffect(() => {
    redrawPositionLines(positions);
  }, [positions, redrawPositionLines]);

  // ── 4. Drag-to-adjust SL/TP ───────────────────────────────────────────────
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!seriesRef.current || !chartRef.current || propsRef.current.positions.length === 0) return;

    const series = seriesRef.current;
    const container = chartContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;

    // Check all positions' lines, prioritize the last (most recent) position
    let bestHit: { positionId: string; field: 'sl' | 'tp' } | null = null;

    for (const pos of [...propsRef.current.positions].reverse()) {
      const slPrice = resolvedSL(pos);
      const tpPrice = resolvedTP(pos);

      const checkHit = (price: number, field: 'sl' | 'tp'): boolean => {
        const y = series.priceToCoordinate(price);
        if (y === null) return false;
        return Math.abs(mouseY - y) < 8;
      };

      if (checkHit(slPrice, 'sl')) {
        bestHit = { positionId: pos.id, field: 'sl' };
        break;
      }
      if (checkHit(tpPrice, 'tp')) {
        bestHit = { positionId: pos.id, field: 'tp' };
        break;
      }
    }

    if (bestHit) {
      dragRef.current = bestHit;
      isDragging.current = true;
      container.style.cursor = 'ns-resize';
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!seriesRef.current || !chartRef.current) return;
    const container = chartContainerRef.current;
    if (!container) return;

    // ── During drag: update line position ──
    if (isDragging.current && dragRef.current) {
      const rect = container.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      const series = seriesRef.current;

      const price = series.coordinateToPrice(mouseY);
      if (price == null) return;

      const pos = propsRef.current.positions.find((p) => p.id === dragRef.current!.positionId);
      if (!pos) return;

      const entryPrice = pos.entryPrice;
      let targetPrice = price as any;

      if (dragRef.current.field === 'sl') {
        const valid = pos.type === 'BUY' ? price < entryPrice : price > entryPrice;
        if (!valid) targetPrice = entryPrice;
      } else {
        const valid = pos.type === 'BUY' ? price > entryPrice : price < entryPrice;
        if (!valid) targetPrice = entryPrice;
      }

      // Update the price line visually
      const lines = linesMapRef.current.get(dragRef.current.positionId);
      const lineRef = dragRef.current.field === 'sl' ? lines?.sl : lines?.tp;
      const color = dragRef.current.field === 'sl' ? '#ef4444' : '#10b981';
      const label = dragRef.current.field === 'sl' ? 'SL' : 'TP';

      if (lineRef) {
        try { series.removePriceLine(lineRef); } catch (e) {}
      }
      const newLine = series.createPriceLine({
        price: targetPrice,
        color,
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `${label} @ ${Number(targetPrice).toFixed(2)}`,
      } as any);

      if (lines) {
        if (dragRef.current.field === 'sl') lines.sl = newLine;
        else lines.tp = newLine;
      }

      e.preventDefault();
      return;
    }

    // ── Hover detection: change cursor near SL/TP lines ──
    const rect = container.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const series = seriesRef.current;

    let nearLine = false;
    for (const pos of propsRef.current.positions) {
      const checkY = (price: number) => {
        const y = series.priceToCoordinate(price);
        if (y !== null && Math.abs(mouseY - y) < 8) nearLine = true;
      };
      checkY(resolvedSL(pos));
      checkY(resolvedTP(pos));
    }

    container.style.cursor = nearLine ? 'ns-resize' : 'crosshair';
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !dragRef.current || !seriesRef.current) {
      isDragging.current = false;
      dragRef.current = null;
      if (chartContainerRef.current) chartContainerRef.current.style.cursor = 'crosshair';
      return;
    }

    const series = seriesRef.current;
    const { positionId, field } = dragRef.current;

    const pos = propsRef.current.positions.find((p) => p.id === positionId);
    if (pos) {
      const container = chartContainerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        const price = series.coordinateToPrice(mouseY);

        if (price != null) {
          const entryPrice = pos.entryPrice;
          let targetPrice = price as any;

          if (field === 'sl') {
            const valid = pos.type === 'BUY' ? price < entryPrice : price > entryPrice;
            if (!valid) targetPrice = entryPrice;
          } else {
            const valid = pos.type === 'BUY' ? price > entryPrice : price < entryPrice;
            if (!valid) targetPrice = entryPrice;
          }

          const rounded = Number(Number(targetPrice).toFixed(pos.entryPrice > 100 ? 2 : 5));
          if (propsRef.current.onUpdateSLTP) {
            if (field === 'sl') {
              propsRef.current.onUpdateSLTP(positionId, rounded, pos.takeProfit);
            } else {
              propsRef.current.onUpdateSLTP(positionId, pos.stopLoss, rounded);
            }
          }
        }
      }
    }

    isDragging.current = false;
    dragRef.current = null;
    if (chartContainerRef.current) chartContainerRef.current.style.cursor = 'crosshair';
  }, [redrawPositionLines]);

  // Attach drag handlers to chart container
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  const hasPositions = positions.length > 0;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '480px' }}>
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
      {activeDrawingTool === 'cut' && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f8fafc',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {isEn ? 'Click any candle to jump replay' : 'روی هر کندل کلیک کنید تا ریپلی به آن نقطه منتقل شود'}
        </div>
      )}
      {hasPositions && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 12,
            display: 'flex',
            gap: 8,
            fontSize: '11px',
            color: '#94a3b8',
            pointerEvents: 'none',
          }}
        >
          {isEn ? (
            <span>Drag <span style={{ color: '#ef4444' }}>red</span>/<span style={{ color: '#10b981' }}>green</span> lines away from entry to set SL/TP</span>
          ) : (
            <span>خطوط <span style={{ color: '#ef4444' }}>قرمز</span>/<span style={{ color: '#10b981' }}>سبز</span> را برای تنظیم حد ضرر/سود درگ کنید</span>
          )}
        </div>
      )}
    </div>
  );
}
