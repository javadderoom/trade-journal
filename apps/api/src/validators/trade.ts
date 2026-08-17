import { z } from 'zod';
import { Direction, TradingSession, Timeframe, MarketCondition } from '@prisma/client';

const MAX_STRING_LENGTH = 255;
const MAX_NOTES_LENGTH = 5000;
const MAX_SYMBOL_LENGTH = 20;
const MAX_EMOTION_LENGTH = 100;

const tradePlanSchema = z.object({
  maxRisk: z.number().nullable().optional(),
  expectedRr: z.number().nullable().optional(),
  entryCondition: z.string().nullable().optional(),
  invalidation: z.string().nullable().optional(),
  targetZone: z.string().nullable().optional(),
  expectedHoldTime: z.string().nullable().optional(),
  planFollowed: z.boolean().nullable().optional(),
  entryTimingCorrect: z.boolean().nullable().optional(),
  emotionsAffected: z.boolean().nullable().optional(),
  managedAccordingToRules: z.boolean().nullable().optional(),
});

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
  
  // New structured rationale
  htfBias: z.nativeEnum(Direction).nullable().optional(),
  session: z.nativeEnum(TradingSession).nullable().optional(),
  marketCondition: z.nativeEnum(MarketCondition).nullable().optional(),
  analysisTimeframe: z.nativeEnum(Timeframe).nullable().optional(),
  entryTimeframe: z.nativeEnum(Timeframe).nullable().optional(),
  thesis: z.string().max(MAX_NOTES_LENGTH).nullable().optional(),
  expectation: z.string().max(MAX_NOTES_LENGTH).nullable().optional(),
  lesson: z.string().max(MAX_NOTES_LENGTH).nullable().optional(),
  conviction: z.number().min(1).max(5).nullable().optional(),
  notes: z.string().max(MAX_NOTES_LENGTH).nullable().optional(),
  emotion: z.string().max(MAX_EMOTION_LENGTH).nullable().optional(),
  
  setupId: z.string().nullable().optional(),
  triggerIds: z.array(z.string()).optional(),
  confluenceIds: z.array(z.string()).optional(),
  plan: tradePlanSchema.optional(),
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

  // New structured rationale
  htfBias: z.nativeEnum(Direction).nullable().optional(),
  session: z.nativeEnum(TradingSession).nullable().optional(),
  marketCondition: z.nativeEnum(MarketCondition).nullable().optional(),
  analysisTimeframe: z.nativeEnum(Timeframe).nullable().optional(),
  entryTimeframe: z.nativeEnum(Timeframe).nullable().optional(),
  thesis: z.string().max(MAX_NOTES_LENGTH).nullable().optional(),
  expectation: z.string().max(MAX_NOTES_LENGTH).nullable().optional(),
  lesson: z.string().max(MAX_NOTES_LENGTH).nullable().optional(),
  conviction: z.number().min(1).max(5).nullable().optional(),
  notes: z.string().max(MAX_NOTES_LENGTH).nullable().optional(),
  emotion: z.string().max(MAX_EMOTION_LENGTH).nullable().optional(),
  
  setupId: z.string().nullable().optional(),
  triggerIds: z.array(z.string()).nullable().optional(),
  confluenceIds: z.array(z.string()).nullable().optional(),
  plan: tradePlanSchema.nullable().optional(),
});

export type CreateTradeInput = z.infer<typeof createTradeSchema>;
export type UpdateTradeInput = z.infer<typeof updateTradeSchema>;

