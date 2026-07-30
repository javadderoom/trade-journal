import { prisma } from './services/tradeSync';

async function main() {
  const posts = await prisma.blogPost.findMany();
  let updated = 0;
  for (const post of posts) {
    let changed = false;
    let newCover = post.cover_image;
    let newContent = post.content;
    
    if (newCover && newCover.startsWith('/uploads/')) {
      newCover = newCover.replace('/uploads/', '/api/uploads/');
      changed = true;
    }
    if (newContent && newContent.includes('/uploads/')) {
      newContent = newContent.replace(/\/uploads\//g, '/api/uploads/');
      changed = true;
    }

    if (changed) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { cover_image: newCover, content: newContent }
      });
      updated++;
    }
  }
  console.log(`Updated ${updated} posts.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
