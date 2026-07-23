'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/auth';
import { useTranslation } from '../../../store/useAppStore';
import { notify } from '../../../lib/notify';
import LoadingButton from '../../../components/ui/LoadingButton';
import { formatTimer } from '../../../utils/otp';
import '../auth.scss';

export default function LoginPage() {
  const { t, language, dir } = useTranslation();
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const sendOtp = useAuthStore((state) => state.sendOtp);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);

  // General State
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // OTP Login State
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [timer, setTimer] = useState(120);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset method to password in English
  useEffect(() => {
    if (language === 'en') {
      setLoginMethod('password');
    }
  }, [language]);

  // Manage timer countdown
  useEffect(() => {
    if (timerActive && timer > 0) {
      timerRef.current = setTimeout(() => {
        setTimer((t) => t - 1);
      }, 1000);
    } else if (timer === 0) {
      setTimerActive(false);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timer, timerActive]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      const msg = t('auth.requiredFields');
      setError(msg);
      notify.error(msg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      notify.success(t('auth.loginSuccess'));
      router.replace('/trades');
    } catch (err: any) {
      const msg = err.message || (language === 'fa' ? 'خطا در ورود به سیستم' : 'Error signing in');
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      const msg = language === 'fa' ? 'لطفاً شماره موبایل خود را وارد کنید' : 'Please enter your mobile number';
      setError(msg);
      notify.error(msg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await sendOtp(phone);
      notify.success(t('auth.otpSentSuccess'));
      setOtpStep(2);
      setTimer(120);
      setTimerActive(true);
    } catch (err: any) {
      const msg = err.message || (language === 'fa' ? 'خطا در ارسال کد تایید' : 'Error sending verification code');
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !code) {
      const msg = language === 'fa' ? 'لطفاً کد تایید را وارد کنید' : 'Please enter the verification code';
      setError(msg);
      notify.error(msg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await verifyOtp(phone, code);
      if (res.isNewUser) {
        notify.success(language === 'fa' ? 'شماره موبایل تایید شد. لطفاً ثبت نام خود را کامل کنید.' : 'Phone number verified. Please complete your registration.');
        router.replace(`/register?token=${res.registerToken}&phone=${phone}`);
      } else {
        notify.success(t('auth.loginSuccess'));
        router.replace('/trades');
      }
    } catch (err: any) {
      const msg = err.message || (language === 'fa' ? 'کد تایید نامعتبر یا منقضی شده است' : 'Invalid or expired verification code');
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timerActive) return;
    setError(null);
    setLoading(true);
    try {
      await sendOtp(phone);
      notify.success(t('auth.otpSentSuccess'));
      setTimer(120);
      setTimerActive(true);
      setCode('');
    } catch (err: any) {
      const msg = err.message || (language === 'fa' ? 'خطا در ارسال مجدد کد تایید' : 'Error resending verification code');
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" dir={dir}>
      <div className="auth-card">
        <Link href="/" className="auth-back-link">
          <span className="material-symbols-outlined">{language === 'fa' ? 'arrow_forward' : 'arrow_back'}</span>
          <span>{language === 'fa' ? 'بازگشت' : 'Back'}</span>
        </Link>
        <div className="auth-header">
          <div className="auth-logo">
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <h2>{t('auth.loginTitle')}</h2>
          <p>{language === 'fa' ? 'ژورنال تخصصی و هوشمند تحلیل معاملات' : 'Smart Trading Journal Dashboard'}</p>
        </div>

        {/* Tab Selector */}
        {language === 'fa' && (
          <div className="method-tabs">
            <button
              type="button"
              className={loginMethod === 'password' ? 'active' : ''}
              onClick={() => {
                setLoginMethod('password');
                setError(null);
              }}
            >
              {t('auth.loginMethodPassword')}
            </button>
            <button
              type="button"
              className={loginMethod === 'otp' ? 'active' : ''}
              onClick={() => {
                setLoginMethod('otp');
                setError(null);
              }}
            >
              {t('auth.loginMethodOtp')}
            </button>
          </div>
        )}

        {error && (
          <div className="error-alert" role="alert" aria-live="assertive">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Password Login Form */}
        {loginMethod === 'password' && (
          <form className="auth-form" onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="email">{t('auth.emailLabel')}</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">mail</span>
                <input
                  id="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('auth.passwordLabel')}</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">lock</span>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <LoadingButton type="submit" className="submit-btn" disabled={loading} isLoading={loading}>
              {t('auth.submitLogin')}
            </LoadingButton>
          </form>
        )}

        {/* OTP Login Form */}
        {loginMethod === 'otp' && (
          <div className="auth-form-container">
            {otpStep === 1 ? (
              <form className="auth-form" onSubmit={handleSendOtp}>
                <div className="form-group">
                  <label htmlFor="phone">{t('auth.phoneLabel')}</label>
                  <div className="input-wrapper">
                    <span className="material-symbols-outlined input-icon">phone_android</span>
                    <input
                      id="phone"
                      type="tel"
                      placeholder={t('auth.phonePlaceholder')}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                      style={{ direction: 'ltr', textAlign: language === 'fa' ? 'right' : 'left' }}
                    />
                  </div>
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      <span>{language === 'fa' ? 'در حال ارسال...' : 'Sending...'}</span>
                    </>
                  ) : (
                    <span>{t('auth.otpSendBtn')}</span>
                  )}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleVerifyOtp}>
                <div className="form-group">
                  <label htmlFor="code">
                    {language === 'fa' ? `کد تایید پیامک شده به ${phone}` : `Code sent to ${phone}`}
                  </label>
                  <div className="input-wrapper">
                    <span className="material-symbols-outlined input-icon">vpn_key</span>
                    <input
                      id="code"
                      type="text"
                      placeholder={t('auth.otpCodePlaceholder')}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      disabled={loading}
                      maxLength={6}
                      style={{ direction: 'ltr', textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' }}
                    />
                  </div>
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      <span>{language === 'fa' ? 'در حال تایید...' : 'Verifying...'}</span>
                    </>
                  ) : (
                    <span>{t('auth.submitLogin')}</span>
                  )}
                </button>

                <div className="otp-timer-text">
                  {timerActive ? (
                    <span>{t('auth.otpTimerText')}{formatTimer(timer)}</span>
                  ) : (
                    <button
                      type="button"
                      className="resend-otp-btn"
                      onClick={handleResendOtp}
                      disabled={loading}
                    >
                      {t('auth.otpResendBtn')}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="submit-btn"
                  style={{
                    marginTop: '10px',
                    background: 'none',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#94a3b8'
                  }}
                  onClick={() => {
                    setOtpStep(1);
                    setError(null);
                  }}
                  disabled={loading}
                >
                  {t('auth.changePhoneBtn')}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="auth-footer">
          <p>
            {t('auth.noAccount')} <Link href="/register">{t('auth.gotoRegister')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
