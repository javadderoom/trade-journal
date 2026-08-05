# Migration Plan — Structured Trade Rationale (Schema + UI)

Consolidates every decision made across the design conversation into one
buildable plan. Hand this to Claude Code as-is.

---

## 1. Final schema

```prisma
// ─── Structured Rationale ───────────────────────────────────────────────────

model TradingConcept {
  id            String        @id @default(uuid())
  user_id       String
  user          User          @relation(fields: [user_id], references: [id], onDelete: Cascade)
  name          String
  allowed_roles ConceptRole[]
  color         String?
  icon          String?

  setups      TradeSetup[]
  triggers    TradeTrigger[]
  confluences TradeConfluence[]

  @@unique([user_id, name])
}

enum ConceptRole {
  SETUP
  TRIGGER
  CONFLUENCE
}

model TradeSetup {
  trade_id   String @id          // one setup per trade — enforced by @id, not app logic
  trade      Trade  @relation(fields: [trade_id], references: [id], onDelete: Cascade)
  concept_id String
  concept    TradingConcept @relation(fields: [concept_id], references: [id])
}

model TradeTrigger {
  id         String  @id @default(uuid())
  trade_id   String
  trade      Trade   @relation(fields: [trade_id], references: [id], onDelete: Cascade)
  concept_id String
  concept    TradingConcept @relation(fields: [concept_id], references: [id])
  is_primary Boolean @default(false)

  @@unique([trade_id, concept_id])
}

model TradeConfluence {
  trade_id   String
  trade      Trade   @relation(fields: [trade_id], references: [id], onDelete: Cascade)
  concept_id String
  concept    TradingConcept @relation(fields: [concept_id], references: [id])

  @@id([trade_id, concept_id])
}

model TradePlan {
  id                 String   @id @default(uuid())
  trade_id           String   @unique
  trade              Trade    @relation(fields: [trade_id], references: [id], onDelete: Cascade)
  max_risk           Float?
  expected_rr        Float?
  entry_condition    String?
  invalidation       String?
  target_zone        String?
  expected_hold_time String?
  plan_followed      Boolean?   // filled at review time, not entry
}

enum Timeframe {
  M1
  M5
  M15
  M30
  H1
  H4
  D1
  W1
  MN1
}

enum TradingSession {
  ASIA
  LONDON
  NEW_YORK
  OVERLAP
}

model TradeAnnotation {
  id                 String     @id @default(uuid())
  trade_id           String     @unique
  trade              Trade      @relation(fields: [trade_id], references: [id], onDelete: Cascade)

  // Market context — what existed before the trade
  analysis_timeframe Timeframe?
  entry_timeframe    Timeframe?
  htf_bias           Direction?
  session            TradingSession?

  // Thesis — one sentence, why this trade
  thesis             String?

  // Plan-time / review-time reflection
  expectation        String?    // filled before/at entry
  lesson             String?    // filled at review

  // Psychology
  conviction         Int?       // 1-5, self-rated at entry
  emotion            String?

  notes              String?
  screenshots        String[]   @default([])

  created_at         DateTime   @default(now())
  updated_at         DateTime   @updatedAt
}
```

On `Trade`, add:
```prisma
setups      TradeSetup[]
triggers    TradeTrigger[]
confluences TradeConfluence[]
plan        TradePlan?
```

On `User`, add:
```prisma
trading_concepts TradingConcept[]
```

### Migration steps, in order

1. **Data audit before the `Timeframe` enum conversion.** Check existing
   rows in `analysis_timeframe`/`entry_timeframe` for values that don't
   cleanly map to the enum (e.g. `"5m"` instead of `"M5"`). If any exist,
   write a normalization `UPDATE` pass before the Prisma migration runs —
   a straight type change fails if any row doesn't match an enum member
   exactly.
2. Run the Prisma migration for all new models/fields above.
3. Seed a small starter set of `TradingConcept` rows per new user signup
   (5-8 setup-role, 3-5 trigger-role, 3-5 confluence-role) — generic,
   methodology-agnostic naming, not ICT-specific.
4. **`MistakeIncident` reconciliation — explicitly deferred, not part of
   this migration.** Do not build a second, overlapping "rule broken"
   tagging system. Revisit as its own design task once this migration has
   shipped and been used for a few weeks.

---

## 2. UI architecture

The old single-width sidebar can't hold this much structured content. Move
to a two-tier model, same field grouping on every platform, different
presentation per platform.

| Tier | Contains | Desktop | Mobile |
|---|---|---|---|
| **Quick** | Market context, Thesis, Setup/Trigger/Confluence, Emotion & Conviction | Docked sidebar (current) | Bottom sheet / modal |
| **Deep** | Trade Plan, Expectation, Notes, Screenshots, Lesson, Plan Followed | Full page, two-column | Pushed screen, single column |

Quick tier is what gets filled in seconds, live or between trades — chips,
dropdowns, dots. Deep tier is what gets filled thoughtfully, typically
during end-of-day review — text, plan details, reflection. Same
components/logic power both platforms; only the wrapper differs (sheet vs.
sidebar, pushed screen vs. full page).

An **"expand" / "full review"** action moves a trade from quick tier to
deep tier on both platforms.

### Field order within each tier (narrative flow, not alphabetical/schema order)

**Quick tier:**
1. Market Context — analysis timeframe, entry timeframe, HTF bias, session (2x2 grid)
2. Thesis — single-line input, ~100-140 char cap, not a textarea
3. Setup / Trigger / Confluence — chip selectors (existing pattern)
4. Emotion & Conviction — emotion tags + 1-5 conviction dots

**Deep tier:**
5. Trade Plan — max risk, expected R:R, entry condition, invalidation, target zone, expected hold time (compact grid, matches Stats tab style)
6. Expectation — small textarea
7. Notes — existing, unchanged
8. Screenshots — existing, unchanged
9. Plan Followed — toggle, placed here (review-time), not in the Plan section (entry-time)
10. Lesson Learned — small textarea

### Mobile review-queue — confirmed: build swipe support

Deep-tier review is naturally a "go through today's trades one by one"
habit. Opening deep tier from one trade allows swiping to the next trade's
deep tier in sequence, staying within whatever filtered/sorted list the
user was viewing on the table/cards screen (not the full unfiltered trade
history — swiping should respect the current view's order and filters).

Include a position indicator ("trade 3 of 12") so the queue's scope and
progress are visible. Applies to the pushed mobile screen; the desktop
full page can offer the same next/previous affordance (e.g. arrow buttons
or keyboard shortcuts) for consistency, though swipe gesture itself is
mobile-specific.

---

## 3. Table / card view changes

- **Session badge**: use `annotation.session` when set, fall back to computed session from `open_time`.
- **Setup pill**: existing, unchanged.
- **Trigger pill**: add, visually distinct from setup pill (different accent, not just color — e.g. different border style — since both may appear adjacent and need to be distinguishable at a glance, not just by color for accessibility).
- **Confluence indicator**: use a small count badge ("3 confluences"), not a bare presence dot — carries more information for roughly the same space, and matches the "understand why at a glance" goal better than a dot does.

---

## 4. Verify before building

1. **Existing annotation data** — confirm whether any real trades already have values in `tags`/`analysis_timeframe`/`entry_timeframe` that need migrating/normalizing, per the data audit step above.

**TradingConcept Settings CRUD — deferred, not part of this pass.** Full
management UI (create/edit/delete concepts, assign `allowed_roles`) is a
later settings-page project. For this migration, seed each user with the
starter concept set (Section 1, step 3) so the Setup/Trigger/Confluence
selectors in the quick tier have something to select from immediately —
without a management UI, users pick from the seeded list only; they can't
yet add their own concepts. Note this limitation in the PR description so
it isn't mistaken for a bug.

---

## 5. Explicitly out of scope for this pass

- TradingConcept management UI (Settings page — create/edit/delete concepts, assign `allowed_roles`). Users work from the seeded starter set only until this ships.
- Checklist-based conviction scoring (replacing self-rated 1-5)
- `MistakeIncident` / self-reported "rule broken" reconciliation
- Execution/trade-management fields (SL moved, partials, scale-in)
- Screenshot role typing (ANALYSIS/ENTRY/EXIT/REVIEW)
- Extended MT4/MT5 timeframes beyond the 9 in the `Timeframe` enum (M2, M3, M4, M6, M10, M12, M20, H2, H3, H6, H8, H12) — revisit only if user data shows real demand

---

## 6. Files likely touched (frontend)

| File | Changes |
|---|---|
| `apps/web/src/components/trades/DetailPanel.tsx` | Restructure into quick-tier sidebar content only; add "expand to full review" action |
| `apps/web/src/components/trades/TradeReviewPage.tsx` (new) | Deep-tier full page/screen: Plan, Expectation, Notes, Screenshots, Plan Followed, Lesson |
| `apps/web/src/components/trades/DesktopTable.tsx` | Trigger pills, confluence count badge, use `annotation.session` |
| `apps/web/src/components/trades/MobileCardsList.tsx` | Same additions, mobile card layout |
| `apps/web/src/app/analytics/page.tsx` | HTF Bias Accuracy, Session Performance (stored value), Plan Adherence, Conviction Impact, R:R Planned vs Achieved |
| `apps/web/src/types/trade.ts` | Add `Timeframe` type if not already present from schema codegen |

---

## 7. Build order

1. Schema migration (Section 1), including data audit
2. Quick-tier sidebar restructure (desktop) + bottom sheet (mobile)
3. Deep-tier full page (desktop) + pushed screen (mobile), including the review-queue decision
4. Table/card view enhancements (Section 3)
5. Analytics breakdowns (last — depends on real data existing in the new fields first)