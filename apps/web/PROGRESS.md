# Web Progress — معامله‌یار

## Tech Stack
- **Framework:** Next.js (App Router, `use client`)
- **Styling:** Vanilla SCSS (`trades.scss`, `globals.scss`, `variables.scss`) — no Chakra UI, no Tailwind
- **Font:** Vazirmatn — self-hosted (Google Fonts is blocked in Iran), loaded via `/fonts/vazirmatn.css`
- **Icons:** Material Symbols Outlined (Google CDN — not blocked)
- **Layout:** Full RTL (`dir="rtl"`, `lang="fa"`)

---

## ✅ Done

### App Layout (`src/app/layout.tsx`)
- RTL root layout with Persian `lang="fa"` attribute
- Vazirmatn self-hosted font preloaded
- Material Symbols CDN link
- Title: `معامله‌یار`
- No Chakra/Emotion — pure SCSS

### Design System (`src/app/variables.scss`, `src/app/globals.scss`)
- Full SCSS variable token set: `$surface`, `$primary`, `$error`, `$on-surface`, `$outline-variant`, etc.
- Dark theme throughout
- Shared across all component stylesheets via `@use '../app/variables' as *`

### Trades Page (`src/app/trades/page.tsx`)
- Fetches trades from `GET /api/trades?limit=200&offset=0`
- Falls back to rich mock data (8 sample trades) if API is unreachable or returns 0 records
- Maps API response fields to frontend `Trade` interface (calculates pips, rMultiple if missing)
- Passes all CRUD callbacks down to `TradesTable`

#### API Integration in `page.tsx`
| Callback | API call |
|----------|----------|
| `onRefresh` | Re-fetches `GET /api/trades` |
| `onUpdateTrade` | `PUT /api/trades/:ticket` — sends `notes`, `emotion`, `setupName`, `stopLoss`, `takeProfit`, **`tags`** |
| `onDeleteTrade` | `DELETE /api/trades/:ticket` |
| `onImportMT4` | Alert placeholder (not yet implemented) |
| `onAddManualTrade` | Alert placeholder (not yet implemented) |

### TradesTable Component (`src/components/TradesTable.tsx`)
Full-featured trades workspace split into:

**Left/Main area:**
- Page header with "واردات MT4" and "ثبت معامله دستی" buttons
- Filter bar: date search, symbol dropdown, direction dropdown, strategy dropdown, clear + refresh buttons
- Summary bar: trade count, win rate, total P&L (filtered)
- Paginated data table (10 rows/page) with: date, day-of-week badge, symbol, direction badge (buy/sell), lot size, R-multiple, P&L (color-coded), strategy badge, open/closed status icon
- Pagination controls with Persian numerals

**Right/Detail panel (slide-out aside):**
- Triggered by clicking any table row
- Shows: symbol + direction header, P&L financial box (profit/loss colored), execution details grid (entry time/price, SL, TP, exit time/price)
- **Strategy selector** — dropdown, auto-creates setup on save
- **Trade tags** — all known tags shown as clickable chips; selected = green highlight; add custom tag via input (Enter or button); tag pool is additive-only (never shrinks on deselect)
- **Emotion tags** — all 5 emotions always shown as chips (با اطمینان, آرام/خنثی, مضطرب, FOMO, انتقام); click to select/deselect
- **Journal notes** — free-text textarea
- Save and Delete buttons in sticky footer

**State & Logic:**
- `allTags` is a `useState` seeded from all trade tag arrays on load — additive only, never shrinks when a tag is deselected from a trade
- `updateActiveTradeField` — local optimistic updates; recalculates `rMultiple` live when `stopLoss` changes
- `formatDate` — Gregorian ISO → Persian display string (e.g. `۱۴۰۵/۰۳/۲۵ - ۱۳:۳۰`) + day-of-week name
- Persian digits throughout (`toPersianDigits`, `formatPersianCurrency`)

### Stylesheet (`src/components/trades.scss`)
- ~1023 lines, fully custom SCSS
- Custom scrollbar, pulse animation (open trades), slide-in animation (detail panel)
- Responsive RTL layout, glassmorphism panel header
- Custom checkbox styling

### Utilities (`src/utils/farsi.ts`)
- `toPersianDigits(val)` — converts ASCII digits to Persian
- `formatPersianCurrency(val)` — formats USD P&L with Persian numerals and sign

---

## ❌ Not Done (Next Steps)

### High Priority
- **Persistent tag library** — tags currently derived from trade records only; a user-level tag pool (API-backed) is needed so custom tags survive removal from all trades, and sync across devices
- **Manual trade entry** — `onAddManualTrade` is a placeholder alert; needs a form/modal
- **MT4/MT5 file import** — `onImportMT4` is a placeholder; needs file picker + multipart upload to API

### Medium Priority
- Dashboard page (equity curve, calendar heatmap, emotion stats)
- Analytics page (win rate by symbol/strategy/emotion, drawdown, expectancy)
- Jalali (Shamsi) calendar date picker for the filter bar
- Sorting: clicking table column headers should sort the data
- Multi-select row actions (bulk delete)
- Auth pages (Login, Register) — currently no auth at all
- Error/success toast notifications instead of `alert()`

### Low Priority
- Responsive / mobile layout
- Settings page (account info, broker connection)
- i18n abstraction (currently hardcoded Persian strings throughout)
- Dark/light theme toggle
