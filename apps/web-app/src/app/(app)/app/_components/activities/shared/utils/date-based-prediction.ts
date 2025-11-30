import type { Activities } from '@nugget/db/schema';
import { differenceInMinutes } from 'date-fns';
import { getDiaperIntervalByAge } from '../../diaper/diaper-intervals';
import { getFeedingIntervalByAge } from '../../feeding/feeding-intervals';
import { getSleepIntervalByAge } from '../../sleep/sleep-intervals';
import { calculateBabyAgeDaysForDate } from '../baby-age-utils';

export interface PredictedIntervalResult {
  predictedIntervalHours: number | null;
  dataPointsCount: number;
  averageIntervalHours: number | null;
}

/**
 * Filter activities up to a specific date (inclusive)
 */
export function filterActivitiesUpToDate(
  activities: Array<typeof Activities.$inferSelect>,
  targetDate: Date,
): Array<typeof Activities.$inferSelect> {
  const target = new Date(targetDate);
  return activities.filter((activity) => {
    const activityDate = new Date(activity.startTime);
    return activityDate <= target;
  });
}

/**
 * Calculate intervals between consecutive activities
 */
function calculateIntervals(
  activities: Array<{ startTime: Date | string }>,
): Array<number | null> {
  const intervals: Array<number | null> = [];

  for (let i = 0; i < activities.length; i++) {
    if (i === 0) {
      intervals.push(null); // First activity has no previous interval
    } else {
      const current = activities[i];
      const previous = activities[i - 1];
      if (current && previous) {
        const currentTime = new Date(current.startTime);
        const previousTime = new Date(previous.startTime);
        const hoursApart = differenceInMinutes(previousTime, currentTime) / 60;
        intervals.push(hoursApart);
      } else {
        intervals.push(null);
      }
    }
  }

  return intervals;
}

/**
 * Calculate predicted feeding interval for a specific date
 * Uses activities up to that date to predict the interval
 */
export function calculatePredictedIntervalForDate(
  activities: Array<typeof Activities.$inferSelect>,
  targetDate: Date,
  babyBirthDate: Date | null,
  activityType: 'feeding' | 'diaper' | 'sleep' = 'feeding',
): PredictedIntervalResult {
  // Filter activities up to target date
  const activitiesUpToDate = filterActivitiesUpToDate(activities, targetDate);

  // Calculate baby's age for the target date
  const ageDays = calculateBabyAgeDaysForDate(babyBirthDate, targetDate);

  // Get age-based interval
  let ageBasedInterval: number;
  if (activityType === 'feeding') {
    ageBasedInterval = ageDays !== null ? getFeedingIntervalByAge(ageDays) : 3; // Default 3 hours
  } else if (activityType === 'diaper') {
    ageBasedInterval = ageDays !== null ? getDiaperIntervalByAge(ageDays) : 3; // Default 3 hours
  } else {
    // sleep
    ageBasedInterval = ageDays !== null ? getSleepIntervalByAge(ageDays) : 3; // Default 3 hours
  }

  // Filter to relevant activity types and exclude scheduled/skipped
  const relevantActivities = activitiesUpToDate
    .filter((a) => {
      if (activityType === 'feeding') {
        return (
          (a.type === 'bottle' ||
            a.type === 'nursing' ||
            a.type === 'solids' ||
            a.type === 'feeding') &&
          !a.isScheduled &&
          !(a.details && 'skipped' in a.details && a.details.skipped === true)
        );
      }
      if (activityType === 'diaper') {
        return (
          a.type === 'diaper' &&
          !a.isScheduled &&
          !(a.details && 'skipped' in a.details && a.details.skipped === true)
        );
      }
      // sleep
      return (
        a.type === 'sleep' &&
        !a.isScheduled &&
        !(a.details && 'skipped' in a.details && a.details.skipped === true)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    )
    .slice(0, 10); // Consider last 10 activities

  // No activities - return age-based only
  if (relevantActivities.length === 0) {
    return {
      averageIntervalHours: null,
      dataPointsCount: 0,
      predictedIntervalHours: ageBasedInterval,
    };
  }

  // Calculate intervals between consecutive activities
  const intervals = calculateIntervals(relevantActivities);
  const validIntervals = intervals.filter(
    (i): i is number =>
      i !== null &&
      i !== undefined &&
      i > 0 &&
      i < (activityType === 'feeding' ? 12 : 24),
  );

  // Calculate average interval from recent activities
  let averageInterval: number | null = null;
  if (validIntervals.length > 0) {
    const sum = validIntervals.reduce((acc, val) => acc + val, 0);
    averageInterval = sum / validIntervals.length;
  }

  // Get last interval (between last two activities)
  const lastInterval: number | null =
    validIntervals.length > 0 ? (validIntervals[0] ?? null) : null;

  // Hybrid prediction: weighted average (same logic as prediction.ts)
  let predictedInterval: number;
  let weights = { ageBased: 0, lastInterval: 0, recentAverage: 0 };

  if (validIntervals.length >= 3) {
    // High confidence: have enough data points
    weights = { ageBased: 0.4, lastInterval: 0.2, recentAverage: 0.4 };
    predictedInterval =
      ageBasedInterval * weights.ageBased +
      (averageInterval || ageBasedInterval) * weights.recentAverage +
      (lastInterval || ageBasedInterval) * weights.lastInterval;
  } else if (validIntervals.length >= 1) {
    // Medium confidence: some data but not much
    weights = { ageBased: 0.5, lastInterval: 0.2, recentAverage: 0.3 };
    predictedInterval =
      ageBasedInterval * weights.ageBased +
      (averageInterval || ageBasedInterval) * weights.recentAverage +
      (lastInterval || ageBasedInterval) * weights.lastInterval;
  } else {
    // Low confidence: fall back to age-based
    weights = { ageBased: 1.0, lastInterval: 0, recentAverage: 0 };
    predictedInterval = ageBasedInterval;
  }

  return {
    averageIntervalHours: averageInterval,
    dataPointsCount: validIntervals.length,
    predictedIntervalHours: predictedInterval,
  };
}
