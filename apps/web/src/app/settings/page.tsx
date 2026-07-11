'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../lib/auth';
import { api } from '../../lib/api';
import { toPersianDigits } from '../../utils/farsi';
import { notify } from '../../lib/notify';
import { useTranslation } from '../../store/useAppStore';
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
  const { t, language, setLanguage } = useTranslation();

  const formatNum = (num: number | string) => language === 'fa' ? toPersianDigits(num.toString()) : num.toString();

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
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '6037-9975-9444-4128',
    bankName: 'ملی ایران',
    ownerName: 'جواد شیخ اعظمی',
  });

  const activePrices = prices || DEFAULT_PRICES;
  const standardMonthlyPrice = activePrices.STANDARD.monthly.toLocaleString('fa-IR');
  const standardAnnualPrice = activePrices.STANDARD.annual.toLocaleString('fa-IR');
  const proMonthlyPrice = activePrices.PRO.monthly.toLocaleString('fa-IR');
  const proAnnualPrice = activePrices.PRO.annual.toLocaleString('fa-IR');

  const [dismissedRejectionId, setDismissedRejectionId] = useState<string | null>(null);


  // Checkout modal & discount states
  const [checkoutTarget, setCheckoutTarget] = useState<{ plan: string; period: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'payping' | 'zarinpal' | 'manual' | 'crypto'>('payping');
  const [discountCode, setDiscountCode] = useState('');
  const [discountDetails, setDiscountDetails] = useState<{
    valid: boolean;
    discountPercent: number;
    originalPrice: number;
    discountedPrice: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [cryptoDetails, setCryptoDetails] = useState<{
    usdtAddress: string;
    trxAddress: string;
    standard: { monthlyUsd: number; annualUsd: number };
    pro: { monthlyUsd: number; annualUsd: number };
  }>({
    usdtAddress: '',
    trxAddress: '',
    standard: { monthlyUsd: 5.0, annualUsd: 45.0 },
    pro: { monthlyUsd: 10.0, annualUsd: 90.0 }
  });

  // USD equivalents for English display (derived from cryptoDetails state)
  const standardMonthlyUsd = cryptoDetails.standard.monthlyUsd;
  const standardAnnualUsd = cryptoDetails.standard.annualUsd;
  const proMonthlyUsd = cryptoDetails.pro.monthlyUsd;
  const proAnnualUsd = cryptoDetails.pro.annualUsd;
  const standardUsdDiscountPercent = standardAnnualUsd > 0
    ? Math.round((1 - standardAnnualUsd / (standardMonthlyUsd * 12)) * 100)
    : 0;
  const proUsdDiscountPercent = proAnnualUsd > 0
    ? Math.round((1 - proAnnualUsd / (proMonthlyUsd * 12)) * 100)
    : 0;

  const standardDiscountPercent = language === 'fa'
    ? Math.round((1 - activePrices.STANDARD.annual / (activePrices.STANDARD.monthly * 12)) * 100)
    : standardUsdDiscountPercent;
  const proDiscountPercent = language === 'fa'
    ? Math.round((1 - activePrices.PRO.annual / (activePrices.PRO.monthly * 12)) * 100)
    : proUsdDiscountPercent;
  const [cryptoCoin, setCryptoCoin] = useState<'USDT' | 'TRX'>('USDT');
  const [cryptoTxHash, setCryptoTxHash] = useState('');

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

  const fetchCardDetails = useCallback(async () => {
    try {
      const res = await api.get('/api/settings/card-details');
      setCardDetails(res.data);
    } catch (err) {
      console.error('Failed to fetch card details:', err);
    }
  }, []);

  useEffect(() => { fetchCardDetails(); }, [fetchCardDetails]);

  const fetchCryptoDetails = useCallback(async () => {
    try {
      const res = await api.get('/api/settings/crypto-details');
      setCryptoDetails(res.data);
    } catch (err) {
      console.error('Failed to fetch crypto details:', err);
    }
  }, []);

  useEffect(() => { fetchCryptoDetails(); }, [fetchCryptoDetails]);

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
      notify.success(t('settings.profileSaveSuccess'));
      fetchProfile();
    } catch (err: any) {
      notify.error(err.response?.data?.error || t('settings.profileSaveError'));
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
      notify.success(t('settings.avatarUploadSuccess'));
    } catch (err: any) {
      notify.error(err.response?.data?.error || t('settings.avatarUploadError'));
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
      notify.success(t('settings.accountCreateSuccess'));
    } catch (err: any) {
      notify.error(err.response?.data?.error || t('settings.accountCreateError'));
    }
  };

  const handleUpdateAccount = async (id: string) => {
    try {
      await api.put(`/api/settings/accounts/${id}`, editAccount);
      setEditingId(null);
      fetchAccounts();
      notify.success(t('settings.accountUpdateSuccess'));
    } catch (err: any) {
      notify.error(err.response?.data?.error || t('settings.accountUpdateError'));
    }
  };

  const handleDeleteAccount = async (id: string, tradeCount: number) => {
    const ok = await notify.confirm({
      title: language === 'fa' ? 'حذف حساب بروکر' : 'Delete Broker Account',
      message: language === 'fa'
        ? `با حذف این حساب، تمام ${toPersianDigits(tradeCount)} معامله مرتبط با آن نیز حذف می‌شوند. آیا مطمئن هستید؟`
        : `Deleting this account will also delete all ${tradeCount} trades associated with it. Are you sure?`,
      danger: true,
      confirmLabel: language === 'fa' ? 'حذف حساب' : 'Delete Account',
    });
    if (!ok) return;
    try {
      await api.delete(`/api/settings/accounts/${id}`);
      fetchAccounts();
      notify.success(t('settings.accountDeleteSuccess'));
    } catch (err: any) {
      notify.error(err.response?.data?.error || t('settings.accountDeleteError'));
    }
  };

  // ─── API Tokens handlers ──────────────────────────────────────────────────
  const fetchTokens = useCallback(async (accountId: string) => {
    try {
      setLoadingTokens(prev => ({ ...prev, [accountId]: true }));
      const res = await api.get(`/api/accounts/${accountId}/tokens`);
      setTokens(prev => ({ ...prev, [accountId]: res.data }));
    } catch (err: any) {
      notify.error(err.response?.data?.error || t('settings.apiKeyGetError'));
    } finally {
      setLoadingTokens(prev => ({ ...prev, [accountId]: false }));
    }
  }, []);

  const handleCreateToken = async (accountId: string) => {
    if (!newTokenName.trim()) {
      notify.error(t('settings.apiKeyNameRequired'));
      return;
    }
    try {
      const res = await api.post(`/api/accounts/${accountId}/tokens`, { name: newTokenName });
      setShowTokenModal({ token: res.data.token, name: res.data.name });
      setNewTokenName('');
      fetchTokens(accountId);
      notify.success(t('settings.apiKeyCreateSuccess'));
    } catch (err: any) {
      notify.error(err.response?.data?.error || t('settings.apiKeyCreateError'));
    }
  };

  const handleDeleteToken = async (accountId: string, tokenId: string) => {
    const ok = await notify.confirm({
      title: language === 'fa' ? 'حذف کلید اتصال' : 'Delete Connection Key',
      message: language === 'fa'
        ? 'آیا از حذف این کلید اتصال مطمئن هستید؟ اکسپرت‌های متصل به این کلید دیگر کار نخواهند کرد.'
        : 'Are you sure you want to delete this connection key? Connected Expert Advisors will stop working.',
      danger: true,
      confirmLabel: language === 'fa' ? 'حذف کلید' : 'Delete Key',
    });
    if (!ok) return;
    try {
      await api.delete(`/api/accounts/${accountId}/tokens/${tokenId}`);
      fetchTokens(accountId);
      notify.success(t('settings.apiKeyDeleteSuccess'));
    } catch (err: any) {
      notify.error(err.response?.data?.error || t('settings.apiKeyDeleteError'));
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
      notify.error(t('settings.receiptFileRequired'));
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

      notify.success(res.data.message || t('settings.receiptSubmitSuccess'));
      setCheckoutTarget(null);
      setReceiptFile(null);
      setDiscountCode('');
      setDiscountDetails(null);
      fetchSubscription();
    } catch (err: any) {
      console.error('Submit receipt error:', err);
      notify.error(err.response?.data?.error || t('settings.receiptSubmitError'));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleOnlineCheckout = async () => {
    if (!checkoutTarget) return;
    setCheckoutLoading(true);
    try {
      const endpoint = paymentMethod === 'payping' ? '/api/payments/payping/checkout' : '/api/payments/checkout';
      const res = await api.post(endpoint, {
        plan: checkoutTarget.plan,
        period: checkoutTarget.period,
        discountCode: discountCode || undefined,
      });

      if (res.data.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      } else {
        notify.error(language === 'fa' ? 'آدرس انتقال به درگاه پرداخت یافت نشد.' : 'Payment gateway redirect URL not found.');
      }
    } catch (err: any) {
      console.error('Online checkout error:', err);
      notify.error(err.response?.data?.error || t('settings.checkoutGatewayError'));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCryptoCheckout = async () => {
    if (!checkoutTarget) return;
    if (!cryptoTxHash.trim()) {
      notify.error(language === 'fa' ? 'لطفا کد هش تراکنش (TXID) را وارد کنید' : 'Please enter the transaction hash (TXID)');
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await api.post('/api/payments/crypto/submit', {
        txHash: cryptoTxHash.trim(),
        coin: cryptoCoin,
        plan: checkoutTarget.plan,
        period: checkoutTarget.period,
        discountCode: discountCode || undefined,
      });

      notify.success(res.data.message || (language === 'fa' ? 'پرداخت رمزارز با موفقیت تایید شد' : 'Crypto payment approved successfully'));
      setCheckoutTarget(null);
      setCryptoTxHash('');
      setDiscountCode('');
      setDiscountDetails(null);
      fetchSubscription();
    } catch (err: any) {
      console.error('Crypto checkout error:', err);
      notify.error(err.response?.data?.error || (language === 'fa' ? 'خطا در تایید تراکنش رمزارز' : 'Error verifying crypto transaction'));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notify.error(t('settings.passwordMismatch'));
      return;
    }
    try {
      await api.put('/api/settings/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      notify.success(t('settings.passwordChangeSuccess'));
      fetchSessions();
    } catch (err: any) {
      notify.error(err.response?.data?.error || t('settings.passwordChangeError'));
    }
  };

  const handleRevokeSession = async (id: string) => {
    try {
      await api.delete(`/api/settings/sessions/${id}`);
      fetchSessions();
      notify.success(t('settings.sessionRevokeSuccess'));
    } catch (err: any) {
      notify.error(err.response?.data?.error || t('common.errorOccurred'));
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await api.delete('/api/settings/sessions');
      fetchSessions();
      notify.success(t('settings.sessionRevokeAllSuccess'));
    } catch (err: any) {
      notify.error(err.response?.data?.error || t('common.errorOccurred'));
    }
  };

  const handleDeleteUserAccount = async () => {
    try {
      await api.delete('/api/settings/account', { data: { confirmEmail: deleteConfirmEmail } });
      await logout();
    } catch (err: any) {
      notify.error(err.response?.data?.error || t('settings.userDeleteError'));
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
    if (score <= 1) return { label: t('settings.weak'), class: 'weak' };
    if (score <= 3) return { label: t('settings.medium'), class: 'medium' };
    return { label: t('settings.strong'), class: 'strong' };
  };

  const initials = (profile?.name || user?.name || '?').charAt(0);

  return (
    <div className="settings-page">
      {/* ─── Header ─── */}
      <header className="settings-header">
        <h1>{t('settings.title')}</h1>
      </header>

      {/* ─── Tab Bar ─── */}
      <div className="settings-tab-bar">
        {([
          { key: 'profile', label: t('settings.profile'), icon: 'person' },
          { key: 'accounts', label: t('settings.brokerAccounts'), icon: 'account_balance' },
          { key: 'subscription', label: t('settings.subscription'), icon: 'card_membership' },
          { key: 'security', label: t('settings.security'), icon: 'shield' },
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
                {t('settings.changeAvatar')}
                <input type="file" accept="image/jpeg,image/png" onChange={handleAvatarUpload} hidden disabled={avatarUploading} />
              </label>
            </div>

            {/* Form */}
            <div className="settings-form-grid">
              <div className="form-field">
                <label>{t('settings.fullName')}</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => { setProfileForm({ ...profileForm, name: e.target.value }); setProfileDirty(true); }}
                  placeholder={t('auth.namePlaceholder')}
                />
              </div>

              <div className="form-field">
                <label>{t('settings.email')}</label>
                <div className="readonly-field">
                  <span style={{ direction: 'ltr' }}>{profile.email}</span>
                  <span className="material-symbols-outlined verified-icon">verified</span>
                </div>
              </div>

              <div className="form-field">
                <label>{t('settings.phoneNumber')}</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => { setProfileForm({ ...profileForm, phone: e.target.value }); setProfileDirty(true); }}
                  placeholder={t('auth.phonePlaceholder')}
                  style={{ direction: 'ltr', textAlign: language === 'fa' ? 'right' : 'left' }}
                />
              </div>

              <div className="form-field">
                <label>{t('settings.displayCurrency')}</label>
                <div className="toggle-group">
                  {(['USD', 'TOMAN', 'BOTH'] as const).map((curr) => (
                    <button
                      key={curr}
                      className={`toggle-btn ${profileForm.displayCurrency === curr ? 'active' : ''}`}
                      onClick={() => { setProfileForm({ ...profileForm, displayCurrency: curr }); setProfileDirty(true); }}
                    >
                      {curr === 'USD' ? t('settings.currencyUsd') : curr === 'TOMAN' ? t('settings.currencyToman') : t('settings.currencyBoth')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label>{t('settings.language')}</label>
                <div className="toggle-group">
                  <button
                    className={`toggle-btn ${language === 'fa' ? 'active' : ''}`}
                    onClick={() => { setLanguage('fa'); }}
                  >
                    {t('settings.farsi')}
                  </button>
                  <button
                    className={`toggle-btn ${language === 'en' ? 'active' : ''}`}
                    onClick={() => { setLanguage('en'); }}
                  >
                    {t('settings.english')}
                  </button>
                </div>
              </div>
            </div>

            <button className="settings-save-btn" onClick={handleProfileSave} disabled={!profileDirty}>
              {t('settings.saveChanges')}
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
                <span>{language === 'fa' ? 'برای افزودن حساب بیشتر، اشتراکت رو ارتقا بده' : 'To add more accounts, please upgrade your subscription'}</span>
                <button onClick={() => switchTab('subscription')}>{t('dashboard.upgradeSubscription')}</button>
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
                        <label>{t('settings.brokerName')}</label>
                        <input
                          type="text"
                          value={editAccount.broker_name}
                          onChange={(e) => setEditAccount({ ...editAccount, broker_name: e.target.value })}
                        />
                      </div>
                      <div className="form-field">
                        <label>{t('settings.accountNumber')}</label>
                        <input
                          type="text"
                          value={editAccount.account_number}
                          onChange={(e) => setEditAccount({ ...editAccount, account_number: e.target.value })}
                          style={{ direction: 'ltr', textAlign: language === 'fa' ? 'right' : 'left' }}
                        />
                      </div>
                      <div className="form-field">
                        <label>{t('settings.accountCurrency')}</label>
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
                      <button className="settings-save-btn" onClick={() => handleUpdateAccount(acc.id)}>{t('settings.save')}</button>
                      <button className="settings-cancel-btn" onClick={() => setEditingId(null)}>{t('settings.cancel')}</button>
                    </div>
                  </div>
                ) : (
                  // ─── View mode ───
                  <>
                    <div className="broker-card-header">
                      <div className="broker-avatar">{(acc.broker_name || '?').charAt(0)}</div>
                      <div className="broker-info">
                        <h4>{acc.broker_name || (language === 'fa' ? 'نامشخص' : 'Unknown')}</h4>
                        <span>{language === 'fa' ? 'حساب شماره' : 'Account No'}: {acc.account_number ? `#${acc.account_number}` : (language === 'fa' ? 'نامشخص' : 'Unknown')}</span>
                        <span>{language === 'fa' ? 'ارز' : 'Currency'}: {acc.currency}</span>
                        <span>{formatNum(acc.trade_count)} {t('trades.tradeUnit')}</span>
                      </div>
                    </div>
                    <div className="broker-card-actions">
                      <button className="broker-action-btn" onClick={() => router.push('/trades')}>{t('settings.newImport')}</button>
                      <button className="broker-action-btn" onClick={() => {
                        setEditingId(acc.id);
                        setEditAccount({
                          broker_name: acc.broker_name || '',
                          account_number: acc.account_number || '',
                          currency: acc.currency,
                        });
                      }}>{t('settings.edit')}</button>
                      <button 
                        className={`broker-action-btn ${expandedTokenAccountId === acc.id ? 'active' : ''}`} 
                        onClick={() => handleToggleTokens(acc.id)}
                      >
                        {t('settings.apiKeys')}
                      </button>
                      <button className="broker-action-btn danger" onClick={() => handleDeleteAccount(acc.id, acc.trade_count)}>{t('settings.delete')}</button>
                    </div>

                    {/* Expanded Tokens Sub-panel */}
                    {expandedTokenAccountId === acc.id && (
                      <div className="broker-tokens-panel">
                        <div className="tokens-list-header">
                          <h5>{t('settings.apiKeysTitle')}</h5>
                        </div>

                        {loadingTokens[acc.id] ? (
                          <div className="no-tokens">{t('common.loading')}</div>
                        ) : !tokens[acc.id] || tokens[acc.id].length === 0 ? (
                          <div className="no-tokens">{t('settings.noApiKeys')}</div>
                        ) : (
                          <div className="tokens-list">
                            {tokens[acc.id].map((tok: any) => (
                              <div key={tok.id} className="token-item">
                                <button 
                                  className="delete-token-btn" 
                                  onClick={() => handleDeleteToken(acc.id, tok.id)}
                                  title={t('settings.deleteKey')}
                                >
                                  <span className="material-symbols-outlined">delete</span>
                                </button>
                                <div className="token-details">
                                  <span className="token-name">{tok.name}</span>
                                  <span className="token-meta">
                                    {language === 'fa' ? 'پیش‌نمایش:' : 'Preview:'} <code>{tok.token_preview}</code>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="create-token-form">
                          <input
                            type="text"
                            placeholder={t('settings.keyNamePlaceholder')}
                            value={newTokenName}
                            onChange={(e) => setNewTokenName(e.target.value)}
                          />
                          <button onClick={() => handleCreateToken(acc.id)}>{t('settings.createKey')}</button>
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
                    <label>{t('settings.brokerName')}</label>
                    <input
                      type="text"
                      list="broker-presets"
                      value={newAccount.broker_name}
                      onChange={(e) => setNewAccount({ ...newAccount, broker_name: e.target.value })}
                      placeholder={language === 'fa' ? 'انتخاب یا تایپ نام بروکر' : 'Select or type broker name'}
                    />
                    <datalist id="broker-presets">
                      {BROKER_PRESETS.map((b) => <option key={b} value={b} />)}
                    </datalist>
                  </div>
                  <div className="form-field">
                    <label>{t('settings.accountNumber')}</label>
                    <input
                      type="text"
                      value={newAccount.account_number}
                      onChange={(e) => setNewAccount({ ...newAccount, account_number: e.target.value })}
                      placeholder={t('settings.accountNumber')}
                      style={{ direction: 'ltr', textAlign: language === 'fa' ? 'right' : 'left' }}
                    />
                  </div>
                  <div className="form-field">
                    <label>{t('settings.accountCurrency')}</label>
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
                  <button className="settings-save-btn" onClick={handleCreateAccount}>{t('settings.save')}</button>
                  <button className="settings-cancel-btn" onClick={() => setShowAddAccount(false)}>{t('settings.cancel')}</button>
                </div>
              </div>
            ) : (
              <button className="add-account-card" onClick={() => setShowAddAccount(true)}>
                <span className="material-symbols-outlined">add</span>
                <span>{t('settings.addBrokerAccount')}</span>
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
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 'bold', color: '#f8fafc' }}>{t('settings.autoSyncMetaTrader')}</h3>
                  <p style={{ margin: '0 0 16px 0', color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6' }}>
                    {t('settings.autoSyncDesc')}
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
                      <span>{t('settings.downloadEA')}</span>
                    </a>

                    <a
                      href="/downloads/TradeKav_EA.ex4"
                      download="TradeKav_EA.ex4"
                      className="settings-save-btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        padding: '10px 16px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        color: '#cbd5e1'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>download</span>
                      <span>{t('settings.downloadEAMT4')}</span>
                    </a>
                    
                    <a
                      href="/help/ea-setup"
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
                      <span>{t('settings.setupGuide')}</span>
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
                <span className="plan-label">{t('settings.currentPlan')}:</span>
                <span className="plan-badge">
                  {subscription.plan === 'FREE' 
                    ? (language === 'fa' ? 'رایگان' : 'Free') 
                    : subscription.plan === 'STANDARD' 
                      ? (language === 'fa' ? 'استاندارد' : 'Standard') 
                      : (language === 'fa' ? 'حرفه‌ای' : 'Pro')}
                </span>
              </div>
              {subscription.subscription && (
                <div className="plan-details">
                  <span>{t('settings.planExpiry')}: {new Date(subscription.subscription.end_date).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US')}</span>
                </div>
              )}
            </div>

            {subscription.pendingReceipt && subscription.pendingReceipt.status === 'PENDING' && (
              <div className="plan-limit-banner" style={{ marginTop: '16px', background: 'rgba(255, 179, 0, 0.08)', border: '1px solid rgba(255, 179, 0, 0.2)', color: '#ffb300', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined">pending_actions</span>
                <span style={{ fontSize: '0.85rem' }}>
                  {language === 'fa'
                    ? `فیش پرداخت شما برای ارتقا به پلن ${subscription.pendingReceipt.plan === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'} (دوره ${subscription.pendingReceipt.period === 'annual' ? 'سالانه' : 'ماهانه'}) ثبت شده و در حال بررسی توسط مدیریت است.`
                    : `Your payment receipt for upgrading to ${subscription.pendingReceipt.plan === 'STANDARD' ? 'Standard' : 'Pro'} plan (${subscription.pendingReceipt.period === 'annual' ? 'Annual' : 'Monthly'}) has been registered and is pending admin approval.`}
                </span>
              </div>
            )}

            {subscription.pendingReceipt && subscription.pendingReceipt.status === 'REJECTED' && dismissedRejectionId !== subscription.pendingReceipt.id && (
              <div className="plan-limit-banner" style={{ marginTop: '16px', background: 'rgba(255, 83, 112, 0.08)', border: '1px solid rgba(255, 83, 112, 0.2)', color: '#ff5370', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined">cancel</span>
                <span style={{ fontSize: '0.85rem', flex: 1 }}>
                  {language === 'fa'
                    ? `آخرین فیش واریزی شما برای پلن ${subscription.pendingReceipt.plan === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'} توسط مدیریت رد شد.`
                    : `Your last receipt for the ${subscription.pendingReceipt.plan === 'STANDARD' ? 'Standard' : 'Pro'} plan was rejected by the admin.`}
                  {subscription.pendingReceipt.rejectionReason && (
                    <>
                      <br />
                      <span style={{ color: '#a0aec0' }}>{language === 'fa' ? 'علت رد شدن: ' : 'Reason: '}</span>
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
                <h3 className="pricing-section-title">{language === 'fa' ? 'ارتقای اشتراک' : 'Upgrade Subscription'}</h3>
                <div className="pricing-plans-grid">
                  {/* Standard Plan Upgrade Card */}
                  {subscription.plan === 'FREE' && (
                    <div className="plan-upgrade-card featured">
                      <div className="plan-upgrade-header">
                        <span className="plan-title">{language === 'fa' ? 'پلن استاندارد' : 'Standard Plan'}</span>
                        <span className="plan-badge-tag">{language === 'fa' ? 'محبوب‌ترین' : 'Popular'}</span>
                      </div>
                      <p className="plan-upgrade-desc">
                        {language === 'fa'
                          ? 'دسترسی به ۳ حساب معاملاتی، واردات فایل‌های MT4/MT5 (تا ۱۵۰ معامله در هر فایل) و همگام‌سازی خودکار EA هر ۱ ساعت.'
                          : 'Access to 3 trading accounts, MT4/MT5 file import (up to 150 trades per file) and automatic EA sync every 1 hour.'}
                      </p>
                      <div className="plan-upgrade-periods">
                        <div className="period-checkout-row">
                          <span className="period-name">{language === 'fa' ? '۱ ماهه' : '1 Month'}</span>
                          <button
                            className="period-price-btn"
                            disabled={checkoutLoading}
                            onClick={() => setCheckoutTarget({ plan: 'STANDARD', period: 'monthly' })}
                          >
                            {language === 'fa' ? `${standardMonthlyPrice} تومان` : `$${standardMonthlyUsd.toFixed(2)}`}
                          </button>
                        </div>
                        <div className="period-checkout-row">
                          <span className="period-name">
                            {language === 'fa' ? 'سالانه' : 'Annual'}
                            <span className="period-discount">{formatNum(standardDiscountPercent)}% {language === 'fa' ? 'تخفیف' : 'Off'}</span>
                          </span>
                          <button
                            className="period-price-btn"
                            disabled={checkoutLoading}
                            onClick={() => setCheckoutTarget({ plan: 'STANDARD', period: 'annual' })}
                          >
                            {language === 'fa' ? `${standardAnnualPrice} تومان` : `$${standardAnnualUsd.toFixed(2)}`}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pro Plan Upgrade Card */}
                  <div className="plan-upgrade-card">
                    <div className="plan-upgrade-header">
                      <span className="plan-title">{language === 'fa' ? 'پلن حرفه‌ای' : 'Pro Plan'}</span>
                    </div>
                    <p className="plan-upgrade-desc">
                      {language === 'fa'
                        ? 'حساب‌های نامحدود، همگام‌سازی ۶۰ ثانیه‌ای EA، گزارش عملکرد نامحدود، پشتیبانی ویژه و خروجی کامل داده‌ها.'
                        : 'Unlimited accounts, 60-second EA sync, unlimited performance reports, priority support, and full data export.'}
                    </p>
                    <div className="plan-upgrade-periods">
                      <div className="period-checkout-row">
                        <span className="period-name">{language === 'fa' ? '۱ ماهه' : '1 Month'}</span>
                        <button
                          className="period-price-btn"
                          disabled={checkoutLoading}
                          onClick={() => setCheckoutTarget({ plan: 'PRO', period: 'monthly' })}
                        >
                          {language === 'fa' ? `${proMonthlyPrice} تومان` : `$${proMonthlyUsd.toFixed(2)}`}
                        </button>
                      </div>
                      <div className="period-checkout-row">
                        <span className="period-name">
                          {language === 'fa' ? 'سالانه' : 'Annual'}
                          <span className="period-discount">{formatNum(proDiscountPercent)}٪ {language === 'fa' ? 'تخفیف' : 'Off'}</span>
                        </span>
                        <button
                          className="period-price-btn"
                          disabled={checkoutLoading}
                          onClick={() => setCheckoutTarget({ plan: 'PRO', period: 'annual' })}
                        >
                          {language === 'fa' ? `${proAnnualPrice} تومان` : `$${proAnnualUsd.toFixed(2)}`}
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
                    <th>{language === 'fa' ? 'امکانات' : 'Features'}</th>
                    <th className={subscription.plan === 'FREE' ? 'current-col' : ''}>{language === 'fa' ? 'رایگان' : 'Free'}</th>
                    <th className={subscription.plan === 'STANDARD' ? 'current-col' : ''}>{language === 'fa' ? 'استاندارد' : 'Standard'}</th>
                    <th className={subscription.plan === 'PRO' ? 'current-col' : ''}>{language === 'fa' ? 'حرفه‌ای' : 'Pro'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{language === 'fa' ? 'سقف ثبت معامله دستی' : 'Manual Trade Limit'}</td>
                    <td>{language === 'fa' ? '۳۰ در ماه' : '30 / month'}</td>
                    <td>{language === 'fa' ? 'نامحدود' : 'Unlimited'}</td>
                    <td>{language === 'fa' ? 'نامحدود' : 'Unlimited'}</td>
                  </tr>
                  <tr>
                    <td>{language === 'fa' ? 'حساب بروکر مجاز' : 'Allowed Broker Accounts'}</td>
                    <td>{language === 'fa' ? '۱ حساب' : '1 Account'}</td>
                    <td>{language === 'fa' ? '۳ حساب' : '3 Accounts'}</td>
                    <td>{language === 'fa' ? 'نامحدود' : 'Unlimited'}</td>
                  </tr>
                  <tr>
                    <td>{language === 'fa' ? 'بازه زمانی محاسبات' : 'Calculation Period'}</td>
                    <td>{language === 'fa' ? '۱ ماه گذشته' : 'Last 1 month'}</td>
                    <td>{language === 'fa' ? '۶ ماه گذشته' : 'Last 6 months'}</td>
                    <td>{language === 'fa' ? 'نامحدود (کل تاریخچه)' : 'Unlimited (All history)'}</td>
                  </tr>
                  <tr>
                    <td>{language === 'fa' ? 'همگام‌سازی خودکار EA' : 'Automatic EA Sync'}</td>
                    <td>✗</td>
                    <td>{language === 'fa' ? 'هر ۱ ساعت' : 'Every 1 hour'}</td>
                    <td>{language === 'fa' ? 'هر ۶۰ ثانیه' : 'Every 60 seconds'}</td>
                  </tr>
                  <tr>
                    <td>{language === 'fa' ? 'واردات فایل MT4/MT5' : 'MT4/MT5 File Import'}</td>
                    <td>{language === 'fa' ? '۱ فایل در ماه (تست)' : '1 file/month (trial)'}</td>
                    <td>{language === 'fa' ? '✓ (تا ۱۵۰ ردیف)' : '✓ (up to 150 rows)'}</td>
                    <td>{language === 'fa' ? '✓ (نامحدود)' : '✓ (unlimited)'}</td>
                  </tr>
                  <tr>
                    <td>{language === 'fa' ? 'خروجی داده‌ها (Excel/CSV)' : 'Data Export (Excel/CSV)'}</td>
                    <td>✗</td>
                    <td>✗</td>
                    <td>✓</td>
                  </tr>
                  <tr>
                    <td>{language === 'fa' ? 'پشتیبانی کاربران' : 'User Support'}</td>
                    <td>✗</td>
                    <td>{language === 'fa' ? 'عادی (ایمیل)' : 'Standard (Email)'}</td>
                    <td>{language === 'fa' ? 'ویژه (Priority)' : 'Priority'}</td>
                  </tr>
                  <tr>
                    <td>{language === 'fa' ? 'قیمت ماهانه' : 'Monthly Price'}</td>
                    <td>{language === 'fa' ? 'رایگان' : 'Free'}</td>
                    <td>{language === 'fa' ? `${standardMonthlyPrice} ت` : `$${standardMonthlyUsd.toFixed(2)}`}</td>
                    <td>{language === 'fa' ? `${proMonthlyPrice} ت` : `$${proMonthlyUsd.toFixed(2)}`}</td>
                  </tr>
                  <tr>
                    <td>{language === 'fa' ? 'قیمت سالانه' : 'Annual Price'}</td>
                    <td>-</td>
                    <td>{language === 'fa' ? `${standardAnnualPrice} ت` : `$${standardAnnualUsd.toFixed(2)}`}</td>
                    <td>{language === 'fa' ? `${proAnnualPrice} ت` : `$${proAnnualUsd.toFixed(2)}`}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Checkout Discount Modal */}
            {checkoutTarget && (() => {
              const planKey = checkoutTarget.plan.toLowerCase() === 'standard' ? 'standard' : 'pro';
              const periodKey = checkoutTarget.period === 'annual' ? 'annualUsd' : 'monthlyUsd';
              let expectedAmount = cryptoDetails[planKey as 'standard' | 'pro'][periodKey as 'monthlyUsd' | 'annualUsd'] || 5.0;
              if (discountDetails) {
                expectedAmount = expectedAmount * (1 - discountDetails.discountPercent / 100);
              }

              return (
                <div className="checkout-modal-overlay">
                  <div className="checkout-modal-card">
                    <div className="checkout-modal-header">
                      <h4>
                        {language === 'fa'
                          ? `خرید پلن ${checkoutTarget.plan === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'} - ${checkoutTarget.period === 'monthly' ? 'ماهانه' : 'سالانه'}`
                          : `Purchase ${checkoutTarget.plan === 'STANDARD' ? 'Standard' : 'Pro'} Plan - ${checkoutTarget.period === 'monthly' ? 'Monthly' : 'Annual'}`}
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
                          <span>{language === 'fa' ? 'مبلغ پایه:' : 'Base Price:'}</span>
                          <span className={discountDetails ? 'original-price-crossed' : 'final-price'}>
                            {language === 'fa'
                              ? `${activePrices[checkoutTarget.plan as 'STANDARD' | 'PRO'][checkoutTarget.period as 'monthly' | 'annual'].toLocaleString('fa-IR')} تومان`
                              : `$${(checkoutTarget.plan === 'STANDARD'
                                  ? (checkoutTarget.period === 'monthly' ? standardMonthlyUsd : standardAnnualUsd)
                                  : (checkoutTarget.period === 'monthly' ? proMonthlyUsd : proAnnualUsd)
                                ).toFixed(2)}`}
                          </span>
                        </div>
                        {discountDetails && (
                          <div className="price-row discount-applied">
                            <span>
                              {language === 'fa'
                                ? `مبلغ با تخفیف (${formatNum(discountDetails.discountPercent)}٪):`
                                : `Discounted Price (${discountDetails.discountPercent}%):`}
                            </span>
                            <span className="final-price">
                              {language === 'fa'
                                ? `${discountDetails.discountedPrice.toLocaleString('fa-IR')} تومان`
                                : `$${(expectedAmount * (1 - discountDetails.discountPercent / 100)).toFixed(2)}`}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="discount-input-section">
                        <label>{language === 'fa' ? 'کد تخفیف (اختیاری)' : 'Discount Code (Optional)'}</label>
                        <div className="discount-input-wrap">
                          <input
                            type="text"
                            value={discountCode}
                            onChange={(e) => {
                              setDiscountCode(e.target.value);
                              setDiscountError('');
                              setDiscountDetails(null);
                            }}
                            placeholder={language === 'fa' ? 'مثال: OFF50' : 'Example: OFF50'}
                            style={{ direction: 'ltr', textAlign: 'center' }}
                          />
                          <button
                            type="button"
                            className="discount-apply-btn"
                            disabled={validatingDiscount || !discountCode}
                            onClick={() => handleValidateDiscount(discountCode, checkoutTarget.plan, checkoutTarget.period)}
                          >
                            {validatingDiscount ? (language === 'fa' ? 'بررسی...' : 'Validating...') : (language === 'fa' ? 'اعمال' : 'Apply')}
                          </button>
                        </div>
                        {discountError && <span className="discount-error-msg">{discountError}</span>}
                        {discountDetails && <span className="discount-success-msg">{language === 'fa' ? 'کد تخفیف با موفقیت اعمال شد.' : 'Discount code applied successfully.'}</span>}
                      </div>

                      {/* Select Payment Method */}
                      <div className="payment-method-selector" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px', marginTop: '15px' }}>
                        <label style={{ fontSize: '0.85rem', color: '#a0aec0', fontWeight: '500' }}>{language === 'fa' ? 'روش پرداخت' : 'Payment Method'}</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('payping')}
                            style={{
                              padding: '10px',
                              background: paymentMethod === 'payping' ? 'rgba(97, 249, 177, 0.15)' : '#0f121d',
                              border: paymentMethod === 'payping' ? '1px solid #61f9b1' : '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              color: paymentMethod === 'payping' ? '#61f9b1' : '#a0aec0',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: '0.82rem',
                              transition: 'all 0.2s',
                            }}
                          >
                            {language === 'fa' ? 'درگاه پی‌پینگ' : 'PayPing Gateway'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('zarinpal')}
                            style={{
                              padding: '10px',
                              background: paymentMethod === 'zarinpal' ? 'rgba(255, 204, 0, 0.15)' : '#0f121d',
                              border: paymentMethod === 'zarinpal' ? '1px solid #ffcc00' : '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              color: paymentMethod === 'zarinpal' ? '#ffcc00' : '#a0aec0',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: '0.82rem',
                              transition: 'all 0.2s',
                            }}
                          >
                            {language === 'fa' ? 'درگاه زرین‌پال' : 'ZarinPal Gateway'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('manual')}
                            style={{
                              padding: '10px',
                              background: paymentMethod === 'manual' ? 'rgba(49, 130, 206, 0.15)' : '#0f121d',
                              border: paymentMethod === 'manual' ? '1px solid #3182ce' : '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              color: paymentMethod === 'manual' ? '#3182ce' : '#a0aec0',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: '0.82rem',
                              transition: 'all 0.2s',
                            }}
                          >
                            {language === 'fa' ? 'کارت به کارت' : 'Card Transfer'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('crypto')}
                            style={{
                              padding: '10px',
                              background: paymentMethod === 'crypto' ? 'rgba(155, 89, 182, 0.15)' : '#0f121d',
                              border: paymentMethod === 'crypto' ? '1px solid #9b59b6' : '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              color: paymentMethod === 'crypto' ? '#9b59b6' : '#a0aec0',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: '0.82rem',
                              transition: 'all 0.2s',
                            }}
                          >
                            {language === 'fa' ? 'پرداخت رمزارز' : 'Crypto Payment'}
                          </button>
                        </div>
                      </div>

                      {paymentMethod === 'manual' && (
                        <>
                          <div className="card-payment-instructions" style={{ marginTop: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px' }}>
                            <h5 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', color: '#ffb300' }}>{language === 'fa' ? 'مشخصات واریز کارت به کارت:' : 'Card Transfer Details:'}</h5>
                            <div className="instruction-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px', color: '#a0aec0' }}>
                              <span>{language === 'fa' ? 'شماره کارت:' : 'Card Number:'}</span>
                              <strong style={{ direction: 'ltr', color: '#ffffff' }}>{formatNum(cardDetails.cardNumber)}</strong>
                            </div>
                            <div className="instruction-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px', color: '#a0aec0' }}>
                              <span>{language === 'fa' ? 'بانک:' : 'Bank:'}</span>
                              <span style={{ color: '#ffffff' }}>{language === 'fa' ? cardDetails.bankName : 'Melli Iran'}</span>
                            </div>
                            <div className="instruction-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#a0aec0' }}>
                              <span>{language === 'fa' ? 'به نام:' : 'Account Holder:'}</span>
                              <span style={{ color: '#ffffff' }}>{language === 'fa' ? cardDetails.ownerName : 'Javad Sheikh Azami'}</span>
                            </div>
                          </div>

                          <div className="receipt-upload-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                            <label style={{ fontSize: '0.8rem', color: '#a0aec0', fontWeight: '500' }}>{language === 'fa' ? 'بارگذاری تصویر فیش پرداخت (الزامی)' : 'Upload Payment Receipt (Required)'}</label>
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
                              <span>{receiptFile ? receiptFile.name : (language === 'fa' ? 'انتخاب تصویر فیش (PNG, JPG)' : 'Select receipt image (PNG, JPG)')}</span>
                            </label>
                          </div>
                        </>
                      )}

                      {paymentMethod === 'crypto' && (
                        <>
                          {/* Coin Selector */}
                          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button
                              type="button"
                              onClick={() => setCryptoCoin('USDT')}
                              style={{
                                flex: 1,
                                padding: '8px',
                                background: cryptoCoin === 'USDT' ? 'rgba(38, 166, 154, 0.15)' : '#0f121d',
                                border: cryptoCoin === 'USDT' ? '1px solid #26a69a' : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: cryptoCoin === 'USDT' ? '#26a69a' : '#a0aec0',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                              }}
                            >
                              USDT (TRC-20)
                            </button>
                            <button
                              type="button"
                              onClick={() => setCryptoCoin('TRX')}
                              style={{
                                flex: 1,
                                padding: '8px',
                                background: cryptoCoin === 'TRX' ? 'rgba(239, 83, 80, 0.15)' : '#0f121d',
                                border: cryptoCoin === 'TRX' ? '1px solid #ef5350' : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: cryptoCoin === 'TRX' ? '#ef5350' : '#a0aec0',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                              }}
                            >
                              TRON (TRX)
                            </button>
                          </div>

                          {/* Instructions */}
                          <div className="crypto-payment-instructions" style={{ marginTop: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px' }}>
                            <h5 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', color: '#9b59b6' }}>
                              {language === 'fa' ? 'دستورالعمل پرداخت رمزارز:' : 'Crypto Payment Instructions:'}
                            </h5>
                            
                            <div style={{ fontSize: '0.82rem', marginBottom: '8px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              <div>
                                {language === 'fa' ? 'مبلغ قابل پرداخت:' : 'Amount to Pay:'}{' '}
                                <strong style={{ color: '#61f9b1' }}>
                                  {cryptoCoin === 'USDT' 
                                    ? `${expectedAmount.toFixed(2)} USDT` 
                                    : `${language === 'fa' ? 'معادل ریالی/دلاری با نرخ زنده در تراکنش' : 'Live dynamic conversion equivalent of'} $${expectedAmount.toFixed(2)} USD`}
                                </strong>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '5px' }}>
                                <span>{language === 'fa' ? 'آدرس واریز:' : 'Deposit Address:'}</span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#0b0d19', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                  <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', wordBreak: 'break-all', color: '#fff', flex: 1, direction: 'ltr' }}>
                                    {cryptoCoin === 'USDT' ? cryptoDetails.usdtAddress : cryptoDetails.trxAddress}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(cryptoCoin === 'USDT' ? cryptoDetails.usdtAddress : cryptoDetails.trxAddress);
                                      notify.success(language === 'fa' ? 'آدرس کپی شد' : 'Address copied');
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#61f9b1',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      padding: '2px'
                                    }}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* TxHash Input */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                            <label style={{ fontSize: '0.8rem', color: '#a0aec0', fontWeight: '500' }}>
                              {language === 'fa' ? 'کد هش تراکنش / TXID (الزامی)' : 'Transaction Hash / TXID (Required)'}
                            </label>
                            <input
                              type="text"
                              value={cryptoTxHash}
                              onChange={(e) => setCryptoTxHash(e.target.value)}
                              placeholder="e.g. f83d726b..."
                              style={{
                                width: '100%',
                                padding: '10px',
                                background: '#0f121d',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontFamily: 'monospace',
                                fontSize: '0.8rem',
                                direction: 'ltr',
                                textAlign: 'center'
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="checkout-modal-footer">
                      {paymentMethod === 'manual' && (
                        <button
                          className="start-checkout-btn"
                          disabled={checkoutLoading || !receiptFile}
                          onClick={handleSubmitReceipt}
                        >
                          {checkoutLoading ? (language === 'fa' ? 'در حال ثبت اطلاعات...' : 'Submitting details...') : (language === 'fa' ? 'ثبت فیش پرداخت' : 'Submit Receipt')}
                        </button>
                      )}
                      {paymentMethod === 'crypto' && (
                        <button
                          className="start-checkout-btn"
                          disabled={checkoutLoading || !cryptoTxHash.trim()}
                          onClick={handleCryptoCheckout}
                          style={{
                            background: '#9b59b6',
                            color: '#ffffff'
                          }}
                        >
                          {checkoutLoading ? (language === 'fa' ? 'در حال تایید تراکنش...' : 'Verifying transaction...') : (language === 'fa' ? 'بررسی و فعال‌سازی اشتراک' : 'Verify & Activate Plan')}
                        </button>
                      )}
                      {(paymentMethod === 'payping' || paymentMethod === 'zarinpal') && (
                        <button
                          className="start-checkout-btn"
                          disabled={checkoutLoading}
                          onClick={handleOnlineCheckout}
                          style={{
                            background: paymentMethod === 'payping' ? '#2c7a7b' : '#b7791f',
                            color: '#ffffff'
                          }}
                        >
                          {checkoutLoading ? (language === 'fa' ? 'در حال انتقال به درگاه...' : 'Redirecting to gateway...') : (language === 'fa' ? `اتصال به درگاه ${paymentMethod === 'payping' ? 'پی‌پینگ' : 'زرین‌پال'}` : `Proceed to ${paymentMethod === 'payping' ? 'PayPing' : 'ZarinPal'}`)}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </section>
        )}

        {/* ═════ SECURITY TAB ═════ */}
        {activeTab === 'security' && (
          <section className="settings-section">
            {/* Change password */}
            <div className="security-card">
              <h3>{t('settings.changePassword')}</h3>
              <div className="password-fields">
                <div className="form-field">
                  <label>{t('settings.currentPassword')}</label>
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
                  <label>{t('settings.newPassword')}</label>
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
                  <label>{t('settings.confirmPassword')}</label>
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
                {t('settings.changePassword')}
              </button>
            </div>

            {/* Active sessions */}
            <div className="security-card">
              <div className="sessions-header">
                <h3>{t('settings.activeSessions')}</h3>
                {sessions.filter(s => !s.is_current).length > 0 && (
                  <button className="revoke-all-btn" onClick={handleRevokeAllSessions}>{t('settings.revokeAllSessions')}</button>
                )}
              </div>
              <div className="sessions-list">
                {sessions.map((s) => (
                  <div key={s.id} className="session-item">
                    <div className="session-info">
                      <span className="material-symbols-outlined session-icon">devices</span>
                      <div>
                        <span className="session-device">{s.user_agent}</span>
                        <span className="session-time">{language === 'fa' ? 'آخرین فعالیت' : 'Last activity'}: {new Date(s.last_used_at).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US')}</span>
                      </div>
                    </div>
                    {s.is_current ? (
                      <span className="current-session-badge">{t('settings.thisDevice')}</span>
                    ) : (
                      <button className="revoke-session-btn" onClick={() => handleRevokeSession(s.id)}>
                        {t('settings.revokeThisSession')}
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
                <h3>{t('settings.deleteUserAccount')}</h3>
              </div>
              <p>{t('settings.deleteAccountDesc')}</p>
              {showDeleteAccount ? (
                <div className="delete-confirm-form">
                  <p>{t('settings.deleteConfirmEmailText')}</p>
                  <input
                    type="text"
                    value={deleteConfirmEmail}
                    onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                    placeholder={profile?.email || t('settings.deleteConfirmEmailPlaceholder')}
                    style={{ direction: 'ltr', textAlign: language === 'fa' ? 'right' : 'left' }}
                  />
                  <div className="delete-actions">
                    <button className="danger-confirm-btn" onClick={handleDeleteUserAccount} disabled={deleteConfirmEmail !== profile?.email}>
                      {t('settings.deleteAccountBtn')}
                    </button>
                    <button className="settings-cancel-btn" onClick={() => { setShowDeleteAccount(false); setDeleteConfirmEmail(''); }}>{t('settings.cancel')}</button>
                  </div>
                </div>
              ) : (
                <button className="danger-outline-btn" onClick={() => setShowDeleteAccount(true)}>{t('settings.deleteUserAccount')}</button>
              )}
            </div>
          </section>
        )}
      </div>

      {/* API Token Reveal Modal */}
      {showTokenModal && (
        <div className="token-modal-overlay">
          <div className="token-modal">
            <h3>{language === 'fa' ? 'کلید اتصال جدید ایجاد شد' : 'New Connection Key Created'}</h3>
            <p>
              {language === 'fa'
                ? 'لطفاً این کلید اتصال را کپی کرده و در محل امنی ذخیره کنید. به دلایل امنیتی، این کلید دیگر نمایش داده نخواهد شد!'
                : 'Please copy this connection key and store it in a secure location. For security reasons, this key will not be displayed again!'}
            </p>
            <div className="token-reveal-box">
              <code>{showTokenModal.token}</code>
              <button 
                className="copy-token-btn" 
                onClick={() => {
                  navigator.clipboard.writeText(showTokenModal.token);
                  notify.success(language === 'fa' ? 'کلید اتصال کپی شد' : 'Connection key copied to clipboard');
                }}
                title={language === 'fa' ? 'کپی کلید' : 'Copy Key'}
              >
                <span className="material-symbols-outlined">content_copy</span>
              </button>
            </div>
            <div className="token-modal-actions">
              <button onClick={() => setShowTokenModal(null)}>{language === 'fa' ? 'بستن و فهمیدم' : 'Close and I understand'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}