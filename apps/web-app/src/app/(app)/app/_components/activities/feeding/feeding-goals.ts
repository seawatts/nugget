import type { Activities } from '@nugget/db/schema';
import { format } from 'date-fns';
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
 * Calculate feeding statistics for the given activities
 */
export function calculateTodaysFeedingStats(
  activities: Array<typeof Activities.$inferSelect>,
): {
  count: number;
  totalMl: number;
  avgAmountMl: number | null;
  vitaminDCount: number;
} {
  // Filter to feeding activities only (caller is responsible for time filtering)
  const todaysFeedings = activities.filter((activity) => {
    const isFeeding = activity.type === 'bottle' || activity.type === 'nursing';
    return isFeeding;
  });

  // Calculate count
  const count = todaysFeedings.length;

  // Calculate total amount (from both bottle AND nursing feedings with recorded amounts)
  const totalMl = todaysFeedings.reduce((sum, activity) => {
    if (activity.amountMl) {
      return sum + activity.amountMl;
    }
    return sum;
  }, 0);

  // Calculate average amount per feeding
  let avgAmountMl: number | null = null;
  const feedingsWithAmount = todaysFeedings.filter(
    (activity) => activity.amountMl,
  );

  if (feedingsWithAmount.length > 0) {
    avgAmountMl = totalMl / feedingsWithAmount.length;
  }

  // Calculate vitamin D count
  const vitaminDCount = todaysFeedings.filter((activity) => {
    const details = activity.details as { vitaminDGiven?: boolean } | null;
    return details?.vitaminDGiven === true;
  }).length;

  return {
    avgAmountMl,
    count,
    totalMl,
    vitaminDCount,
  };
}

export interface FeedingStatsComparison {
  current: {
    count: number;
    totalMl: number;
    avgAmountMl: number | null;
    vitaminDCount: number;
  };
  previous: {
    count: number;
    totalMl: number;
    avgAmountMl: number | null;
    vitaminDCount: number;
  };
  percentageChange: {
    count: number | null;
    totalMl: number | null;
    avgAmountMl: number | null;
    vitaminDCount: number | null;
  };
}

/**
 * Calculate feeding statistics with comparison between current and previous time periods
 * Current period: 0-{hours} ago
 * Previous period: {hours}-{hours*2} ago
 */
export function calculateFeedingStatsWithComparison(
  activities: Array<typeof Activities.$inferSelect>,
  timeRangeHours = 24, // Default to 24 hours for backward compatibility
): FeedingStatsComparison {
  const now = Date.now();
  const currentPeriodStart = new Date(now - timeRangeHours * 60 * 60 * 1000);
  const previousPeriodStart = new Date(
    now - timeRangeHours * 2 * 60 * 60 * 1000,
  );

  // Helper function to calculate stats for a time period
  const calculateStatsForPeriod = (startTime: Date, endTime: Date) => {
    const feedings = activities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      const isInRange = activityDate >= startTime && activityDate < endTime;
      const isFeeding =
        activity.type === 'bottle' || activity.type === 'nursing';
      return isInRange && isFeeding;
    });

    const count = feedings.length;
    const totalMl = feedings.reduce((sum, activity) => {
      if (activity.amountMl) {
        return sum + activity.amountMl;
      }
      return sum;
    }, 0);

    const feedingsWithAmount = feedings.filter((activity) => activity.amountMl);
    const avgAmountMl =
      feedingsWithAmount.length > 0
        ? totalMl / feedingsWithAmount.length
        : null;

    const vitaminDCount = feedings.filter((activity) => {
      const details = activity.details as { vitaminDGiven?: boolean } | null;
      return details?.vitaminDGiven === true;
    }).length;

    return { avgAmountMl, count, totalMl, vitaminDCount };
  };

  // Calculate current period
  const current = calculateStatsForPeriod(currentPeriodStart, new Date(now));

  // Calculate previous period
  const previous = calculateStatsForPeriod(
    previousPeriodStart,
    currentPeriodStart,
  );

  // Calculate percentage changes
  const calculatePercentageChange = (
    currentValue: number | null,
    previousValue: number | null,
  ): number | null => {
    if (
      currentValue === null ||
      previousValue === null ||
      previousValue === 0
    ) {
      return null;
    }
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  const percentageChange = {
    avgAmountMl: calculatePercentageChange(
      current.avgAmountMl,
      previous.avgAmountMl,
    ),
    count: calculatePercentageChange(current.count, previous.count),
    totalMl: calculatePercentageChange(current.totalMl, previous.totalMl),
    vitaminDCount: calculatePercentageChange(
      current.vitaminDCount,
      previous.vitaminDCount,
    ),
  };

  return {
    current,
    percentageChange,
    previous,
  };
}

/**
 * Calculate feeding statistics grouped by day for trend charts
 * Returns data for the last 7 days
 */
export function calculateFeedingTrendData(
  activities: Array<typeof Activities.$inferSelect>,
): Array<{ date: string; count: number; totalMl: number }> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Filter to feedings from the last 7 days
  const recentFeedings = activities.filter((activity) => {
    const activityDate = new Date(activity.startTime);
    const isRecent = activityDate >= sevenDaysAgo;
    const isFeeding = activity.type === 'bottle' || activity.type === 'nursing';
    return isRecent && isFeeding;
  });

  // Group by date
  const statsByDate = new Map<string, { count: number; totalMl: number }>();

  for (const activity of recentFeedings) {
    const date = new Date(activity.startTime);
    const dateKey = format(date, 'yyyy-MM-dd');

    if (!statsByDate.has(dateKey)) {
      statsByDate.set(dateKey, { count: 0, totalMl: 0 });
    }

    const stats = statsByDate.get(dateKey);
    if (!stats) continue;

    stats.count += 1;

    if (activity.amountMl) {
      stats.totalMl += activity.amountMl;
    }
  }

  // Convert to array and fill in missing dates
  const result: Array<{ date: string; count: number; totalMl: number }> = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = format(date, 'yyyy-MM-dd');
    const stats = statsByDate.get(dateKey) || { count: 0, totalMl: 0 };
    result.push({
      count: stats.count,
      date: dateKey,
      totalMl: stats.totalMl,
    });
  }

  return result;
}
