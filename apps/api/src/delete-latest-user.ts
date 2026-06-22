import 'dotenv/config';
import { prisma } from './services/tradeSync';

async function main() {
  const latestUser = await prisma.user.findFirst({
    orderBy: { created_at: 'desc' },
  });

  if (!latestUser) {
    console.log('No users found in database.');
    return;
  }

  console.log(`Found latest user: ${latestUser.name || 'N/A'} (${latestUser.email})`);
  
  // Clean up associated records that don't have cascade delete
  const deletedAccounts = await prisma.account.deleteMany({
    where: { user_id: latestUser.id },
  });
  console.log(`Deleted ${deletedAccounts.count} associated accounts.`);

  const deletedJournals = await prisma.journalEntry.deleteMany({
    where: { user_id: latestUser.id },
  });
  console.log(`Deleted ${deletedJournals.count} associated journal entries.`);

  const deletedSubscriptions = await prisma.subscription.deleteMany({
    where: { user_id: latestUser.id },
  });
  console.log(`Deleted ${deletedSubscriptions.count} associated subscriptions.`);

  const deletedImports = await prisma.importJob.deleteMany({
    where: { user_id: latestUser.id },
  });
  console.log(`Deleted ${deletedImports.count} associated import jobs.`);

  const deletedTrades = await prisma.trade.deleteMany({
    where: { user_id: latestUser.id },
  });
  console.log(`Deleted ${deletedTrades.count} associated trades.`);

  // Delete the user itself (cascades refresh_tokens, tags, emotions)
  await prisma.user.delete({
    where: { id: latestUser.id },
  });

  console.log(`Successfully deleted user: ${latestUser.name || 'N/A'} (${latestUser.email})`);
  
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
