import { z } from 'zod';

const MAX_STRING_LENGTH = 255;
const MAX_NOTES_LENGTH = 5000;
const MAX_SYMBOL_LENGTH = 20;
const MAX_TAG_LENGTH = 50;
const MAX_EMOTION_LENGTH = 100;
const MAX_TIMEFRAME_LENGTH = 10;

export const createTradeSchema = z.object({
  symbol: z.string().min(1).max(MAX_SYMBOL_LENGTH),
  direction: z.enum(['BUY', 'SELL']),
  lotSize: z.number().positive(),
  openPrice: z.number().positive(),
  openTime: z.string().min(1),
  stopLoss: z.number().positive().nullable().optional(),
  takeProfit: z.number().positive().nullable().optional(),
  closePrice: z.number().nullable().optional(),
  closeTime: z.string().nullable().optional(),
  profitUsd: z.number().optional(),
  commission: z.number().optional(),
  swap: z.number().optional(),
  accountId: z.string().min(1),
  analysisTimeframe: z.string().max(MAX_TIMEFRAME_LENGTH).optional(),
  entryTimeframe: z.string().max(MAX_TIMEFRAME_LENGTH).optional(),
  tags: z.array(z.string().max(MAX_TAG_LENGTH)).optional(),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  emotion: z.string().max(MAX_EMOTION_LENGTH).optional(),
});

export const updateTradeSchema = z.object({
  symbol: z.string().max(MAX_SYMBOL_LENGTH).optional(),
  direction: z.enum(['BUY', 'SELL']).optional(),
  lotSize: z.number().positive().optional(),
  openPrice: z.number().positive().optional(),
  openTime: z.string().optional(),
  stopLoss: z.number().positive().nullable().optional(),
  takeProfit: z.number().positive().nullable().optional(),
  closePrice: z.number().nullable().optional(),
  closeTime: z.string().nullable().optional(),
  profitUsd: z.number().optional(),
  commission: z.number().optional(),
  swap: z.number().optional(),
  accountId: z.string().optional(),
  analysisTimeframe: z.string().max(MAX_TIMEFRAME_LENGTH).optional(),
  entryTimeframe: z.string().max(MAX_TIMEFRAME_LENGTH).optional(),
  tags: z.array(z.string().max(MAX_TAG_LENGTH)).optional(),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  emotion: z.string().max(MAX_EMOTION_LENGTH).optional(),
});

export type CreateTradeInput = z.infer<typeof createTradeSchema>;
export type UpdateTradeInput = z.infer<typeof updateTradeSchema>;
