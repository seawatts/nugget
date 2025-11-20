import type { Activities } from '@nugget/db/schema';
import { differenceInMinutes } from 'date-fns';
import { getOverdueThreshold } from '../../shared/overdue-thresholds';
import { calculateBabyAgeDays, getSleepIntervalByAge } from './sleep-intervals';

export interface SleepPrediction {
  nextSleepTime: Date;
  confidenceLevel: 'high' | 'medium' | 'low';
  intervalHours: number;
  averageIntervalHours: number | null;
  lastSleepTime: Date | null;
  lastSleepDuration: number | null; // in minutes
  recentSleepPattern: Array<{
    time: Date;
    duration: number | null;
    intervalFromPrevious: number | null;
  }>;
  isOverdue: boolean;
  overdueMinutes: number | null;
  suggestedRecoveryTime: Date | null;
  suggestedDuration: number; // in minutes, suggested duration for quick log
  recentSkipTime: Date | null;
}

interface SleepActivity {
  id: string;
  startTime: Date;
  type: string;
  duration: number | null;
}

/**
 * Calculate the time intervals between consecutive sleep sessions
 */
function calculateIntervals(sleeps: SleepActivity[]): Array<number | null> {
  const intervals: Array<number | null> = [];

  for (let i = 0; i < sleeps.length; i++) {
    if (i === 0) {
      intervals.push(null); // First sleep has no previous interval
    } else {
      const current = sleeps[i];
      const previous = sleeps[i - 1];
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
 * Calculate suggested sleep duration for quick log based on baby's age and recent patterns
 */
function calculateSuggestedDuration(
  babyAgeDays: number | null,
  recentSleeps: SleepActivity[],
): number {
  // Age-based duration defaults (in minutes)
  let ageBasedDuration: number;

  if (babyAgeDays === null) {
    ageBasedDuration = 60; // Default 1 hour
  } else if (babyAgeDays <= 90) {
    // 0-3 months: shorter naps
    ageBasedDuration = 45;
  } else if (babyAgeDays <= 180) {
    // 3-6 months: 1-1.5 hours
    ageBasedDuration = 75;
  } else if (babyAgeDays <= 365) {
    // 6-12 months: 1-2 hours
    ageBasedDuration = 90;
  } else {
    // 12+ months: 1.5-2 hours
    ageBasedDuration = 105;
  }

  // Calculate average duration from recent sleeps
  const validDurations = recentSleeps
    .map((s) => s.duration)
    .filter((d): d is number => d !== null && d > 0 && d < 480); // Filter realistic durations (< 8 hours)

  if (validDurations.length >= 3) {
    const avgDuration =
      validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length;
    // Weight: 60% recent average, 40% age-based
    return Math.round(avgDuration * 0.6 + ageBasedDuration * 0.4);
  }

  if (validDurations.length > 0) {
    const avgDuration =
      validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length;
    // Weight: 40% recent average, 60% age-based (less confidence)
    return Math.round(avgDuration * 0.4 + ageBasedDuration * 0.6);
  }

  // No recent data, use age-based
  return ageBasedDuration;
}

/**
 * Hybrid prediction algorithm that combines:
 * - Age-based baseline interval (40%)
 * - Recent average interval (40%)
 * - Last interval (20%)
 */
export function predictNextSleep(
  recentSleeps: Array<typeof Activities.$inferSelect>,
  babyBirthDate: Date | null,
): SleepPrediction {
  // Filter to only sleep activities
  const sleepActivities = recentSleeps
    .filter((a) => a.type === 'sleep' && !a.isScheduled)
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    ) // Most recent first
    .slice(0, 10); // Consider last 10 sleep sessions

  // Find most recent skip activity
  const skipActivities = recentSleeps
    .filter(
      (a) =>
        a.type === 'sleep' &&
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
    ageDays !== null ? getSleepIntervalByAge(ageDays) : 3;

  // No sleep sessions yet - use age-based interval
  if (sleepActivities.length === 0) {
    const nextSleepTime = new Date();
    nextSleepTime.setHours(nextSleepTime.getHours() + ageBasedInterval);
    const suggestedDuration = calculateSuggestedDuration(ageDays, []);

    return {
      averageIntervalHours: null,
      confidenceLevel: 'low',
      intervalHours: ageBasedInterval,
      isOverdue: false,
      lastSleepDuration: null,
      lastSleepTime: null,
      nextSleepTime,
      overdueMinutes: null,
      recentSkipTime,
      recentSleepPattern: [],
      suggestedDuration,
      suggestedRecoveryTime: null,
    };
  }

  const lastSleep = sleepActivities[0];
  if (!lastSleep) {
    // Should not happen since we checked length > 0, but satisfy TypeScript
    const nextSleepTime = new Date();
    nextSleepTime.setHours(nextSleepTime.getHours() + ageBasedInterval);
    const suggestedDuration = calculateSuggestedDuration(ageDays, []);

    return {
      averageIntervalHours: null,
      confidenceLevel: 'low',
      intervalHours: ageBasedInterval,
      isOverdue: false,
      lastSleepDuration: null,
      lastSleepTime: null,
      nextSleepTime,
      overdueMinutes: null,
      recentSkipTime,
      recentSleepPattern: [],
      suggestedDuration,
      suggestedRecoveryTime: null,
    };
  }

  const lastSleepTime = new Date(lastSleep.startTime);
  const lastSleepDuration = lastSleep.duration || null;

  // Calculate intervals between consecutive sleep sessions
  const intervals = calculateIntervals(sleepActivities);
  const validIntervals = intervals.filter(
    (i): i is number => i !== null && i !== undefined && i > 0 && i < 24,
  ); // Filter out null, undefined, and unrealistic intervals

  // Calculate average interval from recent sleeps
  let averageInterval: number | null = null;
  if (validIntervals.length > 0) {
    const sum = validIntervals.reduce((acc, val) => acc + val, 0);
    averageInterval = sum / validIntervals.length;
  }

  // Get last interval (between last two sleep sessions)
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

  // Calculate next sleep time
  const nextSleepTime = new Date(lastSleepTime);
  nextSleepTime.setMinutes(nextSleepTime.getMinutes() + predictedInterval * 60);

  // Build recent pattern for display
  const recentPattern = sleepActivities.slice(0, 5).map((sleep, idx) => ({
    duration: sleep.duration || null,
    intervalFromPrevious: intervals[idx] ?? null,
    time: new Date(sleep.startTime),
  }));

  // Check if overdue and calculate recovery time (reuse ageDays from earlier)
  const overdueThreshold = getOverdueThreshold('sleep', ageDays);
  const now = new Date();
  const minutesUntil = differenceInMinutes(nextSleepTime, now);
  const isOverdue = minutesUntil < -overdueThreshold;
  const overdueMinutes = isOverdue ? Math.abs(minutesUntil) : null;

  // Calculate recovery time if overdue
  let suggestedRecoveryTime: Date | null = null;
  if (isOverdue) {
    suggestedRecoveryTime = new Date();
    // Suggest next sleep in 0.5 to 0.7 of normal interval
    const recoveryInterval = predictedInterval * 0.6;
    suggestedRecoveryTime.setMinutes(
      suggestedRecoveryTime.getMinutes() + recoveryInterval * 60,
    );
  }

  // Calculate suggested duration for quick log
  const suggestedDuration = calculateSuggestedDuration(
    ageDays,
    sleepActivities,
  );

  return {
    averageIntervalHours: averageInterval,
    confidenceLevel,
    intervalHours: predictedInterval,
    isOverdue,
    lastSleepDuration,
    lastSleepTime,
    nextSleepTime,
    overdueMinutes,
    recentSkipTime,
    recentSleepPattern: recentPattern,
    suggestedDuration,
    suggestedRecoveryTime,
  };
}

/**
 * Check if sleep is overdue using dynamic threshold
 */
export function isSleepOverdue(
  nextSleepTime: Date,
  babyAgeDays: number | null,
): boolean {
  const now = new Date();
  const minutesOverdue = differenceInMinutes(now, nextSleepTime);
  const threshold = getOverdueThreshold('sleep', babyAgeDays);
  return minutesOverdue > threshold;
}

/**
 * Get status of upcoming sleep with dynamic threshold
 */
export function getSleepStatus(
  nextSleepTime: Date,
  babyAgeDays: number | null,
): 'upcoming' | 'soon' | 'overdue' {
  const now = new Date();
  const minutesUntil = differenceInMinutes(nextSleepTime, now);
  const threshold = getOverdueThreshold('sleep', babyAgeDays);

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
