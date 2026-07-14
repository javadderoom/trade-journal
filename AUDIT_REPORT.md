# Security & Bug Audit Report

**Date:** 2026-07-14
**Scope:** Full codebase — API (`apps/api`), Frontend (`apps/web`), DB schema, Docker infrastructure
**Last updated:** 2026-07-14 (post-fix)

---

## Summary

| Severity | Total | Fixed | Remaining |
|----------|-------|-------|-----------|
| Critical | 8 | 6 | 2 |
| High | 13 | 11 | 2 |
| Medium | 20 | 9 | 11 |
| Low | 12 | 2 | 10 |
| **Total** | **53** | **28** | **25** |

---

## Critical (fix immediately)

| # | Status | Category | Issue | Location |
|---|--------|----------|-------|----------|
| C1 | ✅ Fixed | Security | **CORS reflects any origin** — now restricted to `CORS_ORIGINS` allowlist; dev auto-allows localhost | `apps/api/src/server.ts:28-46` |
| C2 | ✅ Fixed | Security | **Hardcoded JWT secret fallback** — now throws on startup in production if `JWT_ACCESS_SECRET` is missing | `apps/api/src/lib/tokens.ts` |
| C3 | ✅ Fixed | Security | **Hardcoded encryption key fallback** — now throws on startup in production if `API_ENCRYPTION_KEY` is missing | `apps/api/src/lib/encryption.ts` |
| C4 | ⚠️ Partial | Security | **Real API keys committed to git** — `.env` rotated with new secrets; old values still in git history. Rotate if repo is public | `.env`, `apps/web/.env.local` |
| C5 | ⚠️ Partial | Security | **Weak JWT secret committed** — replaced with 64-char hex; old value still in git history | `.env` |
| C6 | ✅ Fixed | Infra | **Hardcoded Postgres password** — `postgres:postgres` in docker-compose.yml, no secrets management | `docker-compose.yml:9-10` |
| C7 | ✅ Fixed | Bug | **`updateTrade`/`deleteTrade` return `true` on API failure** — now revert optimistic updates on failure and return `false` | `apps/web/src/store/useTradeStore.ts` |
| C8 | ✅ Fixed | Bug | **`fetchTrades` silently falls back to `MOCK_TRADES`** — now sets `error` state instead of showing fake data | `apps/web/src/store/useTradeStore.ts` |

---

## High

| # | Status | Category | Issue | Location |
|---|--------|----------|-------|----------|
| H1 | ✅ Fixed | Security | **Mock payment gateways always registered** — now return 404 when `NODE_ENV=production` | `apps/api/src/routes/payments.ts` |
| H2 | ✅ Fixed | Security | **OTP brute-force possible** — added `rateLimit(2min, 5)` on `/otp/verify` — max 5 attempts per phone per 2 min | `apps/api/src/routes/auth.ts` |
| H3 | ✅ Fixed | Security | **XSS in mock gateway HTML** — added `escapeHtml()` and `escapeJsString()` for all interpolated query params | `apps/api/src/routes/payments.ts` |
| H4 | ✅ Fixed | Security | **Account token accepted via query parameter** — removed `req.query.token` support; tokens only accepted via headers | `apps/api/src/middleware/auth.ts` |
| H5 | ✅ Fixed | Security | **No input validation on `/otp/register`** — added `otpRegisterSchema` with Zod (min 8 char password, uppercase, digit, valid email) | `apps/api/src/routes/auth.ts` |
| H6 | ✅ Fixed | Security | **CSV injection** — added `sanitizeCsvCell()` that prefixes cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` | `apps/api/src/routes/tradeExport.ts` |
| H7 | Open | Security | **TypeScript strict mode disabled** in web app — `strictNullChecks`, `strictFunctionTypes` etc. all off, hiding potential null reference bugs | `apps/web/tsconfig.json:12` |
| H8 | ✅ Fixed | Perf | **Tag deletion N+1** — replaced per-trade `update()` loop with single `UPDATE ... array_remove()` raw SQL per tag | `apps/api/src/routes/tradeSync.ts` |
| H9 | ✅ Fixed | Perf | **MT4/MT5 import not transactional** — batch dedup check + wrapped in `$transaction` for atomicity | `apps/api/src/routes/tradeSync.ts` |
| H10 | ✅ Fixed | Perf | **Dashboard loads ALL user trades into memory** — added `take: 5000` limit to prevent memory pressure | `apps/api/src/routes/dashboard.ts` |
| H11 | ✅ Fixed | Schema | **`onDelete: RestrRICT` on all FK constraints** — added `Cascade` to Trade, Account, JournalEntry, ImportJob, Subscription; `SetNull` on ImportJob.account | `apps/api/src/prisma/schema.prisma` + migration `20260714150602` |
| H12 | Open | Infra | **Redis exposed without password** — port 6379 mapped to host with no `--requirepass`; any local process can connect | `docker-compose.yml:19-20` |
| H13 | ✅ Fixed | Bug | **`window.fetch` monkey-patch race condition** — added refresh queue so concurrent 401s share a single `refresh()` call | `apps/web/src/components/layout/AppLayout.tsx` |

---

## Medium

| # | Status | Category | Issue | Location |
|---|--------|----------|-------|----------|
| M1 | ✅ Fixed | Security | **Rate limiter race condition** — stored nonce in variable and reused for `zrem`; over-limit entry now properly removed | `apps/api/src/middleware/rateLimit.ts` |
| M2 | ✅ Fixed | Reliability | **No global `unhandledRejection` handler** — added `unhandledRejection` + `uncaughtException` handlers | `apps/api/src/server.ts` |
| M3 | ✅ Fixed | Security | **`err.message` leaked to clients** — replaced all 24 instances with generic error messages across `tradeSync.ts`, `dashboard.ts`, `payments.ts` | Multiple routes |
| M4 | ✅ Fixed | Auth | **Account token auth fakes `req.user`** — now looks up actual user's `plan`, `email`, `role` from DB | `apps/api/src/middleware/auth.ts` |
| M5 | Open | Validation | **No Zod schemas on manual trade CRUD** — ad-hoc `parseFloat()` validation; `parseFloat(undefined)` → `NaN` silently accepted | `apps/api/src/routes/tradeSync.ts:133-498` |
| M6 | Open | Validation | **No input length limits** on trade fields (notes, tags, emotion); multi-megabyte payloads possible | `apps/api/src/routes/tradeSync.ts:133-166` |
| M7 | Open | Memory leak | **Missing AbortController** in dashboard and trades page fetch; state updates on unmounted components | `apps/web/src/app/dashboard/page.tsx:78-91`, `apps/web/src/app/trades/page.tsx:70-77` |
| M8 | Open | UX | **No error boundary or not-found pages** — rendering errors show blank white screen; no custom 404 | `apps/web/src/app/` (missing `error.tsx`, `global-error.tsx`, `not-found.tsx`) |
| M9 | Open | i18n | **Pagination text hardcoded in Farsi** — shows Persian text even when language is English | `apps/web/src/components/trades/TradesTable.tsx:857-860` |
| M10 | Open | RTL | **Sort icon direction inverted for RTL** — "Previous" points right, "Next" points left (should be opposite) | `apps/web/src/components/trades/TradesTable.tsx:868-880` |
| M11 | Open | i18n | **Farsi percent sign `٪` used unconditionally** — not locale-aware | `apps/web/src/app/dashboard/page.tsx:294-315` |
| M12 | Open | SSR | **Missing `lang`/`dir` on `<html>`** — SSR renders without language/direction; flash of wrong layout before JS hydrates | `apps/web/src/app/layout.tsx:78` |
| M13 | Open | UX | **Google Fonts CDN blocked in Iran** — Material Symbols fail to load for Iranian users | `apps/web/src/app/layout.tsx:83-86` |
| M14 | ✅ Fixed | Config | **API base URL defaults to `http://localhost:3000`** — added console warning when `NEXT_PUBLIC_API_BASE_URL` is not set | `apps/web/src/lib/api.ts` |
| M15 | Open | Security | **Password field has no client-side min length** — registration and password change allow 1-character passwords | `apps/web/src/app/(auth)/register/page.tsx:460`, `apps/web/src/app/settings/page.tsx:1696` |
| M16 | ✅ Fixed | Infra | **No health checks on Docker services** — added `pg_isready` for Postgres and `redis-cli ping` for Redis | `docker-compose.yml` |
| M17 | ✅ Fixed | Schema | **`Trade.open_time` has no database index** — added `@@index([open_time])` and `@@index([user_id, open_time])` | `apps/api/src/prisma/schema.prisma` + migration `20260714171006` |
| M18 | Open | Perf | **Dashboard aggregation should use Prisma `groupBy`/`aggregate`** instead of loading all rows into JS | `apps/api/src/routes/dashboard.ts:412-440` |
| M19 | ✅ Fixed | Perf | **Tag bulk upsert N+1** — replaced per-tag `upsert` loop with `createMany({ skipDuplicates: true })` + `updateMany` | `apps/api/src/routes/tradeSync.ts` |
| M20 | ✅ Fixed | Perf | **`checkPlanLimits` re-queries DB** — all 5 middlewares now use `req.user.plan` from JWT; removed unnecessary DB queries | `apps/api/src/middleware/checkPlanLimits.ts` |

---

## Low

| # | Status | Category | Issue | Location |
|---|--------|----------|-------|----------|
| L1 | Open | Bug | **OTP records never cleaned up** — table grows without bound after registration | `apps/api/src/routes/auth.ts:383-453` |
| L2 | ✅ Fixed | Bug | **Refresh token cron too narrow** — now also cleans up OTPs older than 24h and expired checkout sessions | `apps/api/src/server.ts` |
| L3 | Open | Bug | **Subscription history shows hardcoded prices** — maps to fixed values instead of actual payment amounts | `apps/api/src/routes/settings.ts:510-516` |
| L4 | Open | Security | **`express.json` 10MB limit** — allows large payloads that could exhaust memory | `apps/api/src/server.ts:23` |
| L5 | Open | Performance | **Inline styles everywhere** — prevents memoization, causes unnecessary re-renders | `settings/page.tsx`, `ConnectExchangeModal.tsx`, `DetailPanel.tsx`, `AppLayout.tsx` |
| L6 | Open | Performance | **`EquityCurveSVG` not memoized** — recreated on every render | `apps/web/src/app/dashboard/page.tsx:447` |
| L7 | Open | UX | **No `loading.tsx` route segments** — no loading states during route transitions | `apps/web/src/app/` |
| L8 | Open | Accessibility | **FAB speed dial not keyboard accessible** — closes on `onMouseLeave`; keyboard users can't trigger mouse events | `apps/web/src/components/trades/TradesTable.tsx:934` |
| L9 | Open | Bug | **`suppressHydrationWarning` hides real mismatches** — applied to both `<html>` and `<body>` | `apps/web/src/app/layout.tsx:78,97` |
| L10 | Open | Infra | **No resource limits on Docker containers** — runaway process can consume all host resources | `docker-compose.yml` |
| L11 | Open | Security | **`delete-latest-user.ts` dangerous utility in repo** — could accidentally be run in production | `apps/api/src/delete-latest-user.ts` |
| L12 | ✅ Fixed | Security | **`uploads/` not in `.gitignore`** — added `uploads/` to `.gitignore` | `.gitignore` |

---

## Top 5 Fixes (Highest Impact)

1. ✅ **Rotate all committed secrets** (C4, C5) — `.env` now uses 64-char hex for JWT and encryption keys. Old values remain in git history — rotate if repo is public.
2. ✅ **Fix CORS to restrict origins** (C1) — new `CORS_ORIGINS` env var; unknown origins get no CORS header.
3. ✅ **Gate mock payment gateways behind `NODE_ENV`** (H1) — both mock endpoints return 404 in production.
4. ✅ **Change `onDelete` to Cascade on all FK constraints** (H11) — migration `20260714150602_add_cascade_deletes` applied.
5. ✅ **Fix N+1 in tag deletion and MT4/MT5 import** (H8, H9) — raw SQL `array_remove` for tags; batch dedup + `$transaction` for import.
