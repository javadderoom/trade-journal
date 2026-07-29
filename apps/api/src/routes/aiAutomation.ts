import { Router } from 'express';
import { generateBlogArticle } from '../services/aiBlogService';

const router = Router();

// Endpoint: POST /api/internal/ai/blog/generate
router.post('/blog/generate', async (req, res) => {
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
});

export default router;
