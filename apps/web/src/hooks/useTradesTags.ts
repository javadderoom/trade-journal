'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface TagObject {
  name: string;
  is_ignored: boolean;
  show_first: boolean;
}

export function useTradesTags() {
  const [tags, setTags] = useState<TagObject[]>([]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await api.get(`/api/trades/tags?t=${Date.now()}`);
      setTags(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return { tags, refetch: fetchTags };
}
