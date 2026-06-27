'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/auth';
import '../auth.scss';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password || !confirmPassword) {
      setError('لطفاً تمامی فیلدها را پر کنید');
      return;
    }

    if (password !== confirmPassword) {
      setError('رمز عبور و تایید آن مطابقت ندارند');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register(name, email, phone, password);
      router.replace('/trades');
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت نام کاربر جدید');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="material-symbols-outlined">person_add</span>
          </div>
          <h2>ثبت نام در تریدکاو</h2>
          <p>به جمع معامله‌گران بپیوندید و معاملات خود را مدیریت کنید</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
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
            <label htmlFor="phone">شماره تلفن همراه</label>
            <div className="input-wrapper">
              <span className="material-symbols-outlined input-icon">phone_iphone</span>
              <input
                id="phone"
                type="tel"
                placeholder="09123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
                <span>در حال ثبت نام...</span>
              </>
            ) : (
              <span>ایجاد حساب کاربری</span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span>قبلاً ثبت نام کرده‌اید؟</span>
          <Link href="/login">ورود به سیستم</Link>
        </div>
      </div>
    </div>
  );
}
