# Web Progress — معامله‌یار

## Tech Stack
- **Framework:** Next.js 16 (App Router, `use client`)
- **Styling:** Vanilla SCSS (`trades.scss`, `select.scss`, `globals.scss`, `variables.scss`) — no Chakra UI, no Tailwind
- **Font:** Vazirmatn — self-hosted (Google Fonts is blocked in Iran), loaded via `/fonts/vazirmatn.css`
- **Icons:** Material Symbols Outlined (Google CDN — not blocked)
- **Layout:** Full RTL (`dir="rtl"`, `lang="fa"`)
- **⚠️ Dep cleanup needed:** `@chakra-ui/react`, `@emotion/react`, `@emotion/styled` are still in `package.json` but unused — can be removed

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
- Fetches trades from `GET /api/trades?limit=200&offset=0` (via `NEXT_PUBLIC_API_BASE_URL` or `http://127.0.0.1:3000`)
- Falls back to rich mock data (8 sample trades) if API is unreachable or returns 0 records
- Maps API response fields to frontend `Trade` interface (calculates pips, rMultiple if missing)
- Fetches live USD→Toman exchange rate from `/api/exchange-rate` on mount (default fallback: 90,000)
- Passes `initialUsdToToman` and all CRUD callbacks down to `TradesTable`

#### API Integration in `page.tsx`
| Callback | API call |
|----------|----------|
| `onRefresh` | Re-fetches `GET /api/trades` |
| `onUpdateTrade` | `PUT /api/trades/:ticket` — sends `notes`, `emotion`, `stopLoss`, `takeProfit`, `tags` |
| `onDeleteTrade` | `DELETE /api/trades/:ticket` |
| `onImportMT4` | Alert placeholder (not yet implemented) |
| `onAddManualTrade` | Alert placeholder (not yet implemented) |

### Exchange Rate API Route (`src/app/api/exchange-rate/route.ts`)
- Next.js Route Handler: `GET /api/exchange-rate`
- Fetches USD→Toman open-market rate from Navasan API (`api.navasan.tech`)
- Cached for 6 hours (`revalidate = 21600`) — stays within 120 req/month free quota
- Requires `NAVASAN_API_KEY` env var; falls back to 90,000 Toman/USD if missing or on error
- Response: `{ usdToToman: number, source: 'navasan' | 'fallback', cachedAt: string }`

### TradesTable Component (`src/components/TradesTable.tsx`)
Full-featured trades workspace split into:

**Left/Main area:**
- Page header with "واردات MT4" and "ثبت معامله دستی" buttons
- Filter bar: date search, symbol dropdown, direction dropdown, strategy dropdown, clear + refresh buttons
- Summary bar: trade count, win rate, total P&L in USD + Toman equivalent (filtered)
- Paginated data table (10 rows/page) with: date, day-of-week badge, symbol, direction badge (buy/sell), lot size, R-multiple, P&L (color-coded) with Toman sub-value, strategy badge, open/closed status icon
- Pagination controls with Persian numerals

**Right/Detail panel (slide-out aside):**
- Triggered by clicking any table row
- Shows: symbol + direction header, P&L financial box (profit/loss colored + Toman), execution details grid (entry time/price, SL, TP, exit time/price)
- **Strategy selector** — text input (local-only, `setupName` is **not** sent to API — strategy entity was removed from backend)
- **Trade tags** — all known tags shown as clickable chips; selected = green highlight; add custom tag via input (Enter or button); tag pool is additive-only (never shrinks on deselect)
- **Emotion tags** — all 5 emotions always shown as chips (با اطمینان, آرام/خنثی, مضطرب, FOMO, انتقام); click to select/deselect
- **Journal notes** — free-text textarea
- Save and Delete buttons in sticky footer

**State & Logic:**
- `allTags` is a `useState` seeded from all trade tag arrays on load — additive only, never shrinks when a tag is deselected from a trade
- `updateActiveTradeField` — local optimistic updates; recalculates `rMultiple` live when `stopLoss` changes
- `formatDate` — Gregorian ISO → Persian display string (e.g. `۱۴۰۵/۰۳/۲۵ - ۱۳:۳۰`) + day-of-week name
- Persian digits throughout (`toPersianDigits`, `formatPersianCurrency`, `formatToman`)

### Select Component (`src/components/Select.tsx` + `select.scss`)
- Custom accessible dropdown (`role="combobox"` + `role="listbox"`)
- Full keyboard navigation: Arrow keys, Enter/Space to select, Escape to close, Tab to dismiss
- Stable-width trigger (invisible sizer prevents reflow on selection change)
- Close on outside click
- Scroll focused item into view
- Used by TradesTable for filter dropdowns

### Stylesheet (`src/components/trades.scss`)
- ~1280 lines, fully custom SCSS
- Custom scrollbar, slide-in animation (detail panel)
- **Active trade styling** — open trades (`closeTime === null`) get:
  - `.open-row`: subtle pulsing background + glowing right-border indicator
  - `.status-open`: green `sync` icon with `pulse-glow` animation and drop-shadow
  - `.profit-open`: amber color (#f59e0b) for unrealized P&L with pulsing dot indicator
  - 4 custom `@keyframes`: `pulse`, `pulse-glow`, `row-pulse`, `border-glow`
- Responsive RTL layout, glassmorphism panel header
- Custom checkbox styling

### Utilities (`src/utils/farsi.ts`)
- `toPersianDigits(val)` — converts ASCII digits to Persian (۰-۹)
- `formatPersianNumber(val, decimals?)` — formats with thousand separators + Persian digits
- `formatPersianCurrency(val)` — formats USD P&L with sign prefix (`+$۳۷۵.۰۰`)
- `formatToman(usd, usdToToman)` — converts USD to Tomans with abbreviated display (میلیون / هزار / ت)

---

## ❌ Not Done (Next Steps)

### High Priority
- **Persistent tag library** — tags currently derived from trade records only; a user-level tag pool (API-backed) is needed so custom tags survive removal from all trades, and sync across devices
- **Manual trade entry** — `onAddManualTrade` is a placeholder alert; needs a form/modal
- **MT4/MT5 file import** — `onImportMT4` is a placeholder; needs file picker + multipart upload to API
- **Strategy/setup persistence** — `setupName` exists in the UI as a text input but is not sent to API (backend `Setup` model was removed). Needs a decision: re-add as a model, use tags, or store as a string field on Trade

### Medium Priority
- Dashboard page (equity curve, calendar heatmap, emotion stats)
- Analytics page (win rate by symbol/strategy/emotion, drawdown, expectancy)
- Jalali (Shamsi) calendar date picker for the filter bar
- Sorting: clicking table column headers should sort the data
- Multi-select row actions (bulk delete)
- Auth pages (Login, Register) — currently no auth at all
- Error/success toast notifications instead of `alert()`
- Remove unused Chakra UI / Emotion dependencies from `package.json`

### Low Priority
- Responsive / mobile layout
- Settings page (account info, broker connection)
- i18n abstraction (currently hardcoded Persian strings throughout)
- Dark/light theme toggle
