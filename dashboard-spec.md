# Dashboard Page — داشبورد
## TradeKav | Page Specification

---

## Purpose

The dashboard is the first screen a user sees after login.
It answers one question: **"How am I doing?"**

It is a summary layer — not a replacement for the trades, analytics, or journal pages.
Every element either informs the trader about **today**, or gives them a reason to navigate deeper.

---

## Layout

```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR (right, fixed)                                  │
│  داشبورد | معاملات | گزارش عملکرد | ژورنال | تنظیمات   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  TOP BAR                                                 │
│  "سلام، [نام]" + current Jalali date + account selector  │
├─────────────────────────────────────────────────────────┤
│  SECTION 1 — TODAY (امروز)                               │
│  Today's P&L | Trades | Streak | Journal status          │
├─────────────────────────────────────────────────────────┤
│  SECTION 2 — THIS MONTH (این ماه)                        │
│  Equity curve + 4 KPI cards                              │
├─────────────────────────────────────────────────────────┤
│  SECTION 3 — YOUR EDGE (برتری معاملاتی)                    │
│  Auto-generated insight card                             │
├─────────────────────────────────────────────────────────┤
│  SECTION 4 — RECENT ACTIVITY (فعالیت اخیر)               │
│  Last 5 trades + Last journal entry                      │
└─────────────────────────────────────────────────────────┘
```

---

## Section 1 — Today (امروز)

Four compact cards in a row.
If the user has not traded today, show cards in a muted/empty state — do not show zeros.

### Card 1 — Today's P&L
- Label: سود/زیان امروز
- Value: large, bold — green if positive, red if negative
- Sub-label: Toman equivalent in smaller muted text
- Empty state: "امروز معامله‌ای ندارید"

### Card 2 — Today's Trades
- Label: معاملات امروز
- Value: total count
- Sub-line: X برنده · Y بازنده (green/red split)
- Clicking navigates to trades page filtered to today

### Card 3 — Current Streak
- Label: استریک فعلی
- Value: "۵ برد پشت سر هم" (green) or "۳ باخت پشت سر هم" (red)
- Icon: flame emoji for win streak, warning icon for loss streak
- Show nothing if last trade was breakeven

### Card 4 — Journal Status
- Label: ژورنال امروز
- Value: "نوشته شده ✓" (green) or "هنوز ننوشتی" (muted)
- If not written: show a subtle CTA button "بنویس" that navigates to journal page
- If written: show mood emoji + first 6 words of entry

---

## Section 2 — This Month (این ماه)

### Equity Curve
- Full width card
- Title: "منحنی سرمایه — [Jalali month name]"
- ECharts smooth area chart
- Emerald line + semi-transparent fill below
- X-axis: Jalali dates for current month
- Y-axis: cumulative P&L in USD
- Show a subtle drawdown shading below the curve's peak (red fill)
- If no trades this month: empty state illustration + "هنوز معامله‌ای ندارید"

### KPI Cards (4 in a row below the curve)

| Card | Label | Color |
|---|---|---|
| Win Rate | نرخ موفقیت | Gold if ≥50%, red if below |
| Profit Factor | ضریب سود | Green if ≥1.5, red if below 1 |
| Average R:R | میانگین R:R | White |
| Max Drawdown | حداکثر افت | Always red |

Each card:
- Large bold value
- Small label below in muted color
- Tiny sparkline trend (7-day) under the value
- Tooltip on hover explaining what the metric means in Persian

---

## Section 3 — Your Edge (برتری معاملاتی)

This is the most differentiated element on the dashboard.
A single auto-generated insight sentence based on the user's last 30 days of trades.

### Card design:
- Full width, slightly taller than KPI cards
- Left border accent in emerald green
- Small label: "برتری معاملاتی شما"
- Large sentence in the center
- Sub-label: "بر اساس ۳۰ روز گذشته"
- Refresh icon to regenerate (recalculates, not AI)

### Insight logic — priority order:

Generate the first insight that has enough data (minimum 5 trades in the group):

**1. Best session:**
```
"این ماه بهترین عملکردت رو تو سشن [session] داشتی — [X]٪ موفقیت"
```
Session = the emotion tag or time-of-day grouping with highest win rate.

**2. Best strategy tag:**
```
"استراتژی [tag] با [X]٪ موفقیت بهترین setup توئه"
```

**3. Best day of week:**
```
"[weekday] بهترین روز تریدته — میانگین [+$X] سود"
```

**4. Emotion vs outcome:**
```
"وقتی آروم تریدی، [X]٪ موفقیتی. وقتی [emotion]، [Y]٪"
```

**5. Fallback (not enough data):**
```
"بعد از [N] معامله بیشتر، برتری معاملاتیت رو بهت نشون می‌دیم"
```

### Backend query (Express):
```typescript
// Get last 30 days trades for the user
// Group by: session tag, strategy tag, day of week, emotion tag
// Find group with: min 5 trades AND highest win rate
// Return: { type, label, winRate, totalTrades }
```

---

## Section 4 — Recent Activity (فعالیت اخیر)

Two columns side by side.

### Left column (60%) — Last 5 Trades
- Title: "آخرین معاملات"
- Compact rows — no full table, just essentials:
  ```
  [direction badge] [symbol]  [strategy tag]  [R]  [P&L]
  ```
- Profit: green | Loss: red
- "مشاهده همه معاملات ←" link at bottom

### Right column (40%) — Last Journal Entry
- Title: "آخرین یادداشت"
- Shows: Jalali date + mood emoji
- First 2–3 lines of journal text, truncated with "..."
- "ادامه مطلب" link → navigates to that day in journal page
- If no journal entries yet: "هنوز یادداشتی ننوشتی" + CTA to journal

---

## API Endpoints Needed

```
GET /api/dashboard/today
→ { pnl, tradeCount, wins, losses, streak }

GET /api/dashboard/month?month=YYYY-MM
→ { equityCurve: [{date, cumPnl}], kpis: {winRate, profitFactor, avgR, maxDrawdown} }

GET /api/dashboard/edge
→ { type, insight, winRate, sampleSize }

GET /api/dashboard/recent
→ { trades: [last 5], journalEntry: {date, mood, preview} }
```

Or combine into one call:
```
GET /api/dashboard/summary
→ { today, month, edge, recent }
```

Single call is better for dashboard — avoids 4 waterfall requests on page load.

---

## Empty States

The dashboard must handle new users gracefully (zero trades, zero journal entries).

| Section | Empty State |
|---|---|
| Today | "امروز معامله‌ای ندارید — معامله‌ات رو ثبت کن" + import button |
| Equity curve | Illustration + "اولین معاملاتت رو وارد کن تا منحنی سرمایه‌ات رو ببینی" |
| Edge insight | "بعد از [N] معامله بیشتر نشون می‌دیم" |
| Recent trades | "هنوز معامله‌ای ندارید" + link to import |
| Recent journal | "هنوز یادداشتی ننوشتی" + link to journal |

Do not show empty KPI cards with "0" values — it looks broken.
Hide the KPI row entirely until the user has at least 10 trades.

---

## What Does NOT Belong Here

- Full trade table → that is the trades page
- Full analytics charts → that is the analytics page
- Account/broker settings → that is settings
- Notifications or alerts (v1)
- Leaderboards or social features (v1)

---

## Design Tokens

```
Background:        #0F1117
Surface (cards):   #181C27
Border:            #252A3A
Accent (green):    #3DDC97
Danger (red):      #FF5370
Text primary:      #E8EAF0
Text muted:        #6B7280
Gold (KPI):        #F5C542
Font:              Vazirmatn
Direction:         RTL
```

---

## Build Order

1. `/api/dashboard/summary` endpoint — single combined query
2. Edge insight logic — pure SQL/Prisma, no AI needed
3. Today cards component
4. Equity curve (reuse from analytics page if already built)
5. KPI cards (reuse from analytics page)
6. Edge insight card
7. Recent trades + recent journal columns
8. Empty states for all sections

---

*TradeKav Dashboard Spec v1.0*
