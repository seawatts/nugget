import type { Activities } from '@nugget/db/schema';
import { differenceInHours, format } from 'date-fns';
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
 * Calculate diaper statistics from the last 24 hours (rolling window)
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
  // Rolling 24-hour window instead of calendar day
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Filter to diapers from the last 24 hours
  const todaysDiapers = activities.filter((activity) => {
    const activityDate = new Date(activity.startTime);
    const isRecent = activityDate >= twentyFourHoursAgo;
    const isDiaper = activity.type === 'diaper';
    return isRecent && isDiaper;
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

export interface DiaperStatsComparison {
  current: { total: number; wet: number; dirty: number; both: number };
  previous: { total: number; wet: number; dirty: number; both: number };
  percentageChange: {
    total: number | null;
    wet: number | null;
    dirty: number | null;
    both: number | null;
  };
}

/**
 * Calculate diaper statistics with comparison between current and previous 24-hour periods
 * Current period: 0-24 hours ago
 * Previous period: 24-48 hours ago
 */
export function calculateDiaperStatsWithComparison(
  activities: Array<typeof Activities.$inferSelect>,
  timeRangeHours = 24, // Default to 24 hours for backward compatibility
): DiaperStatsComparison {
  const now = Date.now();
  const currentPeriodStart = new Date(now - timeRangeHours * 60 * 60 * 1000);
  const previousPeriodStart = new Date(
    now - timeRangeHours * 2 * 60 * 60 * 1000,
  );

  // Helper function to calculate stats for a time period
  const calculateStatsForPeriod = (startTime: Date, endTime: Date) => {
    const diapers = activities.filter((activity) => {
      if (activity.type !== 'diaper') return false;
      const activityDate = new Date(activity.startTime);
      return activityDate >= startTime && activityDate < endTime;
    });

    const total = diapers.length;
    let wet = 0;
    let dirty = 0;
    let both = 0;

    for (const diaper of diapers) {
      const details = diaper.details as { type?: string } | null;
      const type = details?.type;

      if (type === 'wet') {
        wet++;
      } else if (type === 'dirty') {
        dirty++;
      } else if (type === 'both') {
        both++;
        wet++;
        dirty++;
      }
    }

    return { both, dirty, total, wet };
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
    currentValue: number,
    previousValue: number,
  ): number | null => {
    if (previousValue === 0) return null;
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  const percentageChange = {
    both: calculatePercentageChange(current.both, previous.both),
    dirty: calculatePercentageChange(current.dirty, previous.dirty),
    total: calculatePercentageChange(current.total, previous.total),
    wet: calculatePercentageChange(current.wet, previous.wet),
  };

  return {
    current,
    percentageChange,
    previous,
  };
}

/**
 * Calculate diaper statistics grouped by day for trend charts
 * Returns data for the last 7 days
 */
export function calculateDiaperTrendData(
  activities: Array<typeof Activities.$inferSelect>,
): Array<{ date: string; wet: number; dirty: number; both: number }> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Filter to diapers from the last 7 days
  const recentDiapers = activities.filter((activity) => {
    const activityDate = new Date(activity.startTime);
    const isRecent = activityDate >= sevenDaysAgo;
    const isDiaper = activity.type === 'diaper';
    return isRecent && isDiaper;
  });

  // Group by date
  const statsByDate = new Map<
    string,
    { wet: number; dirty: number; both: number }
  >();

  for (const activity of recentDiapers) {
    const date = new Date(activity.startTime);
    const dateKey = format(date, 'yyyy-MM-dd');

    if (!statsByDate.has(dateKey)) {
      statsByDate.set(dateKey, { both: 0, dirty: 0, wet: 0 });
    }

    const stats = statsByDate.get(dateKey);
    if (!stats) continue;

    const details = activity.details as { type?: string } | null;
    const type = details?.type;

    if (type === 'wet') {
      stats.wet++;
    } else if (type === 'dirty') {
      stats.dirty++;
    } else if (type === 'both') {
      stats.both++;
    }
  }

  // Convert to array and fill in missing dates
  const result: Array<{
    date: string;
    wet: number;
    dirty: number;
    both: number;
  }> = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = format(date, 'yyyy-MM-dd');
    const stats = statsByDate.get(dateKey) || { both: 0, dirty: 0, wet: 0 };
    result.push({
      both: stats.both,
      date: dateKey,
      dirty: stats.dirty,
      wet: stats.wet,
    });
  }

  return result;
}
