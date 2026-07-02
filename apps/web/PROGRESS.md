# Web Progress — TradeKav (تریدکاو)

## Tech Stack
- **Framework:** Next.js 16 (App Router, `use client`)
- **Styling:** Vanilla SCSS (`trades.scss`, `sidenav.scss`, `journal.scss`, etc.) — no Chakra UI, no Tailwind
- **Font:** Vazirmatn — self-hosted (Google Fonts is blocked in Iran), loaded via `/fonts/vazirmatn.css`
- **Icons:** Material Symbols Outlined (Google CDN — not blocked)
- **State:** Zustand (`useAuthStore`, `useAppStore`, `useTradeStore`, `useNotificationStore`)
- **Charts:** TradingView `lightweight-charts`
- **HTTP:** Axios with interceptors (`src/lib/api.ts`) — auto-attaches Bearer token, auto-refreshes on 401
- **Layout:** Full RTL (`dir="rtl"`, `lang="fa"`)
- **Push notifications:** Kavenegar Webpush SDK (injected in `layout.tsx`)
- **SEO:** `sitemap.ts`, `robots.ts`, full OpenGraph + Twitter cards, JSON-LD schema, Google Search Console verification

---

## ✅ Done

### App Layout (`src/app/layout.tsx`)
- RTL root layout with Persian `lang="fa"` attribute
- Vazirmatn self-hosted font preloaded
- Material Symbols CDN link
- Kavenegar Webpush SDK (`<script defer>`)
- Full SEO metadata: title, description, keywords, OpenGraph, Twitter card, JSON-LD `SoftwareApplication` schema
- Google Search Console verification tag
- `<AppLayout>` wraps all children (sidebar + routing)

### Design System (`src/app/variables.scss`, `src/app/globals.scss`)
- Full SCSS variable token set: `$surface`, `$primary`, `$error`, `$on-surface`, `$outline-variant`, etc.
- Dark theme throughout
- Shared across all component stylesheets via `@use '../app/variables' as *`

### Authentication (`src/lib/auth.ts`, `src/app/(auth)/`)
- `useAuthStore` (Zustand) with full lifecycle: `login`, `register`, `logout`, `refresh`, `initialize`
- **OTP flow:** `sendOtp(phone)` → `verifyOtp(phone, code)` → `registerOtp(registerToken, name, email, password)`
- Token: access token in memory, refresh token in HttpOnly cookie
- Auto-refresh via `useAuthStore.initialize()` on app mount
- Login page: `src/app/(auth)/login/page.tsx`
- Register page: `src/app/(auth)/register/page.tsx`
- Shared auth styles: `src/app/(auth)/auth.scss`

### HTTP Client (`src/lib/api.ts`)
- Axios instance with base URL from `NEXT_PUBLIC_API_BASE_URL`
- Request interceptor: attaches `Authorization: Bearer <accessToken>`
- Response interceptor: on 401, calls `useAuthStore.refresh()` and retries original request once

### Zustand Stores (`src/store/`)
- `useAuthStore` — lives in `src/lib/auth.ts` (Zustand store for auth state)
- `useAppStore` — accounts list, selected account, `usdToToman` rate, timezone, modal open states, active trade ID
- `useTradeStore` — trade list, pagination, loading state, CRUD operations
- `useNotificationStore` — toast queue (type, message, auto-dismiss)

### Notification System (`src/components/ui/Toaster.tsx`)
- `<Toaster>` component rendering stacked toasts
- `useNotificationStore` with `notify.ts` helper: `notifySuccess()`, `notifyError()`, `notifyInfo()`
- Styled via `toaster.scss`

### Trades Page (`src/app/trades/page.tsx`)
- Fetches trades from `GET /api/trades` (paginated)
- Falls back to rich mock data if API is unreachable
- Live USD→Toman exchange rate from `/api/exchange-rate` (Navasan, 6h cache)
- All CRUD callbacks: `onRefresh`, `onUpdateTrade`, `onDeleteTrade`, `onDeleteMultipleTrades`, `onImportMT4`, `onAddManualTrade`

### Exchange Rate API Route (`src/app/api/exchange-rate/route.ts`)
- Next.js Route Handler: `GET /api/exchange-rate`
- Fetches USD→Toman open-market rate from Navasan API
- Cached 6 hours (`revalidate = 21600`) — fits 120 req/month free quota
- Falls back to 90,000 Toman/USD if `NAVASAN_API_KEY` is missing or on error

### TradesTable Component (`src/components/trades/TradesTable.tsx`)
Full-featured trades workspace:
- **FilterBar** — search, symbol group dropdown, direction dropdown, status tabs, account switcher, date filter badge from calendar
- **SummaryBar** — trade count, win rate, total P&L (USD + Toman), filtered
- **Desktop:** paginated table (10 rows/page), date, session badge, symbol, direction, lot, R-multiple, P&L with Toman sub-value
- **Mobile:** infinite scroll card list via `IntersectionObserver`
- **Detail Panel (slide-out aside):** P&L box, execution grid, account selector, trade tags, emotion tags, journal notes, screenshot upload/delete

### Trade Sub-components (`src/components/trades/`)
- `DesktopTable.tsx` — paginated desktop table
- `MobileCardsList.tsx` — infinite scroll mobile cards
- `DetailPanel.tsx` — slide-out right panel with all trade editing
- `FilterBar.tsx` — search + dropdowns + tabs
- `SummaryBar.tsx` — aggregated stats row
- `TradeChart.tsx` — per-trade TradingView candlestick chart

### Modals (`src/components/modals/`)
- `ManualTradeModal.tsx` — full form: ticket, symbol, direction, open/close price/time, lot, SL, TP, profit, commission, swap, emotion, tags, notes. Submits to `POST /api/trades`
- `ImportMT4Modal.tsx` — drag-and-drop or file pick for HTML/CSV statements. Uploads to `POST /api/trades/import-mt4`. Shows parsed stats (found, imported, skipped)

### Tag Library System
- Database-backed `Tag` model (`@@unique([user_id, name])`) with `is_ignored` and `show_first` flags
- API: `GET /api/trades/tags`, `POST /api/trades/tags`, `DELETE /api/trades/tags/:name`, `PATCH /api/trades/tags/:name`
- Ignore-from-stats tags (`فرصت از دست رفته`, `Missed`, `ignore`, `Ignore`, `نادیده گرفتن`) exclude trades from all dashboard metrics, calendar P&L, equity curve

### Select Component (`src/components/ui/Select.tsx`)
- Custom accessible dropdown (`role="combobox"` + `role="listbox"`)
- Full keyboard navigation: Arrow keys, Enter/Space, Escape, Tab
- Stable-width trigger, close on outside click, scroll focused item into view

### Journal Components (`src/components/journal/`)
- `TradingCalendar.tsx` — Jalali calendar with month/year nav, daily trade frequency + P&L overlay, multi-date selection, floating action banner
- `EquityChart.tsx` — TradingView lightweight-charts equity curve (zoom, pan, Persian crosshairs, custom tooltips)
- `WeekdayPnlChart.tsx` — custom SVG bar chart, Saturday→Friday, responsive, single-char abbreviations on mobile
- `JournalEditor.tsx` — free-text journal entry editor for a selected date

### Dashboard Page (`src/app/dashboard/page.tsx`)
- Net P&L (USD + Toman), Win Rate gauge + Buy/Sell breakdown
- Profit Factor, Expectancy, R-multiple (Planned vs Achieved), Max Drawdown, Loss Streaks
- Session breakdown (NY, London, Tokyo), Emotion impact, Symbol win rates, Strategy tags, Weekday performance, 24h Tehran heatmap

### Analytics Page (`src/app/analytics/page.tsx`)
- Deep statistics: risk/reward analysis, equity curve, session breakdown, symbol performance

### Journal Page (`src/app/journal/page.tsx`)
- `TradingCalendar` + `JournalEditor` + `EquityChart` + `WeekdayPnlChart` integrated
- Jalali month navigation with Gregorian↔Jalali conversion via browser `Intl`

### Settings Page (`src/app/settings/page.tsx`)
- Full settings UI: profile info, avatar, accounts management, broker connection, tag library, emotion library, password change, display currency, subscription status

### Admin Page (`src/app/admin/page.tsx`)
- User management, subscription management, manual receipt review, coupon/discount codes, system stats

### Payments Page (`src/app/payments/`)
- Subscription plan selection (FREE, STANDARD, PRO)
- ZarinPal + PayPing gateway integration
- Manual receipt upload flow
- Callback handler: `src/app/payments/callback/`

### Landing Page (`src/app/page.tsx`)
- Full marketing landing page (~35KB, extensive sections)
- `landing.scss` (~32KB) for dedicated landing styles
- Links to `/help/ea-setup`, `/login`, `/register`

### Namad Page (`src/app/namad/page.tsx`)
- Iranian e-trust badge display page (namad-e-etemad)

### Help Page (`src/app/help/ea-setup/`)
- EA installation guide page

### Contact Page (`src/app/contact/`)
- Contact form page

### SEO (`src/app/sitemap.ts`, `src/app/robots.ts`)
- XML sitemap with all public routes
- robots.txt with proper crawl directives

### Utilities
- `src/utils/farsi.ts` — `toPersianDigits()`, `formatPersianNumber()`, `formatPersianCurrency()`, `formatToman()`
- `src/utils/tradeHelpers.ts` — `formatDate()` (Gregorian→Persian), `getTradingSession()`, `getMainPair()`, `getSymbolFilterOptions()`
- `src/lib/notify.ts` — `notifySuccess()`, `notifyError()`, `notifyInfo()` wrappers

### Layout Components (`src/components/layout/`)
- `AppLayout.tsx` — root layout shell (sidebar + content area)
- `SideNavBar.tsx` — desktop sidebar with plan badge
- `BottomNavBar.tsx` — mobile bottom tab bar

---

## ❌ Not Done (Next Steps)

### High Priority
- **Jalali date picker** for the filter bar (currently only free-text / calendar navigation)
- **Column sorting** — clicking table headers should sort the trade list

### Medium Priority
- **`setupName` / Strategy field** — `Setup` model was fully removed. Decision: use tags (simplest, already works), or add a `setup_name: String?` field on `Trade`
- **Error/success feedback** — some flows still use `alert()` instead of the `Toaster` system
- **Remove stale deps** — `@chakra-ui/react`, `@emotion/react`, `@emotion/styled` may still be listed in `package.json` but are unused

### Low Priority
- Dark/light theme toggle
- i18n abstraction (Persian strings are currently hardcoded throughout)
- `GET /api/trades/:id` — single trade detail endpoint missing on backend
