import type { Activities } from '@nugget/db/schema';
import { startOfDay } from 'date-fns';
import { getFeedingIntervalByAge } from './feeding-intervals';

/**
 * Calculate recommended daily feeding count based on baby's age and actual patterns
 * Uses 24 hours divided by predicted interval (if available) or age-appropriate interval
 * @param ageDays - Baby's age in days
 * @param predictedIntervalHours - Optional predicted interval from the prediction algorithm
 * @returns Estimated number of feedings per day
 */
export function getDailyFeedingGoal(
  ageDays: number,
  predictedIntervalHours?: number | null,
): number {
  // Use predicted interval if available (based on actual patterns), otherwise fall back to age-based
  const intervalHours =
    predictedIntervalHours ?? getFeedingIntervalByAge(ageDays);
  return Math.round(24 / intervalHours);
}

/**
 * Calculate recommended daily total volume based on baby's age and actual patterns
 * Returns amount in the specified unit (ML or OZ)
 * @param ageDays - Baby's age in days
 * @param unit - Unit preference (ML or OZ)
 * @param predictedIntervalHours - Optional predicted interval from the prediction algorithm
 * @returns Estimated total daily amount in the specified unit
 */
export function getDailyAmountGoal(
  ageDays: number,
  unit: 'ML' | 'OZ',
  predictedIntervalHours?: number | null,
): number {
  const feedingCount = getDailyFeedingGoal(ageDays, predictedIntervalHours);
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
  avgAmountMl: number | null;
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

  // Calculate average amount per feeding
  let avgAmountMl: number | null = null;
  const feedingsWithAmount = todaysFeedings.filter(
    (activity) => activity.type === 'bottle' && activity.amountMl,
  );

  if (feedingsWithAmount.length > 0) {
    avgAmountMl = totalMl / feedingsWithAmount.length;
  }

  return {
    avgAmountMl,
    count,
    totalMl,
  };
}
