import type { Activities } from '@nugget/db/schema';
import { differenceInMinutes } from 'date-fns';
import { getOverdueThreshold } from '../../shared/overdue-thresholds';
import {
  calculateBabyAgeDays,
  getDiaperIntervalByAge,
} from './diaper-intervals';

export interface DiaperPrediction {
  nextDiaperTime: Date;
  confidenceLevel: 'high' | 'medium' | 'low';
  intervalHours: number;
  averageIntervalHours: number | null;
  lastDiaperTime: Date | null;
  lastDiaperType: string | null;
  recentDiaperPattern: Array<{
    time: Date;
    type: string | null;
    intervalFromPrevious: number | null;
  }>;
  isOverdue: boolean;
  overdueMinutes: number | null;
  suggestedRecoveryTime: Date | null;
  recentSkipTime: Date | null; // Time of most recent skip activity
  // Quick log smart defaults
  suggestedType: 'wet' | 'dirty' | 'both' | null; // predicted type based on recent pattern
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
    dataPoints: number; // number of recent diapers used
  };
}

interface DiaperActivity {
  id: string;
  startTime: Date;
  type: string;
  details: Record<string, unknown> | null;
}

/**
 * Calculate the time intervals between consecutive diaper changes
 */
function calculateIntervals(diapers: DiaperActivity[]): Array<number | null> {
  const intervals: Array<number | null> = [];

  for (let i = 0; i < diapers.length; i++) {
    if (i === 0) {
      intervals.push(null); // First diaper has no previous interval
    } else {
      const current = diapers[i];
      const previous = diapers[i - 1];
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
 * Extract diaper type from details
 */
function getDiaperType(details: Record<string, unknown> | null): string | null {
  if (!details) return null;

  // Check for type field in details
  if (typeof details.type === 'string') {
    return details.type;
  }

  // Check for common diaper type fields
  if (details.wet && details.dirty) {
    return 'both';
  }
  if (details.wet) {
    return 'wet';
  }
  if (details.dirty) {
    return 'dirty';
  }

  return null;
}

/**
 * Predict suggested diaper type based on recent pattern
 */
function predictDiaperType(
  diapers: DiaperActivity[],
): 'wet' | 'dirty' | 'both' | null {
  if (diapers.length === 0) return null;

  // Analyze last 5 diaper changes
  const recentTypes = diapers.slice(0, 5).map((d) => getDiaperType(d.details));
  const validTypes = recentTypes.filter((t): t is string => t !== null);

  if (validTypes.length === 0) return null;

  // Count occurrences
  const typeCounts: Record<string, number> = {};
  for (const type of validTypes) {
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }

  // Find most common type
  let maxCount = 0;
  let mostCommon: string | null = null;
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = type;
    }
  }

  // Return most common type if it's a valid diaper type
  if (mostCommon === 'wet' || mostCommon === 'dirty' || mostCommon === 'both') {
    return mostCommon;
  }

  return null;
}

/**
 * Analyze feeding-diaper correlation
 * Returns average time between feeding and subsequent diaper change
 */
function analyzeFeedingDiaperCorrelation(
  feedings: Array<typeof Activities.$inferSelect>,
  diapers: Array<typeof Activities.$inferSelect>,
): { averageMinutesAfterFeeding: number | null; confidence: number } {
  if (feedings.length === 0 || diapers.length === 0) {
    return { averageMinutesAfterFeeding: null, confidence: 0 };
  }

  const correlations: number[] = [];

  // For each feeding, find the next diaper change
  for (const feeding of feedings) {
    const feedingTime = new Date(feeding.startTime).getTime();

    // Find diapers that occurred after this feeding (within 4 hours)
    const nextDiapers = diapers.filter((d) => {
      const diaperTime = new Date(d.startTime).getTime();
      const minutesAfter = (diaperTime - feedingTime) / (1000 * 60);
      return minutesAfter > 0 && minutesAfter <= 240; // Within 4 hours
    });

    if (nextDiapers.length > 0) {
      // Get the first diaper after feeding
      const nextDiaper = nextDiapers[0];
      if (nextDiaper) {
        const minutesAfter =
          (new Date(nextDiaper.startTime).getTime() - feedingTime) /
          (1000 * 60);
        correlations.push(minutesAfter);
      }
    }
  }

  if (correlations.length === 0) {
    return { averageMinutesAfterFeeding: null, confidence: 0 };
  }

  const average =
    correlations.reduce((sum, val) => sum + val, 0) / correlations.length;
  const confidence = Math.min(correlations.length / 10, 1); // Max confidence at 10+ samples

  return { averageMinutesAfterFeeding: average, confidence };
}

/**
 * Analyze sleep-diaper correlation
 * Returns likelihood and timing of diaper changes around sleep
 */
function analyzeSleepDiaperCorrelation(
  sleeps: Array<typeof Activities.$inferSelect>,
  diapers: Array<typeof Activities.$inferSelect>,
): { averageMinutesBeforeSleep: number | null; confidence: number } {
  if (sleeps.length === 0 || diapers.length === 0) {
    return { averageMinutesBeforeSleep: null, confidence: 0 };
  }

  const correlations: number[] = [];

  // For each sleep, find diaper changes that occurred shortly before
  for (const sleep of sleeps) {
    const sleepTime = new Date(sleep.startTime).getTime();

    // Find diapers that occurred before this sleep (within 2 hours before)
    const priorDiapers = diapers.filter((d) => {
      const diaperTime = new Date(d.startTime).getTime();
      const minutesBefore = (sleepTime - diaperTime) / (1000 * 60);
      return minutesBefore > 0 && minutesBefore <= 120; // Within 2 hours before
    });

    if (priorDiapers.length > 0) {
      // Get the diaper closest to sleep time
      const closestDiaper = priorDiapers.at(-1);
      if (closestDiaper) {
        const minutesBefore =
          (sleepTime - new Date(closestDiaper.startTime).getTime()) /
          (1000 * 60);
        correlations.push(minutesBefore);
      }
    }
  }

  if (correlations.length === 0) {
    return { averageMinutesBeforeSleep: null, confidence: 0 };
  }

  const average =
    correlations.reduce((sum, val) => sum + val, 0) / correlations.length;
  const confidence = Math.min(correlations.length / 8, 1); // Max confidence at 8+ samples

  return { averageMinutesBeforeSleep: average, confidence };
}

/**
 * Enhanced prediction algorithm that combines:
 * - Age-based baseline interval (30%)
 * - Recent average interval (30%)
 * - Last interval (15%)
 * - Feeding correlation (15%)
 * - Sleep correlation (10%)
 */
export function predictNextDiaper(
  recentDiapers: Array<typeof Activities.$inferSelect>,
  babyBirthDate: Date | null,
  allActivities?: Array<typeof Activities.$inferSelect>,
): DiaperPrediction {
  // Filter to only diaper activities
  // Exclude skipped activities (dismissals don't count as real diaper changes)
  const diaperActivities = recentDiapers
    .filter(
      (a) =>
        a.type === 'diaper' &&
        !(a.details && 'skipped' in a.details && a.details.skipped === true),
    )
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    ) // Most recent first
    .slice(0, 15); // Consider last 15 diaper changes

  // Check for recent skip activities
  const skipActivities = diaperActivities.filter(
    (a) =>
      a.details &&
      typeof a.details === 'object' &&
      'skipped' in a.details &&
      a.details.skipped === true,
  );
  const recentSkipTime =
    skipActivities.length > 0 && skipActivities[0]
      ? new Date(skipActivities[0].startTime)
      : null;

  // Calculate baby's age for age-based interval
  const ageDays = calculateBabyAgeDays(babyBirthDate);
  const ageBasedInterval =
    ageDays !== null ? getDiaperIntervalByAge(ageDays) : 3;

  // No diaper changes yet - use age-based interval
  if (diaperActivities.length === 0) {
    const nextDiaperTime = new Date();
    nextDiaperTime.setHours(nextDiaperTime.getHours() + ageBasedInterval);

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
      lastDiaperTime: null,
      lastDiaperType: null,
      nextDiaperTime,
      overdueMinutes: null,
      recentDiaperPattern: [],
      recentSkipTime: null,
      suggestedRecoveryTime: null,
      suggestedType: null,
    };
  }

  const lastDiaper = diaperActivities[0];
  if (!lastDiaper) {
    // Should not happen since we checked length > 0, but satisfy TypeScript
    const nextDiaperTime = new Date();
    nextDiaperTime.setHours(nextDiaperTime.getHours() + ageBasedInterval);
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
      lastDiaperTime: null,
      lastDiaperType: null,
      nextDiaperTime,
      overdueMinutes: null,
      recentDiaperPattern: [],
      recentSkipTime: null,
      suggestedRecoveryTime: null,
      suggestedType: null,
    };
  }

  const lastDiaperTime = new Date(lastDiaper.startTime);
  const lastDiaperType = getDiaperType(lastDiaper.details);

  // Calculate intervals between consecutive diaper changes
  const intervals = calculateIntervals(diaperActivities);
  const validIntervals = intervals.filter(
    (i): i is number => i !== null && i !== undefined && i > 0 && i < 12,
  ); // Filter out null, undefined, and unrealistic intervals

  // Calculate average interval from recent diaper changes
  let averageInterval: number | null = null;
  if (validIntervals.length > 0) {
    const sum = validIntervals.reduce((acc, val) => acc + val, 0);
    averageInterval = sum / validIntervals.length;
  }

  // Get last interval (between last two diaper changes)
  const lastInterval: number | null =
    validIntervals.length > 0 ? (validIntervals[0] ?? null) : null;

  // Analyze feeding and sleep correlations if we have all activities
  let feedingFactor = 0;
  let sleepFactor = 0;

  if (allActivities && allActivities.length > 0) {
    // Get recent feedings
    const recentFeedings = allActivities
      .filter((a) => a.type === 'bottle' || a.type === 'nursing')
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      )
      .slice(0, 20);

    // Get recent sleeps
    const recentSleeps = allActivities
      .filter((a) => a.type === 'sleep')
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      )
      .slice(0, 15);

    // Analyze correlations
    const feedingCorr = analyzeFeedingDiaperCorrelation(
      recentFeedings,
      diaperActivities,
    );
    const sleepCorr = analyzeSleepDiaperCorrelation(
      recentSleeps,
      diaperActivities,
    );

    // Get last feeding time
    if (recentFeedings.length > 0 && recentFeedings[0]) {
      const lastFeedingTime = new Date(recentFeedings[0].startTime);
      const minutesSinceFeeding = differenceInMinutes(
        new Date(),
        lastFeedingTime,
      );

      // If we have correlation data and recent feeding
      if (
        feedingCorr.averageMinutesAfterFeeding !== null &&
        feedingCorr.confidence > 0.3 &&
        minutesSinceFeeding < 240
      ) {
        // Suggest diaper change based on feeding correlation
        const expectedMinutesFromNow =
          feedingCorr.averageMinutesAfterFeeding - minutesSinceFeeding;
        if (expectedMinutesFromNow > 0) {
          feedingFactor = expectedMinutesFromNow / 60; // Convert to hours
        }
      }
    }

    // Check if there's an upcoming sleep (use simple heuristic)
    if (
      recentSleeps.length > 0 &&
      sleepCorr.averageMinutesBeforeSleep !== null
    ) {
      // This is a simplified approach - in real scenario you'd predict next sleep time
      sleepFactor = sleepCorr.averageMinutesBeforeSleep / 60; // Convert to hours
    }
  }

  // Enhanced hybrid prediction: weighted average including correlations
  let predictedInterval: number;
  let confidenceLevel: 'high' | 'medium' | 'low';
  let weights = { ageBased: 0, lastInterval: 0, recentAverage: 0 };

  if (validIntervals.length >= 5) {
    // High confidence: have enough data points
    weights = { ageBased: 0.3, lastInterval: 0.15, recentAverage: 0.3 };
    const baselineComponent = ageBasedInterval * weights.ageBased;
    const avgComponent =
      (averageInterval || ageBasedInterval) * weights.recentAverage;
    const lastComponent =
      (lastInterval || ageBasedInterval) * weights.lastInterval;
    const feedingComponent = feedingFactor * 0.15;
    const sleepComponent = sleepFactor * 0.1;

    predictedInterval =
      baselineComponent +
      avgComponent +
      lastComponent +
      feedingComponent +
      sleepComponent;
    confidenceLevel = 'high';
  } else if (validIntervals.length >= 2) {
    // Medium confidence: some data but not much
    weights = { ageBased: 0.4, lastInterval: 0.15, recentAverage: 0.35 };
    predictedInterval =
      ageBasedInterval * weights.ageBased +
      (averageInterval || ageBasedInterval) * weights.recentAverage +
      (lastInterval || ageBasedInterval) * weights.lastInterval +
      feedingFactor * 0.1;
    confidenceLevel = 'medium';
  } else {
    // Low confidence: fall back to age-based with slight feeding adjustment
    weights = { ageBased: 0.85, lastInterval: 0, recentAverage: 0 };
    predictedInterval =
      ageBasedInterval * weights.ageBased + feedingFactor * 0.15;
    confidenceLevel = 'low';
  }

  // Ensure reasonable bounds (1-6 hours)
  predictedInterval = Math.max(1, Math.min(6, predictedInterval));

  // Calculate next diaper time
  const nextDiaperTime = new Date(lastDiaperTime);
  nextDiaperTime.setMinutes(
    nextDiaperTime.getMinutes() + predictedInterval * 60,
  );

  // Build recent pattern for display
  const recentPattern = diaperActivities.slice(0, 5).map((diaper, idx) => ({
    intervalFromPrevious: intervals[idx] ?? null,
    time: new Date(diaper.startTime),
    type: getDiaperType(diaper.details),
  }));

  // Check if overdue and calculate recovery time
  const overdueThreshold = getOverdueThreshold('diaper', ageDays);
  const now = new Date();
  const minutesUntil = differenceInMinutes(nextDiaperTime, now);
  const isOverdue = minutesUntil < -overdueThreshold;
  const overdueMinutes = isOverdue ? Math.abs(minutesUntil) : null;

  // Calculate recovery time if overdue
  let suggestedRecoveryTime: Date | null = null;
  if (isOverdue) {
    suggestedRecoveryTime = new Date();
    // Suggest next diaper change in 0.5 to 0.7 of normal interval
    const recoveryInterval = predictedInterval * 0.6;
    suggestedRecoveryTime.setMinutes(
      suggestedRecoveryTime.getMinutes() + recoveryInterval * 60,
    );
  }

  return {
    averageIntervalHours: averageInterval,
    calculationDetails: {
      ageBasedInterval,
      dataPoints: diaperActivities.length,
      lastInterval,
      recentAverageInterval: averageInterval,
      weights,
    },
    confidenceLevel,
    intervalHours: predictedInterval,
    isOverdue,
    lastDiaperTime,
    lastDiaperType,
    nextDiaperTime,
    overdueMinutes,
    recentDiaperPattern: recentPattern,
    recentSkipTime,
    suggestedRecoveryTime,
    suggestedType: predictDiaperType(diaperActivities),
  };
}

/**
 * Check if diaper change is overdue using dynamic threshold
 */
export function isDiaperOverdue(
  nextDiaperTime: Date,
  babyAgeDays: number | null,
): boolean {
  const now = new Date();
  const minutesOverdue = differenceInMinutes(now, nextDiaperTime);
  const threshold = getOverdueThreshold('diaper', babyAgeDays);
  return minutesOverdue > threshold;
}

/**
 * Get status of upcoming diaper change with dynamic threshold
 */
export function getDiaperStatus(
  nextDiaperTime: Date,
  babyAgeDays: number | null,
): 'upcoming' | 'soon' | 'overdue' {
  const now = new Date();
  const minutesUntil = differenceInMinutes(nextDiaperTime, now);
  const threshold = getOverdueThreshold('diaper', babyAgeDays);

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
