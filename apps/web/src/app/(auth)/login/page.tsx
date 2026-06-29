'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/auth';
import '../auth.scss';

export default function LoginPage() {
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
      setError('لطفاً تمامی فیلدها را پر کنید');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      router.replace('/trades');
    } catch (err: any) {
      setError(err.message || 'خطا در ورود به سیستم');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError('لطفاً شماره موبایل خود را وارد کنید');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await sendOtp(phone);
      setOtpStep(2);
      setTimer(120);
      setTimerActive(true);
    } catch (err: any) {
      setError(err.message || 'خطا در ارسال کد تایید');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !code) {
      setError('لطفاً کد تایید را وارد کنید');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await verifyOtp(phone, code);
      if (res.isNewUser) {
        // Redirect to register wizard with token
        router.replace(`/register?token=${res.registerToken}&phone=${phone}`);
      } else {
        router.replace('/trades');
      }
    } catch (err: any) {
      setError(err.message || 'کد تایید نامعتبر یا منقضی شده است');
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
      setTimer(120);
      setTimerActive(true);
      setCode('');
    } catch (err: any) {
      setError(err.message || 'خطا در ارسال مجدد کد تایید');
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
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <h2>ورود به تریدکاو</h2>
          <p>ژورنال تخصصی و هوشمند تحلیل معاملات</p>
        </div>

        {/* Tab Selector */}
        <div className="method-tabs">
          <button
            type="button"
            className={loginMethod === 'password' ? 'active' : ''}
            onClick={() => {
              setLoginMethod('password');
              setError(null);
            }}
          >
            ورود با ایمیل و رمز
          </button>
          <button
            type="button"
            className={loginMethod === 'otp' ? 'active' : ''}
            onClick={() => {
              setLoginMethod('otp');
              setError(null);
            }}
          >
            ورود با رمز پیامکی
          </button>
        </div>

        {error && (
          <div className="error-alert">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Password Login Form */}
        {loginMethod === 'password' && (
          <form className="auth-form" onSubmit={handlePasswordSubmit}>
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
              <label htmlFor="password">رمز عبور</label>
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

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>در حال ورود...</span>
                </>
              ) : (
                <span>ورود به حساب کاربری</span>
              )}
            </button>
          </form>
        )}

        {/* OTP Login Form */}
        {loginMethod === 'otp' && (
          <div className="auth-form-container">
            {otpStep === 1 ? (
              <form className="auth-form" onSubmit={handleSendOtp}>
                <div className="form-group">
                  <label htmlFor="phone">شماره موبایل</label>
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
            ) : (
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
                    <span>تایید و ورود</span>
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
                    setOtpStep(1);
                    setError(null);
                  }}
                  disabled={loading}
                >
                  تغییر شماره موبایل
                </button>
              </form>
            )}
          </div>
        )}

        <div className="auth-footer">
          <p>
            حساب کاربری ندارید؟ <Link href="/register">ثبت نام کنید</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
