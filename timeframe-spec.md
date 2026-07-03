# Add Analysis & Entry Timeframes to Trades

Users should be able to select two timeframes per trade:
1. **Analysis Timeframe** (تایم‌فریم تحلیل) — the chart timeframe used to identify the setup
2. **Entry Timeframe** (تایم‌فریم ورود) — the chart timeframe used to execute the entry

## Timeframe Options

Standard trading timeframes (displayed as Persian-labeled options):

| Value | Label |
|-------|-------|
| `M1` | ۱ دقیقه |
| `M5` | ۵ دقیقه |
| `M15` | ۱۵ دقیقه |
| `M30` | ۳۰ دقیقه |
| `H1` | ۱ ساعته |
| `H4` | ۴ ساعته |
| `D1` | روزانه |
| `W1` | هفتگی |
| `MN` | ماهانه |

Both fields are **optional** (nullable) — not every trade needs them, and existing trades should remain unaffected.

---

## Proposed Changes

### 1. Database Layer (Prisma Schema + Migration)

**File:** `apps/api/src/prisma/schema.prisma`

Add two new nullable string fields to the `Trade` model (after `chart_data`, before `created_at`):

```diff
 model Trade {
   ...
   chart_data    Json?
+  analysis_timeframe String?  // e.g. "M15", "H1", "H4", "D1"
+  entry_timeframe    String?  // e.g. "M1", "M5", "M15"
   created_at    DateTime     @default(now())
   ...
 }
```

Generate migration:
```bash
cd apps/api && npx prisma migrate dev --name add_trade_timeframes
```

---

### 2. API Layer

**File:** `apps/api/src/types/trade.ts`

Add optional fields to the `TradeData` interface:

```diff
 export interface TradeData {
   ...
   chartData?: any;
+  analysisTimeframe?: string;
+  entryTimeframe?: string;
 }
```

**File:** `apps/api/src/routes/tradeSync.ts`

#### PUT /:id (~line 262)

Add `analysisTimeframe` and `entryTimeframe` to the destructured `req.body` and pass them through to `prisma.trade.update()`:

```diff
 const {
   notes, emotion, stopLoss, takeProfit, tags, accountId,
   closeTime, closePrice, profitUsd, commission, swap,
   symbol, direction, lotSize, openPrice, openTime,
+  analysisTimeframe, entryTimeframe,
 } = req.body;
```

```diff
 const updated = await prisma.trade.update({
   where: { id },
   data: {
     ...
+    analysis_timeframe: analysisTimeframe !== undefined ? analysisTimeframe : undefined,
+    entry_timeframe: entryTimeframe !== undefined ? entryTimeframe : undefined,
   },
 });
```

#### POST / (~line 131, manual trade creation)

Also accept the two new fields so new manual trades can set timeframes at creation time.

#### GET / (~line 48)

No changes needed — Prisma automatically includes the new fields in `findMany` results.

---

### 3. Frontend — Type Definitions

**File:** `apps/web/src/components/trades/TradesTable.tsx`

Add the new fields to the exported `Trade` interface:

```diff
 export interface Trade {
   ...
   chartData?: any;
+  analysisTimeframe?: string | null;
+  entryTimeframe?: string | null;
 }
```

---

### 4. Frontend — Zustand Store

**File:** `apps/web/src/store/useTradeStore.ts`

**fetchTrades mapping** (~line 230–253): Map the new fields from the API response:

```diff
   screenshots: item.screenshots ?? [],
   chartData: item.chartData ?? null,
+  analysisTimeframe: item.analysisTimeframe ?? null,
+  entryTimeframe: item.entryTimeframe ?? null,
 };
```

**updateTrade** (~line 278–295): Include the fields in the API PUT body:

```diff
 const res = await api.put(`/api/trades/${tradeId}`, {
   ...
   openTime: updatedTrade.openTime,
+  analysisTimeframe: updatedTrade.analysisTimeframe,
+  entryTimeframe: updatedTrade.entryTimeframe,
 });
```

---

### 5. Frontend — DesktopTable "روز" (Day) Column

**File:** `apps/web/src/components/trades/DesktopTable.tsx`

Add timeframe badges inside the existing "day-session-wrapper" `<div>` (lines 123–135), below the session badge:

```tsx
<td>
  <div className="day-session-wrapper">
    <span className="day-badge">{formatDate(trade.openTime, selectedTimezone).day}</span>
    {(() => {
      const sess = getTradingSession(trade.openTime);
      return (
        <span className={`session-badge ${sess.className}`} title={sess.label}>
          {sess.emoji} {sess.label}
        </span>
      );
    })()}
    {/* NEW: Timeframe badges */}
    {(trade.analysisTimeframe || trade.entryTimeframe) && (
      <div className="timeframe-badges">
        {trade.analysisTimeframe && (
          <span className="timeframe-badge analysis" title="تایم‌فریم تحلیل">
            📊 {trade.analysisTimeframe}
          </span>
        )}
        {trade.entryTimeframe && (
          <span className="timeframe-badge entry" title="تایم‌فریم ورود">
            🎯 {trade.entryTimeframe}
          </span>
        )}
      </div>
    )}
  </div>
</td>
```

**File:** `apps/web/src/components/trades/trades.scss`

Add CSS for the timeframe badges (compact, similar style to session badges):

```scss
.timeframe-badges {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.timeframe-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;

  &.analysis { border-left: 2px solid #60a5fa; }
  &.entry    { border-left: 2px solid #34d399; }
}
```

---

### 6. Frontend — FilterBar (Timeframe Filter)

**File:** `apps/web/src/components/trades/FilterBar.tsx`

Add a new `<Select>` dropdown inside the `advanced-fields-grid` (after the "جهت معامله" direction filter):

```tsx
<div className="advanced-field">
  <label>تایم‌فریم</label>
  <Select
    value={selectedTimeframe}
    onChange={(val) => {
      setSelectedTimeframe(val);
      setCurrentPage(1);
    }}
    options={[
      { value: 'ALL', label: 'همه تایم‌فریم‌ها' },
      { value: 'M1',  label: '۱ دقیقه (M1)' },
      { value: 'M5',  label: '۵ دقیقه (M5)' },
      { value: 'M15', label: '۱۵ دقیقه (M15)' },
      { value: 'M30', label: '۳۰ دقیقه (M30)' },
      { value: 'H1',  label: '۱ ساعته (H1)' },
      { value: 'H4',  label: '۴ ساعته (H4)' },
      { value: 'D1',  label: 'روزانه (D1)' },
      { value: 'W1',  label: 'هفتگی (W1)' },
      { value: 'MN',  label: 'ماهانه (MN)' },
    ]}
  />
</div>
```

Props to add to `FilterBarProps`:

```diff
+  selectedTimeframe: string;
+  setSelectedTimeframe: (val: string) => void;
```

Also update the "پاک کردن فیلترها" (clear filters) button handler to reset the timeframe:

```diff
  onClick={() => {
    setSearchQuery('');
    setSelectedSymbol('همه نمادها');
    setSelectedDirection('همه جهت‌ها');
    setSelectedStatus('ALL');
+   setSelectedTimeframe('ALL');
    setCurrentPage(1);
  }}
```

**File:** `apps/web/src/components/trades/TradesTable.tsx`

Add filter state and wire it up:

```diff
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('همه نمادها');
  const [selectedDirection, setSelectedDirection] = useState('همه جهت‌ها');
+ const [selectedTimeframe, setSelectedTimeframe] = useState('ALL');
```

Add filtering logic in the `filteredTrades` `useMemo` (after the direction filter, ~line 378):

```diff
      if (selectedDirection !== 'همه جهت‌ها') {
        const dir = selectedDirection === 'خرید (Buy)' ? 'BUY' : 'SELL';
        if (trade.direction !== dir) return false;
      }
+     if (selectedTimeframe !== 'ALL') {
+       const matchAnalysis = trade.analysisTimeframe === selectedTimeframe;
+       const matchEntry = trade.entryTimeframe === selectedTimeframe;
+       if (!matchAnalysis && !matchEntry) return false;
+     }
```

Pass the new props to `<FilterBar>`:

```diff
  <FilterBar
    ...
    selectedDirection={selectedDirection}
    setSelectedDirection={setSelectedDirection}
+   selectedTimeframe={selectedTimeframe}
+   setSelectedTimeframe={setSelectedTimeframe}
    ...
  />
```

Update the `useMemo` dependency array:

```diff
- }, [trades, selectedSymbol, selectedDirection, searchQuery, selectedStatus, filterDatesArray, selectedTimezone, ignoredTagsSet]);
+ }, [trades, selectedSymbol, selectedDirection, selectedTimeframe, searchQuery, selectedStatus, filterDatesArray, selectedTimezone, ignoredTagsSet]);
```

---

### 7. Frontend — DetailPanel UI (Timeframe Selectors)

**File:** `apps/web/src/components/trades/DetailPanel.tsx`

Add two `<select>` dropdowns in the **"جزئیات اجرا" (Execution Details)** section, after the session row (~line 334–344):

```tsx
{/* Analysis Timeframe */}
<span className="grid-label">تایم‌فریم تحلیل:</span>
<span className="grid-value">
  <select
    className="grid-input"
    value={activeTrade.analysisTimeframe || ''}
    onChange={e => updateActiveTradeField('analysisTimeframe', e.target.value || null)}
    style={inputStyle}
  >
    <option value="" style={{ backgroundColor: '#1e222b', color: '#fff' }}>—</option>
    <option value="M1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>۱ دقیقه (M1)</option>
    <option value="M5" style={{ backgroundColor: '#1e222b', color: '#fff' }}>۵ دقیقه (M5)</option>
    <option value="M15" style={{ backgroundColor: '#1e222b', color: '#fff' }}>۱۵ دقیقه (M15)</option>
    <option value="M30" style={{ backgroundColor: '#1e222b', color: '#fff' }}>۳۰ دقیقه (M30)</option>
    <option value="H1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>۱ ساعته (H1)</option>
    <option value="H4" style={{ backgroundColor: '#1e222b', color: '#fff' }}>۴ ساعته (H4)</option>
    <option value="D1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>روزانه (D1)</option>
    <option value="W1" style={{ backgroundColor: '#1e222b', color: '#fff' }}>هفتگی (W1)</option>
    <option value="MN" style={{ backgroundColor: '#1e222b', color: '#fff' }}>ماهانه (MN)</option>
  </select>
</span>

{/* Entry Timeframe */}
<span className="grid-label">تایم‌فریم ورود:</span>
<span className="grid-value">
  <select
    className="grid-input"
    value={activeTrade.entryTimeframe || ''}
    onChange={e => updateActiveTradeField('entryTimeframe', e.target.value || null)}
    style={inputStyle}
  >
    {/* same options as above */}
  </select>
</span>
```

---

### 8. Frontend — MobileCardsList (Optional Badges)

**File:** `apps/web/src/components/trades/MobileCardsList.tsx`

Show the selected timeframes as small badges on the mobile card (similar to how emotion/tags are displayed), only when they have a value.

---

## Files Changed Summary

| File | Action |
|------|--------|
| `apps/api/src/prisma/schema.prisma` | Add 2 new fields to `Trade` model |
| `apps/api/src/types/trade.ts` | Add 2 optional fields to `TradeData` |
| `apps/api/src/routes/tradeSync.ts` | Accept & persist in PUT /:id and POST / |
| `apps/web/src/components/trades/TradesTable.tsx` | Add to `Trade` interface, filter state, filter logic |
| `apps/web/src/store/useTradeStore.ts` | Map in fetch, send in update |
| `apps/web/src/components/trades/DesktopTable.tsx` | Show badges in "day" column |
| `apps/web/src/components/trades/trades.scss` | Badge styles |
| `apps/web/src/components/trades/FilterBar.tsx` | Timeframe select dropdown |
| `apps/web/src/components/trades/DetailPanel.tsx` | Two select dropdowns for editing |
| `apps/web/src/components/trades/MobileCardsList.tsx` | Optional badge display |

## Verification Plan

### Automated
```bash
cd apps/api && npx prisma migrate dev --name add_trade_timeframes
cd apps/api && npm run build
cd apps/web && npm run build
```

### Manual
1. Open a trade in the DetailPanel → verify two new dropdown selectors appear
2. Select H4 analysis / M15 entry → save → refresh → verify persistence
3. Verify the "day" column shows compact timeframe badges
4. Open advanced filters → verify timeframe filter dropdown works
5. Filter by H4 → verify only trades with H4 analysis or entry timeframe are shown
6. Clear filters → verify timeframe resets
7. Test on mobile cards view
