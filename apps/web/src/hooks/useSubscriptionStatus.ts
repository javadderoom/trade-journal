'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface SubStatus {
  plan: string;
  usage?: { monthlyTrades: number };
  pendingReceipt?: {
    id: string;
    plan: string;
    period: string;
    status: string;
    rejectionReason?: string;
  } | null;
}

export function useSubscriptionStatus() {
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null);
  const [dismissedRejectionId, setDismissedRejectionId] = useState<string | null>(null);

  const fetchSubStatus = useCallback(async () => {
    try {
      const res = await api.get('/api/payments/status');
      setSubStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
    }
  }, []);

  useEffect(() => {
    fetchSubStatus();
  }, [fetchSubStatus]);

  return { subStatus, dismissedRejectionId, setDismissedRejectionId, refetch: fetchSubStatus };
}
