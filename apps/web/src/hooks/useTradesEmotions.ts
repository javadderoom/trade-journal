'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export function useTradesEmotions() {
  const [emotions, setEmotions] = useState<{ value: string; label: string; emoji?: string }[]>([]);

  const fetchEmotions = useCallback(async () => {
    try {
      const res = await api.get(`/api/trades/emotions?t=${Date.now()}`);
      setEmotions(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchEmotions();
  }, [fetchEmotions]);

  return { emotions, refetch: fetchEmotions };
}
