export interface Trade {
  id: string;
  accountId?: string;
  ticket?: string | null;
  symbol: string;
  direction: 'BUY' | 'SELL';
  openTime: string;
  closeTime: string | null;
  openPrice: number;
  closePrice: number | null;
  lotSize: number;
  stopLoss: number | null;
  takeProfit: number | null;
  profitUsd: number;
  commission: number;
  swap: number;
  pips: number;
  rMultiple: number;
  annotation?: {
    tags: string[];
    emotion: string | null;
    notes: string | null;
    screenshots: string[];
    analysisTimeframe: string | null;
    entryTimeframe: string | null;
  } | null;
  chartData?: any;
  importSource?: string;
  accountType?: string;
}
