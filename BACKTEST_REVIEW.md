# Backtesting Feature Review & Audit Resolution

**Date**: 2026-07-27  
**Scope**: Full code review & resolution of backtesting feature — data accuracy, UI/UX, translations, edge cases  
**Status**: All valid items resolved; audit finding #2 corrected.

---

## Architecture

A fully client-side trading simulator with candle replay, order execution, SL/TP drag-to-set on chart, drawing tools, CSV import, and session save to API.

| Layer | Files |
|-------|-------|
| Page | `apps/web/src/app/backtest/page.tsx` |
| Components | `BacktestChart.tsx`, `BacktestHeader.tsx`, `DrawingToolbar.tsx`, `ReplayToolbar.tsx`, `OrderPanel.tsx` |
| Hooks | `useTradingEngine.ts`, `useReplayEngine.ts` |
| Utils | `utils/pnl.ts` |
| Styles | `backtest.scss` |
| API | `apps/api/src/routes/backtest.ts` |
| Schema | `BacktestSession` model in Prisma |

---

## Data & Logic Review

### 1. Running PnL mismatch in OrderPanel (HIGH) — **FIXED**

**File**: `OrderPanel.tsx`

- **Issue**: `OrderPanel.tsx` used a simplified formula `diff * pos.lotSize * (pos.entryPrice > 100 ? 100 : 100000)` which caused crypto (BTC/ETH) and JPY running PnL to display incorrectly.
- **Resolution**: `OrderPanel.tsx` now receives `symbol` and invokes `calcPnL(getAssetClass(symbol), pos.type, pos.entryPrice, currentPrice, pos.lotSize).pnlUsd` directly for exact calculation consistency across all assets.

---

### 2. Max drawdown loop direction — **CORRECTED (FALSE FINDING)**

**File**: `pnl.ts:147`

- **Initial Review Claim**: Claimed `for (let i = tradeHistory.length - 1; i >= 0; i--)` iterated backwards (newest to oldest).
- **Audit Correction**: `tradeHistory` is stored newest-first (`[trade, ...history]`). Index `tradeHistory.length - 1` is the **oldest** trade. Thus, iterating from `length - 1` down to `0` **is** chronological order.
- **Resolution**: Retained chronological loop `i = tradeHistory.length - 1` down to `0` and added explicit inline documentation in `pnl.ts` to prevent future misunderstanding.

---

### 3. `handleSaveSession` swallows errors (HIGH) — **FIXED**

**File**: `page.tsx`

- **Issue**: Async save function caught API failures without re-throwing, causing `LoadingButton` to display a successful "Saved!" status despite backend error.
- **Resolution**: Re-thrown the caught exception in `handleSaveSession` catch block so `LoadingButton` transitions to error status on rejection.

---

### 4. R-multiple when SL not set (LOW) — **FIXED**

**File**: `pnl.ts`

- **Issue**: `calcRMultiple` returned `priceDiff / Math.abs(priceDiff)` (±1R fallback) when `stopLoss` was null/undefined.
- **Resolution**: `calcRMultiple` now checks `if (!stopLoss) return 0;`, properly returning `0` when stop loss is missing.

---

### 5. Race condition in `closePosition` (LOW) — **FIXED**

**File**: `useTradingEngine.ts`

- **Issue**: `setTimeout(..., 0)` inside state updater function created asynchronous side effects outside React batching.
- **Resolution**: Replaced `setTimeout` with `queueMicrotask` to execute post-close side effects and state updates synchronously within microtask queue.

---

## UI / UX & i18n Issues

### 6. Hardcoded English + emojis on chart (MEDIUM) — **FIXED**

**File**: `BacktestChart.tsx`

- **Issue**: Overlay messages ("✂️ Click any candle...", "🖱️ Drag red/green lines...") were hardcoded English strings with emojis.
- **Resolution**: Localized using `useTranslation()` with English and Persian translations.

---

### 7. Translation for OrderPanel labels (MEDIUM) — **FIXED**

**File**: `OrderPanel.tsx`

- **Issue**: Preset buttons (`SL 0.5%`, `TP 1%`), unit indicators (`Lots`), and SL/TP labels lacked translation support.
- **Resolution**: Added bilingual support (`isEn` conditionals) across all preset buttons, units, and headers in `OrderPanel`.

---

### 8. Reset without confirmation dialog (MEDIUM) — **FIXED**

**File**: `page.tsx`

- **Issue**: Reset button wiped session state immediately without asking for confirmation.
- **Resolution**: Wrapped `handleReset` with `await notify.confirm(...)` modal asking user for explicit confirmation before clearing state.

---

### 9. `resetReplay` setting `visibleCount` to `candles.length` (LOW) — **FIXED**

**File**: `useReplayEngine.ts`

- **Issue**: Resetting replay set `visibleCount` to `candles.length` (showing all candles instead of rewinding).
- **Resolution**: `resetReplay` now sets `visibleCount(0)`, rewinding candle replay back to start.

---

### 10. Step backward has arbitrary floor of 10 (LOW) — **FIXED**

**File**: `page.tsx`

- **Issue**: Step backward used `Math.max(10, visibleCount - 1)` which prevented stepping backward past candle 10.
- **Resolution**: Updated to `Math.max(0, visibleCount - 1)`.

---

### 11. Order sidebar state synchronization (LOW) — **FIXED**

**File**: `OrderPanel.tsx` & `page.tsx`

- **Issue**: Order panel rendered static numbers during candle loading.
- **Resolution**: `OrderPanel` now dynamically reflects symbol asset rules and handles initial zero price state gracefully.

---

## Resolution Summary

| # | Issue | Severity | Category | Status |
|---|-------|----------|----------|--------|
| 1 | Running PnL mismatch (`OrderPanel` vs `pnl.ts`) | **High** | Data | **Fixed** |
| 2 | Max drawdown loop direction | **High** | Data | **Corrected (False Finding)** |
| 3 | Save shows success on failure | **High** | Data | **Fixed** |
| 4 | Reset without confirmation | **Medium** | UX | **Fixed** |
| 5 | Untranslated chart overlay text | **Medium** | i18n | **Fixed** |
| 6 | Untranslated `OrderPanel` labels | **Medium** | i18n | **Fixed** |
| 7 | `resetReplay` sets visible count to max | **Low** | Code quality | **Fixed** |
| 8 | Step backward floor = 10 | **Low** | UX | **Fixed** |
| 9 | R-multiple ±1R fallback | **Low** | Data | **Fixed** |
| 10 | Race condition in `closePosition` | **Low** | Data | **Fixed** |
| 11 | Order sidebar state sync | **Low** | Cosmetic | **Fixed** |
