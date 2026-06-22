# Graph Report - trade-journal  (2026-06-22)

## Corpus Check
- 67 files · ~264,555 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 465 nodes · 609 edges · 37 communities (31 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ad4a62d6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]

## God Nodes (most connected - your core abstractions)
1. `toPersianDigits()` - 21 edges
2. `Design Engineering` - 16 edges
3. `compilerOptions` - 15 edges
4. `✅ Done` - 14 edges
5. `معامله‌یار — Persian Trading Journal Platform` - 13 edges
6. `useAuthStore` - 12 edges
7. `Trade` - 10 edges
8. `formatToman()` - 10 edges
9. `معامله‌یار — Run Commands` - 10 edges
10. `Auth Implementation Guide` - 10 edges

## Surprising Connections (you probably didn't know these)
- `LoginPage()` --calls--> `useAuthStore`  [EXTRACTED]
  apps/web/src/app/(auth)/login/page.tsx → apps/web/src/lib/auth.ts
- `RegisterPage()` --calls--> `useAuthStore`  [EXTRACTED]
  apps/web/src/app/(auth)/register/page.tsx → apps/web/src/lib/auth.ts
- `SettingsPage()` --calls--> `useAuthStore`  [EXTRACTED]
  apps/web/src/app/settings/page.tsx → apps/web/src/lib/auth.ts
- `TradingCalendar()` --calls--> `toPersianDigits()`  [EXTRACTED]
  apps/web/src/components/journal/TradingCalendar.tsx → apps/web/src/utils/farsi.ts
- `WeekdayPnlChart()` --calls--> `toPersianDigits()`  [EXTRACTED]
  apps/web/src/components/journal/WeekdayPnlChart.tsx → apps/web/src/utils/farsi.ts

## Import Cycles
- None detected.

## Communities (37 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (34): 10. Key Risks & Mitigations, 11. Suggested Next Steps, 1. Project Overview, 2. System Architecture Overview, 3.1 Frontend, 3.2 Backend, 3.3 Database — PostgreSQL Schema (core tables), 3.4 Infrastructure (+26 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (20): authenticate(), authenticateAccountToken(), AuthRequest, router, router, router, storage, upload (+12 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (34): dependencies, bcryptjs, cookie-parser, csv-parser, depd, express, jsonwebtoken, multer (+26 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (18): dependencies, axios, lightweight-charts, next, react, react-dom, sass, zustand (+10 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (21): API Integration in `page.tsx`, App Layout (`src/app/layout.tsx`), Dashboard & Analytics (Journal Page - Overview & Charts Tabs), Design System (`src/app/variables.scss`, `src/app/globals.scss`), ✅ Done, Exchange Rate API Route (`src/app/api/exchange-rate/route.ts`), High Priority, Import MT4/MT5 statement Modal (`src/components/ImportMT4Modal.tsx`) (+13 more)

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (14): API Progress — معامله‌یار, Database Schema (`src/prisma/schema.prisma`), ✅ Done, Express Server (`src/server.ts`), File Upload & Screenshots Middleware, High Priority, Low Priority, Medium Priority (+6 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (56): EMOTION_MAP, JournalPage(), WEEKDAY_NAMES, EquityChart(), EquityChartProps, Trade, JALALI_MONTH_NAMES, Trade (+48 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (15): devDependencies, concurrently, typescript, name, prisma, schema, private, scripts (+7 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (12): Brand & Style, Buttons, Cards & Trade Logs, Chips & Badges, Colors, Components, Elevation & Depth, Input Fields (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (10): 1. Start Database, 2. Run Database Migrations, 3. Generate Prisma Client, 3. Start API Server (port 3000), 4. Start Web App (port 3001), 5. Install MT5 Expert Advisor, Endpoints, Prerequisites (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.25
Nodes (7): compilerOptions, esModuleInterop, module, moduleResolution, skipLibCheck, strict, target

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (6): 1. Should this animate at all?, 2. What is the purpose?, 3. What easing should it use?, 4. How fast should it be?, Perceived performance, The Animation Decision Framework

### Community 13 - "Community 13"
Cohesion: 0.29
Nodes (6): File, How it works, JSON payload format, MT5 Expert Advisor — Trade Sync, Notes, Setup

### Community 14 - "Community 14"
Cohesion: 0.19
Nodes (11): AppLayout(), BottomNavBar(), SideNavBar(), AuthState, useAuthStore, User, LoginPage(), RegisterPage() (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.22
Nodes (8): Accessibility, Design Engineering, Initial Response, prefers-reduced-motion, Review Checklist, Review Format (Required), Stagger Animations, Touch device hover states

### Community 20 - "Community 20"
Cohesion: 0.32
Nodes (6): FilterBar(), FilterBarProps, Select(), SelectOption, SelectProps, getSymbolFilterOptions()

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, types, extends, include

### Community 22 - "Community 22"
Cohesion: 0.33
Nodes (6): CSS animations beat JS under load, CSS variables are inheritable, Framer Motion hardware acceleration caveat, Only animate transform and opacity, Performance Rules, Use WAAPI for programmatic CSS animations

### Community 25 - "Community 25"
Cohesion: 0.25
Nodes (8): Animate enter states with @starting-style, Buttons must feel responsive, Component Building Principles, Make popovers origin-aware, Never animate from scale(0), Tooltips: skip delay on subsequent hovers, Use blur to mask imperfect transitions, Use CSS transitions over keyframes for interruptible UI

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (6): clip-path for Animation, Comparison sliders, Hold-to-delete pattern, Image reveals on scroll, Tabs with perfect color transitions, The inset shape

### Community 27 - "Community 27"
Cohesion: 0.33
Nodes (6): Damping at boundaries, Friction instead of hard stops, Gesture and Drag Interactions, Momentum-based dismissal, Multi-touch protection, Pointer capture for drag

### Community 28 - "Community 28"
Cohesion: 0.40
Nodes (5): 3D transforms for depth, CSS Transform Mastery, scale() scales children too, transform-origin, translateY with percentages

### Community 29 - "Community 29"
Cohesion: 0.40
Nodes (5): Asymmetric enter/exit timing, Cohesion matters, Review your work the next day, The opacity + height combination, The Sonner Principles (Building Loved Components)

### Community 30 - "Community 30"
Cohesion: 0.40
Nodes (5): Interruptibility advantage, Spring Animations, Spring-based mouse interactions, Spring configuration, When to use springs

### Community 31 - "Community 31"
Cohesion: 0.50
Nodes (4): Beauty is leverage, Core Philosophy, Taste is trained, not innate, Unseen details compound

### Community 32 - "Community 32"
Cohesion: 0.10
Nodes (20): 1. Prisma Schema, 2. Install Dependencies, 3. Environment Variables, 4.1 Token utilities — `src/lib/tokens.ts`, 4.2 Auth middleware — `src/middleware/auth.ts`, 4.3 Validation schemas — `src/validators/auth.ts`, 4.4 Auth routes — `src/routes/auth.ts`, 4.5 Register the router — `src/index.ts` (+12 more)

### Community 33 - "Community 33"
Cohesion: 0.50
Nodes (4): Debugging Animations, Frame-by-frame inspection, Slow motion testing, Test on real devices

### Community 34 - "Community 34"
Cohesion: 0.20
Nodes (12): detectFormat(), ParsedTrade, parseMT4CSV(), parseMT4HTML(), parseMT5CSV(), parseTrades(), RawTrade, ImportSource (+4 more)

## Knowledge Gaps
- **283 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+278 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Design Engineering` connect `Community 19` to `Community 33`, `Community 12`, `Community 22`, `Community 25`, `Community 26`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 31`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `useAuthStore` connect `Community 14` to `Community 7`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _283 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10984848484848485 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._