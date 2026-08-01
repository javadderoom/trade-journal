import { getGeminiModel } from '../lib/gemini';
import { prisma } from './tradeSync'; // reusing prisma instance
import { aiLogger } from './aiLogger';

// Phase 2: SEO Review Agent
async function reviewArticle(parsedArticle: any, topic: string) {
  const prompt = `
You are a ruthless SEO Editor and Trading Expert.
Review this drafted article about "${topic}".
1. Check SEO optimization, keyword density, and heading structure (H1, H2, H3).
2. Check content quality, readability, and depth.
3. TONE AND HUMANIZATION CHECK: Strictly check if the writing sounds like a generic AI. Heavily penalize the score if you see clichés like: "In today's fast-paced world", "delve into", "furthermore", "in conclusion", or robotic transitions. The tone must be direct, punchy, and sound like a seasoned human trader.

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

  const model = getGeminiModel('gemini-3.5-flash');
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
  
  const existingCategories = await prisma.blogCategory.findMany({
    where: { locale: 'en' },
    select: { name: true, slug: true }
  });

  const existingTags = await prisma.blogTag.findMany({
    where: { locale: 'en' },
    select: { name: true, slug: true }
  });

  const internalLinksContext = existingPosts.length > 0 
    ? `\nYou must naturally include internal links to some of these existing articles using HTML <a> tags. 
       Use this URL format: href="/en/blog/[slug]"
       Available articles:
       ${existingPosts.map(p => `- Title: "${p.title}" (slug: ${p.slug})`).join('\n')}`
    : '';

  const categoryTagContext = `
You must also categorize this article and provide 3-5 tags.
You can either choose from the existing lists below or create entirely new ones if none are a perfect fit.
Existing Categories:
${existingCategories.length > 0 ? existingCategories.map(c => `- ${c.name} (slug: ${c.slug})`).join('\n') : 'None'}
Existing Tags:
${existingTags.length > 0 ? existingTags.map(t => `- ${t.name} (slug: ${t.slug})`).join('\n') : 'None'}
`;

  const model = getGeminiModel('gemini-3.5-flash');
  let currentDraft: any = null;
  let attempts = 0;
  const MAX_ATTEMPTS = 3;
  let feedback = '';

  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    aiLogger.log(`[AI Blog] Generation attempt ${attempts}/${MAX_ATTEMPTS} for topic: ${topic}`);

    const prompt = `
You are an expert trading blogger and SEO specialist for "TradeKav" (a trading journal platform).
Write a comprehensive, highly SEO-optimized blog article about: "${topic}".
The article must be high quality, beginner-friendly but professional, and around 1500 words.

CRITICAL TONE RULES (HUMANIZE YOUR WRITING):
- Do NOT use typical AI clichés or robotic transitions like: "In today's fast-paced world", "Delve into", "Furthermore", "In conclusion", "It's important to note", "A testament to".
- Write like a seasoned, battle-tested trader talking to a peer. Use a conversational, punchy, and direct tone.
- Use varied sentence lengths. Make some sentences very short for impact.
- Start paragraphs directly with the point, without filler intro sentences.

Use clean HTML for the content (<h1>, <h2>, <h3>, <ul>, <li>, <p>, <strong>). Do NOT use markdown.
${internalLinksContext}
${categoryTagContext}
${feedback ? `\nPREVIOUS FEEDBACK TO IMPROVE UPON: ${feedback}` : ''}

Return ONLY a raw JSON object (without any markdown formatting like \`\`\`json) with this exact structure:
{
  "title": "...", // The H1 title
  "slug": "...", // SEO friendly url slug in english
  "content": "...", // The full HTML article
  "excerpt": "...", // A 2 sentence meta description
  "reading_time": 10, // Estimated reading time in minutes
  "featured_image_prompt": "...", // A prompt for an AI image generator to create the cover
  "category": { "name": "...", "slug": "..." }, // The category you chose or created
  "tags": [ { "name": "...", "slug": "..." }, ... ] // 3 to 5 tags you chose or created
}
`;

    try {
      const result = await model.generateContent(prompt);
      let text = (await result.response).text();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      currentDraft = JSON.parse(text);

      // Phase 2: Critic Review
      aiLogger.log(`[AI Blog] Reviewing draft...`);
      const review = await reviewArticle(currentDraft, topic);
      
      aiLogger.log(`[AI Blog] Review Results - SEO: ${review.seo_score}, Quality: ${review.quality_score}`);
      
      if (review.approved || attempts >= MAX_ATTEMPTS) {
        // Add the final scores to the draft
        currentDraft.seo_score = review.seo_score;
        currentDraft.quality_score = review.quality_score;
        aiLogger.log(`[AI Blog] Draft approved!`);
        break; // Exit the loop
      } else {
        feedback = review.feedback;
        aiLogger.log(`[AI Blog] Draft rejected. Feedback: ${feedback}`);
      }
    } catch (error) {
      aiLogger.log(`[AI Blog] Attempt ${attempts} failed: ${error}`);
      if (attempts >= MAX_ATTEMPTS) throw new Error('AI Generation failed after max attempts');
    }
  }

  // Handle Category
  let categorySlug = currentDraft.category?.slug || 'trading-education';
  let categoryName = currentDraft.category?.name || 'Trading Education';
  
  let category = await prisma.blogCategory.findFirst({
    where: { slug: categorySlug }
  });

  if (!category) {
    category = await prisma.blogCategory.create({
      data: {
        name: categoryName,
        slug: categorySlug,
        locale: 'en'
      }
    });
  }

  // Handle Tags
  const tagIds: string[] = [];
  if (currentDraft.tags && Array.isArray(currentDraft.tags)) {
    for (const tagData of currentDraft.tags) {
      if (!tagData.slug || !tagData.name) continue;
      
      let tag = await prisma.blogTag.findFirst({
        where: { slug: tagData.slug }
      });

      if (!tag) {
        tag = await prisma.blogTag.create({
          data: {
            name: tagData.name,
            slug: tagData.slug,
            locale: 'en'
          }
        });
      }
      tagIds.push(tag.id);
    }
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
      locale: 'en',
      tags: tagIds.length > 0 ? {
        connect: tagIds.map(id => ({ id }))
      } : undefined
    }
  });

  return newPost;
}

// Phase 3 (Bonus): Auto-translate English to Farsi
export async function translateBlogArticle(originalPostId: string) {
  const original = await prisma.blogPost.findUnique({
    where: { id: originalPostId }
  });

  if (!original || original.locale !== 'en') {
    throw new Error('Original post not found or is not in English.');
  }

  aiLogger.log(`[AI Blog] Translating article ${original.title} to Farsi...`);

  const existingCategories = await prisma.blogCategory.findMany({
    where: { locale: 'fa' },
    select: { name: true, slug: true }
  });

  const existingTags = await prisma.blogTag.findMany({
    where: { locale: 'fa' },
    select: { name: true, slug: true }
  });

  const prompt = `
You are an expert Farsi (Persian) translator and financial market specialist.
Your task is to translate the following English trading article into highly professional and natural-sounding Persian.
CRITICAL RULES:
1. Preserve all HTML tags exactly as they are (e.g., <p>, <h2>, <a>, <strong>). Do NOT alter the HTML structure.
2. Translate the text inside the HTML tags.
3. Keep technical trading terms (like RSI, MACD, Support, Resistance) either in English or their well-accepted Farsi equivalents (e.g. حمایت و مقاومت).

English Title: ${original.title}
English Excerpt: ${original.excerpt}

English HTML Content:
${original.content}

You must also categorize this Farsi article and provide 3-5 tags.
You can either choose from the existing Farsi lists below or translate the English ones.
If you create new slugs for Farsi categories/tags, you MUST append "-fa" to the end of the slug to ensure uniqueness in the database (e.g. "psychology-fa").
Existing Farsi Categories:
${existingCategories.length > 0 ? existingCategories.map(c => `- ${c.name} (slug: ${c.slug})`).join('\n') : 'None'}
Existing Farsi Tags:
${existingTags.length > 0 ? existingTags.map(t => `- ${t.name} (slug: ${t.slug})`).join('\n') : 'None'}

Return ONLY a raw JSON object (without markdown wrappers like \`\`\`json) with this exact structure:
{
  "title": "...", // The translated Farsi H1 title
  "slug": "...", // Provide a brief english slug representing the farsi title (for URL routing)
  "excerpt": "...", // The translated Farsi excerpt
  "seo_title": "...", // The translated Farsi SEO title
  "seo_description": "...", // The translated Farsi SEO description
  "content": "...", // The full translated HTML article
  "category": { "name": "...", "slug": "..." }, // The Farsi category you chose or created
  "tags": [ { "name": "...", "slug": "..." }, ... ] // 3 to 5 Farsi tags you chose or created
}
`;

  const model = getGeminiModel('gemini-3.5-flash');
  const result = await model.generateContent(prompt);
  let text = (await result.response).text();
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  const farsiDraft = JSON.parse(text);

  // Handle Category
  let categorySlug = farsiDraft.category?.slug || 'trading-education-fa';
  let categoryName = farsiDraft.category?.name || 'آموزش ترید';
  
  let category = await prisma.blogCategory.findFirst({
    where: { slug: categorySlug }
  });

  if (!category) {
    category = await prisma.blogCategory.create({
      data: {
        name: categoryName,
        slug: categorySlug,
        locale: 'fa'
      }
    });
  }

  // Handle Tags
  const tagIds: string[] = [];
  if (farsiDraft.tags && Array.isArray(farsiDraft.tags)) {
    for (const tagData of farsiDraft.tags) {
      if (!tagData.slug || !tagData.name) continue;
      
      let tag = await prisma.blogTag.findFirst({
        where: { slug: tagData.slug }
      });

      if (!tag) {
        tag = await prisma.blogTag.create({
          data: {
            name: tagData.name,
            slug: tagData.slug,
            locale: 'fa'
          }
        });
      }
      tagIds.push(tag.id);
    }
  }

  const newPost = await prisma.blogPost.create({
    data: {
      title: farsiDraft.title,
      slug: farsiDraft.slug + '-' + Date.now().toString().slice(-4),
      content: farsiDraft.content,
      excerpt: farsiDraft.excerpt,
      seo_title: farsiDraft.seo_title,
      seo_description: farsiDraft.seo_description,
      seo_score: original.seo_score,
      quality_score: original.quality_score,
      reading_time: original.reading_time,
      featured_image_prompt: original.featured_image_prompt,
      status: 'DRAFT',
      author_id: original.author_id,
      category_id: category.id,
      locale: 'fa',
      translation_id: original.id, // Link to the English post
      tags: tagIds.length > 0 ? {
        connect: tagIds.map(id => ({ id }))
      } : undefined
    }
  });

  // Link English post back to Farsi post
  await prisma.blogPost.update({
    where: { id: original.id },
    data: { translation_id: newPost.id }
  });

  console.log(`[AI Blog] Translation successful! Farsi post ID: ${newPost.id}`);
  return newPost;
}
