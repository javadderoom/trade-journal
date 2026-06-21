'use client';

import React, { useState, useEffect } from 'react';
import TradesTable, { Trade } from '../../components/trades/TradesTable';
import { useAppStore } from '../../store/useAppStore';
import { useTradeStore } from '../../store/useTradeStore';
import ManualTradeModal from '../../components/modals/ManualTradeModal';
import ImportMT4Modal from '../../components/modals/ImportMT4Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';

// Premium high-fidelity mock trades matching code.html
export default function TradesPage() {
  const [autoOpenTradeId, setAutoOpenTradeId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);

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

  // Dialog State for custom alerts
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'confirm' | 'error' | 'success';
    confirmLabel?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const fetchAccounts = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
      const res = await fetch(`${baseUrl}/api/trades/accounts`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
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

  useEffect(() => {
    fetchTrades(false, selectedAccountId);
  }, [selectedAccountId]);

  const handleImportMT4 = () => {
    setImportMT4ModalOpen(true);
  };

  const handleImportSuccess = async (result: any) => {
    setDialogConfig({
      isOpen: true,
      title: 'واردات موفقیت‌آمیز',
      message: `واردات فایل با موفقیت انجام شد:\nتعداد معامله یافت شده: ${result.found}\nتعداد وارد شده: ${result.imported}\nتعداد تکراری (نادیده گرفته شده): ${result.skipped}`,
      type: 'success',
      confirmLabel: 'باشه',
    });
    await fetchTrades(true);
  };

  const handleAddManualTrade = () => {
    setManualTradeModalOpen(true);
  };

  const handleManualTradeSuccess = async (newTrade: any) => {
    // 1. Re-fetch trades from database
    await fetchTrades(true);
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
      />
      <ConfirmModal
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        confirmLabel={dialogConfig.confirmLabel}
        onClose={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </main>
  );
}
