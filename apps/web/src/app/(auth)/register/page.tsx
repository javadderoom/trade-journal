'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../lib/auth';
import { useTranslation } from '../../../store/useAppStore';
import { notify } from '../../../lib/notify';
import '../auth.scss';

function RegisterForm() {
  const { t, language, dir } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const sendOtp = useAuthStore((state) => state.sendOtp);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const registerOtp = useAuthStore((state) => state.registerOtp);
  const registerDirect = useAuthStore((state) => state.register);

  const initialToken = searchParams.get('token');
  const initialPhone = searchParams.get('phone');

  // Wizard Steps:
  // 1: Phone input (or bypass)
  // 2: Verification code input
  // 3: Name, email, password completion
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [registerToken, setRegisterToken] = useState<string | null>(null);

  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer states
  const [timer, setTimer] = useState(120);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Automatically forward to step 3 if token & phone exist in URL
  useEffect(() => {
    if (initialToken && initialPhone) {
      setPhone(initialPhone);
      setRegisterToken(initialToken);
      setStep(3);
    }
  }, [initialToken, initialPhone]);

  // Enforce step 3 (email direct registration) in English
  useEffect(() => {
    if (language === 'en') {
      setStep(3);
    }
  }, [language]);

  // Timer management
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
      setStep(2);
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
        notify.success(language === 'fa' ? 'شماره موبایل تایید شد. لطفاً ثبت نام خود را کامل کنید.' : 'Phone number verified. Please complete registration.');
        setRegisterToken(res.registerToken || null);
        setStep(3);
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

  const handleCompleteRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      const msg = t('auth.requiredFields');
      setError(msg);
      notify.error(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = t('auth.passwordMismatch');
      setError(msg);
      notify.error(msg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (registerToken) {
        // Registered via Verified OTP
        await registerOtp(registerToken, name, email, password);
      } else {
        // Direct email signup (optional phone)
        await registerDirect(name, email, phone || '', password);
      }
      notify.success(t('auth.registerSuccess'));
      router.replace('/trades');
    } catch (err: any) {
      const msg = err.message || (language === 'fa' ? 'خطا در تکمیل ثبت نام' : 'Error completing registration');
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
            <span className="material-symbols-outlined">person_add</span>
          </div>
          <h2>{t('auth.registerTitle')}</h2>
          <p>
            {step < 3 
              ? t('auth.otpVerifyTitle')
              : (language === 'fa' ? 'مشخصات خود را برای تکمیل عضویت وارد کنید' : 'Enter your details to complete your membership')}
          </p>
        </div>

        {error && (
          <div className="error-alert" style={{ alignItems: 'flex-start' }}>
            <span className="material-symbols-outlined" style={{ marginTop: '2px' }}>error</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: language === 'fa' ? 'right' : 'left', width: '100%' }}>
              {error.split('\n').map((errLine, idx) => (
                <span key={idx} style={{ fontSize: '0.85rem' }}>{errLine}</span>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Entering phone */}
        {step === 1 && (
          <div className="auth-form-container">
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

            <div className="auth-divider" style={{ margin: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#64748b', fontSize: '0.85rem' }}>
              <span style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span>{t('auth.or')}</span>
              <span style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <button
              type="button"
              className="submit-btn"
              style={{
                background: 'none',
                border: '1px solid rgba(61, 220, 151, 0.25)',
                color: '#3ddc97',
              }}
              onClick={() => {
                setRegisterToken(null);
                setStep(3);
                setError(null);
              }}
              disabled={loading}
            >
              {t('auth.directEmailRegister')}
            </button>
          </div>
        )}

        {/* Step 2: Entering verification code */}
        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label htmlFor="code">
                {language === 'fa' ? `کد تایید پیامک شده به ${phone}` : `Verification code sent to ${phone}`}
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
                <span>{t('auth.otpVerifyBtn')}</span>
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
                setStep(1);
                setError(null);
              }}
              disabled={loading}
            >
              {t('auth.changePhoneBtn')}
            </button>
          </form>
        )}

        {/* Step 3: Complete Profile info */}
        {step === 3 && (
          <form className="auth-form" onSubmit={handleCompleteRegister}>
            <div className="form-group">
              <label htmlFor="name">{t('auth.nameLabel')}</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">person</span>
                <input
                  id="name"
                  type="text"
                  placeholder={t('auth.namePlaceholder')}
                  className={language === 'fa' ? 'rtl-input' : ''}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

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

            {/* If direct email registration (no token), let them input optional phone number */}
            {!registerToken && (
              <div className="form-group">
                <label htmlFor="phone">{t('auth.phoneLabel')} ({language === 'fa' ? 'اختیاری' : 'Optional'})</label>
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
            )}

            <div className="form-group">
              <label htmlFor="password">{t('auth.passwordLabel')}</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">lock</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="has-toggle"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">{t('auth.confirmPasswordLabel')}</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">lock</span>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="has-toggle"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  aria-label={showConfirmPassword ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
                >
                  <span className="material-symbols-outlined">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>{language === 'fa' ? 'در حال تکمیل ثبت نام...' : 'Completing signup...'}</span>
                </>
              ) : (
                <span>{t('auth.submitRegister')}</span>
              )}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <span>{t('auth.haveAccount')} </span>
          <Link href="/login">{t('auth.gotoLogin')}</Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="auth-page">
        <div className="auth-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div className="spinner"></div>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
