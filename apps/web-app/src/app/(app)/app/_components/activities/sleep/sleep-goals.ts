import type { Activities } from '@nugget/db/schema';
import { differenceInHours, startOfDay } from 'date-fns';

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
  napCount: number;
  totalSleepMinutes: number;
  avgNapDuration: number | null;
  longestNapMinutes: number | null;
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

  // Calculate nap count
  const napCount = sleepsWithDuration.length;

  // Calculate total sleep time in minutes
  const totalSleepMinutes = sleepsWithDuration.reduce((sum, activity) => {
    return sum + (activity.duration || 0);
  }, 0);

  // Calculate average nap duration
  let avgNapDuration: number | null = null;
  if (napCount > 0) {
    avgNapDuration = totalSleepMinutes / napCount;
  }

  // Find longest nap
  let longestNapMinutes: number | null = null;
  if (napCount > 0) {
    longestNapMinutes = Math.max(
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
    avgNapDuration,
    longestNapMinutes,
    napCount,
    totalSleepMinutes,
  };
}
