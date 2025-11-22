import type { Activities } from '@nugget/db/schema';
import { differenceInMinutes } from 'date-fns';
import { getOverdueThreshold } from '../../shared/overdue-thresholds';
import {
  calculateBabyAgeDays,
  getPumpingIntervalByAge,
} from './pumping-intervals';

export interface PumpingPrediction {
  nextPumpingTime: Date;
  confidenceLevel: 'high' | 'medium' | 'low';
  intervalHours: number;
  averageIntervalHours: number | null;
  lastPumpingTime: Date | null;
  lastPumpingAmount: number | null; // in ml
  recentPumpingPattern: Array<{
    time: Date;
    amountMl: number | null;
    intervalFromPrevious: number | null;
  }>;
  isOverdue: boolean;
  overdueMinutes: number | null;
  suggestedRecoveryTime: Date | null;
  recentSkipTime: Date | null;
  // Quick log smart defaults
  suggestedVolume: number | null; // in ml, from last session
  suggestedDuration: number | null; // in minutes, age-based typical duration
  // Calculation components for displaying how prediction works
  calculationDetails: {
    ageBasedInterval: number; // hours
    recentAverageInterval: number | null; // hours
    lastInterval: number | null; // hours
    weights: {
      ageBased: number;
      recentAverage: number;
      lastInterval: number;
    };
    dataPoints: number; // number of recent pumpings used
  };
}

interface PumpingActivity {
  id: string;
  startTime: Date;
  type: string;
  amountMl: number | null;
}

/**
 * Calculate the time intervals between consecutive pumping sessions
 */
function calculateIntervals(pumpings: PumpingActivity[]): Array<number | null> {
  const intervals: Array<number | null> = [];

  for (let i = 0; i < pumpings.length; i++) {
    if (i === 0) {
      intervals.push(null); // First pumping has no previous interval
    } else {
      const current = pumpings[i];
      const previous = pumpings[i - 1];
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
 * Calculate typical pumping duration based on baby's age (in minutes)
 */
function getTypicalPumpingDuration(ageDays: number | null): number {
  if (ageDays === null) return 20; // Default 20 minutes

  if (ageDays <= 30) return 15; // First month: 15 minutes
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
export function predictNextPumping(
  recentPumpings: Array<typeof Activities.$inferSelect>,
  babyBirthDate: Date | null,
): PumpingPrediction {
  // Filter to only pumping activities
  // Exclude scheduled activities and skipped activities (dismissals don't count as real pumping)
  const pumpingActivities = recentPumpings
    .filter(
      (a) =>
        a.type === 'pumping' &&
        !a.isScheduled &&
        !(a.details && 'skipped' in a.details && a.details.skipped === true),
    )
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    ) // Most recent first
    .slice(0, 10); // Consider last 10 pumping sessions

  // Find most recent skip activity
  const skipActivities = recentPumpings
    .filter(
      (a) =>
        a.type === 'pumping' &&
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
    ageDays !== null ? getPumpingIntervalByAge(ageDays) : 3;

  // No pumping sessions yet - use age-based interval
  if (pumpingActivities.length === 0) {
    const nextPumpingTime = new Date();
    nextPumpingTime.setHours(nextPumpingTime.getHours() + ageBasedInterval);

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
      lastPumpingAmount: null,
      lastPumpingTime: null,
      nextPumpingTime,
      overdueMinutes: null,
      recentPumpingPattern: [],
      recentSkipTime,
      suggestedDuration: getTypicalPumpingDuration(ageDays),
      suggestedRecoveryTime: null,
      suggestedVolume: null,
    };
  }

  const lastPumping = pumpingActivities[0];
  if (!lastPumping) {
    // Should not happen since we checked length > 0, but satisfy TypeScript
    const nextPumpingTime = new Date();
    nextPumpingTime.setHours(nextPumpingTime.getHours() + ageBasedInterval);
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
      lastPumpingAmount: null,
      lastPumpingTime: null,
      nextPumpingTime,
      overdueMinutes: null,
      recentPumpingPattern: [],
      recentSkipTime,
      suggestedDuration: getTypicalPumpingDuration(ageDays),
      suggestedRecoveryTime: null,
      suggestedVolume: null,
    };
  }

  const lastPumpingTime = new Date(lastPumping.startTime);
  const lastPumpingAmount = lastPumping.amountMl || null;

  // Calculate intervals between consecutive pumping sessions
  const intervals = calculateIntervals(pumpingActivities);
  const validIntervals = intervals.filter(
    (i): i is number => i !== null && i !== undefined && i > 0 && i < 12,
  ); // Filter out null, undefined, and unrealistic intervals

  // Calculate average interval from recent pumpings
  let averageInterval: number | null = null;
  if (validIntervals.length > 0) {
    const sum = validIntervals.reduce((acc, val) => acc + val, 0);
    averageInterval = sum / validIntervals.length;
  }

  // Get last interval (between last two pumping sessions)
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

  // Calculate next pumping time
  const nextPumpingTime = new Date(lastPumpingTime);
  nextPumpingTime.setMinutes(
    nextPumpingTime.getMinutes() + predictedInterval * 60,
  );

  // Build recent pattern for display
  const recentPattern = pumpingActivities.slice(0, 5).map((pumping, idx) => ({
    amountMl: pumping.amountMl || null,
    intervalFromPrevious: intervals[idx] ?? null,
    time: new Date(pumping.startTime),
  }));

  // Check if overdue and calculate recovery time
  const overdueThreshold = getOverdueThreshold('pumping', ageDays);
  const now = new Date();
  const minutesUntil = differenceInMinutes(nextPumpingTime, now);
  const isOverdue = minutesUntil < -overdueThreshold;
  const overdueMinutes = isOverdue ? Math.abs(minutesUntil) : null;

  // Calculate recovery time if overdue
  let suggestedRecoveryTime: Date | null = null;
  if (isOverdue) {
    suggestedRecoveryTime = new Date();
    // Suggest next pumping in 0.5 to 0.7 of normal interval
    const recoveryInterval = predictedInterval * 0.6;
    suggestedRecoveryTime.setMinutes(
      suggestedRecoveryTime.getMinutes() + recoveryInterval * 60,
    );
  }

  return {
    averageIntervalHours: averageInterval,
    calculationDetails: {
      ageBasedInterval,
      dataPoints: pumpingActivities.length,
      lastInterval,
      recentAverageInterval: averageInterval,
      weights,
    },
    confidenceLevel,
    intervalHours: predictedInterval,
    isOverdue,
    lastPumpingAmount,
    lastPumpingTime,
    nextPumpingTime,
    overdueMinutes,
    recentPumpingPattern: recentPattern,
    recentSkipTime,
    suggestedDuration: getTypicalPumpingDuration(ageDays),
    suggestedRecoveryTime,
    suggestedVolume: lastPumpingAmount,
  };
}

/**
 * Check if pumping is overdue using dynamic threshold
 */
export function isPumpingOverdue(
  nextPumpingTime: Date,
  babyAgeDays: number | null,
): boolean {
  const now = new Date();
  const minutesOverdue = differenceInMinutes(now, nextPumpingTime);
  const threshold = getOverdueThreshold('pumping', babyAgeDays);
  return minutesOverdue > threshold;
}

/**
 * Get status of upcoming pumping with dynamic threshold
 */
export function getPumpingStatus(
  nextPumpingTime: Date,
  babyAgeDays: number | null,
): 'upcoming' | 'soon' | 'overdue' {
  const now = new Date();
  const minutesUntil = differenceInMinutes(nextPumpingTime, now);
  const threshold = getOverdueThreshold('pumping', babyAgeDays);

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
