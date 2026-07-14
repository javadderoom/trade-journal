'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: 'Vazirmatn, sans-serif', gap: 16 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#fbbf24' }}>search_off</span>
      <h2 style={{ color: '#f8fafc', fontSize: 20 }}>صفحه یافت نشد</h2>
      <p style={{ color: '#94a3b8', fontSize: 14 }}>صفحه‌ای که دنبال آن هستید وجود ندارد.</p>
      <Link
        href="/"
        style={{ marginTop: 8, padding: '8px 24px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: 14, textDecoration: 'none' }}
      >
        بازگشت به صفحه اصلی
      </Link>
    </div>
  );
}
