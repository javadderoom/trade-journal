import React from 'react';
import styles from './TradePreviewCard.module.scss';

export interface TradePreviewProps {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  exitPrice: number | null;
  entryTime: string;
  exitTime: string | null;
  resultR: number;
  riskReward: number | null;
  setup: { id: string; name: string } | null;
  entryTimeframe: string | null;
  analysisTimeframe: string | null;
  images: { id: string; url: string }[];
}

export function TradePreviewCard({ trade }: { trade: TradePreviewProps }) {
  const isProfit = trade.resultR >= 0;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.symbol}>
            <span>{trade.symbol}</span>
            <span className={`${styles.direction} ${trade.direction === 'BUY' ? styles.buy : styles.sell}`}>
                {trade.direction}
            </span>
        </div>
        <div className={styles.metric} style={{ alignItems: 'flex-end', gap: 0 }}>
          <span className={styles.label}>Result (R)</span>
          <span className={`${styles.result} ${isProfit ? styles.profit : styles.loss}`}>
            {trade.resultR > 0 ? '+' : ''}{trade.resultR.toFixed(2)}R
          </span>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metric}>
          <span className={styles.label}>Entry Price</span>
          <span className={styles.value}>{trade.entryPrice}</span>
        </div>
        
        {trade.exitPrice !== null && (
          <div className={styles.metric}>
            <span className={styles.label}>Exit Price</span>
            <span className={styles.value}>{trade.exitPrice}</span>
          </div>
        )}

        {trade.takeProfit !== null && (
          <div className={styles.metric}>
            <span className={styles.label}>Take Profit</span>
            <span className={styles.value}>{trade.takeProfit}</span>
          </div>
        )}

        {trade.stopLoss !== null && (
          <div className={styles.metric}>
            <span className={styles.label}>Stop Loss</span>
            <span className={styles.value}>{trade.stopLoss}</span>
          </div>
        )}

        {trade.riskReward !== null && (
            <div className={styles.metric}>
                <span className={styles.label}>RR</span>
                <span className={styles.value}>1:{trade.riskReward.toFixed(2)}</span>
            </div>
        )}

        {trade.setup && (
          <div className={styles.metric}>
            <span className={styles.label}>Setup</span>
            <span className={styles.value}>{trade.setup.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
