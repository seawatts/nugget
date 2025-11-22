import type { Activities } from '@nugget/db/schema';
import { differenceInHours, startOfDay } from 'date-fns';
import { getFeedingIntervalByAge } from './feeding-intervals';

/**
 * Calculate recommended daily feeding count based on baby's age
 * Uses 24 hours divided by age-appropriate interval
 */
export function getDailyFeedingGoal(ageDays: number): number {
  const intervalHours = getFeedingIntervalByAge(ageDays);
  return Math.round(24 / intervalHours);
}

/**
 * Calculate recommended daily total volume based on baby's age
 * Returns amount in the specified unit (ML or OZ)
 */
export function getDailyAmountGoal(ageDays: number, unit: 'ML' | 'OZ'): number {
  const feedingCount = getDailyFeedingGoal(ageDays);
  let amountPerFeeding: number;

  // Define typical amounts per feeding by age
  if (ageDays <= 2) {
    // Days 1-2: 1-2 oz per feeding
    amountPerFeeding = unit === 'OZ' ? 1.5 : 45;
  } else if (ageDays <= 7) {
    // Days 3-7: 2-3 oz per feeding
    amountPerFeeding = unit === 'OZ' ? 2.5 : 75;
  } else if (ageDays <= 14) {
    // Days 8-14: 3 oz per feeding
    amountPerFeeding = unit === 'OZ' ? 3 : 90;
  } else if (ageDays <= 30) {
    // Days 15-30: 4 oz per feeding
    amountPerFeeding = unit === 'OZ' ? 4 : 120;
  } else if (ageDays <= 60) {
    // Days 31-60: 5 oz per feeding
    amountPerFeeding = unit === 'OZ' ? 5 : 150;
  } else {
    // Days 61+: 6 oz per feeding
    amountPerFeeding = unit === 'OZ' ? 6 : 180;
  }

  return Math.round(amountPerFeeding * feedingCount);
}

/**
 * Calculate today's feeding statistics from activities
 */
export function calculateTodaysFeedingStats(
  activities: Array<typeof Activities.$inferSelect>,
): {
  count: number;
  totalMl: number;
  avgIntervalHours: number | null;
} {
  const today = startOfDay(new Date());

  // Filter to today's feeding activities
  const todaysFeedings = activities.filter((activity) => {
    const activityDate = new Date(activity.startTime);
    const isToday = activityDate >= today;
    const isFeeding = activity.type === 'bottle' || activity.type === 'nursing';
    return isToday && isFeeding;
  });

  // Calculate count
  const count = todaysFeedings.length;

  // Calculate total amount (only from bottle feedings with recorded amounts)
  const totalMl = todaysFeedings.reduce((sum, activity) => {
    if (activity.type === 'bottle' && activity.amountMl) {
      return sum + activity.amountMl;
    }
    return sum;
  }, 0);

  // Calculate average interval between feedings
  let avgIntervalHours: number | null = null;
  if (todaysFeedings.length > 1) {
    // Sort by start time
    const sorted = [...todaysFeedings].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    // Calculate intervals between consecutive feedings
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
    count,
    totalMl,
  };
}
