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

import { seedDefaultConcepts } from '../services/seedDefaultConcepts';

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

  await seedDefaultConcepts(prisma, user.id);

  console.log(`Successfully seeded generic concepts for the user.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
