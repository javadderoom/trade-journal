'use client';

import React from 'react';
import { toPersianDigits, formatPersianCurrency, formatToman } from '../../utils/farsi';
import { useTranslation } from '../../store/useAppStore';

interface SummaryBarProps {
  count: number;
  winRate: number;
  totalProfit: number;
  usdToToman: number;
}

export default function SummaryBar({ count, winRate, totalProfit, usdToToman }: SummaryBarProps) {
  const { t, language } = useTranslation();

  const formatCurrency = (val: number) => {
    return formatPersianCurrency(val);
  };

  return (
    <div className="summary-bar">
      <div className="summary-card">
        <div className="dot dot-secondary"></div>
        <span className="label">{t('trades.count')}:</span>
        <span className="value">
          {toPersianDigits(count)} <span className="unit">{t('trades.tradeUnit')}</span>
        </span>
      </div>
      <div className="summary-card">
        <div className="dot dot-primary"></div>
        <span className="label">{t('trades.winRate')}:</span>
        <span className="value" style={{ color: '#61f9b1' }}>
          {toPersianDigits(winRate)}٪
        </span>
      </div>
      <div className="summary-card glow-profit-card">
        <span className="material-symbols-outlined card-icon">account_balance_wallet</span>
        <span className="label">{t('trades.totalProfit')}:</span>
        <span className="value" dir="ltr">
          {formatCurrency(totalProfit)}
        </span>
        {language === 'fa' && (
          <span className="toman-value">
            {formatToman(totalProfit, usdToToman)}
          </span>
        )}
      </div>
    </div>
  );
}
