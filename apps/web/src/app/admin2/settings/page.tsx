'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toPersianDigits } from '@/utils/farsi';
import { notify } from '@/lib/notify';
import LoadingButton from '@/components/ui/LoadingButton';

type SettingsTab = 'pricing' | 'contact' | 'crypto' | 'banner' | 'diagnosis';

export default function Admin2SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('pricing');
  const [loading, setLoading] = useState(false);

  // States
  const [pricesConfig, setPricesConfig] = useState({
    STANDARD: { monthly: 249000, annual: 2390000 },
    PRO: { monthly: 499000, annual: 4790000 },
  });
  const [exchangeRate, setExchangeRate] = useState<number | string>('');
  
  const [contactConfig, setContactConfig] = useState({
    email: '',
    mobile: '',
    landline: '',
    address: '',
  });
  const [cardConfig, setCardConfig] = useState({
    cardNumber: '',
    bankName: '',
    ownerName: '',
  });

  const [cryptoConfig, setCryptoConfig] = useState({
    usdtAddress: '',
    trxAddress: '',
    standard: { monthlyUsd: 5.0, annualUsd: 45.0 },
    pro: { monthlyUsd: 10.0, annualUsd: 90.0 }
  });
  const [updatingCrypto, setUpdatingCrypto] = useState(false);

  const [bannerConfig, setBannerConfig] = useState({
    isActive: false,
    textFa: '',
    textEn: '',
    link: ''
  });

  const [diagnosisLogs, setDiagnosisLogs] = useState<any[]>([]);
  const [diagnosisSources, setDiagnosisSources] = useState<string[]>([]);
  const [diagnosisStats, setDiagnosisStats] = useState({ errors24h: 0, errors7d: 0, total: 0 });
  const [diagnosisLevelFilter, setDiagnosisLevelFilter] = useState('ALL');
  const [diagnosisSourceFilter, setDiagnosisSourceFilter] = useState('ALL');
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [diagnosisDays, setDiagnosisDays] = useState('30');
  const [diagnosisAutoRefresh, setDiagnosisAutoRefresh] = useState(false);

  // Fetches
  const fetchPricesSetting = useCallback(async () => {
    try {
      const res = await api.get('/api/payments/prices');
      if (res.data) setPricesConfig(res.data);
    } catch (err) {
      console.error('Failed to fetch prices config:', err);
    }
  }, []);

  const fetchExchangeRateSetting = useCallback(async () => {
    try {
      const res = await api.get('/api/settings/exchange-rate');
      if (res.data && res.data.rate) {
        setExchangeRate(res.data.rate);
      } else {
        setExchangeRate('');
      }
    } catch (err) {
      console.error('Failed to fetch exchange rate config:', err);
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

  const fetchCardSetting = useCallback(async () => {
    try {
      const res = await api.get('/api/settings/card-details');
      if (res.data) {
        setCardConfig({
          cardNumber: res.data.cardNumber || '',
          bankName: res.data.bankName || '',
          ownerName: res.data.ownerName || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch card config:', err);
    }
  }, []);

  const fetchCryptoSetting = useCallback(async () => {
    try {
      const res = await api.get('/api/settings/crypto-details');
      if (res.data) setCryptoConfig(res.data);
    } catch (err) {
      console.error('Failed to fetch crypto config:', err);
    }
  }, []);

  const fetchBannerSetting = useCallback(async () => {
    try {
      const res = await api.get('/api/settings/announcement-banner');
      if (res.data) setBannerConfig(res.data);
    } catch (err) {
      console.error('Failed to fetch banner config:', err);
    }
  }, []);

  const fetchDiagnosisLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (diagnosisLevelFilter !== 'ALL') params.append('level', diagnosisLevelFilter);
      if (diagnosisSourceFilter !== 'ALL') params.append('source', diagnosisSourceFilter);
      if (diagnosisDays) params.append('days', diagnosisDays);
      if (diagnosisSearch) params.append('search', diagnosisSearch);

      const res = await api.get(`/api/admin/diagnosis/logs?${params.toString()}`);
      setDiagnosisLogs(res.data.logs || []);
      setDiagnosisSources(res.data.sources || []);
    } catch (err) {
      console.error('Failed to fetch diagnosis logs:', err);
    }
  }, [diagnosisLevelFilter, diagnosisSourceFilter, diagnosisDays, diagnosisSearch]);

  const fetchDiagnosisStats = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/diagnosis/stats');
      setDiagnosisStats(res.data);
    } catch (err) {
      console.error('Failed to fetch diagnosis stats:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'pricing') {
      fetchPricesSetting();
      fetchExchangeRateSetting();
    }
    if (activeTab === 'contact') {
      fetchContactSetting();
      fetchCardSetting();
    }
    if (activeTab === 'crypto') fetchCryptoSetting();
    if (activeTab === 'banner') fetchBannerSetting();
    if (activeTab === 'diagnosis') {
      fetchDiagnosisLogs();
      fetchDiagnosisStats();
    }
  }, [activeTab, fetchPricesSetting, fetchExchangeRateSetting, fetchContactSetting, fetchCardSetting, fetchCryptoSetting, fetchBannerSetting, fetchDiagnosisLogs, fetchDiagnosisStats]);

  // Auto-refresh for diagnosis
  useEffect(() => {
    if (!diagnosisAutoRefresh || activeTab !== 'diagnosis') return;
    const interval = setInterval(() => {
      fetchDiagnosisLogs();
      fetchDiagnosisStats();
    }, 10000);
    return () => clearInterval(interval);
  }, [diagnosisAutoRefresh, activeTab, fetchDiagnosisLogs, fetchDiagnosisStats]);

  // Handlers
  const handleUpdatePrices = async () => {
    try {
      await api.put('/api/admin/settings/prices', { prices: pricesConfig });
      notify.success('تنظیمات قیمت‌گذاری با موفقیت بروز شد');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در ذخیره‌سازی قیمت‌ها');
    }
  };

  const handleUpdateExchangeRate = async () => {
    try {
      const res = await api.put('/api/admin/settings/exchange-rate', { rate: exchangeRate });
      if (res.data && res.data.rate === null) {
        setExchangeRate('');
        notify.success('تنظیمات نرخ دلار حذف شد. نرخ زنده اعمال می‌شود.');
      } else {
        notify.success('نرخ دلار به تومان با موفقیت بروزرسانی شد');
      }
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در ذخیره‌سازی نرخ دلار');
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

  const handleUpdateCardDetails = async () => {
    try {
      await api.put('/api/admin/settings/card-details', cardConfig);
      notify.success('مشخصات کارت بانکی با موفقیت بروزرسانی شد');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در ذخیره‌سازی اطلاعات کارت بانکی');
    }
  };

  const handleUpdateCryptoDetails = async () => {
    setUpdatingCrypto(true);
    try {
      await api.put('/api/admin/settings/crypto-details', cryptoConfig);
      notify.success('تنظیمات پرداخت رمزارز با موفقیت بروزرسانی شد');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در ذخیره‌سازی تنظیمات رمزارز');
    } finally {
      setUpdatingCrypto(false);
    }
  };

  const handleUpdateBanner = async () => {
    setLoading(true);
    try {
      await api.put('/api/admin/settings/announcement-banner', bannerConfig);
      notify.success('تنظیمات بنر اطلاع‌رسانی با موفقیت بروزرسانی شد');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در ذخیره‌سازی تنظیمات بنر');
    } finally {
      setLoading(false);
    }
  };

  const handleClearDiagnosisLogs = async () => {
    const ok = await notify.confirm({
      title: 'پاک کردن لاگ‌ها',
      message: `آیا می‌خواهید لاگ‌های بیشتر از ${diagnosisDays} روز پیش را پاک کنید؟`,
    });
    if (!ok) return;

    try {
      const res = await api.delete(`/api/admin/diagnosis/logs?days=${diagnosisDays}`);
      notify.success(`${res.data.deleted} لاگ پاک شد`);
      fetchDiagnosisLogs();
      fetchDiagnosisStats();
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در پاک کردن لاگ‌ها');
    }
  };

  return (
    <div>
      <div className="admin-tabs" style={{ marginBottom: '24px' }}>
        <button className={`admin-tab-btn ${activeTab === 'pricing' ? 'active' : ''}`} onClick={() => setActiveTab('pricing')}>
          <span className="material-symbols-outlined">request_quote</span>
          <span>قیمت‌گذاری</span>
        </button>
        <button className={`admin-tab-btn ${activeTab === 'crypto' ? 'active' : ''}`} onClick={() => setActiveTab('crypto')}>
          <span className="material-symbols-outlined">currency_bitcoin</span>
          <span>رمزارز</span>
        </button>
        <button className={`admin-tab-btn ${activeTab === 'contact' ? 'active' : ''}`} onClick={() => setActiveTab('contact')}>
          <span className="material-symbols-outlined">contact_support</span>
          <span>اطلاعات تماس</span>
        </button>
        <button className={`admin-tab-btn ${activeTab === 'banner' ? 'active' : ''}`} onClick={() => setActiveTab('banner')}>
          <span className="material-symbols-outlined">campaign</span>
          <span>بنر سایت</span>
        </button>
        <button className={`admin-tab-btn ${activeTab === 'diagnosis' ? 'active' : ''}`} onClick={() => setActiveTab('diagnosis')}>
          <span className="material-symbols-outlined">troubleshoot</span>
          <span>عیب‌یابی</span>
        </button>
      </div>

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
              <h4 style={{ color: '#10b981', marginBottom: '12px' }}>پلن حرفه‌ای (PRO)</h4>
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

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ color: '#ffb300', marginBottom: '12px' }}>نرخ دستی دلار به تومان (تعیین پشتیبان در صورت عدم بروزرسانی خودکار)</h4>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>نرخ معادل ۱ دلار (تومان)</label>
                  <input
                    type="number"
                    placeholder="مثال: 90000"
                    style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', color: '#fff', borderRadius: '6px' }}
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                  />
                </div>
                <button className="admin-btn" style={{ margin: 0, height: '42px' }} onClick={handleUpdateExchangeRate}>
                  ذخیره نرخ دلار
                </button>
              </div>
              <p style={{ color: '#a0aec0', fontSize: '0.8rem', marginTop: '8px' }}>
                در صورت ذخیره‌سازی، این نرخ جایگزین دریافت قیمت زنده خواهد شد. برای بازگشت به قیمت زنده، نرخ را خالی یا ۰ گذاشته و دکمه را بزنید.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'crypto' && (
        <div className="admin-panel-card">
          <div className="card-header-actions">
            <h3>تنظیمات کیف پول رمزارز</h3>
          </div>
          <p style={{ color: '#a0aec0', fontSize: '0.85rem', marginBottom: '20px' }}>
            مشخصات آدرس‌های واریز تتر (USDT-TRC20) و ترون (TRX) و همچنین مبالغ دلاری مربوط به هر پلن اشتراکی را در این بخش مدیریت کنید.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleUpdateCryptoDetails(); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.88rem', color: '#e2e2eb', fontWeight: 'bold' }}>آدرس واریز تتر USDT (TRC-20)</label>
              <input
                type="text"
                placeholder="مثال: TYxxxxxx..."
                style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', direction: 'ltr' }}
                value={cryptoConfig.usdtAddress}
                onChange={(e) => setCryptoConfig({ ...cryptoConfig, usdtAddress: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.88rem', color: '#e2e2eb', fontWeight: 'bold' }}>آدرس واریز ترون TRX</label>
              <input
                type="text"
                placeholder="مثال: TYxxxxxx..."
                style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', direction: 'ltr' }}
                value={cryptoConfig.trxAddress}
                onChange={(e) => setCryptoConfig({ ...cryptoConfig, trxAddress: e.target.value })}
              />
            </div>

            <div style={{ marginTop: '10px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ fontSize: '1rem', color: '#10b981', marginBottom: '12px' }}>مبالغ دلاری پلن استاندارد (STANDARD)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#a0aec0' }}>هزینه ماهانه (USDT / USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', direction: 'ltr' }}
                    value={cryptoConfig.standard.monthlyUsd}
                    onChange={(e) => setCryptoConfig({
                      ...cryptoConfig,
                      standard: { ...cryptoConfig.standard, monthlyUsd: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#a0aec0' }}>هزینه سالانه (USDT / USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', direction: 'ltr' }}
                    value={cryptoConfig.standard.annualUsd}
                    onChange={(e) => setCryptoConfig({
                      ...cryptoConfig,
                      standard: { ...cryptoConfig.standard, annualUsd: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '10px', paddingTop: '10px' }}>
              <h4 style={{ fontSize: '1rem', color: '#10b981', marginBottom: '12px' }}>مبالغ دلاری پلن حرفه‌ای (PRO)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#a0aec0' }}>هزینه ماهانه (USDT / USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', direction: 'ltr' }}
                    value={cryptoConfig.pro.monthlyUsd}
                    onChange={(e) => setCryptoConfig({
                      ...cryptoConfig,
                      pro: { ...cryptoConfig.pro, monthlyUsd: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#a0aec0' }}>هزینه سالانه (USDT / USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', direction: 'ltr' }}
                    value={cryptoConfig.pro.annualUsd}
                    onChange={(e) => setCryptoConfig({
                      ...cryptoConfig,
                      pro: { ...cryptoConfig.pro, annualUsd: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '15px' }}>
              <LoadingButton type="submit" className="admin-btn" disabled={updatingCrypto} isLoading={updatingCrypto}>
                ذخیره تنظیمات کیف پول رمزارز
              </LoadingButton>
            </div>
          </form>
        </div>
      )}

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

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#10b981', marginBottom: '12px' }}>مشخصات کارت بانکی (کارت به کارت)</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.88rem', color: '#e2e2eb', fontWeight: 'bold' }}>شماره کارت</label>
              <input
                type="text"
                placeholder="مثال: 6037-9975-9444-4128"
                style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', direction: 'ltr' }}
                value={cardConfig.cardNumber}
                onChange={(e) => setCardConfig({ ...cardConfig, cardNumber: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.88rem', color: '#e2e2eb', fontWeight: 'bold' }}>نام بانک</label>
              <input
                type="text"
                placeholder="مثال: ملی ایران"
                style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
                value={cardConfig.bankName}
                onChange={(e) => setCardConfig({ ...cardConfig, bankName: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.88rem', color: '#e2e2eb', fontWeight: 'bold' }}>صاحب کارت</label>
              <input
                type="text"
                placeholder="مثال: جواد شیخ اعظمی"
                style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
                value={cardConfig.ownerName}
                onChange={(e) => setCardConfig({ ...cardConfig, ownerName: e.target.value })}
              />
            </div>

            <div style={{ marginTop: '10px' }}>
              <button className="admin-btn" onClick={handleUpdateCardDetails}>ذخیره تغییرات کارت بانکی</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'banner' && (
        <div className="admin-panel-card">
          <div className="card-header-actions">
            <h3>بنر اطلاع‌رسانی سراسری (لندینگ)</h3>
            <LoadingButton className="admin-btn" onClick={handleUpdateBanner} isLoading={loading}>
              ذخیره تنظیمات
            </LoadingButton>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e2eb', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={bannerConfig.isActive}
                onChange={(e) => setBannerConfig({ ...bannerConfig, isActive: e.target.checked })}
              />
              فعال‌سازی بنر اطلاع‌رسانی
            </label>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>متن فارسی (نمایش در نسخه فارسی سایت)</label>
              <input
                type="text"
                value={bannerConfig.textFa}
                onChange={(e) => setBannerConfig({ ...bannerConfig, textFa: e.target.value })}
                placeholder="مثال: کد تخفیف ویژه: BETA50"
                style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', color: '#fff', borderRadius: '6px' }}
                dir="rtl"
              />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>متن انگلیسی (نمایش در نسخه انگلیسی سایت)</label>
              <input
                type="text"
                value={bannerConfig.textEn}
                onChange={(e) => setBannerConfig({ ...bannerConfig, textEn: e.target.value })}
                placeholder="e.g. Special Discount Code: BETA50"
                style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', color: '#fff', borderRadius: '6px' }}
                dir="ltr"
              />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>لینک (اختیاری - در صورت کلیک روی بنر)</label>
              <input
                type="text"
                value={bannerConfig.link}
                onChange={(e) => setBannerConfig({ ...bannerConfig, link: e.target.value })}
                placeholder="https://example.com/pricing یا /pricing"
                style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', color: '#fff', borderRadius: '6px' }}
                dir="ltr"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'diagnosis' && (
        <div className="admin-panel-card">
          <div className="card-header-actions">
            <h3>عیب‌یابی و لاگ سیستم</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', color: '#a0aec0' }}>
                <input
                  type="checkbox"
                  checked={diagnosisAutoRefresh}
                  onChange={(e) => setDiagnosisAutoRefresh(e.target.checked)}
                />
                بروزرسانی خودکار (۱۰ ثانیه)
              </label>
              <button className="admin-btn btn-secondary" onClick={fetchDiagnosisLogs}>بروزرسانی</button>
              <button className="admin-btn btn-danger" onClick={handleClearDiagnosisLogs}>پاک کردن لاگ‌های قدیمی</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div className="stat-card" style={{ flex: 1, padding: '16px' }}>
              <div className="stat-info">
                <span className="stat-label">خطا (۲۴ ساعت اخیر)</span>
                <span className="stat-value" style={{ color: diagnosisStats.errors24h > 0 ? '#f56565' : '#10b981' }}>
                  {toPersianDigits(diagnosisStats.errors24h)}
                </span>
              </div>
            </div>
            <div className="stat-card" style={{ flex: 1, padding: '16px' }}>
              <div className="stat-info">
                <span className="stat-label">خطا (۷ روز اخیر)</span>
                <span className="stat-value" style={{ color: diagnosisStats.errors7d > 0 ? '#f56565' : '#10b981' }}>
                  {toPersianDigits(diagnosisStats.errors7d)}
                </span>
              </div>
            </div>
            <div className="stat-card" style={{ flex: 1, padding: '16px' }}>
              <div className="stat-info">
                <span className="stat-label">کل خطاها</span>
                <span className="stat-value" style={{ color: diagnosisStats.total > 0 ? '#f56565' : '#10b981' }}>
                  {toPersianDigits(diagnosisStats.total)}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <select
              value={diagnosisLevelFilter}
              onChange={(e) => setDiagnosisLevelFilter(e.target.value)}
              style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', color: '#fff', borderRadius: '6px', fontSize: '0.85rem' }}
            >
              <option value="ALL">همه سطوح</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
              <option value="FATAL">FATAL</option>
            </select>
            <select
              value={diagnosisSourceFilter}
              onChange={(e) => setDiagnosisSourceFilter(e.target.value)}
              style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', color: '#fff', borderRadius: '6px', fontSize: '0.85rem' }}
            >
              <option value="ALL">همه منابع</option>
              {diagnosisSources.map((src) => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
            <select
              value={diagnosisDays}
              onChange={(e) => setDiagnosisDays(e.target.value)}
              style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', color: '#fff', borderRadius: '6px', fontSize: '0.85rem' }}
            >
              <option value="1">۱ روز اخیر</option>
              <option value="7">۷ روز اخیر</option>
              <option value="30">۳۰ روز اخیر</option>
              <option value="90">۹۰ روز اخیر</option>
            </select>
            <input
              type="text"
              placeholder="جستجو در پیام..."
              value={diagnosisSearch}
              onChange={(e) => setDiagnosisSearch(e.target.value)}
              style={{ background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', color: '#fff', borderRadius: '6px', fontSize: '0.85rem', minWidth: '200px', direction: 'rtl' }}
            />
          </div>

          {diagnosisLogs.length === 0 ? (
            <p style={{ color: '#a0aec0', textAlign: 'center', padding: '40px 0' }}>هیچ لاگی یافت نشد</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}>
                    <th style={{ padding: '12px 8px', color: '#a0aec0', fontWeight: 500 }}>زمان</th>
                    <th style={{ padding: '12px 8px', color: '#a0aec0', fontWeight: 500 }}>سطح</th>
                    <th style={{ padding: '12px 8px', color: '#a0aec0', fontWeight: 500 }}>منبع</th>
                    <th style={{ padding: '12px 8px', color: '#a0aec0', fontWeight: 500 }}>پیام</th>
                    <th style={{ padding: '12px 8px', color: '#a0aec0', fontWeight: 500 }}>جزئیات</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnosisLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 8px', color: '#a0aec0', whiteSpace: 'nowrap', direction: 'ltr', textAlign: 'right' }}>
                        {new Date(log.created_at).toLocaleString('fa-IR')}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: log.level === 'ERROR' ? 'rgba(245,101,101,0.15)' : log.level === 'FATAL' ? 'rgba(229,62,62,0.2)' : log.level === 'WARN' ? 'rgba(236,201,75,0.15)' : 'rgba(16,185,129,0.1)',
                          color: log.level === 'ERROR' ? '#f56565' : log.level === 'FATAL' ? '#e53e3e' : log.level === 'WARN' ? '#ecc94b' : '#10b981',
                        }}>
                          {log.level}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', color: '#e2e2eb', fontWeight: 500 }}>{log.source}</td>
                      <td style={{ padding: '10px 8px', color: '#e2e2eb', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message}</td>
                      <td style={{ padding: '10px 8px', color: '#a0aec0', fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
