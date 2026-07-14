'use client';

import useSWR from 'swr';

const fetchJson = (url: string) => fetch(url).then(r => r.json());

export function useExchangeRate(defaultRate = 90000) {
  const { data } = useSWR<{ usdToToman: number }>('/api/exchange-rate', fetchJson, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
    dedupingInterval: 10000,
    fallbackData: { usdToToman: defaultRate },
  });

  return data?.usdToToman ?? defaultRate;
}
