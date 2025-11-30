/**
 * Sleep pattern analysis utilities
 * Analyzes sleep patterns to provide optimal wake/sleep time recommendations
 * Uses hybrid approach: age-based guidelines + actual baby patterns
 */

import type { Activities } from '@nugget/db/schema';
import { differenceInMinutes, getHours, getMinutes, subDays } from 'date-fns';
import { calculateBabyAgeDays, getSleepIntervalByAge } from './sleep-intervals';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface OptimalWakeTimeResult {
  recommendedTime: Date;
  confidence: ConfidenceLevel;
  typicalRange: { start: Date; end: Date };
  reasoning: string;
}

export interface OptimalBedtimeResult {
  recommendedTime: Date;
  confidence: ConfidenceLevel;
  typicalRange: { start: Date; end: Date };
  reasoning: string;
}

export interface WakeWindowResult {
  windowMinutes: number;
  confidence: ConfidenceLevel;
  ageBasedMinutes: number;
  patternBasedMinutes: number | null;
  reasoning: string;
}

export interface NightSleepQualityResult {
  averageDurationMinutes: number | null;
  averageWakeTime: Date | null;
  averageBedtime: Date | null;
  consistencyScore: number; // 0-100
  qualityTrend: 'improving' | 'stable' | 'declining';
}

export interface DaytimeNapRecommendation {
  optimalNapTimes: Array<{
    start: Date;
    end: Date;
    priority: 'high' | 'medium' | 'low';
  }>;
  totalDaytimeSleepMinutes: number;
  reasoning: string;
}

/**
 * Analyze optimal wake time based on recent night sleep patterns
 * Looks at last 7-14 days of night sleep end times
 */
export function analyzeOptimalWakeTime(
  activities: Array<typeof Activities.$inferSelect>,
  babyBirthDate: Date | null,
  lookbackDays = 14,
): OptimalWakeTimeResult {
  const now = new Date();
  const cutoff = subDays(now, lookbackDays);

  // Filter to night sleep activities that have ended
  const nightSleeps = activities.filter((activity) => {
    if (activity.type !== 'sleep') return false;
    if (activity.endTime === null) return false;

    const details = activity.details;
    if (
      !details ||
      typeof details !== 'object' ||
      !('sleepType' in details) ||
      details.sleepType !== 'night'
    ) {
      return false;
    }

    const endTime = new Date(activity.endTime);
    return endTime >= cutoff && endTime <= now;
  });

  const ageDays = calculateBabyAgeDays(babyBirthDate);

  // Age-based typical wake time ranges (in hours from midnight)
  const ageBasedWakeRange = getAgeBasedWakeTimeRange(ageDays);

  if (nightSleeps.length === 0) {
    // No data - use age-based recommendation
    const defaultWake = new Date();
    defaultWake.setHours(ageBasedWakeRange.typical, 0, 0);
    if (defaultWake > now) {
      defaultWake.setDate(defaultWake.getDate() - 1);
    }

    const rangeStart = new Date(defaultWake);
    rangeStart.setHours(ageBasedWakeRange.early, 0, 0);
    const rangeEnd = new Date(defaultWake);
    rangeEnd.setHours(ageBasedWakeRange.late, 0, 0);

    return {
      confidence: 'low',
      reasoning: `Based on age guidelines (${ageDays ? `${Math.floor(ageDays / 7)} weeks old` : 'unknown age'}). Start tracking sleep to get personalized recommendations.`,
      recommendedTime: defaultWake,
      typicalRange: {
        end: rangeEnd,
        start: rangeStart,
      },
    };
  }

  // Extract wake times (end times of night sleep)
  const wakeTimes = nightSleeps
    .map((sleep) => {
      const endTime = new Date(sleep.endTime!);
      return getHours(endTime) + getMinutes(endTime) / 60;
    })
    .filter((hour) => hour >= 0 && hour < 24);

  if (wakeTimes.length === 0) {
    // Fallback to age-based
    const defaultWake = new Date();
    defaultWake.setHours(ageBasedWakeRange.typical, 0, 0);
    const rangeStart = new Date(defaultWake);
    rangeStart.setHours(ageBasedWakeRange.early, 0, 0);
    const rangeEnd = new Date(defaultWake);
    rangeEnd.setHours(ageBasedWakeRange.late, 0, 0);

    return {
      confidence: 'low',
      reasoning: 'No valid wake time data found. Using age-based guidelines.',
      recommendedTime: defaultWake,
      typicalRange: {
        end: rangeEnd,
        start: rangeStart,
      },
    };
  }

  // Calculate mode (most common wake hour)
  const hourCounts = new Map<number, number>();
  for (const hour of wakeTimes) {
    const hourRounded = Math.round(hour);
    hourCounts.set(hourRounded, (hourCounts.get(hourRounded) || 0) + 1);
  }

  let mostCommonHour = ageBasedWakeRange.typical;
  let maxCount = 0;
  for (const [hour, count] of hourCounts) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonHour = hour;
    }
  }

  // Calculate average wake time
  const avgWakeHour =
    wakeTimes.reduce((sum, hour) => sum + hour, 0) / wakeTimes.length;

  // Use weighted average: 60% most common, 40% average
  const recommendedHour = mostCommonHour * 0.6 + avgWakeHour * 0.4;

  // Determine confidence
  let confidence: ConfidenceLevel = 'low';
  if (nightSleeps.length >= 10) {
    // Check consistency (standard deviation)
    const mean = avgWakeHour;
    const variance =
      wakeTimes.reduce((sum, hour) => sum + (hour - mean) ** 2, 0) /
      wakeTimes.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev < 1.5) {
      confidence = 'high';
    } else if (stdDev < 2.5) {
      confidence = 'medium';
    }
  } else if (nightSleeps.length >= 5) {
    confidence = 'medium';
  }

  const recommendedTime = new Date();
  recommendedTime.setHours(
    Math.floor(recommendedHour),
    (recommendedHour % 1) * 60,
    0,
  );
  if (recommendedTime > now) {
    recommendedTime.setDate(recommendedTime.getDate() - 1);
  }

  const rangeStart = new Date(recommendedTime);
  rangeStart.setHours(Math.max(0, Math.floor(recommendedHour - 1.5)), 0, 0);
  const rangeEnd = new Date(recommendedTime);
  rangeEnd.setHours(Math.min(23, Math.floor(recommendedHour + 1.5)), 0, 0);

  const reasoning =
    confidence === 'high'
      ? `Based on ${nightSleeps.length} nights of consistent wake times. Your baby typically wakes around ${formatHour(recommendedHour)}.`
      : confidence === 'medium'
        ? `Based on ${nightSleeps.length} nights of data. Your baby typically wakes around ${formatHour(recommendedHour)}. More data will improve accuracy.`
        : `Based on ${nightSleeps.length} night${nightSleeps.length === 1 ? '' : 's'} of data. Keep tracking for better recommendations.`;

  return {
    confidence,
    reasoning,
    recommendedTime,
    typicalRange: {
      end: rangeEnd,
      start: rangeStart,
    },
  };
}

/**
 * Analyze optimal bedtime based on recent night sleep patterns
 * Looks at last 7-14 days of night sleep start times and correlates with wake time
 */
export function analyzeOptimalBedtime(
  activities: Array<typeof Activities.$inferSelect>,
  babyBirthDate: Date | null,
  lookbackDays = 14,
): OptimalBedtimeResult {
  const now = new Date();
  const cutoff = subDays(now, lookbackDays);

  // Filter to night sleep activities
  const nightSleeps = activities.filter((activity) => {
    if (activity.type !== 'sleep') return false;
    if (activity.startTime === null) return false;

    const details = activity.details;
    if (
      !details ||
      typeof details !== 'object' ||
      !('sleepType' in details) ||
      details.sleepType !== 'night'
    ) {
      return false;
    }

    const startTime = new Date(activity.startTime);
    return startTime >= cutoff && startTime <= now;
  });

  const ageDays = calculateBabyAgeDays(babyBirthDate);

  // Age-based typical bedtime ranges
  const ageBasedBedtimeRange = getAgeBasedBedtimeRange(ageDays);

  if (nightSleeps.length === 0) {
    const defaultBedtime = new Date();
    defaultBedtime.setHours(ageBasedBedtimeRange.typical, 0, 0);
    if (defaultBedtime > now) {
      defaultBedtime.setDate(defaultBedtime.getDate() - 1);
    }

    const rangeStart = new Date(defaultBedtime);
    rangeStart.setHours(ageBasedBedtimeRange.early, 0, 0);
    const rangeEnd = new Date(defaultBedtime);
    rangeEnd.setHours(ageBasedBedtimeRange.late, 0, 0);

    return {
      confidence: 'low',
      reasoning: `Based on age guidelines (${ageDays ? `${Math.floor(ageDays / 7)} weeks old` : 'unknown age'}). Start tracking sleep to get personalized recommendations.`,
      recommendedTime: defaultBedtime,
      typicalRange: {
        end: rangeEnd,
        start: rangeStart,
      },
    };
  }

  // Extract bedtimes
  const bedtimes = nightSleeps
    .map((sleep) => {
      const startTime = new Date(sleep.startTime);
      return getHours(startTime) + getMinutes(startTime) / 60;
    })
    .filter((hour) => hour >= 0 && hour < 24);

  // Calculate average bedtime
  const avgBedtimeHour =
    bedtimes.reduce((sum, hour) => sum + hour, 0) / bedtimes.length;

  // Calculate mode
  const hourCounts = new Map<number, number>();
  for (const hour of bedtimes) {
    const hourRounded = Math.round(hour);
    hourCounts.set(hourRounded, (hourCounts.get(hourRounded) || 0) + 1);
  }

  let mostCommonHour = ageBasedBedtimeRange.typical;
  let maxCount = 0;
  for (const [hour, count] of hourCounts) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonHour = hour;
    }
  }

  // Weighted average
  const recommendedHour = mostCommonHour * 0.6 + avgBedtimeHour * 0.4;

  // Determine confidence
  let confidence: ConfidenceLevel = 'low';
  if (nightSleeps.length >= 10) {
    const mean = avgBedtimeHour;
    const variance =
      bedtimes.reduce((sum, hour) => sum + (hour - mean) ** 2, 0) /
      bedtimes.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev < 1.5) {
      confidence = 'high';
    } else if (stdDev < 2.5) {
      confidence = 'medium';
    }
  } else if (nightSleeps.length >= 5) {
    confidence = 'medium';
  }

  const recommendedTime = new Date();
  recommendedTime.setHours(
    Math.floor(recommendedHour),
    (recommendedHour % 1) * 60,
    0,
  );
  if (recommendedTime > now) {
    recommendedTime.setDate(recommendedTime.getDate() - 1);
  }

  const rangeStart = new Date(recommendedTime);
  rangeStart.setHours(Math.max(0, Math.floor(recommendedHour - 1.5)), 0, 0);
  const rangeEnd = new Date(recommendedTime);
  rangeEnd.setHours(Math.min(23, Math.floor(recommendedHour + 1.5)), 0, 0);

  const reasoning =
    confidence === 'high'
      ? `Based on ${nightSleeps.length} nights of consistent bedtimes. Your baby typically goes to sleep around ${formatHour(recommendedHour)}.`
      : confidence === 'medium'
        ? `Based on ${nightSleeps.length} nights of data. Your baby typically goes to sleep around ${formatHour(recommendedHour)}. More data will improve accuracy.`
        : `Based on ${nightSleeps.length} night${nightSleeps.length === 1 ? '' : 's'} of data. Keep tracking for better recommendations.`;

  return {
    confidence,
    reasoning,
    recommendedTime,
    typicalRange: {
      end: rangeEnd,
      start: rangeStart,
    },
  };
}

/**
 * Calculate optimal wake windows (time baby should stay awake between sleeps)
 * Hybrid: age-based guidelines adjusted by actual patterns
 */
export function calculateWakeWindows(
  activities: Array<typeof Activities.$inferSelect>,
  babyBirthDate: Date | null,
  lookbackDays = 7,
): WakeWindowResult {
  const ageDays = calculateBabyAgeDays(babyBirthDate);
  const ageBasedInterval = getSleepIntervalByAge(ageDays);

  // Age-based wake window in minutes (slightly less than sleep interval)
  const ageBasedMinutes =
    ageBasedInterval !== null ? Math.round((ageBasedInterval - 0.5) * 60) : 90; // Default to 90 minutes if age is unknown

  // Filter to completed sleep activities
  const completedSleeps = activities
    .filter((activity) => {
      if (activity.type !== 'sleep') return false;
      if (!activity.endTime || !activity.startTime) return false;
      const startTime = new Date(activity.startTime);
      return startTime >= subDays(new Date(), lookbackDays);
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  if (completedSleeps.length < 2) {
    return {
      ageBasedMinutes,
      confidence: 'low',
      patternBasedMinutes: null,
      reasoning: `Based on age guidelines (${ageDays ? `${Math.floor(ageDays / 7)} weeks old` : 'unknown age'}). Track more sleep sessions for personalized recommendations.`,
      windowMinutes: ageBasedMinutes,
    };
  }

  // Calculate actual wake windows between sleeps
  const wakeWindows: number[] = [];
  for (let i = 1; i < completedSleeps.length; i++) {
    const prevSleep = completedSleeps[i - 1];
    const currSleep = completedSleeps[i];

    if (!prevSleep || !currSleep || !prevSleep.endTime || !currSleep.startTime)
      continue;

    const prevEnd = new Date(prevSleep.endTime);
    const currStart = new Date(currSleep.startTime);
    const windowMinutes = differenceInMinutes(currStart, prevEnd);

    // Filter out unrealistic windows (too short or too long)
    if (windowMinutes > 0 && windowMinutes < 720) {
      // Max 12 hours awake
      wakeWindows.push(windowMinutes);
    }
  }

  let patternBasedMinutes: number | null = null;
  let confidence: ConfidenceLevel = 'low';

  if (wakeWindows.length > 0) {
    patternBasedMinutes = Math.round(
      wakeWindows.reduce((sum, window) => sum + window, 0) / wakeWindows.length,
    );

    // Hybrid approach: blend age-based and pattern-based
    // More weight to pattern if we have enough data
    let weightPattern = 0.3;
    if (wakeWindows.length >= 10) {
      weightPattern = 0.7;
      confidence = 'high';
    } else if (wakeWindows.length >= 5) {
      weightPattern = 0.5;
      confidence = 'medium';
    }

    const recommendedMinutes = Math.round(
      ageBasedMinutes * (1 - weightPattern) +
        patternBasedMinutes * weightPattern,
    );

    const reasoning =
      confidence === 'high'
        ? `Based on ${wakeWindows.length} recent wake windows. Your baby typically stays awake for about ${Math.round((recommendedMinutes / 60) * 10) / 10} hours between sleeps.`
        : confidence === 'medium'
          ? `Based on ${wakeWindows.length} recent wake windows. Recommended awake time: ${Math.round((recommendedMinutes / 60) * 10) / 10} hours.`
          : `Based on ${wakeWindows.length} wake window${wakeWindows.length === 1 ? '' : 's'}. More data will improve accuracy.`;

    return {
      ageBasedMinutes,
      confidence,
      patternBasedMinutes,
      reasoning,
      windowMinutes: recommendedMinutes,
    };
  }

  return {
    ageBasedMinutes,
    confidence: 'low',
    patternBasedMinutes: null,
    reasoning:
      'Based on age guidelines. Track more sleep sessions for personalized wake windows.',
    windowMinutes: ageBasedMinutes,
  };
}

/**
 * Analyze night sleep quality metrics
 */
export function analyzeNightSleepQuality(
  activities: Array<typeof Activities.$inferSelect>,
  lookbackDays = 14,
): NightSleepQualityResult {
  const now = new Date();
  const cutoff = subDays(now, lookbackDays);

  const nightSleeps = activities
    .filter((activity) => {
      if (activity.type !== 'sleep') return false;
      if (!activity.endTime || !activity.duration) return false;

      const details = activity.details;
      if (
        !details ||
        typeof details !== 'object' ||
        !('sleepType' in details) ||
        details.sleepType !== 'night'
      ) {
        return false;
      }

      const startTime = new Date(activity.startTime);
      return startTime >= cutoff;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  if (nightSleeps.length === 0) {
    return {
      averageBedtime: null,
      averageDurationMinutes: null,
      averageWakeTime: null,
      consistencyScore: 0,
      qualityTrend: 'stable',
    };
  }

  // Calculate averages
  const durations = nightSleeps.map((s) => s.duration || 0);
  const averageDurationMinutes =
    durations.reduce((sum, d) => sum + d, 0) / durations.length;

  const bedtimes = nightSleeps.map((s) => {
    const start = new Date(s.startTime);
    return getHours(start) + getMinutes(start) / 60;
  });
  const avgBedtimeHour =
    bedtimes.reduce((sum, h) => sum + h, 0) / bedtimes.length;
  const averageBedtime = new Date();
  averageBedtime.setHours(
    Math.floor(avgBedtimeHour),
    (avgBedtimeHour % 1) * 60,
  );

  const wakeTimes = nightSleeps.map((s) => {
    const end = new Date(s.endTime!);
    return getHours(end) + getMinutes(end) / 60;
  });
  const avgWakeHour =
    wakeTimes.reduce((sum, h) => sum + h, 0) / wakeTimes.length;
  const averageWakeTime = new Date();
  averageWakeTime.setHours(Math.floor(avgWakeHour), (avgWakeHour % 1) * 60);

  // Calculate consistency score (0-100)
  // Based on variance in bedtime, wake time, and duration
  const bedtimeVar =
    bedtimes.reduce((sum, h) => sum + (h - avgBedtimeHour) ** 2, 0) /
    bedtimes.length;
  const wakeTimeVar =
    wakeTimes.reduce((sum, h) => sum + (h - avgWakeHour) ** 2, 0) /
    wakeTimes.length;
  const durationVar =
    durations.reduce((sum, d) => sum + (d - averageDurationMinutes) ** 2, 0) /
    durations.length;

  // Normalize variances (lower variance = higher consistency)
  const maxBedtimeVar = 4; // 4 hours variance = 0 score
  const maxWakeVar = 4;
  const maxDurationVar = averageDurationMinutes * 0.5; // 50% variance = 0 score

  const bedtimeConsistency = Math.max(
    0,
    100 * (1 - Math.min(1, bedtimeVar / maxBedtimeVar)),
  );
  const wakeConsistency = Math.max(
    0,
    100 * (1 - Math.min(1, wakeTimeVar / maxWakeVar)),
  );
  const durationConsistency = Math.max(
    0,
    100 * (1 - Math.min(1, durationVar / maxDurationVar)),
  );

  const consistencyScore =
    (bedtimeConsistency + wakeConsistency + durationConsistency) / 3;

  // Determine trend (compare first half vs second half)
  let qualityTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (nightSleeps.length >= 6) {
    const firstHalf = nightSleeps.slice(0, Math.floor(nightSleeps.length / 2));
    const secondHalf = nightSleeps.slice(Math.floor(nightSleeps.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, s) => sum + (s.duration || 0), 0) /
      firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, s) => sum + (s.duration || 0), 0) /
      secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    if (change > 5) {
      qualityTrend = 'improving';
    } else if (change < -5) {
      qualityTrend = 'declining';
    }
  }

  return {
    averageBedtime,
    averageDurationMinutes,
    averageWakeTime,
    consistencyScore: Math.round(consistencyScore),
    qualityTrend,
  };
}

/**
 * Find best daytime nap times to support night sleep
 */
export function findBestDaytimeNapTimes(
  _activities: Array<typeof Activities.$inferSelect>,
  babyBirthDate: Date | null,
  optimalBedtime: Date,
  optimalWakeTime: Date,
  _lookbackDays = 7,
): DaytimeNapRecommendation {
  const ageDays = calculateBabyAgeDays(babyBirthDate);
  const recommendedNapCount = getRecommendedNapCount(ageDays);

  // Calculate total expected daytime sleep based on age
  const totalDailySleepGoal = getTotalDailySleepGoal(ageDays); // in hours
  const expectedNightSleep = 10; // Assume 10 hours night sleep on average
  const expectedDaytimeSleep = Math.max(
    0,
    totalDailySleepGoal - expectedNightSleep,
  );

  const optimalNapTimes: Array<{
    end: Date;
    priority: 'high' | 'medium' | 'low';
    start: Date;
  }> = [];

  // For now, provide general recommendations based on age and bedtime
  const bedtimeHour =
    getHours(optimalBedtime) + getMinutes(optimalBedtime) / 60;
  const wakeHour = getHours(optimalWakeTime) + getMinutes(optimalWakeTime) / 60;

  // Calculate hours between wake and bedtime
  let hoursAwake = bedtimeHour - wakeHour;
  if (hoursAwake < 0) {
    hoursAwake += 24;
  }

  // Distribute naps evenly through the day
  const napInterval = hoursAwake / (recommendedNapCount + 1);

  for (let i = 0; i < recommendedNapCount; i++) {
    const napStartHour = wakeHour + napInterval * (i + 1);
    const napStart = new Date(optimalWakeTime);
    napStart.setHours(Math.floor(napStartHour), (napStartHour % 1) * 60);

    // Nap duration based on age and position
    const napDurationMinutes = getRecommendedNapDuration(
      ageDays,
      i,
      recommendedNapCount,
    );
    const napEnd = new Date(napStart);
    napEnd.setMinutes(napEnd.getMinutes() + napDurationMinutes);

    // Priority: earlier naps are higher priority (better for night sleep)
    const priority: 'high' | 'medium' | 'low' =
      i === 0 ? 'high' : i === 1 ? 'medium' : 'low';

    optimalNapTimes.push({
      end: napEnd,
      priority,
      start: napStart,
    });
  }

  const reasoning = `Based on your baby's age (${ageDays ? `${Math.floor(ageDays / 7)} weeks` : 'unknown'}), recommended ${recommendedNapCount} nap${recommendedNapCount === 1 ? '' : 's'} spaced throughout the day. Earlier naps support better night sleep.`;

  return {
    optimalNapTimes,
    reasoning,
    totalDaytimeSleepMinutes: Math.round(expectedDaytimeSleep * 60),
  };
}

// Helper functions

function getAgeBasedWakeTimeRange(ageDays: number | null): {
  early: number;
  late: number;
  typical: number;
} {
  if (!ageDays) {
    return { early: 5, late: 8, typical: 6.5 };
  }

  // Age-appropriate wake times (in hours from midnight)
  if (ageDays <= 90) {
    // 0-3 months: typically 6-8am
    return { early: 5, late: 8, typical: 6.5 };
  }
  if (ageDays <= 180) {
    // 3-6 months: typically 6-7:30am
    return { early: 5.5, late: 7.5, typical: 6.5 };
  }
  if (ageDays <= 365) {
    // 6-12 months: typically 6-7am
    return { early: 6, late: 7.5, typical: 6.5 };
  }
  // 12+ months: typically 6-7am
  return { early: 6, late: 7.5, typical: 6.5 };
}

function getAgeBasedBedtimeRange(ageDays: number | null): {
  early: number;
  late: number;
  typical: number;
} {
  if (!ageDays) {
    return { early: 18, late: 21, typical: 19.5 };
  }

  // Age-appropriate bedtimes (in hours from midnight)
  if (ageDays <= 90) {
    // 0-3 months: typically 8-11pm
    return { early: 20, late: 23, typical: 21.5 };
  }
  if (ageDays <= 180) {
    // 3-6 months: typically 7-9pm
    return { early: 19, late: 21, typical: 20 };
  }
  if (ageDays <= 365) {
    // 6-12 months: typically 7-8pm
    return { early: 18, late: 20, typical: 19 };
  }
  // 12+ months: typically 7-8pm
  return { early: 18, late: 20, typical: 19 };
}

function getRecommendedNapCount(ageDays: number | null): number {
  if (!ageDays) return 3;
  if (ageDays <= 90) return 4;
  if (ageDays <= 180) return 3;
  if (ageDays <= 365) return 2;
  return 1;
}

function getRecommendedNapDuration(
  ageDays: number | null,
  napIndex: number,
  totalNaps: number,
): number {
  if (!ageDays) return 90;

  // Earlier naps tend to be longer
  const isEarlierNap = napIndex === 0 || (napIndex === 1 && totalNaps === 3);

  if (ageDays <= 90) {
    return isEarlierNap ? 120 : 60; // 2 hours or 1 hour
  }
  if (ageDays <= 180) {
    return isEarlierNap ? 120 : 90; // 2 hours or 1.5 hours
  }
  if (ageDays <= 365) {
    return isEarlierNap ? 120 : 90; // 2 hours or 1.5 hours
  }
  return 120; // Single nap: 2 hours
}

function getTotalDailySleepGoal(ageDays: number | null): number {
  if (!ageDays) return 15;
  if (ageDays <= 7) return 16;
  if (ageDays <= 28) return 15;
  if (ageDays <= 90) return 15;
  if (ageDays <= 180) return 14;
  if (ageDays <= 270) return 13;
  if (ageDays <= 365) return 13;
  if (ageDays <= 547) return 12;
  return 11;
}

function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour % 1) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m > 0
    ? `${displayHour}:${String(m).padStart(2, '0')} ${period}`
    : `${displayHour} ${period}`;
}
