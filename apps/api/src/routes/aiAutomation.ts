import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { generateBlogArticle } from '../services/aiBlogService';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

/**
 * Internal-only guard: requires a shared secret in the x-internal-key header.
 * Uses a timing-safe comparison to avoid leaking the key via response timing.
 */
const requireInternalKey = (req: Request, res: Response, next: NextFunction) => {
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected) {
    console.error('[aiAutomation] INTERNAL_API_KEY is not set — endpoint disabled');
    return res.status(503).json({ success: false, error: 'Endpoint not configured' });
  }

  const provided = (req.headers['x-internal-key'] as string) || '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!valid) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
};

// Endpoint: POST /api/internal/ai/blog/generate
router.post(
  '/blog/generate',
  requireInternalKey,
  rateLimit(60 * 60 * 1000, 10), // 10 generations per hour per IP
  async (req, res) => {
    try {
      const { topic, authorId } = req.body;

      if (!topic || !authorId) {
        return res.status(400).json({ success: false, error: 'topic and authorId are required' });
      }

      const post = await generateBlogArticle(topic, authorId);

      return res.json({
        success: true,
        articleId: post.id
      });
    } catch (error: any) {
      console.error('Error generating AI blog:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
