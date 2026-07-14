'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { useTranslation } from '../../store/useAppStore';
import { notify } from '../../lib/notify';
import { getSharedTranslations } from '../../locales/components';

interface ConnectExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const POPULAR_EXCHANGES = [
  'binance',
  'nobitex',
  'bingx',
  'kucoin',
  'bybit',
  'okx',
  'coinex',
  'kraken',
  'gateio',
  'mexc'
];

export default function ConnectExchangeModal({ isOpen, onClose, onSuccess }: ConnectExchangeModalProps) {
  const { t, language } = useTranslation();
  const isEn = language === 'en';

  const [exchanges, setExchanges] = useState<string[]>(POPULAR_EXCHANGES);
  const [selectedExchange, setSelectedExchange] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [passphrase, setPassphrase] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch full exchange list from backend on mount
  useEffect(() => {
    if (isOpen) {
      api.get('/api/crypto/exchanges')
        .then(res => {
          if (res.data && Array.isArray(res.data.exchanges)) {
            // Sort exchanges, putting popular ones first
            const allEx = res.data.exchanges as string[];
            const sorted = Array.from(new Set([...POPULAR_EXCHANGES.filter(x => allEx.includes(x)), ...allEx.sort()]));
            setExchanges(sorted);
          }
        })
        .catch(err => {
          console.error('Failed to fetch exchanges list:', err);
          // Fall back to default popular exchanges list if backend query fails or is blocked
        });
    }
  }, [isOpen]);

  // Click outside listener for the searchable dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setSelectedExchange('');
      setSearchQuery('');
      setAccountName('');
      setApiKey('');
      setApiSecret('');
      setPassphrase('');
      setErrorMsg('');
      setIsSubmitting(false);
      setShowDropdown(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredExchanges = exchanges.filter(ex =>
    ex.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedExchange) {
      setErrorMsg(isEn ? 'Please select an exchange.' : 'لطفاً یک صرافی انتخاب کنید.');
      return;
    }
    if (!apiKey) {
      setErrorMsg(isEn ? 'API Key is required.' : 'وارد کردن کلید API الزامی است.');
      return;
    }
    if (!apiSecret) {
      setErrorMsg(isEn ? 'API Secret is required.' : 'وارد کردن رمز API الزامی است.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await api.post('/api/crypto/connect', {
        exchangeId: selectedExchange,
        apiKey,
        apiSecret,
        passphrase: passphrase || undefined,
        accountName: accountName || undefined,
      });

      notify.success(isEn ? 'Exchange connected successfully!' : 'اتصال صرافی با موفقیت برقرار شد!');
      onSuccess();
      onClose();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message;
      setErrorMsg(isEn ? `Failed to connect: ${errMsg}` : `خطا در اتصال: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const p = {
    ...getSharedTranslations(isEn),
    title: isEn ? 'Connect Crypto Exchange API' : 'اتصال API صرافی کریپتو',
    desc: isEn 
      ? 'Connect your crypto exchange via Read-Only API keys to automatically synchronize your trade history.' 
      : 'صرافی خود را از طریق کلیدهای API (فقط خواندنی - Read-Only) متصل کنید تا معاملات شما به صورت خودکار همگام‌سازی شوند.',
    exchangeLabel: isEn ? 'Select Exchange' : 'انتخاب صرافی',
    searchPlaceholder: isEn ? 'Search exchanges (e.g. Binance, Nobitex...)' : 'جستجوی صرافی (مثلاً بایننس، نوبیتکس...)',
    accountNameLabel: isEn ? 'Account Nickname (Optional)' : 'نام مستعار حساب (اختیاری)',
    accountNamePlaceholder: isEn ? 'e.g. Binance Spot' : 'مثلاً بایننس اسپات',
    apiKeyLabel: isEn ? 'API Key' : 'کلید API (API Key)',
    apiSecretLabel: isEn ? 'API Secret' : 'رمز API (API Secret)',
    passphraseLabel: isEn ? 'Passphrase (Optional)' : 'عبارت عبور - Passphrase (اختیاری)',
    passphraseHelp: isEn ? 'Required for some exchanges (e.g. KuCoin, OKX, BingX)' : 'برای برخی صرافی‌ها الزامی است (مانند کوکوین، اوکی‌اکس، بینگ‌اکس)',
    connect: isEn ? 'Connect & Sync' : 'اتصال و همگام‌سازی',
    connecting: isEn ? 'Connecting...' : 'در حال اتصال...',
  };

  return (
    <div className="lightbox-overlay" style={{ display: 'flex' }} onClick={onClose}>
      <div className="manual-trade-modal connect-exchange-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3>{p.title}</h3>
          <button type="button" className="close-btn" onClick={onClose} disabled={isSubmitting}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 8px 0' }}>
            {p.desc}
          </p>

          {errorMsg && (
            <div className="form-error-alert" style={{ margin: '0 0 8px 0' }} role="alert" aria-live="assertive">
              {errorMsg}
            </div>
          )}

          <div className="form-columns">
            <div className="form-column">
              {/* Searchable Exchange Dropdown */}
              <div className="form-group" style={{ position: 'relative' }} ref={dropdownRef}>
              <label className="form-label">{p.exchangeLabel}</label>
              
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder={p.searchPlaceholder}
                  value={selectedExchange ? `${selectedExchange.charAt(0).toUpperCase()}${selectedExchange.slice(1)}` : searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (selectedExchange) {
                      setSelectedExchange('');
                    }
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  disabled={isSubmitting}
                  style={{ paddingRight: '36px' }}
                />
                <span 
                  className="material-symbols-outlined" 
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#64748b',
                    fontSize: '1.2rem',
                    pointerEvents: 'none'
                  }}
                >
                  search
                </span>
              </div>

              {showDropdown && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                  }}
                >
                  {filteredExchanges.length > 0 ? (
                    filteredExchanges.map((ex) => (
                      <div
                        key={ex}
                        onClick={() => {
                          setSelectedExchange(ex);
                          setSearchQuery('');
                          setShowDropdown(false);
                          setErrorMsg('');
                        }}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          color: '#e2e8f0',
                          fontSize: '0.9rem',
                          backgroundColor: selectedExchange === ex ? '#334155' : 'transparent',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedExchange === ex ? '#334155' : 'transparent'}
                      >
                        {ex.charAt(0).toUpperCase() + ex.slice(1)}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '10px 12px', color: '#64748b', fontSize: '0.9rem' }}>
                      {isEn ? 'No exchanges found' : 'صرافی یافت نشد'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Account Nickname */}
            <div className="form-group">
              <label className="form-label">{p.accountNameLabel}</label>
              <input
                type="text"
                className="form-input"
                placeholder={p.accountNamePlaceholder}
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* API Key */}
            <div className="form-group">
              <label className="form-label">{p.apiKeyLabel}</label>
              <input
                type="password"
                className="form-input"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setErrorMsg('');
                }}
                disabled={isSubmitting}
              />
            </div>

            {/* API Secret */}
            <div className="form-group">
              <label className="form-label">{p.apiSecretLabel}</label>
              <input
                type="password"
                className="form-input"
                value={apiSecret}
                onChange={(e) => {
                  setApiSecret(e.target.value);
                  setErrorMsg('');
                }}
                disabled={isSubmitting}
              />
            </div>

            {/* Passphrase (Optional) */}
            <div className="form-group">
              <label className="form-label">{p.passphraseLabel}</label>
              <input
                type="password"
                className="form-input"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                disabled={isSubmitting}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                {p.passphraseHelp}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {p.cancel}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !selectedExchange || !apiKey || !apiSecret}
            >
              {isSubmitting ? p.connecting : p.connect}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
