'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toPersianDigits } from '@/utils/farsi';
import { notify } from '@/lib/notify';
import LoadingButton from '@/components/ui/LoadingButton';

interface AdminReceipt {
  id: string;
  user_id: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  plan: 'STANDARD' | 'PRO';
  period: string;
  amount: number;
  discountCode: string | null;
  receipt_image: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  created_at: string;
}

export default function Admin2ReceiptsPage() {
  const [receiptsList, setReceiptsList] = useState<AdminReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedReceipt, setSelectedReceipt] = useState<AdminReceipt | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionInput, setRejectionInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/receipts');
      setReceiptsList(res.data);
    } catch (err) {
      console.error('Failed to fetch receipts:', err);
      notify.error('خطا در دریافت لیست فیش‌ها');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const handleVerifyReceipt = async (id: string, status: 'APPROVED' | 'REJECTED', inlineReason?: string) => {
    let rejectionReason = '';
    if (status === 'REJECTED') {
      if (!inlineReason || !inlineReason.trim()) {
        notify.error('وارد کردن علت رد شدن فیش الزامی است');
        return;
      }
      rejectionReason = inlineReason.trim();
    } else {
      const ok = await notify.confirm({
        title: 'تایید فیش',
        message: 'آیا از تایید این فیش اطمینان دارید؟',
      });
      if (!ok) return;
    }

    setIsVerifying(true);
    try {
      await api.post(`/api/admin/receipts/${id}/verify`, { status, rejectionReason });
      setSelectedReceipt(null);
      setIsRejecting(false);
      setRejectionInput('');
      fetchReceipts();
      notify.success('وضعیت فیش با موفقیت به‌روز شد');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'خطا در اعمال وضعیت فیش');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="admin-panel-card">
      <div className="card-header-actions">
        <h3>فیش‌های واریزی کاربران</h3>
      </div>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>کاربر</th>
              <th>پلن درخواستی</th>
              <th>دوره</th>
              <th>مبلغ واریزی</th>
              <th>کد تخفیف</th>
              <th>وضعیت فیش</th>
              <th>تاریخ ثبت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                  <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>sync</span>
                </td>
              </tr>
            ) : receiptsList.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#a0aec0' }}>
                  فیش واریزی یافت نشد.
                </td>
              </tr>
            ) : (
              receiptsList.map((r) => (
                <tr key={r.id}>
                  <td>{r.user?.name || r.user?.email || '-'}</td>
                  <td>
                    <span className={`badge ${r.plan.toLowerCase()}`}>
                      {r.plan === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'}
                    </span>
                  </td>
                  <td>{r.period === 'annual' ? 'سالانه' : 'ماهانه'}</td>
                  <td>{toPersianDigits(r.amount.toLocaleString('fa-IR'))} تومان</td>
                  <td>{r.discountCode || '-'}</td>
                  <td>
                    <span className={`badge ${r.status.toLowerCase()}`}>
                      {r.status === 'PENDING' ? 'در انتظار بررسی' : r.status === 'APPROVED' ? 'تایید شده' : 'رد شده'}
                    </span>
                  </td>
                  <td>{new Date(r.created_at).toLocaleDateString('fa-IR')}</td>
                  <td>
                    <button
                      className="admin-btn"
                      onClick={() => setSelectedReceipt(r)}
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      مشاهده فیش
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Selected Receipt Verification Modal Overlay */}
      {selectedReceipt && (
        <div className="admin-overlay" onClick={() => {
          setSelectedReceipt(null);
          setIsRejecting(false);
          setRejectionInput('');
        }}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <h4>بررسی فیش واریزی</h4>
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px', color: '#a0aec0', marginTop: '12px' }}>
              <div>کاربر: <strong>{selectedReceipt.user?.name || '-'} ({selectedReceipt.user?.email})</strong></div>
              <div>پلن درخواستی: <strong>{selectedReceipt.plan === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'}</strong></div>
              <div>دوره: <strong>{selectedReceipt.period === 'annual' ? 'سالانه' : 'ماهانه'}</strong></div>
              <div>مبلغ تراکنش: <strong>{toPersianDigits(selectedReceipt.amount.toLocaleString('fa-IR'))} تومان</strong></div>
              {selectedReceipt.discountCode && <div>کد تخفیف اعمال شده: <strong>{selectedReceipt.discountCode}</strong></div>}
            </div>

            <div className="receipt-image-container" style={{ marginTop: '16px', marginBottom: '16px' }}>
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${selectedReceipt.receipt_image}`}
                alt="فیش پرداخت کاربر"
                style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            {selectedReceipt.status === 'PENDING' && !isRejecting && (
              <div className="receipt-modal-actions" style={{ display: 'flex', gap: '8px' }}>
                <LoadingButton
                  className="admin-btn"
                  disabled={isVerifying}
                  onClick={() => handleVerifyReceipt(selectedReceipt.id, 'APPROVED')}
                  isLoading={isVerifying}
                >
                  تایید و فعالسازی
                </LoadingButton>
                <LoadingButton
                  className="admin-btn btn-danger"
                  disabled={isVerifying}
                  onClick={() => setIsRejecting(true)}
                  isLoading={isVerifying}
                >
                  رد فیش
                </LoadingButton>
                <button
                  className="admin-btn btn-secondary"
                  onClick={() => {
                    setSelectedReceipt(null);
                    setIsRejecting(false);
                    setRejectionInput('');
                  }}
                >
                  بستن
                </button>
              </div>
            )}

            {selectedReceipt.status === 'PENDING' && isRejecting && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <textarea
                  placeholder="علت رد شدن فیش پرداخت (الزامی)..."
                  value={rejectionInput}
                  onChange={(e) => setRejectionInput(e.target.value)}
                  style={{
                    background: '#0b0d19',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '10px',
                    color: '#fff',
                    borderRadius: '6px',
                    minHeight: '80px',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <div className="receipt-modal-actions" style={{ display: 'flex', gap: '8px' }}>
                  <LoadingButton
                    className="admin-btn btn-danger"
                    disabled={isVerifying || !rejectionInput.trim()}
                    onClick={() => handleVerifyReceipt(selectedReceipt.id, 'REJECTED', rejectionInput)}
                    isLoading={isVerifying}
                  >
                    ثبت رد فیش
                  </LoadingButton>
                  <button
                    className="admin-btn btn-secondary"
                    onClick={() => {
                      setIsRejecting(false);
                      setRejectionInput('');
                    }}
                  >
                    انصراف
                  </button>
                </div>
              </div>
            )}

            {selectedReceipt.status !== 'PENDING' && (
              <div className="receipt-modal-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <span className={`badge ${selectedReceipt.status.toLowerCase()}`}>
                  این فیش قبلاً {selectedReceipt.status === 'APPROVED' ? 'تایید' : 'رد'} شده است
                </span>
                <button className="admin-btn btn-secondary" onClick={() => {
                  setSelectedReceipt(null);
                  setIsRejecting(false);
                  setRejectionInput('');
                }}>بستن</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
