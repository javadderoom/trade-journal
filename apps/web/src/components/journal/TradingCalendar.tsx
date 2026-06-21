'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toPersianDigits } from '../../utils/farsi';

interface Trade {
  closeTime: string | null;
  profitUsd: number;
  commission?: number | null;
  swap?: number | null;
}

interface TradingCalendarProps {
  closedTrades: Trade[];
}

const JALALI_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];
const WEEKDAY_NAMES_CALENDAR = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

// Utility to convert Gregorian date to Jalali
const getJalaliDate = (date: Date) => {
  try {
    const formatted = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'Asia/Tehran'
    }).format(date);
    const clean = formatted.replace(' AP', '');
    const [mStr, dStr, yStr] = clean.split('/');
    return {
      year: parseInt(yStr, 10),
      month: parseInt(mStr, 10),
      day: parseInt(dStr, 10)
    };
  } catch {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
  }
};

export default function TradingCalendar({ closedTrades }: TradingCalendarProps) {
  const router = useRouter();
  const [calendarYear, setCalendarYear] = useState<number>(1405);
  const [calendarMonth, setCalendarMonth] = useState<number>(4);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  // Initialize with today's Jalali date on mount
  useEffect(() => {
    const todayJ = getJalaliDate(new Date());
    setCalendarYear(todayJ.year);
    setCalendarMonth(todayJ.month);
  }, []);

  const handleDayClick = (dateStr: string) => {
    setSelectedDates((prev) => {
      if (prev.includes(dateStr)) {
        return prev.filter((d) => d !== dateStr);
      } else {
        return [...prev, dateStr];
      }
    });
  };

  const handlePrevMonth = () => {
    if (calendarMonth === 1) {
      setCalendarMonth(12);
      setCalendarYear((prev) => prev - 1);
    } else {
      setCalendarMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 12) {
      setCalendarMonth(1);
      setCalendarYear((prev) => prev + 1);
    } else {
      setCalendarMonth((prev) => prev + 1);
    }
  };

  const jalaliCalendarData = useMemo(() => {
    // 1. Approximate search start: Jalali year roughly maps to gregYear = targetYear + 621
    const gregYear = calendarYear + 621;
    const gregMonth = (calendarMonth + 1) % 12; // approximate Month matching (March is month 2)
    
    let current = new Date(gregYear, gregMonth, 15);
    let jDate = getJalaliDate(current);
    
    // Adjust Gregorian date to match calendarYear and calendarMonth
    let limit = 0;
    while ((jDate.year !== calendarYear || jDate.month !== calendarMonth) && limit < 100) {
      limit++;
      const diffYears = calendarYear - jDate.year;
      const diffMonths = calendarMonth - jDate.month;
      
      if (diffYears !== 0) {
        current.setDate(current.getDate() + diffYears * 365);
      } else if (diffMonths !== 0) {
        current.setDate(current.getDate() + diffMonths * 30);
      }
      jDate = getJalaliDate(current);
    }
    
    // Adjust precisely to Day 1 of the target month
    limit = 0;
    while (jDate.day > 1 && limit < 40) {
      limit++;
      current.setDate(current.getDate() - 1);
      jDate = getJalaliDate(current);
    }
    limit = 0;
    while (jDate.month !== calendarMonth && limit < 40) {
      limit++;
      current.setDate(current.getDate() + 1);
      jDate = getJalaliDate(current);
    }

    const targetMonth = jDate.month;
    const targetYear = jDate.year;
    const days: { date: Date; jDay: number; dayOfWeek: number; dateStr: string }[] = [];

    // Collect all days of the Jalali month (correctly handles 31, 30, and 29/30 day months)
    limit = 0;
    while (jDate.month === targetMonth && limit < 35) {
      limit++;
      const yearStr = current.getFullYear();
      const monthStr = String(current.getMonth() + 1).padStart(2, '0');
      const dayStr = String(current.getDate()).padStart(2, '0');
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

      days.push({
        date: new Date(current),
        jDay: jDate.day,
        dayOfWeek: (current.getDay() + 1) % 7, // align to Persian Saturday (0) to Friday (6)
        dateStr
      });
      current.setDate(current.getDate() + 1);
      jDate = getJalaliDate(current);
    }

    // Map closed trades' pnl to the days of this calendar month
    const monthPnlMap: { [dateStr: string]: { netPnl: number; count: number; winners: number; losers: number } } = {};

    closedTrades.forEach((t) => {
      if (!t.closeTime) return;
      let dateStr = '';
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Tehran',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        const parts = formatter.format(new Date(t.closeTime)).split('/');
        dateStr = `${parts[2]}-${parts[0]}-${parts[1]}`;
      } catch {
        dateStr = t.closeTime.substring(0, 10);
      }

      const net = t.profitUsd + (t.commission ?? 0) + (t.swap ?? 0);

      if (!monthPnlMap[dateStr]) {
        monthPnlMap[dateStr] = { netPnl: 0, count: 0, winners: 0, losers: 0 };
      }
      monthPnlMap[dateStr].netPnl += net;
      monthPnlMap[dateStr].count += 1;
      if (net > 0) monthPnlMap[dateStr].winners += 1;
      else if (net < 0) monthPnlMap[dateStr].losers += 1;
    });

    const daysWithStats = days.map((d) => {
      const statsVal = monthPnlMap[d.dateStr] || { netPnl: 0, count: 0, winners: 0, losers: 0 };
      return {
        ...d,
        ...statsVal
      };
    });

    const monthPnls = daysWithStats.map((d) => Math.abs(d.netPnl)).filter((v) => v > 0);
    const maxMonthAbsVal = monthPnls.length > 0 ? Math.max(...monthPnls) : 100;

    return {
      year: targetYear,
      month: targetMonth,
      monthName: JALALI_MONTH_NAMES[targetMonth - 1] || 'نامشخص',
      days: daysWithStats,
      maxMonthAbsVal
    };
  }, [closedTrades, calendarYear, calendarMonth]);

  return (
    <div className="journal-card calendar-heatmap-container" style={{ flex: 1 }}>
      {/* Calendar Navigation Header */}
      <div className="calendar-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
        <span className="calendar-title-month" style={{ fontSize: '15px', fontWeight: '700' }}>
          تقویم معاملاتی: {jalaliCalendarData.monthName} {toPersianDigits(jalaliCalendarData.year)}
        </span>
        <div className="calendar-nav-buttons" style={{ display: 'flex', gap: '8px', direction: 'ltr' }}>
          <button 
            onClick={handlePrevMonth}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#bbcabe',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title="ماه قبل"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
          </button>
          <button 
            onClick={handleNextMonth}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#bbcabe',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title="ماه بعد"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
          </button>
        </div>
      </div>

      <div className="calendar-grid-wrapper">
        <div className="calendar-weekdays-grid">
          {WEEKDAY_NAMES_CALENDAR.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        
        <div className="calendar-days-grid">
          {/* Empty cells before start of month */}
          {jalaliCalendarData.days.length > 0 && Array.from({ length: jalaliCalendarData.days[0].dayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="calendar-day-cell calendar-cell-placeholder" />
          ))}

          {/* Day cells */}
          {jalaliCalendarData.days.map((day) => {
            const isSelected = selectedDates.includes(day.dateStr);
            const cellClass = day.count === 0 
              ? 'calendar-cell-empty'
              : day.netPnl > 0 
                ? `calendar-cell-profit-${Math.min(Math.ceil((day.netPnl / jalaliCalendarData.maxMonthAbsVal) * 4), 4)}`
                : `calendar-cell-loss-${Math.min(Math.ceil((Math.abs(day.netPnl) / jalaliCalendarData.maxMonthAbsVal) * 4), 4)}`;

            const tooltipText = day.count > 0 
              ? `تاریخ: ${toPersianDigits(day.dateStr)}
تعداد معاملات: ${toPersianDigits(day.count)}
سود ناخالص: ${toPersianDigits(day.winners.toString())} معامله برد
زیان ناخالص: ${toPersianDigits(day.losers.toString())} معامله باخت
سود و زیان خالص: ${day.netPnl >= 0 ? '+' : '-'}$${toPersianDigits(Math.abs(day.netPnl).toFixed(2))}`
              : `تاریخ: ${toPersianDigits(day.dateStr)}\nبدون معامله ثبت شده`;

            return (
              <div 
                key={day.jDay} 
                className={`calendar-day-cell ${cellClass} ${isSelected ? 'selected' : ''}`}
                title={tooltipText}
                onClick={() => day.count > 0 && handleDayClick(day.dateStr)}
                style={{ cursor: day.count > 0 ? 'pointer' : 'default' }}
              >
                <span className="cell-day-num">{toPersianDigits(day.jDay)}</span>
                {day.count > 0 && (
                  <span className="cell-pnl-val" style={{ direction: 'ltr' }}>
                    {day.netPnl >= 0 ? '+' : '-'}${toPersianDigits(Math.abs(Math.round(day.netPnl)).toString())}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Labeled Calendar Legend */}
      <div className="calendar-legend-bottom">
        <div className="legend-item">
          <div className="legend-box empty" />
          <span>بدون معامله</span>
        </div>
        <div className="legend-item">
          <div className="legend-box loss-light" />
          <span>ضرر جزئی</span>
        </div>
        <div className="legend-item">
          <div className="legend-box loss-dark" />
          <span>ضرر سنگین</span>
        </div>
        <div className="legend-item">
          <div className="legend-box profit-light" />
          <span>سود جزئی</span>
        </div>
        <div className="legend-item">
          <div className="legend-box profit-dark" />
          <span>سود سنگین</span>
        </div>
      </div>

      {/* Floating/Bottom Action Bar for multi-date navigation */}
      {selectedDates.length > 0 && (
        <div className="calendar-action-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(97, 249, 177, 0.08)', border: '1px solid rgba(97, 249, 177, 0.25)', borderRadius: '12px', padding: '12px 16px', marginTop: '20px' }}>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#e2e2eb' }}>
            {toPersianDigits(selectedDates.length)} روز انتخاب شده است
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setSelectedDates([])}
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '12px', height: 'auto', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#bbcabe' }}
            >
              لغو انتخاب
            </button>
            <button 
              onClick={() => {
                router.push(`/trades?date=${selectedDates.join(',')}`);
              }}
              className="btn btn-primary" 
              style={{ padding: '6px 12px', fontSize: '12px', height: 'auto', background: '#61f9b1', border: 'none', color: '#003822', fontWeight: '700' }}
            >
              مشاهده معاملات
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
