const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.candleCache.deleteMany({}).then(() => console.log('Cache cleared successfully')).catch(console.error).finally(() => process.exit(0));
