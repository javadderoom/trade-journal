'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../lib/auth';
import { api } from '../../lib/api';
import { toPersianDigits } from '../../utils/farsi';
import { notify } from '../../lib/notify';
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

const BROKER_PRESETS = [
  'Amarkets', 'LiteFinance', 'Errante', 'Alpari', 'RoboForex', 'HFM', 'IC Markets', 'Pepperstone',
];

const DEFAULT_PRICES = {
  STANDARD: {
    monthly: 249000,
    annual: 2300000,
  },
  PRO: {
    monthly: 499000,
    annual: 4790000,
  },
};

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'profile');

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
  const [prices, setPrices] = useState<any>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const activePrices = prices || DEFAULT_PRICES;
  const standardMonthlyPrice = activePrices.STANDARD.monthly.toLocaleString('fa-IR');
  const standardAnnualPrice = activePrices.STANDARD.annual.toLocaleString('fa-IR');
  const proMonthlyPrice = activePrices.PRO.monthly.toLocaleString('fa-IR');
  const proAnnualPrice = activePrices.PRO.annual.toLocaleString('fa-IR');

  const standardDiscountPercent = Math.round((1 - activePrices.STANDARD.annual / (activePrices.STANDARD.monthly * 12)) * 100);
  const proDiscountPercent = Math.round((1 - activePrices.PRO.annual / (activePrices.PRO.monthly * 12)) * 100);

  const [dismissedRejectionId, setDismissedRejectionId] = useState<string | null>(null);

  // Checkout modal & discount states
  const [checkoutTarget, setCheckoutTarget] = useState<{ plan: string; period: string } | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [discountDetails, setDiscountDetails] = useState<{
    valid: boolean;
    discountPercent: number;
    originalPrice: number;
    discountedPrice: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [validatingDiscount, setValidatingDiscount] = useState(false);

  const handleValidateDiscount = async (codeStr: string, plan: string, period: string) => {
    if (!codeStr) {
      setDiscountDetails(null);
      setDiscountError('');
      return;
    }
    setValidatingDiscount(true);
    setDiscountError('');
    try {
      const res = await api.post('/api/payments/discount/validate', {
        code: codeStr,
        plan,
        period,
      });
      setDiscountDetails(res.data);
    } catch (err: any) {
      setDiscountDetails(null);
      setDiscountError(err.response?.data?.error || 'کد تخفیف معتبر نیست');
    } finally {
      setValidatingDiscount(false);
    }
  };

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

  // ─── API Tokens state ───────────────────────────────────────────────────
  const [tokens, setTokens] = useState<{[accountId: string]: any[]}>({});
  const [loadingTokens, setLoadingTokens] = useState<{[accountId: string]: boolean}>({});
  const [newTokenName, setNewTokenName] = useState('');
  const [showTokenModal, setShowTokenModal] = useState<{ token: string; name: string } | null>(null);
  const [expandedTokenAccountId, setExpandedTokenAccountId] = useState<string | null>(null);

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

  // ─── Fetch prices ─────────────────────────────────────────────────────────
  const fetchPrices = useCallback(async () => {
    try {
      const res = await api.get('/api/payments/prices');
      setPrices(res.data);
    } catch (err) {
      console.error('Failed to fetch prices:', err);
    }
  }, []);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

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
      notify.success('پروفایل با موفقیت ذخیره شد');
      fetchProfile();
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در ذخیره تغییرات');
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
      notify.success('عکس پروفایل تغییر کرد');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در بارگذاری تصویر');
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
      notify.success('حساب جدید ایجاد شد');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در ایجاد حساب');
    }
  };

  const handleUpdateAccount = async (id: string) => {
    try {
      await api.put(`/api/settings/accounts/${id}`, editAccount);
      setEditingId(null);
      fetchAccounts();
      notify.success('حساب ویرایش شد');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در ویرایش');
    }
  };

  const handleDeleteAccount = async (id: string, tradeCount: number) => {
    const ok = await notify.confirm({
      title: 'حذف حساب بروکر',
      message: `با حذف این حساب، تمام ${toPersianDigits(tradeCount)} معامله مرتبط با آن نیز حذف می‌شوند. آیا مطمئن هستید؟`,
      danger: true,
      confirmLabel: 'حذف حساب',
    });
    if (!ok) return;
    try {
      await api.delete(`/api/settings/accounts/${id}`);
      fetchAccounts();
      notify.success('حساب حذف شد');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در حذف');
    }
  };

  // ─── API Tokens handlers ──────────────────────────────────────────────────
  const fetchTokens = useCallback(async (accountId: string) => {
    try {
      setLoadingTokens(prev => ({ ...prev, [accountId]: true }));
      const res = await api.get(`/api/accounts/${accountId}/tokens`);
      setTokens(prev => ({ ...prev, [accountId]: res.data }));
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در دریافت کلیدها');
    } finally {
      setLoadingTokens(prev => ({ ...prev, [accountId]: false }));
    }
  }, []);

  const handleCreateToken = async (accountId: string) => {
    if (!newTokenName.trim()) {
      notify.error('لطفاً نامی برای کلید انتخاب کنید');
      return;
    }
    try {
      const res = await api.post(`/api/accounts/${accountId}/tokens`, { name: newTokenName });
      setShowTokenModal({ token: res.data.token, name: res.data.name });
      setNewTokenName('');
      fetchTokens(accountId);
      notify.success('کلید اتصال جدید ایجاد شد');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در ایجاد کلید اتصال');
    }
  };

  const handleDeleteToken = async (accountId: string, tokenId: string) => {
    const ok = await notify.confirm({
      title: 'حذف کلید اتصال',
      message: 'آیا از حذف این کلید اتصال مطمئن هستید؟ اکسپرت‌های متصل به این کلید دیگر کار نخواهند کرد.',
      danger: true,
      confirmLabel: 'حذف کلید',
    });
    if (!ok) return;
    try {
      await api.delete(`/api/accounts/${accountId}/tokens/${tokenId}`);
      fetchTokens(accountId);
      notify.success('کلید اتصال حذف شد');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در حذف کلید اتصال');
    }
  };

  const handleToggleTokens = (accountId: string) => {
    if (expandedTokenAccountId === accountId) {
      setExpandedTokenAccountId(null);
    } else {
      setExpandedTokenAccountId(accountId);
      fetchTokens(accountId);
    }
  };

  const handleSubmitReceipt = async () => {
    if (!checkoutTarget) return;
    if (!receiptFile) {
      notify.error('لطفاً تصویر فیش واریزی را انتخاب کنید');
      return;
    }
    setCheckoutLoading(true);
    try {
      const formData = new FormData();
      formData.append('plan', checkoutTarget.plan);
      formData.append('period', checkoutTarget.period);
      if (discountCode) {
        formData.append('discountCode', discountCode);
      }
      formData.append('receipt', receiptFile);

      const res = await api.post('/api/payments/receipt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      notify.success(res.data.message || 'فیش با موفقیت ثبت شد');
      setCheckoutTarget(null);
      setReceiptFile(null);
      setDiscountCode('');
      setDiscountDetails(null);
      fetchSubscription();
    } catch (err: any) {
      console.error('Submit receipt error:', err);
      notify.error(err.response?.data?.error || 'خطا در ثبت فیش پرداخت');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notify.error('رمز جدید و تکرار آن یکسان نیست');
      return;
    }
    try {
      await api.put('/api/settings/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      notify.success('رمز عبور با موفقیت تغییر کرد');
      fetchSessions();
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در تغییر رمز');
    }
  };

  const handleRevokeSession = async (id: string) => {
    try {
      await api.delete(`/api/settings/sessions/${id}`);
      fetchSessions();
      notify.success('نشست بسته شد');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا');
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await api.delete('/api/settings/sessions');
      fetchSessions();
      notify.success('همه نشست‌ها بسته شدند');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا');
    }
  };

  const handleDeleteUserAccount = async () => {
    try {
      await api.delete('/api/settings/account', { data: { confirmEmail: deleteConfirmEmail } });
      await logout();
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در حذف حساب');
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
                      <button 
                        className={`broker-action-btn ${expandedTokenAccountId === acc.id ? 'active' : ''}`} 
                        onClick={() => handleToggleTokens(acc.id)}
                      >
                        کلیدهای اتصال (API)
                      </button>
                      <button className="broker-action-btn danger" onClick={() => handleDeleteAccount(acc.id, acc.trade_count)}>حذف</button>
                    </div>

                    {/* Expanded Tokens Sub-panel */}
                    {expandedTokenAccountId === acc.id && (
                      <div className="broker-tokens-panel">
                        <div className="tokens-list-header">
                          <h5>کلیدهای اتصال متاتریدر ۵ (API Keys)</h5>
                        </div>

                        {loadingTokens[acc.id] ? (
                          <div className="no-tokens">در حال بارگذاری...</div>
                        ) : !tokens[acc.id] || tokens[acc.id].length === 0 ? (
                          <div className="no-tokens">هیچ کلید اتصالی برای این حساب ساخته نشده است.</div>
                        ) : (
                          <div className="tokens-list">
                            {tokens[acc.id].map((tok: any) => (
                              <div key={tok.id} className="token-item">
                                <button 
                                  className="delete-token-btn" 
                                  onClick={() => handleDeleteToken(acc.id, tok.id)}
                                  title="حذف کلید"
                                >
                                  <span className="material-symbols-outlined">delete</span>
                                </button>
                                <div className="token-details">
                                  <span className="token-name">{tok.name}</span>
                                  <span className="token-meta">
                                    پیش‌نمایش: <code>{tok.token_preview}</code>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="create-token-form">
                          <input
                            type="text"
                            placeholder="نام کلید (مثلاً لپ‌تاپ من)"
                            value={newTokenName}
                            onChange={(e) => setNewTokenName(e.target.value)}
                          />
                          <button onClick={() => handleCreateToken(acc.id)}>ایجاد کلید</button>
                        </div>
                      </div>
                    )}
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

            {/* MetaTrader EA Syncing Section */}
            <div className="ea-sync-section" style={{
              marginTop: '32px',
              padding: '24px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  padding: '12px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>sync_alt</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 'bold', color: '#f8fafc' }}>همگام‌سازی خودکار با متاتریدر ۵</h3>
                  <p style={{ margin: '0 0 16px 0', color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6' }}>
                    با دانلود و نصب اکسپرت اختصاصی تریدکاو روی متاتریدر ۵، معاملات شما به صورت کاملاً خودکار و در لحظه به ژورنال منتقل می‌شوند. نیازی به خروجی گرفتن دستی نیست.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <a
                      href="/downloads/TradeKav_EA.ex5"
                      download="TradeKav_EA.ex5"
                      className="settings-save-btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        padding: '10px 16px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>download</span>
                      <span>دانلود اکسپرت متاتریدر ۵ (EX5)</span>
                    </a>
                    
                    <a
                      href="https://tradekav.ir/help/ea-setup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="settings-cancel-btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        padding: '10px 16px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>help</span>
                      <span>راهنمای نصب و راه‌اندازی</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
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

            {subscription.pendingReceipt && subscription.pendingReceipt.status === 'PENDING' && (
              <div className="plan-limit-banner" style={{ marginTop: '16px', background: 'rgba(255, 179, 0, 0.08)', border: '1px solid rgba(255, 179, 0, 0.2)', color: '#ffb300', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined">pending_actions</span>
                <span style={{ fontSize: '0.85rem' }}>
                  فیش پرداخت شما برای ارتقا به پلن{' '}
                  <strong>{subscription.pendingReceipt.plan === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'}</strong> (دوره{' '}
                  {subscription.pendingReceipt.period === 'annual' ? 'سالانه' : 'ماهانه'}) ثبت شده و در حال بررسی توسط مدیریت است.
                </span>
              </div>
            )}

            {subscription.pendingReceipt && subscription.pendingReceipt.status === 'REJECTED' && dismissedRejectionId !== subscription.pendingReceipt.id && (
              <div className="plan-limit-banner" style={{ marginTop: '16px', background: 'rgba(255, 83, 112, 0.08)', border: '1px solid rgba(255, 83, 112, 0.2)', color: '#ff5370', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined">cancel</span>
                <span style={{ fontSize: '0.85rem', flex: 1 }}>
                  آخرین فیش واریزی شما برای پلن{' '}
                  <strong>{subscription.pendingReceipt.plan === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'}</strong>{' '}
                  توسط مدیریت رد شد.
                  {subscription.pendingReceipt.rejectionReason && (
                    <>
                      <br />
                      <span style={{ color: '#a0aec0' }}>علت رد شدن: </span>
                      <strong style={{ color: '#f8fafc' }}>{subscription.pendingReceipt.rejectionReason}</strong>
                    </>
                  )}
                </span>
                <button
                  onClick={() => setDismissedRejectionId(subscription.pendingReceipt.id)}
                  style={{ background: 'none', border: 'none', color: '#ff5370', cursor: 'pointer', padding: 0 }}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            )}

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
                      <p className="plan-upgrade-desc">دسترسی به ۳ حساب معاملاتی، واردات فایل‌های MT4/MT5 (تا ۱۵۰ معامله در هر فایل) و همگام‌سازی خودکار EA هر ۱ ساعت.</p>
                      <div className="plan-upgrade-periods">
                        <div className="period-checkout-row">
                          <span className="period-name">۱ ماهه</span>
                          <button
                            className="period-price-btn"
                            disabled={checkoutLoading}
                            onClick={() => setCheckoutTarget({ plan: 'STANDARD', period: 'monthly' })}
                          >
                            {standardMonthlyPrice} تومان
                          </button>
                        </div>
                        <div className="period-checkout-row">
                          <span className="period-name">
                            سالانه

                            <span className="period-discount">{toPersianDigits(standardDiscountPercent)}% تخفیف</span>
                          </span>
                          <button
                            className="period-price-btn"
                            disabled={checkoutLoading}
                            onClick={() => setCheckoutTarget({ plan: 'STANDARD', period: 'annual' })}
                          >
                            {standardAnnualPrice} تومان
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
                    <p className="plan-upgrade-desc">حساب‌های نامحدود، همگام‌سازی ۶۰ ثانیه‌ای EA، گزارش عملکرد نامحدود، پشتیبانی ویژه و خروجی کامل داده‌ها.</p>
                    <div className="plan-upgrade-periods">
                      <div className="period-checkout-row">
                        <span className="period-name">۱ ماهه</span>
                        <button
                          className="period-price-btn"
                          disabled={checkoutLoading}
                          onClick={() => setCheckoutTarget({ plan: 'PRO', period: 'monthly' })}
                        >
                          {proMonthlyPrice} تومان
                        </button>
                      </div>
                      <div className="period-checkout-row">
                        <span className="period-name">
                          سالانه
                          <span className="period-discount">{toPersianDigits(proDiscountPercent)}٪ تخفیف</span>
                        </span>
                        <button
                          className="period-price-btn"
                          disabled={checkoutLoading}
                          onClick={() => setCheckoutTarget({ plan: 'PRO', period: 'annual' })}
                        >
                          {proAnnualPrice} تومان
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
                    <td>سقف ثبت معامله دستی</td>
                    <td>۳۰ در ماه</td><td>نامحدود</td><td>نامحدود</td>
                  </tr>
                  <tr>
                    <td>حساب بروکر مجاز</td>
                    <td>۱ حساب</td><td>۳ حساب</td><td>نامحدود</td>
                  </tr>
                  <tr>
                    <td>بازه زمانی محاسبات</td>
                    <td>۱ ماه گذشته</td><td>۶ ماه گذشته</td><td>نامحدود (کل تاریخچه)</td>
                  </tr>
                  <tr>
                    <td>همگام‌سازی خودکار EA</td>
                    <td>✗</td><td>هر ۱ ساعت</td><td>هر ۶۰ ثانیه</td>
                  </tr>
                  <tr>
                    <td>واردات فایل MT4/MT5</td>
                    <td>۱ فایل در ماه (تست)</td><td>✓ (تا ۱۵۰ ردیف)</td><td>✓ (نامحدود)</td>
                  </tr>
                  <tr>
                    <td>خروجی داده‌ها (Excel/CSV)</td>
                    <td>✗</td><td>✗</td><td>✓</td>
                  </tr>
                  <tr>
                    <td>پشتیبانی کاربران</td>
                    <td>✗</td><td>عادی (ایمیل)</td><td>ویژه (Priority)</td>
                  </tr>
                  <tr>
                    <td>قیمت ماهانه</td>
                    <td>رایگان</td>
                    <td>{standardMonthlyPrice} ت</td>
                    <td>{proMonthlyPrice} ت</td>
                  </tr>
                  <tr>
                    <td>قیمت سالانه</td>
                    <td>-</td>
                    <td>{standardAnnualPrice} ت</td>
                    <td>{proAnnualPrice} ت</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Checkout Discount Modal */}
            {checkoutTarget && (
              <div className="checkout-modal-overlay">
                <div className="checkout-modal-card">
                  <div className="checkout-modal-header">
                    <h4>
                      خرید پلن {checkoutTarget.plan === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'} - {checkoutTarget.period === 'monthly' ? 'ماهانه' : 'سالانه'}
                    </h4>
                    <button className="close-modal-btn" onClick={() => {
                      setCheckoutTarget(null);
                      setDiscountCode('');
                      setDiscountDetails(null);
                      setDiscountError('');
                    }}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <div className="checkout-modal-body">
                    <div className="price-details-section">
                      <div className="price-row">
                        <span>مبلغ پایه:</span>
                        <span className={discountDetails ? 'original-price-crossed' : 'final-price'}>
                          {activePrices[checkoutTarget.plan as 'STANDARD' | 'PRO'][checkoutTarget.period as 'monthly' | 'annual'].toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                      {discountDetails && (
                        <div className="price-row discount-applied">
                          <span>مبلغ با تخفیف ({toPersianDigits(discountDetails.discountPercent)}٪):</span>
                          <span className="final-price">
                            {discountDetails.discountedPrice.toLocaleString('fa-IR')} تومان
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="discount-input-section">
                      <label>کد تخفیف (اختیاری)</label>
                      <div className="discount-input-wrap">
                        <input
                          type="text"
                          value={discountCode}
                          onChange={(e) => {
                            setDiscountCode(e.target.value);
                            setDiscountError('');
                            setDiscountDetails(null);
                          }}
                          placeholder="مثال: OFF50"
                          style={{ direction: 'ltr', textAlign: 'center' }}
                        />
                        <button
                          type="button"
                          className="discount-apply-btn"
                          disabled={validatingDiscount || !discountCode}
                          onClick={() => handleValidateDiscount(discountCode, checkoutTarget.plan, checkoutTarget.period)}
                        >
                          {validatingDiscount ? 'بررسی...' : 'اعمال'}
                        </button>
                      </div>
                      {discountError && <span className="discount-error-msg">{discountError}</span>}
                      {discountDetails && <span className="discount-success-msg">کد تخفیف با موفقیت اعمال شد.</span>}
                    </div>

                    <div className="card-payment-instructions" style={{ marginTop: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px' }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', color: '#ffb300' }}>مشخصات واریز کارت به کارت:</h5>
                      <div className="instruction-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px', color: '#a0aec0' }}>
                        <span>شماره کارت:</span>
                        <strong style={{ direction: 'ltr', color: '#ffffff' }}>۶۰۳۷-۹۹۷۹-۱۲۳۴-۵۶۷۸</strong>
                      </div>
                      <div className="instruction-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px', color: '#a0aec0' }}>
                        <span>بانک:</span>
                        <span style={{ color: '#ffffff' }}>ملی ایران</span>
                      </div>
                      <div className="instruction-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#a0aec0' }}>
                        <span>به نام:</span>
                        <span style={{ color: '#ffffff' }}>جواد احمدی</span>
                      </div>
                    </div>

                    <div className="receipt-upload-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#a0aec0', fontWeight: '500' }}>بارگذاری تصویر فیش پرداخت (الزامی)</label>
                      <input
                        type="file"
                        id="receipt-file-input"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setReceiptFile(e.target.files[0]);
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="receipt-file-input" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px',
                        background: '#0f121d',
                        border: '1px dashed rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: '#61f9b1',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'border-color 0.2s'
                      }}>
                        <span className="material-symbols-outlined">upload_file</span>
                        <span>{receiptFile ? receiptFile.name : 'انتخاب تصویر فیش (PNG, JPG)'}</span>
                      </label>
                    </div>
                  </div>

                  <div className="checkout-modal-footer">
                    <button
                      className="start-checkout-btn"
                      disabled={checkoutLoading || !receiptFile}
                      onClick={handleSubmitReceipt}
                    >
                      {checkoutLoading ? 'در حال ثبت اطلاعات...' : 'ثبت فیش پرداخت'}
                    </button>
                  </div>
                </div>
              </div>
            )}
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

      {/* API Token Reveal Modal */}
      {showTokenModal && (
        <div className="token-modal-overlay">
          <div className="token-modal">
            <h3>کلید اتصال جدید ایجاد شد</h3>
            <p>
              لطفاً این کلید اتصال را کپی کرده و در محل امنی ذخیره کنید. به دلایل امنیتی، این کلید <strong>دیگر نمایش داده نخواهد شد</strong>!
            </p>
            <div className="token-reveal-box">
              <code>{showTokenModal.token}</code>
              <button 
                className="copy-token-btn" 
                onClick={() => {
                  navigator.clipboard.writeText(showTokenModal.token);
                  notify.success('کلید اتصال کپی شد');
                }}
                title="کپی کلید"
              >
                <span className="material-symbols-outlined">content_copy</span>
              </button>
            </div>
            <div className="token-modal-actions">
              <button onClick={() => setShowTokenModal(null)}>بستن و فهمیدم</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}