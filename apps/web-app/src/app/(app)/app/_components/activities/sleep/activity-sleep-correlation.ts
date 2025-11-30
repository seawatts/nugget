/**
 * Activity-sleep correlation analysis
 * Analyzes how various activities (feeding, diaper, etc.) correlate with sleep quality
 */

import type { Activities } from '@nugget/db/schema';
import { differenceInMinutes, getHours, subDays } from 'date-fns';

export interface ActivitySleepCorrelation {
  activityType: string;
  correlation: number; // -1 to 1, where 1 = strong positive, -1 = strong negative
  impact: 'positive' | 'negative' | 'neutral';
  confidence: 'high' | 'medium' | 'low';
  insight: string;
}

export interface FeedingSleepCorrelation {
  timingBeforeSleep: {
    minutesBeforeSleep: number;
    correlation: number;
    sampleSize: number;
  }[];
  averageNightSleepDuration: number;
  recommendation: string;
}

export interface ActivityPatternInsight {
  activityType: string;
  optimalTiming: {
    relativeToSleep: 'before' | 'after' | 'during';
    recommendedMinutesBefore: number | null;
    recommendation: string;
  } | null;
  patterns: string[];
}

export interface OptimalActivityTiming {
  activityType: string;
  recommendedWindows: Array<{
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    hours: string; // e.g., "6-8 AM"
    reasoning: string;
  }>;
  avoidWindows: Array<{
    timeOfDay: string;
    hours: string;
    reasoning: string;
  }>;
}

/**
 * Analyze how feeding timing affects sleep quality
 */
export function analyzeFeedingSleepCorrelation(
  activities: Array<typeof Activities.$inferSelect>,
  lookbackDays = 14,
): FeedingSleepCorrelation {
  const now = new Date();
  const cutoff = subDays(now, lookbackDays);

  // Get night sleep activities
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

  // Get feeding activities
  const feedings = activities
    .filter((activity) => {
      if (!['feeding', 'bottle', 'nursing'].includes(activity.type))
        return false;
      const startTime = new Date(activity.startTime);
      return startTime >= cutoff;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  // Analyze feeding timing relative to sleep
  const timingBeforeSleep: Array<{
    correlation: number;
    minutesBeforeSleep: number;
    sampleSize: number;
  }> = [];

  // Group by time windows before sleep: 0-30min, 30-60min, 60-120min, 120-180min, 180+min
  const windows = [
    { label: '0-30min', max: 30, min: 0 },
    { label: '30-60min', max: 60, min: 30 },
    { label: '60-120min', max: 120, min: 60 },
    { label: '120-180min', max: 180, min: 120 },
    { label: '180+min', max: Number.POSITIVE_INFINITY, min: 180 },
  ];

  for (const window of windows) {
    const sleepDurations: number[] = [];

    for (const sleep of nightSleeps) {
      const sleepStart = new Date(sleep.startTime);

      // Find feedings in this window before sleep
      const feedingsInWindow = feedings.filter((feeding) => {
        const feedingTime = new Date(feeding.startTime);
        const minutesBefore = differenceInMinutes(sleepStart, feedingTime);
        return minutesBefore >= window.min && minutesBefore < window.max;
      });

      if (feedingsInWindow.length > 0) {
        sleepDurations.push(sleep.duration || 0);
      }
    }

    if (sleepDurations.length > 0) {
      const avgDuration =
        sleepDurations.reduce((sum, d) => sum + d, 0) / sleepDurations.length;
      const overallAvg =
        nightSleeps.reduce((sum, s) => sum + (s.duration || 0), 0) /
        nightSleeps.length;

      // Calculate correlation (normalized difference)
      const correlation = (avgDuration - overallAvg) / overallAvg;

      timingBeforeSleep.push({
        correlation,
        minutesBeforeSleep: window.min + (window.max - window.min) / 2,
        sampleSize: sleepDurations.length,
      });
    }
  }

  // Calculate average night sleep duration
  const averageNightSleepDuration =
    nightSleeps.length > 0
      ? nightSleeps.reduce((sum, s) => sum + (s.duration || 0), 0) /
        nightSleeps.length
      : 0;

  // Generate recommendation
  let recommendation =
    'Not enough data to determine feeding-sleep correlation.';
  if (timingBeforeSleep.length > 0) {
    const bestWindow = timingBeforeSleep.reduce((best, current) =>
      current.correlation > best.correlation ? current : best,
    );

    if (bestWindow.correlation > 0.1) {
      recommendation = `Feeding ${Math.round(bestWindow.minutesBeforeSleep)} minutes before bedtime appears to help sleep quality. Consider a bedtime feeding routine.`;
    } else if (bestWindow.correlation < -0.1) {
      recommendation =
        'Feeding very close to bedtime (within 30 minutes) may disrupt sleep. Try feeding earlier in the evening.';
    } else {
      recommendation =
        'No strong correlation found between feeding timing and sleep quality. Maintain consistent feeding schedule.';
    }
  }

  return {
    averageNightSleepDuration,
    recommendation,
    timingBeforeSleep,
  };
}

/**
 * Identify activity patterns that lead to better sleep
 */
export function analyzeActivityPatterns(
  activities: Array<typeof Activities.$inferSelect>,
  lookbackDays = 14,
): ActivityPatternInsight[] {
  const now = new Date();
  const cutoff = subDays(now, lookbackDays);

  // Get all activity types
  const activityTypes = [
    ...new Set(
      activities
        .filter((a) => a.startTime && new Date(a.startTime) >= cutoff)
        .map((a) => a.type),
    ),
  ].filter((type) => type !== 'sleep');

  const insights: ActivityPatternInsight[] = [];

  // Get night sleep activities for comparison
  const nightSleeps = activities
    .filter((activity) => {
      if (activity.type !== 'sleep') return false;
      if (!activity.duration) return false;
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

  for (const activityType of activityTypes) {
    const typeActivities = activities.filter((a) => a.type === activityType);

    // Analyze timing relative to sleep
    const patterns: string[] = [];

    // Check for bedtime routine patterns (bath before sleep)
    if (activityType === 'bath') {
      const bathsBeforeSleep = nightSleeps.filter((sleep) => {
        const sleepStart = new Date(sleep.startTime);
        const baths = typeActivities.filter((bath) => {
          const bathTime = new Date(bath.startTime);
          const minutesBefore = differenceInMinutes(sleepStart, bathTime);
          return minutesBefore >= 0 && minutesBefore <= 180; // Within 3 hours before
        });
        return baths.length > 0;
      });

      if (bathsBeforeSleep.length > 0) {
        const avgDuration =
          bathsBeforeSleep.reduce((sum, s) => sum + (s.duration || 0), 0) /
          bathsBeforeSleep.length;
        const overallAvg =
          nightSleeps.reduce((sum, s) => sum + (s.duration || 0), 0) /
          nightSleeps.length;

        if (avgDuration > overallAvg * 1.05) {
          patterns.push(
            'Bath before bedtime appears to improve sleep duration',
          );
        }
      }
    }

    // Check diaper change patterns
    if (['diaper', 'wet', 'dirty', 'both'].includes(activityType)) {
      const diaperChangesBeforeSleep = nightSleeps.filter((sleep) => {
        const sleepStart = new Date(sleep.startTime);
        const changes = typeActivities.filter((diaper) => {
          const changeTime = new Date(diaper.startTime);
          const minutesBefore = differenceInMinutes(sleepStart, changeTime);
          return minutesBefore >= 0 && minutesBefore <= 60; // Within 1 hour before
        });
        return changes.length > 0;
      });

      if (diaperChangesBeforeSleep.length > nightSleeps.length * 0.5) {
        patterns.push(
          'Regular diaper changes before sleep help prevent nighttime wake-ups',
        );
      }
    }

    insights.push({
      activityType,
      optimalTiming:
        activityType === 'bath'
          ? {
              recommendation:
                'Bath 1-2 hours before bedtime may help establish routine',
              recommendedMinutesBefore: 90,
              relativeToSleep: 'before',
            }
          : activityType === 'feeding' ||
              activityType === 'bottle' ||
              activityType === 'nursing'
            ? {
                recommendation:
                  'Feeding 30-60 minutes before bedtime may improve sleep',
                recommendedMinutesBefore: 45,
                relativeToSleep: 'before',
              }
            : null,
      patterns: patterns.length > 0 ? patterns : ['No clear patterns detected'],
    });
  }

  return insights;
}

/**
 * Get optimal timing recommendations for activities to improve sleep
 */
export function getOptimalActivityTiming(
  activities: Array<typeof Activities.$inferSelect>,
  _babyBirthDate: Date | null,
  lookbackDays = 14,
): OptimalActivityTiming[] {
  const now = new Date();
  const cutoff = subDays(now, lookbackDays);

  // Get night sleep to understand typical bedtime
  const nightSleeps = activities
    .filter((activity) => {
      if (activity.type !== 'sleep') return false;
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
    .map((s) => new Date(s.startTime));

  const typicalBedtime =
    nightSleeps.length > 0
      ? nightSleeps.reduce((sum, time) => {
          const hour = getHours(time) + time.getMinutes() / 60;
          return sum + hour;
        }, 0) / nightSleeps.length
      : 20; // Default 8 PM

  const recommendations: OptimalActivityTiming[] = [];

  // Bath timing
  recommendations.push({
    activityType: 'bath',
    avoidWindows: [
      {
        hours: 'Late evening (after 8 PM)',
        reasoning: 'Late baths may overstimulate baby close to bedtime',
        timeOfDay: 'evening',
      },
    ],
    recommendedWindows: [
      {
        hours: `1-2 hours before bedtime (~${Math.floor(typicalBedtime - 1.5)}-${Math.floor(typicalBedtime - 0.5)} PM)`,
        reasoning: 'Bath as part of bedtime routine helps signal sleep time',
        timeOfDay: 'evening',
      },
    ],
  });

  // Feeding timing
  recommendations.push({
    activityType: 'feeding',
    avoidWindows: [
      {
        hours: 'Immediately before sleep (0-15 minutes)',
        reasoning:
          'Feeding right before sleep may cause discomfort or need for diaper change',
        timeOfDay: 'evening',
      },
      {
        hours: 'Very early morning (before 5 AM)',
        reasoning:
          'Feeding during typical sleep time can disrupt sleep patterns',
        timeOfDay: 'night',
      },
    ],
    recommendedWindows: [
      {
        hours: `30-60 minutes before bedtime (~${Math.floor(typicalBedtime - 1)}-${Math.floor(typicalBedtime - 0.5)} PM)`,
        reasoning:
          'Feeding 30-60 minutes before sleep helps baby feel full and comfortable',
        timeOfDay: 'evening',
      },
      {
        hours: 'Morning (after wake-up)',
        reasoning: 'Feeding upon waking helps establish daily routine',
        timeOfDay: 'morning',
      },
    ],
  });

  // Diaper timing
  recommendations.push({
    activityType: 'diaper',
    avoidWindows: [
      {
        hours: 'During deep sleep (1-3 hours after bedtime)',
        reasoning:
          'Unnecessary diaper changes during deep sleep can disrupt sleep',
        timeOfDay: 'night',
      },
    ],
    recommendedWindows: [
      {
        hours: `Right before bedtime (~${Math.floor(typicalBedtime - 0.25)} PM)`,
        reasoning: 'Fresh diaper before sleep prevents nighttime wake-ups',
        timeOfDay: 'evening',
      },
      {
        hours: 'Upon waking',
        reasoning:
          'Changing diaper when baby wakes helps start the day comfortably',
        timeOfDay: 'morning',
      },
    ],
  });

  // Active play / tummy time
  recommendations.push({
    activityType: 'tummy_time',
    avoidWindows: [
      {
        hours: `2 hours before bedtime (after ${Math.floor(typicalBedtime - 2)} PM)`,
        reasoning: 'Active play too close to bedtime can overstimulate baby',
        timeOfDay: 'evening',
      },
    ],
    recommendedWindows: [
      {
        hours: 'Morning or early afternoon (9 AM - 3 PM)',
        reasoning:
          'Active play during daytime hours supports natural circadian rhythm',
        timeOfDay: 'morning',
      },
    ],
  });

  return recommendations;
}

/**
 * Get overall activity-sleep correlations for all activity types
 */
export function getActivitySleepCorrelations(
  activities: Array<typeof Activities.$inferSelect>,
  lookbackDays = 14,
): ActivitySleepCorrelation[] {
  const now = new Date();
  const cutoff = subDays(now, lookbackDays);

  const correlations: ActivitySleepCorrelation[] = [];

  // Get night sleep activities
  const nightSleeps = activities
    .filter((activity) => {
      if (activity.type !== 'sleep') return false;
      if (!activity.duration) return false;
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
    .map((s) => ({
      duration: s.duration || 0,
      startTime: new Date(s.startTime),
    }));

  if (nightSleeps.length === 0) {
    return []; // Need sleep data to analyze
  }

  const overallAvgDuration =
    nightSleeps.reduce((sum, s) => sum + s.duration, 0) / nightSleeps.length;

  // Analyze each activity type
  const activityTypes = [
    ...new Set(
      activities
        .filter((a) => a.startTime && new Date(a.startTime) >= cutoff)
        .map((a) => a.type),
    ),
  ].filter((type) => type !== 'sleep');

  for (const activityType of activityTypes) {
    const typeActivities = activities.filter((a) => a.type === activityType);

    // Check if activity happens before sleep
    const sleepDurationsWithActivity: number[] = [];
    const sleepDurationsWithoutActivity: number[] = [];

    for (const sleep of nightSleeps) {
      const activitiesBeforeSleep = typeActivities.filter((activity) => {
        const activityTime = new Date(activity.startTime);
        const minutesBefore = differenceInMinutes(
          sleep.startTime,
          activityTime,
        );
        return minutesBefore >= 0 && minutesBefore <= 180; // Within 3 hours before
      });

      if (activitiesBeforeSleep.length > 0) {
        sleepDurationsWithActivity.push(sleep.duration);
      } else {
        sleepDurationsWithoutActivity.push(sleep.duration);
      }
    }

    if (sleepDurationsWithActivity.length === 0) continue;

    const avgWithActivity =
      sleepDurationsWithActivity.reduce((sum, d) => sum + d, 0) /
      sleepDurationsWithActivity.length;
    const avgWithoutActivity =
      sleepDurationsWithoutActivity.length > 0
        ? sleepDurationsWithoutActivity.reduce((sum, d) => sum + d, 0) /
          sleepDurationsWithoutActivity.length
        : overallAvgDuration;

    const correlation =
      (avgWithActivity - avgWithoutActivity) / overallAvgDuration;

    let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (correlation > 0.05) {
      impact = 'positive';
    } else if (correlation < -0.05) {
      impact = 'negative';
    }

    let confidence: 'high' | 'medium' | 'low' = 'low';
    const sampleSize = sleepDurationsWithActivity.length;
    if (sampleSize >= 10 && Math.abs(correlation) > 0.1) {
      confidence = 'high';
    } else if (sampleSize >= 5) {
      confidence = 'medium';
    }

    let insight = '';
    if (impact === 'positive') {
      insight = `${activityType} before bedtime appears to improve sleep duration by ${Math.round(correlation * 100)}%`;
    } else if (impact === 'negative') {
      insight = `${activityType} before bedtime may reduce sleep duration by ${Math.round(Math.abs(correlation) * 100)}%`;
    } else {
      insight = `No significant correlation found between ${activityType} and sleep quality`;
    }

    correlations.push({
      activityType,
      confidence,
      correlation,
      impact,
      insight,
    });
  }

  return correlations.sort(
    (a, b) => Math.abs(b.correlation) - Math.abs(a.correlation),
  );
}
