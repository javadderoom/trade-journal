# Landing Page Spec B — "The Editorial Journal"
## تریدکاو | Design Direction: Light · Editorial · Storytelling

---

## Concept

This landing page reads like a premium financial publication — think *The Economist* meets a Persian trading blog. Light background, strong typography hierarchy, generous whitespace, and a narrative flow that educates while it sells. The trader feels they're reading an expert's analysis, not being marketed to.

**One-line brand promise:** "داستان معاملاتت رو بنویس، نتیجه‌اش رو ببین"

---

## Visual Identity

### Color Palette
| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#FAFBFC` | Off-white paper background |
| `--bg-surface` | `#FFFFFF` | Pure white cards |
| `--bg-dark` | `#0F1117` | Dark sections (alternating) |
| `--accent` | `#3DDC97` | Emerald — used sparingly for CTAs only |
| `--ink` | `#1A1D29` | Near-black text |
| `--ink-muted` | `#6B7280` | Muted gray for metadata |
| `--rule` | `#E5E7EB` | Hairline dividers |
| `--highlight` | `#FFF8E1` | Subtle yellow highlight for key phrases |

### Typography
- **Font:** Vazirmatn (self-hosted)
- **Display H1:** `clamp(2.2rem, 5vw, 4rem)`, weight 900, letter-spacing -0.03em, `text-wrap: balance`
- **H2:** `clamp(1.6rem, 3vw, 2.2rem)`, weight 700
- **Lead paragraph:** 1.125rem, weight 400, line-height 1.8, max-width 65ch
- **Pull quotes:** 1.3rem, weight 600, border-right 3px solid emerald
- **Numbers:** Tabular, weight 700, large

### Motion
- Minimal. Content fades in on scroll with 200ms delay.
- No parallax, no counters, no dramatic reveals.
- Hover states: links underline, buttons darken slightly.
- The calm itself is the message.

---

## Page Structure (7 sections, alternating light/dark)

### Section 1 — Hero (Light)
```
┌─────────────────────────────────────────────────────────┐
│  NAV: Logo · ویژگی‌ها · قیمت · سوالات · [ورود] [ثبت‌نام]│
│                                                         │
│                    Centered, max-width 720px            │
│                                                         │
│  تیتر بزرگ (display, weight 900):                       │
│  "معامله‌گر هوشمندتر شو"                                │
│                                                         │
│  زیرتیتر (lead, line-height 1.8):                       │
│  "ژورنال معاملاتی فارسی‌زبان با تحلیل خودکار،          │
│   تقویم جلالی و واردات مستقیم MT4/MT5.                  │
│   معاملاتت رو ثبت کن، الگوها رو کشف کن،                  │
│   و تصمیم‌های بهتر بگیر."                               │
│                                                         │
│  [شروع رایگان]   "بدون کارت بانکی"                      │
│                                                         │
│  ─────────── hairline rule ───────────                  │
│                                                         │
│  ۳ آمار کنار هم (large numbers, tabular):               │
│  ۵۰۰+ معامله‌گر    ۵۰هزار+ معامله    ۲۳٪ بهبود میانگین   │
└─────────────────────────────────────────────────────────┘
```

**Design:** No image. Pure typography. The power is in the words and the type scale. Generous top padding (120px). Hairline rule below stats.

### Section 2 — The Problem (Dark, full-width)
```
Background: #0F1117 (dark)
```
A full-width dark section with a single centered paragraph:

> "بیشتر معامله‌گران ایرانی بدون ژورنال معامله می‌کنن.
> نتیجه؟ تکرار اشتباهات، نداشتن دید کلی، و ضررهایی که
> با یه یادداشت ساده قابل پیشگیری بودن."

One sentence. Large text (1.4rem). White on dark. No cards, no icons. Just a statement that resonates.

### Section 3 — How It Works (Light)
```
"معامله‌یار چطور کار می‌کنه؟"
```
Three steps in a vertical list (not cards), each with a number and description:

**۱. وارد کن**
فایل MT4/MT5 رو آپلود کن یا اکسپرت خودکار رو روی متاتریدر نصب کن. تمام معاملاتت به صورت خودکار وارد می‌شن.

**۲. تحلیل کن**
امتیاز موفقیت، ضریب سود، منحنی سرمایه و الگوهای معاملاتیت به صورت خودکار محاسبه می‌شن. بدون اکسل، بدون دردسر.

**۳. بهبود بده**
ژورنال روزانه بنویس، هیجاناتت رو ثبت کن، و لبه معاملاتیت رو پیدا کن — اون چیزی که تو رو از بقیه متمایز می‌کنه.

**Design:** No card backgrounds. Just text with a left-border number. Like reading a well-formatted article.

### Section 4 — Feature Deep-Dive (Light, with screenshots)
```
"ابزارهایی که فرق می‌سازن"
```
Each feature gets a full-width row alternating image/text:

| Row | Image Side | Text Side |
|---|---|---|
| 1 | Left: Equity curve screenshot | Right: "منحنی سرمایه" — description |
| 2 | Right: MT4 import screenshot | Left: "واردات یک‌کلیکی MT4/MT5" |
| 3 | Left: Calendar heatmap screenshot | Right: "تقویم معاملاتی جلالی" |
| 4 | Right: Emotion analytics screenshot | Left: "تحلیل هیجانات" |

**Design:** Screenshots are in a browser frame mockup. Text is large, readable, with a "بیشتر بدان →" link to the feature section.

### Section 5 — Pricing (Dark, full-width)
```
Background: #0F1117
```
Three pricing cards on dark background:
- Cards are white (`#FFFFFF`) with dark text — inverted from the page
- Standard plan highlighted with emerald border
- Annual/monthly toggle

### Section 6 — Testimonials (Light)
```
"معامله‌گران درباره ما"
```
Three pull quotes in a row, each:
- Large quotation mark
- Quote text (1.1rem, italic)
- Name + title
- Hairline border-top

No avatars, no star ratings. Just words.

### Section 7 — FAQ + CTA (Light → Dark gradient)
```
"سوالات متداول"
```
FAQ accordion, then final CTA:
- Large heading: "آماده‌ای بهتر معامله کنی؟"
- Single button: "شروع رایگان"
- Small text: "ثبت‌نام در ۳۰ ثانیه · بدون کارت بانکی"

Footer below in dark section.

---

## Responsive Strategy
- **Desktop:** As described — generous whitespace, alternating sections
- **Tablet:** Same structure, tighter spacing, feature rows stack
- **Mobile:** Everything single-column, hero stats wrap to 1-col, feature images full-width

---

## Strengths
- Distinctive: no other Iranian fintech product looks like this
- Editorial feel builds trust through authority
- Typography-first is fast to load and accessible
- Easy to read on mobile (large text, good contrast)
- Alternating dark/light creates visual rhythm

## Weaknesses
- May feel too "blog-like" for some visitors expecting a SaaS product
- Light theme contrasts with the dark app — jarring transition
- Requires excellent Persian copywriting to work
- Less visual excitement = potentially lower conversion rates

---

*Spec B — "The Editorial Journal" v1.0*