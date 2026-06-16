# Web Progress — معامله‌یار

## Tech Stack
- **Framework:** Next.js (App Router)
- **UI:** Chakra UI v3 + Emotion
- **Font:** Vazirmatn (Persian web font)
- **Layout:** Full RTL (`dir="rtl"`, `lang="fa"`)

## What's Done

### App Layout (`src/app/layout.tsx`)
- RTL root layout with Persian lang attribute
- ChakraProvider + ThemeProvider wrapped
- Vazirmatn font preloaded
- Title: معامله‌یار

### Project Config
- Root `package.json` has shared deps: Next.js 16, Chakra UI 3, React 19, Emotion, TypeScript 6, Express, Prisma
- `tsconfig.json` at project root (shared with API)

## What's NOT Done (Next Steps)
- Pages/routes: Dashboard, Trade List, Trade Detail, Journal, Import, Analytics, Settings
- RTL CSS file (`styles/rtl.css` referenced in layout but not created yet)
- Theme file (`./themes` imported in layout but not created yet)
- Components: TradeTable, Chart, Calendar (Jalali), MoodPicker, FileUpload
- API client / SWR / React Query integration
- Auth pages (Login, Register)
- Jalali date handling (date-fns-jalali or similar)
- Responsive design
- i18n (currently hardcoded Persian)
