# SWR Migration Plan for Trade Journal

This document outlines the detailed plan to integrate Vercel's **SWR (Stale-While-Revalidate)** library for client-side data fetching, caching, and state synchronization in the Next.js web application.

---

## 1. Prerequisites & Installation

Run the following command to add SWR to the web app:
```bash
npm install swr --workspace=web
```

---

## 2. Configuration & Setup

### A. Define a Global Fetcher Wrapper
We will expose a global fetcher in [api.ts](file:///g:/Code/trade-journal/apps/web/src/lib/api.ts) that uses our preconfigured Axios instance (ensuring the Authorization token interceptors and refresh token interceptors remain active):

```typescript
// Add to apps/web/src/lib/api.ts
export const fetcher = async <T = any>(url: string): Promise<T> => {
  const res = await api.get<T>(url);
  return res.data;
};
```

### B. Global SWR Config Provider
We will wrap the application layout in [layout.tsx](file:///g:/Code/trade-journal/apps/web/src/app/layout.tsx) with `<SWRConfig>` to establish default behaviors:

```tsx
import { SWRConfig } from 'swr';
import { fetcher } from '../lib/api';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig 
      value={{
        fetcher,
        revalidateOnFocus: true,     // Revalidate cache on tab focus
        dedupingInterval: 2000,      // Collapse duplicate calls made within 2 seconds
        errorRetryCount: 3
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

---

## 3. Hook Migration Strategy

We will replace the custom `useEffect` fetch loops in our shared hooks with SWR hooks:

### A. Exchange Rate (`useExchangeRate.ts`)
```typescript
import useSWR from 'swr';

export function useExchangeRate() {
  const { data, error, isLoading, mutate } = useSWR('/api/exchange-rate', {
    refreshInterval: 60000 // Refresh exchange rates every minute
  });

  return {
    usdToToman: data?.usdToToman ?? 60000,
    isLoading,
    error,
    refreshRate: mutate
  };
}
```

### B. Subscription Status (`useSubscriptionStatus.ts`)
```typescript
import useSWR from 'swr';

export function useSubscriptionStatus() {
  const { data, error, isLoading, mutate } = useSWR('/api/payments/status');

  return {
    subStatus: data,
    isLoading,
    error,
    refreshSubStatus: mutate
  };
}
```

### C. Standardizing Other Hooks
Apply SWR fetching to:
- **`usePrices`**: `/api/payments/prices`
- **`useCryptoDetails`**: `/api/settings/crypto-details`
- **`useTradesTags`**: `/api/trades/tags`
- **`useTradesEmotions`**: `/api/trades/emotions`

---

## 4. Page Integration & Cleanups

### A. Dashboard (`apps/web/src/app/dashboard/page.tsx`)
- Remove duplicate local Axios fetching states.
- Clean up separate `fetchSubStatus`, `fetchDashboard`, and `/api/exchange-rate` effects.
- Bind the SWR `data` directly to metrics cards and render skeletons when `isLoading` is true.

### B. Settings Page (`apps/web/src/app/settings/page.tsx`)
- Replace the legacy 7 individual mount fetches with SWR:
  ```typescript
  const { data: settings, error, isLoading } = useSWR('/api/settings/all');
  ```

---

## 5. Cache Mutation & Optimistic Updates

Whenever a user mutates data (e.g., adding, updating, or deleting a trade), we will call SWR's global `mutate` to instantly invalidate the cache and trigger a background refresh:

```typescript
import { mutate } from 'swr';

// On successful trade creation/update:
mutate('/api/trades?limit=200&offset=0&accountId=...');
```

---

## 6. Verification Checklist
- [ ] Run `npm run build` to verify there are no TypeScript or compilation errors.
- [ ] Inspect the Chrome DevTools **Network tab** on page transitions (e.g. from Dashboard to Trades) to verify cached endpoints are not re-requested.
