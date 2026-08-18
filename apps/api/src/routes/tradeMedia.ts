import { Router, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { prisma } from '../services/tradeSync';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Ensure uploads/screenshots folder exists dynamically
const uploadDir = path.join(__dirname, '../../uploads/screenshots');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${crypto.randomUUID()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // limit 10MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpg, jpeg, png, gif, webp) are allowed'));
  },
});

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
      // Remove uploaded file if trade is not found
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(404).json({ error: 'Trade not found' });
      return;
    }

    const relativeUrl = `/uploads/screenshots/${req.file.filename}`;
    const updatedScreenshots = [...(trade.annotation?.screenshots ?? []), relativeUrl];

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

    // Delete the file from the filesystem if it belongs to this trade's uploads
    if (url.startsWith('/uploads/screenshots/')) {
      const filename = url.replace('/uploads/screenshots/', '');
      const filepath = path.join(__dirname, '../../uploads/screenshots', filename);
      if (fs.existsSync(filepath)) {
        try {
          fs.unlinkSync(filepath);
        } catch (e) {
          console.error(`Failed to delete file from disk: ${filepath}`, e);
        }
      }
    }

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
