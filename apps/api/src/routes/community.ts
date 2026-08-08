import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../services/tradeSync';
import { mapTradeToCommunityPreview } from '../services/communityService';

const router = Router();

// --- MICRO-POSTS (Feed) ---

// Get Feed
router.get('/feed', async (req, res) => {
    try {
        const posts = await prisma.communityPost.findMany({
            include: {
                author: { select: { id: true, name: true, avatar_url: true } },
                _count: { select: { commentsRel: true, likesRel: true } },
                trade: {
                    include: {
                        annotation: true,
                        setup: { include: { concept: true } }
                    }
                },
                symbols: { include: { symbol: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        // Map trades using the mapper
        const mappedPosts = posts.map((post: any) => {
            let mappedTrade = null;
            if (post.trade) {
                mappedTrade = mapTradeToCommunityPreview(post.trade as any);
            }
            // we remove the original trade and attach the mapped one
            const { trade, ...postWithoutTrade } = post;
            return {
                ...postWithoutTrade,
                trade: mappedTrade,
                // Flatten the symbols structure to make it easier for clients
                symbols: post.symbols.map((ps: any) => ps.symbol)
            };
        });

        res.json(mappedPosts);
    } catch (error) {
        console.error("Error fetching feed:", error);
        res.status(500).json({ error: 'Failed to fetch feed' });
    }
});

// Create Post
router.post('/feed', authenticate, async (req: any, res) => {
    try {
        const { content } = req.body;
        const userId = req.user.id;

        // Simple symbol detection regex
        const rawSymbols = content.match(/\b[A-Z]{3,6}\b/g) || [];
        const uniqueSymbols = [...new Set(rawSymbols)] as string[];

        // create symbols if they don't exist
        for (const sym of uniqueSymbols) {
            await prisma.communitySymbol.upsert({
                where: { symbol: sym },
                create: { symbol: sym },
                update: {}
            });
        }

        const post = await prisma.communityPost.create({
            data: {
                content,
                authorId: userId,
                symbols: {
                    create: uniqueSymbols.map(sym => ({
                        symbol: {
                            connect: { symbol: sym }
                        }
                    }))
                }
            },
            include: {
                symbols: { include: { symbol: true } },
                author: { select: { id: true, name: true, avatar_url: true } }
            }
        });
        
        // Flatten symbols in response
        const responsePost = {
            ...post,
            symbols: post.symbols.map((ps: any) => ps.symbol)
        };

        res.json(responsePost);
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Share Trade to Community
router.post('/feed/trade', authenticate, async (req: any, res) => {
    try {
        const { content, tradeId } = req.body;
        const userId = req.user.id;

        // Verify the trade belongs to the user
        const trade = await prisma.trade.findUnique({
            where: { id: tradeId }
        });

        if (!trade || trade.user_id !== userId) {
            return res.status(404).json({ error: 'Trade not found or you do not have permission' });
        }

        const rawSymbols = [trade.symbol];
        if (content) {
            const extraSymbols = content.match(/\b[A-Z]{3,6}\b/g) || [];
            rawSymbols.push(...extraSymbols);
        }
        const uniqueSymbols = [...new Set(rawSymbols)];

        // Upsert symbols
        for (const sym of uniqueSymbols) {
            await prisma.communitySymbol.upsert({
                where: { symbol: sym },
                create: { symbol: sym },
                update: {}
            });
        }

        const post = await prisma.communityPost.create({
            data: {
                content: content || '',
                authorId: userId,
                tradeId,
                type: 'TRADE_REVIEW',
                symbols: {
                    create: uniqueSymbols.map(sym => ({
                        symbol: {
                            connect: { symbol: sym }
                        }
                    }))
                }
            },
            include: {
                symbols: { include: { symbol: true } },
                author: { select: { id: true, name: true, avatar_url: true } },
                trade: {
                    include: {
                        annotation: true,
                        setup: { include: { concept: true } }
                    }
                }
            }
        });
        
        let mappedTrade = null;
        if (post.trade) {
            mappedTrade = mapTradeToCommunityPreview(post.trade as any);
        }

        const responsePost = {
            ...post,
            trade: mappedTrade,
            symbols: post.symbols.map((ps: any) => ps.symbol)
        };

        res.json(responsePost);

    } catch (error) {
        console.error("Error sharing trade:", error);
        res.status(500).json({ error: 'Failed to share trade' });
    }
});

// Like Post
router.post('/feed/:id/like', authenticate, async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // upsert relationship
        const like = await prisma.communityLike.upsert({
            where: { postId_userId: { postId: id, userId } },
            create: { postId: id, userId },
            update: {}
        });

        res.json({ success: true, like });
    } catch (error) {
        console.error("Error liking post:", error);
        res.status(500).json({ error: 'Failed to like post' });
    }
});

// Get Comments for Post
router.get('/feed/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const comments = await prisma.communityComment.findMany({
            where: { postId: id, parentId: null }, // top-level comments
            include: {
                author: { select: { id: true, name: true, avatar_url: true } },
                replies: {
                    include: {
                        author: { select: { id: true, name: true, avatar_url: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Create Comment
router.post('/feed/:id/comments', authenticate, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { content, parentId } = req.body;
        const userId = req.user.id;

        const comment = await prisma.communityComment.create({
            data: {
                content,
                postId: id,
                authorId: userId,
                parentId: parentId || null
            },
            include: {
                author: { select: { id: true, name: true, avatar_url: true } }
            }
        });

        res.json(comment);
    } catch (error) {
        console.error("Error creating comment:", error);
        res.status(500).json({ error: 'Failed to create comment' });
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
        console.error("Error fetching forum categories:", error);
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
        console.error("Error fetching threads:", error);
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
        console.error("Error creating thread:", error);
        res.status(500).json({ error: 'Failed to create thread' });
    }
});
// Get Single Thread
router.get('/forum/thread/:id', async (req, res) => {
    try {
        const thread = await prisma.forumThread.findUnique({
            where: { id: req.params.id },
            include: {
                author: { select: { id: true, name: true, avatar_url: true } },
                category: true,
                repliesRel: {
                    include: {
                        author: { select: { id: true, name: true, avatar_url: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        
        if (!thread) return res.status(404).json({ error: 'Thread not found' });
        
        // increment views
        prisma.forumThread.update({
            where: { id: req.params.id },
            data: { views: { increment: 1 } }
        }).catch(console.error);

        res.json(thread);
    } catch (error) {
        console.error("Error fetching thread:", error);
        res.status(500).json({ error: 'Failed to fetch thread' });
    }
});

// Reply to Thread
router.post('/forum/thread/:id/reply', authenticate, async (req: any, res) => {
    try {
        const { content } = req.body;
        const threadId = req.params.id;
        const userId = req.user.id;

        const reply = await prisma.forumReply.create({
            data: {
                content,
                threadId,
                authorId: userId
            },
            include: {
                author: { select: { id: true, name: true, avatar_url: true } }
            }
        });

        res.json(reply);
    } catch (error) {
        console.error("Error replying to thread:", error);
        res.status(500).json({ error: 'Failed to reply to thread' });
    }
});

// Mark Solution
router.post('/forum/reply/:replyId/solution', authenticate, async (req: any, res) => {
    try {
        const { replyId } = req.params;
        const userId = req.user.id;

        const reply = await prisma.forumReply.findUnique({
            where: { id: replyId },
            include: { thread: true }
        });

        if (!reply) return res.status(404).json({ error: 'Reply not found' });
        if (reply.thread.authorId !== userId) {
            return res.status(403).json({ error: 'Only thread author can mark a solution' });
        }

        // Unmark previous solution if any, and mark this one
        await prisma.$transaction([
            prisma.forumReply.updateMany({
                where: { threadId: reply.threadId, isSolution: true },
                data: { isSolution: false }
            }),
            prisma.forumReply.update({
                where: { id: replyId },
                data: { isSolution: true }
            })
        ]);

        res.json({ success: true });
    } catch (error) {
        console.error("Error marking solution:", error);
        res.status(500).json({ error: 'Failed to mark solution' });
    }
});

export default router;