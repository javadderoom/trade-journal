/**
 * Shared trade types used across the API.
 */

/** Import source identifiers */
export type ImportSource = 'MT4_CSV' | 'MT4_HTM' | 'MT5_CSV' | 'MT5_EA';

/** Trade direction */
export type TradeDirection = 'BUY' | 'SELL';

/** Core trade data — used by parsers, EA sync, and API routes */
export interface TradeData {
  ticket?: number;
  symbol: string;
  direction: TradeDirection;
  openTime: string;
  closeTime?: string;
  openPrice: number;
  closePrice?: number;
  lotSize: number;
  stopLoss?: number;
  takeProfit?: number;
  profitUsd: number;
  commission: number;
  swap: number;
  pips?: number;
  rMultiple: number;
}

/** Result from a sync/import operation */
export interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/** Multer file shape (avoids @types/multer dependency) */
export interface MulterFile {
  path: string;
  originalname: string;
  mimetype: string;
  size: number;
}
