import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/tradeSync';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

const createEventSchema = z.object({
  type: z.enum(['SESSION_START', 'ANALYSIS', 'SETUP_FOUND', 'ENTRY', 'MANAGEMENT', 'PARTIAL_EXIT', 'EXIT', 'REVIEW']),
  timestamp: z.string().datetime(),
  title: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  metadata: z.any().optional(),
  attachments: z.array(z.string()).optional(),
});

const updateEventSchema = createEventSchema.partial();

// Check trade access middleware
const checkTradeAccess = async (req: AuthRequest, res: Response, next: any) => {
  const { tradeId } = req.params;
  const userId = req.user!.userId;

  try {
    const trade = await prisma.trade.findFirst({
      where: { id: tradeId as string, user_id: userId }
    });

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

router.use(authenticate, checkTradeAccess);

/**
 * GET /api/trades/:tradeId/events
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  const { tradeId } = req.params;
  
  try {
    const events = await prisma.tradeEvent.findMany({
      where: { trade_id: tradeId as string },
      orderBy: { timestamp: 'asc' }
    });
    
    res.status(200).json(events);
  } catch (err) {
    console.error('Fetch trade events error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/trades/:tradeId/events
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  const { tradeId } = req.params;
  
  try {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }
    
    const { type, timestamp, title, description, metadata, attachments } = parsed.data;
    
    const event = await prisma.tradeEvent.create({
      data: {
        trade_id: tradeId as string,
        type,
        timestamp: new Date(timestamp),
        title,
        description,
        metadata: metadata ? metadata : undefined,
        attachments: attachments || [],
      }
    });
    
    res.status(201).json(event);
  } catch (err) {
    console.error('Create trade event error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/trades/:tradeId/events/:eventId
 */
router.put('/:eventId', async (req: AuthRequest, res: Response) => {
  const { tradeId, eventId } = req.params;
  
  try {
    const parsed = updateEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }
    
    const { type, timestamp, title, description, metadata, attachments } = parsed.data;
    
    const existing = await prisma.tradeEvent.findFirst({
      where: { id: eventId as string, trade_id: tradeId as string }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const event = await prisma.tradeEvent.update({
      where: { id: eventId as string },
      data: {
        type: type !== undefined ? type : undefined,
        timestamp: timestamp !== undefined ? new Date(timestamp) : undefined,
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        metadata: metadata !== undefined ? metadata : undefined,
        attachments: attachments !== undefined ? attachments : undefined,
      }
    });
    
    res.status(200).json(event);
  } catch (err) {
    console.error('Update trade event error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/trades/:tradeId/events/:eventId
 */
router.delete('/:eventId', async (req: AuthRequest, res: Response) => {
  const { tradeId, eventId } = req.params;
  
  try {
    const existing = await prisma.tradeEvent.findFirst({
      where: { id: eventId as string, trade_id: tradeId as string }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    await prisma.tradeEvent.delete({
      where: { id: eventId as string }
    });
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Delete trade event error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
