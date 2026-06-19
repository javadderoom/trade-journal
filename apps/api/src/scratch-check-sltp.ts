import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5433/trade_journal?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const trades = await prisma.trade.findMany({
    orderBy: { open_time: 'desc' },
    take: 10,
  });

  console.log(`Found ${trades.length} trades:`);
  for (const t of trades) {
    console.log(`-----------------------------------`);
    console.log(`Ticket: ${t.ticket}`);
    console.log(`Symbol: ${t.symbol}`);
    console.log(`Open Time: ${t.open_time.toISOString()}`);
    console.log(`Close Time: ${t.close_time ? t.close_time.toISOString() : 'OPEN'}`);
    console.log(`Stop Loss (SL): ${t.stop_loss}`);
    console.log(`Take Profit (TP): ${t.take_profit}`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
