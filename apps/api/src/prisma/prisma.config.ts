import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';

// Load .env from project root (4 levels up from apps/api/src/prisma/)
const envPath = path.resolve(__dirname, '..', '..', '..', '..', '.env');
config({ path: envPath });

export default defineConfig({
  schema: path.join(__dirname, 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
