'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { toPersianDigits } from '../../utils/farsi';
import { Trade } from '../../types/trade';

interface WeekdayPnlChartProps {
  closedTrades: Trade[];
}

export default function WeekdayPnlChart({ closedTrades }: WeekdayPnlChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 480, height: 240 });
  const [hoveredBar, setHoveredBar] = useState<any | null>(null);

  // Resize listener using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 240,
        });
      }
    };
    updateSize();
    
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => updateSize());
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    } else {
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, []);

  const weekdayPnlData = useMemo(() => {
    const { width, height } = dimensions;
    if (width === 0) return null;

    const isMobile = width < 480;

    const weekdayMap: { [key: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    
    closedTrades.forEach((t) => {
      const net = t.profitUsd + (t.commission ?? 0) + (t.swap ?? 0);
      const dayIdx = new Date(t.openTime).getDay();
      weekdayMap[dayIdx] += net;
    });

    const order = [6, 0, 1, 2, 3, 4, 5]; // Saturday to Friday
    const fullNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
    const shortNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
    const names = isMobile ? shortNames : fullNames;

    const list = order.map((dayIdx, index) => {
      return {
        dayIndex: dayIdx,
        name: names[index],
        fullName: fullNames[index], // Store full name for tooltips
        pnl: weekdayMap[dayIdx],
      };
    });

    const paddingLeft = isMobile ? 48 : 70;
    const paddingRight = isMobile ? 12 : 20;
    const paddingTop = 20;
    const paddingBottom = 35;

    const graphWidth = width - paddingLeft - paddingRight;
    const graphHeight = height - paddingTop - paddingBottom;

    // Find max absolute value to scale bars
    const maxVal = Math.max(...list.map((d) => Math.abs(d.pnl)));
    
    // Helper to calculate nice clean maximum value boundary for ticks
    const getNiceMaxVal = (val: number): number => {
      if (val === 0) return 10;
      const absVal = Math.abs(val);
      const orderOfMagnitude = Math.pow(10, Math.floor(Math.log10(absVal)));
      const normalized = absVal / orderOfMagnitude;
      
      let rounded;
      if (normalized <= 1) rounded = 1;
      else if (normalized <= 2) rounded = 2;
      else if (normalized <= 5) rounded = 5;
      else if (normalized <= 8) rounded = 8;
      else rounded = 10;
      
      return rounded * orderOfMagnitude;
    };
    
    const maxAbsVal = getNiceMaxVal(maxVal);
    const zeroY = paddingTop + graphHeight / 2; // zero baseline is in the middle of graph height

    const spacing = graphWidth / 7;
    const barWidth = Math.max(10, Math.min(32, spacing * 0.45));

    const bars = list.map((d, i) => {
      const x = paddingLeft + i * spacing + (spacing - barWidth) / 2;
      const barHeight = (Math.abs(d.pnl) / maxAbsVal) * (graphHeight / 2);
      const y = d.pnl >= 0 ? zeroY - barHeight : zeroY;
      return {
        x,
        y,
        width: barWidth,
        height: barHeight,
        pnl: d.pnl,
        name: d.name,
        fullName: d.fullName
      };
    });

    const yTicks = [
      { val: maxAbsVal, y: zeroY - graphHeight / 2 },
      { val: 0, y: zeroY },
      { val: -maxAbsVal, y: zeroY + graphHeight / 2 }
    ];

    return {
      bars,
      zeroY,
      yTicks,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      graphWidth,
      graphHeight
    };
  }, [closedTrades, dimensions]);

  if (!weekdayPnlData) {
    return <div style={{ color: '#bbcabe', fontSize: '13px' }}>در حال محاسبات...</div>;
  }

  const { width, height } = dimensions;

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '240px', position: 'relative' }}>
      <svg 
        width={width} 
        height={height} 
        className="svg-chart"
        style={{ overflow: 'visible' }}
      >
        {/* Grid Lines */}
        {weekdayPnlData.yTicks.map((tick, i) => (
          <line 
            key={i} 
            x1={weekdayPnlData.paddingLeft} 
            y1={tick.y} 
            x2={width - weekdayPnlData.paddingRight} 
            y2={tick.y} 
            className="grid-line" 
          />
        ))}
        
        {/* Y Axis Labels */}
        {weekdayPnlData.yTicks.map((tick, i) => {
          const valAbs = Math.abs(tick.val);
          const valFormatted = valAbs < 5 && valAbs !== 0 
            ? valAbs.toFixed(1) 
            : Math.round(valAbs).toString();
          
          return (
            <text 
              key={i} 
              x={weekdayPnlData.paddingLeft - 8} 
              y={tick.y + 4} 
              className="axis-label axis-label-y"
              style={{ direction: 'ltr' }}
            >
              {tick.val > 0 ? '+$' : tick.val < 0 ? '-$' : '$'}{toPersianDigits(valFormatted)}
            </text>
          );
        })}

        {/* Zero baseline */}
        <line 
          x1={weekdayPnlData.paddingLeft} 
          y1={weekdayPnlData.zeroY} 
          x2={width - weekdayPnlData.paddingRight} 
          y2={weekdayPnlData.zeroY} 
          className="axis-line" 
          style={{ strokeWidth: 1.5 }}
        />
        
        {/* Bars */}
        {weekdayPnlData.bars.map((bar, i) => (
          <rect 
            key={i}
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={Math.max(2, bar.height)}
            rx="4"
            className={`chart-bar ${bar.pnl >= 0 ? 'bar-profit' : 'bar-loss'}`}
            style={{
              opacity: hoveredBar && hoveredBar.name !== bar.name ? 0.45 : 1,
              transition: 'opacity 0.2s ease, fill 0.2s ease'
            }}
            onMouseEnter={() => setHoveredBar(bar)}
            onMouseLeave={() => setHoveredBar(null)}
          />
        ))}

        {/* X Axis Labels */}
        {weekdayPnlData.bars.map((bar, i) => (
          <text 
            key={i} 
            x={bar.x + bar.width / 2} 
            y={height - 12} 
            className="axis-label"
            textAnchor="middle"
            style={{ fontWeight: '600' }}
          >
            {bar.name}
          </text>
        ))}
      </svg>

      {/* Floating Tooltip Box */}
      {hoveredBar && (
        <div 
          className="svg-tooltip-container"
          style={{
            left: hoveredBar.x + hoveredBar.width / 2 - 75 + (hoveredBar.x > width - 150 ? -40 : 0),
            top: hoveredBar.y - 65,
            border: `1px solid ${hoveredBar.pnl >= 0 ? '#61f9b1' : '#ffb4ab'}`,
          }}
        >
          <div style={{ fontWeight: '700', fontSize: '12px', color: '#bbcabe' }}>
            روز {hoveredBar.fullName}
          </div>
          <div style={{ display: 'flex', gap: '4px', fontSize: '13px', fontWeight: '800', color: hoveredBar.pnl >= 0 ? '#61f9b1' : '#ffb4ab' }}>
            <span>{hoveredBar.pnl >= 0 ? 'سود:' : 'زیان:'}</span>
            <span>{hoveredBar.pnl >= 0 ? '+' : '-'}${toPersianDigits(Math.abs(hoveredBar.pnl).toFixed(2))}</span>
          </div>
        </div>
      )}
    </div>
  );
}
