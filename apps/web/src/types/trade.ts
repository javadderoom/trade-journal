export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1' | 'MN1';

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
  maePips?: number | null;
  mfePips?: number | null;
  maePrice?: number | null;
  mfePrice?: number | null;
  maeR?: number | null;
  mfeR?: number | null;
  annotation?: {
    htfBias?: 'BUY' | 'SELL' | null;
    session?: 'ASIA' | 'LONDON' | 'NEW_YORK' | 'OVERLAP' | null;
    analysisTimeframe?: Timeframe | null;
    entryTimeframe?: Timeframe | null;
    thesis?: string | null;
    expectation?: string | null;
    lesson?: string | null;
    conviction?: number | null;
    emotion: string | null;
    notes: string | null;
    screenshots: string[];
  } | null;
  setup?: { concept: { id: string; name: string; color: string | null; icon: string | null } } | null;
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
    entryTimingCorrect: boolean | null;
    emotionsAffected: boolean | null;
    managedAccordingToRules: boolean | null;
  } | null;
  events?: {
    id: string;
    tradeId: string;
    type: 'SESSION_START' | 'ANALYSIS' | 'SETUP_FOUND' | 'ENTRY' | 'MANAGEMENT' | 'PARTIAL_EXIT' | 'EXIT' | 'REVIEW';
    timestamp: string;
    title: string;
    description: string | null;
    metadata: any;
    attachments: string[];
    createdAt: string;
  }[];

  importSource?: string;
  accountType?: string;
}
