import { Router, Response } from 'express';
import { prisma } from '../services/tradeSync';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Protect all admin blog routes
router.use(authenticate);
router.use(requireAdmin);

// =======================
// Categories
// =======================

router.post('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, description } = req.body;
    const category = await prisma.blogCategory.create({
      data: { name, slug, description },
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, description } = req.body;
    const category = await prisma.blogCategory.update({
      where: { id: req.params.id as string },
      data: { name, slug, description },
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
    const { name, slug } = req.body;
    const tag = await prisma.blogTag.create({
      data: { name, slug },
    });
    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tag' });
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
    const posts = await prisma.blogPost.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        category: true,
        author: { select: { name: true } }
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
      },
    });
    if (!post) return res.status(404).json({ error: 'Not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

router.post('/posts', async (req: AuthRequest, res: Response) => {
  try {
    const { 
      title, slug, content, excerpt, cover_image, status, 
      seo_title, seo_description, category_id, tag_ids 
    } = req.body;

    const post = await prisma.blogPost.create({
      data: {
        title, slug, content, excerpt, cover_image, status,
        seo_title, seo_description,
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
      seo_title, seo_description, category_id, tag_ids 
    } = req.body;

    const existing = await prisma.blogPost.findUnique({ where: { id: req.params.id as string }});
    const published_at = (status === 'PUBLISHED' && existing?.status !== 'PUBLISHED') 
      ? new Date() 
      : existing?.published_at;

    const post = await prisma.blogPost.update({
      where: { id: req.params.id as string },
      data: {
        title, slug, content, excerpt, cover_image, status,
        seo_title, seo_description,
        category_id,
        published_at,
        tags: tag_ids ? {
          set: [], // clear existing tags
          connect: tag_ids.map((id: string) => ({ id }))
        } : undefined
      },
    });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update post' });
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
