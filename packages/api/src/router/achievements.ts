/**
 * Achievements Router
 *
 * Provides tRPC endpoints for querying achievements from the database
 */

import { Achievements, Babies } from '@nugget/db/schema';
import { startOfDay, subDays } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { calculateDailyStreak } from '../services/achievement-calculation';
import { createTRPCRouter, protectedProcedure } from '../trpc';

/**
 * Aggregate multiple daily achievement records into a single achievement object
 * with streak and completion history info
 */
async function aggregateDailyAchievements(
  achievementRecords: Array<typeof Achievements.$inferSelect>,
  babyId: string,
) {
  // Group records by achievementId
  const byAchievementId = new Map<
    string,
    Array<typeof Achievements.$inferSelect>
  >();

  for (const record of achievementRecords) {
    const existing = byAchievementId.get(record.achievementId) || [];
    existing.push(record);
    byAchievementId.set(record.achievementId, existing);
  }

  const today = startOfDay(new Date());
  const weekAgo = subDays(today, 7);

  // Aggregate each achievement
  const aggregated: Array<
    typeof Achievements.$inferSelect & {
      isDaily: boolean;
      dailyStreak?: number;
      lastCompletedDate?: Date | null;
      completionsThisWeek?: number;
    }
  > = [];

  for (const [achievementId, records] of byAchievementId.entries()) {
    // Get the most recent record as the base
    const sortedRecords = [...records].sort((a, b) => {
      const aDate = a.completedDate ? new Date(a.completedDate).getTime() : 0;
      const bDate = b.completedDate ? new Date(b.completedDate).getTime() : 0;
      return bDate - aDate;
    });

    const baseRecord = sortedRecords[0];
    if (!baseRecord) continue;

    // Calculate streak
    const streak = await calculateDailyStreak(babyId, achievementId);

    // Calculate completions this week
    const completionsThisWeek = records.filter((r) => {
      if (!r.completedDate) return false;
      const completed = startOfDay(new Date(r.completedDate));
      return completed >= weekAgo && completed <= today;
    }).length;

    // Get most recent completion date
    const lastCompletedRecord = sortedRecords.find((r) => r.completedDate);
    const lastCompletedDate = lastCompletedRecord?.completedDate
      ? new Date(lastCompletedRecord.completedDate)
      : null;

    // Check if earned today
    const todayRecord = records.find((r) => {
      if (!r.completedDate) return false;
      const completed = startOfDay(new Date(r.completedDate));
      return completed.getTime() === today.getTime();
    });

    aggregated.push({
      ...baseRecord,
      completionsThisWeek,
      dailyStreak: streak,
      earned: todayRecord?.earned ?? false,
      isDaily: true,
      lastCompletedDate,
    });
  }

  return aggregated;
}

export const achievementsRouter = createTRPCRouter({
  /**
   * Get all achievements for a baby
   */
  getByBabyId: protectedProcedure
    .input(
      z.object({
        babyId: z.string(),
        category: z
          .enum([
            'foundation',
            'volume',
            'streaks',
            'activity-specific',
            'efficiency',
            'records',
            'time-based',
            'special',
            'personal-milestones',
            'parent-milestones',
            'daily-achievements',
          ])
          .optional(),
        earned: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Authentication required');
      }

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.babyId),
          eq(Babies.familyId, ctx.auth.orgId),
        ),
      });

      if (!baby) {
        throw new Error('Baby not found or does not belong to your family');
      }

      // Build query conditions
      const conditions = [eq(Achievements.babyId, input.babyId)];

      if (input.category) {
        conditions.push(eq(Achievements.category, input.category));
      }

      if (input.earned !== undefined) {
        conditions.push(eq(Achievements.earned, input.earned));
      }

      // Fetch all achievements
      const allAchievements = await ctx.db.query.Achievements.findMany({
        orderBy: (achievements, { desc }) => [
          // Sort: earned achievements first (by unlock date desc), then unearned (by progress desc)
          desc(achievements.earned),
          desc(achievements.unlockedAt),
          desc(achievements.progress),
        ],
        where: and(...conditions),
      });

      // Separate daily and non-daily achievements
      const dailyRecords = allAchievements.filter(
        (a) => a.category === 'daily-achievements',
      );
      const nonDailyAchievements = allAchievements.filter(
        (a) => a.category !== 'daily-achievements',
      );

      // Aggregate daily achievements
      const aggregatedDaily =
        dailyRecords.length > 0
          ? await aggregateDailyAchievements(dailyRecords, input.babyId)
          : [];

      // Combine and return
      return [...nonDailyAchievements, ...aggregatedDaily];
    }),

  /**
   * List achievements for a baby with optional filters
   */
  list: protectedProcedure
    .input(
      z.object({
        babyId: z.string(),
        category: z
          .enum([
            'foundation',
            'volume',
            'streaks',
            'activity-specific',
            'efficiency',
            'records',
            'time-based',
            'special',
            'personal-milestones',
            'parent-milestones',
            'daily-achievements',
          ])
          .optional(),
        earned: z.boolean().optional(),
        limit: z.number().min(1).max(1000).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Authentication required');
      }

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.babyId),
          eq(Babies.familyId, ctx.auth.orgId),
        ),
      });

      if (!baby) {
        throw new Error('Baby not found or does not belong to your family');
      }

      // Build query conditions
      const conditions = [eq(Achievements.babyId, input.babyId)];

      if (input.category) {
        conditions.push(eq(Achievements.category, input.category));
      }

      if (input.earned !== undefined) {
        conditions.push(eq(Achievements.earned, input.earned));
      }

      // Fetch all achievements
      const allAchievements = await ctx.db.query.Achievements.findMany({
        limit: input.limit ? input.limit * 2 : undefined, // Fetch more to account for daily aggregation
        orderBy: (achievements, { desc }) => [
          // Sort: earned achievements first (by unlock date desc), then unearned (by progress desc)
          desc(achievements.earned),
          desc(achievements.unlockedAt),
          desc(achievements.progress),
        ],
        where: and(...conditions),
      });

      // Separate daily and non-daily achievements
      const dailyRecords = allAchievements.filter(
        (a) => a.category === 'daily-achievements',
      );
      const nonDailyAchievements = allAchievements.filter(
        (a) => a.category !== 'daily-achievements',
      );

      // Aggregate daily achievements
      const aggregatedDaily =
        dailyRecords.length > 0
          ? await aggregateDailyAchievements(dailyRecords, input.babyId)
          : [];

      // Combine and return (apply limit after aggregation since daily achievements are collapsed)
      const combined = [...nonDailyAchievements, ...aggregatedDaily];

      // Re-sort combined results
      combined.sort((a, b) => {
        if (a.earned && !b.earned) return -1;
        if (!a.earned && b.earned) return 1;
        const aDate = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
        const bDate = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
        if (aDate !== bDate) return bDate - aDate;
        return b.progress - a.progress;
      });

      return input.limit ? combined.slice(0, input.limit) : combined;
    }),
});
