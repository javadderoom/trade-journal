'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, ISeriesApi, UTCTimestamp, IPriceLine } from 'lightweight-charts';
import { fetchTradeChartCandles, CandleData, Timeframe } from '../../services/marketData';

interface TradeChartProps {
  symbol?: string;
  direction: 'BUY' | 'SELL';
  openPrice: number;
  closePrice: number | null;
  openTime: string; // ISO string
  closeTime: string | null; // ISO string
  stopLoss: number | null;
  takeProfit: number | null;
}

export default function TradeChart({
  symbol,
  direction,
  openPrice,
  closePrice,
  openTime,
  closeTime,
  stopLoss,
  takeProfit,
}: TradeChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  
  const [candlesticks, setCandlesticks] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe | 'auto'>('auto');

  // Fetch Data Effect
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function fetchChartData() {
      const data = await fetchTradeChartCandles(symbol ?? '', openTime, closeTime, timeframe);
      if (!cancelled) {
        setCandlesticks(data);
        setLoading(false);
      }
    }
    fetchChartData();
    return () => { cancelled = true; };
  }, [symbol, openTime, closeTime, timeframe]);

  // Init Chart Effect
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
        fontSize: 11,
        fontFamily: 'Vazirmatn, Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.04)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.04)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(148, 163, 184, 0.1)',
        visible: true,
      },
      timeScale: {
        borderColor: 'rgba(148, 163, 184, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: 'rgba(97, 249, 177, 0.4)', labelBackgroundColor: '#1e293b' },
        horzLine: { color: 'rgba(97, 249, 177, 0.4)', labelBackgroundColor: '#1e293b' },
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ff6b6b',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ff6b6b',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight || 250,
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 50);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Update Chart Effect
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;

    const chart = chartRef.current;
    const series = seriesRef.current;

    // Apply Precision
    let precision = 2;
    let minMove = 0.01;
    if (symbol) {
      const s = symbol.toUpperCase();
      if (s.includes('JPY')) {
        precision = 3;
        minMove = 0.001;
      } else if (s.includes('USD') && !['XAUUSD', 'BTCUSD', 'ETHUSD', 'SOLUSD'].includes(s)) {
        precision = 5;
        minMove = 0.00001;
      }
    }

    chart.applyOptions({
      localization: { priceFormatter: (p: number) => p.toFixed(precision) },
    });
    series.applyOptions({
      priceFormat: { type: 'price', precision, minMove },
    });

    if (!candlesticks || candlesticks.length === 0) {
      series.setData([]);
      return;
    }

    // 1. Sort and deduplicate
    const sorted = [...candlesticks].sort((a, b) => a.time - b.time);
    const uniqueData: any[] = [];
    const seenTimes = new Set<number>();
    
    sorted.forEach((bar) => {
      if (!seenTimes.has(bar.time)) {
        seenTimes.add(bar.time);
        uniqueData.push({
          time: bar.time as UTCTimestamp,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
        });
      }
    });

    series.setData(uniqueData);

    // 2. Clear old price lines
    priceLinesRef.current.forEach(pl => series.removePriceLine(pl));
    priceLinesRef.current = [];

    // 3. Trade Entry/Exit Markers
    const openUnix = Math.floor(new Date(openTime).getTime() / 1000);
    const closeUnix = closeTime ? Math.floor(new Date(closeTime).getTime() / 1000) : null;

    const findClosestBarTime = (targetUnix: number): number => {
      if (uniqueData.length === 0) return targetUnix;
      return uniqueData.reduce((prev, curr) => 
        Math.abs(curr.time - targetUnix) < Math.abs(prev.time - targetUnix) ? curr : prev
      ).time;
    };

    const entryBarTime = findClosestBarTime(openUnix);
    const exitBarTime = closeUnix ? findClosestBarTime(closeUnix) : null;

    const markers: any[] = [];
    const isBuy = direction === 'BUY';

    markers.push({
      time: entryBarTime,
      position: isBuy ? 'belowBar' : 'aboveBar',
      color: isBuy ? '#10b981' : '#ff6b6b',
      shape: isBuy ? 'arrowUp' : 'arrowDown',
      text: isBuy ? 'خرید (Entry)' : 'فروش (Entry)',
      size: 1.5,
    });

    if (exitBarTime && closePrice !== null) {
      const exitIsWin = isBuy ? (closePrice > openPrice) : (openPrice > closePrice);
      markers.push({
        time: exitBarTime,
        position: isBuy ? 'aboveBar' : 'belowBar',
        color: exitIsWin ? '#10b981' : '#ff6b6b',
        shape: isBuy ? 'arrowDown' : 'arrowUp',
        text: 'خروج (Exit)',
        size: 1.5,
      });
    }

    series.setMarkers(markers);

    // 4. Draw Horizontal Lines for Stop Loss (SL) & Take Profit (TP)
    if (stopLoss && stopLoss > 0) {
      const pl = series.createPriceLine({
        price: stopLoss,
        color: '#ff6b6b',
        lineWidth: 1,
        lineStyle: 1, // Dashed
        axisLabelVisible: true,
        title: 'حد ضرر (SL)',
      });
      priceLinesRef.current.push(pl);
    }

    if (takeProfit && takeProfit > 0) {
      const pl = series.createPriceLine({
        price: takeProfit,
        color: '#10b981',
        lineWidth: 1,
        lineStyle: 1, // Dashed
        axisLabelVisible: true,
        title: 'حد سود (TP)',
      });
      priceLinesRef.current.push(pl);
    }

    // Draw entry price level line
    if (openPrice && openPrice > 0) {
      const pl = series.createPriceLine({
        price: openPrice,
        color: '#3b82f6',
        lineWidth: 1,
        lineStyle: 2, // Dotted
        axisLabelVisible: true,
        title: 'ورود (Entry)',
      });
      priceLinesRef.current.push(pl);
    }

    chart.timeScale().fitContent();

  }, [candlesticks, direction, openPrice, closePrice, openTime, closeTime, stopLoss, takeProfit, symbol]);

  const tfOptions: (Timeframe | 'auto')[] = ['auto', '1m', '5m', '15m', '1h', '4h'];

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '280px', 
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        backgroundColor: '#151821'
      }} 
    >
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Timeframe Selector Overlay */}
      <div 
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          display: 'flex',
          gap: '4px',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          padding: '4px',
          borderRadius: '6px',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          zIndex: 10
        }}
      >
        {tfOptions.map(tf => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            style={{
              background: timeframe === tf ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: timeframe === tf ? '#60a5fa' : '#94a3b8',
              border: timeframe === tf ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '11px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              outline: 'none',
              transition: 'all 0.2s',
            }}
          >
            {tf}
          </button>
        ))}
      </div>
      
      {/* Loading Indicator */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.4)',
          zIndex: 5
        }}>
          <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite', color: '#60a5fa' }}>sync</span>
        </div>
      )}
    </div>
  );
}
