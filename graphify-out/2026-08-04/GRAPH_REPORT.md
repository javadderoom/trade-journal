# Graph Report - trade-journal  (2026-07-28)

## Corpus Check
- 288 files · ~395,604 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3672 nodes · 7957 edges · 202 communities (182 shown, 20 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 129 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a0290b5b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- معامله‌یار — Persian Trading Journal Platform
- live-browser.js
- checks.mjs
- el
- index.mjs
- live-inject.mjs
- resumeSession
- TradesTable.tsx
- package.json
- hook-lib.mjs
- معامله‌یار — Run Commands
- compilerOptions
- showToast
- setLiveState
- modern-screenshot.umd.js
- live-commit-manual-edits.mjs
- trades/page.tsx
- useTranslation
- impeccable-config.mjs
- design-system.mjs
- live-server.mjs
- useAuthStore
- svelte-component.mjs
- hook-before-edit.mjs
- manual-apply.mjs
- hook-admin.mjs
- detect-antipatterns-browser.js
- css-cascade.mjs
- live-wrap.mjs
- design-parser.mjs
- ✅ Done
- colorize.md
- live-accept.mjs
- server.ts
- live-copy-edit-agent.mjs
- detect-url.mjs
- dependencies
- compilerOptions
- live-manual-edit-evidence.mjs
- detect-antipatterns.mjs
- documentRefForElement
- handleManualEditActivity
- live-poll.mjs
- document.md
- detect-text.mjs
- insert-ui.mjs
- payments.ts
- [locale]/page.tsx
- onboard.md
- collectVisualContrastCandidates
- parseRgb
- manual-edit-routes.mjs
- context.mjs
- routes/auth.ts
- journal/page.tsx
- Auth Implementation Guide
- ✅ Done
- Polish Systematically
- GENERIC_FONTS
- readLiveServerInfo
- routes/tradeSync.ts
- Delight Techniques
- impeccable-paths.mjs
- parseAnyColor
- detect-html.mjs
- Interaction Design
- onAnnotDown
- dependencies
- devDependencies
- adapt.md
- Improve Copy Systematically
- UX Writing
- Handle `generate`
- Phase 1: Discovery Interview
- Typography
- resolveContext
- checkElementDesignSystemDOM
- Known Issues & Improvements — trade-journal-demo
- Generate Report
- Crypto Payment Integration Plan - Direct Blockchain Verification (USDT-TRC20 / TRX)
- Init Flow
- SWR Migration Plan for Trade Journal
- Brand register
- live.md
- optimize.md
- context-signals.mjs
- Hybrid Multi-Language Support Plan (English & Persian)
- resolveLengthPx
- StaticElement
- event-validation.mjs
- typeset.md
- impeccable/SKILL.md
- Chat Conversation
- overdrive.md
- critique-storage.mjs
- VPS Deployment Guide using Coolify
- sampleCssBackground
- showBar
- services/tradeSync.ts
- DESIGN.md
- animate.md
- bolder.md
- Simplify the Design
- Hardening Dimensions
- live.mjs
- collectBrowserFindings
- ui-core.mjs
- session-store.mjs
- cryptoSync.ts
- critique.md
- Nielsen's 10 Heuristics
- quieter.md
- discoverTargetCandidates
- SAFE_TAGS
- readConfig
- palette.mjs
- pin.mjs
- General rules
- api/package.json
- dashboard.ts
- Self-Hosted Mail Server Setup Guide (Stalwart + Coolify)
- mistakeDetector.ts
- @prisma/client
- Responsive Design
- Craft Flow
- Generate Combined Critique Report
- Product register
- resolveWorkspaceProjectRoot
- normalizeIgnoreValueEntries
- syncEditBadgeHitProxies
- Toaster.tsx
- Design Engineering
- craft.md
- Codex: Visual Direction & Asset Production
- Common Cognitive Load Violations
- settings.ts
- TradeKav EA — Trade Sync (MT4 & MT5)
- Component Building Principles
- Technical Implementation
- Persona-Based Design Testing
- Extract Flow
- Improve Layout Systematically
- The Toolkit
- readWorkspacePatterns
- FilterBar.tsx
- Security & Bug Audit Report
- Cognitive Load Assessment
- CSP detection (first-time only)
- Dynamic Thinking Level Recommendation
- live-target.mjs
- resolveLiveInjectionAnchor
- The Animation Decision Framework
- clip-path for Animation
- Performance Rules
- Gesture and Drag Interactions
- isScreenReaderOnlyTextStyle
- normalizeGitHubEvent
- CSS Transform Mastery
- The Sonner Principles (Building Loved Components)
- Spring Animations
- Handle fallback
- isGeneratedFile
- prisma.config.js
- Agentation Setup
- Core Philosophy
- Debugging Animations
- Heuristics Scoring Guide
- detect.mjs
- TradeChart.tsx
- hook.mjs
- proxy.ts
- run-browser-debug.js
- test-flow.js
- rules/graphify.md
- workflows/graphify.md
- cookie-parser
- csv-parser
- depd
- ioredis
- jsonwebtoken
- multer
- node-html-parser
- pdfkit
- pg
- prisma
- @prisma/adapter-pg
- analytics/loading.tsx
- dashboard/loading.tsx
- journal/loading.tsx
- settings/loading.tsx
- sitemap.ts
- app/support/loading.tsx
- trades/loading.tsx

## God Nodes (most connected - your core abstractions)
1. `useTranslation()` - 91 edges
2. `el()` - 55 edges
3. `toPersianDigits()` - 40 edges
4. `runHook()` - 32 edges
5. `setLiveState()` - 29 edges
6. `detectHtml()` - 28 edges
7. `handleKeyDown()` - 28 edges
8. `initGlobalBar()` - 28 edges
9. `useAuthStore` - 28 edges
10. `✅ Done` - 28 edges

## Surprising Connections (you probably didn't know these)
- `ManualTradeModal()` --indirect_call--> `payload()`  [INFERRED]
  apps/web/src/components/modals/ManualTradeModal.tsx → .agents/skills/impeccable/scripts/hook-lib.mjs
- `useReplayEngine()` --indirect_call--> `handleKeyDown()`  [INFERRED]
  apps/web/src/components/backtest/hooks/useReplayEngine.ts → .agents/skills/impeccable/scripts/live-browser.js
- `BottomNavBar()` --indirect_call--> `handleKeyDown()`  [INFERRED]
  apps/web/src/components/layout/BottomNavBar.tsx → .agents/skills/impeccable/scripts/live-browser.js
- `AppLayout()` --indirect_call--> `init()`  [INFERRED]
  apps/web/src/components/layout/AppLayout.tsx → .agents/skills/impeccable/scripts/live-browser.js
- `FilterBar()` --indirect_call--> `v()`  [INFERRED]
  apps/web/src/components/trades/FilterBar.tsx → .agents/skills/impeccable/scripts/modern-screenshot.umd.js

## Import Cycles
- None detected.

## Communities (202 total, 20 thin omitted)

### Community 0 - "معامله‌یار — Persian Trading Journal Platform"
Cohesion: 0.06
Nodes (34): 10. Key Risks & Mitigations, 11. Suggested Next Steps, 1. Project Overview, 2. System Architecture Overview, 3.1 Frontend, 3.2 Backend, 3.3 Database — PostgreSQL Schema (core tables), 3.4 Infrastructure (+26 more)

### Community 1 - "live-browser.js"
Cohesion: 0.03
Nodes (122): acceptedDomAlreadyClean(), addManualContextText(), applyPlaceholderSizingStyles(), applySvelteComponentVariantStyle(), bindEditBadgeProxy(), bufferToBase64(), buildCollapsible(), buildColorModels() (+114 more)

### Community 2 - "checks.mjs"
Cohesion: 0.05
Nodes (84): borderColorsFromStyle(), borderWidthsFromStyle(), checkBorders(), checkClippedOverflow(), checkCreamPalette(), checkElementBorders(), checkElementBordersDOM(), checkElementClippedOverflow() (+76 more)

### Community 3 - "el"
Cohesion: 0.09
Nodes (47): actionLabel(), applyConfigureBarChrome(), bindConfigureCountPillTooltip(), bindConfigureInlineControlHover(), bindConfigureModifierPillHover(), buildConfigureActionControl(), buildConfigureCountControl(), buildConfigureRow() (+39 more)

### Community 4 - "index.mjs"
Cohesion: 0.06
Nodes (68): addBrowserFindings(), addVisualContrastFindings(), addVisualContrastResult(), analyzeVisualContrast(), analyzeVisualContrastCandidate(), blendRgba(), browserColorsClose(), browserDesignSystemConfig() (+60 more)

### Community 5 - "live-inject.mjs"
Cohesion: 0.06
Nodes (62): detectCsp(), INLINE_HEADER_SIGNALS, LAYOUT_EXTS, MONOREPO_HELPER_SIGNALS, NUXT_ROUTE_RULES_SIGNALS, NUXT_SECURITY_SIGNALS, SCAN_EXTS, SKIP_DIRS (+54 more)

### Community 6 - "resumeSession"
Cohesion: 0.07
Nodes (62): applyOriginalAttrsToSvelteAnchor(), applySavedSessionMeta(), buildInsertPlaceholderSnapshotFromDom(), checkpointPayload(), clampVariantIndex(), clearHandled(), commitAcceptedSvelteComponentToDom(), elementMatchesOriginalMarkup() (+54 more)

### Community 7 - "TradesTable.tsx"
Cohesion: 0.12
Nodes (45): react, JournalPage(), EquityChart(), EquityChartProps, TradingCalendarProps, WeekdayPnlChart(), WeekdayPnlChartProps, DesktopTable() (+37 more)

### Community 8 - "package.json"
Cohesion: 0.08
Nodes (24): agentation, concurrently, impeccable, dependencies, impeccable, devDependencies, agentation, concurrently (+16 more)

### Community 9 - "hook-lib.mjs"
Cohesion: 0.07
Nodes (45): ACK_EXTS, applyConfigSource(), applyDetectorConfigSource(), applyPatchText(), clampByte(), cloneDefaultConfig(), CO_SCAN_STYLE_NAMES, colorIgnoreKey() (+37 more)

### Community 10 - "معامله‌یار — Run Commands"
Cohesion: 0.18
Nodes (10): 1. Start Database, 2. Run Database Migrations, 3. Generate Prisma Client, 3. Start API Server (port 3000), 4. Start Web App (port 3001), 5. Install MT5 Expert Advisor, Endpoints, Prerequisites (+2 more)

### Community 11 - "compilerOptions"
Cohesion: 0.25
Nodes (7): compilerOptions, esModuleInterop, module, moduleResolution, skipLibCheck, strict, target

### Community 12 - "showToast"
Cohesion: 0.07
Nodes (53): applyGlobalBarLabelState(), armPageChatForTyping(), attachSteerFocusDebug(), attachSteerFocusGuard(), buildSteerProcessingDots(), clearSteerAwaitTimer(), clearSteerFocusRecoverTimer(), collapsePageChat() (+45 more)

### Community 13 - "setLiveState"
Cohesion: 0.09
Nodes (69): abortSvelteComponentInjection(), applyEditing(), buildLocatorForLeaf(), buildPickedAnchorSnapshot(), cancelEditing(), cancelEditingToPicking(), cancelInsertConfigure(), cleanup() (+61 more)

### Community 14 - "modern-screenshot.umd.js"
Cohesion: 0.09
Nodes (52): ae(), be(), bt(), Ce(), Ct(), de(), dt(), _e() (+44 more)

### Community 15 - "live-commit-manual-edits.mjs"
Cohesion: 0.10
Nodes (50): allEntryIds(), argVal(), buildRepairBatch(), candidatesForEntry(), changedFilesSinceSnapshot(), clearAppliedEntries(), collectApplyOwnedFiles(), collectRollbackFiles() (+42 more)

### Community 16 - "trades/page.tsx"
Cohesion: 0.10
Nodes (31): TradesPage(), JournalEditor(), JournalEditorProps, ConnectExchangeModal(), ConnectExchangeModalProps, POPULAR_EXCHANGES, ExportModal(), ExportModalProps (+23 more)

### Community 17 - "useTranslation"
Cohesion: 0.08
Nodes (35): AdminSupportPage(), StatusFilter, View, LoginPage(), RegisterForm(), CONTENT, EaSetupHelpPage(), SupportPage() (+27 more)

### Community 18 - "impeccable-config.mjs"
Cohesion: 0.10
Nodes (48): applyDetectionConfigSource(), clampByte(), cleanIgnoreValueDisplay(), cloneDetectionConfig(), cloneRawDetectionConfig(), colorIgnoreKey(), DEFAULT_DETECTION_CONFIG, DETECTOR_CONFIG_KEYS (+40 more)

### Community 19 - "design-system.mjs"
Cohesion: 0.09
Nodes (51): addColorObject(), addDesignColor(), addRoundedScale(), addRoundedToken(), addSidecarColors(), addSidecarRadii(), addTypographyFonts(), canonicalDesignFindingKey() (+43 more)

### Community 20 - "live-server.mjs"
Cohesion: 0.09
Nodes (43): assembleLiveBrowserScript(), assertLiveBrowserScriptParts(), LIVE_BROWSER_SCRIPT_PARTS, readLiveBrowserScriptParts(), resolveLiveBrowserScriptParts(), acknowledgePendingEvent(), activeSessionSummaries(), agentPollingConnected() (+35 more)

### Community 21 - "useAuthStore"
Cohesion: 0.05
Nodes (42): AdminPage(), AdminReceipt, AdminStats, AdminTab, AdminUser, CouponCode, DashboardData, DashboardPage() (+34 more)

### Community 22 - "svelte-component.mjs"
Cohesion: 0.10
Nodes (44): applyLegacyDeferredAcceptsOnStartup(), appendCssToSvelteStyle(), appendSanitizedCssRule(), applyDeferredSvelteComponentAccepts(), bakeParamValuesInCss(), buildInsertVariantStub(), buildPropContract(), buildPropsScript() (+36 more)

### Community 23 - "hook-before-edit.mjs"
Cohesion: 0.11
Nodes (39): allow(), bumpCursorDenial(), cursorBlockMessage(), deny(), done(), escapeRegExp(), findingSignature(), firstMatch() (+31 more)

### Community 24 - "manual-apply.mjs"
Cohesion: 0.10
Nodes (36): addOpToManualApplyChunk(), APPLY_EVENT_HARD_TIMEOUT_MS, APPLY_EVENT_SOFT_DEADLINE_MS, buildManualApplyAgentAction(), clearManualApplyTransaction(), collectManualApplyFiles(), compactManualApplyBatch(), compactManualApplyCandidates() (+28 more)

### Community 25 - "hook-admin.mjs"
Cohesion: 0.14
Nodes (39): ACTIONS, addIgnoreFile(), addIgnoreRule(), addIgnoreValue(), DETECTOR_CONFIG_KEYS, detectorSection(), fileHasImpeccableHookMarker(), HOOK_MANIFEST_TARGETS (+31 more)

### Community 26 - "detect-antipatterns-browser.js"
Cohesion: 0.09
Nodes (34): checkBorders(), checkClippedOverflow(), checkElementBorders(), checkElementBordersDOM(), checkElementClippedOverflow(), checkElementClippedOverflowDOM(), checkElementItalicSerif(), checkElementItalicSerifDOM() (+26 more)

### Community 27 - "css-cascade.mjs"
Cohesion: 0.10
Nodes (27): applyStaticDeclaration(), buildBorderOverrideMap(), collectStaticCssRules(), compareStaticPriority(), cssPropToCamel(), expandStaticBoxValues(), expandStaticDeclaration(), extractStaticColor() (+19 more)

### Community 28 - "live-wrap.mjs"
Cohesion: 0.14
Nodes (34): argVal(), buildInsertWrapperLines(), computeInsertLine(), INSERT_POSITIONS, insertCli(), isInsertPosition(), resolveElementMatch(), buildSvelteComponentCssAuthoring() (+26 more)

### Community 29 - "design-parser.mjs"
Cohesion: 0.15
Nodes (33): buildColor(), CANONICAL_SECTIONS, collectBullets(), collectColorValues(), collectParagraphs(), detectFormat(), extractColors(), extractComponents() (+25 more)

### Community 30 - "✅ Done"
Cohesion: 0.06
Nodes (34): Admin Page (`src/app/admin/page.tsx`), Analytics Page (`src/app/analytics/page.tsx`), App Layout (`src/app/layout.tsx`), Authentication (`src/lib/auth.ts`, `src/app/(auth)/`), Contact Page (`src/app/contact/`), Dashboard Page (`src/app/dashboard/page.tsx`), Design System (`src/app/variables.scss`, `src/app/globals.scss`), ✅ Done (+26 more)

### Community 31 - "colorize.md"
Cohesion: 0.06
Nodes (32): Accent Color Application, Accessibility, Alpha Is A Design Smell, Assess Color Opportunity, Background & Surfaces, Balance & Refinement, Borders & Accents, Building Functional Palettes (+24 more)

### Community 32 - "live-accept.mjs"
Cohesion: 0.14
Nodes (32): acceptCli(), argVal(), buildCarbonizeReplacement(), decodeHtmlAttr(), deindentContent(), detectCommentSyntax(), escapeRegExp(), expandReplaceRange() (+24 more)

### Community 33 - "server.ts"
Cohesion: 0.11
Nodes (23): verifyAccessToken(), authenticate(), AuthRequest, requireAdmin(), router, router, router, router (+15 more)

### Community 34 - "live-copy-edit-agent.mjs"
Cohesion: 0.14
Nodes (31): applyMockWrites(), buildCopyEditBatchPrompt(), checkFrameworkSourceSyntax(), chooseCopyEditAgent(), COMMAND_AUTH_CACHE, commandAuthed(), commandExists(), compactBatchForPrompt() (+23 more)

### Community 35 - "detect-url.mjs"
Cohesion: 0.10
Nodes (39): detectUrl(), runVisualContrastFallback(), serializeDesignSystemForBrowser(), CSS_IN_JS_EXTENSIONS, detectText(), extFromFilePath(), extractCSSinJS(), extractStyleBlocks() (+31 more)

### Community 36 - "dependencies"
Cohesion: 0.07
Nodes (29): dependencies, axios, framer-motion, lightweight-charts, next, react-dom, sass, swr (+21 more)

### Community 37 - "compilerOptions"
Cohesion: 0.07
Nodes (27): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+19 more)

### Community 38 - "live-manual-edit-evidence.mjs"
Cohesion: 0.16
Nodes (26): analyzeSourceHint(), buildCandidatesForOp(), buildContextHintsByRef(), buildManualEditEvidence(), collectSearchFiles(), countOps(), decodeBasicHtml(), escapeRegExp() (+18 more)

### Community 39 - "detect-antipatterns.mjs"
Cohesion: 0.19
Nodes (22): confirm(), detectCli(), formatFindings(), formatFindingSummary(), handleStdin(), printUsage(), createBrowserDetector(), buildImportGraph() (+14 more)

### Community 40 - "documentRefForElement"
Cohesion: 0.10
Nodes (26): canRestoreManualEditElement(), copyEditContainerContext(), copyEditLeafContext(), cssIdent(), directMixedTextRestoreNodes(), documentRefClassSuffix(), documentRefForElement(), documentRefIdSuffix() (+18 more)

### Community 41 - "handleManualEditActivity"
Cohesion: 0.19
Nodes (24): clearStoredManualApplyState(), fetchPendingCount(), handleManualEditActivity(), hidePendingApplyDock(), manualApplyLoadingText(), manualApplyStateKey(), manualEditEventForCurrentPage(), numberOrNull() (+16 more)

### Community 42 - "live-poll.mjs"
Cohesion: 0.18
Nodes (24): completionAckForAcceptResult(), completionTypeForAcceptResult(), augmentEventWithAcceptHandling(), buildAcceptScriptArgs(), buildPollReplyPayload(), EVENT_TYPES_NEEDING_AGENT_REPLY, fetchNextEvent(), fetchServerStatus() (+16 more)

### Community 43 - "document.md"
Cohesion: 0.08
Nodes (24): Component translation rules, Narrative mapping, Pitfalls, Scan mode (approach C: auto-extract, then confirm descriptive language), Schema, Seed mode, Step 1: Confirm seed mode, Step 1: Find the design assets (+16 more)

### Community 44 - "detect-text.mjs"
Cohesion: 0.40
Nodes (9): addRules(), applyInlineIgnores(), getSet(), hasDirectives(), isInlineIgnored(), normalizeRule(), parseInlineIgnores(), parseRuleList() (+1 more)

### Community 45 - "insert-ui.mjs"
Cohesion: 0.11
Nodes (10): canCreateInsert(), clampPlaceholderSize(), computeInsertPosition(), groupSiblingRows(), hitSiblingInsertGap(), horizontalOverlap(), insertCreateDisabledReason(), insertLineCoords() (+2 more)

### Community 46 - "payments.ts"
Cohesion: 0.12
Nodes (17): DEFAULT_PRICES, receiptDir, receiptStorage, receiptUpload, router, getBaseUrl(), PayPingRequestResponse, requestPaypingPayment() (+9 more)

### Community 47 - "[locale]/page.tsx"
Cohesion: 0.11
Nodes (15): CellType, CompareItem, CompareRow, CompareSection, CountUp(), DATA, LandingPage(), PageProps (+7 more)

### Community 48 - "onboard.md"
Cohesion: 0.09
Nodes (22): Assess Onboarding Needs, Context Over Ceremony, Contextual Help, Design Onboarding Experiences, Documentation & Help, Empty State Design, Feature Discovery & Adoption, Guided Tours & Walkthroughs (+14 more)

### Community 49 - "collectVisualContrastCandidates"
Cohesion: 0.18
Nodes (14): addBrowserFindings(), addVisualContrastFindings(), addVisualContrastResult(), analyzeVisualContrast(), clearOverlays(), detachOverlay(), disconnectLazyVisualContrastObserver(), postExtensionError() (+6 more)

### Community 50 - "parseRgb"
Cohesion: 0.17
Nodes (24): checkColors(), checkElementAIPaletteDOM(), checkElementColors(), checkElementColorsDOM(), checkElementGlow(), checkElementGlowDOM(), checkElementIconTile(), checkElementIconTileDOM() (+16 more)

### Community 51 - "manual-edit-routes.mjs"
Cohesion: 0.19
Nodes (19): args, cwd, pageUrlFilter, remaining, compactManualLogText(), summarizeManualApplyFailures(), summarizeManualDiagnostics(), summarizeManualLogFile() (+11 more)

### Community 52 - "context.mjs"
Cohesion: 0.14
Nodes (24): buildMissingTargetDirective(), buildResolvedContextDirective(), buildTargetSelectionDirective(), buildUpdateDirective(), cli(), compareSemver(), computeUpdateDirective(), DESIGN_NAMES (+16 more)

### Community 53 - "routes/auth.ts"
Cohesion: 0.12
Nodes (14): redis, AccessTokenPayload, generateAccessToken(), generateRefreshToken(), rateLimit(), loginLimiter, otpRegisterSchema, registerLimiter (+6 more)

### Community 54 - "journal/page.tsx"
Cohesion: 0.30
Nodes (11): JournalPage(), TradingCalendar(), GREGORIAN_MONTH_NAMES, GREGORIAN_WEEKDAY_NAMES_SHORT, JALALI_MONTH_NAMES, WEEKDAY_NAMES_EN, WEEKDAY_NAMES_FA, WEEKDAY_NAMES_FA_SHORT (+3 more)

### Community 55 - "Auth Implementation Guide"
Cohesion: 0.10
Nodes (20): 1. Prisma Schema, 2. Install Dependencies, 3. Environment Variables, 4.1 Token utilities — `src/lib/tokens.ts`, 4.2 Auth middleware — `src/middleware/auth.ts`, 4.3 Validation schemas — `src/validators/auth.ts`, 4.4 Auth routes — `src/routes/auth.ts`, 4.5 Register the router — `src/index.ts` (+12 more)

### Community 56 - "✅ Done"
Cohesion: 0.10
Nodes (20): Account Token Routes (`src/routes/accountTokens.ts`) — `/api`, Admin Routes (`src/routes/admin.ts`) — `/api/admin`, API Progress — TradeKav (تریدکاو), Auth Routes (`src/routes/auth.ts`) — `/api/auth`, Dashboard Routes (`src/routes/dashboard.ts`) — `/api/dashboard`, Database Schema (`src/prisma/schema.prisma`), ✅ Done, Express Server (`src/server.ts`) (+12 more)

### Community 57 - "Polish Systematically"
Cohesion: 0.10
Nodes (19): Clean Up, Code Quality, Color & Contrast, Content & Copy, Design System Discovery, Edge Cases & Error States, Final Verification, Forms & Inputs (+11 more)

### Community 58 - "GENERIC_FONTS"
Cohesion: 0.21
Nodes (13): checkPageTypography(), checkStaticPageTypography(), checkPageTypography(), checkTypography(), resolveSerif(), BRAND_FONT_DOMAINS, GENERIC_FONTS, GITHUB_DOMAINS (+5 more)

### Community 59 - "readLiveServerInfo"
Cohesion: 0.21
Nodes (17): isLiveServerPidReachable(), readLiveServerInfo(), completeCli(), completeThroughServer(), parseArgs(), readServerInfo(), collectManualApplyFiles(), manualApplyReplyCommand() (+9 more)

### Community 60 - "routes/tradeSync.ts"
Cohesion: 0.11
Nodes (20): authenticateAccountToken(), checkAccountLimit(), checkImportPermission(), checkSyncPermission(), checkTradeLimit(), PLAN_ACCOUNT_LIMITS, router, storage (+12 more)

### Community 61 - "Delight Techniques"
Cohesion: 0.11
Nodes (18): Appropriate to Context, Assess Delight Opportunities, Celebration Moments, Compound Over Time, Delight Amplifies, Never Blocks, Delight Principles, Delight Techniques, Easter Eggs & Hidden Delights (+10 more)

### Community 62 - "impeccable-paths.mjs"
Cohesion: 0.24
Nodes (15): firstExisting(), getDesignSidecarCandidates(), getDesignSidecarPath(), getImpeccableDir(), getLegacyLiveConfigPath(), getLegacyLiveServerPath(), getLiveAnnotationsDir(), getLiveConfigPath() (+7 more)

### Community 63 - "parseAnyColor"
Cohesion: 0.14
Nodes (20): borderColorsFromStyle(), borderWidthsFromStyle(), checkCreamPalette(), checkElementGptBorderShadow(), checkElementGptBorderShadowDOM(), checkGptThinBorderWideShadow(), checkQuality(), colorsNearlyMatch() (+12 more)

### Community 64 - "detect-html.mjs"
Cohesion: 0.11
Nodes (35): BacktestPage(), BacktestChart(), BacktestChartProps, DrawingShape, PositionLines, PositionState, resolvedSL(), resolvedTP() (+27 more)

### Community 65 - "Interaction Design"
Cohesion: 0.12
Nodes (17): CSS Anchor Positioning, Destructive Actions: Undo > Confirm, Dropdown & Overlay Positioning, Fixed Positioning Fallback, Focus Rings: Do Them Right, Form Design: The Non-Obvious, Gesture Discoverability, Interaction Design (+9 more)

### Community 66 - "onAnnotDown"
Cohesion: 0.15
Nodes (21): applyPlaceholderDimensions(), beginEditPin(), buildAnnotationsForCapture(), buildPinElement(), cancelEditingPin(), clampPlaceholderSize(), finalizeEditingPin(), initAnnotOverlay() (+13 more)

### Community 67 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, bcryptjs, cookie-parser, csv-parser, multer, node-cron, pg, prisma (+11 more)

### Community 68 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, ts-node, @types/bcryptjs, @types/cookie-parser, @types/express, @types/jsonwebtoken, @types/multer, @types/node (+9 more)

### Community 69 - "adapt.md"
Cohesion: 0.12
Nodes (15): Assess Adaptation Challenge, Content Adaptation, Desktop Adaptation (Mobile → Desktop), Email Adaptation (Web → Email), Implement Adaptations, Layout Adaptation Techniques, Mobile Adaptation (Desktop → Mobile), Navigation Adaptation (+7 more)

### Community 70 - "Improve Copy Systematically"
Cohesion: 0.12
Nodes (15): Apply Clarity Principles, Assess Current Copy, Button & CTA Text, Confirmation Dialogs, Empty States, Error Messages, Form Labels & Instructions, Help Text & Tooltips (+7 more)

### Community 71 - "UX Writing"
Cohesion: 0.12
Nodes (16): Avoid Redundant Copy, Confirmation Dialogs: Use Sparingly, Consistency: The Terminology Problem, Don't Blame the User, Empty States Are Opportunities, Error Message Templates, Error Messages: The Formula, Form Instructions (+8 more)

### Community 72 - "Handle `generate`"
Cohesion: 0.12
Nodes (16): 1. Read the screenshot (if present), 2. Wrap the element, 3. Load the action's reference, 4. Plan three variants: identity first, then mode, then axes, 5. Apply the freeform prompt (if present), 6. Write all variants in a single edit, 7. Parameters (composition-sized, 0–4 per variant), 8. Signal done (+8 more)

### Community 73 - "Phase 1: Discovery Interview"
Cohesion: 0.12
Nodes (15): Anti-Goals, Brief Structure, Constraints, Content & Data, Design Direction, How to use the probes, Important limits, Interview cadence (+7 more)

### Community 74 - "Typography"
Cohesion: 0.12
Nodes (16): Accessibility Considerations, Anti-reflexes worth defending against, Classic Typography Principles, Fluid Type, Font Selection & Pairing, Modern Web Typography, Modular Scale & Hierarchy, OpenType Features (+8 more)

### Community 75 - "resolveContext"
Cohesion: 0.16
Nodes (15): contextSourcePath(), contextSourceStatus(), firstExisting(), isPathInside(), isPathInsideOrEqual(), MONOREPO_FALLBACK_PROJECT_DIRS, nearestProjectLikeRoot(), resolveCandidateContextSummary() (+7 more)

### Community 76 - "checkElementDesignSystemDOM"
Cohesion: 0.13
Nodes (16): browserColorsClose(), browserHasDirectText(), browserRadiusTokens(), browserSampleText(), buildSelectorSegment(), checkElementDesignSystemDOM(), generateSelector(), isBrowserDesignColorAllowed() (+8 more)

### Community 77 - "Known Issues & Improvements — trade-journal-demo"
Cohesion: 0.12
Nodes (15): 1. Sorting doesn't refetch — only re-sorts the current page, 2. `pnl` goes stale on edit, 3. No rate limiting on auth routes, 4. Form errors aren't announced to screen readers, 5. Numeric coercion breaks on non-plain-numeral input, 6. Schema doesn't support partial closes, 7. Equity chart aggregates client-side, 8. No optimistic UI on trade submit (+7 more)

### Community 78 - "Generate Report"
Cohesion: 0.13
Nodes (14): 1. Accessibility (A11y), 2. Performance, 3. Theming, 4. Responsive Design, 5. Anti-Patterns (CRITICAL), Anti-Patterns Verdict, Audit Health Score, Detailed Findings by Severity (+6 more)

### Community 79 - "Crypto Payment Integration Plan - Direct Blockchain Verification (USDT-TRC20 / TRX)"
Cohesion: 0.13
Nodes (14): 1. Database Model Changes, 2. Configuration & Admin Settings, 3. Backend Implementation (API), 4. Frontend Implementation, 5. Verification Plan, A. Checkout Modal Integration, A. Query Settings Endpoint, Automated/Unit Tests (+6 more)

### Community 80 - "Init Flow"
Cohesion: 0.13
Nodes (14): Accessibility & Inclusion, Brand & Personality, Init Flow, Interview mode, not confirmation mode, Minimum viable interview, Register (ask first; it shapes everything below), Step 1: Load current state, Step 2: Explore the codebase (+6 more)

### Community 81 - "SWR Migration Plan for Trade Journal"
Cohesion: 0.13
Nodes (14): 1. Prerequisites & Installation, 2. Configuration & Setup, 3. Hook Migration Strategy, 4. Page Integration & Cleanups, 5. Cache Mutation & Optimistic Updates, 6. Verification Checklist, A. Dashboard (`apps/web/src/app/dashboard/page.tsx`), A. Define a Global Fetcher Wrapper (+6 more)

### Community 82 - "Brand register"
Cohesion: 0.14
Nodes (14): Brand bans (on top of the shared absolute bans), Brand permissions, Brand register, Color, Font selection procedure, Imagery, Layout, Motion (+6 more)

### Community 83 - "live.md"
Cohesion: 0.14
Nodes (13): Cleanup, Exit, Handle `accept`, Handle `discard`, Handle `manual_edit_apply`, Handle `prefetch`, Handle `steer`, Poll loop (+5 more)

### Community 84 - "optimize.md"
Cohesion: 0.14
Nodes (13): Animation Performance, Assess Performance Issues, Core Web Vitals Optimization, Cumulative Layout Shift (CLS < 0.1), First Input Delay (FID < 100ms) / INP (< 200ms), Largest Contentful Paint (LCP < 2.5s), Loading Performance, Network Optimization (+5 more)

### Community 85 - "context-signals.mjs"
Cohesion: 0.22
Nodes (14): extractRegister(), loadContext(), safeRead(), cli(), COMMON_DEV_PORTS, devServerSignals(), gatherSignals(), gitSignals() (+6 more)

### Community 86 - "Hybrid Multi-Language Support Plan (English & Persian)"
Cohesion: 0.14
Nodes (13): 1. Translation Dictionaries (Shared Locales), 2. Approach A: Public Pages Localization, 3. Approach B: Dashboard Pages Localization, 4. Code Example (The Translation Hook), AppLayout (`apps/web/src/components/layout/AppLayout.tsx`), Architecture Overview, Hybrid Multi-Language Support Plan (English & Persian), LanguageContext (`apps/web/src/components/LanguageContext.tsx`) (+5 more)

### Community 87 - "resolveLengthPx"
Cohesion: 0.15
Nodes (15): checkElementOversizedH1(), checkElementOversizedH1DOM(), checkElementQuality(), checkElementQualityDOM(), checkOversizedH1(), checkRepeatedSectionKickers(), checkRepeatedSectionKickersDOM(), checkRepeatedSectionKickersFromDoc() (+7 more)

### Community 89 - "event-validation.mjs"
Cohesion: 0.26
Nodes (12): FORBIDDEN_MANUAL_EDIT_TEXT_CHARS, INSERT_POSITIONS, isValidId(), isValidVariantId(), validateAnnotationFields(), validateEvent(), validateInsertGenerate(), validateManualEditEvent() (+4 more)

### Community 90 - "typeset.md"
Cohesion: 0.15
Nodes (11): Assess Current Typography, Establish Hierarchy, Fix Readability, Font Selection, Improve Typography Systematically, Live-mode signature params, Plan Typography Improvements, Refine Details (+3 more)

### Community 91 - "impeccable/SKILL.md"
Cohesion: 0.15
Nodes (11): Constraints, Failure modes, Flow, $impeccable hooks, Intentional findings, Routing, Commands, Hooks (+3 more)

### Community 92 - "Chat Conversation"
Cohesion: 0.11
Nodes (18): 1. Define Dockerfiles, 2. Create a Production `docker-compose.prod.yml`, 3. GitHub Actions Workflow (`.github/workflows/deploy.yml`), Chat Conversation, How the Vercel-like automation works with Coolify:, Next Steps, Option 1: GitHub Actions (GitOps Push-based) — *The Standard Way*, Option 2: Install Coolify on your VPS — *The Open-Source Vercel Alternative (Highly Recommended)* (+10 more)

### Community 93 - "overdrive.md"
Cohesion: 0.15
Nodes (12): Assess What "Extraordinary" Means Here, For data-heavy interfaces, For functional UI, For performance-critical UI, For visual/marketing surfaces, Implement with Discipline, Iterate with Browser Automation, Performance rules (+4 more)

### Community 94 - "critique-storage.mjs"
Cohesion: 0.32
Nodes (11): kebab(), listSnapshotsForSlug(), main(), nowFilenameStamp(), parseFrontmatter(), readLatestSnapshot(), readTrend(), serializeFrontmatter() (+3 more)

### Community 95 - "VPS Deployment Guide using Coolify"
Cohesion: 0.15
Nodes (12): 1. Initial VPS Setup & Coolify Installation, 2. DNS Configuration (Prerequisite), 3. Set Up PostgreSQL Database in Coolify, 4. Connect your Git Repository, 5. Deploy Backend API, 6. Deploy Frontend Web (Next.js), 7. Static Upload Directory Persistency (Multer Uploads), Configure Docker Registry Mirror (Required for Restricted Networks like Iran) (+4 more)

### Community 96 - "sampleCssBackground"
Cohesion: 0.24
Nodes (13): firstCssUrl(), getLayerValue(), loadVisualContrastImage(), parseObjectPosition(), parsePositionPair(), parsePositionToken(), pointToImageSource(), resolveObjectImageRect() (+5 more)

### Community 97 - "showBar"
Cohesion: 0.20
Nodes (16): applyParamDefaults(), applyParamValue(), buildCyclingRow(), closedClipPath(), cycleVariant(), getVisibleVariantEl(), hideParamsPanel(), navBtn() (+8 more)

### Community 98 - "services/tradeSync.ts"
Cohesion: 0.39
Nodes (7): LogEntry, logError(), logFatal(), logInfo(), LogLevel, logSystem(), logWarn()

### Community 99 - "DESIGN.md"
Cohesion: 0.15
Nodes (12): Brand & Style, Buttons, Cards & Trade Logs, Chips & Badges, Colors, Components, Elevation & Depth, Input Fields (+4 more)

### Community 100 - "animate.md"
Cohesion: 0.17
Nodes (11): Assess Animation Opportunities, Delight Moments, Entrance Animations, Feedback & Guidance, Implement Animations, Micro-interactions, Navigation & Flow, Plan Animation Strategy (+3 more)

### Community 101 - "bolder.md"
Cohesion: 0.17
Nodes (11): Amplify the Design, Assess Current State, Color Intensification, Composition Boldness, Motion & Animation, Plan Amplification, Register, Spatial Drama (+3 more)

### Community 102 - "Simplify the Design"
Cohesion: 0.17
Nodes (11): Assess Current State, Code Simplification, Content Simplification, Document Removed Complexity, Information Architecture, Interaction Simplification, Layout Simplification, Plan Simplification (+3 more)

### Community 103 - "Hardening Dimensions"
Cohesion: 0.17
Nodes (11): Accessibility Resilience, Assess Hardening Needs, Edge Cases & Boundary Conditions, Error Handling, Hardening Dimensions, Input Validation & Sanitization, Internationalization (i18n), Performance Resilience (+3 more)

### Community 104 - "live.mjs"
Cohesion: 0.40
Nodes (9): resolveTargetSelection(), __dirname, ensureServerRunning(), globToRegex(), liveCli(), missingLiveContext(), runScript(), safeParse() (+1 more)

### Community 105 - "collectBrowserFindings"
Cohesion: 0.18
Nodes (13): browserDesignSystemConfig(), browserFindingsFromMap(), browserPrimaryFont(), checkBrowserDesignSystemSources(), checkHtmlPatterns(), checkPageQualityDOM(), checkPageQualityFromDoc(), checkTypography() (+5 more)

### Community 106 - "ui-core.mjs"
Cohesion: 0.23
Nodes (10): createLiveBrowserDomHelpers(), activeElementDeep(), appendStyleToLiveUiRoot(), appendToLiveUiRoot(), escapeCssIdent(), getLiveUiElementById(), LIVE_CHROME_MOUNT_CONTRACT, LIVE_UI_COMPONENT_IDS (+2 more)

### Community 107 - "session-store.mjs"
Cohesion: 0.24
Nodes (10): getLegacyLiveSessionsDir(), applyEvent(), baseSnapshot(), COMPLETED_PHASES, getJournalPath(), getSnapshotPath(), rebuildSnapshotFromJournal(), safeSessionId() (+2 more)

### Community 108 - "cryptoSync.ts"
Cohesion: 0.31
Nodes (8): decrypt(), encrypt(), checkCryptoPermission(), router, stringToHash(), syncExchangeTrades(), SyncResult, testConnection()

### Community 109 - "critique.md"
Cohesion: 0.18
Nodes (10): Action Summary, Ask the User, Assessment A: Design Review, Assessment B: Detector + Browser Evidence, Assessment Orchestration, Hard Invariants, Persist the Snapshot, Purpose (+2 more)

### Community 110 - "Nielsen's 10 Heuristics"
Cohesion: 0.18
Nodes (11): 10. Help and Documentation, 1. Visibility of System Status, 2. Match Between System and Real World, 3. User Control and Freedom, 4. Consistency and Standards, 5. Error Prevention, 6. Recognition Rather Than Recall, 7. Flexibility and Efficiency of Use (+3 more)

### Community 111 - "quieter.md"
Cohesion: 0.18
Nodes (10): Assess Current State, Color Refinement, Composition Refinement, Motion Reduction, Plan Refinement, Refine the Design, Register, Simplification (+2 more)

### Community 112 - "discoverTargetCandidates"
Cohesion: 0.18
Nodes (17): directChildDirs(), discoverRootsForPattern(), discoverTargetCandidates(), escapeRegExp(), expandSimplePattern(), findTargetExample(), isCandidateProjectRoot(), isExcludedByWorkspacePattern() (+9 more)

### Community 113 - "SAFE_TAGS"
Cohesion: 0.18
Nodes (24): isNeutralBorderColor(), checkColors(), checkElementAIPaletteDOM(), checkElementColors(), checkElementColorsDOM(), checkElementGlow(), checkElementGlowDOM(), checkElementIconTile() (+16 more)

### Community 114 - "readConfig"
Cohesion: 0.14
Nodes (24): barPaletteForTheme(), brandMarkSvg(), buildParamsPanel(), detectPageTheme(), ensureAgentPollTooltip(), fetchAgentPollingStatus(), formatRangeValue(), hideAgentPollTooltip() (+16 more)

### Community 115 - "palette.mjs"
Cohesion: 0.24
Nodes (7): args, buildWeights(), hashUnit(), pickSeed(), seed, SEEDS, weightedPick()

### Community 116 - "pin.mjs"
Cohesion: 0.25
Nodes (9): __dirname, findHarnessDirs(), generatePinnedSkill(), HARNESS_DIRS, loadCommandMetadata(), pin(), root, unpin() (+1 more)

### Community 117 - "General rules"
Cohesion: 0.18
Nodes (11): Absolute bans, Color, Color & Theme, Design guidance, General rules, Interaction, Layout, Motion (+3 more)

### Community 118 - "api/package.json"
Cohesion: 0.18
Nodes (10): name, prisma, schema, private, scripts, build, dev, prisma:migrate (+2 more)

### Community 119 - "dashboard.ts"
Cohesion: 0.24
Nodes (8): dateToTehranDay(), EdgeInsight, generateEdgeInsight(), getMonthDateStrings(), getTehranDateStr(), getTradingSession(), router, WEEKDAY_NAMES

### Community 120 - "Self-Hosted Mail Server Setup Guide (Stalwart + Coolify)"
Cohesion: 0.15
Nodes (12): 1. Coolify Configuration (Docker Compose), 2. Restoring Existing Configurations (If moving volumes), 3. SSL/TLS Certificate Setup (Let's Encrypt), 4. DNS Configuration, 5. Connecting Mail Clients, Compose File (`docker-compose.yml`), Domain Routing Settings in Coolify GUI, Gmail Integration (Send Mail As) (+4 more)

### Community 121 - "mistakeDetector.ts"
Cohesion: 0.31
Nodes (10): checkNoSL(), checkRevengeTrade(), checkSLNotRespected(), checkUnusualSize(), checkWeakHour(), checkWeakStrategy(), detectMistakes(), getTeheranHour() (+2 more)

### Community 122 - "@prisma/client"
Cohesion: 0.18
Nodes (10): compilerOptions, outDir, rootDir, types, extends, include, node, @prisma/client (+2 more)

### Community 123 - "Responsive Design"
Cohesion: 0.20
Nodes (10): Breakpoints: Content-Driven, Detect Input Method, Not Just Screen Size, Layout Adaptation Patterns, Mobile-First: Write It Right, Picture Element for Art Direction, Responsive Design, Responsive Images: Get It Right, Safe Areas: Handle the Notch (+2 more)

### Community 124 - "Craft Flow"
Cohesion: 0.20
Nodes (10): Craft Flow, Gates: do not compress, Production bar, Step 0: Project Foundation, Step 1: Shape the Design, Step 2: Load References, Step 3: Visual Direction & Assets (Harness-Gated), Step 4: Build to Production Quality (+2 more)

### Community 125 - "Generate Combined Critique Report"
Cohesion: 0.20
Nodes (10): Anti-Patterns Verdict, Design Health Score, Generate Combined Critique Report, Minor Observations, Overall Impression, Persona Red Flags, Priority Issues, Questions to Consider (+2 more)

### Community 126 - "Product register"
Cohesion: 0.20
Nodes (9): Color, Components, Layout, Motion, Product bans (on top of the shared absolute bans), Product permissions, Product register, The product slop test (+1 more)

### Community 127 - "resolveWorkspaceProjectRoot"
Cohesion: 0.15
Nodes (21): bumpEditCount(), clampGroupedToBudget(), clampToBudget(), dedupeAgainstCache(), depthIsSet(), directiveFooter(), ensureFile(), ensureSession() (+13 more)

### Community 128 - "normalizeIgnoreValueEntries"
Cohesion: 0.36
Nodes (10): cleanIgnoreValueDisplay(), extractFindingIgnoreValue(), extractFindingIgnoreValueRaw(), extractMotionIgnoreValue(), filterFindings(), formatFindingIgnoreCommand(), isIgnoredFindingValue(), normalizeIgnoreRule() (+2 more)

### Community 129 - "syncEditBadgeHitProxies"
Cohesion: 0.15
Nodes (19): averageRgb01(), captureAndEmit(), captureElementFromRenderedAncestor(), captureElementToBlob(), compileShader(), cssColorToRgb01(), dominantRgb01(), findBackdropAncestor() (+11 more)

### Community 130 - "Toaster.tsx"
Cohesion: 0.29
Nodes (7): ICON_MAP, Toaster(), ConfirmConfig, NotificationState, Toast, ToastType, useNotificationStore

### Community 131 - "Design Engineering"
Cohesion: 0.22
Nodes (8): Accessibility, Design Engineering, Initial Response, prefers-reduced-motion, Review Checklist, Review Format (Required), Stagger Animations, Touch device hover states

### Community 132 - "craft.md"
Cohesion: 0.22
Nodes (5): Assess Current Layout, Live-mode signature params, Plan Layout Improvements, Register, Verify Layout Improvements

### Community 133 - "Codex: Visual Direction & Asset Production"
Cohesion: 0.22
Nodes (9): After This File, Codex: Visual Direction & Asset Production, Four stop points before code, Step A: Explore Directions with the User, Step B: Generate the Brand Palette First, Step C: Generate 1-3 Visual Mocks Against the Palette, Step D: Approval Loop, Step E: Mock Fidelity Inventory (+1 more)

### Community 134 - "Common Cognitive Load Violations"
Cohesion: 0.22
Nodes (9): 1. The Wall of Options, 2. The Memory Bridge, 3. The Hidden Navigation, 4. The Jargon Barrier, 5. The Visual Noise Floor, 6. The Inconsistent Pattern, 7. The Multi-Task Demand, 8. The Context Switch (+1 more)

### Community 135 - "settings.ts"
Cohesion: 0.22
Nodes (8): avatarDir, avatarStorage, avatarUpload, DEFAULT_CARD_DETAILS, DEFAULT_CRYPTO_DETAILS, DEFAULT_PRICES, PLAN_ACCOUNT_LIMITS, router

### Community 136 - "TradeKav EA — Trade Sync (MT4 & MT5)"
Cohesion: 0.22
Nodes (8): Files, How it works (MT4), How it works (MT5), JSON payload format, Notes, Setup (MT4), Setup (MT5), TradeKav EA — Trade Sync (MT4 & MT5)

### Community 137 - "Component Building Principles"
Cohesion: 0.25
Nodes (8): Animate enter states with @starting-style, Buttons must feel responsive, Component Building Principles, Make popovers origin-aware, Never animate from scale(0), Tooltips: skip delay on subsequent hovers, Use blur to mask imperfect transitions, Use CSS transitions over keyframes for interruptible UI

### Community 138 - "Technical Implementation"
Cohesion: 0.25
Nodes (8): Accessibility, CSS Animations, JavaScript Animation, Motion Materials, Perceived Performance, Performance, Technical Implementation, Timing & Easing

### Community 139 - "Persona-Based Design Testing"
Cohesion: 0.25
Nodes (8): 1. Impatient Power User: "Alex", 2. Confused First-Timer: "Jordan", 3. Accessibility-Dependent User: "Sam", 4. Deliberate Stress Tester: "Riley", 5. Distracted Mobile User: "Casey", Persona-Based Design Testing, Project-Specific Personas, Selecting Personas

### Community 140 - "Extract Flow"
Cohesion: 0.25
Nodes (7): Extract Flow, Step 1: Discover the Design System, Step 2: Identify Patterns, Step 3: Plan Extraction, Step 4: Extract & Enrich, Step 5: Migrate, Step 6: Document

### Community 141 - "Improve Layout Systematically"
Cohesion: 0.25
Nodes (8): Break Card Grid Monotony, Choose the Right Layout Tool, Create Visual Rhythm, Establish a Spacing System, Improve Layout Systematically, Manage Depth & Elevation, Optical Adjustments, Strengthen Visual Hierarchy

### Community 142 - "The Toolkit"
Cohesion: 0.25
Nodes (8): Animate complex properties, Interact with the device, Make data feel alive, Make transitions feel cinematic, Push performance boundaries, Render beyond CSS, The Toolkit, Tie animation to scroll position

### Community 143 - "readWorkspacePatterns"
Cohesion: 0.25
Nodes (9): findMonorepoRoot(), hasFallbackWorkspaceChildren(), hasGitBoundary(), isMonorepoRoot(), MONOREPO_MARKER_FILES, readJson(), readLernaWorkspaces(), readPackageWorkspaces() (+1 more)

### Community 144 - "FilterBar.tsx"
Cohesion: 0.32
Nodes (6): FilterBar(), FilterBarProps, Select(), SelectOption, SelectProps, getSymbolFilterOptions()

### Community 145 - "Security & Bug Audit Report"
Cohesion: 0.25
Nodes (7): Critical (fix immediately), High, Low, Medium, Security & Bug Audit Report, Summary, Top 5 Fixes (Highest Impact)

### Community 146 - "Cognitive Load Assessment"
Cohesion: 0.29
Nodes (7): Cognitive Load Assessment, Cognitive Load Checklist, Extraneous Load: Bad Design, Germane Load: Learning Effort, Intrinsic Load: The Task Itself, The Working Memory Rule, Three Types of Cognitive Load

### Community 147 - "CSP detection (first-time only)"
Cohesion: 0.29
Nodes (7): append-arrays, append-string, Consent prompt template, CSP detection (first-time only), Drift-heal warning, First-time setup (config missing or invalid), Troubleshooting

### Community 148 - "Dynamic Thinking Level Recommendation"
Cohesion: 0.40
Nodes (4): Dynamic Thinking Level Recommendation, Example Output Format:, Prisma 7 Configuration Rules, Rules for the Trade Journal Assistant

### Community 149 - "live-target.mjs"
Cohesion: 0.33
Nodes (6): resolveProjectRoot(), getLegacyLiveAnnotationsDir(), parseTargetOptions(), parseTargetPath(), TargetArgError, resolveLiveTarget()

### Community 150 - "resolveLiveInjectionAnchor"
Cohesion: 0.12
Nodes (16): 10. Step backward has arbitrary floor of 10 (LOW) — **FIXED**, 11. Order sidebar state synchronization (LOW) — **FIXED**, 1. Running PnL mismatch in OrderPanel (HIGH) — **FIXED**, 2. Max drawdown loop direction — **CORRECTED (FALSE FINDING)**, 3. `handleSaveSession` swallows errors (HIGH) — **FIXED**, 4. R-multiple when SL not set (LOW) — **FIXED**, 5. Race condition in `closePosition` (LOW) — **FIXED**, 6. Hardcoded English + emojis on chart (MEDIUM) — **FIXED** (+8 more)

### Community 151 - "The Animation Decision Framework"
Cohesion: 0.33
Nodes (6): 1. Should this animate at all?, 2. What is the purpose?, 3. What easing should it use?, 4. How fast should it be?, Perceived performance, The Animation Decision Framework

### Community 152 - "clip-path for Animation"
Cohesion: 0.33
Nodes (6): clip-path for Animation, Comparison sliders, Hold-to-delete pattern, Image reveals on scroll, Tabs with perfect color transitions, The inset shape

### Community 153 - "Performance Rules"
Cohesion: 0.33
Nodes (6): CSS animations beat JS under load, CSS variables are inheritable, Framer Motion hardware acceleration caveat, Only animate transform and opacity, Performance Rules, Use WAAPI for programmatic CSS animations

### Community 155 - "Gesture and Drag Interactions"
Cohesion: 0.33
Nodes (6): Damping at boundaries, Friction instead of hard stops, Gesture and Drag Interactions, Momentum-based dismissal, Multi-touch protection, Pointer capture for drag

### Community 156 - "isScreenReaderOnlyTextStyle"
Cohesion: 0.47
Nodes (6): clippedByInset(), clippedByRect(), expandBoxShorthand(), firstMetricLengthPx(), isScreenReaderOnlyTextStyle(), metricLengthPx()

### Community 157 - "normalizeGitHubEvent"
Cohesion: 0.22
Nodes (11): analyzeVisualContrastCandidate(), blendRgba(), checkElementTextOverflowDOM(), clampByte(), classSelector(), collectVisualContrastCandidates(), collectVisualContrastReasons(), getDirectText() (+3 more)

### Community 158 - "CSS Transform Mastery"
Cohesion: 0.40
Nodes (5): 3D transforms for depth, CSS Transform Mastery, scale() scales children too, transform-origin, translateY with percentages

### Community 159 - "The Sonner Principles (Building Loved Components)"
Cohesion: 0.40
Nodes (5): Asymmetric enter/exit timing, Cohesion matters, Review your work the next day, The opacity + height combination, The Sonner Principles (Building Loved Components)

### Community 160 - "Spring Animations"
Cohesion: 0.40
Nodes (5): Interruptibility advantage, Spring Animations, Spring-based mouse interactions, Spring configuration, When to use springs

### Community 161 - "Handle fallback"
Cohesion: 0.40
Nodes (5): Handle fallback, Step 1: Identify where the element actually lives, Step 2: Show three variants in the DOM for preview, Step 3: On accept, write to true source, Step 4: On discard, clean up the served file

### Community 162 - "isGeneratedFile"
Cohesion: 0.53
Nodes (5): hasGeneratedHeader(), HEADER_MARKERS, isGeneratedFile(), isGitIgnored(), searchDir()

### Community 163 - "prisma.config.js"
Cohesion: 0.40
Nodes (4): { config }, { defineConfig }, envPath, path

### Community 164 - "Agentation Setup"
Cohesion: 0.50
Nodes (3): Agentation Setup, Notes, Steps

### Community 165 - "Core Philosophy"
Cohesion: 0.50
Nodes (4): Beauty is leverage, Core Philosophy, Taste is trained, not innate, Unseen details compound

### Community 166 - "Debugging Animations"
Cohesion: 0.50
Nodes (4): Debugging Animations, Frame-by-frame inspection, Slow motion testing, Test on real devices

### Community 167 - "Heuristics Scoring Guide"
Cohesion: 0.50
Nodes (4): Heuristics Scoring Guide, Issue Severity (P0–P3), Reference Material, Score Summary

### Community 168 - "detect.mjs"
Cohesion: 0.50
Nodes (3): candidates, detectorPath, __dirname

### Community 169 - "TradeChart.tsx"
Cohesion: 0.50
Nodes (3): CandlestickData, TradeChart(), TradeChartProps

### Community 170 - "hook.mjs"
Cohesion: 0.83
Nodes (3): writeAuditLog(), main(), readStdin()

### Community 177 - "cookie-parser"
Cohesion: 0.36
Nodes (8): coLocatedStylesheets(), expandScanTargets(), hasPathTraversal(), isInsideProject(), normalizeScanTargets(), parseStaticStyleImports(), STYLE_EXTS, UI_CODE_EXTS

### Community 182 - "multer"
Cohesion: 0.40
Nodes (5): checkElementHeroEyebrow(), checkElementHeroEyebrowDOM(), checkHeroEyebrow(), isAccentColor(), resolveVarRefs()

### Community 185 - "pg"
Cohesion: 0.60
Nodes (3): SubscriptionBanners(), SubscriptionBannersProps, SubStatus

### Community 198 - "sitemap.ts"
Cohesion: 0.24
Nodes (3): TopicPageProps, TopicData, TOPICS_DATA

## Knowledge Gaps
- **1046 isolated node(s):** `COMMON_DEV_PORTS`, `SOURCE_DIRS`, `PRODUCT_NAMES`, `DESIGN_NAMES`, `FALLBACK_DIRS` (+1041 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `el()` connect `el` to `live-browser.js`, `checks.mjs`, `detect-url.mjs`, `index.mjs`, `GENERIC_FONTS`, `showBar`, `collectBrowserFindings`, `checkElementDesignSystemDOM`, `showToast`, `setLiveState`, `readConfig`, `design-system.mjs`, `resolveLengthPx`, `detect-antipatterns-browser.js`, `css-cascade.mjs`, `normalizeGitHubEvent`, `parseAnyColor`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `buffer` connect `live-inject.mjs` to `isGeneratedFile`, `detect-antipatterns.mjs`, `hook.mjs`, `cryptoSync.ts`, `manual-edit-routes.mjs`, `live-server.mjs`, `hook-before-edit.mjs`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `useTranslation()` connect `useTranslation` to `detect-html.mjs`, `Toaster.tsx`, `TradesTable.tsx`, `trades/page.tsx`, `FilterBar.tsx`, `useAuthStore`, `journal/page.tsx`, `pg`, `analytics/loading.tsx`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Are the 29 inferred relationships involving `el()` (e.g. with `browserFindingsFromMap()` and `collectVisualContrastCandidates()`) actually correct?**
  _`el()` has 29 INFERRED edges - model-reasoned connections that need verification._
- **What connects `COMMON_DEV_PORTS`, `SOURCE_DIRS`, `PRODUCT_NAMES` to the rest of the system?**
  _1046 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `معامله‌یار — Persian Trading Journal Platform` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `live-browser.js` be split into smaller, more focused modules?**
  _Cohesion score 0.03238709677419355 - nodes in this community are weakly interconnected._