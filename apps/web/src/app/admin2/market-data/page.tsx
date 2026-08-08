'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { notify } from '@/lib/notify';

// Define types based on what we saw in the API route
interface CacheStatus {
  symbol: string;
  timeframe: string;
  provider: string;
  category: string;
  candleCount: number;
  lastFetched: string;
  isStale: boolean;
  ageMinutes: number;
}

interface JobStatus {
  isRunning: boolean;
  lastRunTime: string | null;
  lastRunResult: any | null;
  nextRunTime: Date | null;
}

interface MarketDataStatus {
  symbols: { name: string; category: string }[];
  timeframes: string[];
  cache: CacheStatus[];
  job: JobStatus;
  totalPairs: number;
}

export default function MarketDataAdminPage() {
  const { data, error, mutate } = useSWR<MarketDataStatus>('/api/admin/market-data/status', fetcher);
  
  const [isPolling, setIsPolling] = useState(false);
  const [refreshingSymbol, setRefreshingSymbol] = useState<string | null>(null);

  // Poll job status if a job is running
  useSWR(
    isPolling ? '/api/admin/market-data/refresh/status' : null,
    fetcher,
    {
      refreshInterval: 5000,
      onSuccess: (jobData: JobStatus) => {
        if (!jobData.isRunning) {
          setIsPolling(false);
          setRefreshingSymbol(null);
          mutate(); // Re-fetch main status
          notify.success('به‌روزرسانی دیتای بازار با موفقیت انجام شد.');
        }
      }
    }
  );

  // Sync initial polling state if API says job is running
  useEffect(() => {
    if (data?.job?.isRunning) {
      setIsPolling(true);
    }
  }, [data?.job?.isRunning]);

  const handleRefreshAll = async () => {
    try {
      setRefreshingSymbol('all');
      await fetch('/api/admin/market-data/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      notify.success('درخواست به‌روزرسانی کل دیتای بازار ارسال شد.');
      setIsPolling(true);
    } catch (err: any) {
      setRefreshingSymbol(null);
      notify.error(err.message || 'خطا در ارسال درخواست به‌روزرسانی');
    }
  };

  const handleRefreshSymbol = async (symbol: string) => {
    try {
      setRefreshingSymbol(symbol);
      await fetch('/api/admin/market-data/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
      notify.success(`درخواست به‌روزرسانی برای نماد ${symbol} ارسال شد.`);
      mutate(); // Re-fetch immediately to reflect changes
      setRefreshingSymbol(null);
    } catch (err: any) {
      setRefreshingSymbol(null);
      notify.error(err.message || `خطا در به‌روزرسانی نماد ${symbol}`);
    }
  };

  if (error) {
    return (
      <div className="admin-panel-card">
        <p style={{ color: '#f56565' }}>خطا در دریافت اطلاعات دیتای بازار</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>sync</span>
      </div>
    );
  }

  const { cache, job, totalPairs } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Job Status Card */}
      <div className="admin-panel-card">
        <div className="card-header-actions">
          <h3>وضعیت سرویس همگام‌سازی</h3>
          <button
            className="admin-btn"
            onClick={handleRefreshAll}
            disabled={isPolling || refreshingSymbol === 'all'}
          >
            <span className="material-symbols-outlined" style={isPolling ? { animation: 'spin 1s linear infinite' } : {}}>
              {isPolling ? 'sync' : 'cloud_download'}
            </span>
            <span>{isPolling ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی کل کش'}</span>
          </button>
        </div>

        <div className="admin-stats-grid" style={{ marginBottom: 0 }}>
          <div className="stat-card">
            <div className={`stat-icon-wrap ${isPolling ? 'pending' : ''}`}>
              <span className="material-symbols-outlined" style={isPolling ? { animation: 'spin 1s linear infinite' } : {}}>
                {isPolling ? 'autorenew' : 'done_all'}
              </span>
            </div>
            <div className="stat-info">
              <span className="stat-label">وضعیت کار پس‌زمینه</span>
              <span className="stat-value" style={{ fontSize: '1.2rem', color: isPolling ? '#ffb300' : '#e2e8f0' }}>
                {isPolling ? 'در حال اجرا...' : 'آماده'}
              </span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ background: 'rgba(66, 153, 225, 0.1)', color: '#4299e1' }}>
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div className="stat-info">
              <span className="stat-label">آخرین اجرای موفق</span>
              <span className="stat-value" style={{ fontSize: '1.2rem' }}>
                {job.lastRunTime ? new Date(job.lastRunTime).toLocaleString('fa-IR') : 'هرگز'}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <span className="material-symbols-outlined">database</span>
            </div>
            <div className="stat-info">
              <span className="stat-label">جفت ارزهای فعال</span>
              <span className="stat-value">{totalPairs}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cache Table */}
      <div className="admin-panel-card">
        <div className="card-header-actions">
          <h3>وضعیت کش کندل‌ها</h3>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>نماد (Symbol)</th>
                <th>منبع داده</th>
                <th>بازار</th>
                <th>تایم‌فریم</th>
                <th>تعداد کندل</th>
                <th>آخرین به‌روزرسانی</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {cache.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#a0aec0' }}>
                    هیچ داده‌ای یافت نشد.
                  </td>
                </tr>
              ) : (
                cache.map((c) => (
                  <tr key={`${c.symbol}-${c.timeframe}`}>
                    <td style={{ direction: 'ltr', textAlign: 'left', fontWeight: 'bold' }}>{c.symbol}</td>
                    <td>
                      <span className={`badge ${c.provider === 'twelveData' ? 'standard' : 'pro'}`}>
                        {c.provider === 'twelveData' ? 'Twelve Data' : 'London Strategic Edge'}
                      </span>
                    </td>
                    <td>{c.category === 'Crypto' ? 'کریپتو' : 'فارکس'}</td>
                    <td style={{ direction: 'ltr', textAlign: 'left' }}>{c.timeframe}</td>
                    <td>{c.candleCount.toLocaleString('en-US')}</td>
                    <td style={{ direction: 'ltr', textAlign: 'left' }}>
                      {c.candleCount > 0 ? new Date(c.lastFetched).toLocaleString('fa-IR') : '-'}
                    </td>
                    <td>
                      {c.candleCount === 0 ? (
                        <span className="badge rejected">خالی</span>
                      ) : c.isStale ? (
                        <span className="badge pending">نیاز به آپدیت</span>
                      ) : (
                        <span className="badge approved">به‌روز</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="admin-btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => handleRefreshSymbol(c.symbol)}
                        disabled={refreshingSymbol === c.symbol || refreshingSymbol === 'all'}
                      >
                        {refreshingSymbol === c.symbol ? (
                          <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite', fontSize: '16px' }}>sync</span>
                        ) : (
                          'آپدیت دستی'
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
