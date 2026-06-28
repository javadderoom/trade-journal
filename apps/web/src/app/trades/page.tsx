'use client';

import React, { useState, useEffect } from 'react';
import TradesTable, { Trade } from '../../components/trades/TradesTable';
import { useAppStore } from '../../store/useAppStore';
import { useTradeStore } from '../../store/useTradeStore';
import ManualTradeModal from '../../components/modals/ManualTradeModal';
import ImportMT4Modal from '../../components/modals/ImportMT4Modal';
import { api } from '../../lib/api';
import { notify } from '../../lib/notify';
import Link from 'next/link';

export default function TradesPage() {
  const [autoOpenTradeId, setAutoOpenTradeId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<any>(null);
  const [dismissedRejectionId, setDismissedRejectionId] = useState<string | null>(null);

  const fetchSubStatus = async () => {
    try {
      const res = await api.get('/api/payments/status');
      setSubStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const dateParam = params.get('date');
      if (dateParam) {
        setDateFilter(dateParam);
      }
    }
  }, []);

  // Destructure global states from Zustand useAppStore
  const {
    accounts,
    setAccounts,
    selectedAccountId,
    setSelectedAccountId,
    usdToToman,
    setUsdToToman,
    isManualTradeModalOpen,
    setManualTradeModalOpen,
    isImportMT4ModalOpen,
    setImportMT4ModalOpen,
  } = useAppStore();

  // Destructure global states and actions from Zustand useTradeStore
  const {
    trades,
    loading,
    error,
    fetchTrades,
    updateTrade: handleUpdateTrade,
    deleteTrade: handleDeleteTrade,
    deleteMultipleTrades: handleDeleteMultipleTrades,
  } = useTradeStore();

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/api/trades/accounts');
      setAccounts(res.data);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  useEffect(() => {
    fetchAccounts();

    // Fetch live USD→Toman rate (cached 6h server-side, safe within 120/month quota)
    fetch('/api/exchange-rate')
      .then(r => r.json())
      .then(data => {
        if (data?.usdToToman && data.usdToToman > 0) {
          setUsdToToman(data.usdToToman);
        }
      })
      .catch(() => { /* keep default 90,000 */ });
  }, []);

  const handleImportMT4 = async () => {
    if (accounts.length === 0) {
      await fetchAccounts();
    }
    setImportMT4ModalOpen(true);
  };

  useEffect(() => {
    fetchTrades(false, selectedAccountId);
  }, [selectedAccountId]);

  useEffect(() => {
    fetchSubStatus();
  }, [trades]);

  const handleImportSuccess = async (result: any) => {
    notify.success(`واردات فایل با موفقیت انجام شد:\nتعداد معامله یافت شده: ${result.found}\nتعداد وارد شده: ${result.imported}\nتعداد تکراری (نادیده گرفته شده): ${result.skipped}`);
    await fetchTrades(true, selectedAccountId);
    fetchSubStatus();
  };

  const handleAddManualTrade = () => {
    setManualTradeModalOpen(true);
  };

  const handleManualTradeSuccess = async (newTrade: any) => {
    // 1. Re-fetch trades from database
    await fetchTrades(true);
    fetchSubStatus();
    // 2. Set newly created trade to open in sidebar automatically
    if (newTrade && newTrade.id) {
      setAutoOpenTradeId(newTrade.id);
      // Clear it after a short timeout so that subsequent row clicks work normally
      setTimeout(() => {
        setAutoOpenTradeId(null);
      }, 500);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111319', color: '#61f9b1' }}>
        <div style={{ fontSize: '20px', fontFamily: 'Vazirmatn' }}>در حال دریافت اطلاعات معاملات...</div>
      </div>
    );
  }
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#111319' }}>
      {subStatus?.pendingReceipt && subStatus.pendingReceipt.status === 'PENDING' && (
        <div style={{
          backgroundColor: 'rgba(255, 179, 0, 0.08)',
          borderBottom: '1px solid rgba(255, 179, 0, 0.2)',
          color: '#ffb300',
          padding: '12px 20px',
          textAlign: 'center',
          fontFamily: 'Vazirmatn',
          fontSize: '0.9rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span className="material-symbols-outlined">pending_actions</span>
          <span>
            فیش پرداخت شما برای ارتقا به پلن{' '}
            <strong>{subStatus.pendingReceipt.plan === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'}</strong> (دوره{' '}
            {subStatus.pendingReceipt.period === 'annual' ? 'سالانه' : 'ماهانه'}) ثبت شده و در حال بررسی توسط مدیریت است.
          </span>
        </div>
      )}

      {subStatus?.pendingReceipt && subStatus.pendingReceipt.status === 'REJECTED' && dismissedRejectionId !== subStatus.pendingReceipt.id && (
        <div style={{
          backgroundColor: 'rgba(255, 83, 112, 0.08)',
          borderBottom: '1px solid rgba(255, 83, 112, 0.2)',
          color: '#ff5370',
          padding: '12px 20px',
          textAlign: 'center',
          fontFamily: 'Vazirmatn',
          fontSize: '0.9rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span className="material-symbols-outlined">cancel</span>
          <span style={{ flex: 1, textAlign: 'right' }}>
            آخرین فیش واریزی شما برای پلن{' '}
            <strong>{subStatus.pendingReceipt.plan === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'}</strong>{' '}
            توسط مدیریت رد شد.
            {subStatus.pendingReceipt.rejectionReason && (
              <>
                <br />
                <span style={{ color: '#a0aec0' }}>علت رد شدن: </span>
                <strong style={{ color: '#f8fafc' }}>{subStatus.pendingReceipt.rejectionReason}</strong>
              </>
            )}
          </span>
          <button
            onClick={() => setDismissedRejectionId(subStatus.pendingReceipt.id)}
            style={{ background: 'none', border: 'none', color: '#ff5370', cursor: 'pointer', padding: 0 }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {subStatus?.plan === 'FREE' && subStatus?.usage?.monthlyTrades >= 24 && (
        <div style={{
          backgroundColor: '#ffb300',
          color: '#111319',
          padding: '12px 20px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontFamily: 'Vazirmatn',
          fontSize: '0.9rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>warning</span>
          <span>
            {subStatus.usage.monthlyTrades >= 30
              ? 'سقف ثبت ۳۰ معامله در ماه برای پلن رایگان به پایان رسیده است. برای ثبت معامله جدید یا واردات فایل، لطفاً اشتراک خود را ارتقا دهید.'
              : `شما ${subStatus.usage.monthlyTrades} معامله از سقف ۳۰ معامله مجاز در ماه برای پلن رایگان را ثبت کرده‌اید. برای ثبت معامله بیشتر، لطفاً اشتراک خود را ارتقا دهید.`
            }
          </span>
          <Link href="/settings?tab=subscription" style={{ color: '#111319', textDecoration: 'underline', marginRight: '15px' }}>
            ارتقای اشتراک
          </Link>
        </div>
      )}
      <TradesTable
        initialTrades={trades}
        initialUsdToToman={usdToToman}
        initialDateFilter={dateFilter}
        onRefresh={() => fetchTrades(true)}
        onImportMT4={handleImportMT4}
        onAddManualTrade={handleAddManualTrade}
        onUpdateTrade={handleUpdateTrade}
        onDeleteTrade={handleDeleteTrade}
        onDeleteMultipleTrades={handleDeleteMultipleTrades}
        initialActiveTradeId={autoOpenTradeId}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onAccountIdChange={setSelectedAccountId}
      />
      <ManualTradeModal
        isOpen={isManualTradeModalOpen}
        onClose={() => setManualTradeModalOpen(false)}
        onSuccess={handleManualTradeSuccess}
      />
      <ImportMT4Modal
        isOpen={isImportMT4ModalOpen}
        onClose={() => setImportMT4ModalOpen(false)}
        onSuccess={handleImportSuccess}
        accounts={accounts}
      />

    </main>
  );
}
