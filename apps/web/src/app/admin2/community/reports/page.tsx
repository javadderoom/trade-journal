'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toPersianDigits } from '@/utils/farsi';
import { notify } from '@/lib/notify';

interface CommunityReport {
  id: string;
  targetId: string;
  targetType: 'POST' | 'COMMENT' | 'THREAD' | 'REPLY';
  reason: string;
  note: string | null;
  status: 'PENDING' | 'DISMISSED' | 'ACTION_TAKEN';
  createdAt: string;
  reporter: { email: string; name: string | null };
}

export default function AdminCommunityReportsPage() {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchReports = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/community/reports', {
        params: { page: p, pageSize: 20 },
      });
      if (res.data && Array.isArray(res.data.data)) {
        setReports(res.data.data);
        setPage(res.data.pagination.page);
        setTotalPages(res.data.pagination.totalPages);
        setTotal(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      notify.error('خطا در دریافت لیست گزارش‌ها');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(1);
  }, [fetchReports]);

  const handleAction = async (id: string, action: 'DISMISS' | 'HIDE') => {
    if (!confirm(`Are you sure you want to ${action === 'HIDE' ? 'hide this content' : 'dismiss this report'}?`)) return;
    try {
      await api.post(`/api/admin/community/reports/${id}/action`, { action });
      notify.success('عملیات با موفقیت انجام شد');
      fetchReports(page);
    } catch (err) {
      console.error('Action failed:', err);
      notify.error('خطا در انجام عملیات');
    }
  };

  return (
    <div className="admin-panel-card">
      <div className="card-header-actions">
        <h3>گزارش‌های تخلف جامعه ({toPersianDigits(total)})</h3>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>تاریخ گزارش</th>
              <th>گزارش‌دهنده</th>
              <th>نوع محتوا</th>
              <th>شناسه محتوا</th>
              <th>دلیل</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                  <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>sync</span>
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#a0aec0' }}>
                  گزارشی یافت نشد.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id}>
                  <td style={{ direction: 'ltr' }}>{new Date(r.createdAt).toLocaleString('fa-IR')}</td>
                  <td>{r.reporter.name || r.reporter.email}</td>
                  <td>{r.targetType}</td>
                  <td style={{ direction: 'ltr', fontSize: '0.8rem' }}>{r.targetId}</td>
                  <td>{r.reason}</td>
                  <td>
                    <span className={`badge ${r.status === 'PENDING' ? 'warning' : r.status === 'DISMISSED' ? 'free' : 'error'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="admin-btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          onClick={() => handleAction(r.id, 'DISMISS')}
                        >
                          رد کردن
                        </button>
                        <button
                          className="admin-btn"
                          style={{ padding: '6px 12px', fontSize: '0.78rem', backgroundColor: '#e53e3e', color: '#fff' }}
                          onClick={() => handleAction(r.id, 'HIDE')}
                        >
                          مخفی کردن محتوا
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', marginTop: '16px' }}>
          <button
            className="admin-btn btn-secondary"
            style={{ padding: '6px 14px' }}
            disabled={page <= 1}
            onClick={() => fetchReports(page - 1)}
          >
            قبلی
          </button>
          <span style={{ color: '#a0aec0', fontSize: '0.85rem' }}>
            صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
          </span>
          <button
            className="admin-btn btn-secondary"
            style={{ padding: '6px 14px' }}
            disabled={page >= totalPages}
            onClick={() => fetchReports(page + 1)}
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}
