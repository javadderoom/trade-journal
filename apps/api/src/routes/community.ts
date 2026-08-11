import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { prisma } from '../services/tradeSync';
import { mapTradeToCommunityPreview } from '../services/communityService';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const uploadDir = path.join(__dirname, '../../uploads/community');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

// --- MICRO-POSTS (Feed) ---

// Get Feed
router.get('/feed', optionalAuthenticate, async (req: any, res) => {
    try {
        const { type } = req.query;
        const userId = req.user?.userId || req.user?.id; // Support both standard and extended token formats
        
        let whereClause = {};
        
        if (type === 'following') {
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required for following feed' });
            }
            // Get followed users and symbols
            const userFollows = await prisma.communityFollow.findMany({ where: { followerId: userId } });
            const symbolFollows = await prisma.communitySymbolFollow.findMany({ where: { userId } });
            
            const followedUserIds = userFollows.map(f => f.followingId);
            const followedSymbolIds = symbolFollows.map(f => f.symbolId);

            whereClause = {
                OR: [
                    { authorId: { in: followedUserIds } },
                    { symbols: { some: { symbolId: { in: followedSymbolIds } } } }
                ]
            };
        } else if (req.query.symbol) {
            whereClause = {
                symbols: { some: { symbol: { symbol: (req.query.symbol as string).toUpperCase() } } }
            };
        }

        const posts = await prisma.communityPost.findMany({
            where: whereClause,
            include: {
                author: { select: { id: true, name: true, avatar_url: true } },
                _count: { select: { commentsRel: true, likesRel: true } },
                trade: {
                    include: {
                        annotation: true,
                        setup: { include: { concept: true } }
                    }
                },
                symbols: { include: { symbol: true } },
                media: { orderBy: { sortOrder: 'asc' } },
                ...(userId ? { bookmarks: { where: { userId } } } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        // Add isLikedByMe and isBookmarked to each post
        const enrichedPosts = await Promise.all(posts.map(async (post) => {
            let isLikedByMe = false;
            let isBookmarked = false;

            if (userId) {
                const like = await prisma.communityLike.findUnique({
                    where: { postId_userId: { postId: post.id, userId } }
                });
                isLikedByMe = !!like;
                isBookmarked = (post as any).bookmarks && (post as any).bookmarks.length > 0;
            }

            // Map trades using the mapper
            let mappedTrade = null;
            if (post.trade) {
                mappedTrade = mapTradeToCommunityPreview(post.trade as any);
            }
            
            const { trade, bookmarks, ...postWithoutTrade } = post as any;
            
            if (postWithoutTrade.isAnonymous) {
                postWithoutTrade.author = {
                    id: 'anonymous',
                    name: 'کاربر ناشناس',
                    avatar_url: null
                };
            }
            
            return {
                ...postWithoutTrade,
                trade: mappedTrade,
                // Flatten the symbols structure to make it easier for clients
                symbols: post.symbols.map((ps: any) => ps.symbol),
                isLikedByMe,
                isBookmarked
            };
        }));

        res.json(enrichedPosts);
    } catch (error) {
        console.error("Error fetching feed:", error);
        res.status(500).json({ error: 'Failed to fetch feed' });
    }
});

// Create Post
router.post('/feed', authenticate, async (req: any, res) => {
    try {
        const { content, isAnonymous, media } = req.body;
        const userId = req.user.userId || req.user.id;

        const safeContent = content || '';
        // Simple symbol detection regex
        const rawSymbols = safeContent.match(/\b[A-Z]{3,6}\b/g) || [];
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
                content: safeContent,
                authorId: userId,
                isAnonymous: !!isAnonymous,
                symbols: {
                    create: uniqueSymbols.map(sym => ({
                        symbol: {
                            connect: { symbol: sym }
                        }
                    }))
                },
                media: media && media.length > 0 ? {
                    create: media.map((url: string, idx: number) => ({
                        url,
                        type: 'IMAGE',
                        sortOrder: idx
                    }))
                } : undefined
            },
            include: {
                symbols: { include: { symbol: true } },
                author: { select: { id: true, name: true, avatar_url: true } },
                media: { orderBy: { sortOrder: 'asc' } }
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
        const { content, tradeId, isAnonymous } = req.body;
        const userId = req.user.userId || req.user.id;

        // Verify the trade belongs to the user
        const trade = await prisma.trade.findUnique({
            where: { id: tradeId }
        });

        if (!trade || trade.user_id !== userId) {
            return res.status(404).json({ error: 'Trade not found or you do not have permission' });
        }

        const rawSymbols = [trade.symbol];
        const safeContent = content || '';
        const extraSymbols = safeContent.match(/\b[A-Z]{3,6}\b/g) || [];
        rawSymbols.push(...extraSymbols);
        
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
                isAnonymous: !!isAnonymous,
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

// Upload Media
router.post('/feed/upload-media', authenticate, upload.array('media', 5), async (req: any, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        
        const urls = (req.files as Express.Multer.File[]).map(f => `/uploads/community/${f.filename}`);
        res.json({ urls });
    } catch (error) {
        console.error("Error uploading media:", error);
        res.status(500).json({ error: 'Failed to upload media' });
    }
});

// Get Bookmarks
router.get('/feed/bookmarks', authenticate, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const bookmarks = await prisma.communityBookmark.findMany({
            where: { userId },
            include: {
                post: {
                    include: {
                        author: { select: { id: true, name: true, avatar_url: true } },
                        _count: { select: { commentsRel: true, likesRel: true } },
                        trade: {
                            include: {
                                annotation: true,
                                setup: { include: { concept: true } }
                            }
                        },
                        symbols: { include: { symbol: true } },
                        media: { orderBy: { sortOrder: 'asc' } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const mappedPosts = bookmarks.map((b: any) => {
            const post = b.post;
            let mappedTrade = null;
            if (post.trade) {
                mappedTrade = mapTradeToCommunityPreview(post.trade as any);
            }
            const { trade, ...postWithoutTrade } = post;
            
            if (postWithoutTrade.isAnonymous) {
                postWithoutTrade.author = {
                    id: 'anonymous',
                    name: 'کاربر ناشناس',
                    avatar_url: null
                };
            }
            
            return {
                ...postWithoutTrade,
                trade: mappedTrade,
                symbols: post.symbols.map((ps: any) => ps.symbol),
                isBookmarked: true
            };
        });

        res.json(mappedPosts);
    } catch (error) {
        console.error("Error fetching bookmarks:", error);
        res.status(500).json({ error: 'Failed to fetch bookmarks' });
    }
});

// Toggle Bookmark
router.post('/feed/:id/bookmark', authenticate, async (req: any, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.userId || req.user.id;

        const existing = await prisma.communityBookmark.findUnique({
            where: { userId_postId: { userId, postId: postId } }
        });

        if (existing) {
            await prisma.communityBookmark.delete({
                where: { userId_postId: { userId, postId: postId } }
            });
            res.json({ success: true, bookmarked: false });
        } else {
            await prisma.communityBookmark.create({
                data: { userId, postId: postId }
            });
            res.json({ success: true, bookmarked: true });
        }
    } catch (error) {
        console.error("Error toggling bookmark:", error);
        res.status(500).json({ error: 'Failed to toggle bookmark' });
    }
});

// Like Post
router.post('/feed/:id/like', authenticate, async (req: any, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.userId || req.user.id;

        // upsert relationship
        const like = await prisma.communityLike.upsert({
            where: { postId_userId: { postId: postId, userId } },
            create: { postId: postId, userId },
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
        const userId = req.user.userId || req.user.id;

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

// Report Content
router.post('/feed/report', authenticate, async (req: any, res) => {
    try {
        const { targetId, targetType, reason, note } = req.body;
        const userId = req.user.userId || req.user.id;

        const report = await prisma.communityReport.create({
            data: {
                targetId,
                targetType,
                reason,
                note,
                reporterId: userId
            }
        });

        res.json({ success: true, report });
    } catch (error) {
        console.error("Error reporting content:", error);
        res.status(500).json({ error: 'Failed to report content' });
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
                authorId: req.user.userId || req.user.id
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
        const userId = req.user.userId || req.user.id;

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
        const userId = req.user.userId || req.user.id;

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

// --- FOLLOWS ---

router.post('/follow', authenticate, async (req: any, res) => {
    try {
        const { targetId, targetType } = req.body; // targetType: 'USER' | 'SYMBOL'
        const userId = req.user.userId || req.user.id;

        if (targetType === 'USER') {
            await prisma.communityFollow.upsert({
                where: { followerId_followingId: { followerId: userId, followingId: targetId } },
                create: { followerId: userId, followingId: targetId },
                update: {}
            });
        } else if (targetType === 'SYMBOL') {
            // targetId is likely the string symbol (e.g. BTCUSDT)
            let sym = await prisma.communitySymbol.findUnique({ where: { symbol: targetId } });
            if (!sym) {
                sym = await prisma.communitySymbol.create({ data: { symbol: targetId } });
            }
            await prisma.communitySymbolFollow.upsert({
                where: { userId_symbolId: { userId, symbolId: sym.id } },
                create: { userId, symbolId: sym.id },
                update: {}
            });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Error following:", error);
        res.status(500).json({ error: 'Failed to follow' });
    }
});

router.delete('/follow', authenticate, async (req: any, res) => {
    try {
        const { targetId, targetType } = req.body;
        const userId = req.user.userId || req.user.id;

        if (targetType === 'USER') {
            await prisma.communityFollow.deleteMany({
                where: { followerId: userId, followingId: targetId }
            });
        } else if (targetType === 'SYMBOL') {
            const sym = await prisma.communitySymbol.findUnique({ where: { symbol: targetId } });
            if (sym) {
                await prisma.communitySymbolFollow.deleteMany({
                    where: { userId, symbolId: sym.id }
                });
            }
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Error unfollowing:", error);
        res.status(500).json({ error: 'Failed to unfollow' });
    }
});

router.get('/follow/list', authenticate, async (req: any, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        
        const [users, symbols, categories] = await Promise.all([
            prisma.communityFollow.findMany({
                where: { followerId: userId },
                include: { following: { select: { id: true, name: true, avatar_url: true } } }
            }),
            prisma.communitySymbolFollow.findMany({
                where: { userId },
                include: { symbol: true }
            }),
            prisma.communityCategoryFollow.findMany({
                where: { userId },
                include: { category: true }
            })
        ]);

        res.json({ users, symbols, categories });
    } catch (error) {
        console.error("Error fetching follow list:", error);
        res.status(500).json({ error: 'Failed to fetch follow list' });
    }
});

router.get('/follow/status', authenticate, async (req: any, res) => {
    try {
        const { targetId, targetType } = req.query;
        const userId = req.user.userId || req.user.id;

        let isFollowing = false;
        if (targetType === 'USER') {
            const f = await prisma.communityFollow.findUnique({
                where: { followerId_followingId: { followerId: userId, followingId: targetId as string } }
            });
            isFollowing = !!f;
        } else if (targetType === 'SYMBOL') {
            const sym = await prisma.communitySymbol.findUnique({ where: { symbol: targetId as string } });
            if (sym) {
                const f = await prisma.communitySymbolFollow.findUnique({
                    where: { userId_symbolId: { userId, symbolId: sym.id } }
                });
                isFollowing = !!f;
            }
        }
        res.json({ isFollowing });
    } catch (error) {
        console.error("Error checking follow status:", error);
        res.status(500).json({ error: 'Failed to check status' });
    }
});

router.get('/symbol/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const sym = await prisma.communitySymbol.findUnique({
            where: { symbol: name.toUpperCase() },
            include: {
                _count: { select: { posts: true, followers: true } }
            }
        });
        
        if (!sym) {
            return res.status(404).json({ error: 'Symbol not found' });
        }
        
        res.json(sym);
    } catch (error) {
        console.error("Error fetching symbol:", error);
        res.status(500).json({ error: 'Failed to fetch symbol' });
    }
});

export default router;