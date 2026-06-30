'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';
import Link from 'next/link';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refId, setRefId] = useState<string | null>(null);
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;

    const gateway = searchParams.get('gateway');
    const authority = searchParams.get('Authority');
    const status = searchParams.get('Status');
    
    console.log('--- PayPing/ZarinPal Callback Debug ---');
    console.log('Full Query Params URL:', window.location.href);
    console.log('Parsed Search Params:', Object.fromEntries(searchParams.entries()));
    console.log('----------------------------------------');
    
    // PayPing parameters
    const refid = searchParams.get('refid');
    const code = searchParams.get('code');

    const plan = searchParams.get('plan');
    const period = searchParams.get('period');
    const amount = searchParams.get('amount');
    const discountCode = searchParams.get('discountCode');

    const isPayPing = gateway === 'payping' || (refid !== null && code !== null);

    if (isPayPing) {
      if (!refid) {
        setError('پرداخت پی‌پینگ با خطا مواجه شد یا توسط کاربر لغو گردید.');
        setLoading(false);
        return;
      }
      if (!plan || !period || !amount) {
        setError('اطلاعات بازگشت از پرداخت پی‌پینگ معتبر نیست.');
        setLoading(false);
        return;
      }
    } else {
      if (!authority || !status || !plan || !period || !amount) {
        setError('اطلاعات بازگشت از پرداخت معتبر نیست.');
        setLoading(false);
        return;
      }

      if (status !== 'OK') {
        setError('پرداخت با خطا مواجه شد یا توسط کاربر لغو گردید.');
        setLoading(false);
        return;
      }
    }

    const verifyTransaction = async () => {
      hasVerified.current = true;
      try {
        const verifyEndpoint = isPayPing ? '/api/payments/payping/verify' : '/api/payments/verify';
        const verifyPayload = isPayPing
          ? { refid, code, amount, plan, period, discountCode }
          : { authority, status, amount, plan, period, discountCode };

        const res = await api.post(verifyEndpoint, verifyPayload);

        if (res.data.success) {
          setSuccess(true);
          setRefId(res.data.refId);
          // Refresh user auth store to update the local plan state
          await refresh();
        } else {
          setError(res.data.error || 'تایید تراکنش با خطا مواجه شد.');
        }
      } catch (err: any) {
        console.error('Payment verification error:', err);
        setError(err.response?.data?.error || 'خطایی در تایید تراکنش در سمت سرور رخ داد.');
      } finally {
        setLoading(false);
      }
    };

    verifyTransaction();
  }, [searchParams, refresh]);

  return (
    <div className="payment-callback-container">
      <div className="payment-card">
        {loading && (
          <div className="status-loading">
            <div className="spinner"></div>
            <h3>در حال بررسی و تایید تراکنش...</h3>
            <p>لطفاً پنجره را نبندید یا صفحه را بازخوانی نکنید.</p>
          </div>
        )}

        {!loading && success && (
          <div className="status-success">
            <span className="material-symbols-outlined icon-success">check_circle</span>
            <h3>پرداخت با موفقیت انجام شد!</h3>
            <p className="success-msg">پلن کاربری شما با موفقیت به <strong>{searchParams.get('plan') === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'}</strong> ارتقا یافت.</p>
            {refId && (
              <div className="ref-box">
                <span className="lbl">شماره پیگیری پرداخت (Ref ID):</span>
                <span className="val">{refId}</span>
              </div>
            )}
            <Link href="/settings?tab=subscription" className="btn-return">
              بازگشت به تنظیمات حساب
            </Link>
          </div>
        )}

        {!loading && error && (
          <div className="status-error">
            <span className="material-symbols-outlined icon-error">cancel</span>
            <h3>خطا در انجام پرداخت</h3>
            <p className="error-msg">{error}</p>
            <Link href="/settings?tab=subscription" className="btn-return btn-error-return">
              تلاش مجدد و بازگشت به اشتراک‌ها
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        .payment-callback-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
          padding: 20px;
          background-color: transparent;
          font-family: inherit;
        }
        .payment-card {
          background-color: var(--card-bg, #1a202c);
          border: 1px solid var(--border-color, #2d3748);
          border-radius: 16px;
          padding: 40px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        .status-loading h3 {
          color: var(--text-color, #e2e8f0);
          margin-top: 20px;
        }
        .status-loading p {
          color: var(--text-muted, #a0aec0);
          font-size: 0.9rem;
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top-color: #3182ce;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .status-success h3 {
          color: #48bb78;
          font-size: 1.5rem;
          margin-top: 15px;
          margin-bottom: 10px;
        }
        .icon-success {
          font-size: 4.5rem;
          color: #48bb78;
        }
        .success-msg {
          color: var(--text-color, #e2e8f0);
          margin-bottom: 20px;
          font-size: 1.05rem;
          line-height: 1.6;
        }
        .ref-box {
          background-color: var(--bg-muted, #2d3748);
          border-radius: 8px;
          padding: 12px 15px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }
        .ref-box .lbl {
          color: var(--text-muted, #a0aec0);
        }
        .ref-box .val {
          color: #ffcc00;
          font-weight: bold;
          font-family: monospace;
          font-size: 1.05rem;
        }
        .status-error h3 {
          color: #e53e3e;
          font-size: 1.5rem;
          margin-top: 15px;
          margin-bottom: 10px;
        }
        .icon-error {
          font-size: 4.5rem;
          color: #e53e3e;
        }
        .error-msg {
          color: var(--text-muted, #a0aec0);
          margin-bottom: 30px;
          font-size: 1rem;
          line-height: 1.6;
        }
        .btn-return {
          display: inline-block;
          background-color: #3182ce;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          transition: background-color 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .btn-return:hover {
          background-color: #2b6cb0;
        }
        .btn-error-return {
          background-color: var(--border-color, #2d3748);
          color: var(--text-color, #e2e8f0);
          border: 1px solid var(--border-color, #4a5568);
        }
        .btn-error-return:hover {
          background-color: #4a5568;
        }
      `}</style>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: '#a0aec0' }}>
        <h3>در حال بارگذاری...</h3>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
