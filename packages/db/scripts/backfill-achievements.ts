/**
 * Backfill Achievements Script
 *
 * This script calculates and inserts achievements for all existing babies
 * based on their activity history. It can be run as a one-time migration
 * or to update achievements for babies that don't have them yet.
 *
 * Usage:
 *   bun run backfill-achievements
 *   bun run backfill-achievements --baby-id <babyId>  # Backfill for specific baby
 */

import {
  type Achievement,
  getBabyForAchievements,
  upsertAchievements,
} from '@nugget/api/services';
import { startOfDay, subDays } from 'date-fns';
import { eq } from 'drizzle-orm';
// Import calculation functions
// Note: Using dynamic imports to handle cross-package imports
// These functions are in the web-app package, so we use relative paths
// @ts-expect-error - Cross-package import for script execution
import { calculateAchievements } from '../../apps/web-app/src/app/(app)/app/_components/baby-stats-drawer/utils/achievement-calculations';
// @ts-expect-error - Cross-package import for script execution
import { calculateStreaks } from '../../apps/web-app/src/app/(app)/app/_components/baby-stats-drawer/utils/streak-calculations';
import { db } from '../src/client';
import { Activities } from '../src/schema';

async function backfillAchievementsForBaby(babyId: string): Promise<void> {
  console.log(`\n📊 Processing baby: ${babyId}`);

  try {
    // Get baby info
    const babyInfo = await getBabyForAchievements(babyId);
    console.log(`  ✓ Found baby: ${babyInfo.babyId}`);

    // Fetch activities (last 90 days should be enough for most achievements)
    const ninetyDaysAgo = startOfDay(subDays(new Date(), 90));
    const activities = await db.query.Activities.findMany({
      limit: 500,
      where: eq(Activities.babyId, babyId),
    });

    // Filter activities from last 90 days for performance
    const recentActivities = activities.filter(
      (a) => new Date(a.startTime) >= ninetyDaysAgo,
    );

    console.log(
      `  ✓ Found ${recentActivities.length} recent activities (${activities.length} total)`,
    );

    if (recentActivities.length === 0) {
      console.log('  ⚠️  No activities found - skipping');
      return;
    }

    // Calculate totals needed for achievement calculation
    const totalActivities = recentActivities.length;
    const totalVolumeMl = recentActivities
      .filter(
        (a) =>
          (a.type === 'bottle' ||
            a.type === 'nursing' ||
            a.type === 'feeding') &&
          a.amountMl,
      )
      .reduce((sum, a) => sum + (a.amountMl || 0), 0);

    const totalDiapers = recentActivities.filter(
      (a) =>
        a.type === 'diaper' ||
        a.type === 'wet' ||
        a.type === 'dirty' ||
        a.type === 'both',
    ).length;

    // Calculate days tracking
    const sortedActivities = [...recentActivities].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
    const daysTracking = sortedActivities[0]
      ? Math.floor(
          (Date.now() - new Date(sortedActivities[0].startTime).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    // Calculate streaks
    const streaks = calculateStreaks(recentActivities);

    // Calculate all achievements
    const calculatedAchievements = calculateAchievements(
      totalActivities,
      totalVolumeMl,
      totalDiapers,
      daysTracking,
      streaks,
      recentActivities,
      babyInfo.birthDate,
    );

    console.log(`  ✓ Calculated ${calculatedAchievements.length} achievements`);

    // Upsert achievements into database
    const result = await upsertAchievements(
      babyId,
      babyInfo.familyId,
      babyInfo.userId,
      calculatedAchievements,
    );

    const earnedCount = calculatedAchievements.filter(
      (a: Achievement) => a.earned,
    ).length;
    console.log(
      `  ✓ Upserted achievements: ${earnedCount} earned, ${result.newlyUnlocked.length} newly unlocked, ${result.updated} updated`,
    );
  } catch (error) {
    console.error(`  ❌ Error processing baby ${babyId}:`, error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const babyIdArg = args.find((arg) => arg.startsWith('--baby-id='));
  const specificBabyId = babyIdArg?.split('=')[1];

  console.log('🚀 Starting achievement backfill...\n');

  try {
    if (specificBabyId) {
      // Backfill for specific baby
      console.log(`Targeting specific baby: ${specificBabyId}`);
      await backfillAchievementsForBaby(specificBabyId);
    } else {
      // Backfill for all babies
      console.log('Fetching all babies...');
      const allBabies = await db.query.Babies.findMany({
        columns: {
          id: true,
        },
      });

      console.log(`Found ${allBabies.length} babies to process\n`);

      let processed = 0;
      let errors = 0;

      for (const baby of allBabies) {
        try {
          await backfillAchievementsForBaby(baby.id);
          processed++;
        } catch (error) {
          errors++;
          console.error(`Failed to process baby ${baby.id}:`, error);
          // Continue with next baby
        }
      }

      console.log('\n✅ Backfill completed!');
      console.log(`   Processed: ${processed}`);
      console.log(`   Errors: ${errors}`);
    }
  } catch (error) {
    console.error('\n❌ Backfill failed:', error);
    process.exit(1);
  }
}

main();
