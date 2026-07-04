# Landing Page Comparison & Recommendation

## Side-by-Side Comparison

| Dimension | Spec A — "Trader's Terminal" | Spec B — "Editorial Journal" | Spec C — "Conversion Machine" |
|---|---|---|---|
| **Theme** | Dark | Light/Dark alternating | Dark |
| **Primary CTA focus** | Product demo | Storytelling | Signup conversion |
| **Hero** | Split: text + live dashboard mockup | Centered: pure typography | Centered: text + screenshot |
| **Features** | Bento grid with live UI previews | Alternating screenshot/text rows | 3-column cards with icons |
| **Social proof** | Testimonials + stats | Pull quotes (no avatars) | Stats bar + comparison table |
| **Pricing** | 3 cards | 3 cards (inverted on dark) | 3 cards (scaled highlight) |
| **Sections** | 8 | 7 | 6 |
| **Build effort** | High (dashboard mockup, bento grid) | Medium (screenshots, typography) | Low (cards, table) |
| **Mobile** | Hides mockup, shows stats | Stacks naturally | Floating CTA button |
| **Motion** | Moderate (chart draws, card staggers) | Minimal (fades only) | Moderate (count-up, slide-in) |
| **SEO content** | Low (visual-first) | High (lots of text) | Medium (bullet points) |
| **Conversion focus** | Medium | Low | High |
| **Memorability** | High — unique dashboard hero | High — editorial is distinctive | Medium — clean but familiar |
| **Brand match** | Perfect (dark = app) | Mismatch (light → dark app) | Perfect (dark = app) |
| **Persian copywriting dependency** | Low (visual does the work) | High (text IS the design) | Medium |

---

## My Recommendation: **Spec A — "The Trader's Terminal"**

### Why Spec A wins

**1. It shows the product, not just talks about it.**
Iranian forex traders are skeptical of marketing. They've seen enough "سامانه معاملاتی هوشمند" landing pages with stock photos and bullet points. Spec A puts a live-looking dashboard mockup right in the hero — the trader immediately sees the equity curve, the KPI cards, the trade rows. The product sells itself.

**2. It matches the app — zero cognitive dissonance.**
The app is dark (#0F1117 bg, #181C27 surfaces, #3DDC97 emerald). Spec C also matches. Spec B's light theme creates a jarring transition when the user signs up and lands in a dark dashboard. Spec A feels like one continuous experience.

**3. The bento grid is the strongest feature section.**
Instead of generic "icon + title + text" cards (Spec C) or long screenshot rows (Spec B), the bento grid shows each feature as a mini interactive preview. The equity curve cell has a real SVG chart. The calendar cell has a real heatmap. This is far more convincing than describing features with words.

**4. It's differentiated.**
Spec C risks looking like every other SaaS landing page (Vercel/Linear clone). Spec B is beautiful but risky — if the Persian copy isn't exceptional, it falls flat. Spec A is unique: no other Iranian trading product has a dashboard-as-hero landing page.

**5. The edge detection card is your secret weapon.**
The "برتری معاملاتی" (Your Edge) feature is genuinely novel — no competitor has it. Making it a prominent bento cell turns your unique feature into a marketing asset.

### What to steal from the other specs

Even though I recommend Spec A, borrow these elements:

- **From Spec C:** The comparison table (معامله‌یار vs. اکسل vs. هیچی) — add it as a section between bento grid and pricing. It's a powerful conversion tool.
- **From Spec C:** The persistent nav CTA and mobile floating button — essential for conversion.
- **From Spec B:** The `text-wrap: balance` on headings — improves Persian line breaks significantly.
- **From Spec B:** The single dark "problem" statement section — one bold sentence on a dark background is more impactful than three pain-point cards.

### Build order for Spec A (enhanced)

1. Nav bar (sticky, with CTA)
2. Hero (text + dashboard mockup with SVG equity curve)
3. Problem statement (single dark section, one sentence — from Spec B)
4. How it works (3 steps)
5. Bento feature grid (6 cells with live previews)
6. Comparison table (from Spec C)
7. Pricing (3 cards)
8. FAQ (accordion)
9. Final CTA + Footer

### Risk mitigation

- **Build effort:** The dashboard mockup is the hardest part. Use the existing `EquityCurveSVG` component from the dashboard page — it's already built. The KPI cards are simple divs. The trade rows are just flex rows.
- **Mobile:** Hide the mockup on mobile, replace with the 3 stats from Spec C's stats bar. This keeps mobile fast and focused.
- **SEO:** Add a hidden `<noscript>` block with descriptive text, and use semantic HTML (`<section>`, `<h1>`, `<h2>`) throughout.

---

## Final Ranking

1. 🥇 **Spec A — "The Trader's Terminal"** — Best overall: product-forward, unique, brand-matched
2. 🥈 **Spec C — "The Conversion Machine"** — Best for speed-to-build and conversion, but risks feeling generic
3. 🥉 **Spec B — "The Editorial Journal"** — Most distinctive visually, but risky execution and theme mismatch

---

*Comparison v1.0*