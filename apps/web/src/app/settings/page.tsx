'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../lib/auth';
import { api } from '../../lib/api';
import { toPersianDigits } from '../../utils/farsi';
import './settings.scss';

type Tab = 'profile' | 'accounts' | 'subscription' | 'security';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  display_currency: string;
  avatar_url: string | null;
}

interface BrokerAccount {
  id: string;
  broker_name: string | null;
  account_number: string | null;
  currency: string;
  created_at: string;
  trade_count: number;
  last_import: string | null;
}

interface Session {
  id: string;
  user_agent: string;
  created_at: string;
  last_used_at: string;
  is_current: boolean;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

const BROKER_PRESETS = [
  'Amarkets', 'LiteFinance', 'Errante', 'Alpari', 'RoboForex', 'HFM', 'IC Markets', 'Pepperstone',
];

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'profile');
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    router.push(`/settings?tab=${tab}`, { scroll: false });
  };

  // ─── Profile state ───────────────────────────────────────────────────────
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', displayCurrency: 'USD' });
  const [profileDirty, setProfileDirty] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // ─── Accounts state ──────────────────────────────────────────────────────
  const [accounts, setAccounts] = useState<BrokerAccount[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState({
    broker_name: '',
    account_number: '',
    currency: 'USD',
  });
  const [editAccount, setEditAccount] = useState({ broker_name: '', account_number: '', currency: 'USD' });

  // ─── Subscription state ──────────────────────────────────────────────────
  const [subscription, setSubscription] = useState<any>(null);

  // ─── Security state ──────────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');

  // ─── Fetch profile ────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/api/settings/profile');
      setProfile(res.data.user);
      setProfileForm({
        name: res.data.user.name || '',
        phone: res.data.user.phone || '',
        displayCurrency: res.data.user.display_currency || 'USD',
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ─── Fetch accounts ──────────────────────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await api.get('/api/settings/accounts');
      setAccounts(res.data.accounts);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  // ─── Fetch subscription ───────────────────────────────────────────────────
  const fetchSubscription = useCallback(async () => {
    try {
      const res = await api.get('/api/settings/subscription');
      setSubscription(res.data);
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    }
  }, []);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  // ─── Fetch sessions ──────────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get('/api/settings/sessions');
      setSessions(res.data.sessions);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleProfileSave = async () => {
    try {
      await api.put('/api/settings/profile', {
        name: profileForm.name,
        phone: profileForm.phone,
        displayCurrency: profileForm.displayCurrency,
      });
      setProfileDirty(false);
      showToast('پروفایل با موفقیت ذخیره شد');
      fetchProfile();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'خطا در ذخیره تغییرات', 'error');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvatarUploading(true);
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/api/settings/avatar', formData);
      if (profile) setProfile({ ...profile, avatar_url: res.data.avatar_url });
      showToast('عکس پروفایل تغییر کرد');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'خطا در بارگذاری تصویر', 'error');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleCreateAccount = async () => {
    try {
      await api.post('/api/settings/accounts', newAccount);
      setShowAddAccount(false);
      setNewAccount({ broker_name: '', account_number: '', currency: 'USD' });
      fetchAccounts();
      showToast('حساب جدید ایجاد شد');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'خطا در ایجاد حساب', 'error');
    }
  };

  const handleUpdateAccount = async (id: string) => {
    try {
      await api.put(`/api/settings/accounts/${id}`, editAccount);
      setEditingId(null);
      fetchAccounts();
      showToast('حساب ویرایش شد');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'خطا در ویرایش', 'error');
    }
  };

  const handleDeleteAccount = async (id: string, tradeCount: number) => {
    if (!confirm(`با حذف این حساب، تمام ${toPersianDigits(tradeCount)} معامله مرتبط با آن نیز حذف می‌شوند. آیا مطمئن هستید؟`)) return;
    try {
      await api.delete(`/api/settings/accounts/${id}`);
      fetchAccounts();
      showToast('حساب حذف شد');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'خطا در حذف', 'error');
    }
  };

  const handleCheckout = async (targetPlan: string, period: string) => {
    setCheckoutLoading(true);
    try {
      const res = await api.post('/api/payments/checkout', {
        plan: targetPlan,
        period,
      });
      if (res.data.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      } else {
        showToast('خطا در دریافت لینک درگاه پرداخت', 'error');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      showToast(err.response?.data?.error || 'خطا در اتصال به درگاه پرداخت', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('رمز جدید و تکرار آن یکسان نیست', 'error');
      return;
    }
    try {
      await api.put('/api/settings/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('رمز عبور با موفقیت تغییر کرد');
      fetchSessions();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'خطا در تغییر رمز', 'error');
    }
  };

  const handleRevokeSession = async (id: string) => {
    try {
      await api.delete(`/api/settings/sessions/${id}`);
      fetchSessions();
      showToast('نشست بسته شد');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'خطا', 'error');
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await api.delete('/api/settings/sessions');
      fetchSessions();
      showToast('همه نشست‌ها بسته شدند');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'خطا', 'error');
    }
  };

  const handleDeleteUserAccount = async () => {
    try {
      await api.delete('/api/settings/account', { data: { confirmEmail: deleteConfirmEmail } });
      await logout();
      router.push('/login');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'خطا در حذف حساب', 'error');
    }
  };

  // ─── Password strength ────────────────────────────────────────────────────
  const passwordStrength = () => {
    const p = passwordForm.newPassword;
    if (!p) return { label: '', class: '' };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { label: 'ضعیف', class: 'weak' };
    if (score <= 3) return { label: 'متوسط', class: 'medium' };
    return { label: 'قوی', class: 'strong' };
  };

  const initials = (profile?.name || user?.name || '?').charAt(0);

  return (
    <div className="settings-page">
      {/* ─── Toast ─── */}
      {toast && (
        <div className={`settings-toast ${toast.type}`}>
          <span className="material-symbols-outlined">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ─── Header ─── */}
      <header className="settings-header">
        <h1>تنظیمات</h1>
      </header>

      {/* ─── Tab Bar ─── */}
      <div className="settings-tab-bar">
        {([
          { key: 'profile', label: 'پروفایل', icon: 'person' },
          { key: 'accounts', label: 'حساب‌های بروکر', icon: 'account_balance' },
          { key: 'subscription', label: 'اشتراک', icon: 'card_membership' },
          { key: 'security', label: 'امنیت', icon: 'shield' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            className={`settings-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => switchTab(tab.key)}
          >
            <span className="material-symbols-outlined">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─── */}
      <div className="settings-tab-content">
        {/* ═════ PROFILE TAB ═════ */}
        {activeTab === 'profile' && profile && (
          <section className="settings-section">
            {/* Avatar */}
            <div className="profile-avatar-row">
              <div className="avatar-circle">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" />
                ) : (
                  <span className="avatar-initials">{initials}</span>
                )}
              </div>
              <label className="avatar-upload-btn">
                <span className="material-symbols-outlined">photo_camera</span>
                تغییر عکس
                <input type="file" accept="image/jpeg,image/png" onChange={handleAvatarUpload} hidden disabled={avatarUploading} />
              </label>
            </div>

            {/* Form */}
            <div className="settings-form-grid">
              <div className="form-field">
                <label>نام کامل</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => { setProfileForm({ ...profileForm, name: e.target.value }); setProfileDirty(true); }}
                  placeholder="نام و نام خانوادگی"
                />
              </div>

              <div className="form-field">
                <label>ایمیل</label>
                <div className="readonly-field">
                  <span style={{ direction: 'ltr' }}>{profile.email}</span>
                  <span className="material-symbols-outlined verified-icon">verified</span>
                </div>
              </div>

              <div className="form-field">
                <label>شماره موبایل</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => { setProfileForm({ ...profileForm, phone: e.target.value }); setProfileDirty(true); }}
                  placeholder="09XXXXXXXXX"
                  style={{ direction: 'ltr', textAlign: 'right' }}
                />
              </div>

              <div className="form-field">
                <label>ارز نمایش</label>
                <div className="toggle-group">
                  {(['USD', 'TOMAN', 'BOTH'] as const).map((curr) => (
                    <button
                      key={curr}
                      className={`toggle-btn ${profileForm.displayCurrency === curr ? 'active' : ''}`}
                      onClick={() => { setProfileForm({ ...profileForm, displayCurrency: curr }); setProfileDirty(true); }}
                    >
                      {curr === 'USD' ? 'دلار' : curr === 'TOMAN' ? 'تومان' : 'هر دو'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label>زبان</label>
                <div className="readonly-field">
                  <span>فارسی</span>
                </div>
              </div>
            </div>

            <button className="settings-save-btn" onClick={handleProfileSave} disabled={!profileDirty}>
              ذخیره تغییرات
            </button>
          </section>
        )}

        {/* ═════ ACCOUNTS TAB ═════ */}
        {activeTab === 'accounts' && (
          <section className="settings-section">
            {/* Plan limit banner */}
            {subscription && subscription.plan === 'FREE' && accounts.length >= 1 && (
              <div className="plan-limit-banner">
                <span className="material-symbols-outlined">lock</span>
                <span>برای افزودن حساب بیشتر، اشتراکت رو ارتقا بده</span>
                <button onClick={() => switchTab('subscription')}>ارتقا به استاندارد</button>
              </div>
            )}

            {/* Account cards */}
            {accounts.map((acc) => (
              <div key={acc.id} className="broker-card">
                {editingId === acc.id ? (
                  // ─── Edit mode ───
                  <div className="broker-edit-form">
                    <div className="settings-form-grid">
                      <div className="form-field">
                        <label>نام بروکر</label>
                        <input
                          type="text"
                          value={editAccount.broker_name}
                          onChange={(e) => setEditAccount({ ...editAccount, broker_name: e.target.value })}
                        />
                      </div>
                      <div className="form-field">
                        <label>شماره حساب</label>
                        <input
                          type="text"
                          value={editAccount.account_number}
                          onChange={(e) => setEditAccount({ ...editAccount, account_number: e.target.value })}
                          style={{ direction: 'ltr', textAlign: 'right' }}
                        />
                      </div>
                      <div className="form-field">
                        <label>ارز حساب</label>
                        <div className="toggle-group">
                          {['USD', 'EUR', 'GBP'].map((c) => (
                            <button
                              key={c}
                              className={`toggle-btn ${editAccount.currency === c ? 'active' : ''}`}
                              onClick={() => setEditAccount({ ...editAccount, currency: c })}
                            >{c}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="broker-edit-actions">
                      <button className="settings-save-btn" onClick={() => handleUpdateAccount(acc.id)}>ذخیره</button>
                      <button className="settings-cancel-btn" onClick={() => setEditingId(null)}>انصراف</button>
                    </div>
                  </div>
                ) : (
                  // ─── View mode ───
                  <>
                    <div className="broker-card-header">
                      <div className="broker-avatar">{(acc.broker_name || '?').charAt(0)}</div>
                      <div className="broker-info">
                        <h4>{acc.broker_name || 'نامشخص'}</h4>
                        <span>حساب شماره: {acc.account_number ? `#${acc.account_number}` : 'نامشخص'}</span>
                        <span>ارز: {acc.currency}</span>
                        <span>{toPersianDigits(acc.trade_count)} معامله</span>
                      </div>
                    </div>
                    <div className="broker-card-actions">
                      <button className="broker-action-btn" onClick={() => router.push('/trades')}>واردات جدید</button>
                      <button className="broker-action-btn" onClick={() => {
                        setEditingId(acc.id);
                        setEditAccount({
                          broker_name: acc.broker_name || '',
                          account_number: acc.account_number || '',
                          currency: acc.currency,
                        });
                      }}>ویرایش</button>
                      <button className="broker-action-btn danger" onClick={() => handleDeleteAccount(acc.id, acc.trade_count)}>حذف</button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Add new account */}
            {showAddAccount ? (
              <div className="broker-card add-mode">
                <div className="settings-form-grid">
                  <div className="form-field">
                    <label>نام بروکر</label>
                    <input
                      type="text"
                      list="broker-presets"
                      value={newAccount.broker_name}
                      onChange={(e) => setNewAccount({ ...newAccount, broker_name: e.target.value })}
                      placeholder="انتخاب یا تایپ نام بروکر"
                    />
                    <datalist id="broker-presets">
                      {BROKER_PRESETS.map((b) => <option key={b} value={b} />)}
                    </datalist>
                  </div>
                  <div className="form-field">
                    <label>شماره حساب</label>
                    <input
                      type="text"
                      value={newAccount.account_number}
                      onChange={(e) => setNewAccount({ ...newAccount, account_number: e.target.value })}
                      placeholder="شماره حساب بروکر"
                      style={{ direction: 'ltr', textAlign: 'right' }}
                    />
                  </div>
                  <div className="form-field">
                    <label>ارز حساب</label>
                    <div className="toggle-group">
                      {['USD', 'EUR', 'GBP'].map((c) => (
                        <button
                          key={c}
                          className={`toggle-btn ${newAccount.currency === c ? 'active' : ''}`}
                          onClick={() => setNewAccount({ ...newAccount, currency: c })}
                        >{c}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="broker-edit-actions">
                  <button className="settings-save-btn" onClick={handleCreateAccount}>ذخیره حساب</button>
                  <button className="settings-cancel-btn" onClick={() => setShowAddAccount(false)}>انصراف</button>
                </div>
              </div>
            ) : (
              <button className="add-account-card" onClick={() => setShowAddAccount(true)}>
                <span className="material-symbols-outlined">add</span>
                <span>افزودن حساب بروکر جدید</span>
              </button>
            )}
          </section>
        )}

        {/* ═════ SUBSCRIPTION TAB ═════ */}
        {activeTab === 'subscription' && subscription && (
          <section className="settings-section">
            {/* Current plan */}
            <div className="subscription-current-card">
              <div className="plan-info">
                <span className="plan-label">پلن فعلی:</span>
                <span className="plan-badge">{subscription.plan === 'FREE' ? 'رایگان' : subscription.plan === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'}</span>
              </div>
              {subscription.subscription && (
                <div className="plan-details">
                  <span>تاریخ انقضای پلن: {new Date(subscription.subscription.end_date).toLocaleDateString('fa-IR')}</span>
                </div>
              )}
            </div>

            {/* Pricing Packages Selection */}
            {subscription.plan !== 'PRO' && (
              <>
                <h3 className="pricing-section-title">ارتقای اشتراک</h3>
                <div className="pricing-plans-grid">
                  {/* Standard Plan Upgrade Card */}
                  {subscription.plan === 'FREE' && (
                    <div className="plan-upgrade-card featured">
                      <div className="plan-upgrade-header">
                        <span className="plan-title">پلن استاندارد</span>
                        <span className="plan-badge-tag">محبوب‌ترین</span>
                      </div>
                      <p className="plan-upgrade-desc">دسترسی به ۳ حساب معاملاتی، واردات نامحدود فایل‌های MT4/MT5 و همگام‌سازی EA.</p>
                      <div className="plan-upgrade-periods">
                        <div className="period-checkout-row">
                          <span className="period-name">۱ ماهه</span>
                          <button 
                            className="period-price-btn" 
                            disabled={checkoutLoading}
                            onClick={() => handleCheckout('STANDARD', 'monthly')}
                          >
                            ۱۵۰٬۰۰۰ تومان
                          </button>
                        </div>
                        <div className="period-checkout-row">
                          <span className="period-name">
                            ۴ ماهه
                            <span className="period-discount">۱۶٪ تخفیف</span>
                          </span>
                          <button 
                            className="period-price-btn" 
                            disabled={checkoutLoading}
                            onClick={() => handleCheckout('STANDARD', '4-month')}
                          >
                            ۵۰۰٬۰۰۰ تومان
                          </button>
                        </div>
                        <div className="period-checkout-row">
                          <span className="period-name">
                            سالانه
                            <span className="period-discount">۲۰٪ تخفیف</span>
                          </span>
                          <button 
                            className="period-price-btn" 
                            disabled={checkoutLoading}
                            onClick={() => handleCheckout('STANDARD', 'annual')}
                          >
                            ۱٬۴۴۰٬۰۰۰ تومان
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pro Plan Upgrade Card */}
                  <div className="plan-upgrade-card">
                    <div className="plan-upgrade-header">
                      <span className="plan-title">پلن حرفه‌ای</span>
                    </div>
                    <p className="plan-upgrade-desc">دسترسی به حساب‌های نامحدود، گزارش عملکرد کامل و دسترسی مستقیم به API (بزودی).</p>
                    <div className="plan-upgrade-periods">
                      <div className="period-checkout-row">
                        <span className="period-name">۱ ماهه</span>
                        <button 
                          className="period-price-btn" 
                          disabled={checkoutLoading}
                          onClick={() => handleCheckout('PRO', 'monthly')}
                        >
                          ۳۵۰٬۰۰۰ تومان
                        </button>
                      </div>
                      <div className="period-checkout-row">
                        <span className="period-name">
                          ۴ ماهه
                          <span className="period-discount">۱۴٪ تخفیف</span>
                        </span>
                        <button 
                          className="period-price-btn" 
                          disabled={checkoutLoading}
                          onClick={() => handleCheckout('PRO', '4-month')}
                        >
                          ۱٬۲۰۰٬۰۰۰ تومان
                        </button>
                      </div>
                      <div className="period-checkout-row">
                        <span className="period-name">
                          سالانه
                          <span className="period-discount">۲۰٪ تخفیف</span>
                        </span>
                        <button 
                          className="period-price-btn" 
                          disabled={checkoutLoading}
                          onClick={() => handleCheckout('PRO', 'annual')}
                        >
                          ۳٬۳۶۰٬۰۰۰ تومان
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Plan comparison table */}
            <div className="plan-comparison-table">
              <table>
                <thead>
                  <tr>
                    <th>امکانات</th>
                    <th className={subscription.plan === 'FREE' ? 'current-col' : ''}>رایگان</th>
                    <th className={subscription.plan === 'STANDARD' ? 'current-col' : ''}>استاندارد</th>
                    <th className={subscription.plan === 'PRO' ? 'current-col' : ''}>حرفه‌ای</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>معاملات</td>
                    <td>۵۰/ماه</td><td>نامحدود</td><td>نامحدود</td>
                  </tr>
                  <tr>
                    <td>حساب بروکر</td>
                    <td>۱</td><td>۳</td><td>نامحدود</td>
                  </tr>
                  <tr>
                    <td>واردات MT4/MT5</td>
                    <td>✗</td><td>✓</td><td>✓</td>
                  </tr>
                  <tr>
                    <td>گزارش عملکرد</td>
                    <td>محدود</td><td>کامل</td><td>کامل</td>
                  </tr>
                  <tr>
                    <td>قیمت ماهانه</td>
                    <td>رایگان</td>
                    <td>۱۵۰٬۰۰۰ ت</td>
                    <td>۳۵۰٬۰۰۰ ت</td>
                  </tr>
                  <tr>
                    <td>قیمت ۴ ماهه</td>
                    <td>-</td>
                    <td>۵۰۰٬۰۰۰ ت</td>
                    <td>۱٬۲۰۰٬۰۰۰ ت</td>
                  </tr>
                  <tr>
                    <td>قیمت سالانه</td>
                    <td>-</td>
                    <td>۱٬۴۴۰٬۰۰۰ ت</td>
                    <td>۳٬۳۶۰٬۰۰۰ ت</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ═════ SECURITY TAB ═════ */}
        {activeTab === 'security' && (
          <section className="settings-section">
            {/* Change password */}
            <div className="security-card">
              <h3>تغییر رمز عبور</h3>
              <div className="password-fields">
                <div className="form-field">
                  <label>فعلی</label>
                  <div className="password-input-wrap">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="••••••••"
                      style={{ direction: 'ltr' }}
                    />
                    <button type="button" onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}>
                      <span className="material-symbols-outlined">{showPasswords.current ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
                <div className="form-field">
                  <label>جدید</label>
                  <div className="password-input-wrap">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="••••••••"
                      style={{ direction: 'ltr' }}
                    />
                    <button type="button" onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}>
                      <span className="material-symbols-outlined">{showPasswords.new ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {passwordForm.newPassword && (
                    <div className={`password-strength ${passwordStrength().class}`}>
                      <div className="strength-bar"><div className="strength-fill" /></div>
                      <span>{passwordStrength().label}</span>
                    </div>
                  )}
                </div>
                <div className="form-field">
                  <label>تکرار</label>
                  <div className="password-input-wrap">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      style={{ direction: 'ltr' }}
                    />
                    <button type="button" onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}>
                      <span className="material-symbols-outlined">{showPasswords.confirm ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
              </div>
              <button className="settings-save-btn" onClick={handlePasswordChange} disabled={!passwordForm.currentPassword || !passwordForm.newPassword}>
                تغییر رمز عبور
              </button>
            </div>

            {/* Active sessions */}
            <div className="security-card">
              <div className="sessions-header">
                <h3>نشست‌های فعال</h3>
                {sessions.filter(s => !s.is_current).length > 0 && (
                  <button className="revoke-all-btn" onClick={handleRevokeAllSessions}>خروج از تمام دستگاه‌ها</button>
                )}
              </div>
              <div className="sessions-list">
                {sessions.map((s) => (
                  <div key={s.id} className="session-item">
                    <div className="session-info">
                      <span className="material-symbols-outlined session-icon">devices</span>
                      <div>
                        <span className="session-device">{s.user_agent}</span>
                        <span className="session-time">آخرین فعالیت: {new Date(s.last_used_at).toLocaleDateString('fa-IR')}</span>
                      </div>
                    </div>
                    {s.is_current ? (
                      <span className="current-session-badge">این دستگاه</span>
                    ) : (
                      <button className="revoke-session-btn" onClick={() => handleRevokeSession(s.id)}>
                        خروج از این دستگاه
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Danger zone */}
            <div className="danger-zone">
              <div className="danger-header">
                <span className="material-symbols-outlined">warning</span>
                <h3>حذف حساب کاربری</h3>
              </div>
              <p>با حذف حساب، تمام معاملات، ژورنال‌ها و داده‌هایت به صورت دائمی حذف می‌شوند و قابل بازیابی نیستند.</p>
              {showDeleteAccount ? (
                <div className="delete-confirm-form">
                  <p>برای تایید، ایمیل خود را وارد کنید:</p>
                  <input
                    type="text"
                    value={deleteConfirmEmail}
                    onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                    placeholder={profile?.email || 'ایمیل'}
                    style={{ direction: 'ltr', textAlign: 'right' }}
                  />
                  <div className="delete-actions">
                    <button className="danger-confirm-btn" onClick={handleDeleteUserAccount} disabled={deleteConfirmEmail !== profile?.email}>
                      بله، حسابم را حذف کن
                    </button>
                    <button className="settings-cancel-btn" onClick={() => { setShowDeleteAccount(false); setDeleteConfirmEmail(''); }}>انصراف</button>
                  </div>
                </div>
              ) : (
                <button className="danger-outline-btn" onClick={() => setShowDeleteAccount(true)}>حذف حساب کاربری</button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}