# Landing Page Spec A — "The Trader's Terminal"
## معامله‌یار | Design Direction: Dark · Technical · Professional

---

## Concept

The landing page mirrors the product itself — a dark, data-dense terminal aesthetic that feels like a trading dashboard. Instead of hiding the product behind marketing fluff, we show a live-feeling dashboard mockup as the hero. The visitor immediately understands: "this is a serious tool for serious traders."

**One-line brand promise:** "ژورنال معاملاتی که مثل ترمینال تریدت فکر می‌کنه"

---

## Visual Identity

### Color Palette (OKLCH)
| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `oklch(0.13 0.02 250)` | Page background — deep navy-black |
| `--bg-surface` | `oklch(0.17 0.02 250)` | Cards, panels |
| `--bg-elevated` | `oklch(0.21 0.02 250)` | Hover states, active |
| `--accent` | `oklch(0.78 0.18 155)` | Emerald — CTAs, positive P&L, links |
| `--danger` | `oklch(0.65 0.22 15)` | Red — negative P&L, warnings |
| `--gold` | `oklch(0.80 0.15 85)` | Gold — premium features, badges |
| `--text-primary` | `oklch(0.93 0.01 250)` | Headlines, body |
| `--text-muted` | `oklch(0.55 0.02 250)` | Labels, metadata |
| `--border` | `oklch(0.25 0.02 250)` | Subtle dividers |

### Typography
- **Font:** Vazirmatn (self-hosted, no CDN)
- **Display H1:** `clamp(2rem, 5vw, 3.5rem)`, weight 800, letter-spacing -0.02em
- **H2:** `clamp(1.5rem, 3vw, 2rem)`, weight 700
- **Body:** 1rem, weight 400, line-height 1.7
- **Mono accent:** Tabular numbers for stats (font-feature-settings: 'tnum')

### Motion
- Hero dashboard mockup loads with a subtle stagger — cards fade in from bottom, chart line draws left-to-right
- Scroll-triggered: equity curve animates its path on reveal
- Hover on feature cards: border glows emerald, card lifts 2px
- All motion uses `ease-out-quart`, respects `prefers-reduced-motion`

---

## Page Structure (8 sections)

### Section 1 — Hero (100vh)
```
┌─────────────────────────────────────────────────────────┐
│  NAV: Logo · لینک‌ها · [ورود] [ثبت نام رایگان]          │
│                                                         │
│  L60%:                          R40%:                   │
│  ┌──────────────────────┐       ┌─────────────────────┐ │
│  │ تیتر بزرگ:            │       │  Live Dashboard     │ │
│  │ "ژورنال هوشمند        │       │  Mockup             │ │
│  │  معاملات فارکس"      │       │  (mini equity curve │ │
│  │                       │       │   + KPI cards       │ │
│  │ زیرتیتر:              │       │   + trade rows)     │ │
│  │ "معاملاتت رو وارد    │       │                     │ │
│  │  کن، الگوها رو        │       │                     │ │
│  │  پیدا کن، سودت       │       │                     │ │
│  │  رو بیشتر کن"        │       │                     │ │
│  │                       │       │                     │ │
│  │ [شروع رایگان →]     │       │                     │ │
│  │ "بدون کارت بانکی"   │       │                     │ │
│  └──────────────────────┘       └─────────────────────┘ │
│                                                         │
│  Trust bar: "MT4/MT5 · تقویم جلالی · پرداخت تومانی"   │
└─────────────────────────────────────────────────────────┘
```

- **Background:** Subtle grid pattern (CSS), radial gradient glow behind the dashboard mockup
- **Dashboard mockup:** A real-looking mini version of the product — equity curve SVG, 3 KPI cards (win rate, profit factor, P&L), 2 trade rows. All static but feels alive.
- **CTA:** Emerald button, large, with arrow. Secondary: text link "ورود"

### Section 2 — Problem & Agitation
```
"معامله‌گر ایرانی، بدون ژورنال"
```
Three pain points in a horizontal row, each with an icon:
1. "معاملاتت رو کاغذی یادداشت می‌کنی؟" — unsustainable manual tracking
2. "نمی‌دونی کدوم سشن‌ها سودده‌تره؟" — blind trading
3. "هیجاناتت روی نتیجه تاثیر داره؟" — emotional trading

**Design:** Dark cards with red-tinted left border. Muted text. No CTA yet — just build tension.

### Section 3 — Solution (How it works)
```
"۳ قدم تا تبدیل شدن به معامله‌گر حرفه‌ای"
```
Three-step horizontal flow with connecting line:
1. **وارد کن** — Upload MT4/MT5 file or sync via EA
2. **تحلیل کن** — Auto-calculated analytics, patterns, edge detection
3. **بهبود بده** — Journal, tag, and optimize based on real data

Each step is a card with number badge (01, 02, 03), icon, title + 2-line description, and a subtle screenshot below.

### Section 4 — Feature Grid (Bento)
```
"ابزارهایی که معامله‌گر حرفه‌ای نیاز داره"
```
A 4-column bento grid (2 rows), varying sizes:

| Cell | Size | Content |
|---|---|---|
| MT4/MT5 Import | 2×1 | Large — with file upload animation |
| Equity Curve | 1×1 | Mini chart preview |
| Trading Calendar | 1×1 | Jalali calendar heatmap preview |
| Emotion Tracking | 1×1 | Emoji + outcome correlation |
| Edge Detection | 2×1 | The insight card from dashboard |
| Journal | 1×1 | Mini journal preview |

**Design:** Each cell shows the actual feature UI rendered live (not just text). Hover reveals feature name + description overlay.

### Section 5 — Social Proof
```
"اعتماد معامله‌گران ایرانی"
```
- 3 testimonial cards (Persian names, avatars, short quotes)
- Stats bar: "۵۰۰+ معامله‌گر · ۵۰,۰۰۰+ معامله ثبت شده · میانگین ۲۳٪ بهبود نرخ موفقیت"
- (Mock data for v1)

### Section 6 — Pricing
```
"پلن مناسب خودت رو انتخاب کن"
```
Three pricing cards: رایگان / استاندارد (highlighted, "محبوب‌ترین" badge) / حرفه‌ای. Annual toggle with "۲ ماه رایگان" badge.

### Section 7 — FAQ
Accordion with 5-6 questions about security, MT4/MT5 compatibility, payments, cancellation.

### Section 8 — Final CTA + Footer
Large emerald button centered. "بدون کارت بانکی · بدون محدودیت زمانی". Footer with links.

---

## Responsive Strategy
- **Desktop (>1024px):** Full bento grid, side-by-side hero
- **Tablet (768-1024px):** Hero stacks vertically, bento becomes 2-col
- **Mobile (<768px):** Single-column, hero mockup hidden (replaced by stat cards), bento becomes simple list

---

## Strengths
- Product-forward: visitors see the actual UI immediately
- Matches the app's dark theme — no jarring transition
- Feels professional and trustworthy
- Differentiates from generic SaaS landing pages

## Weaknesses
- Dark theme may feel heavy for some visitors
- Dashboard mockup requires significant front-end work
- Less text means less SEO content

---

*Spec A — "The Trader's Terminal" v1.0*