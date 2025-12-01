import type { BabyCustomPreferences } from '@nugget/db';
import { getPreferenceWeight } from '@nugget/db';
import type { Activities } from '@nugget/db/schema';
import { differenceInMinutes } from 'date-fns';
import { calculateBabyAgeDays } from '../shared/baby-age-utils';
import {
  type BlendResult,
  blendPredictionValues,
} from '../shared/prediction-blending';
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
  // Quick log smart defaults
  suggestedAmount: number | null; // in ml, blended from custom/recent/age
  suggestedDuration: number | null; // in minutes, blended from custom/recent/age
  suggestedType: 'bottle' | 'nursing' | null; // from custom preference or most common type
  suggestionSource: string; // Description of where the suggestion came from
  amountBlendResult: BlendResult | null; // Detailed blend breakdown for amount
  durationBlendResult: BlendResult | null; // Detailed blend breakdown for duration
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
 * Calculate the most common feeding type from recent feedings
 * Returns 'nursing' as default if no feedings or tied counts
 */
function getMostCommonFeedingType(
  feedingActivities: FeedingActivity[],
): 'bottle' | 'nursing' {
  if (feedingActivities.length === 0) {
    return 'nursing'; // Default to nursing if no history
  }

  // Count occurrences of each type
  let bottleCount = 0;
  let nursingCount = 0;

  for (const feeding of feedingActivities) {
    if (feeding.type === 'bottle') {
      bottleCount++;
    } else if (feeding.type === 'nursing') {
      nursingCount++;
    }
  }

  // Return the most common type, defaulting to nursing if tied or neither found
  if (bottleCount > nursingCount) {
    return 'bottle';
  }
  return 'nursing';
}

/**
 * Get age-based feeding amount as fallback (in ml)
 */
function getAgeBasedAmount(ageDays: number | null): number {
  if (!ageDays) return 120; // Default to 4oz if age unknown

  if (ageDays <= 2) return 45; // 1.5 oz
  if (ageDays <= 7) return 75; // 2.5 oz
  if (ageDays <= 14) return 90; // 3 oz
  if (ageDays <= 30) return 120; // 4 oz
  if (ageDays <= 60) return 150; // 5 oz
  return 180; // 6 oz for 61+ days
}

/**
 * Calculate average amount from recent bottle feedings
 */
function getRecentAverageAmount(
  feedingActivities: FeedingActivity[],
): number | null {
  const bottleFeedings = feedingActivities.filter(
    (a) => a.type === 'bottle' && a.amountMl && a.amountMl > 0,
  );

  if (bottleFeedings.length === 0) return null;

  const sum = bottleFeedings.reduce((acc, f) => acc + (f.amountMl || 0), 0);
  return sum / bottleFeedings.length;
}

/**
 * Hybrid prediction algorithm that combines:
 * - Age-based baseline interval (40%)
 * - Recent average interval (40%)
 * - Last interval (20%)
 * - Custom user preferences (blended with predictions)
 */
export function predictNextFeeding(
  recentFeedings: Array<typeof Activities.$inferSelect>,
  babyBirthDate: Date | null,
  babyFeedIntervalHours?: number | null,
  customPreferences?: BabyCustomPreferences | null,
): FeedingPrediction {
  // Filter to only feeding activities (bottle, nursing, solids)
  // Exclude scheduled activities
  const feedingActivities = recentFeedings
    .filter(
      (a) =>
        (a.type === 'bottle' || a.type === 'nursing' || a.type === 'solids') &&
        !a.isScheduled,
    )
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    ) // Most recent first
    .slice(0, 10); // Consider last 10 feedings

  // Calculate baby's age for age-based interval
  const ageDays = calculateBabyAgeDays(babyBirthDate);
  const ageBasedInterval =
    ageDays !== null
      ? getFeedingIntervalByAge(ageDays)
      : babyFeedIntervalHours || 3;

  // Get preference weight for feeding (default 0.4 = 40%)
  const preferenceWeight = getPreferenceWeight(customPreferences, 'feeding');

  // Calculate adjusted weights based on preference weight
  // If preferenceWeight is high (e.g., 1.0), most weight goes to custom
  // Remaining weight is split between recent and age-based
  const remainingWeight = 1 - preferenceWeight;
  const recentWeight = remainingWeight * 0.67; // 67% of remaining
  const ageBasedWeight = remainingWeight * 0.33; // 33% of remaining

  // No feedings yet - use age-based interval
  if (feedingActivities.length === 0) {
    const nextFeedingTime = new Date();
    nextFeedingTime.setHours(nextFeedingTime.getHours() + ageBasedInterval);

    // Blend amount with custom preferences (no recent data)
    const ageBasedAmount = getAgeBasedAmount(ageDays);
    const amountBlend = blendPredictionValues({
      ageBasedValue: ageBasedAmount,
      ageBasedWeight,
      customValue: customPreferences?.feeding?.bottleAmountMl,
      customWeight: preferenceWeight,
      recentValue: null,
      recentWeight,
    });

    // Blend duration with custom preferences (no recent data)
    const ageBasedDuration = getTypicalFeedingDuration(ageDays);
    const durationBlend = blendPredictionValues({
      ageBasedValue: ageBasedDuration,
      ageBasedWeight,
      customValue: customPreferences?.feeding?.nursingDurationMinutes,
      customWeight: preferenceWeight,
      recentValue: null,
      recentWeight,
    });

    return {
      amountBlendResult: amountBlend,
      averageIntervalHours: null,
      calculationDetails: {
        ageBasedInterval,
        dataPoints: 0,
        lastInterval: null,
        recentAverageInterval: null,
        weights: { ageBased: 1.0, lastInterval: 0, recentAverage: 0 },
      },
      confidenceLevel: 'low',
      durationBlendResult: durationBlend,
      intervalHours: ageBasedInterval,
      lastFeedingAmount: null,
      lastFeedingTime: null,
      nextFeedingTime,
      recentFeedingPattern: [],
      suggestedAmount: amountBlend.value,
      suggestedDuration: durationBlend.value,
      suggestedType: customPreferences?.feeding?.preferredType || 'nursing', // Use custom preference or default
      suggestionSource: `Amount: ${amountBlend.source}, Duration: ${durationBlend.source}`,
    };
  }

  const lastFeeding = feedingActivities[0];
  if (!lastFeeding) {
    // Should not happen since we checked length > 0, but satisfy TypeScript
    const nextFeedingTime = new Date();
    nextFeedingTime.setHours(nextFeedingTime.getHours() + ageBasedInterval);

    const ageBasedAmount = getAgeBasedAmount(ageDays);
    const amountBlend = blendPredictionValues({
      ageBasedValue: ageBasedAmount,
      ageBasedWeight,
      customValue: customPreferences?.feeding?.bottleAmountMl,
      customWeight: preferenceWeight,
      recentValue: null,
      recentWeight,
    });

    const ageBasedDuration = getTypicalFeedingDuration(ageDays);
    const durationBlend = blendPredictionValues({
      ageBasedValue: ageBasedDuration,
      ageBasedWeight,
      customValue: customPreferences?.feeding?.nursingDurationMinutes,
      customWeight: preferenceWeight,
      recentValue: null,
      recentWeight,
    });

    return {
      amountBlendResult: amountBlend,
      averageIntervalHours: null,
      calculationDetails: {
        ageBasedInterval,
        dataPoints: 0,
        lastInterval: null,
        recentAverageInterval: null,
        weights: { ageBased: 1.0, lastInterval: 0, recentAverage: 0 },
      },
      confidenceLevel: 'low',
      durationBlendResult: durationBlend,
      intervalHours: ageBasedInterval,
      lastFeedingAmount: null,
      lastFeedingTime: null,
      nextFeedingTime,
      recentFeedingPattern: [],
      suggestedAmount: amountBlend.value,
      suggestedDuration: durationBlend.value,
      suggestedType: customPreferences?.feeding?.preferredType || 'nursing',
      suggestionSource: `Amount: ${amountBlend.source}, Duration: ${durationBlend.source}`,
    };
  }
  const lastFeedingTime = new Date(lastFeeding.startTime);
  const lastFeedingAmount = lastFeeding.amountMl || null;

  // Calculate the most common feeding type from recent history
  const mostCommonType = getMostCommonFeedingType(feedingActivities);

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

  // Blend suggested amount with custom preferences
  const ageBasedAmount = getAgeBasedAmount(ageDays);
  const recentAverageAmount = getRecentAverageAmount(feedingActivities);
  const amountBlend = blendPredictionValues({
    ageBasedValue: ageBasedAmount,
    ageBasedWeight,
    customValue: customPreferences?.feeding?.bottleAmountMl,
    customWeight: preferenceWeight,
    recentValue: recentAverageAmount,
    recentWeight,
  });

  // Blend suggested duration with custom preferences
  const ageBasedDuration = getTypicalFeedingDuration(ageDays);
  const durationBlend = blendPredictionValues({
    ageBasedValue: ageBasedDuration,
    ageBasedWeight,
    customValue: customPreferences?.feeding?.nursingDurationMinutes,
    customWeight: preferenceWeight,
    recentValue: null, // We don't track duration history yet
    recentWeight,
  });

  return {
    amountBlendResult: amountBlend,
    averageIntervalHours: averageInterval,
    calculationDetails: {
      ageBasedInterval,
      dataPoints: feedingActivities.length,
      lastInterval,
      recentAverageInterval: averageInterval,
      weights,
    },
    confidenceLevel,
    durationBlendResult: durationBlend,
    intervalHours: predictedInterval,
    lastFeedingAmount,
    lastFeedingTime,
    nextFeedingTime,
    recentFeedingPattern: recentPattern,
    suggestedAmount: amountBlend.value,
    suggestedDuration: durationBlend.value,
    suggestedType: customPreferences?.feeding?.preferredType || mostCommonType, // Use custom preference if set
    suggestionSource: `Amount: ${amountBlend.source}, Duration: ${durationBlend.source}`,
  };
}
