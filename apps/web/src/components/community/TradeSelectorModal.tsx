import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import styles from './TradeSelectorModal.module.scss';

export interface MinimalTrade {
  id: string;
  symbol: string;
  entry_time: string;
  result_r: number;
}

export function TradeSelectorModal({ 
  onClose, 
  onSelect 
}: { 
  onClose: () => void, 
  onSelect: (trade: MinimalTrade) => void 
}) {
  const { data, error, isLoading } = useSWR<{ items: MinimalTrade[] }>('/api/trades?limit=20', fetcher);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const trades = data?.items || [];

  const handleConfirm = () => {
    const trade = trades.find(t => t.id === selectedId);
    if (trade) {
      onSelect(trade);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Select Trade to Attach</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        
        <div className={styles.body}>
          {isLoading && <div className={styles.loading}>Loading recent trades...</div>}
          {error && <div className={styles.loading}>Failed to load trades.</div>}
          
          {!isLoading && !error && trades.length === 0 && (
            <div className={styles.loading}>No recent trades found.</div>
          )}

          {trades.map(trade => (
            <div 
              key={trade.id}
              className={`${styles.tradeItem} ${selectedId === trade.id ? styles.selected : ''}`}
              onClick={() => setSelectedId(trade.id)}
            >
              <div className={styles.symbolInfo}>
                <span className={styles.symbol}>{trade.symbol}</span>
                <span className={styles.date}>{new Date(trade.entry_time).toLocaleDateString()}</span>
              </div>
              <div className={`${styles.result} ${trade.result_r >= 0 ? styles.profit : styles.loss}`}>
                {trade.result_r > 0 ? '+' : ''}{trade.result_r?.toFixed(2)}R
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.confirmBtn} disabled={!selectedId} onClick={handleConfirm}>
            Attach
          </button>
        </div>
      </div>
    </div>
  );
}
