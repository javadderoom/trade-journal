import { ConceptRole } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const GENERIC_CONCEPTS = [
  // Setups (6)
  { name: 'Trend Continuation', roles: [ConceptRole.SETUP], color: '#3b82f6', icon: 'trending_up' },
  { name: 'Mean Reversion', roles: [ConceptRole.SETUP], color: '#8b5cf6', icon: 'settings_backup_restore' },
  { name: 'Breakout', roles: [ConceptRole.SETUP], color: '#10b981', icon: 'open_in_new' },
  { name: 'Fakeout / Trap', roles: [ConceptRole.SETUP], color: '#ef4444', icon: 'warning' },
  { name: 'Range Play', roles: [ConceptRole.SETUP], color: '#f59e0b', icon: 'swap_horiz' },
  { name: 'News Event', roles: [ConceptRole.SETUP], color: '#6366f1', icon: 'newspaper' },

  // Triggers (4)
  { name: 'Engulfing Candle', roles: [ConceptRole.TRIGGER], color: '#10b981', icon: 'candlestick_chart' },
  { name: 'Pinbar / Rejection', roles: [ConceptRole.TRIGGER], color: '#3b82f6', icon: 'vertical_align_bottom' },
  { name: 'Structure Break (BOS)', roles: [ConceptRole.TRIGGER], color: '#ef4444', icon: 'broken_image' },
  { name: 'MACD Crossover', roles: [ConceptRole.TRIGGER], color: '#8b5cf6', icon: 'timeline' },

  // Confluences (5)
  { name: 'Key Support / Resistance', roles: [ConceptRole.CONFLUENCE], color: '#64748b', icon: 'horizontal_rule' },
  { name: 'Moving Average Bounce', roles: [ConceptRole.CONFLUENCE], color: '#0ea5e9', icon: 'waves' },
  { name: 'Fibonacci Retracement', roles: [ConceptRole.CONFLUENCE], color: '#f43f5e', icon: 'format_align_center' },
  { name: 'VWAP', roles: [ConceptRole.CONFLUENCE], color: '#d946ef', icon: 'show_chart' },
  { name: 'High Volume Node', roles: [ConceptRole.CONFLUENCE], color: '#84cc16', icon: 'bar_chart' },
];

/**
 * Seeds the default set of generic trading concepts for a user.
 * Uses upsert to be idempotent — safe to call multiple times.
 */
export async function seedDefaultConcepts(prisma: PrismaClient, userId: string): Promise<void> {
  for (const concept of GENERIC_CONCEPTS) {
    try {
      await prisma.tradingConcept.upsert({
        where: {
          user_id_name: {
            user_id: userId,
            name: concept.name,
          },
        },
        update: {},
        create: {
          user_id: userId,
          name: concept.name,
          allowed_roles: concept.roles,
          color: concept.color,
          icon: concept.icon,
        },
      });
    } catch (error) {
      // Log but don't fail — individual concept insert failures shouldn't block signup
      console.error(`Failed to seed concept "${concept.name}" for user ${userId}:`, error);
    }
  }
}

export { GENERIC_CONCEPTS };
