'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/auth';
import '../auth.scss';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-alert">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}

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

        <div className="auth-footer">
          <span>هنوز ثبت نام نکرده‌اید؟</span>
          <Link href="/register">ایجاد حساب جدید</Link>
        </div>
      </div>
    </div>
  );
}
