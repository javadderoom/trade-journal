'use client';

import React, { useState, useEffect } from 'react';
import TradesTable, { Trade } from '../../components/trades/TradesTable';
import { useAppStore, useTranslation } from '../../store/useAppStore';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { useTradeStore } from '../../store/useTradeStore';
import ManualTradeModal from '../../components/modals/ManualTradeModal';
import ImportMT4Modal from '../../components/modals/ImportMT4Modal';
import MistakeReviewModal, { SuggestedMistake } from '../../components/modals/MistakeReviewModal';
import ImportMistakeSummaryModal, { ImportMistakeEntry } from '../../components/modals/ImportMistakeSummaryModal';
import { api } from '../../lib/api';
import { notify } from '../../lib/notify';
import Link from 'next/link';
import { useSubscriptionStatus } from '../../hooks/useSubscriptionStatus';
import SubscriptionBanners from '../../components/SubscriptionBanners';

export default function TradesPage() {
  const { t, language } = useTranslation();
  const isEn = language === 'en';

  const [autoOpenTradeId, setAutoOpenTradeId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const { subStatus, dismissedRejectionId, setDismissedRejectionId, refetch: fetchSubStatus } = useSubscriptionStatus();

  // Mistake detection state
  const [mistakeReview, setMistakeReview] = useState<{
    tradeId: string;
    tradeSummary: { symbol: string; direction: 'BUY' | 'SELL'; profitUsd: number };
    suggestions: SuggestedMistake[];
  } | null>(null);
  const [importMistakeSummary, setImportMistakeSummary] = useState<ImportMistakeEntry[]>([]);
  const [isImportMistakeOpen, setIsImportMistakeOpen] = useState(false);

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

  const liveRate = useExchangeRate();
  useEffect(() => {
    if (liveRate > 0) setUsdToToman(liveRate);
  }, [liveRate, setUsdToToman]);

  useEffect(() => {
    fetchAccounts();
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
      <SubscriptionBanners
        subStatus={subStatus}
        dismissedRejectionId={dismissedRejectionId}
        onDismissRejection={setDismissedRejectionId}
      />
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
