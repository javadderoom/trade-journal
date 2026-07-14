# Security & Bug Audit Report

**Date:** 2026-07-14
**Scope:** Full codebase — API (`apps/api`), Frontend (`apps/web`), DB schema, Docker infrastructure

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 8 |
| High | 13 |
| Medium | 20 |
| Low | 12 |
| **Total** | **53** |

---

## Critical (fix immediately)

| # | Category | Issue | Location |
|---|----------|-------|----------|
| C1 | Security | **CORS reflects any origin** — any website can make authenticated API calls and read responses | `apps/api/src/server.ts:28-33` |
| C2 | Security | **Hardcoded JWT secret fallback** — if `JWT_ACCESS_SECRET` is unset, a known string is used; anyone can forge valid tokens | `apps/api/src/lib/tokens.ts:12,23` |
| C3 | Security | **Hardcoded encryption key fallback** — if `API_ENCRYPTION_KEY` is unset, exchange API keys/secrets are encrypted with a known dev key, making them trivially decryptable | `apps/api/src/lib/encryption.ts:6-11` |
| C4 | Security | **Real API keys committed to git** — `NAVASAN_API_KEY` in plaintext in `.env` and `apps/web/.env.local` | `.env:2`, `apps/web/.env.local:1` |
| C5 | Security | **Weak JWT secret committed** — `default_jwt_secret_key_for_development_purposes_only` is in git history | `.env:3` |
| C6 | Infra | **Hardcoded Postgres password** — `postgres:postgres` in docker-compose.yml, no secrets management | `docker-compose.yml:9-10` |
| C7 | Bug | **`updateTrade`/`deleteTrade` return `true` on API failure** — optimistic UI never rolls back; user sees trades as "saved" when they weren't | `apps/web/src/store/useTradeStore.ts:308-346` |
| C8 | Bug | **`fetchTrades` silently falls back to `MOCK_TRADES`** on API error — user sees fake data with no indication it's not real | `apps/web/src/store/useTradeStore.ts:263-265` |

---

## High

| # | Category | Issue | Location |
|---|----------|-------|----------|
| H1 | Security | **Mock payment gateways always registered** — `/mock-gateway` and PayPing mock endpoints work in production, allowing anyone to simulate successful payments | `apps/api/src/routes/payments.ts:729-844, 1119-1235` |
| H2 | Security | **OTP brute-force possible** — 5-digit numeric code (90k possibilities), no rate limit on `/otp/verify` | `apps/api/src/routes/auth.ts:274` |
| H3 | Security | **XSS in mock gateway HTML** — query parameters (`Authority`, `CallbackUrl`) interpolated unescaped into raw HTML via template literals | `apps/api/src/routes/payments.ts:729-844` |
| H4 | Security | **Account token accepted via query parameter** — tokens in URLs get logged in server access logs, browser history, and proxy logs | `apps/api/src/middleware/auth.ts:59-113` |
| H5 | Security | **No input validation on `/otp/register`** — no password minimum length, no email format validation (unlike `/register` which uses Zod) | `apps/api/src/routes/auth.ts:383-453` |
| H6 | Security | **CSV injection** — exported symbol, ticket, and notes values not sanitized; cells starting with `=`, `+`, `-`, `@` can trigger formula execution in Excel | `apps/api/src/routes/tradeExport.ts:171-193` |
| H7 | Security | **TypeScript strict mode disabled** in web app — `strictNullChecks`, `strictFunctionTypes` etc. all off, hiding potential null reference bugs | `apps/web/tsconfig.json:12` |
| H8 | Perf | **Tag deletion N+1** — individual `prisma.trade.update()` called per trade in a loop; 1000 trades = 1000 DB queries | `apps/api/src/services/tradeSync.ts:651-658, 760-767` |
| H9 | Perf | **MT4/MT5 import not transactional** — crash midway leaves partial data; ~600 DB queries for 150 trades (no batching) | `apps/api/src/routes/tradeSync.ts:1453-1520` |
| H10 | Perf | **Dashboard loads ALL user trades into memory** for aggregation — no pagination limit; 10K+ trades causes memory pressure and slow responses | `apps/api/src/routes/dashboard.ts:412-440` |
| H11 | Schema | **`onDelete: RestrRICT` on all FK constraints** — deleting a user with trades, accounts, subscriptions, or journal entries fails at DB level | `apps/api/src/prisma/schema.prisma` (Trade, Account, JournalEntry, ImportJob, Subscription) |
| H12 | Infra | **Redis exposed without password** — port 6379 mapped to host with no `--requirepass`; any local process can connect | `docker-compose.yml:19-20` |
| H13 | Bug | **`window.fetch` monkey-patch race condition** — concurrent 401s don't queue properly; second request uses stale token | `apps/web/src/components/layout/AppLayout.tsx:30-89` |

---

## Medium

| # | Category | Issue | Location |
|---|----------|-------|----------|
| M1 | Security | **Rate limiter race condition** — `zrem` uses a new `Math.random()` instead of the value added earlier; over-limit entry persists until TTL expiry | `apps/api/src/middleware/rateLimit.ts:40` |
| M2 | Reliability | **No global `unhandledRejection` handler** — unhandled promise rejections silently crash the Node process | `apps/api/src/server.ts` |
| M3 | Security | **`err.message` leaked to clients** — internal error messages (DB schema, file paths) returned in error responses | Multiple routes (`tradeSync.ts`, `dashboard.ts`, `cryptoSync.ts`) |
| M4 | Auth | **Account token auth fakes `req.user`** — hardcoded `plan: 'FREE'`, `email: ''`; plan-gated features always see FREE for EA requests | `apps/api/src/middleware/auth.ts:101-107` |
| M5 | Validation | **No Zod schemas on manual trade CRUD** — ad-hoc `parseFloat()` validation; `parseFloat(undefined)` → `NaN` silently accepted | `apps/api/src/routes/tradeSync.ts:133-498` |
| M6 | Validation | **No input length limits** on trade fields (notes, tags, emotion); multi-megabyte payloads possible | `apps/api/src/routes/tradeSync.ts:133-166` |
| M7 | Memory leak | **Missing AbortController** in dashboard and trades page fetch; state updates on unmounted components | `apps/web/src/app/dashboard/page.tsx:78-91`, `apps/web/src/app/trades/page.tsx:70-77` |
| M8 | UX | **No error boundary or not-found pages** — rendering errors show blank white screen; no custom 404 | `apps/web/src/app/` (missing `error.tsx`, `global-error.tsx`, `not-found.tsx`) |
| M9 | i18n | **Pagination text hardcoded in Farsi** — shows Persian text even when language is English | `apps/web/src/components/trades/TradesTable.tsx:857-860` |
| M10 | RTL | **Sort icon direction inverted for RTL** — "Previous" points right, "Next" points left (should be opposite) | `apps/web/src/components/trades/TradesTable.tsx:868-880` |
| M11 | i18n | **Farsi percent sign `٪` used unconditionally** — not locale-aware | `apps/web/src/app/dashboard/page.tsx:294-315` |
| M12 | SSR | **Missing `lang`/`dir` on `<html>`** — SSR renders without language/direction; flash of wrong layout before JS hydrates | `apps/web/src/app/layout.tsx:78` |
| M13 | UX | **Google Fonts CDN blocked in Iran** — Material Symbols fail to load for Iranian users | `apps/web/src/app/layout.tsx:83-86` |
| M14 | Config | **API base URL defaults to `http://localhost:3000`** — silent fallback in production if env var missing | `apps/web/src/lib/api.ts:4`, `apps/web/src/components/layout/AppLayout.tsx:39` |
| M15 | Security | **Password field has no client-side min length** — registration and password change allow 1-character passwords | `apps/web/src/app/(auth)/register/page.tsx:460`, `apps/web/src/app/settings/page.tsx:1696` |
| M16 | Infra | **No health checks on Docker services** — Docker won't know if Postgres/Redis are ready | `docker-compose.yml` |
| M17 | Schema | **`Trade.open_time` has no database index** — dashboard queries filter on date ranges without an index | `apps/api/src/prisma/schema.prisma:86` |
| M18 | Perf | **Dashboard aggregation should use Prisma `groupBy`/`aggregate`** instead of loading all rows into JS | `apps/api/src/routes/dashboard.ts:412-440` |
| M19 | Perf | **Tag bulk upsert N+1** — each tag upserted individually; 20 tags = 20 DB queries | `apps/api/src/services/tradeSync.ts:663-682` |
| M20 | Perf | **`checkPlanLimits` re-queries DB** instead of using `req.user.plan` from JWT | `apps/api/src/middleware/checkPlanLimits.ts` |

---

## Low

| # | Category | Issue | Location |
|---|----------|-------|----------|
| L1 | Bug | **OTP records never cleaned up** — table grows without bound after registration | `apps/api/src/routes/auth.ts:383-453` |
| L2 | Bug | **Refresh token cron too narrow** — only deletes expired tokens; used/revoked tokens and other tables never purged | `apps/api/src/server.ts:63-72` |
| L3 | Bug | **Subscription history shows hardcoded prices** — maps to fixed values instead of actual payment amounts | `apps/api/src/routes/settings.ts:510-516` |
| L4 | Security | **`express.json` 10MB limit** — allows large payloads that could exhaust memory | `apps/api/src/server.ts:23` |
| L5 | Performance | **Inline styles everywhere** — prevents memoization, causes unnecessary re-renders | `settings/page.tsx`, `ConnectExchangeModal.tsx`, `DetailPanel.tsx`, `AppLayout.tsx` |
| L6 | Performance | **`EquityCurveSVG` not memoized** — recreated on every render | `apps/web/src/app/dashboard/page.tsx:447` |
| L7 | UX | **No `loading.tsx` route segments** — no loading states during route transitions | `apps/web/src/app/` |
| L8 | Accessibility | **FAB speed dial not keyboard accessible** — closes on `onMouseLeave`; keyboard users can't trigger mouse events | `apps/web/src/components/trades/TradesTable.tsx:934` |
| L9 | Bug | **`suppressHydrationWarning` hides real mismatches** — applied to both `<html>` and `<body>` | `apps/web/src/app/layout.tsx:78,97` |
| L10 | Infra | **No resource limits on Docker containers** — runaway process can consume all host resources | `docker-compose.yml` |
| L11 | Security | **`delete-latest-user.ts` dangerous utility in repo** — could accidentally be run in production | `apps/api/src/delete-latest-user.ts` |
| L12 | Security | **`uploads/` not in `.gitignore`** — user-uploaded screenshots and receipts could be committed | `.gitignore` |

---

## Top 5 Fixes (Highest Impact)

1. **Rotate all committed secrets** (C4, C5) — API keys and JWT secret are in git history
2. **Fix CORS to restrict origins** (C1) — currently allows any website to make authenticated API calls
3. **Gate mock payment gateways behind `NODE_ENV`** (H1) — allows payment bypass in production
4. **Change `onDelete` to Cascade on all FK constraints** (H11) — user deletion is broken for anyone with data
5. **Fix N+1 in tag deletion and MT4/MT5 import** (H8, H9) — performance degrades linearly with data size
