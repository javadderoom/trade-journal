'use client';

import React from 'react';
import { toPersianDigits, formatPersianCurrency, formatToman } from '../utils/farsi';

interface SummaryBarProps {
  count: number;
  winRate: number;
  totalProfit: number;
  usdToToman: number;
}

export default function SummaryBar({ count, winRate, totalProfit, usdToToman }: SummaryBarProps) {
  const formatCurrency = (val: number) => {
    return formatPersianCurrency(val);
  };

  return (
    <div className="summary-bar">
      <div className="summary-card">
        <div className="dot dot-secondary"></div>
        <span className="label">تعداد:</span>
        <span className="value">
          {toPersianDigits(count)} <span className="unit">معامله</span>
        </span>
      </div>
      <div className="summary-card">
        <div className="dot dot-primary"></div>
        <span className="label">وین‌ریت:</span>
        <span className="value" style={{ color: '#61f9b1' }}>
          {toPersianDigits(winRate)}٪
        </span>
      </div>
      <div className="summary-card glow-profit-card">
        <span className="material-symbols-outlined card-icon">account_balance_wallet</span>
        <span className="label">مجموع سود:</span>
        <span className="value" dir="ltr">
          {formatCurrency(totalProfit)}
        </span>
        <span className="toman-value">
          {formatToman(totalProfit, usdToToman)}
        </span>
      </div>
    </div>
  );
}
