import { z } from 'zod';

const MAX_STRING_LENGTH = 255;
const MAX_NOTES_LENGTH = 5000;
const MAX_SYMBOL_LENGTH = 20;
const MAX_TAG_LENGTH = 50;
const MAX_EMOTION_LENGTH = 100;
const MAX_TIMEFRAME_LENGTH = 10;

export const createTradeSchema = z.object({
  symbol: z.string({ error: 'Symbol must be a string' }).min(1).max(MAX_SYMBOL_LENGTH),
  direction: z.enum(['BUY', 'SELL'], { error: 'Direction must be BUY or SELL' }),
  lotSize: z.number({ error: 'Lot size must be a number' }).positive({ error: 'Lot size must be greater than 0' }),
  openPrice: z.number({ error: 'Open price must be a number' }).positive({ error: 'Open price must be greater than 0' }),
  openTime: z.string({ error: 'Open time must be a string' }).min(1),
  stopLoss: z.number({ error: 'Stop loss must be a number' }).min(0, { error: 'Stop loss cannot be negative' }).nullable().optional(),
  takeProfit: z.number({ error: 'Take profit must be a number' }).min(0, { error: 'Take profit cannot be negative' }).nullable().optional(),
  closePrice: z.number({ error: 'Close price must be a number' }).nullable().optional(),
  closeTime: z.string().nullable().optional(),
  profitUsd: z.number({ error: 'Profit must be a number' }).optional(),
  commission: z.number({ error: 'Commission must be a number' }).optional(),
  swap: z.number({ error: 'Swap must be a number' }).optional(),
  accountId: z.string({ error: 'Account ID must be a string' }).min(1),
  analysisTimeframe: z.string().max(MAX_TIMEFRAME_LENGTH).optional(),
  entryTimeframe: z.string().max(MAX_TIMEFRAME_LENGTH).optional(),
  tags: z.array(z.string().max(MAX_TAG_LENGTH)).optional(),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  emotion: z.string().max(MAX_EMOTION_LENGTH).optional(),
});

export const updateTradeSchema = z.object({
  symbol: z.string({ error: 'Symbol must be a string' }).max(MAX_SYMBOL_LENGTH).optional(),
  direction: z.enum(['BUY', 'SELL'], { error: 'Direction must be BUY or SELL' }).optional(),
  lotSize: z.number({ error: 'Lot size must be a number' }).positive({ error: 'Lot size must be greater than 0' }).optional(),
  openPrice: z.number({ error: 'Open price must be a number' }).positive({ error: 'Open price must be greater than 0' }).optional(),
  openTime: z.string().optional(),
  stopLoss: z.number({ error: 'Stop loss must be a number' }).min(0, { error: 'Stop loss cannot be negative' }).nullable().optional(),
  takeProfit: z.number({ error: 'Take profit must be a number' }).min(0, { error: 'Take profit cannot be negative' }).nullable().optional(),
  closePrice: z.number({ error: 'Close price must be a number' }).nullable().optional(),
  closeTime: z.string().nullable().optional(),
  profitUsd: z.number({ error: 'Profit must be a number' }).optional(),
  commission: z.number({ error: 'Commission must be a number' }).optional(),
  swap: z.number({ error: 'Swap must be a number' }).optional(),
  accountId: z.string({ error: 'Account ID must be a string' }).optional(),
  analysisTimeframe: z.string().max(MAX_TIMEFRAME_LENGTH).optional(),
  entryTimeframe: z.string().max(MAX_TIMEFRAME_LENGTH).optional(),
  tags: z.array(z.string().max(MAX_TAG_LENGTH)).optional(),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  emotion: z.string().max(MAX_EMOTION_LENGTH).optional(),
});

export type CreateTradeInput = z.infer<typeof createTradeSchema>;
export type UpdateTradeInput = z.infer<typeof updateTradeSchema>;
