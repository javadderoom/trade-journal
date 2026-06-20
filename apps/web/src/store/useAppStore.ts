import { create } from 'zustand';

export interface TradingAccount {
  id: string;
  name: string;
  broker?: string;
  accountNumber?: string;
  balance?: number;
  currency?: string;
}

interface AppState {
  // Accounts
  accounts: TradingAccount[];
  selectedAccountId: string; // 'all' or specific account id
  setAccounts: (accounts: TradingAccount[]) => void;
  setSelectedAccountId: (id: string) => void;

  // Conversion & Preferences
  usdToToman: number;
  setUsdToToman: (rate: number) => void;
  selectedTimezone: string;
  setSelectedTimezone: (timezone: string) => void;

  // UI / Modals / Detail Sidebar
  activeTradeId: string | null;
  setActiveTradeId: (id: string | null) => void;
  isManualTradeModalOpen: boolean;
  setManualTradeModalOpen: (isOpen: boolean) => void;
  isImportMT4ModalOpen: boolean;
  setImportMT4ModalOpen: (isOpen: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial states
  accounts: [],
  selectedAccountId: 'all',
  usdToToman: 60000,
  selectedTimezone: 'Asia/Tehran',
  activeTradeId: null,
  isManualTradeModalOpen: false,
  isImportMT4ModalOpen: false,

  // Setters
  setAccounts: (accounts) => set({ accounts }),
  setSelectedAccountId: (selectedAccountId) => set({ selectedAccountId }),
  setUsdToToman: (usdToToman) => set({ usdToToman }),
  setSelectedTimezone: (selectedTimezone) => set({ selectedTimezone }),
  setActiveTradeId: (activeTradeId) => set({ activeTradeId }),
  setManualTradeModalOpen: (isOpen) => set({ isManualTradeModalOpen: isOpen }),
  setImportMT4ModalOpen: (isOpen) => set({ isImportMT4ModalOpen: isOpen }),
}));
