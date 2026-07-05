'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { useTranslation } from '../../store/useAppStore';
import { useTradeStore } from '../../store/useTradeStore';
import JournalEditor from '../../components/journal/JournalEditor';
import { toPersianDigits, formatToman } from '../../utils/farsi';
import './journal.scss';

// --- JALALI CALENDAR HELPERS (Using native Intl API) ---

const MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const WEEKDAY_NAMES_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

function getJalaliParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-US-u-ca-persian', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = formatter.formatToParts(date);
  const findPart = (type: string) => parts.find(p => p.type === type)?.value || '';
  return {
    year: parseInt(findPart('year'), 10),
    month: parseInt(findPart('month'), 10),
    day: parseInt(findPart('day'), 10),
  };
}

function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const gYear = jy + 621;
  let dayOffset = 0;
  if (jm <= 6) {
    dayOffset = (jm - 1) * 31 + jd;
  } else {
    dayOffset = 186 + (jm - 7) * 30 + jd;
  }

  const date = new Date(gYear, 2, 18); // March 18th
  date.setDate(date.getDate() + dayOffset - 1);

  // Search local window to find exact match
  for (let i = 0; i < 10; i++) {
    const parts = getJalaliParts(date);
    if (parts.year === jy && parts.month === jm && parts.day === jd) {
      return new Date(date);
    }
    date.setDate(date.getDate() + 1);
  }

  return new Date(gYear, 2, 21); // Fallback
}

function getMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // Check Esfand leap year length
  const testDate = jalaliToGregorian(jy, 12, 30);
  const parts = getJalaliParts(testDate);
  return parts.day === 30 ? 30 : 29;
}

export default function JournalPage() {
  const { t, language } = useTranslation();
  const isEn = language === 'en';

  const p = {
    prevDay: isEn ? 'Previous Day' : 'روز قبل',
    nextDay: isEn ? 'Next Day' : 'روز بعد',
    today: isEn ? 'Today' : 'امروز',
    loadingNote: isEn ? 'Loading journal entry...' : 'در حال بارگذاری یادداشت روز...',
    moodLabel: isEn ? 'Mood Today:' : 'وضعیت روحی امروز:',
    moodHappy: isEn ? 'Happy/Great' : 'عالی/شاد',
    moodNeutral: isEn ? 'Neutral/Calm' : 'خنثی/آرام',
    moodStressed: isEn ? 'Stressed' : 'تحت فشار',
    moodAnxious: isEn ? 'Anxious' : 'نگران/مضطرب',
    moodFrustrated: isEn ? 'Frustrated/Angry' : 'کلافه/عصبانی',
    dayTradesHeader: isEn ? 'Trades Recorded Today' : 'معاملات ثبت شده امروز',
    emptyTrades: isEn ? 'No trades recorded for this day.' : 'هیچ معامله‌ای برای تاریخ امروز ثبت نشده است.',
    symbol: isEn ? 'Symbol' : 'نماد',
    direction: isEn ? 'Direction' : 'جهت',
    volume: isEn ? 'Volume (Lot)' : 'حجم (Lot)',
    openPrice: isEn ? 'Open Price' : 'قیمت ورود',
    closePrice: isEn ? 'Close Price' : 'قیمت خروج',
    netPnl: isEn ? 'Net Profit/Loss' : 'سود/زیان خالص',
    entryTime: isEn ? 'Entry Time' : 'ساعت ورود',
    buy: isEn ? 'Buy' : 'خرید (Buy)',
    sell: isEn ? 'Sell' : 'فروش (Sell)'
  };

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [body, setBody] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Ref for auto-save debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch trades from global store
  const { trades, fetchTrades } = useTradeStore();
  const [filteredTrades, setFilteredTrades] = useState<any[]>([]);

  // Format date to ISO string (YYYY-MM-DD)
  const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Jalali parts of selected date
  const jalaliSelected = getJalaliParts(selectedDate);
  const [calendarYear, setCalendarYear] = useState(jalaliSelected.year);
  const [calendarMonth, setCalendarMonth] = useState(jalaliSelected.month);

  // Load journal entry and trades when date changes
  useEffect(() => {
    const loadDayData = async () => {
      setLoading(true);
      setSaveStatus('idle');
      try {
        const dateStr = formatDateISO(selectedDate);
        const res = await api.get(`/api/journal?date=${dateStr}`);
        if (res.data) {
          setBody(res.data.body || '');
          setMood(res.data.mood || null);
        } else {
          setBody('');
          setMood(null);
        }
      } catch (err) {
        console.error('Failed to load journal note:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDayData();
    fetchTrades(false); // Reload all trades in store
  }, [selectedDate, fetchTrades]);

  // Sync calendar picker header when selected date changes
  useEffect(() => {
    setCalendarYear(jalaliSelected.year);
    setCalendarMonth(jalaliSelected.month);
  }, [selectedDate]);

  // Filter trades matching selected date
  useEffect(() => {
    const dateStr = formatDateISO(selectedDate);
    const dayTrades = trades.filter((trade) => {
      const openD = trade.openTime.substring(0, 10);
      const closeD = trade.closeTime ? trade.closeTime.substring(0, 10) : null;
      return openD === dateStr || closeD === dateStr;
    });
    setFilteredTrades(dayTrades);
  }, [trades, selectedDate]);

  // Handle Note content change with auto-save
  const handleContentChange = (newContent: string) => {
    setBody(newContent);
    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveJournalEntry(newContent, mood);
    }, 1500); // Save after 1.5s of typing inactivity
  };

  // Handle Mood change with auto-save
  const handleMoodChange = (newMood: string | null) => {
    setMood(newMood);
    setSaveStatus('saving');
    saveJournalEntry(body, newMood);
  };

  const saveJournalEntry = async (text: string, currentMood: string | null) => {
    try {
      const dateStr = formatDateISO(selectedDate);
      await api.post('/api/journal', {
        date: dateStr,
        body: text,
        mood: currentMood,
      });
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to save journal entry:', err);
      setSaveStatus('error');
    }
  };

  // Navigate Days
  const navigateDay = (offset: number) => {
    const nextD = new Date(selectedDate);
    nextD.setDate(nextD.getDate() + offset);
    setSelectedDate(nextD);
  };

  const jumpToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);
  };

  // Render Jalali Date Picker Calendar Days
  const renderCalendarDays = () => {
    const daysInMonth = getMonthLength(calendarYear, calendarMonth);
    const firstDayDate = jalaliToGregorian(calendarYear, calendarMonth, 1);
    
    // First day of the month weekday index: 0 = Sun, 1 = Mon, ..., 6 = Sat
    const gDay = firstDayDate.getDay();
    // Shift index so Saturday (ش) is 0: (gDay + 1) % 7
    const firstDayOffset = (gDay + 1) % 7;

    const dayBlocks = [];

    // Empty spaces for padding before the 1st of the month
    for (let i = 0; i < firstDayOffset; i++) {
      dayBlocks.push(<div key={`empty-${i}`} className="calendar-day-empty" />);
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = 
        jalaliSelected.year === calendarYear &&
        jalaliSelected.month === calendarMonth &&
        jalaliSelected.day === d;

      dayBlocks.push(
        <button
          key={`day-${d}`}
          type="button"
          className={`calendar-day-btn ${isSelected ? 'active' : ''}`}
          onClick={() => {
            const target = jalaliToGregorian(calendarYear, calendarMonth, d);
            setSelectedDate(target);
            setShowDatePicker(false);
          }}
        >
          {toPersianDigits(d.toString())}
        </button>
      );
    }

    return dayBlocks;
  };

  const changeCalendarMonth = (offset: number) => {
    let nextM = calendarMonth + offset;
    let nextY = calendarYear;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    } else if (nextM < 1) {
      nextM = 12;
      nextY -= 1;
    }
    setCalendarMonth(nextM);
    setCalendarYear(nextY);
  };

  // Format selected date string (e.g. Saturday, June 25, 2026 or شنبه، ۲۵ خرداد ۱۴۰۵)
  const formatSelectedDateFull = () => {
    try {
      const formatter = new Intl.DateTimeFormat(isEn ? 'en-US' : 'fa-IR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      return formatter.format(selectedDate);
    } catch {
      return isEn 
        ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : `${jalaliSelected.day} ${MONTH_NAMES[jalaliSelected.month - 1]} ${jalaliSelected.year}`;
    }
  };

  return (
    <div className="journal-page-container">
      {/* Date Header Controller */}
      <header className="journal-date-header">
        <div className="navigation-controls">
          <button className="nav-arrow-btn" onClick={() => navigateDay(isEn ? 1 : -1)} title={p.prevDay}>
            <span className="material-symbols-outlined">{isEn ? 'chevron_left' : 'chevron_right'}</span>
          </button>
          
          <div className="date-picker-trigger-box">
            <button 
              className={`date-picker-btn ${showDatePicker ? 'active' : ''}`} 
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <span className="material-symbols-outlined calendar-icon">calendar_month</span>
              <span className="date-text">{formatSelectedDateFull()}</span>
              <span className="material-symbols-outlined arrow-icon">keyboard_arrow_down</span>
            </button>

            {/* Jalali Calendar Popover */}
            {showDatePicker && (
              <div className="calendar-popover">
                <div className="calendar-header">
                  <button className="nav-month-btn" onClick={() => changeCalendarMonth(1)}>
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                  <span className="month-year-label">
                    {MONTH_NAMES[calendarMonth - 1]} {toPersianDigits(calendarYear.toString())}
                  </span>
                  <button className="nav-month-btn" onClick={() => changeCalendarMonth(-1)}>
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                </div>

                <div className="weekdays-grid">
                  {WEEKDAY_NAMES_SHORT.map((w, idx) => (
                    <span key={idx} className="weekday-lbl">{w}</span>
                  ))}
                </div>

                <div className="days-grid">
                  {renderCalendarDays()}
                </div>
              </div>
            )}
          </div>

          <button className="nav-arrow-btn" onClick={() => navigateDay(1)} title="روز بعد">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
        </div>

        <button className="today-jump-btn" onClick={jumpToToday}>
          امروز
        </button>
      </header>

      {/* Main Journal Note Card */}
      <div className="journal-content-card">
        {loading ? (
          <div className="loading-card-state">
            <div className="spinner"></div>
            <span>در حال بارگذاری یادداشت روز...</span>
          </div>
        ) : (
          <>
            {/* Mood selector */}
            <div className="mood-selection-bar">
              <span className="lbl">وضعیت روحی امروز:</span>
              <div className="mood-pills">
                {[
                  { value: 'HAPPY', label: 'عالی/شاد', emoji: '😊' },
                  { value: 'NEUTRAL', label: 'خنثی/آرام', emoji: '😐' },
                  { value: 'STRESSED', label: 'تحت فشار', emoji: '😰' },
                  { value: 'ANXIOUS', label: 'نگران/مضطرب', emoji: '🥺' },
                  { value: 'FRUSTRATED', label: 'کلافه/عصبانی', emoji: '😡' },
                ].map((m) => {
                  const isActive = mood === m.value;
                  return (
                    <button
                      key={m.value}
                      className={`mood-pill ${isActive ? 'active' : ''}`}
                      onClick={() => handleMoodChange(isActive ? null : m.value)}
                    >
                      <span className="emoji">{m.emoji}</span>
                      <span className="label">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note Editor */}
            <JournalEditor
              value={body}
              onChange={handleContentChange}
              onSave={() => saveJournalEntry(body, mood)}
              saveStatus={saveStatus}
            />
          </>
        )}
      </div>

      {/* Trades of the day section */}
      <div className="day-trades-section">
        <h3>معاملات ثبت شده امروز</h3>
        
        {filteredTrades.length === 0 ? (
          <div className="empty-trades-state">
            <span className="material-symbols-outlined empty-icon">show_chart</span>
            <p>هیچ معامله‌ای برای تاریخ امروز ثبت نشده است.</p>
          </div>
        ) : (
          <div className="trades-table-wrapper">
            <table className="day-trades-table">
              <thead>
                <tr>
                  <th>نماد</th>
                  <th>جهت</th>
                  <th>حجم (Lot)</th>
                  <th>قیمت ورود</th>
                  <th>قیمت خروج</th>
                  <th>سود/زیان خالص</th>
                  <th>ساعت ورود</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((t) => {
                  const isBuy = t.direction === 'BUY';
                  const isProfit = t.profitUsd >= 0;
                  const timeStr = new Date(t.openTime).toLocaleTimeString('fa-IR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Tehran'
                  });

                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 700 }}>{t.symbol}</td>
                      <td>
                        <span className={`direction-badge ${isBuy ? 'buy' : 'sell'}`}>
                          {isBuy ? 'خرید (Buy)' : 'فروش (Sell)'}
                        </span>
                      </td>
                      <td>{toPersianDigits(t.lotSize.toString())}</td>
                      <td style={{ direction: 'ltr' }}>{toPersianDigits(t.openPrice.toString())}</td>
                      <td style={{ direction: 'ltr' }}>{t.closePrice ? toPersianDigits(t.closePrice.toString()) : '—'}</td>
                      <td style={{ direction: 'ltr', fontWeight: 700 }} className={isProfit ? 'profit' : 'loss'}>
                        {isProfit ? '+' : ''}${toPersianDigits(t.profitUsd.toFixed(2))}
                      </td>
                      <td>{toPersianDigits(timeStr)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
