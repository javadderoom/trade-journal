'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: 'Vazirmatn, sans-serif', gap: 16 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#f87171' }}>error</span>
      <h2 style={{ color: '#f8fafc', fontSize: 20 }}>مشکلی پیش آمد</h2>
      <p style={{ color: '#94a3b8', fontSize: 14 }}>متأسفانه خطایی رخ داده است. لطفاً دوباره تلاش کنید.</p>
      <button
        onClick={reset}
        style={{ marginTop: 8, padding: '8px 24px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: 14 }}
      >
        تلاش مجدد
      </button>
    </div>
  );
}
