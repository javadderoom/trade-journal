'use client';

import useSWR from 'swr';

export function useTradesEmotions() {
  const { data: emotions = [], mutate } = useSWR<{ value: string; label: string; emoji?: string }[]>('/api/trades/emotions');

  return { emotions, refetch: mutate };
}
