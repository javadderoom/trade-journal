import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../services/tradeSync';
import { z } from 'zod';
import { ConceptRole } from '@prisma/client';

const router = express.Router();

const conceptSchema = z.object({
  name: z.string().min(1).max(50),
  allowed_roles: z.array(z.nativeEnum(ConceptRole)),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
});

// GET /api/trading-concepts
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const concepts = await prisma.tradingConcept.findMany({
      where: { user_id: userId },
      orderBy: { name: 'asc' },
    });
    res.json(concepts);
  } catch (error) {
    console.error('Error fetching concepts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/trading-concepts
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const parsed = conceptSchema.safeParse(req.body);
    
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
      return;
    }

    const { name, allowed_roles, color, icon } = parsed.data;

    const existing = await prisma.tradingConcept.findUnique({
      where: { user_id_name: { user_id: userId, name } }
    });

    if (existing) {
      res.status(409).json({ error: 'Concept with this name already exists' });
      return;
    }

    const concept = await prisma.tradingConcept.create({
      data: {
        user_id: userId,
        name,
        allowed_roles,
        color,
        icon,
      }
    });

    res.status(201).json(concept);
  } catch (error) {
    console.error('Error creating concept:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/trading-concepts/:id
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    
    const parsed = conceptSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
      return;
    }

    const { name, allowed_roles, color, icon } = parsed.data;

    const existing = await prisma.tradingConcept.findFirst({
      where: { id, user_id: userId }
    });

    if (!existing) {
      res.status(404).json({ error: 'Concept not found' });
      return;
    }

    // Check name collision if name changed
    if (name !== existing.name) {
      const nameTaken = await prisma.tradingConcept.findUnique({
        where: { user_id_name: { user_id: userId, name } }
      });
      if (nameTaken) {
        res.status(409).json({ error: 'Concept with this name already exists' });
        return;
      }
    }

    const concept = await prisma.tradingConcept.update({
      where: { id },
      data: {
        name,
        allowed_roles,
        color,
        icon,
      }
    });

    res.json(concept);
  } catch (error) {
    console.error('Error updating concept:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/trading-concepts/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const existing = await prisma.tradingConcept.findFirst({
      where: { id, user_id: userId }
    });

    if (!existing) {
      res.status(404).json({ error: 'Concept not found' });
      return;
    }

    // The foreign keys have onDelete: Cascade, so deleting the concept will remove it from trades
    await prisma.tradingConcept.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting concept:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
