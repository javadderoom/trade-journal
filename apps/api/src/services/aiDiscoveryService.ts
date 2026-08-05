import { getGeminiModel } from '../lib/gemini';
import { prisma } from './tradeSync';
import { aiLogger } from './aiLogger';

export async function generateTrendingTopic(modelId: string = 'gemini-3.5-flash'): Promise<string> {
  // Fetch recent posts to avoid duplication
  const recentPosts = await prisma.blogPost.findMany({
    where: { locale: 'en' },
    select: { title: true },
    take: 20,
    orderBy: { created_at: 'desc' }
  });

  const recentTitles = recentPosts.map(p => p.title).join('\n');

  const prompt = `
You are the Head of SEO and Content Strategy for "TradeKav", a premium trading journal platform.
Your job is to brainstorm ONE highly engaging, SEO-optimized blog topic for today.

The topic must be related to: Forex, Crypto, Trading Psychology, Risk Management, Technical Analysis, or Trading Strategies.

CRITICAL RULE: Do NOT suggest a topic similar to any of these recently published articles:
${recentTitles || 'No recent articles.'}

Return ONLY a raw JSON object (without markdown wrappers like \`\`\`json) with this exact structure:
{
  "topic": "The exact H1 title of the proposed article",
  "reason": "Why this topic is highly valuable for SEO right now"
}
`;

  const model = getGeminiModel(modelId);
  const result = await model.generateContent(prompt);
  let text = (await result.response).text();
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  const parsed = JSON.parse(text);
  aiLogger.log(`[AI Discovery] Selected Topic: ${parsed.topic} (Reason: ${parsed.reason})`);
  
  return parsed.topic;
}

export async function runDailyAIBlogPipeline(modelId: string = 'gemini-3.5-flash') {
  if (aiLogger.isRunning) {
    aiLogger.log('[Cron] AI Pipeline is already running, skipped.');
    return;
  }
  
  aiLogger.clear();
  aiLogger.isRunning = true;
  aiLogger.log('[Cron] Starting Daily AI Blog Pipeline...');
  
  try {
    // 1. Get an author ID (admin user)
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    // Fallback to any user if no admin found
    const authorId = admin?.id || (await prisma.user.findFirst())?.id;
    if (!authorId) throw new Error('No users found in database to act as author.');

    // 2. Check for incomplete pipeline runs (English draft without translation)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingDraft = await prisma.blogPost.findFirst({
      where: {
        locale: 'en',
        status: 'DRAFT',
        translation_id: null,
        created_at: { gte: today }
      },
      orderBy: { created_at: 'desc' }
    });

    const { generateBlogArticle, translateBlogArticle } = require('./aiBlogService');
    
    let post = pendingDraft;

    if (pendingDraft) {
      aiLogger.log(`[Cron] Resuming incomplete pipeline for draft ID: ${pendingDraft.id}`);
    } else {
      // 3. Discover Topic
      aiLogger.log('[Cron] AI Discovery Phase...');
      const topic = await generateTrendingTopic(modelId);

      // 4. Generate English Article (with Review Loop)
      aiLogger.log(`[Cron] AI Generation Phase for topic: ${topic}...`);
      post = await generateBlogArticle(topic, authorId, modelId);
      if (!post) throw new Error('Generation returned null');
      aiLogger.log(`[Cron] English Pipeline Success! Draft saved with ID: ${post.id}`);
    }

    if (!post) throw new Error('Post is missing before translation');

    // 5. Translate to Farsi
    aiLogger.log(`[Cron] AI Translation Phase...`);
    const farsiPost = await translateBlogArticle(post.id, 'fa', modelId);
    aiLogger.log(`[Cron] Farsi Pipeline Success! Draft saved with ID: ${farsiPost.id}`);

  } catch (error) {
    aiLogger.log(`[Cron] Daily AI Blog Pipeline Failed: ${error}`);
  } finally {
    aiLogger.log('[Cron] Pipeline Finished.');
    aiLogger.isRunning = false;
  }
}
