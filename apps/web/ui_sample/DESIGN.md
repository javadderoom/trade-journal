---
name: Fintech Precision
colors:
  surface: '#111319'
  surface-dim: '#111319'
  surface-bright: '#373940'
  surface-container-lowest: '#0c0e14'
  surface-container-low: '#191b22'
  surface-container: '#1e1f26'
  surface-container-high: '#282a30'
  surface-container-highest: '#33343b'
  on-surface: '#e2e2eb'
  on-surface-variant: '#bbcabe'
  inverse-surface: '#e2e2eb'
  inverse-on-surface: '#2e3037'
  outline: '#859489'
  outline-variant: '#3c4a41'
  surface-tint: '#42e09a'
  primary: '#61f9b1'
  on-primary: '#003822'
  primary-container: '#3ddc97'
  on-primary-container: '#005c3a'
  inverse-primary: '#006c45'
  secondary: '#f0c03e'
  on-secondary: '#3e2e00'
  secondary-container: '#ba9000'
  on-secondary-container: '#3c2c00'
  tertiary: '#ffd5d7'
  on-tertiary: '#67001d'
  tertiary-container: '#ffadb4'
  on-tertiary-container: '#a30033'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#65fdb5'
  primary-fixed-dim: '#42e09a'
  on-primary-fixed: '#002112'
  on-primary-fixed-variant: '#005233'
  secondary-fixed: '#ffdf95'
  secondary-fixed-dim: '#f0c03e'
  on-secondary-fixed: '#251a00'
  on-secondary-fixed-variant: '#594400'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b8'
  on-tertiary-fixed: '#40000f'
  on-tertiary-fixed-variant: '#91002d'
  background: '#111319'
  on-background: '#e2e2eb'
  surface-variant: '#33343b'
typography:
  headline-xl:
    fontSize: ۳۲px
    fontWeight: ۷۰۰
    lineHeight: ۴۸px
  headline-lg:
    fontSize: ۲۴px
    fontWeight: ۷۰۰
    lineHeight: ۳۶px
  headline-md:
    fontSize: ۲۰px
    fontWeight: ۶۰۰
    lineHeight: ۳۲px
  body-lg:
    fontSize: ۱۸px
    fontWeight: ۴۰۰
    lineHeight: ۲۸px
  body-md:
    fontSize: ۱۶px
    fontWeight: ۴۰۰
    lineHeight: ۲۴px
  label-md:
    fontSize: ۱۴px
    fontWeight: ۵۰۰
    lineHeight: ۲۰px
  label-sm:
    fontSize: ۱۲px
    fontWeight: ۵۰۰
    lineHeight: ۱۶px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: ۸px
  xs: ۴px
  sm: ۸px
  md: ۱۶px
  lg: ۲۴px
  xl: ۳۲px
  grid-margin: ۲۰px
  grid-gutter: ۱۶px
---

## Brand & Style

This design system is engineered for high-performance financial tracking, focusing on clarity, speed, and emotional stability. The brand personality is authoritative yet encouraging, designed to reduce the cognitive load of complex trading data. 

The aesthetic follows a **Modern Corporate** foundation infused with **Glassmorphism** and subtle **Neon Glows**. It utilizes deep obsidian surfaces to ensure that critical financial indicators—specifically profit and loss—stand out with maximum contrast. The RTL (Right-to-Left) orientation is the primary structural driver, ensuring that data flow and navigation feel natural for Persian-speaking traders.

## Colors

The palette is optimized for long-duration screen time common in trading. 
- **Primary (Emerald Green):** Used for CTA buttons, profitable trade indicators, and success states. It represents growth and liquidity.
- **Secondary (Gold):** Reserved for highlights, premium features, and achievement milestones.
- **Danger (Red):** Strictly used for loss indicators and destructive actions to ensure immediate user recognition.
- **Neutrals:** A multi-layered dark navy scale provides the depth necessary for a hierarchical UI without the harshness of pure black.

## Typography

Typography is centered on **Vazirmatn**, chosen for its exceptional legibility in Persian script and its balanced treatment of Persian numerals. 

- **Headlines:** Always Bold (۷۰۰) or SemiBold (۶۰۰) to anchor the page.
- **Numbers:** In trading, numbers are the most important data point. Ensure all numeric values utilize Persian glyphs (۱۲۳۴۵۶۷۸۹۰) to maintain linguistic consistency. 
- **Hierarchy:** Use `label-sm` for metadata like trade timestamps and `headline-xl` for total balance overviews.

## Layout & Spacing

The design system employs an **۸px base grid** to ensure mathematical harmony across all components. 

- **Desktop:** A ۱۲-column fluid grid with ۲۴px margins.
- **Mobile:** A ۴-column grid with ۱۶px margins.
- **RTL Logic:** Spacing scales (padding-right, margin-left) must be flipped from standard LTR patterns. The primary navigation should reside on the right or bottom for mobile, with content flowing from top-right to bottom-left.

## Elevation & Depth

Depth is communicated through **Tonal Layering** rather than traditional heavy shadows.
- **Level ۰ (Background):** #0F1117 - The base canvas.
- **Level ۱ (Cards):** #181C27 - Used for trade logs and dashboard widgets.
- **Level ۲ (Modals/Popovers):** #252A3A - The highest surface for interaction.

To emphasize "Profit" or "Active Trades," apply a **subtle emerald glow** (`box-shadow: 0 4px 20px rgba(61, 220, 151, 0.15)`). This creates a sense of "active" vs "passive" elements.

## Shapes

The design system uses a **Rounded (۲)** shape language to soften the industrial feel of financial data.
- **Standard Components:** ۸px (۰.۵rem) border radius for buttons and input fields.
- **Cards/Containers:** ۱۶px (۱rem) border radius to create a containerized, modern look.
- **Interactive Elements:** Use rounded-pill for status chips (e.g., "Open," "Closed," "Long," "Short") to distinguish them from functional buttons.

## Components

### Buttons
- **Primary:** Background #3DDC97, Text #0F1117 (High contrast). Semi-bold weight.
- **Secondary:** Transparent background with a #252A3A border.
- **Danger:** Background #FF5370 for "Delete Trade" or "Stop Loss" actions.

### Cards & Trade Logs
- Cards use a subtle ۱px border (#252A3A) to separate them from the background.
- Trade rows should include a colored "accent bar" on the right edge (Emerald for Profit, Red for Loss).

### Input Fields
- Dark background (#0F1117), ۸px radius, and a focused state that uses a Gold (#F5C542) border to indicate active text entry.

### Chips & Badges
- **Long/Short:** Use distinctive background tints. Long (Green tint), Short (Red tint).
- **Tagging:** Use #6B7280 for neutral tags like strategy names or market sessions.

### Progress Bars (PnL)
- Use thick, rounded tracks for PnL distribution. Background #252A3A with the foreground color representing the dominant outcome (Profit/Loss).