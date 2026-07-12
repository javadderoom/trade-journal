# Known Issues & Improvements — trade-journal-demo

Compiled from a mock interview pass over the scaffold. Each item notes
where it lives, why it matters, and the fix. Good both as a punch list and
as rehearsed interview material ("tell me about a bug in your own code").

---

## Bugs (actual incorrect behavior)

### 1. Sorting doesn't refetch — only re-sorts the current page
**File:** `components/TradesTable.tsx`
**Problem:** `sortKey`/`sortDir` are not part of the SWR cache key
(`/api/trades?...`), so clicking a column header only re-sorts the 20 rows
already fetched for the current page — it never asks the server for a
correctly globally-sorted result set. Looks like full sorting, isn't.
**Fix:** Pass `sortKey`/`sortDir` as query params, and sort in the Prisma
`orderBy` on the server, same as filtering already does.

### 2. `pnl` goes stale on edit
**File:** `app/api/trades/[id]/route.ts`
**Problem:** `POST /api/trades` computes `pnl` from `entryPrice`/`exitPrice`/
`size`/`direction`, but `PATCH` writes whatever fields are sent without
recomputing `pnl`. Editing `exitPrice` after close leaves `pnl` incorrect.
**Fix:** In the `PATCH` handler, if any of `entryPrice`, `exitPrice`, `size`,
or `direction` are present in the update, recompute `pnl` using the same
formula as `POST` before writing.

### 3. No rate limiting on auth routes
**File:** `app/api/auth/login/route.ts`
**Problem:** `/api/auth/login` has no throttling — vulnerable to password
brute-forcing against any known email.
**Fix:** IP+email-keyed rate limiting with backoff (Redis token bucket, or
a hosted option like Upstash for serverless). Log failed attempts.

---

## Accessibility gaps

### 4. Form errors aren't announced to screen readers
**File:** `components/TradeForm.tsx`
**Problem:** The error `<span>` under each field is visible but not wired
to the input — no `aria-invalid`, no `aria-describedby`, no live region. A
screen reader user isn't told a field failed validation unless they
manually navigate onto the error text.
**Fix:** Add `aria-invalid={!!error}` and `aria-describedby={errorId}` to
each input, give the error `<span>` a matching `id`, and wrap it in
`aria-live="polite"` so it's announced the moment validation fails.

---

## Robustness / input handling

### 5. Numeric coercion breaks on non-plain-numeral input
**File:** `components/TradeForm.tsx`
**Problem:** `z.coerce.number()` silently produces `NaN` (generic "expected
number" error) for input like `"1,250.50"` or Persian/Farsi numerals —
relevant given the target userbase types in Farsi elsewhere in the app.
**Fix:** Normalize input (strip thousands separators, convert Farsi/Arabic
numerals to ASCII digits) before it hits the zod schema, ideally in a
shared `normalizeNumberInput()` used by every numeric field.

---

## Design limitations (known, not "bugs" — good to name proactively)

### 6. Schema doesn't support partial closes
**File:** `prisma/schema.prisma`
**Problem:** `Trade` assumes exactly one entry and one exit. Scaling out of
a position in stages has nowhere to go.
**Fix direction:** Split `Trade` (the position) from `Execution`/`Fill`
(each entry/exit event), with `Trade.pnl` aggregated from its executions.

### 7. Equity chart aggregates client-side
**File:** `components/EquityCurveChart.tsx`
**Problem:** Fetches up to 500 trades and reduces to a cumulative sum in
the browser. Fine now; won't hold at tens of thousands of trades — both
payload size and recharts' render cost scale linearly with point count.
**Fix direction:** Move the cumulative sum server-side via a SQL window
function (`SUM(pnl) OVER (ORDER BY openedAt)`), and downsample to
daily/weekly buckets rather than one point per trade.

### 8. No optimistic UI on trade submit
**File:** `components/TradeForm.tsx`
**Problem:** There's a visible beat between clicking "Log trade" and the
new row appearing in the table — submit triggers a `mutate()` revalidation
rather than an immediate optimistic insert.
**Fix direction:** Use SWR's optimistic `mutate(key, updater, { optimisticData, rollbackOnError: true })` to insert the new row immediately, then
reconcile with the server response.

### 9. Auth model assumes a browser session
**File:** `lib/auth.ts`
**Problem:** `getUserIdFromRequest` reads a session cookie — this doesn't
extend to a future MT5 webhook integration, which has no browser session
to attach a cookie to.
**Fix direction:** A separate auth path for machine-to-machine calls: a
per-account API key or HMAC-signed payload, plus idempotency (unique
constraint on `(accountId, brokerTradeId)`) since brokers may resend the
same trade.

---

## Priority if picking a few to actually fix

1. **#2 (stale `pnl` on edit)** — actual data-correctness bug, small fix.
2. **#1 (sort not refetching)** — actual behavioral bug, small fix.
3. **#4 (accessibility)** — quick, and a strong signal in interviews.
4. **#3 (rate limiting)** — quick to add, closes a real security gap.

Everything under "Design limitations" is better left as-is with a clear
answer ready, rather than over-built for a demo scaffold.
