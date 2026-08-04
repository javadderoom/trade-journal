import { PrismaClient, ConceptRole } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import * as path from 'path';

config({ path: path.resolve(__dirname, '../../../../.env') });

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const GENERIC_CONCEPTS = [
  // Setups
  { name: 'Trend Continuation', roles: [ConceptRole.SETUP], color: '#3b82f6', icon: 'trending_up' },
  { name: 'Mean Reversion', roles: [ConceptRole.SETUP], color: '#8b5cf6', icon: 'settings_backup_restore' },
  { name: 'Breakout', roles: [ConceptRole.SETUP], color: '#10b981', icon: 'open_in_new' },
  { name: 'Fakeout / Trap', roles: [ConceptRole.SETUP], color: '#ef4444', icon: 'warning' },
  { name: 'Range Play', roles: [ConceptRole.SETUP], color: '#f59e0b', icon: 'swap_horiz' },
  { name: 'News Event', roles: [ConceptRole.SETUP], color: '#6366f1', icon: 'newspaper' },

  // Triggers
  { name: 'Engulfing Candle', roles: [ConceptRole.TRIGGER], color: '#10b981', icon: 'candlestick_chart' },
  { name: 'Pinbar / Rejection', roles: [ConceptRole.TRIGGER], color: '#3b82f6', icon: 'vertical_align_bottom' },
  { name: 'Structure Break (BOS)', roles: [ConceptRole.TRIGGER], color: '#ef4444', icon: 'broken_image' },
  { name: 'MACD Crossover', roles: [ConceptRole.TRIGGER], color: '#8b5cf6', icon: 'timeline' },

  // Confluences
  { name: 'Key Support / Resistance', roles: [ConceptRole.CONFLUENCE], color: '#64748b', icon: 'horizontal_rule' },
  { name: 'Moving Average Bounce', roles: [ConceptRole.CONFLUENCE], color: '#0ea5e9', icon: 'waves' },
  { name: 'Fibonacci Retracement', roles: [ConceptRole.CONFLUENCE], color: '#f43f5e', icon: 'format_align_center' },
  { name: 'VWAP', roles: [ConceptRole.CONFLUENCE], color: '#d946ef', icon: 'show_chart' },
  { name: 'High Volume Node', roles: [ConceptRole.CONFLUENCE], color: '#84cc16', icon: 'bar_chart' }
];

async function main() {
  const userEmail = process.argv[2] || 'deroom24@gmail.com';
  
  let user = await prisma.user.findUnique({
    where: { email: userEmail }
  });

  if (!user) {
    console.log(`User ${userEmail} not found. Creating a default user...`);
    user = await prisma.user.create({
      data: {
        email: userEmail,
        password_hash: 'seed_password', // Should be properly hashed in real scenarios
        name: 'Admin User',
        role: 'ADMIN'
      }
    });
  }

  console.log(`Seeding generic trading concepts for user ${userEmail}...`);

  let added = 0;
  for (const concept of GENERIC_CONCEPTS) {
    try {
      await prisma.tradingConcept.upsert({
        where: {
          user_id_name: {
            user_id: user.id,
            name: concept.name,
          }
        },
        update: {},
        create: {
          user_id: user.id,
          name: concept.name,
          allowed_roles: concept.roles,
          color: concept.color,
          icon: concept.icon,
        }
      });
      added++;
    } catch (error) {
      console.error(`Failed to insert concept: ${concept.name}`, error);
    }
  }

  console.log(`Successfully ensured ${added} generic concepts exist for the user.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
