export interface Trade {
  id: string;
  accountId?: string;
  ticket?: number | null;
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
  tags: string[];
  emotion: string | null;
  notes: string | null;
  screenshots?: string[];
  chartData?: any;
  analysisTimeframe?: string | null;
  entryTimeframe?: string | null;
  importSource?: string;
  accountType?: string;
}
