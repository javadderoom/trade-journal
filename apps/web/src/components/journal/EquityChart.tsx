'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, UTCTimestamp } from 'lightweight-charts';
import { toPersianDigits } from '../../utils/farsi';

interface Trade {
  closeTime: string | null;
  profitUsd: number;
  commission?: number | null;
  swap?: number | null;
}

interface EquityChartProps {
  closedTrades: Trade[];
}

export default function EquityChart({ closedTrades }: EquityChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !closedTrades || closedTrades.length === 0) return;

    // 1. Sort trades chronologically by close time
    const sortedTrades = [...closedTrades]
      .filter((t) => t.closeTime !== null)
      .sort((a, b) => new Date(a.closeTime!).getTime() - new Date(b.closeTime!).getTime());

    if (sortedTrades.length === 0) return;

    // 2. Build cumulative equity data points
    // To ensure unique timestamps for lightweight-charts, we increment by 1 second if multiple trades close in the same second
    const dataPoints: any[] = [];
    let runningPnl = 0;
    let lastTime = 0;

    sortedTrades.forEach((t) => {
      const netPnl = t.profitUsd + (t.commission ?? 0) + (t.swap ?? 0);
      runningPnl += netPnl;

      let rawTime = Math.floor(new Date(t.closeTime!).getTime() / 1000);
      if (rawTime <= lastTime) {
        rawTime = lastTime + 1; // ensure strict monotonicity
      }
      lastTime = rawTime;

      dataPoints.push({
        time: rawTime as UTCTimestamp,
        value: runningPnl,
      });
    });

    // Add a starting point 1 hour before the first trade close time (starts at 0 P&L)
    const firstTradeTime = dataPoints[0].time;
    const startPoint = {
      time: (firstTradeTime - 3600) as UTCTimestamp,
      value: 0,
    };
    const finalData = [startPoint, ...dataPoints];

    // 3. Create Chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
        fontSize: 11,
        fontFamily: 'Vazirmatn, Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.05)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.05)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(148, 163, 184, 0.15)',
        visible: true,
        autoScale: true,
      },
      timeScale: {
        borderColor: 'rgba(148, 163, 184, 0.15)',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time) => {
          try {
            const date = new Date((time as number) * 1000);
            return new Intl.DateTimeFormat('fa-IR', { month: 'numeric', day: 'numeric' }).format(date);
          } catch {
            return '';
          }
        },
      },
      crosshair: {
        vertLine: { color: 'rgba(97, 249, 177, 0.3)', labelBackgroundColor: '#1e293b' },
        horzLine: { color: 'rgba(97, 249, 177, 0.3)', labelBackgroundColor: '#1e293b' },
      },
      localization: {
        locale: 'fa-IR',
        priceFormatter: (price) => {
          const valStr = price.toFixed(2);
          return price >= 0 
            ? `+$${toPersianDigits(valStr)}` 
            : `-$${toPersianDigits(Math.abs(price).toFixed(2))}`;
        },
        timeFormatter: (time) => {
          try {
            const date = new Date((time as number) * 1000);
            return new Intl.DateTimeFormat('fa-IR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric'
            }).format(date);
          } catch {
            return '';
          }
        }
      }
    });

    chartRef.current = chart;

    // 4. Add Area Series
    const areaSeries = chart.addAreaSeries({
      lineColor: '#61f9b1',
      topColor: 'rgba(97, 249, 177, 0.25)',
      bottomColor: 'rgba(97, 249, 177, 0.0)',
      lineWidth: 3,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: '#111319',
      crosshairMarkerBackgroundColor: '#61f9b1',
    });

    areaSeries.setData(finalData);

    // 5. Fit contents
    chart.timeScale().fitContent();

    // 6. Handle resizing
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight || 280,
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Tiny delay to ensure clientWidth has loaded correctly
    const timer = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
      chart.remove();
    };
  }, [closedTrades]);

  return (
    <div 
      ref={chartContainerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '280px',
        position: 'relative',
      }} 
    />
  );
}
