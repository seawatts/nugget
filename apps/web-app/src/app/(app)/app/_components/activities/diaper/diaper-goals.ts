import type { Activities } from '@nugget/db/schema';
import { differenceInHours, startOfDay } from 'date-fns';
import { getDiaperIntervalByAge } from './diaper-intervals';

/**
 * Calculate recommended daily diaper change count based on baby's age
 * Uses 24 hours divided by age-appropriate interval
 */
export function getDailyDiaperGoal(ageDays: number): number {
  const intervalHours = getDiaperIntervalByAge(ageDays);
  return Math.round(24 / intervalHours);
}

/**
 * Calculate recommended daily wet diaper (pee) count based on baby's age
 * Typically ~60-70% of total diaper changes are wet
 */
export function getDailyWetDiaperGoal(ageDays: number): number {
  const totalGoal = getDailyDiaperGoal(ageDays);
  // Newborns have more frequent wet diapers (70%)
  // Older babies have fewer relative wet diapers (60%)
  const wetPercentage = ageDays <= 30 ? 0.7 : 0.6;
  return Math.round(totalGoal * wetPercentage);
}

/**
 * Calculate recommended daily dirty diaper (poop) count based on baby's age
 * Newborns have more frequent bowel movements that decrease with age
 */
export function getDailyDirtyDiaperGoal(ageDays: number): number {
  // Days 0-7: 3-4 poops per day
  if (ageDays <= 7) return 3;
  // Days 8-30: 2-3 poops per day
  if (ageDays <= 30) return 2;
  // Days 31-60: 1-2 poops per day
  if (ageDays <= 60) return 2;
  // Days 61+: 1 poop per day (some babies go less frequently)
  return 1;
}

/**
 * Calculate today's diaper statistics from activities
 */
export function calculateTodaysDiaperStats(
  activities: Array<typeof Activities.$inferSelect>,
): {
  count: number;
  wetCount: number;
  dirtyCount: number;
  bothCount: number;
  avgIntervalHours: number | null;
} {
  const today = startOfDay(new Date());

  // Filter to today's diaper activities
  const todaysDiapers = activities.filter((activity) => {
    const activityDate = new Date(activity.startTime);
    const isToday = activityDate >= today;
    const isDiaper = activity.type === 'diaper';
    return isToday && isDiaper;
  });

  // Calculate count
  const count = todaysDiapers.length;

  // Calculate breakdown by type
  // Note: "both" counts toward both wet and dirty
  let wetCount = 0;
  let dirtyCount = 0;
  let bothCount = 0;

  for (const diaper of todaysDiapers) {
    const details = diaper.details as { type?: string } | null;
    const type = details?.type;

    if (type === 'wet') {
      wetCount++;
    } else if (type === 'dirty') {
      dirtyCount++;
    } else if (type === 'both') {
      bothCount++;
      // "Both" counts toward both wet and dirty totals
      wetCount++;
      dirtyCount++;
    }
  }

  // Calculate average interval between diapers
  let avgIntervalHours: number | null = null;
  if (todaysDiapers.length > 1) {
    // Sort by start time
    const sorted = [...todaysDiapers].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    // Calculate intervals between consecutive diapers
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const previous = sorted[i - 1];
      if (current && previous) {
        const hours = differenceInHours(
          new Date(current.startTime),
          new Date(previous.startTime),
        );
        if (hours > 0) {
          intervals.push(hours);
        }
      }
    }

    // Calculate average interval
    if (intervals.length > 0) {
      const sum = intervals.reduce((a, b) => a + b, 0);
      avgIntervalHours = sum / intervals.length;
    }
  }

  return {
    avgIntervalHours,
    bothCount,
    count,
    dirtyCount,
    wetCount,
  };
}
