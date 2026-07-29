import { Router, Request, Response } from 'express';
import { prisma } from '../services/tradeSync';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/blog/categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.blogCategory.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/blog/tags
router.get('/tags', async (req: Request, res: Response) => {
  try {
    const tags = await prisma.blogTag.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// GET /api/blog/posts
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const { category, tag, page = '1', limit = '10' } = req.query as { category?: string, tag?: string, page?: string, limit?: string };
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = { status: 'PUBLISHED' };
    
    if (category) {
      where.category = { slug: String(category) };
    }
    
    if (tag) {
      where.tags = { some: { slug: String(tag) } };
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { published_at: 'desc' },
        include: {
          author: { select: { name: true, avatar_url: true } },
          category: true,
          tags: true,
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    res.json({ posts, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/blog/posts/:slug
router.get('/posts/:slug', async (req: Request, res: Response) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: req.params.slug as string },
      include: {
        author: { select: { id: true, name: true, avatar_url: true } },
        category: true,
        tags: true,
        comments: {
          where: { is_approved: true },
          include: {
            user: { select: { name: true, avatar_url: true } },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!post || post.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Increment view count asynchronously
    prisma.blogPost.update({
      where: { id: post.id },
      data: { view_count: { increment: 1 } },
    }).catch(() => {});

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /api/blog/posts/:id/comments
router.post('/posts/:id/comments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    const postId = req.params.id as string;
    const userId = req.user?.userId;

    if (!content || !userId) {
      return res.status(400).json({ error: 'Invalid data' });
    }

    const post = await prisma.blogPost.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await prisma.blogComment.create({
      data: {
        content,
        post_id: postId,
        user_id: userId,
        is_approved: false, // Needs admin approval
      },
    });

    res.status(201).json({ message: 'Comment submitted and waiting for approval', comment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit comment' });
  }
});

export default router;
