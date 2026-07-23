import { useEffect, useCallback } from 'react';
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

  // Language i18n
  language: 'fa' | 'en';
  setLanguage: (lang: 'fa' | 'en') => void;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}

function getInitialLanguage(): 'fa' | 'en' {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('language') as 'fa' | 'en' | null;
    if (saved === 'en' || saved === 'fa') return saved;
    const match = document.cookie.match(/(?:^|; )locale=([^;]*)/);
    if (match && (match[1] === 'en' || match[1] === 'fa')) return match[1] as 'fa' | 'en';
  }
  return 'fa';
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
  language: getInitialLanguage(),

  // Setters
  setAccounts: (accounts) => set({ accounts }),
  setSelectedAccountId: (selectedAccountId) => set({ selectedAccountId }),
  setUsdToToman: (usdToToman) => set({ usdToToman }),
  setSelectedTimezone: (selectedTimezone) => set({ selectedTimezone }),
  setActiveTradeId: (activeTradeId) => set({ activeTradeId }),
  setManualTradeModalOpen: (isOpen) => set({ isManualTradeModalOpen: isOpen }),
  setImportMT4ModalOpen: (isOpen) => set({ isImportMT4ModalOpen: isOpen }),
  setLanguage: (language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language);
      setCookie('locale', language);
    }
    set({ language });
  },
}));

import faTranslations from '../locales/fa.json';
import enTranslations from '../locales/en.json';

export function useTranslation() {
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  useEffect(() => {
    // Client-side synchronization of saved locale on mount
    const saved = localStorage.getItem('language') as 'fa' | 'en' | null;
    if (saved && saved !== language) {
      setLanguage(saved);
    } else if (!saved) {
      // Sync cookie if empty
      setCookie('locale', language);
    }
  }, []);

  const t = useCallback((key: string): string => {
    const dict = language === 'fa' ? faTranslations : enTranslations;
    const parts = key.split('.');
    let current: any = dict;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return key;
      }
    }
    return typeof current === 'string' ? current : key;
  }, [language]);

  return { t, language, setLanguage, dir: language === 'fa' ? 'rtl' : 'ltr' };
}
