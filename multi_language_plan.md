# Hybrid Multi-Language Support Plan (English & Persian)

This plan outlines the implementation of a hybrid internationalization (i18n) system for the Trade Journal website.

---

## Architecture Overview

We will use a hybrid approach to get the best of both worlds:
1. **Public Pages (Approach A - Subpath Routing):** 
   - **Routes:** `/` (Landing Page) and `/contact` (Contact Page).
   - **Structure:** Localized subpaths: `/fa` / `/fa/contact` and `/en` / `/en/contact`.
   - **Reason:** Standard SEO indexing. Search engines can crawl and rank both Persian and English versions of your public pages.
   
2. **Dashboard Pages (Approach B - Client Context Switching):**
   - **Routes:** `/dashboard`, `/settings`, `/journal`, `/admin`, etc.
   - **Structure:** Static URLs (no subpaths). The language is managed statefully and saved in `localStorage`.
   - **Reason:** Better UX for logged-in users, no need to pass locale through dashboard links, instant switcher, and seamless RTL/LTR layout transitions.

---

## Proposed Implementation Steps

### 1. Translation Dictionaries (Shared Locales)
We will create a centralized location for translation keys.

* **`apps/web/src/locales/fa.json`** - Persian translations.
* **`apps/web/src/locales/en.json`** - English translations.

Example structure:
```json
{
  "landing": {
    "title": "سامانه مدیریت معاملات معامله‌یار",
    "subtitle": "دفترچه معاملاتی پیشرفته برای تریدرها"
  },
  "dashboard": {
    "welcome": "خوش آمدید",
    "totalProfit": "سود کل"
  }
}
```

---

## 2. Approach A: Public Pages Localization

### Move Public Pages into Dynamic Subpaths
We will move the existing public pages under the dynamic locale folder:
- **`apps/web/src/app/[locale]/layout.tsx`** - Set global HTML `lang` and `dir` (RTL/LTR) based on URL.
- **`apps/web/src/app/[locale]/page.tsx`** - Public Landing page.
- **`apps/web/src/app/[locale]/contact/page.tsx`** - Public Contact page.

### Next.js Middleware (`apps/web/src/middleware.ts`)
A middleware that:
- Inspects root requests `/` or `/contact`.
- Detects the preferred language (from `Accept-Language` headers or cookie).
- Redirects to `/fa` or `/en` accordingly.
- Excludes `/api/*`, static assets, and `/dashboard/*`.

---

## 3. Approach B: Dashboard Pages Localization

### LanguageContext (`apps/web/src/components/LanguageContext.tsx`)
We will create a React Context provider that wraps the dashboard routes:
- Manages the selected language state (saved in `localStorage`).
- Exposes `language` (e.g. `'fa'` or `'en'`), `dir` (e.g. `'rtl'` or `'ltr'`), and a `t()` function to translate keys.
- Exposes a `toggleLanguage()` function.

### AppLayout (`apps/web/src/components/layout/AppLayout.tsx`)
- Wrap the dashboard shell in the `LanguageProvider`.
- Dynamically apply the layout direction class:
  ```tsx
  <div dir={dir} className={language === 'fa' ? 'font-vazir' : 'font-inter'}>
  ```
- Add a beautiful language selector dropdown (flags or EN/FA text toggle) to the dashboard top header.

---

## 4. Code Example (The Translation Hook)

We will implement a simple helper hook `useTranslation` to make translation simple inside components:

```typescript
import { useContext } from 'react';
import { LanguageContext } from './LanguageContext';

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
```

Usage in Dashboard components:
```tsx
const { t, language, toggleLanguage } = useTranslation();

return (
  <button onClick={toggleLanguage}>
    {language === 'fa' ? 'English' : 'فارسی'}
  </button>
  <h2>{t('dashboard.welcome')}</h2>
);
```

---

## Verification Plan

### Manual Verification
1. Navigate to `https://tradekav.ir/`. Verify you are automatically redirected to `https://tradekav.ir/fa` or `https://tradekav.ir/en`.
2. Toggle the language on the landing page, verify the URL changes (e.g. `/fa` to `/en`) and the text translates.
3. Log in to the dashboard. Verify the URL is `/dashboard` (without `/fa` or `/en`).
4. Toggle the language in the dashboard header. Verify:
   - The UI flips instantly (RTL to LTR).
   - Fonts change to matching typefaces (e.g., Inter for EN, Vazir for FA).
   - Text updates instantly without a page reload.
