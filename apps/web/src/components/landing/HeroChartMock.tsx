'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

interface HeroChartMockProps {
  isEn: boolean;
}

export default function HeroChartMock({ isEn }: HeroChartMockProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear previous elements if any
    chartContainerRef.current.innerHTML = '';

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748b',
        fontSize: 11,
        fontFamily: isEn ? 'Inter, sans-serif' : 'Vazirmatn, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#10b981', width: 1, style: 2 },
        horzLine: { color: '#10b981', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        textColor: '#94a3b8',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 14,
        rightOffset: 5,
      },
      handleScroll: true,
      handleScale: true,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    // 38 Realistic M15 Candlesticks (Consolidation -> Sweep -> Displacement -> Expansion)
    const baseTime = 1710220000;
    const step = 900; // 15 mins

    const mockCandles = [
      // Asian Range Consolidation (Candles 1-12)
      { open: 2150.2, high: 2152.0, low: 2149.5, close: 2151.1 },
      { open: 2151.1, high: 2153.2, low: 2150.0, close: 2152.5 },
      { open: 2152.5, high: 2154.0, low: 2151.2, close: 2151.8 },
      { open: 2151.8, high: 2153.0, low: 2149.8, close: 2150.4 },
      { open: 2150.4, high: 2151.9, low: 2148.9, close: 2149.6 },
      { open: 2149.6, high: 2152.4, low: 2149.0, close: 2151.8 },
      { open: 2151.8, high: 2154.5, low: 2151.0, close: 2153.9 },
      { open: 2153.9, high: 2155.1, low: 2152.5, close: 2154.2 },
      { open: 2154.2, high: 2156.0, low: 2153.0, close: 2153.4 },
      { open: 2153.4, high: 2154.8, low: 2150.9, close: 2151.5 },
      { open: 2151.5, high: 2153.2, low: 2148.8, close: 2149.2 },
      { open: 2149.2, high: 2150.5, low: 2146.5, close: 2147.0 },

      // Pre-London Dip & Liquidity Sweep (Candles 13-18)
      { open: 2147.0, high: 2148.8, low: 2145.2, close: 2145.8 },
      { open: 2145.8, high: 2147.0, low: 2144.1, close: 2144.9 },
      { open: 2144.9, high: 2146.2, low: 2143.5, close: 2143.8 }, // SWEEP LOW
      { open: 2143.8, high: 2149.8, low: 2143.5, close: 2149.0 }, // Sharp Reversal Wick
      { open: 2149.0, high: 2152.8, low: 2148.5, close: 2151.5 }, // ENTRY CANDLE
      { open: 2151.5, high: 2154.2, low: 2150.8, close: 2153.8 },

      // Expansion Phase (Candles 19-30)
      { open: 2153.8, high: 2157.0, low: 2153.2, close: 2156.5 },
      { open: 2156.5, high: 2159.2, low: 2155.8, close: 2158.9 },
      { open: 2158.9, high: 2161.5, low: 2158.0, close: 2160.2 },
      { open: 2160.2, high: 2162.8, low: 2159.5, close: 2162.1 },
      { open: 2162.1, high: 2161.5, low: 2158.2, close: 2159.0 }, // Minor pullback
      { open: 2159.0, high: 2163.4, low: 2158.8, close: 2163.0 },
      { open: 2163.0, high: 2166.5, low: 2162.2, close: 2165.8 },
      { open: 2165.8, high: 2169.0, low: 2165.0, close: 2168.4 },
      { open: 2168.4, high: 2172.1, low: 2168.0, close: 2171.5 },
      { open: 2171.5, high: 2174.0, low: 2170.8, close: 2173.2 },
      { open: 2173.2, high: 2176.8, low: 2172.9, close: 2175.5 }, // TP HIT!
      { open: 2175.5, high: 2177.2, low: 2174.1, close: 2176.0 },

      // Post Target Consolidation (Candles 31-35)
      { open: 2176.0, high: 2178.5, low: 2175.0, close: 2177.1 },
      { open: 2177.1, high: 2179.0, low: 2176.2, close: 2176.8 },
      { open: 2176.8, high: 2177.5, low: 2174.0, close: 2174.5 },
      { open: 2174.5, high: 2176.2, low: 2173.8, close: 2175.8 },
      { open: 2175.8, high: 2178.0, low: 2175.2, close: 2177.4 },
    ].map((c, i) => ({
      time: baseTime + i * step,
      ...c,
    }));

    candlestickSeries.setData(mockCandles as any);

    // Add Moving Average Line (EMA 20)
    const emaSeries = chart.addLineSeries({
      color: '#f59e0b',
      lineWidth: 1,
      crosshairMarkerVisible: false,
    });

    const emaData = mockCandles.map((c, idx) => {
      // Smooth moving average curve calculation
      const avg = mockCandles
        .slice(Math.max(0, idx - 5), idx + 1)
        .reduce((sum, curr) => sum + curr.close, 0) / Math.min(idx + 1, 6);
      return { time: c.time, value: parseFloat(avg.toFixed(2)) };
    });
    emaSeries.setData(emaData as any);

    // Entry Price Line
    candlestickSeries.createPriceLine({
      price: 2151.5,
      color: '#10b981',
      lineWidth: 1,
      lineStyle: 0, // Solid
      axisLabelVisible: true,
      title: isEn ? 'ENTRY 2151.50' : 'ورود ۲۱۵۱.۵۰',
    });

    // Take Profit Price Line
    candlestickSeries.createPriceLine({
      price: 2175.5,
      color: '#10b981',
      lineWidth: 1,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: isEn ? 'TP 2175.50 (+2.4R)' : 'حد سود ۲۱۷۵.۵۰ (+۲.۴R)',
    });

    // Stop Loss Price Line
    candlestickSeries.createPriceLine({
      price: 2143.8,
      color: '#ef4444',
      lineWidth: 1,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: isEn ? 'SL 2143.80' : 'حد ضرر ۲۱۴۳.۸۰',
    });

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [isEn]);

  return (
    <div className="hero-tradingview-chart-container">
      <div className="chart-setup-badge">
        {isEn ? 'Liquidity Sweep Setup' : 'استراتژی جمع‌آوری نقدینگی'}
      </div>

      <div className="chart-learning-overlay">
        <span className="bulb-emoji">💡</span>
        <span>{isEn ? 'LEARNING POINT' : 'نکته کلیدی'}</span>
      </div>

      <div ref={chartContainerRef} style={{ width: '100%', height: '220px' }} />
    </div>
  );
}
