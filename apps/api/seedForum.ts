import { prisma } from './src/services/tradeSync';

async function main() {
  const categories = [
    { 
      nameEn: 'Price Action', 
      nameFa: 'پرایس اکشن',
      descriptionEn: 'Discuss pure price action, order blocks, and structure.', 
      descriptionFa: 'بحث درباره پرایس اکشن خالص، اوردر بلاک‌ها و ساختار بازار.',
      order: 1 
    },
    { 
      nameEn: 'Trading Psychology', 
      nameFa: 'روانشناسی معاملات',
      descriptionEn: 'Mental game, discipline, and emotional control.', 
      descriptionFa: 'بازی ذهنی، نظم و کنترل احساسات.',
      order: 2 
    },
    { 
      nameEn: 'Risk Management', 
      nameFa: 'مدیریت ریسک',
      descriptionEn: 'Position sizing, drawdowns, and capital preservation.', 
      descriptionFa: 'اندازه پوزیشن، افت سرمایه و حفظ سرمایه.',
      order: 3 
    },
    { 
      nameEn: 'Strategies & Systems', 
      nameFa: 'استراتژی‌ها و سیستم‌ها',
      descriptionEn: 'Share and discuss specific trading strategies.', 
      descriptionFa: 'اشتراک‌گذاری و بحث درباره استراتژی‌های خاص معاملاتی.',
      order: 4 
    },
    { 
      nameEn: 'Platform & Support', 
      nameFa: 'پلتفرم و پشتیبانی',
      descriptionEn: 'Help with TradeKav, MT4/MT5, and integrations.', 
      descriptionFa: 'کمک درباره تریدکاو، MT4/MT5 و یکپارچه‌سازی‌ها.',
      order: 5 
    },
    { 
      nameEn: 'General Trading', 
      nameFa: 'معاملات عمومی',
      descriptionEn: 'Anything related to trading that doesn\'t fit elsewhere.', 
      descriptionFa: 'هر چیزی مربوط به معاملات که در دسته‌های دیگر نمی‌گنجد.',
      order: 6 
    },
  ];

  for (const cat of categories) {
    // using findFirst because nameEn might not be unique if not set as @unique in schema
    const existing = await prisma.forumCategory.findFirst({
      where: { nameEn: cat.nameEn }
    });

    if (existing) {
      await prisma.forumCategory.update({
        where: { id: existing.id },
        data: cat
      });
      console.log(`Updated category: ${cat.nameEn}`);
    } else {
      await prisma.forumCategory.create({
        data: cat
      });
      console.log(`Created category: ${cat.nameEn}`);
    }
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
