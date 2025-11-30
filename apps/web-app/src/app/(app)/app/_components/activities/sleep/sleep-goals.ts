import type { Activities } from '@nugget/db/schema';
import { differenceInHours, format, startOfDay } from 'date-fns';
import { calculateWeightedInterval } from '../shared/adaptive-weighting';
import { calculateBabyAgeDaysForDate } from '../shared/baby-age-utils';
import { calculatePredictedIntervalForDate } from '../shared/utils/date-based-prediction';
import { filterActivitiesByTimePeriod } from '../shared/utils/time-period-utils';
import { getSleepIntervalByAge } from './sleep-intervals';

/**
 * Get age-based nap count recommendation
 */
function getAgeBasedNapCount(ageDays: number): number {
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
 * Calculate recommended daily nap count based on baby's age and actual patterns
 * Uses adaptive weighting to gradually shift from age-based to pattern-based recommendations
 * @param ageDays - Baby's age in days
 * @param predictedIntervalHours - Optional predicted interval from the prediction algorithm
 * @param dataPointsCount - Optional number of recent activities used in prediction
 * @param targetDate - Optional target date to calculate goal for (defaults to today)
 * @param activitiesUpToDate - Optional activities filtered up to target date for prediction
 * @param babyBirthDate - Optional birth date (required if using targetDate)
 * @returns Estimated number of naps per day
 */
export function getDailyNapGoal(
  ageDays: number,
  predictedIntervalHours?: number | null,
  dataPointsCount?: number,
  targetDate?: Date,
  activitiesUpToDate?: Array<typeof Activities.$inferSelect>,
  babyBirthDate?: Date | null,
): number {
  // If targetDate is provided, calculate age and prediction for that date
  if (targetDate && babyBirthDate !== undefined && activitiesUpToDate) {
    const targetAgeDays = calculateBabyAgeDaysForDate(
      babyBirthDate,
      targetDate,
    );
    if (targetAgeDays !== null) {
      const prediction = calculatePredictedIntervalForDate(
        activitiesUpToDate,
        targetDate,
        babyBirthDate,
        'sleep',
      );
      const ageBasedInterval = getSleepIntervalByAge(targetAgeDays);

      if (
        prediction.predictedIntervalHours !== null &&
        prediction.dataPointsCount !== undefined
      ) {
        const weightedInterval = calculateWeightedInterval(
          ageBasedInterval,
          prediction.predictedIntervalHours,
          prediction.dataPointsCount,
        );

        // Calculate nap count based on weighted interval
        const wakefulHours =
          targetAgeDays <= 90 ? 10 : targetAgeDays <= 180 ? 12 : 14;
        const napCount = Math.round(wakefulHours / weightedInterval);

        // Ensure reasonable bounds based on age
        const minNaps = targetAgeDays <= 90 ? 3 : targetAgeDays <= 365 ? 2 : 1;
        const maxNaps =
          targetAgeDays <= 28
            ? 6
            : targetAgeDays <= 90
              ? 5
              : targetAgeDays <= 365
                ? 4
                : 3;

        return Math.max(minNaps, Math.min(maxNaps, napCount));
      }
      return getAgeBasedNapCount(targetAgeDays);
    }
  }

  // Original logic for backward compatibility
  // Get age-based interval for sleep
  const ageBasedInterval = getSleepIntervalByAge(ageDays);

  // If no prediction data or data points count, use age-based recommendation
  if (!predictedIntervalHours || dataPointsCount === undefined) {
    return getAgeBasedNapCount(ageDays);
  }

  // Calculate weighted interval using adaptive algorithm
  const weightedInterval = calculateWeightedInterval(
    ageBasedInterval,
    predictedIntervalHours,
    dataPointsCount,
  );

  // Calculate nap count based on weighted interval
  // Assuming baby is awake for ~12-14 hours during the day (varies by age)
  const wakefulHours = ageDays <= 90 ? 10 : ageDays <= 180 ? 12 : 14;
  const napCount = Math.round(wakefulHours / weightedInterval);

  // Ensure reasonable bounds based on age
  const minNaps = ageDays <= 90 ? 3 : ageDays <= 365 ? 2 : 1;
  const maxNaps =
    ageDays <= 28 ? 6 : ageDays <= 90 ? 5 : ageDays <= 365 ? 4 : 3;

  return Math.max(minNaps, Math.min(maxNaps, napCount));
}

/**
 * Calculate recommended total daily sleep hours based on baby's age
 * Returns hours as a number
 * @param ageDays - Baby's age in days
 * @param targetDate - Optional target date to calculate goal for (defaults to today)
 * @param babyBirthDate - Optional birth date (required if using targetDate)
 */
export function getDailySleepHoursGoal(
  ageDays: number,
  targetDate?: Date,
  babyBirthDate?: Date | null,
): number {
  // If targetDate is provided, use it for age calculation
  let effectiveAgeDays = ageDays;
  if (targetDate && babyBirthDate !== undefined) {
    const targetAgeDays = calculateBabyAgeDaysForDate(
      babyBirthDate,
      targetDate,
    );
    if (targetAgeDays !== null) {
      effectiveAgeDays = targetAgeDays;
    }
  }

  // Newborn (0-7 days): 14-17 hours
  if (effectiveAgeDays <= 7) return 16;
  // 1-4 weeks: 14-17 hours
  if (effectiveAgeDays <= 28) return 15;
  // 1-3 months: 14-17 hours
  if (effectiveAgeDays <= 90) return 15;
  // 3-6 months: 12-16 hours
  if (effectiveAgeDays <= 180) return 14;
  // 6-9 months: 12-15 hours
  if (effectiveAgeDays <= 270) return 13;
  // 9-12 months: 11-14 hours
  if (effectiveAgeDays <= 365) return 13;
  // 12-18 months: 11-14 hours
  if (effectiveAgeDays <= 547) return 12;
  // 18-24 months: 11-14 hours
  if (effectiveAgeDays <= 730) return 12;
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
  const now = new Date();
  const nowMs = now.getTime();
  const today = startOfDay(now);

  // Filter to sleep sessions that ENDED today (or are in progress)
  const todaysSleeps = activities.filter((activity) => {
    if (activity.type !== 'sleep') return false;

    const isSkipped = Boolean(
      activity.details &&
        typeof activity.details === 'object' &&
        'skipped' in activity.details &&
        (activity.details as { skipped?: boolean }).skipped === true,
    );

    if (isSkipped) return false;

    const hasDuration =
      typeof activity.duration === 'number' && activity.duration >= 0;

    // For completed sleep: check if it ended today (zero-duration counts as finished)
    if (hasDuration) {
      const durationMinutes = Math.max(activity.duration ?? 0, 0);
      const startTime = new Date(activity.startTime);
      const endTime = new Date(
        startTime.getTime() + durationMinutes * 60 * 1000,
      );
      return endTime >= today;
    }

    // For in-progress sleep: check if it started before now
    const startTime = new Date(activity.startTime);
    return startTime < now;
  });

  // For in-progress sleep, calculate elapsed time
  const sleepsWithDuration = todaysSleeps.map((activity) => {
    const hasDuration =
      typeof activity.duration === 'number' && activity.duration >= 0;

    if (hasDuration) {
      return {
        ...activity,
        duration: Math.max(activity.duration ?? 0, 0),
      };
    }

    // Calculate elapsed time for in-progress sleep
    const elapsed = Math.max(
      Math.floor(
        (nowMs - new Date(activity.startTime).getTime()) / (1000 * 60),
      ),
      0,
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
  timeRange: '24h' | '7d' | '2w' | '1m' | '3m' | '6m' = '7d',
  timePeriod?: 'all' | 'night' | 'day',
): Array<{ date: string; count: number; totalMinutes: number }> {
  const now = new Date();

  if (timeRange === '24h') {
    // For 24h view, group by hour
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Filter to sleeps from the last 24 hours
    let recentSleeps = activities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      const isRecent = activityDate >= twentyFourHoursAgo;
      const isSleep = activity.type === 'sleep';
      return isRecent && isSleep;
    });

    // Apply time period filter if specified
    if (timePeriod && timePeriod !== 'all') {
      recentSleeps = filterActivitiesByTimePeriod(recentSleeps, timePeriod);
    }

    // Group by hour
    const statsByHour = new Map<
      string,
      { count: number; totalMinutes: number }
    >();

    for (const activity of recentSleeps) {
      const date = new Date(activity.startTime);
      // Format as "yyyy-MM-dd HH:00" for hourly grouping
      const hourKey = format(date, 'yyyy-MM-dd HH:00');

      if (!statsByHour.has(hourKey)) {
        statsByHour.set(hourKey, { count: 0, totalMinutes: 0 });
      }

      const stats = statsByHour.get(hourKey);
      if (!stats) continue;

      stats.count += 1;
      stats.totalMinutes += activity.duration || 0;
    }

    // Convert to array and fill in missing hours
    const result: Array<{ date: string; count: number; totalMinutes: number }> =
      [];
    for (let i = 23; i >= 0; i -= 1) {
      const date = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = format(date, 'yyyy-MM-dd HH:00');
      const stats = statsByHour.get(hourKey) || { count: 0, totalMinutes: 0 };
      result.push({
        count: stats.count,
        date: hourKey,
        totalMinutes: stats.totalMinutes,
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

  // Filter to sleeps from the selected time range
  let recentSleeps = activities.filter((activity) => {
    const activityDate = new Date(activity.startTime);
    const isRecent = activityDate >= startDate;
    const isSleep = activity.type === 'sleep';
    return isRecent && isSleep;
  });

  // Apply time period filter if specified
  if (timePeriod && timePeriod !== 'all') {
    recentSleeps = filterActivitiesByTimePeriod(recentSleeps, timePeriod);
  }

  if (useWeeklyGrouping) {
    // Group by week
    const statsByWeek = new Map<
      string,
      { count: number; totalMinutes: number }
    >();

    for (const activity of recentSleeps) {
      const date = new Date(activity.startTime);
      // Get the Monday of the week for this date
      const dayOfWeek = date.getDay();
      const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; // Adjust so Monday is first day
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() + diff);
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = format(weekStart, 'yyyy-MM-dd');

      if (!statsByWeek.has(weekKey)) {
        statsByWeek.set(weekKey, { count: 0, totalMinutes: 0 });
      }

      const stats = statsByWeek.get(weekKey);
      if (!stats) continue;

      stats.count += 1;
      stats.totalMinutes += activity.duration || 0;
    }

    // Convert to array and fill in missing weeks
    const result: Array<{ date: string; count: number; totalMinutes: number }> =
      [];
    const numWeeks = Math.ceil((days ?? 7) / 7);
    for (let i = numWeeks - 1; i >= 0; i -= 1) {
      const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const dayOfWeek = date.getDay();
      const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() + diff);
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      const stats = statsByWeek.get(weekKey) || { count: 0, totalMinutes: 0 };
      result.push({
        count: stats.count,
        date: weekKey,
        totalMinutes: stats.totalMinutes,
      });
    }

    return result;
  }

  // For daily grouping (7d, 2w, 1m)
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
  for (let i = (days ?? 7) - 1; i >= 0; i -= 1) {
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
  timeRange: '24h' | '7d' | '2w' | '1m' | '3m' | '6m' = '7d',
): CoSleeperTrendData[] {
  const now = new Date();

  if (timeRange === '24h') {
    // For 24h view, group by hour
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Filter to co-sleeping sessions from the last 24 hours
    const recentCoSleeps = activities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      const isRecent = activityDate >= twentyFourHoursAgo;
      const isSleep = activity.type === 'sleep';
      const isCoSleeping =
        activity.details &&
        activity.details.type === 'sleep' &&
        activity.details.isCoSleeping === true &&
        Array.isArray(activity.details.coSleepingWith) &&
        activity.details.coSleepingWith.length > 0;
      return isRecent && isSleep && isCoSleeping;
    });

    // Group by hour and user
    const statsByHour = new Map<
      string,
      Record<string, { count: number; totalMinutes: number }>
    >();

    for (const activity of recentCoSleeps) {
      const date = new Date(activity.startTime);
      const hourKey = format(date, 'yyyy-MM-dd HH:00');

      if (!statsByHour.has(hourKey)) {
        statsByHour.set(hourKey, {});
      }

      const hourStats = statsByHour.get(hourKey);
      if (!hourStats) continue;

      // Add stats for each co-sleeping family member
      if (
        activity.details &&
        activity.details.type === 'sleep' &&
        Array.isArray(activity.details.coSleepingWith)
      ) {
        for (const userId of activity.details.coSleepingWith) {
          if (!hourStats[userId]) {
            hourStats[userId] = { count: 0, totalMinutes: 0 };
          }
          hourStats[userId].count += 1;
          hourStats[userId].totalMinutes += activity.duration || 0;
        }
      }
    }

    // Convert to array and fill in missing hours
    const result: CoSleeperTrendData[] = [];
    for (let i = 23; i >= 0; i -= 1) {
      const date = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = format(date, 'yyyy-MM-dd HH:00');
      const stats = statsByHour.get(hourKey) || {};
      result.push({
        byUser: stats,
        date: hourKey,
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

  // Filter to co-sleeping sessions from the selected time range
  const recentCoSleeps = activities.filter((activity) => {
    const activityDate = new Date(activity.startTime);
    const isRecent = activityDate >= startDate;
    const isSleep = activity.type === 'sleep';
    const isCoSleeping =
      activity.details &&
      activity.details.type === 'sleep' &&
      activity.details.isCoSleeping === true &&
      Array.isArray(activity.details.coSleepingWith) &&
      activity.details.coSleepingWith.length > 0;
    return isRecent && isSleep && isCoSleeping;
  });

  if (useWeeklyGrouping) {
    // Group by week and user
    const statsByWeek = new Map<
      string,
      Record<string, { count: number; totalMinutes: number }>
    >();

    for (const activity of recentCoSleeps) {
      const date = new Date(activity.startTime);
      // Get the Monday of the week for this date
      const dayOfWeek = date.getDay();
      const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() + diff);
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = format(weekStart, 'yyyy-MM-dd');

      if (!statsByWeek.has(weekKey)) {
        statsByWeek.set(weekKey, {});
      }

      const weekStats = statsByWeek.get(weekKey);
      if (!weekStats) continue;

      // Add stats for each co-sleeping family member
      if (
        activity.details &&
        activity.details.type === 'sleep' &&
        Array.isArray(activity.details.coSleepingWith)
      ) {
        for (const userId of activity.details.coSleepingWith) {
          if (!weekStats[userId]) {
            weekStats[userId] = { count: 0, totalMinutes: 0 };
          }
          weekStats[userId].count += 1;
          weekStats[userId].totalMinutes += activity.duration || 0;
        }
      }
    }

    // Convert to array and fill in missing weeks
    const result: CoSleeperTrendData[] = [];
    const numWeeks = Math.ceil((days ?? 7) / 7);
    for (let i = numWeeks - 1; i >= 0; i -= 1) {
      const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const dayOfWeek = date.getDay();
      const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() + diff);
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      const stats = statsByWeek.get(weekKey) || {};
      result.push({
        byUser: stats,
        date: weekKey,
      });
    }

    return result;
  }

  // For daily grouping (7d, 2w, 1m)
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
  for (let i = (days ?? 7) - 1; i >= 0; i -= 1) {
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
