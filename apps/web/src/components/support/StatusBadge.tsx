'use client';

import React from 'react';
import { useTranslation } from '../../store/useAppStore';

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const map: Record<string, { key: string; color: string; bg: string }> = {
    OPEN: { key: 'support.statusOpen', color: '#3ddc97', bg: 'rgba(61, 220, 151, 0.12)' },
    WAITING: { key: 'support.statusWaiting', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
    RESOLVED: { key: 'support.statusResolved', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.12)' },
    CLOSED: { key: 'support.statusClosed', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' },
  };
  const c = map[status] || map.OPEN;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: c.color, background: c.bg }}>
      {t(c.key)}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const { t } = useTranslation();
  const map: Record<string, { key: string; color: string; bg: string }> = {
    LOW: { key: 'support.priorityLow', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' },
    NORMAL: { key: 'support.priorityNormal', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.12)' },
    HIGH: { key: 'support.priorityHigh', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
    URGENT: { key: 'support.priorityUrgent', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  };
  const c = map[priority] || map.NORMAL;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: c.color, background: c.bg }}>
      {t(c.key)}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const { t } = useTranslation();
  const map: Record<string, string> = {
    GENERAL: 'support.catGeneral',
    TECHNICAL: 'support.catTechnical',
    BILLING: 'support.catBilling',
    FEATURE_REQUEST: 'support.catFeatureRequest',
    BUG_REPORT: 'support.catBugReport',
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, color: '#bbcabe', background: 'rgba(187, 202, 190, 0.08)' }}>
      {t(map[category] || category)}
    </span>
  );
}
