import type { Activities } from '@nugget/db/schema';
import { differenceInMinutes } from 'date-fns';
import { getOverdueThreshold } from '../../shared/overdue-thresholds';
import { calculateBabyAgeDays } from '../shared/baby-age-utils';
import { getFeedingIntervalByAge } from './feeding-intervals';

export interface FeedingPrediction {
  nextFeedingTime: Date;
  confidenceLevel: 'high' | 'medium' | 'low';
  intervalHours: number;
  averageIntervalHours: number | null;
  lastFeedingTime: Date | null;
  lastFeedingAmount: number | null; // in ml
  recentFeedingPattern: Array<{
    time: Date;
    intervalFromPrevious: number | null;
  }>;
  isOverdue: boolean;
  overdueMinutes: number | null;
  suggestedRecoveryTime: Date | null;
  recentSkipTime: Date | null;
}

interface FeedingActivity {
  id: string;
  startTime: Date;
  type: string;
  amount: number | null;
}

/**
 * Calculate the time intervals between consecutive feedings
 */
function calculateIntervals(feedings: FeedingActivity[]): Array<number | null> {
  const intervals: Array<number | null> = [];

  for (let i = 0; i < feedings.length; i++) {
    if (i === 0) {
      intervals.push(null); // First feeding has no previous interval
    } else {
      const current = feedings[i];
      const previous = feedings[i - 1];
      if (current && previous) {
        const currentTime = new Date(current.startTime);
        const previousTime = new Date(previous.startTime);
        const hoursApart = differenceInMinutes(currentTime, previousTime) / 60;
        intervals.push(hoursApart);
      } else {
        intervals.push(null);
      }
    }
  }

  return intervals;
}

/**
 * Hybrid prediction algorithm that combines:
 * - Age-based baseline interval (40%)
 * - Recent average interval (40%)
 * - Last interval (20%)
 */
export function predictNextFeeding(
  recentFeedings: Array<typeof Activities.$inferSelect>,
  babyBirthDate: Date | null,
  babyFeedIntervalHours?: number | null,
): FeedingPrediction {
  // Filter to only feeding activities (bottle, nursing)
  // Exclude scheduled activities and skipped activities (dismissals don't count as real feedings)
  const feedingActivities = recentFeedings
    .filter(
      (a) =>
        (a.type === 'bottle' || a.type === 'nursing') &&
        !a.isScheduled &&
        !(a.details && 'skipped' in a.details && a.details.skipped === true),
    )
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    ) // Most recent first
    .slice(0, 10); // Consider last 10 feedings

  // Find most recent skip activity
  const skipActivities = recentFeedings
    .filter(
      (a) =>
        (a.type === 'bottle' || a.type === 'nursing') &&
        a.details &&
        'skipped' in a.details &&
        a.details.skipped === true,
    )
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
  const recentSkipTime = skipActivities[0]
    ? new Date(skipActivities[0].startTime)
    : null;

  // Calculate baby's age for age-based interval
  const ageDays = calculateBabyAgeDays(babyBirthDate);
  const ageBasedInterval =
    ageDays !== null
      ? getFeedingIntervalByAge(ageDays)
      : babyFeedIntervalHours || 3;

  // No feedings yet - use age-based interval
  if (feedingActivities.length === 0) {
    const nextFeedingTime = new Date();
    nextFeedingTime.setHours(nextFeedingTime.getHours() + ageBasedInterval);

    return {
      averageIntervalHours: null,
      confidenceLevel: 'low',
      intervalHours: ageBasedInterval,
      isOverdue: false,
      lastFeedingAmount: null,
      lastFeedingTime: null,
      nextFeedingTime,
      overdueMinutes: null,
      recentFeedingPattern: [],
      recentSkipTime,
      suggestedRecoveryTime: null,
    };
  }

  const lastFeeding = feedingActivities[0];
  if (!lastFeeding) {
    // Should not happen since we checked length > 0, but satisfy TypeScript
    const nextFeedingTime = new Date();
    nextFeedingTime.setHours(nextFeedingTime.getHours() + ageBasedInterval);
    return {
      averageIntervalHours: null,
      confidenceLevel: 'low',
      intervalHours: ageBasedInterval,
      isOverdue: false,
      lastFeedingAmount: null,
      lastFeedingTime: null,
      nextFeedingTime,
      overdueMinutes: null,
      recentFeedingPattern: [],
      recentSkipTime,
      suggestedRecoveryTime: null,
    };
  }
  const lastFeedingTime = new Date(lastFeeding.startTime);
  const lastFeedingAmount = lastFeeding.amount || null;

  // Calculate intervals between consecutive feedings
  const intervals = calculateIntervals(feedingActivities);
  const validIntervals = intervals.filter(
    (i): i is number => i !== null && i !== undefined && i > 0 && i < 12,
  ); // Filter out null, undefined, and unrealistic intervals

  // Calculate average interval from recent feedings
  let averageInterval: number | null = null;
  if (validIntervals.length > 0) {
    const sum = validIntervals.reduce((acc, val) => acc + val, 0);
    averageInterval = sum / validIntervals.length;
  }

  // Get last interval (between last two feedings)
  const lastInterval = validIntervals.length > 0 ? validIntervals[0] : null;

  // Hybrid prediction: weighted average
  let predictedInterval: number;
  let confidenceLevel: 'high' | 'medium' | 'low';

  if (validIntervals.length >= 3) {
    // High confidence: have enough data points
    predictedInterval =
      ageBasedInterval * 0.4 +
      (averageInterval || ageBasedInterval) * 0.4 +
      (lastInterval || ageBasedInterval) * 0.2;
    confidenceLevel = 'high';
  } else if (validIntervals.length >= 1) {
    // Medium confidence: some data but not much
    predictedInterval =
      ageBasedInterval * 0.5 +
      (averageInterval || ageBasedInterval) * 0.3 +
      (lastInterval || ageBasedInterval) * 0.2;
    confidenceLevel = 'medium';
  } else {
    // Low confidence: fall back to age-based
    predictedInterval = ageBasedInterval;
    confidenceLevel = 'low';
  }

  // Calculate next feeding time
  const nextFeedingTime = new Date(lastFeedingTime);
  nextFeedingTime.setMinutes(
    nextFeedingTime.getMinutes() + predictedInterval * 60,
  );

  // Build recent pattern for display
  const recentPattern = feedingActivities.slice(0, 5).map((feeding, idx) => ({
    intervalFromPrevious: intervals[idx] ?? null,
    time: new Date(feeding.startTime),
  }));

  // Check if overdue and calculate recovery time
  const overdueThreshold = getOverdueThreshold('feeding', ageDays);
  const now = new Date();
  const minutesUntil = differenceInMinutes(nextFeedingTime, now);
  const isOverdue = minutesUntil < -overdueThreshold;
  const overdueMinutes = isOverdue ? Math.abs(minutesUntil) : null;

  // Calculate recovery time if overdue
  let suggestedRecoveryTime: Date | null = null;
  if (isOverdue) {
    suggestedRecoveryTime = new Date();
    // Suggest next feeding in 0.5 to 0.7 of normal interval
    const recoveryInterval = predictedInterval * 0.6;
    suggestedRecoveryTime.setMinutes(
      suggestedRecoveryTime.getMinutes() + recoveryInterval * 60,
    );
  }

  return {
    averageIntervalHours: averageInterval,
    confidenceLevel,
    intervalHours: predictedInterval,
    isOverdue,
    lastFeedingAmount,
    lastFeedingTime,
    nextFeedingTime,
    overdueMinutes,
    recentFeedingPattern: recentPattern,
    recentSkipTime,
    suggestedRecoveryTime,
  };
}

/**
 * Check if feeding is overdue using dynamic threshold
 */
export function isFeedingOverdue(
  nextFeedingTime: Date,
  babyAgeDays: number | null,
): boolean {
  const now = new Date();
  const minutesOverdue = differenceInMinutes(now, nextFeedingTime);
  const threshold = getOverdueThreshold('feeding', babyAgeDays);
  return minutesOverdue > threshold;
}

/**
 * Get status of upcoming feeding with dynamic threshold
 */
export function getFeedingStatus(
  nextFeedingTime: Date,
  babyAgeDays: number | null,
): 'upcoming' | 'soon' | 'overdue' {
  const now = new Date();
  const minutesUntil = differenceInMinutes(nextFeedingTime, now);
  const threshold = getOverdueThreshold('feeding', babyAgeDays);

  if (minutesUntil < -threshold) {
    return 'overdue';
  }

  // "Soon" window is half the overdue threshold
  const soonThreshold = Math.min(30, threshold / 2);
  if (minutesUntil <= soonThreshold) {
    return 'soon';
  }

  return 'upcoming';
}
