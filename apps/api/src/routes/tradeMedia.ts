import { Router, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { prisma } from '../services/tradeSync';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createMemoryUpload, saveUploadedFile, deleteUploadedFile } from '../utils/storage';

const router = Router();

const upload = createMemoryUpload(10, [/jpeg|jpg|png|gif|webp/]);

/**
 * POST /api/trades/:id/screenshots
 * Uploads a screenshot for a trade and appends its URL to the screenshots list.
 */
router.post('/:id/screenshots', authenticate, upload.single('screenshot'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const trade = await prisma.trade.findFirst({
      where: { id, user_id: userId },
      include: { annotation: true },
    });

    if (!trade) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }

    const screenshotUrl = await saveUploadedFile(req.file, 'screenshots');
    const updatedScreenshots = [...(trade.annotation?.screenshots ?? []), screenshotUrl];

    await prisma.tradeAnnotation.upsert({
      where: { trade_id: id },
      create: { trade_id: id, screenshots: updatedScreenshots },
      update: { screenshots: updatedScreenshots },
    });

    res.status(200).json({ screenshots: updatedScreenshots });
  } catch (err: any) {
    console.error('Screenshot upload error:', err);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * DELETE /api/trades/:id/screenshots
 * Deletes a screenshot for a trade from disk and DB.
 */
router.delete('/:id/screenshots', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: 'Screenshot URL is required' });
      return;
    }

    const trade = await prisma.trade.findFirst({
      where: { id, user_id: userId },
      include: { annotation: true },
    });

    if (!trade) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }

    // Filter out the URL from the screenshots list
    const updatedScreenshots = (trade.annotation?.screenshots ?? []).filter((s: string) => s !== url);

    // Delete the file from blob storage or local filesystem
    await deleteUploadedFile(url);

    await prisma.tradeAnnotation.upsert({
      where: { trade_id: id },
      create: { trade_id: id, screenshots: updatedScreenshots },
      update: { screenshots: updatedScreenshots },
    });

    res.status(200).json({ screenshots: updatedScreenshots });
  } catch (err: any) {
    console.error('Screenshot delete error:', err);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
