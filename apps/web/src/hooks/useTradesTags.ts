'use client';

import useSWR from 'swr';

export interface TagObject {
  name: string;
  is_ignored: boolean;
  show_first: boolean;
}

export function useTradesTags() {
  const { data: tags = [], mutate } = useSWR<TagObject[]>('/api/trades/tags');

  return { tags, refetch: mutate };
}
