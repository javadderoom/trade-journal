'use client';

import React from 'react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'باز', color: '#3ddc97', bg: 'rgba(61, 220, 151, 0.12)' },
  WAITING: { label: 'در انتظار', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  RESOLVED: { label: 'حل شده', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.12)' },
  CLOSED: { label: 'بسته شده', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  LOW: { label: 'کم', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' },
  NORMAL: { label: 'عادی', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.12)' },
  HIGH: { label: 'بالا', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  URGENT: { label: 'فوری', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
};

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'عمومی',
  TECHNICAL: 'فنی',
  BILLING: 'مالی',
  FEATURE_REQUEST: 'درخواست امکان',
  BUG_REPORT: 'گزارش باگ',
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 600,
        color: config.color,
        background: config.bg,
      }}
    >
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.NORMAL;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 600,
        color: config.color,
        background: config.bg,
      }}
    >
      {config.label}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const label = CATEGORY_LABELS[category] || category;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 500,
        color: '#bbcabe',
        background: 'rgba(187, 202, 190, 0.08)',
      }}
    >
      {label}
    </span>
  );
}
