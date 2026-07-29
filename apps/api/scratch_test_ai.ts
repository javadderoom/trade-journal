import path from 'node:path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { generateBlogArticle } from './src/services/aiBlogService';
import { prisma } from './src/services/tradeSync';

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No users found in DB');
    process.exit(1);
  }

  console.log('Testing AI generation for topic: RSI Indicator Strategy');
  console.log('Using Author ID:', user.id);

  try {
    const post = await generateBlogArticle('RSI Indicator Strategy', user.id);
    console.log('====================================');
    console.log('✅ Success! Saved Post:', post.id);
    console.log('📌 Title:', post.title);
    console.log('🚀 SEO Score:', post.seo_score);
    console.log('📈 Quality Score:', post.quality_score);
    console.log('⏳ Reading Time:', post.reading_time, 'min');
    console.log('🖼️  Image Prompt:', post.featured_image_prompt);
    console.log('📝 Content Preview:', post.content.substring(0, 150) + '...');
    console.log('====================================');
  } catch (err) {
    console.error('❌ Error during testing:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
