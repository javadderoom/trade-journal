'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toPersianDigits } from '@/utils/farsi';
import { notify } from '@/lib/notify';

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  plan: 'FREE' | 'STANDARD' | 'PRO';
  role: 'USER' | 'ADMIN';
  created_at: string;
  expires_at: string | null;
}

export default function Admin2UsersPage() {
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async (p = 1, s = '') => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/users', {
        params: { page: p, pageSize: 20, search: s || undefined },
      });
      if (res.data && Array.isArray(res.data.data)) {
        setUsersList(res.data.data);
        setPage(res.data.pagination.page);
        setTotalPages(res.data.pagination.totalPages);
        setTotal(res.data.pagination.total);
      } else if (Array.isArray(res.data)) {
        setUsersList(res.data);
        setTotalPages(1);
        setTotal(res.data.length);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      notify.error('خطا در دریافت لیست کاربران');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1, search);
  }, [fetchUsers, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
  };

  return (
    <div className="admin-panel-card">
      <div className="card-header-actions">
        <h3>کاربران ثبت‌نام شده ({toPersianDigits(total)})</h3>
      </div>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}
      >
        <input
          type="text"
          placeholder="جستجو بر اساس نام، ایمیل یا تلفن..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', color: '#fff', borderRadius: '6px', fontSize: '0.85rem', flex: 1, maxWidth: '360px' }}
        />
        <button type="submit" className="admin-btn" style={{ padding: '8px 16px' }}>جستجو</button>
        {search && (
          <button
            type="button"
            className="admin-btn btn-secondary"
            style={{ padding: '8px 16px' }}
            onClick={clearSearch}
          >
            حذف فیلتر
          </button>
        )}
      </form>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>نام</th>
              <th>ایمیل</th>
              <th>تلفن همراه</th>
              <th>پلن فعلی</th>
              <th>نقش</th>
              <th>تاریخ عضویت</th>
              <th>انقضا اشتراک</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                  <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>sync</span>
                </td>
              </tr>
            ) : usersList.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#a0aec0' }}>
                  هیچ کاربری یافت نشد.
                </td>
              </tr>
            ) : (
              usersList.map((u) => (
                <tr key={u.id}>
                  <td>{u.name || '-'}</td>
                  <td style={{ direction: 'ltr' }}>{u.email}</td>
                  <td>{u.phone || '-'}</td>
                  <td>
                    <span className={`badge ${u.plan.toLowerCase()}`}>
                      {u.plan === 'FREE' ? 'رایگان' : u.plan === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'}
                    </span>
                  </td>
                  <td>{u.role === 'ADMIN' ? 'مدیر' : 'کاربر'}</td>
                  <td>{new Date(u.created_at).toLocaleDateString('fa-IR')}</td>
                  <td>
                    {u.expires_at ? new Date(u.expires_at).toLocaleDateString('fa-IR') : 'نامحدود / غیرفعال'}
                  </td>
                  <td>
                    <button
                      className="admin-btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      تغییر پلن
                    </button>
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
            onClick={() => fetchUsers(page - 1, search)}
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
            onClick={() => fetchUsers(page + 1, search)}
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}
