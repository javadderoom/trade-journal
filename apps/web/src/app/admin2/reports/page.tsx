'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { toPersianDigits } from '@/utils/farsi';

interface CommunityReport {
  id: string;
  reason: string;
  status: 'PENDING' | 'ACTION_TAKEN' | 'DISMISSED';
  note: string | null;
  targetType: string;
  targetId: string;
  createdAt: string;
  reporter: {
    name: string | null;
    email: string;
  };
}

export default function Admin2ReportsPage() {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/community/reports');
      setReports(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      notify.error('خطا در دریافت لیست گزارش‌ها');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleAction = async (id: string, action: 'DISMISS' | 'HIDE_TARGET') => {
    const isDismiss = action === 'DISMISS';
    const ok = await notify.confirm({
      title: isDismiss ? 'رد گزارش' : 'حذف/مخفی کردن محتوا',
      message: isDismiss ? 'آیا از رد کردن این گزارش اطمینان دارید؟' : 'آیا از مخفی کردن محتوای گزارش شده اطمینان دارید؟',
      confirmLabel: 'تایید',
      danger: !isDismiss
    });

    if (!ok) return;

    try {
      await api.post(`/api/admin/community/reports/${id}/action`, { action });
      notify.success('عملیات با موفقیت انجام شد');
      fetchReports();
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در انجام عملیات');
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasons: Record<string, string> = {
      SPAM: 'اسپم',
      HARASSMENT: 'آزار و اذیت',
      MISINFORMATION: 'اطلاعات غلط',
      SCAM: 'کلاهبرداری',
      INAPPROPRIATE: 'محتوای نامناسب',
      OTHER: 'دیگر'
    };
    return reasons[reason] || reason;
  };

  return (
    <div className="admin-panel-card">
      <div className="card-header-actions">
        <h3>گزارش‌های جامعه ({toPersianDigits(reports.length)})</h3>
      </div>

      <div className="admin-table-wrapper" style={{ marginTop: '16px' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>کاربر گزارش‌دهنده</th>
              <th>دلیل</th>
              <th>نوع محتوا</th>
              <th>توضیحات</th>
              <th>تاریخ</th>
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
                  هیچ گزارشی یافت نشد.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div>{r.reporter.name || '-'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#a0aec0', direction: 'ltr', textAlign: 'right' }}>{r.reporter.email}</div>
                  </td>
                  <td>{getReasonLabel(r.reason)}</td>
                  <td>{r.targetType}</td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.note || ''}>
                    {r.note || '-'}
                  </td>
                  <td style={{ direction: 'ltr', textAlign: 'right' }}>{new Date(r.createdAt).toLocaleDateString('fa-IR')}</td>
                  <td>
                    <span className={`badge ${r.status === 'PENDING' ? 'free' : r.status === 'DISMISSED' ? 'standard' : 'pro'}`}>
                      {r.status === 'PENDING' ? 'در انتظار بررسی' : r.status === 'DISMISSED' ? 'رد شده' : 'اقدام شده'}
                    </span>
                  </td>
                  <td>
                    {r.status === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="admin-btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                          onClick={() => handleAction(r.id, 'DISMISS')}
                        >
                          رد گزارش
                        </button>
                        <button
                          className="admin-btn"
                          style={{ padding: '6px 10px', fontSize: '0.78rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                          onClick={() => handleAction(r.id, 'HIDE_TARGET')}
                        >
                          حذف محتوا
                        </button>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
