import { getGeminiModel } from '../lib/gemini';
import { prisma } from './tradeSync'; // reusing prisma instance

// Phase 2: SEO Review Agent
async function reviewArticle(parsedArticle: any, topic: string) {
  const prompt = `
You are a ruthless SEO Editor and Trading Expert.
Review this drafted article about "${topic}".
Evaluate its HTML structure, tone, readability, accuracy, and SEO keyword density.

Article:
${JSON.stringify(parsedArticle, null, 2)}

Return ONLY a raw JSON object (without markdown wrappers like \`\`\`json) with this exact structure:
{
  "seo_score": 85,
  "quality_score": 88,
  "feedback": "Your detailed feedback on what needs to be improved if the score is below 90. If it's perfect, say 'Perfect'.",
  "approved": false
}
`;

  const model = getGeminiModel('gemini-3.6-flash');
  const result = await model.generateContent(prompt);
  let text = (await result.response).text();
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  return JSON.parse(text);
}

// Phase 1 + 2: Generation with Internal Links & Revision Loop
export async function generateBlogArticle(topic: string, authorId: string) {
  // Phase 2: Internal Linking Engine
  const existingPosts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED', locale: 'en' },
    select: { title: true, slug: true },
    take: 10,
    orderBy: { published_at: 'desc' }
  });
  
  const internalLinksContext = existingPosts.length > 0 
    ? `\nYou must naturally include internal links to some of these existing articles using HTML <a> tags. 
       Use this URL format: href="/en/blog/[slug]"
       Available articles:
       ${existingPosts.map(p => `- Title: "${p.title}" (slug: ${p.slug})`).join('\n')}`
    : '';

  const model = getGeminiModel('gemini-3.6-flash');
  let currentDraft: any = null;
  let attempts = 0;
  const MAX_ATTEMPTS = 3;
  let feedback = '';

  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    console.log(`[AI Blog] Generation attempt ${attempts}/${MAX_ATTEMPTS} for topic: ${topic}`);

    const prompt = `
You are an expert trading blogger and SEO specialist for "TradeKav" (a trading journal platform).
Write a comprehensive, highly SEO-optimized blog article about: "${topic}".
The article must be high quality, beginner-friendly but professional, and around 1500 words.
Use clean HTML for the content (<h1>, <h2>, <h3>, <ul>, <li>, <p>, <strong>). Do NOT use markdown.
${internalLinksContext}
${feedback ? `\nPREVIOUS FEEDBACK TO IMPROVE UPON: ${feedback}` : ''}

Return ONLY a raw JSON object (without any markdown formatting like \`\`\`json) with this exact structure:
{
  "title": "...", // The H1 title
  "slug": "...", // SEO friendly url slug in english
  "content": "...", // The full HTML article
  "excerpt": "...", // A 2 sentence meta description
  "reading_time": 10, // Estimated reading time in minutes
  "featured_image_prompt": "..." // A prompt for an AI image generator to create the cover
}
`;

    try {
      const result = await model.generateContent(prompt);
      let text = (await result.response).text();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      currentDraft = JSON.parse(text);

      // Phase 2: Critic Review
      console.log(`[AI Blog] Reviewing draft...`);
      const review = await reviewArticle(currentDraft, topic);
      
      console.log(`[AI Blog] Review Results - SEO: ${review.seo_score}, Quality: ${review.quality_score}`);
      
      if (review.approved || attempts >= MAX_ATTEMPTS) {
        // Add the final scores to the draft
        currentDraft.seo_score = review.seo_score;
        currentDraft.quality_score = review.quality_score;
        console.log(`[AI Blog] Draft approved!`);
        break; // Exit the loop
      } else {
        feedback = review.feedback;
        console.log(`[AI Blog] Draft rejected. Feedback: ${feedback}`);
      }
    } catch (error) {
      console.error(`[AI Blog] Attempt ${attempts} failed:`, error);
      if (attempts >= MAX_ATTEMPTS) throw new Error('AI Generation failed after max attempts');
    }
  }

  // Fallback category
  let category = await prisma.blogCategory.findFirst({
    where: { slug: 'trading-education' }
  });

  if (!category) {
    category = await prisma.blogCategory.create({
      data: {
        name: 'Trading Education',
        slug: 'trading-education',
        locale: 'en'
      }
    });
  }

  const newPost = await prisma.blogPost.create({
    data: {
      title: currentDraft.title,
      slug: currentDraft.slug + '-' + Date.now().toString().slice(-4),
      content: currentDraft.content,
      excerpt: currentDraft.excerpt,
      seo_title: currentDraft.title,
      seo_description: currentDraft.excerpt,
      seo_score: currentDraft.seo_score,
      quality_score: currentDraft.quality_score,
      reading_time: currentDraft.reading_time,
      featured_image_prompt: currentDraft.featured_image_prompt,
      status: 'DRAFT',
      author_id: authorId,
      category_id: category.id,
      locale: 'en'
    }
  });

  return newPost;
}
