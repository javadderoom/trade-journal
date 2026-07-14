'use client';

import { useState } from 'react';
import useSWR from 'swr';

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
  const { data: subStatus, mutate } = useSWR<SubStatus>('/api/payments/status');
  const [dismissedRejectionId, setDismissedRejectionId] = useState<string | null>(null);

  return { subStatus: subStatus ?? null, dismissedRejectionId, setDismissedRejectionId, refetch: mutate };
}
