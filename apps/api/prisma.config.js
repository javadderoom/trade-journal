const path = require('node:path');
const { defineConfig } = require('prisma/config');
const { config } = require('dotenv');

// Load .env from project root
const envPath = path.resolve(__dirname, '../../.env');
config({ path: envPath });

module.exports = defineConfig({
  schema: path.join(__dirname, 'src/prisma/schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
