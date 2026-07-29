import { prisma } from './src/services/tradeSync';

async function main() {
  try {
    const logs = await prisma.systemLog.findMany({
      where: { level: 'ERROR' },
      orderBy: { created_at: 'desc' },
      take: 5
    });
    console.log(JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
