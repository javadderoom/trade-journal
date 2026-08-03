'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { toPersianDigits } from '@/utils/farsi';
import '../admin.scss';

export default function AdminExpertsPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const [activeTab, setActiveTab] = useState<'upload' | 'logs'>('upload');

  // Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLogs = async (p = 1) => {
    try {
      setIsLoadingLogs(true);
      const res = await api.get('/api/admin/ea/logs', {
        params: { page: p, pageSize: 50, userId: userIdFilter || undefined },
      });
      setLogs(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setPage(p);
    } catch (error) {
      notify.error('خطا در دریافت لاگ‌های اکسپرت');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs' && user) {
      fetchLogs(1);
    }
  }, [activeTab, user]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.length) {
      return notify.error('لطفاً یک فایل انتخاب کنید');
    }

    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      await api.post('/api/admin/ea/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      notify.success('فایل با موفقیت آپلود شد!');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'خطا در آپلود فایل');
    } finally {
      setIsUploading(false);
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>مدیریت اکسپرت متاتریدر</h1>
        <p>آپلود فایل‌های جدید و مشاهده گزارش فعالیت اکسپرت کاربران</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          آپلود فایل
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          لاگ فعالیت‌ها
        </button>
      </div>

      {activeTab === 'upload' && (
        <div className="admin-section">
          <h2>آپلود نسخه جدید اکسپرت</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
            فایل‌های .mq4، .mq5، .ex4 یا .ex5 را اینجا آپلود کنید.
          </p>
          <form onSubmit={handleUpload} className="admin-form" style={{ maxWidth: 400 }}>
            <div className="form-group">
              <label>انتخاب فایل</label>
              <input type="file" ref={fileInputRef} accept=".ex4,.ex5,.mq4,.mq5" />
            </div>
            <button type="submit" className="btn-primary" disabled={isUploading}>
              {isUploading ? 'در حال آپلود...' : 'آپلود فایل'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="admin-section">
          <h2>لاگ فعالیت‌های اکسپرت</h2>
          <form onSubmit={handleFilter} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="فیلتر بر اساس User ID"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              className="form-input"
              style={{ width: 300 }}
            />
            <button type="submit" className="btn-secondary">اعمال فیلتر</button>
          </form>

          {isLoadingLogs ? (
            <p>در حال بارگذاری...</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>تاریخ و ساعت</th>
                    <th>کاربر</th>
                    <th>حساب معاملاتی</th>
                    <th>عملیات</th>
                    <th>پیام</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center' }}>هیچ لاگی یافت نشد.</td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td dir="ltr" style={{ textAlign: 'right' }}>
                          {new Date(log.created_at).toLocaleString('fa-IR')}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>{log.user?.email}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.user_id}</div>
                        </td>
                        <td dir="ltr" style={{ textAlign: 'right' }}>
                          {log.account?.broker_name} <br/> {log.account?.account_number}
                        </td>
                        <td>
                          <span className={`badge ${log.level === 'ERROR' ? 'error' : 'success'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td>{log.message}</td>
                        <td dir="ltr" style={{ textAlign: 'right' }}>{log.ip_address || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={page === 1}
                onClick={() => fetchLogs(page - 1)}
                className="btn-secondary"
              >
                قبلی
              </button>
              <span>{toPersianDigits(page)} / {toPersianDigits(totalPages)}</span>
              <button
                disabled={page === totalPages}
                onClick={() => fetchLogs(page + 1)}
                className="btn-secondary"
              >
                بعدی
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
