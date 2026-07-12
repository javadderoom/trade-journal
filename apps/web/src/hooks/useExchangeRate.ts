'use client';

import { useState, useEffect } from 'react';

export function useExchangeRate(defaultRate = 90000) {
  const [rate, setRate] = useState<number>(defaultRate);

  useEffect(() => {
    fetch('/api/exchange-rate')
      .then(r => r.json())
      .then(d => {
        if (d?.usdToToman && d.usdToToman > 0) setRate(d.usdToToman);
      })
      .catch(() => {});
  }, []);

  return rate;
}
