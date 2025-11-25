import type { Activities } from '@nugget/db/schema';
import { format, startOfDay } from 'date-fns';
import type { TrendTimeRange } from '../shared/types';
import { getPumpingIntervalByAge } from './pumping-intervals';

/**
 * Calculate recommended daily pumping session count based on baby's age
 * Uses 24 hours divided by age-appropriate interval
 */
export function getDailyPumpingGoal(ageDays: number): number {
  const intervalHours = getPumpingIntervalByAge(ageDays);
  return Math.round(24 / intervalHours);
}

/**
 * Calculate recommended daily pumping amount based on baby's age
 * Returns amount in the specified unit (ML or OZ)
 */
export function getDailyPumpingAmountGoal(
  ageDays: number,
  unit: 'ML' | 'OZ',
): number {
  const sessionCount = getDailyPumpingGoal(ageDays);
  let amountPerSession: number;

  // Define typical amounts per pumping session by age
  if (ageDays <= 7) {
    // Days 1-7: 0.5-1 oz per session
    amountPerSession = unit === 'OZ' ? 0.75 : 22;
  } else if (ageDays <= 30) {
    // Days 8-30: 2-3 oz per session
    amountPerSession = unit === 'OZ' ? 2.5 : 75;
  } else if (ageDays <= 60) {
    // Days 31-60: 3-4 oz per session
    amountPerSession = unit === 'OZ' ? 3.5 : 105;
  } else {
    // Days 61+: 4-5 oz per session
    amountPerSession = unit === 'OZ' ? 4.5 : 135;
  }

  return Math.round(amountPerSession * sessionCount);
}

/**
 * Calculate pumping statistics from the last 24 hours (rolling window)
 */
export function calculateTodaysPumpingStats(
  activities: Array<typeof Activities.$inferSelect>,
): {
  count: number;
  totalMl: number;
  avgAmountMl: number | null;
} {
  // Rolling 24-hour window instead of calendar day
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Filter to pumping sessions from the last 24 hours
  const todaysPumping = activities.filter((activity) => {
    const activityDate = new Date(activity.startTime);
    const isRecent = activityDate >= twentyFourHoursAgo;
    const isPumping = activity.type === 'pumping';
    return isRecent && isPumping;
  });

  // Calculate count
  const count = todaysPumping.length;

  // Calculate total amount
  const totalMl = todaysPumping.reduce((sum, activity) => {
    return sum + (activity.amountMl || 0);
  }, 0);

  // Calculate average amount per session
  let avgAmountMl: number | null = null;
  const sessionsWithAmount = todaysPumping.filter(
    (activity) => activity.amountMl && activity.amountMl > 0,
  );

  if (sessionsWithAmount.length > 0) {
    avgAmountMl = totalMl / sessionsWithAmount.length;
  }

  return {
    avgAmountMl,
    count,
    totalMl,
  };
}

export interface PumpingStatsComparison {
  current: { count: number; totalMl: number; avgAmountMl: number | null };
  previous: { count: number; totalMl: number; avgAmountMl: number | null };
  percentageChange: {
    count: number | null;
    totalMl: number | null;
    avgAmountMl: number | null;
  };
}

/**
 * Calculate pumping statistics with comparison between current and previous 24-hour periods
 * Current period: 0-24 hours ago
 * Previous period: 24-48 hours ago
 */
export function calculatePumpingStatsWithComparison(
  activities: Array<typeof Activities.$inferSelect>,
  timeRangeHours = 24, // Default to 24 hours for backward compatibility
): PumpingStatsComparison {
  const now = Date.now();
  const currentPeriodStart = new Date(now - timeRangeHours * 60 * 60 * 1000);
  const previousPeriodStart = new Date(
    now - timeRangeHours * 2 * 60 * 60 * 1000,
  );

  // Helper function to calculate stats for a time period
  const calculateStatsForPeriod = (startTime: Date, endTime: Date) => {
    const sessions = activities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      const isInRange = activityDate >= startTime && activityDate < endTime;
      const isPumping = activity.type === 'pumping';
      return isInRange && isPumping;
    });

    const count = sessions.length;
    const totalMl = sessions.reduce((sum, activity) => {
      return sum + (activity.amountMl || 0);
    }, 0);

    const sessionsWithAmount = sessions.filter(
      (activity) => activity.amountMl && activity.amountMl > 0,
    );
    const avgAmountMl =
      sessionsWithAmount.length > 0
        ? totalMl / sessionsWithAmount.length
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
 * Calculate pumping statistics grouped by day for trend charts
 * Returns data for the last 7 days
 */
const TREND_RANGE_DAYS: Record<TrendTimeRange, number> = {
  '1m': 30,
  '2w': 14,
  '3m': 90,
  '6m': 180,
  '7d': 7,
  '24h': 1,
};

export function calculatePumpingTrendData(
  activities: Array<typeof Activities.$inferSelect>,
  timeRange: TrendTimeRange = '7d',
): Array<{ date: string; count: number; totalMl: number }> {
  if (!activities || !Array.isArray(activities)) {
    return [];
  }

  const now = new Date();
  const days = TREND_RANGE_DAYS[timeRange] ?? 7;
  const rangeStart = startOfDay(
    new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000),
  );

  const statsByDate = new Map<string, { count: number; totalMl: number }>();

  for (const activity of activities) {
    if (activity.type !== 'pumping') continue;
    const date = new Date(activity.startTime);
    if (date < rangeStart) continue;

    const dayStart = startOfDay(date);
    const dateKey = format(dayStart, 'yyyy-MM-dd');

    if (!statsByDate.has(dateKey)) {
      statsByDate.set(dateKey, { count: 0, totalMl: 0 });
    }

    const stats = statsByDate.get(dateKey);
    if (!stats) continue;

    stats.count += 1;
    stats.totalMl += activity.amountMl || 0;
  }

  const result: Array<{ date: string; count: number; totalMl: number }> = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = startOfDay(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
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
