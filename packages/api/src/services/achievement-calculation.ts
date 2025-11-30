/**
 * Achievement Calculation Service
 *
 * This service handles upserting achievements into the database.
 * Calculation logic should be done in the caller (workflow) since
 * it has access to the UI package functions.
 */

import { db } from '@nugget/db/client';
import { Achievements, Babies } from '@nugget/db/schema';
import { startOfDay } from 'date-fns';
import { and, eq, gte, isNotNull, lt } from 'drizzle-orm';

// Type definitions matching the achievement system
export type AchievementCategory =
  | 'foundation'
  | 'volume'
  | 'streaks'
  | 'activity-specific'
  | 'efficiency'
  | 'records'
  | 'time-based'
  | 'special'
  | 'personal-milestones'
  | 'parent-milestones'
  | 'daily-achievements';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  category: AchievementCategory;
  description?: string;
  earned: boolean;
  icon: string;
  id: string;
  name: string;
  progress: number;
  rarity: AchievementRarity;
  target: number;
  unlockedAt?: Date | null;
  completedDate?: Date | null; // Optional - used for daily achievements to track which day
}

export interface AchievementUpdateResult {
  newlyUnlocked: Array<string>; // Achievement IDs that were just unlocked
  updated: number; // Number of achievements updated/inserted
}

/**
 * Upsert achievements for a baby into the database
 * Returns newly unlocked achievement IDs
 *
 * For daily achievements: Creates new record each day when earned (doesn't update existing records)
 * For non-daily achievements: Updates or inserts single record
 */
export async function upsertAchievements(
  babyId: string,
  familyId: string,
  userId: string,
  calculatedAchievements: Array<Achievement>,
): Promise<AchievementUpdateResult> {
  const newlyUnlocked: Array<string> = [];
  let updatedCount = 0;
  const today = startOfDay(new Date());

  // Separate daily and non-daily achievements
  const dailyAchievements = calculatedAchievements.filter(
    (a) => a.category === 'daily-achievements',
  );
  const nonDailyAchievements = calculatedAchievements.filter(
    (a) => a.category !== 'daily-achievements',
  );

  // Handle non-daily achievements (existing logic)
  if (nonDailyAchievements.length > 0) {
    // Fetch all existing achievements for this baby (excluding daily achievements for today)
    const allExisting = await db.query.Achievements.findMany({
      where: eq(Achievements.babyId, babyId),
    });

    // Filter to non-daily achievements (daily achievements have category='daily-achievements')
    const nonDailyExisting = allExisting.filter(
      (a) => a.category !== 'daily-achievements',
    );

    const existingMap = new Map(
      nonDailyExisting.map((a) => [a.achievementId, a]),
    );

    for (const achievement of nonDailyAchievements) {
      const existing = existingMap.get(achievement.id);
      const wasEarned = existing?.earned ?? false;
      const isNowEarned = achievement.earned;
      const wasJustUnlocked = !wasEarned && isNowEarned;

      if (wasJustUnlocked) {
        newlyUnlocked.push(achievement.id);
      }

      // Check if anything changed
      const hasChanges =
        !existing ||
        existing.earned !== achievement.earned ||
        existing.progress !== achievement.progress ||
        existing.name !== achievement.name ||
        existing.description !== (achievement.description || null) ||
        existing.icon !== achievement.icon ||
        existing.category !== achievement.category ||
        existing.rarity !== achievement.rarity ||
        existing.target !== achievement.target ||
        (achievement.earned &&
          !existing.unlockedAt &&
          achievement.unlockedAt) ||
        (existing.unlockedAt &&
          achievement.unlockedAt &&
          new Date(existing.unlockedAt).getTime() !==
            new Date(achievement.unlockedAt).getTime());

      if (!hasChanges) {
        continue; // No changes, skip update
      }

      const unlockedAt = isNowEarned
        ? achievement.unlockedAt || new Date()
        : null;

      if (existing) {
        // Update existing achievement (non-daily)
        await db
          .update(Achievements)
          .set({
            category: achievement.category,
            completedDate: null, // Non-daily achievements have null completedDate
            description: achievement.description || null,
            earned: achievement.earned,
            icon: achievement.icon,
            name: achievement.name,
            progress: achievement.progress,
            rarity: achievement.rarity,
            target: achievement.target,
            unlockedAt,
            updatedAt: new Date(),
          })
          .where(eq(Achievements.id, existing.id));

        updatedCount++;
      } else {
        // Insert new achievement (non-daily)
        await db.insert(Achievements).values({
          achievementId: achievement.id,
          babyId,
          category: achievement.category,
          completedDate: null, // Non-daily achievements have null completedDate
          description: achievement.description || null,
          earned: achievement.earned,
          familyId,
          icon: achievement.icon,
          name: achievement.name,
          progress: achievement.progress,
          rarity: achievement.rarity,
          target: achievement.target,
          unlockedAt,
          userId,
        });

        updatedCount++;
      }
    }
  }

  // Handle daily achievements (new logic - insert new record per day)
  if (dailyAchievements.length > 0) {
    // Fetch existing daily achievements for today
    const todayStart = startOfDay(new Date());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const existingTodayDaily = await db.query.Achievements.findMany({
      where: and(
        eq(Achievements.babyId, babyId),
        eq(Achievements.category, 'daily-achievements'),
        gte(Achievements.completedDate, todayStart),
        lt(Achievements.completedDate, tomorrowStart),
      ),
    });

    const existingTodayMap = new Map(
      existingTodayDaily.map((a) => [a.achievementId, a]),
    );

    for (const achievement of dailyAchievements) {
      // Only insert if earned today and record doesn't exist for today
      if (!achievement.earned) {
        continue; // Don't insert if not earned
      }

      const completedDate = achievement.completedDate || today; // Use provided completedDate or default to today
      const completedDateStart = startOfDay(completedDate);

      // Check if record already exists for today
      const existingToday = existingTodayMap.get(achievement.id);
      if (existingToday) {
        continue; // Already have a record for today, skip
      }

      // Check if this achievement was just unlocked (first time earning today)
      const wasJustUnlocked = !existingToday;
      if (wasJustUnlocked) {
        newlyUnlocked.push(achievement.id);
      }

      // Insert new daily achievement record for today
      await db.insert(Achievements).values({
        achievementId: achievement.id,
        babyId,
        category: achievement.category,
        completedDate: completedDateStart,
        description: achievement.description || null,
        earned: true,
        familyId,
        icon: achievement.icon,
        name: achievement.name,
        progress: achievement.progress,
        rarity: achievement.rarity,
        target: achievement.target,
        unlockedAt: achievement.unlockedAt || completedDateStart,
        userId,
      });

      updatedCount++;
    }
  }

  return {
    newlyUnlocked,
    updated: updatedCount,
  };
}

/**
 * Fetch baby information needed for achievement calculation
 */
export async function getBabyForAchievements(babyId: string) {
  const baby = await db.query.Babies.findFirst({
    where: eq(Babies.id, babyId),
  });

  if (!baby) {
    throw new Error(`Baby with id ${babyId} not found`);
  }

  return {
    babyId: baby.id,
    birthDate: baby.birthDate ? new Date(baby.birthDate) : null,
    familyId: baby.familyId,
    userId: baby.userId,
  };
}

/**
 * Get completion history for a daily achievement
 * Returns array of completion dates for the specified number of days
 */
export async function getDailyCompletionHistory(
  babyId: string,
  achievementId: string,
  days = 30,
): Promise<Date[]> {
  const startDate = startOfDay(new Date());
  startDate.setDate(startDate.getDate() - days);

  const completions = await db.query.Achievements.findMany({
    orderBy: (achievements, { desc }) => [desc(achievements.completedDate)],
    where: and(
      eq(Achievements.babyId, babyId),
      eq(Achievements.achievementId, achievementId),
      eq(Achievements.category, 'daily-achievements'),
      isNotNull(Achievements.completedDate), // Only include records with completedDate set
      gte(Achievements.completedDate, startDate),
    ),
  });

  return completions
    .map((a) => (a.completedDate ? new Date(a.completedDate) : null))
    .filter((date): date is Date => date !== null)
    .sort((a, b) => b.getTime() - a.getTime()); // Most recent first
}

/**
 * Calculate current streak for a daily achievement
 * Returns the number of consecutive days the achievement was completed, starting from today
 */
export async function calculateDailyStreak(
  babyId: string,
  achievementId: string,
): Promise<number> {
  const completions = await getDailyCompletionHistory(
    babyId,
    achievementId,
    30,
  );
  if (completions.length === 0) return 0;

  // Sort by date descending (most recent first)
  const sortedCompletions = completions.sort(
    (a, b) => b.getTime() - a.getTime(),
  );

  // Check if most recent completion is today or yesterday
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const mostRecent = sortedCompletions[0];
  if (!mostRecent) return 0;

  const mostRecentDay = startOfDay(mostRecent);
  const daysDiff = Math.floor(
    (today.getTime() - mostRecentDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  // If most recent completion is not today or yesterday, streak is broken
  if (daysDiff > 1) return 0;

  // Calculate consecutive days starting from today
  let streak = 0;
  const checkDate = startOfDay(new Date());

  for (let i = 0; i < 30; i++) {
    const completionForDay = sortedCompletions.find((date) => {
      const day = startOfDay(date);
      return day.getTime() === checkDate.getTime();
    });

    if (completionForDay) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get all daily achievements earned today
 */
export async function getTodayDailyAchievements(babyId: string) {
  const todayStart = startOfDay(new Date());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  return db.query.Achievements.findMany({
    where: and(
      eq(Achievements.babyId, babyId),
      eq(Achievements.category, 'daily-achievements'),
      gte(Achievements.completedDate, todayStart),
      lt(Achievements.completedDate, tomorrowStart),
    ),
  });
}
