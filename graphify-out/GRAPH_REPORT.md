# Graph Report - trade-journal  (2026-06-20)

## Corpus Check
- 53 files · ~249,715 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 375 nodes · 457 edges · 33 communities (29 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9c64a575`
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

## God Nodes (most connected - your core abstractions)
1. `Design Engineering` - 16 edges
2. `toPersianDigits()` - 15 edges
3. `compilerOptions` - 15 edges
4. `معامله‌یار — Persian Trading Journal Platform` - 13 edges
5. `✅ Done` - 12 edges
6. `Trade` - 10 edges
7. `formatToman()` - 10 edges
8. `معامله‌یار — Run Commands` - 10 edges
9. `5. Feature Breakdown — V1` - 9 edges
10. `Component Building Principles` - 8 edges

## Surprising Connections (you probably didn't know these)
- `JournalPage()` --calls--> `useAppStore`  [EXTRACTED]
  apps/web/src/app/journal/page.tsx → apps/web/src/store/useAppStore.ts
- `JournalPage()` --calls--> `useTradeStore`  [EXTRACTED]
  apps/web/src/app/journal/page.tsx → apps/web/src/store/useTradeStore.ts
- `DesktopTableProps` --references--> `Trade`  [EXTRACTED]
  apps/web/src/components/trades/DesktopTable.tsx → apps/web/src/components/trades/TradesTable.tsx
- `DetailPanelProps` --references--> `Trade`  [EXTRACTED]
  apps/web/src/components/trades/DetailPanel.tsx → apps/web/src/components/trades/TradesTable.tsx
- `MobileCardsListProps` --references--> `Trade`  [EXTRACTED]
  apps/web/src/components/trades/MobileCardsList.tsx → apps/web/src/components/trades/TradesTable.tsx

## Import Cycles
- None detected.

## Communities (33 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (34): 10. Key Risks & Mitigations, 11. Suggested Next Steps, 1. Project Overview, 2. System Architecture Overview, 3.1 Frontend, 3.2 Backend, 3.3 Database — PostgreSQL Schema (core tables), 3.4 Infrastructure (+26 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (23): router, storage, upload, uploadDir, uploadMemory, detectFormat(), ParsedTrade, parseMT4CSV() (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (25): dependencies, csv-parser, depd, express, multer, node-html-parser, pg, prisma (+17 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (20): dependencies, @chakra-ui/react, @emotion/react, @emotion/styled, lightweight-charts, next, react, react-dom (+12 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (19): API Integration in `page.tsx`, App Layout (`src/app/layout.tsx`), Design System (`src/app/variables.scss`, `src/app/globals.scss`), ✅ Done, Exchange Rate API Route (`src/app/api/exchange-rate/route.ts`), High Priority, Import MT4/MT5 statement Modal (`src/components/ImportMT4Modal.tsx`), Low Priority (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (14): API Progress — معامله‌یار, Database Schema (`src/prisma/schema.prisma`), ✅ Done, Express Server (`src/server.ts`), File Upload & Screenshots Middleware, High Priority, Low Priority, Medium Priority (+6 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (32): EMOTION_MAP, JALALI_MONTH_NAMES, JournalPage(), WEEKDAY_NAMES, WEEKDAY_NAMES_CALENDAR, MOCK_TRADES, TradeState, DesktopTableProps (+24 more)

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

### Community 24 - "Community 24"
Cohesion: 0.33
Nodes (6): Damping at boundaries, Friction instead of hard stops, Gesture and Drag Interactions, Momentum-based dismissal, Multi-touch protection, Pointer capture for drag

### Community 25 - "Community 25"
Cohesion: 0.25
Nodes (8): Animate enter states with @starting-style, Buttons must feel responsive, Component Building Principles, Make popovers origin-aware, Never animate from scale(0), Tooltips: skip delay on subsequent hovers, Use blur to mask imperfect transitions, Use CSS transitions over keyframes for interruptible UI

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (6): clip-path for Animation, Comparison sliders, Hold-to-delete pattern, Image reveals on scroll, Tabs with perfect color transitions, The inset shape

### Community 27 - "Community 27"
Cohesion: 0.40
Nodes (5): 3D transforms for depth, CSS Transform Mastery, scale() scales children too, transform-origin, translateY with percentages

### Community 28 - "Community 28"
Cohesion: 0.40
Nodes (5): Asymmetric enter/exit timing, Cohesion matters, Review your work the next day, The opacity + height combination, The Sonner Principles (Building Loved Components)

### Community 29 - "Community 29"
Cohesion: 0.40
Nodes (5): Interruptibility advantage, Spring Animations, Spring-based mouse interactions, Spring configuration, When to use springs

### Community 30 - "Community 30"
Cohesion: 0.50
Nodes (4): Beauty is leverage, Core Philosophy, Taste is trained, not innate, Unseen details compound

### Community 31 - "Community 31"
Cohesion: 0.50
Nodes (4): Debugging Animations, Frame-by-frame inspection, Slow motion testing, Test on real devices

### Community 32 - "Community 32"
Cohesion: 0.17
Nodes (11): ImportMT4Modal(), ImportMT4ModalProps, ManualTradeModal(), ManualTradeModalProps, AppState, TradingAccount, useAppStore, useTradeStore (+3 more)

## Knowledge Gaps
- **241 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+236 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Design Engineering` connect `Community 19` to `Community 12`, `Community 22`, `Community 24`, `Community 25`, `Community 26`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 31`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `Component Building Principles` connect `Community 25` to `Community 19`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _241 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09247311827956989 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._