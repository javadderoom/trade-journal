import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../services/tradeSync';

const router = Router();

// --- MICRO-POSTS (Feed) ---

// Get Feed
router.get('/feed', async (req, res) => {
    try {
        const posts = await prisma.communityPost.findMany({
            include: {
                author: { select: { id: true, name: true, avatar_url: true } },
                _count: { select: { comments: true, likesRel: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch feed' });
    }
});

// Create Post
router.post('/feed', authenticate, async (req: any, res) => {
    try {
        const { content } = req.body;
        const userId = req.user.id;

        // Simple symbol detection regex
        const symbols = content.match(/\b[A-Z]{3,6}\b/g) || [];
        const uniqueSymbols = [...new Set(symbols)];

        const post = await prisma.communityPost.create({
            data: {
                content,
                authorId: userId,
                symbols: uniqueSymbols
            }
        });
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Like Post
router.post('/feed/:id/like', authenticate, async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await prisma.communityLike.upsert({
            where: { postId_userId: { postId: id, userId } },
            create: { postId: id, userId },
            update: {}
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to like post' });
    }
});

// --- FORUM ---

// Get Categories
router.get('/forum/categories', async (req, res) => {
    try {
        const categories = await prisma.forumCategory.findMany({
            include: { _count: { select: { threads: true } } },
            orderBy: { order: 'asc' }
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Get Threads by Category
router.get('/forum/category/:id', async (req, res) => {
    try {
        const threads = await prisma.forumThread.findMany({
            where: { categoryId: req.params.id },
            include: {
                author: { select: { id: true, name: true } },
                _count: { select: { repliesRel: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(threads);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch threads' });
    }
});

// Create Thread
router.post('/forum/thread', authenticate, async (req: any, res) => {
    try {
        const { title, content, categoryId } = req.body;
        const thread = await prisma.forumThread.create({
            data: {
                title,
                content,
                categoryId,
                authorId: req.user.id
            }
        });
        res.json(thread);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create thread' });
    }
});

export default router;