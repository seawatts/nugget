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
    amountMl: number | null;
    duration: number | null;
    notes: string | null;
    type: string | null;
  }>;
  isOverdue: boolean;
  overdueMinutes: number | null;
  suggestedRecoveryTime: Date | null;
  recentSkipTime: Date | null;
  // Quick log smart defaults
  suggestedAmount: number | null; // in ml, from last feeding
  suggestedDuration: number | null; // in minutes, age-based typical duration
  suggestedType: 'bottle' | 'nursing' | null; // last feeding type
  // Calculation components for displaying how prediction works
  calculationDetails: {
    ageBasedInterval: number; // hours
    recentAverageInterval: number | null; // hours
    lastInterval: number | null; // hours
    weights: {
      ageBased: number; // e.g., 0.4 for 40%
      recentAverage: number; // e.g., 0.4 for 40%
      lastInterval: number; // e.g., 0.2 for 20%
    };
    dataPoints: number; // number of recent feedings used
  };
}

interface FeedingActivity {
  id: string;
  startTime: Date;
  type: string;
  amountMl: number | null;
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
 * Calculate typical feeding duration based on baby's age (in minutes)
 */
function getTypicalFeedingDuration(ageDays: number | null): number {
  if (ageDays === null) return 20; // Default 20 minutes

  if (ageDays <= 7) return 30; // Week 1: 30 minutes
  if (ageDays <= 30) return 25; // Weeks 2-4: 25 minutes
  if (ageDays <= 90) return 20; // Months 2-3: 20 minutes
  if (ageDays <= 180) return 15; // Months 4-6: 15 minutes
  return 15; // 6+ months: 15 minutes
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
      calculationDetails: {
        ageBasedInterval,
        dataPoints: 0,
        lastInterval: null,
        recentAverageInterval: null,
        weights: { ageBased: 1.0, lastInterval: 0, recentAverage: 0 },
      },
      confidenceLevel: 'low',
      intervalHours: ageBasedInterval,
      isOverdue: false,
      lastFeedingAmount: null,
      lastFeedingTime: null,
      nextFeedingTime,
      overdueMinutes: null,
      recentFeedingPattern: [],
      recentSkipTime,
      suggestedAmount: null,
      suggestedDuration: getTypicalFeedingDuration(ageDays),
      suggestedRecoveryTime: null,
      suggestedType: null,
    };
  }

  const lastFeeding = feedingActivities[0];
  if (!lastFeeding) {
    // Should not happen since we checked length > 0, but satisfy TypeScript
    const nextFeedingTime = new Date();
    nextFeedingTime.setHours(nextFeedingTime.getHours() + ageBasedInterval);
    return {
      averageIntervalHours: null,
      calculationDetails: {
        ageBasedInterval,
        dataPoints: 0,
        lastInterval: null,
        recentAverageInterval: null,
        weights: { ageBased: 1.0, lastInterval: 0, recentAverage: 0 },
      },
      confidenceLevel: 'low',
      intervalHours: ageBasedInterval,
      isOverdue: false,
      lastFeedingAmount: null,
      lastFeedingTime: null,
      nextFeedingTime,
      overdueMinutes: null,
      recentFeedingPattern: [],
      recentSkipTime,
      suggestedAmount: null,
      suggestedDuration: getTypicalFeedingDuration(ageDays),
      suggestedRecoveryTime: null,
      suggestedType: null,
    };
  }
  const lastFeedingTime = new Date(lastFeeding.startTime);
  const lastFeedingAmount = lastFeeding.amountMl || null;
  const lastFeedingType =
    lastFeeding.type === 'bottle' || lastFeeding.type === 'nursing'
      ? lastFeeding.type
      : null;

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
  const lastInterval: number | null =
    validIntervals.length > 0 ? (validIntervals[0] ?? null) : null;

  // Hybrid prediction: weighted average
  let predictedInterval: number;
  let confidenceLevel: 'high' | 'medium' | 'low';
  let weights = { ageBased: 0, lastInterval: 0, recentAverage: 0 };

  if (validIntervals.length >= 3) {
    // High confidence: have enough data points
    weights = { ageBased: 0.4, lastInterval: 0.2, recentAverage: 0.4 };
    predictedInterval =
      ageBasedInterval * weights.ageBased +
      (averageInterval || ageBasedInterval) * weights.recentAverage +
      (lastInterval || ageBasedInterval) * weights.lastInterval;
    confidenceLevel = 'high';
  } else if (validIntervals.length >= 1) {
    // Medium confidence: some data but not much
    weights = { ageBased: 0.5, lastInterval: 0.2, recentAverage: 0.3 };
    predictedInterval =
      ageBasedInterval * weights.ageBased +
      (averageInterval || ageBasedInterval) * weights.recentAverage +
      (lastInterval || ageBasedInterval) * weights.lastInterval;
    confidenceLevel = 'medium';
  } else {
    // Low confidence: fall back to age-based
    weights = { ageBased: 1.0, lastInterval: 0, recentAverage: 0 };
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
    amountMl: feeding.amountMl,
    duration: feeding.duration,
    intervalFromPrevious: intervals[idx] ?? null,
    notes: feeding.notes,
    time: new Date(feeding.startTime),
    type: feeding.type,
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
    calculationDetails: {
      ageBasedInterval,
      dataPoints: feedingActivities.length,
      lastInterval,
      recentAverageInterval: averageInterval,
      weights,
    },
    confidenceLevel,
    intervalHours: predictedInterval,
    isOverdue,
    lastFeedingAmount,
    lastFeedingTime,
    nextFeedingTime,
    overdueMinutes,
    recentFeedingPattern: recentPattern,
    recentSkipTime,
    suggestedAmount: lastFeedingAmount,
    suggestedDuration: getTypicalFeedingDuration(ageDays),
    suggestedRecoveryTime,
    suggestedType: lastFeedingType,
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
