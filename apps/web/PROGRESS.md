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
| `onUpdateTrade` | `PUT /api/trades/:id` — sends `notes`, `emotion`, `stopLoss`, `takeProfit`, `tags` |
| `onDeleteTrade` | `DELETE /api/trades/:id` |
| `onDeleteMultipleTrades` | `POST /api/trades/bulk-delete` — bulk delete multiple trades |
| `onImportMT4` | Triggers file upload and import modal |
| `onAddManualTrade` | Opens manual trade creator modal |

### Exchange Rate API Route (`src/app/api/exchange-rate/route.ts`)
- Next.js Route Handler: `GET /api/exchange-rate`
- Fetches USD→Toman open-market rate from Navasan API (`api.navasan.tech`)
- Cached for 6 hours (`revalidate = 21600`) — stays within 120 req/month free quota
- Requires `NAVASAN_API_KEY` env var; falls back to 90,000 Toman/USD if missing or on error
- Response: `{ usdToToman: number, source: 'navasan' | 'fallback', cachedAt: string }`

### Manual Trade Entry Modal (`src/components/ManualTradeModal.tsx`)
- Form-based creation dialog including input fields for ticket, symbol, direction, open/close details (price/time), lot size, SL, TP, profit, commission, swap, emotion, tags, and notes.
- Submits directly to the backend API via `POST /api/trades`.

### Import MT4/MT5 statement Modal (`src/components/ImportMT4Modal.tsx`)
- Drag-and-drop or file pick area for HTML or CSV statements.
- Performs multipart uploads to the backend server endpoint `POST /api/trades/import-mt4` and handles parsing statistics (found, imported, skipped).

### TradesTable Component (`src/components/TradesTable.tsx`)
Full-featured trades workspace split into:

**Left/Main area:**
- Page header with "واردات MT4/MT5" and "ثبت معامله دستی" action buttons.
- Filter bar: search, symbol group dropdown, direction dropdown, status tabs (All, Open, Closed, Missed), refresh buttons, and toggleable account switcher.
- Summary bar: trade count, win rate, total P&L in USD + Toman equivalent (filtered).
- Desktop view: Paginated data table (10 rows/page) with date, day session badge, symbol, direction badge (buy/sell), lot size, R-multiple, P&L (color-coded) with Toman sub-value, open/closed status icon.
- Mobile view: Infinite scroll card list layout displaying crucial transaction parameters.
- Reusable Modal Confirm alerts for warning dialogs.

**Right/Detail panel (slide-out aside drawer):**
- Triggered by clicking any table row or mobile card.
- Shows: symbol + direction header, P&L financial box (profit/loss colored + Toman), execution details grid (entry time/price, SL, TP, exit time/price, account selector dropdown).
- **Trade tags** — selected = green highlight; add custom tag via input; tag pool is additive.
- **Emotion tags** — all 5 emotions always shown as chips; click to select/deselect.
- **Journal notes** — free-text textarea.
- Screenshot attachments view with drag-and-drop upload/delete directly connected to backend storage.

### Responsive Optimization & Infinite Scroll
- Implemented desktop header actions vs mobile Floating Action Button (FAB) Speed Dial speed dial menus.
- Mobile view uses an IntersectionObserver-based infinite scroll in `MobileCardsList.tsx` instead of page links; page selectors are dynamically hidden via SCSS under 768px.
- Polished emotion chips and card layout rendering on mobile layouts.

### Main and Sub-pair Grouping Filter
- Created `getMainPair` helper to extract the base prefix (e.g. `XAUUSD` from `XAUUSD_O`).
- Created `getSymbolFilterOptions` grouping unique items in the Filter Bar. Choosing a main pair automatically filters for all its children.

### Select Component (`src/components/Select.tsx` + `select.scss`)
- Custom accessible dropdown (`role="combobox"` + `role="listbox"`)
- Full keyboard navigation: Arrow keys, Enter/Space to select, Escape to close, Tab to dismiss
- Stable-width trigger (invisible sizer prevents reflow on selection change)
- Close on outside click
- Scroll focused item into view
- Used by TradesTable for filter dropdowns

### Utilities (`src/utils/farsi.ts`, `src/utils/tradeHelpers.ts`)
- `toPersianDigits(val)` — converts ASCII digits to Persian (۰-۹)
- `formatPersianNumber(val, decimals?)` — formats with thousand separators + Persian digits
- `formatPersianCurrency(val)` — formats USD P&L with sign prefix (`+$۳۷۵.۰۰`)
- `formatToman(usd, usdToToman)` — converts USD to Tomans with abbreviated display (میلیون / هزار / ت)
- `formatDate` — Gregorian ISO → Persian display string (e.g. `۱۴۰۵/۰۳/۲۵ - ۱۳:۳۰`) + day-of-week name
- `getTradingSession` — NY/London/Asian session parsing.

---

## ❌ Not Done (Next Steps)

### High Priority
- **Persistent tag library** — tags currently derived from trade records only; a user-level tag pool (API-backed) is needed so custom tags survive removal from all trades, and sync across devices
- **Strategy/setup persistence** — `setupName` exists in the UI as a text input but is not sent to API (backend `Setup` model was removed). Needs a decision: re-add as a model, use tags, or store as a string field on Trade

### Medium Priority
- Dashboard page (equity curve, calendar heatmap, emotion stats)
- Analytics page (win rate by symbol/strategy/emotion, drawdown, expectancy)
- Jalali (Shamsi) calendar date picker for the filter bar
- Sorting: clicking table column headers should sort the data
- Auth pages (Login, Register) — currently no auth at all
- Error/success toast notifications instead of `alert()`
- Remove unused Chakra UI / Emotion dependencies from `package.json`

### Low Priority
- Settings page (account info, broker connection)
- i18n abstraction (currently hardcoded Persian strings throughout)
- Dark/light theme toggle
