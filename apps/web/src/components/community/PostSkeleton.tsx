import React from 'react';
import styles from './PostSkeleton.module.scss';

export function PostSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.avatar}></div>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <div className={styles.authorName}></div>
          <div className={styles.time}></div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <div className={styles.bodyLine}></div>
          <div className={styles.bodyLine}></div>
          <div className={styles.bodyLine}></div>
        </div>
        
        <div className={styles.actions}>
          <div className={styles.action}></div>
          <div className={styles.action}></div>
          <div className={styles.action}></div>
        </div>
      </div>
    </div>
  );
}
