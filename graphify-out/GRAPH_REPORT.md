# Graph Report - trade-journal  (2026-06-20)

## Corpus Check
- 37 files · ~238,707 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 327 nodes · 334 edges · 25 communities (22 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9d1e339b`
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
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]

## God Nodes (most connected - your core abstractions)
1. `Design Engineering` - 16 edges
2. `compilerOptions` - 15 edges
3. `معامله‌یار — Persian Trading Journal Platform` - 13 edges
4. `معامله‌یار — Run Commands` - 10 edges
5. `✅ Done` - 9 edges
6. `5. Feature Breakdown — V1` - 9 edges
7. `Component Building Principles` - 8 edges
8. `scripts` - 7 edges
9. `compilerOptions` - 7 edges
10. `✅ Done` - 7 edges

## Surprising Connections (you probably didn't know these)
- `ParsedTrade` --inherits--> `TradeData`  [EXTRACTED]
  apps/api/src/services/mt4Parser.ts → apps/api/src/types/trade.ts
- `TradesTable()` --calls--> `formatToman()`  [EXTRACTED]
  apps/web/src/components/TradesTable.tsx → apps/web/src/utils/farsi.ts
- `TradesTable()` --calls--> `toPersianDigits()`  [EXTRACTED]
  apps/web/src/components/TradesTable.tsx → apps/web/src/utils/farsi.ts

## Import Cycles
- None detected.

## Communities (25 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (25): 10. Key Risks & Mitigations, 11. Suggested Next Steps, 1. Project Overview, 2. System Architecture Overview, 3.1 Frontend, 3.2 Backend, 3.3 Database — PostgreSQL Schema (core tables), 3.4 Infrastructure (+17 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (23): router, storage, upload, uploadDir, uploadMemory, detectFormat(), ParsedTrade, parseMT4CSV() (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (25): dependencies, csv-parser, depd, express, multer, node-html-parser, pg, prisma (+17 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (19): dependencies, @chakra-ui/react, @emotion/react, @emotion/styled, lightweight-charts, next, react, react-dom (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (16): API Integration in `page.tsx`, App Layout (`src/app/layout.tsx`), Design System (`src/app/variables.scss`, `src/app/globals.scss`), ✅ Done, Exchange Rate API Route (`src/app/api/exchange-rate/route.ts`), High Priority, Low Priority, Medium Priority (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (13): API Progress — معامله‌یار, Database Schema (`src/prisma/schema.prisma`), ✅ Done, Express Server (`src/server.ts`), High Priority, Low Priority, Medium Priority, MT4/MT5 Parser (`src/services/mt4Parser.ts`) (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (20): ImportMT4Modal(), ImportMT4ModalProps, ManualTradeModal(), ManualTradeModalProps, Select(), SelectOption, SelectProps, CandlestickData (+12 more)

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
Nodes (6): clip-path for Animation, Comparison sliders, Hold-to-delete pattern, Image reveals on scroll, Tabs with perfect color transitions, The inset shape

### Community 13 - "Community 13"
Cohesion: 0.29
Nodes (6): File, How it works, JSON payload format, MT5 Expert Advisor — Trade Sync, Notes, Setup

### Community 19 - "Community 19"
Cohesion: 0.05
Nodes (41): 1. Should this animate at all?, 2. What is the purpose?, 3. What easing should it use?, 3D transforms for depth, 4. How fast should it be?, Accessibility, Animate enter states with @starting-style, Beauty is leverage (+33 more)

### Community 20 - "Community 20"
Cohesion: 0.33
Nodes (6): CSS animations beat JS under load, CSS variables are inheritable, Framer Motion hardware acceleration caveat, Only animate transform and opacity, Performance Rules, Use WAAPI for programmatic CSS animations

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, types, extends, include

### Community 22 - "Community 22"
Cohesion: 0.22
Nodes (9): 5.1 Authentication, 5.2 Manual Trade Entry, 5.3 MT4/MT5 Import, 5.4 Analytics Dashboard, 5.5 Trade List & Detail, 5.6 Daily Journal, 5.7 Setup / Playbook, 5.8 Payments & Plans (+1 more)

### Community 23 - "Community 23"
Cohesion: 0.40
Nodes (5): Asymmetric enter/exit timing, Cohesion matters, Review your work the next day, The opacity + height combination, The Sonner Principles (Building Loved Components)

### Community 24 - "Community 24"
Cohesion: 0.40
Nodes (5): Interruptibility advantage, Spring Animations, Spring-based mouse interactions, Spring configuration, When to use springs

## Knowledge Gaps
- **226 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+221 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Design Engineering` connect `Community 19` to `Community 24`, `Community 12`, `Community 20`, `Community 23`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `معامله‌یار — Persian Trading Journal Platform` connect `Community 0` to `Community 22`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _226 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09247311827956989 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._