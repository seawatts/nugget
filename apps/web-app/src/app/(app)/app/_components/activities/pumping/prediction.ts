import type { BabyCustomPreferences } from '@nugget/db';
import { getPreferenceWeight } from '@nugget/db';
import type { Activities } from '@nugget/db/schema';
import { differenceInMinutes } from 'date-fns';
import {
  type BlendResult,
  blendPredictionValues,
} from '../shared/prediction-blending';
import {
  calculateBabyAgeDays,
  getPumpingIntervalByAge,
} from './pumping-intervals';
import { getAgeBasedPumpingAmounts } from './pumping-volume-utils';

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
    duration: number | null;
    notes: string | null;
  }>;
  // Quick log smart defaults
  suggestedVolume: number | null; // in ml, blended from custom/recent/age
  suggestedDuration: number | null; // in minutes, blended from custom/recent/age
  suggestionSource: string; // Description of where the suggestion came from
  volumeBlendResult: BlendResult | null; // Detailed blend breakdown for volume
  durationBlendResult: BlendResult | null; // Detailed blend breakdown for duration
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
 * Calculate average volume from recent pumping sessions
 */
function getRecentAverageVolume(
  pumpingActivities: PumpingActivity[],
): number | null {
  const sessionsWithVolume = pumpingActivities.filter(
    (a) => a.amountMl && a.amountMl > 0,
  );

  if (sessionsWithVolume.length === 0) return null;

  const sum = sessionsWithVolume.reduce((acc, p) => acc + (p.amountMl || 0), 0);
  return sum / sessionsWithVolume.length;
}

/**
 * Hybrid prediction algorithm that combines:
 * - Age-based baseline interval (40%)
 * - Recent average interval (40%)
 * - Last interval (20%)
 * - Custom user preferences (blended with predictions)
 */
export function predictNextPumping(
  recentPumpings: Array<typeof Activities.$inferSelect>,
  babyBirthDate: Date | null,
  customPreferences?: BabyCustomPreferences | null,
): PumpingPrediction {
  // Filter to only pumping activities
  // Exclude scheduled activities
  const pumpingActivities = recentPumpings
    .filter((a) => a.type === 'pumping' && !a.isScheduled)
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    ) // Most recent first
    .slice(0, 10); // Consider last 10 pumping sessions

  // Calculate baby's age for age-based interval
  const ageDays = calculateBabyAgeDays(babyBirthDate);
  const ageBasedInterval =
    ageDays !== null ? getPumpingIntervalByAge(ageDays) : 3;

  // Get preference weight for pumping (default 0.4 = 40%)
  const preferenceWeight = getPreferenceWeight(customPreferences, 'pumping');

  // Calculate adjusted weights based on preference weight
  // If preferenceWeight is high (e.g., 1.0), most weight goes to custom
  // Remaining weight is split between recent and age-based
  const remainingWeight = 1 - preferenceWeight;
  const recentWeight = remainingWeight * 0.67; // 67% of remaining
  const ageBasedWeight = remainingWeight * 0.33; // 33% of remaining

  // No pumping sessions yet - use age-based interval
  if (pumpingActivities.length === 0) {
    const nextPumpingTime = new Date();
    nextPumpingTime.setHours(nextPumpingTime.getHours() + ageBasedInterval);

    // Blend volume with custom preferences (no recent data)
    const ageBasedAmounts = getAgeBasedPumpingAmounts(ageDays);
    const volumeBlend = blendPredictionValues({
      ageBasedValue: ageBasedAmounts.medium,
      ageBasedWeight,
      customValue: customPreferences?.pumping?.amountMl,
      customWeight: preferenceWeight,
      recentValue: null,
      recentWeight,
    });

    // Blend duration with custom preferences (no recent data)
    const ageBasedDuration = getTypicalPumpingDuration(ageDays);
    const durationBlend = blendPredictionValues({
      ageBasedValue: ageBasedDuration,
      ageBasedWeight,
      customValue: customPreferences?.pumping?.durationMinutes,
      customWeight: preferenceWeight,
      recentValue: null,
      recentWeight,
    });

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
      durationBlendResult: durationBlend,
      intervalHours: ageBasedInterval,
      lastPumpingAmount: null,
      lastPumpingTime: null,
      nextPumpingTime,
      recentPumpingPattern: [],
      suggestedDuration: durationBlend.value,
      suggestedVolume: volumeBlend.value,
      suggestionSource: `Volume: ${volumeBlend.source}, Duration: ${durationBlend.source}`,
      volumeBlendResult: volumeBlend,
    };
  }

  const lastPumping = pumpingActivities[0];
  if (!lastPumping) {
    // Should not happen since we checked length > 0, but satisfy TypeScript
    const nextPumpingTime = new Date();
    nextPumpingTime.setHours(nextPumpingTime.getHours() + ageBasedInterval);

    const ageBasedAmounts = getAgeBasedPumpingAmounts(ageDays);
    const volumeBlend = blendPredictionValues({
      ageBasedValue: ageBasedAmounts.medium,
      ageBasedWeight,
      customValue: customPreferences?.pumping?.amountMl,
      customWeight: preferenceWeight,
      recentValue: null,
      recentWeight,
    });

    const ageBasedDuration = getTypicalPumpingDuration(ageDays);
    const durationBlend = blendPredictionValues({
      ageBasedValue: ageBasedDuration,
      ageBasedWeight,
      customValue: customPreferences?.pumping?.durationMinutes,
      customWeight: preferenceWeight,
      recentValue: null,
      recentWeight,
    });

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
      durationBlendResult: durationBlend,
      intervalHours: ageBasedInterval,
      lastPumpingAmount: null,
      lastPumpingTime: null,
      nextPumpingTime,
      recentPumpingPattern: [],
      suggestedDuration: durationBlend.value,
      suggestedVolume: volumeBlend.value,
      suggestionSource: `Volume: ${volumeBlend.source}, Duration: ${durationBlend.source}`,
      volumeBlendResult: volumeBlend,
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
    duration: pumping.duration,
    intervalFromPrevious: intervals[idx] ?? null,
    notes: pumping.notes,
    time: new Date(pumping.startTime),
  }));

  // Blend suggested volume with custom preferences
  const ageBasedAmounts = getAgeBasedPumpingAmounts(ageDays);
  const recentAverageVolume = getRecentAverageVolume(pumpingActivities);
  const volumeBlend = blendPredictionValues({
    ageBasedValue: ageBasedAmounts.medium,
    ageBasedWeight,
    customValue: customPreferences?.pumping?.amountMl,
    customWeight: preferenceWeight,
    recentValue: recentAverageVolume,
    recentWeight,
  });

  // Blend suggested duration with custom preferences
  const ageBasedDuration = getTypicalPumpingDuration(ageDays);
  const durationBlend = blendPredictionValues({
    ageBasedValue: ageBasedDuration,
    ageBasedWeight,
    customValue: customPreferences?.pumping?.durationMinutes,
    customWeight: preferenceWeight,
    recentValue: null, // We don't track duration history yet
    recentWeight,
  });

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
    durationBlendResult: durationBlend,
    intervalHours: predictedInterval,
    lastPumpingAmount,
    lastPumpingTime,
    nextPumpingTime,
    recentPumpingPattern: recentPattern,
    suggestedDuration: durationBlend.value,
    suggestedVolume: volumeBlend.value,
    suggestionSource: `Volume: ${volumeBlend.source}, Duration: ${durationBlend.source}`,
    volumeBlendResult: volumeBlend,
  };
}
