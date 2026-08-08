export interface SymbolConfig {
  name: string;           // Internal name (e.g., "EURUSD")
  provider: 'twelveData' | 'lse';
  twelveSymbol?: string;  // Twelve Data format (e.g., "EUR/USD")
  lseSymbol?: string;     // LSE format (e.g., "EUR/USD")
  category: 'forex' | 'commodity' | 'index' | 'crypto';
}

export const SUPPORTED_SYMBOLS: SymbolConfig[] = [
  // ─── Twelve Data Symbols ──────────────────────────────────────────────────
  // Forex Majors
  { name: 'EURUSD', provider: 'twelveData', twelveSymbol: 'EUR/USD', category: 'forex' },
  { name: 'GBPUSD', provider: 'twelveData', twelveSymbol: 'GBP/USD', category: 'forex' },
  { name: 'USDJPY', provider: 'twelveData', twelveSymbol: 'USD/JPY', category: 'forex' },
  { name: 'USDCHF', provider: 'twelveData', twelveSymbol: 'USD/CHF', category: 'forex' },
  { name: 'AUDUSD', provider: 'twelveData', twelveSymbol: 'AUD/USD', category: 'forex' },
  { name: 'USDCAD', provider: 'twelveData', twelveSymbol: 'USD/CAD', category: 'forex' },
  { name: 'NZDUSD', provider: 'twelveData', twelveSymbol: 'NZD/USD', category: 'forex' },

  // Forex Crosses
  { name: 'EURGBP', provider: 'twelveData', twelveSymbol: 'EUR/GBP', category: 'forex' },
  { name: 'EURJPY', provider: 'twelveData', twelveSymbol: 'EUR/JPY', category: 'forex' },
  { name: 'GBPJPY', provider: 'twelveData', twelveSymbol: 'GBP/JPY', category: 'forex' },
  { name: 'AUDJPY', provider: 'twelveData', twelveSymbol: 'AUD/JPY', category: 'forex' },
  { name: 'CADJPY', provider: 'twelveData', twelveSymbol: 'CAD/JPY', category: 'forex' },
  { name: 'CHFJPY', provider: 'twelveData', twelveSymbol: 'CHF/JPY', category: 'forex' },

  // Commodities
  { name: 'XAUUSD', provider: 'twelveData', twelveSymbol: 'XAU/USD', category: 'commodity' },

  // Crypto
  { name: 'BTCUSD', provider: 'twelveData', twelveSymbol: 'BTC/USD', category: 'crypto' },
  { name: 'ETHUSD', provider: 'twelveData', twelveSymbol: 'ETH/USD', category: 'crypto' },
  { name: 'SOLUSD', provider: 'twelveData', twelveSymbol: 'SOL/USD', category: 'crypto' },
  { name: 'XRPUSD', provider: 'twelveData', twelveSymbol: 'XRP/USD', category: 'crypto' },
  { name: 'ADAUSD', provider: 'twelveData', twelveSymbol: 'ADA/USD', category: 'crypto' },
  { name: 'DOGEUSD', provider: 'twelveData', twelveSymbol: 'DOGE/USD', category: 'crypto' },

  // ─── LSE Symbols (Twelve Data gaps) ──────────────────────────────────────
  { name: 'XAGUSD', provider: 'lse', lseSymbol: 'XAG/USD', category: 'commodity' },
  { name: 'BRENT', provider: 'lse', lseSymbol: 'BCO/USD', category: 'commodity' },
  { name: 'US30', provider: 'lse', lseSymbol: 'US30', category: 'index' },
  { name: 'NAS100', provider: 'lse', lseSymbol: 'NAS100', category: 'index' },
  { name: 'SPX500', provider: 'lse', lseSymbol: 'SPX500', category: 'index' },
];

export const SUPPORTED_TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;

export type Timeframe = typeof SUPPORTED_TIMEFRAMES[number];

export function isCrypto(symbol: string): boolean {
  return SUPPORTED_SYMBOLS.find(s => s.name === symbol)?.category === 'crypto';
}

export function getSymbolConfig(name: string): SymbolConfig | undefined {
  return SUPPORTED_SYMBOLS.find(s => s.name === name);
}

export function getTwelveSymbol(name: string): string | undefined {
  return SUPPORTED_SYMBOLS.find(s => s.name === name)?.twelveSymbol;
}

export function getLseSymbol(name: string): string | undefined {
  return SUPPORTED_SYMBOLS.find(s => s.name === name)?.lseSymbol;
}

export function getSymbolsByProvider(provider: 'twelveData' | 'lse'): SymbolConfig[] {
  return SUPPORTED_SYMBOLS.filter(s => s.provider === provider);
}
