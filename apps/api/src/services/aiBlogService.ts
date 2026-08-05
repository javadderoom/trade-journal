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
A category can be a main topic (e.g. "Trading Education") or a specific sub-category under a parent (e.g. parent: "Trading Education", sub: "Price Action").
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
  "category": { "name": "...", "slug": "..." }, // The main category you chose or created
  "sub_category": { "name": "...", "slug": "..." }, // Optional: A sub-category under the main category. Leave null if not needed.
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
      
      if (currentDraft) {
        aiLogger.log(`[AI Blog] Saving partial draft to avoid losing progress...`);
        currentDraft.seo_score = 0;
        currentDraft.quality_score = 0;
        break;
      }
      
      if (attempts >= MAX_ATTEMPTS) throw new Error('AI Generation failed after max attempts');
    }
  }

  // Handle Category
  let categorySlug = currentDraft.category?.slug || 'trading-education';
  let categoryName = currentDraft.category?.name || 'Trading Education';
  
  let parentCategory = await prisma.blogCategory.findFirst({
    where: { slug: categorySlug }
  });

  if (!parentCategory) {
    parentCategory = await prisma.blogCategory.create({
      data: {
        name: categoryName,
        slug: categorySlug,
        locale: 'en'
      }
    });
  }

  let targetCategoryId = parentCategory.id;

  // Handle Sub-category
  if (currentDraft.sub_category?.name && currentDraft.sub_category?.slug) {
    let subCategory = await prisma.blogCategory.findFirst({
      where: { slug: currentDraft.sub_category.slug }
    });

    if (!subCategory) {
      subCategory = await prisma.blogCategory.create({
        data: {
          name: currentDraft.sub_category.name,
          slug: currentDraft.sub_category.slug,
          locale: 'en',
          parent_id: parentCategory.id
        }
      });
    }
    // If it exists but doesn't have the correct parent, we can optionally update it,
    // but for now just assign the post to the sub-category
    targetCategoryId = subCategory.id;
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
      category_id: targetCategoryId,
      locale: 'en',
      tags: tagIds.length > 0 ? {
        connect: tagIds.map(id => ({ id }))
      } : undefined
    }
  });

  return newPost;
}

// Phase 3 (Bonus): Auto-translate Article
export async function translateBlogArticle(originalPostId: string, targetLocale: string = 'fa') {
  const original = await prisma.blogPost.findUnique({
    where: { id: originalPostId },
    include: {
      category: { include: { parent: true } },
      tags: true
    }
  });

  if (!original) {
    throw new Error('Original post not found.');
  }

  if (original.locale === targetLocale) {
    throw new Error('Original post is already in the target locale.');
  }

  const isToFarsi = targetLocale === 'fa';
  const sourceLang = isToFarsi ? 'English' : 'Farsi (Persian)';
  const targetLang = isToFarsi ? 'Farsi (Persian)' : 'English';

  aiLogger.log(`[AI Blog] Translating article ${original.title} to ${targetLang}...`);

  let categoryContext = '';
  if (original.category) {
    if (original.category.parent) {
      categoryContext = `${sourceLang} Main Category: "${original.category.parent.name}" (slug: ${original.category.parent.slug})\n${sourceLang} Sub-Category: "${original.category.name}" (slug: ${original.category.slug})`;
    } else {
      categoryContext = `${sourceLang} Main Category: "${original.category.name}" (slug: ${original.category.slug})\n${sourceLang} Sub-Category: None`;
    }
  } else {
    categoryContext = `${sourceLang} Main Category: None\n${sourceLang} Sub-Category: None`;
  }

  const tagsContext = original.tags.length > 0
    ? `${sourceLang} Tags:\n${original.tags.map((t: any) => `- "${t.name}" (slug: ${t.slug})`).join('\n')}`
    : `${sourceLang} Tags: None`;

  const prompt = `
You are an expert ${targetLang} translator and financial market specialist.
Your task is to translate the following ${sourceLang} trading article into highly professional and natural-sounding ${targetLang}.
CRITICAL RULES:
1. Preserve all HTML tags exactly as they are (e.g., <p>, <h2>, <a>, <strong>). Do NOT alter the HTML structure.
2. Translate the text inside the HTML tags.
3. Keep technical trading terms (like RSI, MACD, Support, Resistance) either in English or their well-accepted equivalents.

${sourceLang} Title: ${original.title}
${sourceLang} Excerpt: ${original.excerpt}

${sourceLang} HTML Content:
${original.content}

CATEGORY AND TAGS TRANSLATION:
You must translate the EXACT categories and tags used in the ${sourceLang} article. Do not invent new ones or leave any out.
${categoryContext}
${tagsContext}
For the ${targetLang} slugs, you MUST use the exact ${sourceLang} slug but ${isToFarsi ? 'appended with "-fa"' : 'without the "-fa" suffix or appended with "-en"'}. For example, if translating to Farsi and the english slug is "crypto", it MUST be "crypto-fa". If translating to English and the Farsi slug is "crypto-fa", it MUST be "crypto".

Return ONLY a raw JSON object (without markdown wrappers like \`\`\`json) with this exact structure:
{
  "title": "...", // The translated ${targetLang} H1 title
  "slug": "...", // Provide a brief english slug representing the title (for URL routing)
  "excerpt": "...", // The translated ${targetLang} excerpt
  "seo_title": "...", // The translated ${targetLang} SEO title
  "seo_description": "...", // The translated ${targetLang} SEO description
  "content": "...", // The full translated HTML article
  "category": { "name": "...", "slug": "..." }, // The exact translated main category. Null if none.
  "sub_category": { "name": "...", "slug": "..." }, // The exact translated sub-category. Null if none.
  "tags": [ { "name": "...", "slug": "..." } ] // The exact translated tags matching the ${sourceLang} ones
}
`;

  const model = getGeminiModel('gemini-3.5-flash');
  const result = await model.generateContent(prompt);
  let text = (await result.response).text();
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  const draft = JSON.parse(text);

  // Handle Category
  let categorySlug = draft.category?.slug || (isToFarsi ? 'trading-education-fa' : 'trading-education');
  let categoryName = draft.category?.name || (isToFarsi ? 'آموزش ترید' : 'Trading Education');
  
  let parentCategory = await prisma.blogCategory.findFirst({
    where: { slug: categorySlug }
  });

  if (!parentCategory) {
    parentCategory = await prisma.blogCategory.create({
      data: {
        name: categoryName,
        slug: categorySlug,
        locale: targetLocale
      }
    });
  }

  let targetCategoryId = parentCategory.id;

  // Handle Sub-category
  if (draft.sub_category?.name && draft.sub_category?.slug) {
    let subCategory = await prisma.blogCategory.findFirst({
      where: { slug: draft.sub_category.slug }
    });

    if (!subCategory) {
      subCategory = await prisma.blogCategory.create({
        data: {
          name: draft.sub_category.name,
          slug: draft.sub_category.slug,
          locale: targetLocale,
          parent_id: parentCategory.id
        }
      });
    }
    targetCategoryId = subCategory.id;
  }

  // Handle Tags
  const tagIds: string[] = [];
  if (draft.tags && Array.isArray(draft.tags)) {
    for (const tagData of draft.tags) {
      if (!tagData.slug || !tagData.name) continue;
      
      let tag = await prisma.blogTag.findFirst({
        where: { slug: tagData.slug }
      });

      if (!tag) {
        tag = await prisma.blogTag.create({
          data: {
            name: tagData.name,
            slug: tagData.slug,
            locale: targetLocale
          }
        });
      }
      tagIds.push(tag.id);
    }
  }

  const newPost = await prisma.blogPost.create({
    data: {
      title: draft.title,
      slug: draft.slug + '-' + Date.now().toString().slice(-4),
      content: draft.content,
      excerpt: draft.excerpt,
      seo_title: draft.seo_title,
      seo_description: draft.seo_description,
      seo_score: original.seo_score,
      quality_score: original.quality_score,
      reading_time: original.reading_time,
      featured_image_prompt: original.featured_image_prompt,
      cover_image: original.cover_image, // Copy cover image from original
      status: 'DRAFT',
      author_id: original.author_id,
      category_id: targetCategoryId,
      locale: targetLocale,
      translation_id: original.id, // Link to the English post
      tags: tagIds.length > 0 ? {
        connect: tagIds.map(id => ({ id }))
      } : undefined
    }
  });

  // Link original post back to new post
  await prisma.blogPost.update({
    where: { id: original.id },
    data: { translation_id: newPost.id }
  });

  console.log(`[AI Blog] Translation successful! ${targetLang} post ID: ${newPost.id}`);
  return newPost;
}

export async function generateSocialCopy(title: string, content: string, locale: string): Promise<string> {
  const isEn = locale === 'en';
  const prompt = `
You are an expert Social Media Manager for a Trading Journal platform.
Your task is to write a highly engaging, click-worthy social media post (for Twitter and LinkedIn) based on the following blog article.

Article Title: ${title}
Article Content (HTML):
${content}

RULES:
1. ${isEn ? 'Write entirely in English.' : 'Write entirely in Farsi (Persian).'}
2. It must be a short, punchy hook that makes traders want to read the full article.
3. Use 2-3 relevant emojis.
4. Keep the ENTIRE text under 220 characters so it fits on Twitter (we will automatically append the link at the end).
5. Do NOT include a URL or placeholder like [Link here]. We handle that.
6. Do NOT wrap your response in quotes.
`;

  const model = getGeminiModel('gemini-3.5-flash');
  const result = await model.generateContent(prompt);
  let text = (await result.response).text();
  return text.trim();
}
