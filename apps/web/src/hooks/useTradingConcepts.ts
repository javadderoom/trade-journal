import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface TradingConcept {
  id: string;
  name: string;
  allowed_roles: string[];
  color: string | null;
  icon: string | null;
}

export function useTradingConcepts() {
  const [concepts, setConcepts] = useState<TradingConcept[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/api/trading-concepts')
      .then(res => {
        if (mounted) {
          setConcepts(res.data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load trading concepts', err);
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  return { concepts, loading };
}
