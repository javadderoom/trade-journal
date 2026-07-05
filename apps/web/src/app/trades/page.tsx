'use client';

import React, { useState, useEffect } from 'react';
import TradesTable, { Trade } from '../../components/trades/TradesTable';
import { useAppStore, useTranslation } from '../../store/useAppStore';
import { useTradeStore } from '../../store/useTradeStore';
import ManualTradeModal from '../../components/modals/ManualTradeModal';
import ImportMT4Modal from '../../components/modals/ImportMT4Modal';
import MistakeReviewModal, { SuggestedMistake } from '../../components/modals/MistakeReviewModal';
import ImportMistakeSummaryModal, { ImportMistakeEntry } from '../../components/modals/ImportMistakeSummaryModal';
import { api } from '../../lib/api';
import { notify } from '../../lib/notify';
import Link from 'next/link';

export default function TradesPage() {
  const { t, language } = useTranslation();
  const isEn = language === 'en';

  const [autoOpenTradeId, setAutoOpenTradeId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<any>(null);
  const [dismissedRejectionId, setDismissedRejectionId] = useState<string | null>(null);

  // Mistake detection state
  const [mistakeReview, setMistakeReview] = useState<{
    tradeId: string;
    tradeSummary: { symbol: string; direction: 'BUY' | 'SELL'; profitUsd: number };
    suggestions: SuggestedMistake[];
  } | null>(null);
  const [importMistakeSummary, setImportMistakeSummary] = useState<ImportMistakeEntry[]>([]);
  const [isImportMistakeOpen, setIsImportMistakeOpen] = useState(false);

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
    notify.success(
      isEn 
        ? `Import completed successfully:\nFound trades: ${result.found}\nImported: ${result.imported}\nDuplicate (ignored): ${result.skipped}`
        : `واردات فایل با موفقیت انجام شد:\nتعداد معامله یافت شده: ${result.found}\nتعداد وارد شده: ${result.imported}\nتعداد تکراری (نادیده گرفته شده): ${result.skipped}`
    );
    await fetchTrades(true, selectedAccountId);
    fetchSubStatus();
    // Open batch mistake summary if any were detected
    if (result.mistakeSummary && result.mistakeSummary.length > 0) {
      setImportMistakeSummary(result.mistakeSummary);
      setIsImportMistakeOpen(true);
    }
  };

  const handleAddManualTrade = () => {
    setManualTradeModalOpen(true);
  };

  const handleManualTradeSuccess = async (newTrade: any, suggestedMistakes?: SuggestedMistake[]) => {
    // 1. Re-fetch trades from database
    await fetchTrades(true);
    fetchSubStatus();
    // 2. Set newly created trade to open in sidebar automatically
    if (newTrade && newTrade.id) {
      setAutoOpenTradeId(newTrade.id);
      setTimeout(() => { setAutoOpenTradeId(null); }, 500);
    }
    // 3. Open mistake review modal if any mistakes were detected
    if (suggestedMistakes && suggestedMistakes.length > 0 && newTrade?.id) {
      setMistakeReview({
        tradeId: newTrade.id,
        tradeSummary: {
          symbol: newTrade.symbol,
          direction: newTrade.direction,
          profitUsd: newTrade.profit_usd ?? 0,
        },
        suggestions: suggestedMistakes,
      });
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111319', color: '#61f9b1' }}>
        <div style={{ fontSize: '20px', fontFamily: isEn ? 'inherit' : 'Vazirmatn' }}>
          {isEn ? 'Loading trades data...' : 'در حال دریافت اطلاعات معاملات...'}
        </div>
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
          fontFamily: isEn ? 'inherit' : 'Vazirmatn',
          fontSize: '0.9rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span className="material-symbols-outlined">pending_actions</span>
          <span>
            {isEn ? (
              <>
                Your payment receipt to upgrade to plan{' '}
                <strong>{subStatus.pendingReceipt.plan === 'STANDARD' ? 'Standard' : 'Pro'}</strong> ({subStatus.pendingReceipt.period === 'annual' ? 'Annual' : 'Monthly'}) is submitted and is being reviewed by administration.
              </>
            ) : (
              <>
                فیش پرداخت شما برای ارتقا به پلن{' '}
                <strong>{subStatus.pendingReceipt.plan === 'STANDARD' ? 'استاندارد' : 'حرفه‌ای'}</strong> (دوره{' '}
                {subStatus.pendingReceipt.period === 'annual' ? 'سالانه' : 'ماهانه'}) ثبت شده و در حال بررسی توسط مدیریت است.
              </>
            )}
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
          fontFamily: isEn ? 'inherit' : 'Vazirmatn',
          fontSize: '0.9rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span className="material-symbols-outlined">cancel</span>
          <span style={{ flex: 1, textAlign: isEn ? 'left' : 'right' }}>
            {isEn ? (
              <>
                Your last payment receipt for plan{' '}
                <strong>{subStatus.pendingReceipt.plan === 'STANDARD' ? 'Standard' : 'Pro'}</strong>{' '}
                was rejected by administration.
                {subStatus.pendingReceipt.rejectionReason && (
                  <>
                    <br />
                    <span style={{ color: '#a0aec0' }}>Reason: </span>
                    <strong style={{ color: '#f8fafc' }}>{subStatus.pendingReceipt.rejectionReason}</strong>
                  </>
                )}
              </>
            ) : (
              <>
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
          fontFamily: isEn ? 'inherit' : 'Vazirmatn',
          fontSize: '0.9rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>warning</span>
          <span>
            {isEn ? (
              subStatus.usage.monthlyTrades >= 30
                ? 'The limit of 30 trades per month for the free plan has been reached. Please upgrade your subscription to add or import more trades.'
                : `You have recorded ${subStatus.usage.monthlyTrades} out of the 30 allowed monthly trades in the free plan. Please upgrade your subscription to add more.`
            ) : (
              subStatus.usage.monthlyTrades >= 30
                ? 'سقف ثبت ۳۰ معامله در ماه برای پلن رایگان به پایان رسیده است. برای ثبت معامله جدید یا واردات فایل، لطفاً اشتراک خود را ارتقا دهید.'
                : `شما ${subStatus.usage.monthlyTrades} معامله از سقف ۳۰ معامله مجاز در ماه برای پلن رایگان را ثبت کرده‌اید. برای ثبت معامله بیشتر، لطفاً اشتراک خود را ارتقا دهید.`
            )}
          </span>
          <Link href="/settings?tab=subscription" style={{ color: '#111319', textDecoration: 'underline', marginRight: isEn ? '0px' : '15px', marginLeft: isEn ? '15px' : '0px' }}>
            {isEn ? 'Upgrade Subscription' : 'ارتقای اشتراک'}
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
      {/* Mistake Review Modal — shown after manual trade save */}
      {mistakeReview && (
        <MistakeReviewModal
          isOpen={!!mistakeReview}
          onClose={() => setMistakeReview(null)}
          tradeId={mistakeReview.tradeId}
          tradeSummary={mistakeReview.tradeSummary}
          suggestions={mistakeReview.suggestions}
        />
      )}
      {/* Import Mistake Summary Modal — shown after bulk MT4/MT5 import */}
      <ImportMistakeSummaryModal
        isOpen={isImportMistakeOpen}
        onClose={() => { setIsImportMistakeOpen(false); setImportMistakeSummary([]); }}
        mistakeSummary={importMistakeSummary}
      />

    </main>
  );
}
