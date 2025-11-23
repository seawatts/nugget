import type { Activities } from '@nugget/db/schema';
import { differenceInHours, format, startOfDay } from 'date-fns';

/**
 * Calculate recommended daily nap count based on baby's age
 */
export function getDailyNapGoal(ageDays: number): number {
  // Newborn (0-7 days): 4-5 naps
  if (ageDays <= 7) return 5;
  // 1-4 weeks: 4-5 naps
  if (ageDays <= 28) return 4;
  // 1-3 months: 3-4 naps
  if (ageDays <= 90) return 4;
  // 3-6 months: 3 naps
  if (ageDays <= 180) return 3;
  // 6-9 months: 2-3 naps
  if (ageDays <= 270) return 3;
  // 9-12 months: 2 naps
  if (ageDays <= 365) return 2;
  // 12-18 months: 1-2 naps
  if (ageDays <= 547) return 2;
  // 18+ months: 1 nap
  return 1;
}

/**
 * Calculate recommended total daily sleep hours based on baby's age
 * Returns hours as a number
 */
export function getDailySleepHoursGoal(ageDays: number): number {
  // Newborn (0-7 days): 14-17 hours
  if (ageDays <= 7) return 16;
  // 1-4 weeks: 14-17 hours
  if (ageDays <= 28) return 15;
  // 1-3 months: 14-17 hours
  if (ageDays <= 90) return 15;
  // 3-6 months: 12-16 hours
  if (ageDays <= 180) return 14;
  // 6-9 months: 12-15 hours
  if (ageDays <= 270) return 13;
  // 9-12 months: 11-14 hours
  if (ageDays <= 365) return 13;
  // 12-18 months: 11-14 hours
  if (ageDays <= 547) return 12;
  // 18-24 months: 11-14 hours
  if (ageDays <= 730) return 12;
  // 24+ months: 10-13 hours
  return 11;
}

/**
 * Calculate sleep statistics for sessions that ended today (including in-progress)
 * Counts full duration of sleep sessions that end today, even if they started yesterday
 */
export function calculateTodaysSleepStats(
  activities: Array<typeof Activities.$inferSelect>,
): {
  sleepCount: number;
  totalSleepMinutes: number;
  avgSleepDuration: number | null;
  longestSleepMinutes: number | null;
  avgIntervalHours: number | null;
} {
  const today = startOfDay(new Date());

  // Filter to sleep sessions that ENDED today (or are in progress)
  const todaysSleeps = activities.filter((activity) => {
    const isSleep = activity.type === 'sleep';
    if (!isSleep) return false;

    // For completed sleep: check if it ended today
    if (activity.duration && activity.duration > 0) {
      const startTime = new Date(activity.startTime);
      const endTime = new Date(
        startTime.getTime() + activity.duration * 60 * 1000,
      );
      return endTime >= today;
    }

    // For in-progress sleep: check if it started before now
    const startTime = new Date(activity.startTime);
    return startTime < new Date();
  });

  // For in-progress sleep, calculate elapsed time
  const sleepsWithDuration = todaysSleeps.map((activity) => {
    if (activity.duration && activity.duration > 0) {
      return activity;
    }
    // Calculate elapsed time for in-progress sleep
    const elapsed = Math.floor(
      (Date.now() - new Date(activity.startTime).getTime()) / (1000 * 60),
    );
    return { ...activity, duration: elapsed };
  });

  // Calculate sleep count
  const sleepCount = sleepsWithDuration.length;

  // Calculate total sleep time in minutes
  const totalSleepMinutes = sleepsWithDuration.reduce((sum, activity) => {
    return sum + (activity.duration || 0);
  }, 0);

  // Calculate average sleep duration
  let avgSleepDuration: number | null = null;
  if (sleepCount > 0) {
    avgSleepDuration = totalSleepMinutes / sleepCount;
  }

  // Find longest sleep
  let longestSleepMinutes: number | null = null;
  if (sleepCount > 0) {
    longestSleepMinutes = Math.max(
      ...sleepsWithDuration.map((activity) => activity.duration || 0),
    );
  }

  // Calculate average interval between sleep sessions
  let avgIntervalHours: number | null = null;
  if (sleepsWithDuration.length > 1) {
    // Sort by start time
    const sorted = [...sleepsWithDuration].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    // Calculate intervals between consecutive sleep sessions
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
    avgSleepDuration,
    longestSleepMinutes,
    sleepCount,
    totalSleepMinutes,
  };
}

export interface SleepStatsComparison {
  current: {
    sleepCount: number;
    totalMinutes: number;
    avgSleepDuration: number | null;
  };
  previous: {
    sleepCount: number;
    totalMinutes: number;
    avgSleepDuration: number | null;
  };
  percentageChange: {
    sleepCount: number | null;
    totalMinutes: number | null;
    avgSleepDuration: number | null;
  };
}

/**
 * Calculate sleep statistics with comparison between current and previous 24-hour periods
 * Current period: 0-24 hours ago
 * Previous period: 24-48 hours ago
 */
export function calculateSleepStatsWithComparison(
  activities: Array<typeof Activities.$inferSelect>,
  timeRangeHours = 24, // Default to 24 hours for backward compatibility
): SleepStatsComparison {
  const now = Date.now();
  const currentPeriodStart = new Date(now - timeRangeHours * 60 * 60 * 1000);
  const previousPeriodStart = new Date(
    now - timeRangeHours * 2 * 60 * 60 * 1000,
  );

  // Helper function to calculate stats for a time period
  const calculateStatsForPeriod = (startTime: Date, endTime: Date) => {
    const sleeps = activities.filter((activity) => {
      if (activity.type !== 'sleep') return false;
      const activityDate = new Date(activity.startTime);
      return activityDate >= startTime && activityDate < endTime;
    });

    const sleepCount = sleeps.length;
    const totalMinutes = sleeps.reduce((sum, activity) => {
      return sum + (activity.duration || 0);
    }, 0);

    const avgSleepDuration = sleepCount > 0 ? totalMinutes / sleepCount : null;

    return { avgSleepDuration, sleepCount, totalMinutes };
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
    avgSleepDuration: calculatePercentageChange(
      current.avgSleepDuration,
      previous.avgSleepDuration,
    ),
    sleepCount: calculatePercentageChange(
      current.sleepCount,
      previous.sleepCount,
    ),
    totalMinutes: calculatePercentageChange(
      current.totalMinutes,
      previous.totalMinutes,
    ),
  };

  return {
    current,
    percentageChange,
    previous,
  };
}

/**
 * Calculate sleep statistics grouped by day for trend charts
 * Returns data for the last 7 days
 */
export function calculateSleepTrendData(
  activities: Array<typeof Activities.$inferSelect>,
): Array<{ date: string; count: number; totalMinutes: number }> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Filter to sleeps from the last 7 days
  const recentSleeps = activities.filter((activity) => {
    const activityDate = new Date(activity.startTime);
    const isRecent = activityDate >= sevenDaysAgo;
    const isSleep = activity.type === 'sleep';
    return isRecent && isSleep;
  });

  // Group by date
  const statsByDate = new Map<
    string,
    { count: number; totalMinutes: number }
  >();

  for (const activity of recentSleeps) {
    const date = new Date(activity.startTime);
    const dateKey = format(date, 'yyyy-MM-dd');

    if (!statsByDate.has(dateKey)) {
      statsByDate.set(dateKey, { count: 0, totalMinutes: 0 });
    }

    const stats = statsByDate.get(dateKey);
    if (!stats) continue;

    stats.count += 1;
    stats.totalMinutes += activity.duration || 0;
  }

  // Convert to array and fill in missing dates
  const result: Array<{ date: string; count: number; totalMinutes: number }> =
    [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = format(date, 'yyyy-MM-dd');
    const stats = statsByDate.get(dateKey) || { count: 0, totalMinutes: 0 };
    result.push({
      count: stats.count,
      date: dateKey,
      totalMinutes: stats.totalMinutes,
    });
  }

  return result;
}

export interface CoSleeperStats {
  userId: string;
  count: number;
  totalMinutes: number;
}

export interface CoSleeperTrendData {
  date: string;
  byUser: Record<string, { count: number; totalMinutes: number }>;
}

/**
 * Calculate co-sleeper statistics grouped by day and family member
 * Returns data for the last 7 days
 */
export function calculateCoSleeperTrendData(
  activities: Array<typeof Activities.$inferSelect>,
): CoSleeperTrendData[] {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Filter to co-sleeping sessions from the last 7 days
  const recentCoSleeps = activities.filter((activity) => {
    const activityDate = new Date(activity.startTime);
    const isRecent = activityDate >= sevenDaysAgo;
    const isSleep = activity.type === 'sleep';
    const isCoSleeping =
      activity.details &&
      activity.details.type === 'sleep' &&
      activity.details.isCoSleeping === true &&
      Array.isArray(activity.details.coSleepingWith) &&
      activity.details.coSleepingWith.length > 0;
    return isRecent && isSleep && isCoSleeping;
  });

  // Group by date and user
  const statsByDate = new Map<
    string,
    Record<string, { count: number; totalMinutes: number }>
  >();

  for (const activity of recentCoSleeps) {
    const date = new Date(activity.startTime);
    const dateKey = format(date, 'yyyy-MM-dd');

    if (!statsByDate.has(dateKey)) {
      statsByDate.set(dateKey, {});
    }

    const dateStats = statsByDate.get(dateKey);
    if (!dateStats) continue;

    // Add stats for each co-sleeping family member
    if (
      activity.details &&
      activity.details.type === 'sleep' &&
      Array.isArray(activity.details.coSleepingWith)
    ) {
      for (const userId of activity.details.coSleepingWith) {
        if (!dateStats[userId]) {
          dateStats[userId] = { count: 0, totalMinutes: 0 };
        }
        dateStats[userId].count += 1;
        dateStats[userId].totalMinutes += activity.duration || 0;
      }
    }
  }

  // Convert to array and fill in missing dates
  const result: CoSleeperTrendData[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = format(date, 'yyyy-MM-dd');
    const stats = statsByDate.get(dateKey) || {};
    result.push({
      byUser: stats,
      date: dateKey,
    });
  }

  return result;
}

export interface CoSleeperComparisonData {
  userId: string;
  current: {
    count: number;
    totalMinutes: number;
  };
  previous: {
    count: number;
    totalMinutes: number;
  };
  percentageChange: {
    count: number | null;
    totalMinutes: number | null;
  };
}

/**
 * Calculate co-sleeper statistics with comparison between current and previous periods
 * Groups data by family member
 */
export function calculateCoSleeperStatsWithComparison(
  activities: Array<typeof Activities.$inferSelect>,
  timeRangeHours = 24,
): CoSleeperComparisonData[] {
  const now = Date.now();
  const currentPeriodStart = new Date(now - timeRangeHours * 60 * 60 * 1000);
  const previousPeriodStart = new Date(
    now - timeRangeHours * 2 * 60 * 60 * 1000,
  );

  // Helper function to calculate stats for a time period
  const calculateStatsForPeriod = (startTime: Date, endTime: Date) => {
    const coSleeps = activities.filter((activity) => {
      if (activity.type !== 'sleep') return false;
      const activityDate = new Date(activity.startTime);
      const isInPeriod = activityDate >= startTime && activityDate < endTime;
      const isCoSleeping =
        activity.details &&
        activity.details.type === 'sleep' &&
        activity.details.isCoSleeping === true &&
        Array.isArray(activity.details.coSleepingWith) &&
        activity.details.coSleepingWith.length > 0;
      return isInPeriod && isCoSleeping;
    });

    // Group by user
    const statsByUser = new Map<
      string,
      { count: number; totalMinutes: number }
    >();

    for (const activity of coSleeps) {
      if (
        activity.details &&
        activity.details.type === 'sleep' &&
        Array.isArray(activity.details.coSleepingWith)
      ) {
        for (const userId of activity.details.coSleepingWith) {
          if (!statsByUser.has(userId)) {
            statsByUser.set(userId, { count: 0, totalMinutes: 0 });
          }
          const userStats = statsByUser.get(userId);
          if (userStats) {
            userStats.count += 1;
            userStats.totalMinutes += activity.duration || 0;
          }
        }
      }
    }

    return statsByUser;
  };

  // Calculate current period
  const currentStats = calculateStatsForPeriod(
    currentPeriodStart,
    new Date(now),
  );

  // Calculate previous period
  const previousStats = calculateStatsForPeriod(
    previousPeriodStart,
    currentPeriodStart,
  );

  // Merge all user IDs from both periods
  const allUserIds = new Set([...currentStats.keys(), ...previousStats.keys()]);

  // Calculate percentage changes
  const calculatePercentageChange = (
    currentValue: number,
    previousValue: number,
  ): number | null => {
    if (previousValue === 0) return null;
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  // Build comparison data for each user
  const result: CoSleeperComparisonData[] = [];
  for (const userId of allUserIds) {
    const current = currentStats.get(userId) || { count: 0, totalMinutes: 0 };
    const previous = previousStats.get(userId) || { count: 0, totalMinutes: 0 };

    result.push({
      current,
      percentageChange: {
        count: calculatePercentageChange(current.count, previous.count),
        totalMinutes: calculatePercentageChange(
          current.totalMinutes,
          previous.totalMinutes,
        ),
      },
      previous,
      userId,
    });
  }

  return result;
}
