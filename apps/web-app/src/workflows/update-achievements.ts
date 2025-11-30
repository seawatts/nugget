/**
 * Vercel Workflow to update achievements for a baby
 *
 * This workflow recalculates and upserts achievements when activities are created/updated.
 * It runs asynchronously in the background to avoid blocking activity operations.
 */

import { getApi } from '@nugget/api/server';
import {
  getBabyForAchievements,
  upsertAchievements,
} from '@nugget/api/services';
import type { Activities } from '@nugget/db/schema';
import { startOfDay, subDays } from 'date-fns';
import type { Achievement } from '../app/(app)/app/_components/baby-stats-drawer/types';
import { calculateAchievements } from '../app/(app)/app/_components/baby-stats-drawer/utils/achievement-calculations';
import { calculateDailyAchievements } from '../app/(app)/app/_components/baby-stats-drawer/utils/daily-achievement-calculations';
import { calculateStreaks } from '../app/(app)/app/_components/baby-stats-drawer/utils/streak-calculations';

interface UpdateAchievementsInput {
  babyId: string;
}

interface UpdateAchievementsResult {
  success: boolean;
  newlyUnlocked: Array<string>;
  updated: number;
  error?: string;
}

/**
 * Step function to fetch activities and calculate achievements
 * Marked with 'use step' for automatic retries
 */
async function fetchAndCalculateAchievements(babyId: string) {
  'use step';

  // Get baby information
  const babyInfo = await getBabyForAchievements(babyId);

  // Get API instance for fetching activities
  const api = await getApi();

  // Fetch activities for the baby (last 90 days should be enough for most achievements)
  const ninetyDaysAgo = startOfDay(subDays(new Date(), 90));
  const activities = await api.activities.list({
    babyId,
    limit: 500,
    since: ninetyDaysAgo,
  });

  // Calculate totals needed for achievement calculation
  const totalActivities = activities.length;
  const totalVolumeMl = activities
    .filter(
      (a) =>
        (a.type === 'bottle' || a.type === 'nursing' || a.type === 'feeding') &&
        a.amountMl,
    )
    .reduce((sum, a) => sum + (a.amountMl || 0), 0);

  const totalDiapers = activities.filter(
    (a) =>
      a.type === 'diaper' ||
      a.type === 'wet' ||
      a.type === 'dirty' ||
      a.type === 'both',
  ).length;

  // Calculate days tracking
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
  const daysTracking = sortedActivities[0]
    ? Math.floor(
        (Date.now() - new Date(sortedActivities[0].startTime).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  // Calculate streaks
  const streaks = calculateStreaks(
    activities as Array<typeof Activities.$inferSelect>,
  );

  // Calculate all achievements (non-daily)
  const calculatedAchievements = calculateAchievements(
    totalActivities,
    totalVolumeMl,
    totalDiapers,
    daysTracking,
    streaks,
    activities as Array<typeof Activities.$inferSelect>,
    babyInfo.birthDate,
  );

  // Calculate daily achievements separately (they include completedDate)
  const dailyAchievementsWithDate = calculateDailyAchievements(
    activities as Array<typeof Activities.$inferSelect>,
  );

  // Combine all achievements for upsert
  // Daily achievements already have completedDate set
  const allAchievementsWithDates = [
    ...calculatedAchievements.map((ach) => ({
      ...ach,
      completedDate: null as Date | null,
    })),
    ...dailyAchievementsWithDate.map((ach) => ({
      ...ach,
      completedDate: ach.completedDate || null,
    })),
  ];

  return {
    babyInfo,
    calculatedAchievements: allAchievementsWithDates,
  };
}

/**
 * Step function to upsert achievements into database
 */
async function saveAchievements(
  babyId: string,
  familyId: string,
  userId: string,
  calculatedAchievements: Array<Achievement & { completedDate?: Date | null }>,
) {
  'use step';

  const result = await upsertAchievements(
    babyId,
    familyId,
    userId,
    calculatedAchievements,
  );

  return result;
}

/**
 * Workflow to update achievements for a baby
 *
 * This workflow:
 * 1. Fetches all activities for the baby (last 90 days for performance)
 * 2. Calculates achievements based on activities
 * 3. Upserts achievements into the database
 *
 * Marked with 'use workflow' to make it durable and reliable
 */
export async function updateAchievements(
  input: UpdateAchievementsInput,
): Promise<UpdateAchievementsResult> {
  'use workflow';

  try {
    const { babyId } = input;

    // Step 1: Fetch activities and calculate achievements
    const { babyInfo, calculatedAchievements } =
      await fetchAndCalculateAchievements(babyId);

    // Step 2: Save achievements to database
    const result = await saveAchievements(
      babyId,
      babyInfo.familyId,
      babyInfo.userId,
      calculatedAchievements,
    );

    return {
      newlyUnlocked: result.newlyUnlocked,
      success: true,
      updated: result.updated,
    };
  } catch (error) {
    console.error('Error updating achievements:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      newlyUnlocked: [],
      success: false,
      updated: 0,
    };
  }
}
