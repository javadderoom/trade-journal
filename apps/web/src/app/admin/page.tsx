'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/auth';
import { api } from '../../lib/api';
import { toPersianDigits } from '../../utils/farsi';
import { notify } from '../../lib/notify';
import './admin.scss';

type AdminTab = 'stats' | 'users' | 'receipts' | 'coupons' | 'pricing' | 'contact';

interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  standardUsers: number;
  proUsers: number;
  totalRevenue: number;
  pendingReceiptsCount: number;
}

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

interface AdminReceipt {
  id: string;
  user_id: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  plan: 'STANDARD' | 'PRO';
  period: string;
  amount: number;
  discountCode: string | null;
  receipt_image: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  created_at: string;
}

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

export default function AdminPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [receiptsList, setReceiptsList] = useState<AdminReceipt[]>([]);
  const [couponsList, setCouponsList] = useState<CouponCode[]>([]);
  const [loading, setLoading] = useState(false);

  // Forms states
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountPercent: 30,
    maxUses: 100,
    expireDate: '',
    isAccountBound: false,
  });
  const [pricesConfig, setPricesConfig] = useState({
    STANDARD: { monthly: 249000, annual: 2390000 },
    PRO: { monthly: 499000, annual: 4790000 },
  });
  const [contactConfig, setContactConfig] = useState({
    email: '',
    mobile: '',
    landline: '',
    address: '',
  });

  // Modal states
  const [selectedReceipt, setSelectedReceipt] = useState<AdminReceipt | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionInput, setRejectionInput] = useState('');
  const [selectedUserForPlan, setSelectedUserForPlan] = useState<AdminUser | null>(null);
  const [customPlanOverride, setCustomPlanOverride] = useState({
    plan: 'STANDARD',
    durationDays: 30,
  });

  // Fetch logic
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/users');
      setUsersList(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  const fetchReceipts = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/receipts');
      setReceiptsList(res.data);
    } catch (err) {
      console.error('Failed to fetch receipts:', err);
    }
  }, []);

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/coupons');
      setCouponsList(res.data);
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    }
  }, []);

  const fetchPricesSetting = useCallback(async () => {
    try {
      const res = await api.get('/api/payments/prices');
      if (res.data) setPricesConfig(res.data);
    } catch (err) {
      console.error('Failed to fetch prices config:', err);
    }
  }, []);

  const fetchContactSetting = useCallback(async () => {
    try {
      const res = await api.get('/api/settings/contact');
      if (res.data) {
        setContactConfig({
          email: res.data.email || '',
          mobile: res.data.mobile || '',
          landline: res.data.landline || '',
          address: res.data.address || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch contact config:', err);
    }
  }, []);

  // Fetch initial data based on active tab
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    if (activeTab === 'stats') fetchStats();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'receipts') fetchReceipts();
    if (activeTab === 'coupons') fetchCoupons();
    if (activeTab === 'pricing') fetchPricesSetting();
    if (activeTab === 'contact') fetchContactSetting();
  }, [activeTab, user, fetchStats, fetchUsers, fetchReceipts, fetchCoupons, fetchPricesSetting, fetchContactSetting]);

  // Actions
  const handleVerifyReceipt = async (id: string, status: 'APPROVED' | 'REJECTED', inlineReason?: string) => {
    let rejectionReason = '';
    if (status === 'REJECTED') {
      if (!inlineReason || !inlineReason.trim()) {
        notify.error('وارد کردن علت رد شدن فیش الزامی است');
        return;
      }
      rejectionReason = inlineReason.trim();
    } else {
      const ok = await notify.confirm({
        title: 'تایید فیش',
        message: 'آیا از تایید این فیش اطمینان دارید؟',
      });
      if (!ok) return;
    }

    setLoading(true);
    try {
      await api.post(`/api/admin/receipts/${id}/verify`, { status, rejectionReason });
      setSelectedReceipt(null);
      setIsRejecting(false);
      setRejectionInput('');
      fetchReceipts();
      fetchStats();
      notify.success('وضعیت فیش با موفقیت به‌روز شد');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در اعمال وضعیت فیش');
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdatePrices = async () => {
    try {
      await api.put('/api/admin/settings/prices', { prices: pricesConfig });
      notify.success('تنظیمات قیمت‌گذاری با موفقیت بروز شد');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در ذخیره‌سازی قیمت‌ها');
    }
  };

  const handleUpdateContactInfo = async () => {
    try {
      await api.put('/api/admin/settings/contact', contactConfig);
      notify.success('اطلاعات تماس با موفقیت بروزرسانی شد');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در ذخیره‌سازی اطلاعات تماس');
    }
  };

  const handleManualPlanOverride = async () => {
    if (!selectedUserForPlan) return;
    const ok = await notify.confirm({
      title: 'تغییر پلن کاربر',
      message: `آیا از تغییر پلن کاربر "${selectedUserForPlan.name || selectedUserForPlan.email}" به ${customPlanOverride.plan === 'FREE' ? 'رایگان' : customPlanOverride.plan === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'} اطمینان دارید؟`,
      confirmLabel: 'تغییر پلن',
    });
    if (!ok) return;
    try {
      await api.put(`/api/admin/users/${selectedUserForPlan.id}/plan`, {
        plan: customPlanOverride.plan,
        durationDays: customPlanOverride.durationDays,
      });
      setSelectedUserForPlan(null);
      fetchUsers();
      notify.success('پلن کاربر با موفقیت تغییر یافت');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در تغییر پلن');
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#ffb300' }}>درحال تایید دسترسی...</div>;
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div>
          <h1>پنل مدیریت سامانه تریدکاو</h1>
          <span className="admin-sub">بررسی آمار، کاربران، تراکنش‌ها و کدهای تخفیف</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <span className="material-symbols-outlined">analytics</span>
          <span>آمار سیستم</span>
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <span className="material-symbols-outlined">group</span>
          <span>مدیریت کاربران</span>
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'receipts' ? 'active' : ''}`}
          onClick={() => setActiveTab('receipts')}
        >
          <span className="material-symbols-outlined">payments</span>
          <span>تایید پرداخت‌ها</span>
          {stats && stats.pendingReceiptsCount > 0 && (
            <span className="tab-badge">{toPersianDigits(stats.pendingReceiptsCount)}</span>
          )}
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
          onClick={() => setActiveTab('coupons')}
        >
          <span className="material-symbols-outlined">sell</span>
          <span>کدهای تخفیف</span>
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
          onClick={() => setActiveTab('pricing')}
        >
          <span className="material-symbols-outlined">settings_suggest</span>
          <span>تنظیمات قیمت</span>
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          <span className="material-symbols-outlined">contact_support</span>
          <span>اطلاعات تماس</span>
        </button>
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && stats && (
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
              <div className="stat-icon-wrap" style={{ color: '#61f9b1', background: 'rgba(97, 249, 177, 0.1)' }}>
                <span className="material-symbols-outlined">verified_user</span>
              </div>
              <div className="stat-info">
                <span className="stat-label">کاربران استاندارد</span>
                <span className="stat-value">{toPersianDigits(stats.standardUsers)}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrap" style={{ color: '#61f9b1', background: 'rgba(97, 249, 177, 0.1)' }}>
                <span className="material-symbols-outlined">workspace_premium</span>
              </div>
              <div className="stat-info">
                <span className="stat-label">کاربران حرفه‌ای</span>
                <span className="stat-value">{toPersianDigits(stats.proUsers)}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrap revenue">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <div className="stat-info">
                <span className="stat-label">کل درآمد (کارت به کارت)</span>
                <span className="stat-value">{toPersianDigits(stats.totalRevenue.toLocaleString('fa-IR'))} تومان</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="admin-panel-card">
          <div className="card-header-actions">
            <h3>کاربران ثبت‌نام شده</h3>
          </div>
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
                {usersList.map((u) => (
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
                        onClick={() => setSelectedUserForPlan(u)}
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        تغییر پلن
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receipts Tab */}
      {activeTab === 'receipts' && (
        <div className="admin-panel-card">
          <div className="card-header-actions">
            <h3>فیش‌های واریزی کاربران</h3>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>کاربر</th>
                  <th>پلن درخواستی</th>
                  <th>دوره</th>
                  <th>مبلغ واریزی</th>
                  <th>کد تخفیف</th>
                  <th>وضعیت فیش</th>
                  <th>تاریخ ثبت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {receiptsList.map((r) => (
                  <tr key={r.id}>
                    <td>{r.user?.name || r.user?.email || '-'}</td>
                    <td>
                      <span className={`badge ${r.plan.toLowerCase()}`}>
                        {r.plan === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'}
                      </span>
                    </td>
                    <td>{r.period === 'annual' ? 'سالانه' : 'ماهانه'}</td>
                    <td>{toPersianDigits(r.amount.toLocaleString('fa-IR'))} تومان</td>
                    <td>{r.discountCode || '-'}</td>
                    <td>
                      <span className={`badge ${r.status.toLowerCase()}`}>
                        {r.status === 'PENDING' ? 'در انتظار بررسی' : r.status === 'APPROVED' ? 'تایید شده' : 'رد شده'}
                      </span>
                    </td>
                    <td>{new Date(r.created_at).toLocaleDateString('fa-IR')}</td>
                    <td>
                      <button
                        className="admin-btn"
                        onClick={() => setSelectedReceipt(r)}
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        مشاهده فیش
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Coupons Tab */}
      {activeTab === 'coupons' && (
        <div className="admin-panel-card">
          <div className="card-header-actions">
            <h3>مدیریت کدهای تخفیف</h3>
          </div>

          <form onSubmit={handleCreateCoupon} className="admin-form-grid">
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
                {couponsList.map((c) => (
                  <tr key={c.id}>
                    <td style={{ direction: 'ltr', fontWeight: 'bold' }}>{c.code}</td>
                    <td>{toPersianDigits(c.discountPercent)}٪</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pricing Settings Tab */}
      {activeTab === 'pricing' && (
        <div className="admin-panel-card">
          <div className="card-header-actions">
            <h3>تنظیمات بسته‌های قیمتی</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
            <div>
              <h4 style={{ color: '#4299e1', marginBottom: '12px' }}>پلن استاندارد (STANDARD)</h4>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>قیمت ماهانه (تومان)</label>
                  <input
                    type="number"
                    style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', color: '#fff', borderRadius: '6px' }}
                    value={pricesConfig.STANDARD.monthly}
                    onChange={(e) => setPricesConfig({
                      ...pricesConfig,
                      STANDARD: { ...pricesConfig.STANDARD, monthly: Number(e.target.value) }
                    })}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>قیمت سالانه (تومان)</label>
                  <input
                    type="number"
                    style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', color: '#fff', borderRadius: '6px' }}
                    value={pricesConfig.STANDARD.annual}
                    onChange={(e) => setPricesConfig({
                      ...pricesConfig,
                      STANDARD: { ...pricesConfig.STANDARD, annual: Number(e.target.value) }
                    })}
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ color: '#61f9b1', marginBottom: '12px' }}>پلن حرفه‌ای (PRO)</h4>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>قیمت ماهانه (تومان)</label>
                  <input
                    type="number"
                    style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', color: '#fff', borderRadius: '6px' }}
                    value={pricesConfig.PRO.monthly}
                    onChange={(e) => setPricesConfig({
                      ...pricesConfig,
                      PRO: { ...pricesConfig.PRO, monthly: Number(e.target.value) }
                    })}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>قیمت سالانه (تومان)</label>
                  <input
                    type="number"
                    style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', color: '#fff', borderRadius: '6px' }}
                    value={pricesConfig.PRO.annual}
                    onChange={(e) => setPricesConfig({
                      ...pricesConfig,
                      PRO: { ...pricesConfig.PRO, annual: Number(e.target.value) }
                    })}
                  />
                </div>
              </div>
            </div>

            <div>
              <button className="admin-btn" onClick={handleUpdatePrices}>ذخیره تغییرات قیمت</button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Info Tab */}
      {activeTab === 'contact' && (
        <div className="admin-panel-card">
          <div className="card-header-actions">
            <h3>مدیریت اطلاعات تماس</h3>
          </div>
          <p style={{ color: '#a0aec0', fontSize: '0.85rem', marginBottom: '20px' }}>
            اطلاعات تماس زیر در صفحه عمومی «ارتباط با ما» نمایش داده می‌شوند. در صورت خالی گذاشتن هر کدام از فیلدها، کارت مربوطه در صفحه ارتباط با ما مخفی خواهد شد.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.88rem', color: '#e2e2eb', fontWeight: 'bold' }}>پست الکترونیک (ایمیل)</label>
              <input
                type="email"
                placeholder="مثال: support@tradekav.ir"
                style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', direction: 'ltr' }}
                value={contactConfig.email}
                onChange={(e) => setContactConfig({ ...contactConfig, email: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.88rem', color: '#e2e2eb', fontWeight: 'bold' }}>شماره همراه پشتیبانی</label>
              <input
                type="text"
                placeholder="مثال: 09123456789"
                style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', direction: 'ltr' }}
                value={contactConfig.mobile}
                onChange={(e) => setContactConfig({ ...contactConfig, mobile: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.88rem', color: '#e2e2eb', fontWeight: 'bold' }}>تلفن ثابت دفتر</label>
              <input
                type="text"
                placeholder="مثال: 02188888888"
                style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', direction: 'ltr' }}
                value={contactConfig.landline}
                onChange={(e) => setContactConfig({ ...contactConfig, landline: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.88rem', color: '#e2e2eb', fontWeight: 'bold' }}>آدرس پستی</label>
              <textarea
                placeholder="مثال: تهران، میدان ونک، خیابان ولیعصر، پلاک ۱"
                style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                value={contactConfig.address}
                onChange={(e) => setContactConfig({ ...contactConfig, address: e.target.value })}
              />
            </div>

            <div style={{ marginTop: '10px' }}>
              <button className="admin-btn" onClick={handleUpdateContactInfo}>ذخیره تغییرات اطلاعات تماس</button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Receipt Verification Modal Overlay */}
      {selectedReceipt && (
        <div className="admin-overlay" onClick={() => {
          setSelectedReceipt(null);
          setIsRejecting(false);
          setRejectionInput('');
        }}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <h4>بررسی فیش واریزی</h4>
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px', color: '#a0aec0' }}>
              <div>کاربر: <strong>{selectedReceipt.user?.name || '-'} ({selectedReceipt.user?.email})</strong></div>
              <div>پلن درخواستی: <strong>{selectedReceipt.plan === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'}</strong></div>
              <div>دوره: <strong>{selectedReceipt.period === 'annual' ? 'سالانه' : 'ماهانه'}</strong></div>
              <div>مبلغ تراکنش: <strong>{toPersianDigits(selectedReceipt.amount.toLocaleString('fa-IR'))} تومان</strong></div>
              {selectedReceipt.discountCode && <div>کد تخفیف اعمال شده: <strong>{selectedReceipt.discountCode}</strong></div>}
            </div>

            <div className="receipt-image-container">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${selectedReceipt.receipt_image}`}
                alt="فیش پرداخت کاربر"
              />
            </div>

            {selectedReceipt.status === 'PENDING' && !isRejecting && (
              <div className="receipt-modal-actions">
                <button
                  className="admin-btn"
                  disabled={loading}
                  onClick={() => handleVerifyReceipt(selectedReceipt.id, 'APPROVED')}
                >
                  تایید و فعالسازی
                </button>
                <button
                  className="admin-btn btn-danger"
                  disabled={loading}
                  onClick={() => setIsRejecting(true)}
                >
                  رد فیش
                </button>
                <button
                  className="admin-btn btn-secondary"
                  onClick={() => {
                    setSelectedReceipt(null);
                    setIsRejecting(false);
                    setRejectionInput('');
                  }}
                >
                  بستن
                </button>
              </div>
            )}

            {selectedReceipt.status === 'PENDING' && isRejecting && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <textarea
                  placeholder="علت رد شدن فیش پرداخت (الزامی)..."
                  value={rejectionInput}
                  onChange={(e) => setRejectionInput(e.target.value)}
                  style={{
                    background: '#0b0d19',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '10px',
                    color: '#fff',
                    borderRadius: '6px',
                    minHeight: '80px',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <div className="receipt-modal-actions">
                  <button
                    className="admin-btn btn-danger"
                    disabled={loading || !rejectionInput.trim()}
                    onClick={() => handleVerifyReceipt(selectedReceipt.id, 'REJECTED', rejectionInput)}
                  >
                    ثبت رد فیش
                  </button>
                  <button
                    className="admin-btn btn-secondary"
                    onClick={() => {
                      setIsRejecting(false);
                      setRejectionInput('');
                    }}
                  >
                    انصراف
                  </button>
                </div>
              </div>
            )}

            {selectedReceipt.status !== 'PENDING' && (
              <div className="receipt-modal-actions">
                <span className={`badge ${selectedReceipt.status.toLowerCase()}`}>
                  این فیش قبلاً {selectedReceipt.status === 'APPROVED' ? 'تایید' : 'رد'} شده است
                </span>
                <button className="admin-btn btn-secondary" onClick={() => {
                  setSelectedReceipt(null);
                  setIsRejecting(false);
                  setRejectionInput('');
                }}>بستن</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Override Plan Modal Overlay */}
      {selectedUserForPlan && (
        <div className="admin-overlay" onClick={() => setSelectedUserForPlan(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <h4>تغییر دستی پلن کاربر: {selectedUserForPlan.name || selectedUserForPlan.email}</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>پلن انتخابی</label>
                <select
                  value={customPlanOverride.plan}
                  onChange={(e) => setCustomPlanOverride({ ...customPlanOverride, plan: e.target.value })}
                  style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', color: '#fff', borderRadius: '6px' }}
                >
                  <option value="FREE">رایگان (FREE)</option>
                  <option value="STANDARD">استاندارد (STANDARD)</option>
                  <option value="PRO">حرفه‌ای (PRO)</option>
                </select>
              </div>

              {customPlanOverride.plan !== 'FREE' && (
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>مدت اعتبار (روز)</label>
                  <input
                    type="number"
                    min="1"
                    value={customPlanOverride.durationDays}
                    onChange={(e) => setCustomPlanOverride({ ...customPlanOverride, durationDays: Number(e.target.value) })}
                    style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
              )}

              <div className="receipt-modal-actions">
                <button className="admin-btn" onClick={handleManualPlanOverride}>اعمال تغییر</button>
                <button className="admin-btn btn-secondary" onClick={() => setSelectedUserForPlan(null)}>انصراف</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
