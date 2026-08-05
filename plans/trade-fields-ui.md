# Trade Fields UI Plan — Surfacing Unused Data

## Context

The latest Prisma schema additions introduced several fields and models that are stored in the database and accepted by the API, but are **never rendered or managed in the UI**. This document outlines a plan to surface them.

---

## Inventory of Unused Fields

### Annotation Fields (in `TradeAnnotation`)

| Field | Type | Description |
|-------|------|-------------|
| `htfBias` | `Direction` (BUY/SELL) | Higher timeframe directional bias |
| `session` | `TradingSession` (ASIA/LONDON/NEW_YORK/OVERLAP) | Session the trade was taken in |
| `thesis` | `String?` | The trade thesis / reasoning |
| `expectation` | `String?` | What the trader expected to happen |
| `lesson` | `String?` | Post-trade lesson learned |
| `conviction` | `Int?` (1-5) | Conviction level at entry |

### Models (new in recent commits)

| Model | Description | UI Status |
|-------|-------------|-----------|
| `TradeTrigger` | Trigger concepts linked to a trade | Selectable in DetailPanel, never displayed elsewhere |
| `TradeConfluence` | Confluence concepts linked to a trade | Selectable in DetailPanel, never displayed elsewhere |
| `TradePlan` | Pre-trade plan (risk, R:R, conditions, invalidation, target, hold time, followed) | Fully dead in UI |

---

## 1. DetailPanel — Journal Tab Restructure

The journal tab currently has: Concepts → Emotions → Notes → Screenshots.

### Proposed new structure (top to bottom)

```
┌─────────────────────────────────────────────────────┐
│  📋 Pre-Trade Plan                                   │
│  ┌─────────────────────────────────────────────┐     │
│  │ Max Risk ($)  │ Expected R:R               │     │
│  │ Entry Condition (text input)                │     │
│  │ Invalidation (text input)                   │     │
│  │ Target Zone (text input)                    │     │
│  │ Expected Hold Time (text input)             │     │
│  │ Plan Followed? [Yes / No / N/A toggle]     │     │
│  └─────────────────────────────────────────────┘     │
│                                                      │
│  🎯 Setup / Trigger / Confluence                     │
│  (existing tag selectors — no change needed)         │
│                                                      │
│  🧭 HTF Bias & Session                               │
│  ┌─────────────────────────────────────────────┐     │
│  │ Bias: [BUY ▾]  │ Session: [ASIA ▾]         │     │
│  └─────────────────────────────────────────────┘     │
│                                                      │
│  💭 Emotion & Conviction                             │
│  (existing emotion tags + conviction 1-5 dots)      │
│                                                      │
│  📝 Trade Thesis                                     │
│  [textarea: "Why I took this trade"]                │
│                                                      │
│  🔮 Expectation                                     │
│  [textarea: "What I expected to happen"]            │
│                                                      │
│  📝 Notes                                           │
│  [textarea — existing, unchanged]                   │
│                                                      │
│  🎓 Lesson Learned                                  │
│  [textarea: "What I learned from this trade"]       │
│                                                      │
│  📸 Screenshots                                      │
│  (upload grid — existing, unchanged)                │
└─────────────────────────────────────────────────────┘
```

### Design decisions

- **Plan section** uses a compact 2-column grid (matches the execution details grid style already in the Stats tab)
- **HTF Bias + Session** share a single row — small inline selectors, not a full section
- **Conviction** renders as 5 clickable dots/circles next to the emotion label
- **Thesis, Expectation, Lesson** get labeled textareas (smaller than the main notes textarea)
- **Plan Followed** is a simple toggle at the bottom of the plan section
- All new fields are optional / nullable — no required validation changes

---

## 2. DesktopTable — Column Enhancements

### Changes

| Column | Change | Details |
|--------|--------|---------|
| Session badge (col 3) | **Replace** computed session with `annotation.session` if set, fall back to computed | The session badge already exists — just use the stored value when available |
| Symbol column (col 4) | **Add trigger pills** alongside setup pills | Trigger pills use a different accent color (green border) from setup pills (blue) |
| Symbol column (col 4) | **Add confluence dot** | Small colored dot indicator if confluences exist |

No new columns needed — the table is already wide enough.

---

## 3. MobileCardsList — Card Enhancements

In the tags row (bottom of card), add:

- **Trigger pills** (different border color from setups)
- **Session badge** (replace computed session with `annotation.session` if set)
- **Confluence indicator** — small dot/badge if confluences exist

---

## 4. Analytics Page — New Breakdowns

### Patterns Tab additions

| New Section | Data Source | What it shows |
|-------------|-------------|---------------|
| **HTF Bias Accuracy** | `annotation.htfBias` + `direction` | Win rate when HTF bias matched trade direction vs. opposite |
| **Session Performance** (enhance) | `annotation.session` (use stored value, not computed) | Per-session stats — win rate, P&L, trade count |
| **Plan Adherence** | `plan.planFollowed` | Win rate & P&L for plan-followed vs. not-followed trades |
| **Conviction Impact** | `annotation.conviction` | Per conviction level (1-5) stats — win rate, avg P&L |

### Overview Tab additions

| New Metric | Data Source |
|------------|-------------|
| **R:R Planned vs Achieved** | `plan.expectedRr` vs actual `rMultiple` |

---

## 5. No Changes Needed

- **API/backend** — all fields already accepted and stored correctly
- **Store (`useTradeStore`)** — already maps all fields correctly (both fetch and update)
- **Validators** — already validates all fields
- **Settings** — TradingConcepts CRUD management is complete
- **Trade export** — `tradeExport.ts` already includes `lesson` in search

---

## Implementation Order

1. **DetailPanel Journal Tab** — highest impact, most visible change
2. **DesktopTable + MobileCardsList** — quick wins for visibility
3. **Analytics Page** — pattern recognition features

---

## Files to Modify

| File | Changes |
|------|---------|
| `apps/web/src/components/trades/DetailPanel.tsx` | Add plan section, HTF/session row, thesis/expectation/lesson textareas, conviction dots, plan-followed toggle |
| `apps/web/src/components/trades/TradesTable.tsx` | Update `ANNOTATION_FIELDS` set, update `updateActiveTradeField` type |
| `apps/web/src/components/trades/DesktopTable.tsx` | Add trigger pills, confluence dot, use annotation.session |
| `apps/web/src/components/trades/MobileCardsList.tsx` | Add trigger pills, session badge, confluence indicator |
| `apps/web/src/app/analytics/page.tsx` | Add HTF bias accuracy, conviction impact, plan adherence sections |
| `apps/web/src/types/trade.ts` | No changes needed (already has all fields defined) |