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
    htfBias?: 'BUY' | 'SELL' | null;
    session?: 'ASIA' | 'LONDON' | 'NEW_YORK' | 'OVERLAP' | null;
    thesis?: string | null;
    expectation?: string | null;
    lesson?: string | null;
    conviction?: number | null;
    emotion: string | null;
    notes: string | null;
    screenshots: string[];
  } | null;
  setups?: { concept: { id: string; name: string; color: string | null; icon: string | null } }[];
  triggers?: { concept: { id: string; name: string; color: string | null; icon: string | null } }[];
  confluences?: { concept: { id: string; name: string; color: string | null; icon: string | null } }[];
  plan?: {
    maxRisk: number | null;
    expectedRr: number | null;
    entryCondition: string | null;
    invalidation: string | null;
    targetZone: string | null;
    expectedHoldTime: string | null;
    planFollowed: boolean | null;
  } | null;
  chartData?: any;
  importSource?: string;
  accountType?: string;
}
