# Landing Page Spec C — "The Conversion Machine"
## معامله‌یار | Design Direction: Dark · Punchy · Conversion-Optimized

---

## Concept

Every pixel on this page exists to move the visitor toward signing up. It's a dark, punchy, fast-scrolling page with a single hero image, big numbers, short copy, and a persistent CTA. Think Vercel or Linear's landing page — dark, confident, minimal friction.

**One-line brand promise:** "همین الان، رایگان، بدون کارت بانکی"

---

## Visual Identity

### Color Palette
| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#0B0F19` | Near-black navy |
| `--bg-surface` | `#141824` | Cards |
| `--bg-glow` | `rgba(61, 220, 151, 0.08)` | Subtle emerald glow behind CTAs |
| `--accent` | `#3DDC97` | Emerald — CTAs, positive numbers |
| `--accent-hover` | `#4DE9A8` | Button hover |
| `--danger` | `#FF5370` | Negative numbers |
| `--text-primary` | `#F0F2F5` | White-ish |
| `--text-muted` | `#8892A6` | Gray |
| `--border` | `#1E2535` | Card borders |

### Typography
- **Font:** Vazirmatn
- **H1:** `clamp(2.5rem, 6vw, 4rem)`, weight 800, letter-spacing -0.02em, `text-wrap: balance`
- **H2:** `clamp(1.5rem, 3vw, 2rem)`, weight 700
- **Body:** 1rem, weight 400, line-height 1.6
- **Stat numbers:** `clamp(2rem, 4vw, 3rem)`, weight 800, tabular

### Motion
- Hero: gradient glow pulse behind CTA (subtle, 3s loop)
- Stats: count-up animation on scroll-into-view (0 → final, 1s)
- Feature cards: slide in from right with stagger (50ms delay each)
- Pricing: card scales up on hover
- Persistent nav: shrinks and adds blur on scroll
- All: `prefers-reduced-motion` disables all animation

---

## Page Structure (6 sections, all dark)

### Section 1 — Hero (90vh, sticky nav)
```
┌─────────────────────────────────────────────────────────┐
│  NAV (sticky, blur on scroll):                          │
│  Logo · ویژگی‌ها · قیمت · [ورود] [ثبت‌نام رایگان]     │
│                                                         │
│              Centered, max-width 800px                  │
│                                                         │
│  H1 (massive):                                           │
│  "ژورنال معاملاتی                                       │
│   هوشمند فارسی"                                         │
│                                                         │
│  Sub (1.1rem, muted):                                   │
│  "واردات MT4/MT5 · تحلیل خودکار · تقویم جلالی"        │
│                                                         │
│  CTA button (large, glowing emerald):                   │
│  [شروع رایگان →]                                        │
│                                                         │
│  Microcopy: "ثبت‌نام در ۳۰ ثانیه · بدون کارت بانکی"   │
│                                                         │
│  ─── screenshot below, floating with shadow ───        │
│  [Product screenshot: dashboard view, full-width]      │
└─────────────────────────────────────────────────────────┘
```

**Design:** No split layout. Everything centered. The product screenshot floats below the fold with a dramatic shadow and slight perspective tilt. Background has a radial emerald glow (8% opacity) behind the CTA.

### Section 2 — Stats Bar (compact)
```
┌─────────────────────────────────────────────────────────┐
│  ۳ stats in a row, large numbers, count-up on scroll:   │
│                                                         │
│  ۵۰۰+         ۵۰,۰۰۰+        ۲۳٪                        │
│  معامله‌گر    معامله ثبت     میانگین بهبود              │
│               شده           نرخ موفقیت                  │
└─────────────────────────────────────────────────────────┘
```

**Design:** No card background. Just large numbers + small labels. Hairline dividers between them.

### Section 3 — Features (3-column grid)
```
"چرا معامله‌یار؟"
```
Three feature cards in a row, each:
- Icon (Material Symbols, emerald, 32px)
- Title (1.1rem, weight 600)
- 2-line description (0.9rem, muted)
- Hover: border glows emerald, slight lift

Features:
1. **واردات یک‌کلیکی MT4/MT5** — فایل اکسپرت یا HTML رو آپلود کن، بقیه با ما
2. **تحلیل خودکار** — نرخ موفقیت، ضریب سود، R:R و منحنی سرمایه
3. **ژورنال و تقویم جلالی** — یادداشت روزانه، هیجانات، تقویم معاملاتی

**Design:** Dark surface cards with subtle border. Clean, minimal. No screenshots.

### Section 4 — Comparison Table
```
"معامله‌یار در برابر بقیه"
```
A comparison table (معامله‌یار vs. اکسل vs. بدون ژورنال):

| Feature | اکسل | بدون ژورنال | معامله‌یار |
|---|---|---|---|
| واردات خودکار MT4/MT5 | ✗ | ✗ | ✓ |
| تحلیل آماری | دستی | ✗ | خودکار |
| تقویم جلالی | ✗ | ✗ | ✓ |
| ردیابی هیجانات | ✗ | ✗ | ✓ |
| پرداخت تومانی | — | — | ✓ |
| زمان راه‌اندازی | ساعت‌ها | — | ۳۰ ثانیه |

**Design:** معامله‌یار column highlighted with emerald background tint. Checkmarks in emerald, X's in muted red.

### Section 5 — Pricing
```
"قیمت مناسب برای معامله‌گر ایرانی"
```
Three cards:
- **رایگان** — ۰ تومان — "مناسب شروع"
- **استاندارد** — ۱۵۰,۰۰۰ ت/ماه — highlighted, "محبوب‌ترین" badge, emerald border, scaled up 1.05x
- **حرفه‌ای** — ۳۵۰,۰۰۰ ت/ماه — "برای حرفه‌ای‌ها"

Each card: plan name, price (large), feature list (checkmarks), CTA button. Annual toggle.

### Section 6 — Final CTA + FAQ + Footer
```
"آماده‌ای؟"
```
- Massive centered CTA: "همین الان شروع کن" button (glowing emerald)
- "رایگان · بدون کارت بانکی · لغو در هر زمان"
- FAQ accordion below (4 questions, collapsed by default)
- Footer with links, social, copyright

**Design:** Single CTA, no distractions. The FAQ is collapsed — only for those who need it.

---

## Persistent CTA Strategy
- **Nav bar:** Always has "ثبت‌نام رایگان" button visible
- **Mobile:** Floating "شروع" button bottom-right after hero section
- **Exit intent:** (v2) — modal with "صبر کن! ۱ ماه رایگان بگیر"

---

## Responsive Strategy
- **Desktop (>1024px):** 3-col features, full comparison table, side-by-side pricing
- **Tablet (768-1024px):** 2-col features, comparison table scrolls horizontally, pricing stacks
- **Mobile (<768px):** 1-col everything, hero screenshot removed, floating CTA button appears

---

## Conversion Optimization
1. **Single CTA focus:** Every section ends pointing toward "شروع رایگان"
2. **Friction reduction:** "بدون کارت بانکی" repeated 4 times across the page
3. **Social proof early:** Stats bar is section 2, not buried at the bottom
4. **Comparison table:** Shows why معامله‌یار > Excel/nothing
5. **Minimal copy:** No long paragraphs — bullet points and short descriptions only
6. **Persistent nav CTA:** Always one click away from signup

---

## Strengths
- Highest conversion potential — every element optimized for action
- Fast to build (no complex mockups, just cards and text)
- Consistent dark theme with the app
- Comparison table is a strong differentiator
- Mobile-optimized with floating CTA

## Weaknesses
- May feel generic / SaaS-templated
- Less memorable than Spec A or B
- No product preview in the features section
- Relies on copy + pricing to convince, not visual product demos

---

*Spec C — "The Conversion Machine" v1.0*