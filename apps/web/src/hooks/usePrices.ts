'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const DEFAULT_PRICES = {
  FREE: { monthly: 0, annual: 0 },
  STANDARD: { monthly: 249000, annual: 2390000 },
  PRO: { monthly: 499000, annual: 4790000 },
};

export function usePrices() {
  const [prices, setPrices] = useState<any>(null);

  useEffect(() => {
    api.get('/api/payments/prices')
      .then(res => setPrices(res.data))
      .catch(() => {});
  }, []);

  return prices || DEFAULT_PRICES;
}
