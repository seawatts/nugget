import type { Activities } from '@nugget/db/schema';
import { startOfDay, startOfHour, startOfWeek } from 'date-fns';
import { calculateWeightedInterval } from '../shared/adaptive-weighting';
import { getFeedingIntervalByAge } from './feeding-intervals';

/**
 * Calculate recommended daily feeding count based on baby's age and actual patterns
 * Uses adaptive weighting to gradually shift from age-based to pattern-based recommendations
 * @param ageDays - Baby's age in days
 * @param predictedIntervalHours - Optional predicted interval from the prediction algorithm
 * @param dataPointsCount - Optional number of recent activities used in prediction
 * @returns Estimated number of feedings per day
 */
export function getDailyFeedingGoal(
  ageDays: number,
  predictedIntervalHours?: number | null,
  dataPointsCount?: number,
): number {
  const ageBasedInterval = getFeedingIntervalByAge(ageDays);

  // If no prediction data or data points count, use age-based only
  if (!predictedIntervalHours || dataPointsCount === undefined) {
    return Math.round(24 / ageBasedInterval);
  }

  // Calculate weighted interval using adaptive algorithm
  const weightedInterval = calculateWeightedInterval(
    ageBasedInterval,
    predictedIntervalHours,
    dataPointsCount,
  );

  return Math.round(24 / weightedInterval);
}

/**
 * Calculate recommended daily total volume based on baby's age and actual patterns
 * Returns amount in the specified unit (ML or OZ)
 * @param ageDays - Baby's age in days
 * @param unit - Unit preference (ML or OZ)
 * @param predictedIntervalHours - Optional predicted interval from the prediction algorithm
 * @param dataPointsCount - Optional number of recent activities used in prediction
 * @returns Estimated total daily amount in the specified unit
 */
export function getDailyAmountGoal(
  ageDays: number,
  unit: 'ML' | 'OZ',
  predictedIntervalHours?: number | null,
  dataPointsCount?: number,
): number {
  const feedingCount = getDailyFeedingGoal(
    ageDays,
    predictedIntervalHours,
    dataPointsCount,
  );
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
} {
  // Guard against undefined activities
  if (!activities || !Array.isArray(activities)) {
    return { avgAmountMl: null, count: 0, totalMl: 0 };
  }

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

  return {
    avgAmountMl,
    count,
    totalMl,
  };
}

export interface FeedingStatsComparison {
  current: {
    count: number;
    totalMl: number;
    avgAmountMl: number | null;
  };
  previous: {
    count: number;
    totalMl: number;
    avgAmountMl: number | null;
  };
  percentageChange: {
    count: number | null;
    totalMl: number | null;
    avgAmountMl: number | null;
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
  // Guard against undefined activities
  if (!activities || !Array.isArray(activities)) {
    const emptyStats = { avgAmountMl: null, count: 0, totalMl: 0 };
    return {
      current: emptyStats,
      percentageChange: { avgAmountMl: null, count: null, totalMl: null },
      previous: emptyStats,
    };
  }

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

    return { avgAmountMl, count, totalMl };
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
  timeRange: '24h' | '7d' | '2w' | '1m' | '3m' | '6m' = '7d',
): Array<{ date: string; count: number; totalMl: number }> {
  // Guard against undefined activities
  if (!activities || !Array.isArray(activities)) {
    return [];
  }

  const now = new Date();

  const isFeedingActivity = (activityType: string | null | undefined) =>
    activityType === 'feeding' ||
    activityType === 'bottle' ||
    activityType === 'nursing';

  if (timeRange === '24h') {
    // For 24h view, group by hour
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Filter to feedings from the last 24 hours
    const recentFeedings = activities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      const isRecent = activityDate >= twentyFourHoursAgo;
      return isRecent && isFeedingActivity(activity.type);
    });

    // Group by hour
    const statsByHour = new Map<string, { count: number; totalMl: number }>();

    for (const activity of recentFeedings) {
      const date = new Date(activity.startTime);
      // Normalize to the start of the hour in the user's local timezone
      const hourStart = startOfHour(date);
      const hourKey = hourStart.toISOString();

      if (!statsByHour.has(hourKey)) {
        statsByHour.set(hourKey, { count: 0, totalMl: 0 });
      }

      const stats = statsByHour.get(hourKey);
      if (!stats) continue;

      stats.count += 1;

      if (activity.amountMl) {
        stats.totalMl += activity.amountMl;
      }
    }

    // Convert to array and fill in missing hours
    const result: Array<{ date: string; count: number; totalMl: number }> = [];
    for (let i = 23; i >= 0; i -= 1) {
      const date = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStart = startOfHour(date);
      const hourKey = hourStart.toISOString();
      const stats = statsByHour.get(hourKey) || { count: 0, totalMl: 0 };
      result.push({
        count: stats.count,
        date: hourKey,
        totalMl: stats.totalMl,
      });
    }

    return result;
  }

  // For longer time ranges, determine if we should use daily or weekly grouping
  const useWeeklyGrouping = timeRange === '3m' || timeRange === '6m';

  // Calculate the time range in days
  const daysMap: Record<string, number> = {
    '1m': 30,
    '2w': 14,
    '3m': 90,
    '6m': 180,
    '7d': 7,
    '24h': 1,
  };

  const days = daysMap[timeRange] ?? 7; // Default to 7 days if timeRange is invalid
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Filter to feedings from the selected time range
  const recentFeedings = activities.filter((activity) => {
    const activityDate = new Date(activity.startTime);
    const isRecent = activityDate >= startDate;
    return isRecent && isFeedingActivity(activity.type);
  });

  if (useWeeklyGrouping) {
    // Group by week
    const statsByWeek = new Map<string, { count: number; totalMl: number }>();

    for (const activity of recentFeedings) {
      const date = new Date(activity.startTime);
      // Get the Monday of the week for this date in the user's local timezone
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString();

      if (!statsByWeek.has(weekKey)) {
        statsByWeek.set(weekKey, { count: 0, totalMl: 0 });
      }

      const stats = statsByWeek.get(weekKey);
      if (!stats) continue;

      stats.count += 1;

      if (activity.amountMl) {
        stats.totalMl += activity.amountMl;
      }
    }

    // Convert to array and fill in missing weeks
    const result: Array<{ date: string; count: number; totalMl: number }> = [];
    const numWeeks = Math.ceil((days ?? 7) / 7);
    for (let i = numWeeks - 1; i >= 0; i -= 1) {
      const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString();
      const stats = statsByWeek.get(weekKey) || { count: 0, totalMl: 0 };
      result.push({
        count: stats.count,
        date: weekKey,
        totalMl: stats.totalMl,
      });
    }

    return result;
  }

  // For daily grouping (7d, 2w, 1m)
  const statsByDate = new Map<string, { count: number; totalMl: number }>();

  for (const activity of recentFeedings) {
    const date = new Date(activity.startTime);
    const dateStart = startOfDay(date);
    const dateKey = dateStart.toISOString();

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
  for (let i = (days ?? 7) - 1; i >= 0; i -= 1) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStart = startOfDay(date);
    const dateKey = dateStart.toISOString();
    const stats = statsByDate.get(dateKey) || { count: 0, totalMl: 0 };
    result.push({
      count: stats.count,
      date: dateKey,
      totalMl: stats.totalMl,
    });
  }

  return result;
}
