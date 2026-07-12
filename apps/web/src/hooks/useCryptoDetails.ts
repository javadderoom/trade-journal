'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const DEFAULT_CRYPTO = {
  usdtAddress: '',
  trxAddress: '',
  standard: { monthlyUsd: 5.0, annualUsd: 45.0 },
  pro: { monthlyUsd: 10.0, annualUsd: 90.0 },
};

export function useCryptoDetails() {
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    api.get('/api/settings/crypto-details')
      .then(res => setDetails(res.data))
      .catch(() => {});
  }, []);

  return details || DEFAULT_CRYPTO;
}
