import { Router, Response } from 'express';
import { prisma } from '../services/tradeSync';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { runDailyAIBlogPipeline } from '../services/aiDiscoveryService';
import { aiLogger } from '../services/aiLogger';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// ─── Cover Image Upload Setup ─────────────────────────────────────────────
const coverDir = path.join(__dirname, '../../uploads/blogs');
if (!fs.existsSync(coverDir)) {
  fs.mkdirSync(coverDir, { recursive: true });
}

const coverUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = Router();

// Protect all admin blog routes
router.use(authenticate);
router.use(requireAdmin);

// =======================
// Categories
// =======================

router.post('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, description, locale = 'fa', parent_id } = req.body;
    const category = await prisma.blogCategory.create({
      data: { name, slug, description, locale, parent_id: parent_id || null },
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, description, locale, parent_id } = req.body;
    const category = await prisma.blogCategory.update({
      where: { id: req.params.id as string },
      data: { name, slug, description, locale, parent_id: parent_id || null },
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.blogCategory.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// =======================
// Tags
// =======================

router.post('/tags', async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, locale = 'fa' } = req.body;
    const tag = await prisma.blogTag.create({
      data: { name, slug, locale },
    });
    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

router.put('/tags/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, locale } = req.body;
    const tag = await prisma.blogTag.update({
      where: { id: req.params.id as string },
      data: { name, slug, locale },
    });
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

router.delete('/tags/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.blogTag.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// =======================
// Posts
// =======================

router.get('/posts', async (req: AuthRequest, res: Response) => {
  try {
    const { locale = 'fa' } = req.query;
    const posts = await prisma.blogPost.findMany({
      where: { locale: locale as string },
      orderBy: { created_at: 'desc' },
      include: {
        category: true,
        tags: true,
        author: { select: { name: true } },
        translation: { select: { id: true, locale: true } },
        translated_from: { select: { id: true, locale: true } }
      },
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.get('/posts/:id', async (req: AuthRequest, res: Response) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: req.params.id as string },
      include: {
        category: true,
        tags: true,
        translation: { select: { id: true, slug: true, locale: true } },
        translated_from: { select: { id: true, slug: true, locale: true } },
      },
    });
    if (!post) return res.status(404).json({ error: 'Not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

router.post('/upload-image', coverUpload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const webpFilename = `cover_${Date.now()}.webp`;
    const outputPath = path.join(coverDir, webpFilename);

    await sharp(req.file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    const imageUrl = `/api/uploads/blogs/${webpFilename}`;
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Image processing error:', error);
    res.status(500).json({ error: 'Failed to upload and process image' });
  }
});

router.post('/posts/generate-ai', async (req: AuthRequest, res: Response) => {
  try {
    // Run asynchronously to not block the request, or we can await it.
    // Since it takes time, let's run it async and return immediately.
    runDailyAIBlogPipeline().catch(console.error);
    res.json({ message: 'AI Blog generation started in the background.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start AI generation' });
  }
});

router.get('/posts/generate-ai-status', (req: AuthRequest, res: Response) => {
  res.json({
    isRunning: aiLogger.isRunning,
    logs: aiLogger.logs,
  });
});

router.post('/posts', async (req: AuthRequest, res: Response) => {
  try {
    const { 
      title, slug, content, excerpt, cover_image, status, 
      seo_title, seo_description, category_id, tag_ids, locale = 'fa', translation_id,
      featured_image_prompt
    } = req.body;

    const post = await prisma.blogPost.create({
      data: {
        title, slug, content, excerpt, cover_image, status, locale,
        seo_title, seo_description, translation_id, featured_image_prompt,
        author_id: req.user!.userId as string,
        category_id,
        published_at: status === 'PUBLISHED' ? new Date() : null,
        tags: tag_ids ? {
          connect: tag_ids.map((id: string) => ({ id }))
        } : undefined
      },
    });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.put('/posts/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { 
      title, slug, content, excerpt, cover_image, status, 
      seo_title, seo_description, category_id, tag_ids, locale, translation_id,
      featured_image_prompt
    } = req.body;

    const existing = await prisma.blogPost.findUnique({ where: { id: req.params.id as string }});
    const published_at = (status === 'PUBLISHED' && existing?.status !== 'PUBLISHED') 
      ? new Date() 
      : existing?.published_at;

    const post = await prisma.blogPost.update({
      where: { id: req.params.id as string },
      data: {
        title, slug, content, excerpt, cover_image, status, locale,
        seo_title, seo_description, translation_id, featured_image_prompt,
        category_id,
        published_at,
        tags: tag_ids ? {
          set: tag_ids.map((id: string) => ({ id }))
        } : undefined
      },
    });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

router.post('/posts/:id/translate', async (req: AuthRequest, res: Response) => {
  try {
    const originalPost = await prisma.blogPost.findUnique({
      where: { id: req.params.id as string }
    });
    
    if (!originalPost) return res.status(404).json({ error: 'Not found' });

    const newLocale = originalPost.locale === 'fa' ? 'en' : 'fa';
    const newSlug = `${originalPost.slug}-${newLocale}`;

    const newPost = await prisma.blogPost.create({
      data: {
        title: `${originalPost.title} (${newLocale.toUpperCase()})`,
        slug: newSlug,
        content: originalPost.content,
        excerpt: originalPost.excerpt,
        cover_image: originalPost.cover_image,
        status: 'DRAFT',
        locale: newLocale,
        author_id: originalPost.author_id,
        category_id: originalPost.category_id,
        translation_id: originalPost.id,
      }
    });
    
    res.status(201).json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to translate post' });
  }
});

router.delete('/posts/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.blogPost.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// =======================
// Comments Moderation
// =======================

router.get('/comments', async (req: AuthRequest, res: Response) => {
  try {
    const comments = await prisma.blogComment.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        post: { select: { title: true } },
        user: { select: { name: true, email: true } }
      },
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.put('/comments/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const comment = await prisma.blogComment.update({
      where: { id: req.params.id as string },
      data: { is_approved: true },
    });
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve comment' });
  }
});

router.delete('/comments/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.blogComment.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
