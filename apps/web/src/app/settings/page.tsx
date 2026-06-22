'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../lib/auth';
import { api } from '../../lib/api';
import './settings.scss';

interface Account {
  id: string;
  broker_name: string;
  account_number: string | null;
}

interface AccountToken {
  id: string;
  name: string;
  created_at: string;
  token_preview: string;
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'tokens'>('tokens');
  
  // Accounts state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  
  // Tokens state
  const [tokens, setTokens] = useState<AccountToken[]>([]);
  const [newTokenName, setNewTokenName] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Loading & error states
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      setLoadingAccounts(true);
      setError(null);
      try {
        const res = await api.get('/api/trades/accounts');
        setAccounts(res.data);
        if (res.data.length > 0) {
          setSelectedAccountId(res.data[0].id);
        }
      } catch (err: any) {
        console.error('Failed to fetch accounts:', err);
        setError('خطا در دریافت لیست حساب‌های معاملاتی');
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, []);

  // Fetch tokens for selected account
  const fetchTokens = useCallback(async (accountId: string) => {
    if (!accountId) return;
    setLoadingTokens(true);
    setError(null);
    try {
      const res = await api.get(`/api/accounts/${accountId}/tokens`);
      setTokens(res.data);
    } catch (err: any) {
      console.error('Failed to fetch tokens:', err);
      setError('خطا در دریافت توکن‌های این حساب');
    } finally {
      setLoadingTokens(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      fetchTokens(selectedAccountId);
      setGeneratedToken(null); // Clear any previously generated token
    }
  }, [selectedAccountId, fetchTokens]);

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) return;
    
    setActionLoading(true);
    setError(null);
    setGeneratedToken(null);
    setCopied(false);

    try {
      const res = await api.post(`/api/accounts/${selectedAccountId}/tokens`, {
        name: newTokenName.trim() || undefined
      });
      setGeneratedToken(res.data.token);
      setNewTokenName('');
      // Refresh the token list
      await fetchTokens(selectedAccountId);
    } catch (err: any) {
      console.error('Failed to generate token:', err);
      setError(err.response?.data?.error || 'خطا در ایجاد توکن جدید');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    if (!selectedAccountId || !window.confirm('آیا از حذف این توکن اطمینان دارید؟ برنامه‌هایی که از این توکن استفاده می‌کنند دیگر کار نخواهند کرد.')) {
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await api.delete(`/api/accounts/${selectedAccountId}/tokens/${tokenId}`);
      // Refresh token list
      await fetchTokens(selectedAccountId);
    } catch (err: any) {
      console.error('Failed to delete token:', err);
      setError(err.response?.data?.error || 'خطا در حذف توکن دسترسی');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedToken) return;
    navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>تنظیمات سیستم</h1>
        <p>تنظیمات حساب کاربری و مدیریت توکن‌های اتصال به متاتریدر</p>
      </div>

      <div className="settings-layout">
        <aside className="settings-tabs">
          <button
            className={`tab-btn ${activeTab === 'tokens' ? 'active' : ''}`}
            onClick={() => setActiveTab('tokens')}
          >
            <span className="material-symbols-outlined icon">key</span>
            <span>توکن‌های اتصال (API)</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="material-symbols-outlined icon">person</span>
            <span>اطلاعات پروفایل</span>
          </button>
        </aside>

        <main className="settings-content">
          {error && (
            <div className="error-alert" style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem'
            }}>
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'profile' && user && (
            <section className="profile-section">
              <h3>مشخصات کاربر</h3>
              <div className="info-grid">
                <div className="info-field">
                  <label>نام و نام خانوادگی</label>
                  <div className="value">{user.name}</div>
                </div>
                <div className="info-field">
                  <label>آدرس ایمیل</label>
                  <div className="value" style={{ direction: 'ltr', textAlign: 'right' }}>{user.email}</div>
                </div>
                <div className="info-field">
                  <label>نوع اشتراک</label>
                  <div className="value">{user.plan === 'FREE' ? 'رایگان' : 'حرفه‌ای'}</div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'tokens' && (
            <section className="tokens-section">
              <h3>مدیریت توکن‌های اتصال</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                برای اتصال اندیکاتور یا اکسپرت متاتریدر ۵ به ژورنال معامله‌یار، باید برای هر حساب معاملاتی یک توکن اتصال مجزا بسازید و آن را در بخش تنظیمات اکسپرت قرار دهید.
              </p>

              {loadingAccounts ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>در حال دریافت لیست حساب‌های معاملاتی...</div>
              ) : accounts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  هیچ حساب معاملاتی یافت نشد. برای ساخت حساب معاملاتی جدید ابتدا یک معامله دستی یا آنلاین ثبت کنید.
                </div>
              ) : (
                <>
                  <div className="accounts-selector">
                    <label htmlFor="account-select">انتخاب حساب معاملاتی:</label>
                    <select
                      id="account-select"
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.broker_name} {acc.account_number ? `(${acc.account_number})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="generate-token-box">
                    <h4>ایجاد توکن اتصال جدید</h4>
                    <form className="generate-form" onSubmit={handleGenerateToken}>
                      <input
                        type="text"
                        placeholder="نام توکن (مانند: اکسپرت خانه یا لپ‌تاپ)"
                        value={newTokenName}
                        onChange={(e) => setNewTokenName(e.target.value)}
                        disabled={actionLoading}
                      />
                      <button type="submit" disabled={actionLoading}>
                        {actionLoading ? 'در حال ایجاد...' : 'ساخت توکن جدید'}
                      </button>
                    </form>
                  </div>

                  {generatedToken && (
                    <div className="new-token-alert">
                      <div className="alert-header">
                        <span className="material-symbols-outlined">check_circle</span>
                        <span>توکن با موفقیت ایجاد شد!</span>
                      </div>
                      <div className="alert-warning">
                        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>warning</span>
                        <span>توجه: این توکن فقط یک‌بار نمایش داده می‌شود. لطفاً آن را کپی کرده و در محلی امن ذخیره کنید.</span>
                      </div>
                      <div className="token-display">
                        <button className="copy-btn" onClick={copyToClipboard}>
                          {copied ? 'کپی شد!' : 'کپی توکن'}
                        </button>
                        <span>{generatedToken}</span>
                      </div>
                    </div>
                  )}

                  <div className="tokens-list-box">
                    <h4>توکن‌های فعال برای این حساب</h4>
                    {loadingTokens ? (
                      <div style={{ textRendering: 'optimizeSpeed', color: '#94a3b8', fontSize: '0.85rem' }}>در حال بارگذاری توکن‌ها...</div>
                    ) : tokens.length === 0 ? (
                      <div className="empty-tokens">هیچ توکن فعالی برای این حساب معاملاتی ثبت نشده است.</div>
                    ) : (
                      tokens.map((token) => (
                        <div className="token-item" key={token.id}>
                          <div className="token-info">
                            <span className="token-name">{token.name}</span>
                            <div className="token-meta">
                              <span>تاریخ ایجاد: {new Date(token.created_at).toLocaleDateString('fa-IR')}</span>
                              <span>پیش‌نمایش: <span className="code">{token.token_preview}</span></span>
                            </div>
                          </div>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteToken(token.id)}
                            disabled={actionLoading}
                            title="حذف توکن"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
