'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';

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
    return <div className="p-8 text-center text-slate-400">Loading market data status...</div>;
  }

  if (!data) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400">monitoring</span>
            Market Data Cache
          </h1>
          <p className="text-slate-400 mt-1">Manage Twelve Data pre-cached historical charts</p>
        </div>
        <button
          onClick={() => handleRefresh()}
          disabled={refreshing !== null || data.job.isRunning}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <span className={`material-symbols-outlined ${data.job.isRunning ? 'animate-spin' : ''}`}>
            sync
          </span>
          {data.job.isRunning ? 'Refresh Running...' : 'Refresh All Cache'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="text-slate-400 text-sm font-medium mb-1">Cron Job Status</div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${data.job.isRunning ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
            <span className="text-lg font-semibold text-white">
              {data.job.isRunning ? 'Running' : 'Idle'}
            </span>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="text-slate-400 text-sm font-medium mb-1">Next Scheduled Run</div>
          <div className="text-lg font-semibold text-white">
            {data.job.nextRunTime ? new Date(data.job.nextRunTime).toLocaleString() : 'N/A'}
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="text-slate-400 text-sm font-medium mb-1">Total Monitored Pairs</div>
          <div className="text-lg font-semibold text-white">
            {data.totalPairs} pairs
          </div>
        </div>
      </div>

      {data.job.lastRunResult && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 text-sm">
          <h3 className="text-white font-medium mb-2">Last Run Summary</h3>
          <div className="grid grid-cols-4 gap-4 text-slate-300">
            <div><span className="text-slate-500 block">Duration</span> {Math.round(data.job.lastRunResult.duration / 1000)}s</div>
            <div><span className="text-emerald-500 block">Successes</span> {data.job.lastRunResult.successes}</div>
            <div><span className="text-rose-500 block">Failures</span> {data.job.lastRunResult.failures}</div>
            <div><span className="text-amber-500 block">Skipped (Fresh)</span> {data.job.lastRunResult.skipped}</div>
          </div>
          {data.job.lastRunResult.errors.length > 0 && (
            <div className="mt-3 p-3 bg-rose-500/10 text-rose-400 rounded border border-rose-500/20 max-h-32 overflow-y-auto">
              <div className="font-medium mb-1">Errors:</div>
              <ul className="list-disc pl-4 space-y-1">
                {data.job.lastRunResult.errors.map((e: any, i: number) => (
                  <li key={i}>{e.symbol} ({e.timeframe}): {e.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700/50">
                <th className="p-4 font-medium">Symbol</th>
                <th className="p-4 font-medium">Category</th>
                {data.timeframes.map(tf => (
                  <th key={tf} className="p-4 font-medium text-center">{tf}</th>
                ))}
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {data.symbols.map(symbol => (
                <tr key={symbol.name} className="hover:bg-slate-700/20 transition-colors">
                  <td className="p-4 font-bold text-white">{symbol.name}</td>
                  <td className="p-4">
                    <span className="text-xs uppercase px-2 py-1 bg-slate-700 text-slate-300 rounded">
                      {symbol.category}
                    </span>
                  </td>
                  {data.timeframes.map(tf => {
                    const cache = data.cache.find(c => c.symbol === symbol.name && c.timeframe === tf);
                    if (!cache) return <td key={tf} className="p-4 text-center text-slate-600">-</td>;
                    
                    return (
                      <td key={tf} className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${cache.isStale ? 'bg-rose-500' : 'bg-emerald-500'}`} title={cache.isStale ? 'Stale' : 'Fresh'}></div>
                          <span className="text-xs text-slate-400">{cache.candleCount > 0 ? `${(cache.candleCount / 1000).toFixed(1)}k` : '0'}</span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleRefresh(symbol.name)}
                      disabled={refreshing !== null || data.job.isRunning}
                      className="text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:hover:text-cyan-400"
                      title="Force refresh this symbol"
                    >
                      <span className={`material-symbols-outlined text-sm ${refreshing === symbol.name ? 'animate-spin' : ''}`}>
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
    </div>
  );
}
