'use client';

import useSWR from 'swr';

const DEFAULT_CRYPTO = {
  usdtAddress: '',
  trxAddress: '',
  standard: { monthlyUsd: 5.0, annualUsd: 45.0 },
  pro: { monthlyUsd: 10.0, annualUsd: 90.0 },
};

export function useCryptoDetails() {
  const { data } = useSWR<any>('/api/settings/crypto-details', {
    fallbackData: DEFAULT_CRYPTO,
  });

  return data || DEFAULT_CRYPTO;
}
