'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toPersianDigits } from '@/utils/farsi';

interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  standardUsers: number;
  proUsers: number;
  totalRevenue: number;
  pendingReceiptsCount: number;
}

export default function Admin2Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-cyan-500 text-4xl">sync</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-slate-500">
        خطا در دریافت اطلاعات
      </div>
    );
  }

  return (
    <div>
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap">
            <span className="material-symbols-outlined">group</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">کل کاربران</span>
            <span className="stat-value">{toPersianDigits(stats.totalUsers)} نفر</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">کاربران رایگان</span>
            <span className="stat-value">{toPersianDigits(stats.freeUsers)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
            <span className="material-symbols-outlined">verified_user</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">کاربران استاندارد</span>
            <span className="stat-value">{toPersianDigits(stats.standardUsers)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
            <span className="material-symbols-outlined">workspace_premium</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">کاربران حرفه‌ای</span>
            <span className="stat-value">{toPersianDigits(stats.proUsers)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap revenue">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">درآمد کل</span>
            <span className="stat-value">
              {toPersianDigits(stats.totalRevenue.toLocaleString())} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>تومان</span>
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className={`stat-icon-wrap ${stats.pendingReceiptsCount > 0 ? 'pending' : ''}`}>
            <span className="material-symbols-outlined">pending_actions</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">فیش‌های در انتظار تایید</span>
            <span className="stat-value">{toPersianDigits(stats.pendingReceiptsCount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
