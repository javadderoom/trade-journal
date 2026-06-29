'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../lib/auth';
import { notify } from '../../../lib/notify';
import '../auth.scss';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const sendOtp = useAuthStore((state) => state.sendOtp);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const registerOtp = useAuthStore((state) => state.registerOtp);

  const initialToken = searchParams.get('token');
  const initialPhone = searchParams.get('phone');

  // Wizard Steps:
  // 1: Phone input
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
      const msg = 'لطفاً شماره موبایل خود را وارد کنید';
      setError(msg);
      notify.error(msg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await sendOtp(phone);
      notify.success('کد تایید با موفقیت ارسال شد');
      setStep(2);
      setTimer(120);
      setTimerActive(true);
    } catch (err: any) {
      const msg = err.message || 'خطا در ارسال کد تایید';
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !code) {
      const msg = 'لطفاً کد تایید را وارد کنید';
      setError(msg);
      notify.error(msg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await verifyOtp(phone, code);
      if (res.isNewUser) {
        notify.success('شماره موبایل تایید شد. لطفاً ثبت نام خود را کامل کنید.');
        setRegisterToken(res.registerToken || null);
        setStep(3);
      } else {
        notify.success('ورود با موفقیت انجام شد');
        // User already exists, they got logged in automatically
        router.replace('/trades');
      }
    } catch (err: any) {
      const msg = err.message || 'کد تایید نامعتبر یا منقضی شده است';
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
      notify.success('کد تایید مجدداً ارسال شد');
      setTimer(120);
      setTimerActive(true);
      setCode('');
    } catch (err: any) {
      const msg = err.message || 'خطا در ارسال مجدد کد تایید';
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      const msg = 'لطفاً تمامی فیلدها را پر کنید';
      setError(msg);
      notify.error(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'رمز عبور و تایید آن مطابقت ندارند';
      setError(msg);
      notify.error(msg);
      return;
    }

    if (!registerToken) {
      const msg = 'توکن ثبت‌نام منقضی شده یا نامعتبر است. لطفاً فرآیند را از ابتدا آغاز کنید.';
      setError(msg);
      notify.error(msg);
      setStep(1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await registerOtp(registerToken, name, email, password);
      notify.success('عضویت شما با موفقیت تکمیل شد');
      router.replace('/trades');
    } catch (err: any) {
      const msg = err.message || 'خطا در تکمیل ثبت نام';
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
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-back-link">
          <span className="material-symbols-outlined">arrow_forward</span>
          <span>بازگشت</span>
        </Link>
        
        <div className="auth-header">
          <div className="auth-logo">
            <span className="material-symbols-outlined">person_add</span>
          </div>
          <h2>ثبت نام در تریدکاو</h2>
          <p>
            {step < 3 
              ? 'تایید شماره موبایل جهت ایجاد حساب کاربری' 
              : 'مشخصات خود را برای تکمیل عضویت وارد کنید'}
          </p>
        </div>

        {error && (
          <div className="error-alert" style={{ alignItems: 'flex-start' }}>
            <span className="material-symbols-outlined" style={{ marginTop: '2px' }}>error</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right', width: '100%' }}>
              {error.split('\n').map((errLine, idx) => (
                <span key={idx} style={{ fontSize: '0.85rem' }}>{errLine}</span>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Entering phone */}
        {step === 1 && (
          <form className="auth-form" onSubmit={handleSendOtp}>
            <div className="form-group">
              <label htmlFor="phone">شماره تلفن همراه</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">phone_android</span>
                <input
                  id="phone"
                  type="tel"
                  placeholder="09123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  style={{ direction: 'ltr', textAlign: 'right' }}
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>در حال ارسال...</span>
                </>
              ) : (
                <span>ارسال کد تایید</span>
              )}
            </button>
          </form>
        )}

        {/* Step 2: Entering verification code */}
        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label htmlFor="code">کد تایید پیامک شده به {phone}</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">vpn_key</span>
                <input
                  id="code"
                  type="text"
                  placeholder="کد ۵ رقمی"
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
                  <span>در حال تایید...</span>
                </>
              ) : (
                <span>تایید شماره موبایل</span>
              )}
            </button>

            <div className="otp-timer-text">
              {timerActive ? (
                <span>ارسال مجدد کد پس از: {formatTimer(timer)}</span>
              ) : (
                <button
                  type="button"
                  className="resend-otp-btn"
                  onClick={handleResendOtp}
                  disabled={loading}
                >
                  ارسال مجدد کد تایید
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
              تغییر شماره موبایل
            </button>
          </form>
        )}

        {/* Step 3: Complete Profile info */}
        {step === 3 && (
          <form className="auth-form" onSubmit={handleCompleteRegister}>
            <div className="form-group">
              <label htmlFor="name">نام و نام خانوادگی</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">person</span>
                <input
                  id="name"
                  type="text"
                  placeholder="علی رضایی"
                  className="rtl-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">پست الکترونیکی (ایمیل)</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">mail</span>
                <input
                  id="email"
                  type="email"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">رمز عبور (حداقل ۶ کاراکتر)</label>
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
              <label htmlFor="confirmPassword">تایید رمز عبور</label>
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
                  <span>در حال تکمیل ثبت نام...</span>
                </>
              ) : (
                <span>تکمیل ثبت نام و ایجاد حساب</span>
              )}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <span>قبلاً ثبت نام کرده‌اید؟</span>
          <Link href="/login">ورود به سیستم</Link>
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
