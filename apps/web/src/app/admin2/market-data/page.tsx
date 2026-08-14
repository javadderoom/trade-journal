'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';
import LoadingButton from '@/components/ui/LoadingButton';

interface CacheStatus {
  symbol: string;
  timeframe: string;
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
  nextRunTime: string | null;
}

interface MarketDataStatus {
  symbols: { name: string; category: string }[];
  timeframes: string[];
  cache: CacheStatus[];
  job: JobStatus;
  totalPairs: number;
}

export default function MarketDataAdminPage() {
  const [data, setData] = useState<MarketDataStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/api/admin/market-data/status');
      setData(res.data);
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 10 seconds if job is running
    const interval = setInterval(() => {
      if (data?.job?.isRunning) {
        fetchStatus();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [data?.job?.isRunning]);

  const handleRefresh = async (symbol?: string) => {
    setRefreshing(symbol || 'ALL');
    try {
      const payload = symbol ? { symbol } : {};
      await api.post('/api/admin/market-data/refresh', payload);
      notify.success(symbol ? `Refresh started for ${symbol}` : 'Full refresh started');
      fetchStatus();
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'Failed to trigger refresh');
    } finally {
      setRefreshing(null);
    }
  };

  if (loading && !data) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#a0aec0' }}>Loading market data status...</div>;
  }

  if (!data) return null;

  return (
    <div className="admin-panel-card">
      <div className="card-header-actions">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#06b6d4' }}>monitoring</span>
            کش دیتای بازار (Market Data Cache)
          </h3>
          <p style={{ color: '#a0aec0', fontSize: '0.85rem', marginTop: '4px' }}>
            مدیریت کش نمودارهای تاریخی Twelve Data
          </p>
        </div>
        <LoadingButton
          className="admin-btn"
          onClick={() => handleRefresh()}
          disabled={refreshing !== null || data.job.isRunning}
          isLoading={data.job.isRunning}
          style={{ background: '#06b6d4' }}
        >
          <span className="material-symbols-outlined">sync</span>
          <span>{data.job.isRunning ? 'در حال بروزرسانی...' : 'بروزرسانی کل کش'}</span>
        </LoadingButton>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div className="stat-card" style={{ flex: 1, padding: '16px', minWidth: '200px' }}>
          <div className="stat-info">
            <span className="stat-label">وضعیت کرون جاب</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: data.job.isRunning ? '#fbbf24' : '#34d399',
                animation: data.job.isRunning ? 'pulse 2s infinite' : 'none'
              }}></div>
              <span className="stat-value" style={{ fontSize: '1.2rem', color: '#fff' }}>
                {data.job.isRunning ? 'در حال اجرا' : 'آماده به کار'}
              </span>
            </div>
          </div>
        </div>
        <div className="stat-card" style={{ flex: 1, padding: '16px', minWidth: '200px' }}>
          <div className="stat-info">
            <span className="stat-label">زمان اجرای بعدی</span>
            <span className="stat-value" style={{ fontSize: '1.1rem', color: '#fff', direction: 'ltr' }}>
              {data.job.nextRunTime ? new Date(data.job.nextRunTime).toLocaleString('fa-IR') : 'نامشخص'}
            </span>
          </div>
        </div>
        <div className="stat-card" style={{ flex: 1, padding: '16px', minWidth: '200px' }}>
          <div className="stat-info">
            <span className="stat-label">تعداد جفت‌ارزهای تحت نظر</span>
            <span className="stat-value" style={{ fontSize: '1.2rem', color: '#fff' }}>
              {data.totalPairs} جفت‌ارز
            </span>
          </div>
        </div>
      </div>

      {data.job.lastRunResult && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h4 style={{ color: '#fff', marginBottom: '16px', fontSize: '1rem' }}>خلاصه اجرای قبلی</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', color: '#cbd5e1' }}>
            <div><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.85rem' }}>مدت زمان</span> {Math.round(data.job.lastRunResult.duration / 1000)}s</div>
            <div><span style={{ color: '#34d399', display: 'block', fontSize: '0.85rem' }}>موفق</span> {data.job.lastRunResult.successes}</div>
            <div><span style={{ color: '#f43f5e', display: 'block', fontSize: '0.85rem' }}>ناموفق</span> {data.job.lastRunResult.failures}</div>
            <div><span style={{ color: '#fbbf24', display: 'block', fontSize: '0.85rem' }}>صرف‌نظر شده (آپدیت بود)</span> {data.job.lastRunResult.skipped}</div>
          </div>
          {data.job.lastRunResult.errors && data.job.lastRunResult.errors.length > 0 && (
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '6px', color: '#fb7185', maxHeight: '150px', overflowY: 'auto' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>خطاها:</div>
              <ul style={{ paddingLeft: '20px', direction: 'ltr' }}>
                {data.job.lastRunResult.errors.map((e: any, i: number) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{e.symbol} ({e.timeframe}): {e.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>نماد (Symbol)</th>
              <th>دسته‌بندی</th>
              {data.timeframes.map(tf => (
                <th key={tf} style={{ textAlign: 'center' }}>{tf}</th>
              ))}
              <th style={{ textAlign: 'left' }}>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {data.symbols.map(symbol => (
              <tr key={symbol.name}>
                <td style={{ direction: 'ltr', fontWeight: 'bold', color: '#fff' }}>{symbol.name}</td>
                <td>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', padding: '4px 8px', background: '#334155', color: '#cbd5e1', borderRadius: '4px' }}>
                    {symbol.category}
                  </span>
                </td>
                {data.timeframes.map(tf => {
                  const cache = data.cache.find(c => c.symbol === symbol.name && c.timeframe === tf);
                  if (!cache) return <td key={tf} style={{ textAlign: 'center', color: '#475569' }}>-</td>;
                  
                  return (
                    <td key={tf} style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div
                          title={cache.isStale ? 'منقضی شده (Stale)' : 'بروز (Fresh)'}
                          style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: cache.isStale ? '#f43f5e' : '#10b981'
                          }}
                        ></div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {cache.candleCount > 0 ? `${(cache.candleCount / 1000).toFixed(1)}k` : '0'}
                        </span>
                      </div>
                    </td>
                  );
                })}
                <td style={{ textAlign: 'left' }}>
                  <button
                    onClick={() => handleRefresh(symbol.name)}
                    disabled={refreshing !== null || data.job.isRunning}
                    className="admin-btn btn-secondary"
                    style={{ padding: '6px', minWidth: 'unset', width: '36px', height: '36px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}
                    title="بروزرسانی اجباری این نماد"
                  >
                    <span className={`material-symbols-outlined ${refreshing === symbol.name ? 'spin' : ''}`} style={{ fontSize: '1.2rem', margin: 0 }}>
                      sync
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
