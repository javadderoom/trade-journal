'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toPersianDigits } from '@/utils/farsi';
import { notify } from '@/lib/notify';

interface CouponCode {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  expireDate: string;
  isAccountBound: boolean;
  created_at: string;
}

export default function Admin2CouponsPage() {
  const [couponsList, setCouponsList] = useState<CouponCode[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountPercent: 30,
    maxUses: 100,
    expireDate: '',
    isAccountBound: false,
  });

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/coupons');
      setCouponsList(res.data);
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
      notify.error('خطا در دریافت لیست کدهای تخفیف');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.expireDate) {
      notify.error('تمامی فیلدها را پر کنید');
      return;
    }
    try {
      await api.post('/api/admin/coupons', newCoupon);
      setNewCoupon({
        code: '',
        discountPercent: 30,
        maxUses: 100,
        expireDate: '',
        isAccountBound: false,
      });
      fetchCoupons();
      notify.success('کد تخفیف با موفقیت ساخته شد');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در ساخت کد تخفیف');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    const ok = await notify.confirm({
      title: 'حذف کد تخفیف',
      message: 'آیا از حذف این کد تخفیف اطمینان دارید؟',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/api/admin/coupons/${id}`);
      fetchCoupons();
      notify.success('کد تخفیف با موفقیت حذف شد');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در حذف کد تخفیف');
    }
  };

  return (
    <div className="admin-panel-card">
      <div className="card-header-actions">
        <h3>مدیریت کدهای تخفیف</h3>
      </div>

      <form onSubmit={handleCreateCoupon} className="admin-form-grid" style={{ marginBottom: '24px' }}>
        <div className="form-group">
          <label>کد تخفیف</label>
          <input
            type="text"
            placeholder="مثال: SPRING40"
            value={newCoupon.code}
            onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
            style={{ textTransform: 'uppercase' }}
          />
        </div>
        <div className="form-group">
          <label>درصد تخفیف</label>
          <input
            type="number"
            min="1"
            max="100"
            value={newCoupon.discountPercent}
            onChange={(e) => setNewCoupon({ ...newCoupon, discountPercent: Number(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>تعداد دفعات استفاده مجاز</label>
          <input
            type="number"
            min="1"
            value={newCoupon.maxUses}
            onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: Number(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>تاریخ انقضا</label>
          <input
            type="date"
            value={newCoupon.expireDate}
            onChange={(e) => setNewCoupon({ ...newCoupon, expireDate: e.target.value })}
          />
        </div>
        <div className="form-group" style={{ justifyContent: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={newCoupon.isAccountBound}
              onChange={(e) => setNewCoupon({ ...newCoupon, isAccountBound: e.target.checked })}
            />
            <span>کد دائمی متصل به حساب</span>
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button type="submit" className="admin-btn" style={{ width: '100%' }}>
            <span className="material-symbols-outlined">add</span>
            <span>افزودن تخفیف</span>
          </button>
        </div>
      </form>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>کد</th>
              <th>درصد تخفیف</th>
              <th>دفعات استفاده شده</th>
              <th>سقف مجاز</th>
              <th>انقضا</th>
              <th>نوع</th>
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
            ) : couponsList.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#a0aec0' }}>
                  هیچ کد تخفیفی یافت نشد.
                </td>
              </tr>
            ) : (
              couponsList.map((c) => (
                <tr key={c.id}>
                  <td style={{ direction: 'ltr', fontWeight: 'bold' }}>{c.code}</td>
                  <td>{toPersianDigits(c.discountPercent)}%</td>
                  <td>{toPersianDigits(c.usedCount)} بار</td>
                  <td>{toPersianDigits(c.maxUses)} بار</td>
                  <td>{new Date(c.expireDate).toLocaleDateString('fa-IR')}</td>
                  <td>{c.isAccountBound ? 'حساب‌محور' : 'یکبار مصرف عمومی'}</td>
                  <td>
                    <button
                      className="admin-btn btn-danger"
                      onClick={() => handleDeleteCoupon(c.id)}
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      حذف
                    </button>
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
