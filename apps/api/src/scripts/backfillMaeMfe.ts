import { prisma } from '../services/tradeSync';
import { calculateMaeMfe } from '../services/maeMfeService';

async function backfillMaeMfe() {
  console.log('🚀 Starting MAE, MFE & Exit Efficiency backfill...');

  // Find all trades missing excursion metrics
  const tradesToBackfill = await prisma.trade.findMany({
    where: {
      OR: [
        { mae_pips: null },
        { mfe_pips: null },
        { exit_efficiency_pct: null },
      ],
    },
    select: {
      id: true,
      symbol: true,
      direction: true,
      open_price: true,
      close_price: true,
      stop_loss: true,
      take_profit: true,
      pips: true,
      r_multiple: true,
    },
  });

  console.log(`📊 Found ${tradesToBackfill.length} historical trades to backfill.`);

  let updatedCount = 0;

  for (const trade of tradesToBackfill) {
    const result = calculateMaeMfe({
      direction: trade.direction as 'BUY' | 'SELL',
      openPrice: trade.open_price,
      closePrice: trade.close_price ?? trade.open_price,
      stopLoss: trade.stop_loss,
      takeProfit: trade.take_profit,
      realizedR: trade.r_multiple,
      symbol: trade.symbol,
    });

    await prisma.trade.update({
      where: { id: trade.id },
      data: {
        mae_pips: result.mae_pips,
        mfe_pips: result.mfe_pips,
        mae_price: result.mae_price,
        mfe_price: result.mfe_price,
        mae_r: result.mae_r,
        mfe_r: result.mfe_r,
        exit_efficiency_pct: result.exit_efficiency_pct,
        money_left_on_table_r: result.money_left_on_table_r,
      },
    });

    updatedCount++;
    if (updatedCount % 50 === 0 || updatedCount === tradesToBackfill.length) {
      console.log(`✅ Processed ${updatedCount}/${tradesToBackfill.length} trades...`);
    }
  }

  console.log(`🎉 Backfill completed successfully! Total updated trades: ${updatedCount}`);
}

backfillMaeMfe()
  .catch((err) => {
    console.error('❌ Backfill failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
