'use client';

import useSWR from 'swr';

const DEFAULT_PRICES = {
  FREE: { monthly: 0, annual: 0 },
  STANDARD: { monthly: 249000, annual: 2390000 },
  PRO: { monthly: 499000, annual: 4790000 },
};

export function usePrices() {
  const { data } = useSWR<any>('/api/payments/prices', {
    fallbackData: DEFAULT_PRICES,
  });

  return data || DEFAULT_PRICES;
}
