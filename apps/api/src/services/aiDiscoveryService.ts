import { getGeminiModel } from '../lib/gemini';
import { prisma } from './tradeSync';

export async function generateTrendingTopic(): Promise<string> {
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

  const model = getGeminiModel('gemini-3.6-flash');
  const result = await model.generateContent(prompt);
  let text = (await result.response).text();
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  const parsed = JSON.parse(text);
  console.log(`[AI Discovery] Selected Topic: ${parsed.topic} (Reason: ${parsed.reason})`);
  
  return parsed.topic;
}

export async function runDailyAIBlogPipeline() {
  console.log('[Cron] Starting Daily AI Blog Pipeline...');
  try {
    // 1. Get an author ID (admin user)
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    // Fallback to any user if no admin found
    const authorId = admin?.id || (await prisma.user.findFirst())?.id;
    if (!authorId) throw new Error('No users found in database to act as author.');

    // 2. Discover Topic
    console.log('[Cron] AI Discovery Phase...');
    const topic = await generateTrendingTopic();

    // 3. Generate Article (with Review Loop)
    console.log(`[Cron] AI Generation Phase for topic: ${topic}...`);
    // Need to import generateBlogArticle inside or at top level to avoid circular dependency
    const { generateBlogArticle } = require('./aiBlogService');
    const post = await generateBlogArticle(topic, authorId);

    console.log(`[Cron] Pipeline Success! Draft saved with ID: ${post.id}`);
  } catch (error) {
    console.error('[Cron] Daily AI Blog Pipeline Failed:', error);
  }
}
