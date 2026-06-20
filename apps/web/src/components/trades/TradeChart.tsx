'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, ISeriesApi, UTCTimestamp } from 'lightweight-charts';

interface CandlestickData {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TradeChartProps {
  candlesticks: CandlestickData[];
  direction: 'BUY' | 'SELL';
  openPrice: number;
  closePrice: number | null;
  openTime: string; // ISO string
  closeTime: string | null; // ISO string
  stopLoss: number | null;
  takeProfit: number | null;
}

export default function TradeChart({
  candlesticks,
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

  useEffect(() => {
    if (!chartContainerRef.current || !candlesticks || candlesticks.length === 0) return;

    // 1. Sort and deduplicate candlesticks (Lightweight Charts requirement)
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

    // 2. Initialize Chart
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

    chartRef.current = chart;

    // 3. Add Candlestick Series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#61f9b1',
      downColor: '#ff6b6b',
      borderVisible: false,
      wickUpColor: '#61f9b1',
      wickDownColor: '#ff6b6b',
    });

    candlestickSeries.setData(uniqueData);

    // 4. Calculate Trade Execution Timestamps (in seconds)
    const openUnix = Math.floor(new Date(openTime).getTime() / 1000);
    const closeUnix = closeTime ? Math.floor(new Date(closeTime).getTime() / 1000) : null;

    // Find the closest bar timestamp in our uniqueData to attach markers to
    const findClosestBarTime = (targetUnix: number): number => {
      if (uniqueData.length === 0) return targetUnix;
      return uniqueData.reduce((prev, curr) => 
        Math.abs(curr.time - targetUnix) < Math.abs(prev.time - targetUnix) ? curr : prev
      ).time;
    };

    const entryBarTime = findClosestBarTime(openUnix);
    const exitBarTime = closeUnix ? findClosestBarTime(closeUnix) : null;

    // 5. Add Trade Entry/Exit Markers
    const markers: any[] = [];
    const isBuy = direction === 'BUY';

    // Entry Marker
    markers.push({
      time: entryBarTime,
      position: isBuy ? 'belowBar' : 'aboveBar',
      color: isBuy ? '#61f9b1' : '#ff6b6b',
      shape: isBuy ? 'arrowUp' : 'arrowDown',
      text: isBuy ? 'خرید (Entry)' : 'فروش (Entry)',
      size: 1.5,
    });

    // Exit Marker
    if (exitBarTime && closePrice !== null) {
      const exitIsWin = isBuy ? (closePrice > openPrice) : (openPrice > closePrice);
      markers.push({
        time: exitBarTime,
        position: isBuy ? 'aboveBar' : 'belowBar',
        color: exitIsWin ? '#61f9b1' : '#ff6b6b',
        shape: isBuy ? 'arrowDown' : 'arrowUp',
        text: 'خروج (Exit)',
        size: 1.5,
      });
    }

    candlestickSeries.setMarkers(markers);

    // 6. Draw Horizontal Lines for Stop Loss (SL) & Take Profit (TP)
    if (stopLoss && stopLoss > 0) {
      candlestickSeries.createPriceLine({
        price: stopLoss,
        color: '#ff6b6b',
        lineWidth: 1,
        lineStyle: 1, // Dashed
        axisLabelVisible: true,
        title: 'حد ضرر (SL)',
      });
    }

    if (takeProfit && takeProfit > 0) {
      candlestickSeries.createPriceLine({
        price: takeProfit,
        color: '#10b981',
        lineWidth: 1,
        lineStyle: 1, // Dashed
        axisLabelVisible: true,
        title: 'حد سود (TP)',
      });
    }

    // Draw entry price level line
    candlestickSeries.createPriceLine({
      price: openPrice,
      color: '#3b82f6',
      lineWidth: 1,
      lineStyle: 2, // Dotted
      axisLabelVisible: true,
      title: 'ورود (Entry)',
    });

    // 7. Auto-fit Content
    chart.timeScale().fitContent();

    // 8. Handle Resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight || 250,
        });
      }
    };
    
    window.addEventListener('resize', handleResize);

    // Initial resize to set width/height
    setTimeout(handleResize, 50);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [candlesticks, direction, openPrice, closePrice, openTime, closeTime, stopLoss, takeProfit]);

  return (
    <div 
      ref={chartContainerRef} 
      style={{ 
        width: '100%', 
        height: '280px', 
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        backgroundColor: '#151821'
      }} 
    />
  );
}
