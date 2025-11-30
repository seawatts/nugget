/**
 * Sleep-specific stat calculation functions
 */

import type { Activities } from '@nugget/db/schema';
import { formatMinutesToHoursMinutes } from '../shared/time-formatting-utils';
import type {
  StatMetricType,
  StatPivotPeriod,
  StatTimePeriod,
} from '../shared/types';
import {
  calculateAverageDurationOverPeriod,
  calculateCountOverPeriod,
  calculateTotalDurationOverPeriod,
  getDateRangeForPeriod,
  normalizeValueByPivot,
} from '../shared/utils/stat-calculations';
import { filterActivitiesByTimePeriod } from '../shared/utils/time-period-utils';
import {
  analyzeNightSleepQuality,
  analyzeOptimalBedtime,
  analyzeOptimalWakeTime,
  type ConfidenceLevel,
  calculateWakeWindows,
} from './sleep-pattern-analysis';

/**
 * Calculate sleep stat based on metric, time period, and pivot period
 */
export function calculateSleepStat(
  activities: Array<typeof Activities.$inferSelect>,
  metric: StatMetricType,
  timePeriod: StatTimePeriod,
  pivotPeriod: StatPivotPeriod = 'total',
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to sleep activities only
  const sleepActivities = activities.filter(
    (activity) => activity.type === 'sleep',
  );

  let value: number | null = null;
  let formattedValue = '—';
  let label = '';

  switch (metric) {
    case 'count': {
      const count = calculateCountOverPeriod(
        sleepActivities,
        startDate,
        endDate,
        ['sleep'],
      );
      const normalizedCount = normalizeValueByPivot(
        count,
        pivotPeriod,
        timePeriod,
      );
      value = normalizedCount;
      if (normalizedCount !== null) {
        formattedValue =
          pivotPeriod === 'total'
            ? count.toString()
            : normalizedCount.toFixed(1);
      }
      label = 'Sleep Sessions';
      break;
    }

    case 'total': {
      const totalMinutes = calculateTotalDurationOverPeriod(
        sleepActivities,
        startDate,
        endDate,
        ['sleep'],
      );
      const normalizedMinutes = normalizeValueByPivot(
        totalMinutes,
        pivotPeriod,
        timePeriod,
      );
      value = normalizedMinutes;
      if (normalizedMinutes !== null) {
        formattedValue = formatMinutesToHoursMinutes(
          pivotPeriod === 'total' ? totalMinutes : normalizedMinutes,
        );
      }
      label = 'Total Sleep';
      break;
    }

    case 'average': {
      const avgMinutes = calculateAverageDurationOverPeriod(
        sleepActivities,
        startDate,
        endDate,
        ['sleep'],
      );
      value = avgMinutes;
      if (avgMinutes !== null) {
        formattedValue = formatMinutesToHoursMinutes(avgMinutes);
      }
      label = 'Average Duration';
      break;
    }

    case 'duration': {
      // Same as average for sleep
      const avgMinutes = calculateAverageDurationOverPeriod(
        sleepActivities,
        startDate,
        endDate,
        ['sleep'],
      );
      value = avgMinutes;
      if (avgMinutes !== null) {
        formattedValue = formatMinutesToHoursMinutes(avgMinutes);
      }
      label = 'Average Duration';
      break;
    }
    default:
      value = null;
      formattedValue = '—';
      label = '';
  }

  return {
    formattedValue,
    label,
    value,
  };
}

/**
 * Calculate longest sleep session duration
 */
export function calculateLongestSleep(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to sleep activities in the time period
  const sleepActivities = activities
    .filter((activity) => activity.type === 'sleep')
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    })
    .filter((activity) => activity.duration !== null && activity.duration > 0);

  if (sleepActivities.length === 0) {
    return {
      formattedValue: '—',
      label: 'Longest Sleep',
      value: null,
    };
  }

  // Find the longest sleep duration
  let longestMinutes = 0;
  for (const activity of sleepActivities) {
    const duration = activity.duration ?? 0;
    if (duration > longestMinutes) {
      longestMinutes = duration;
    }
  }

  return {
    formattedValue: formatMinutesToHoursMinutes(longestMinutes),
    label: 'Longest Sleep',
    value: longestMinutes,
  };
}

/**
 * Calculate longest awake period between sleep sessions
 */
export function calculateLongestAwake(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to sleep activities in the time period, sorted by start time
  const sleepActivities = activities
    .filter((activity) => activity.type === 'sleep')
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    })
    .filter((activity) => activity.endTime !== null)
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  if (sleepActivities.length < 2) {
    return {
      formattedValue: '—',
      label: 'Longest Awake',
      value: null,
    };
  }

  // Calculate gaps between sleep sessions
  let longestAwakeMinutes = 0;
  for (let i = 1; i < sleepActivities.length; i++) {
    const prevSleep = sleepActivities[i - 1];
    const currSleep = sleepActivities[i];

    if (!prevSleep?.endTime || !currSleep?.startTime) continue;

    const prevEndTime = new Date(prevSleep.endTime);
    const currStartTime = new Date(currSleep.startTime);

    // Calculate gap in minutes
    const gapMinutes =
      (currStartTime.getTime() - prevEndTime.getTime()) / (1000 * 60);

    if (gapMinutes > longestAwakeMinutes) {
      longestAwakeMinutes = gapMinutes;
    }
  }

  if (longestAwakeMinutes === 0) {
    return {
      formattedValue: '—',
      label: 'Longest Awake',
      value: null,
    };
  }

  return {
    formattedValue: formatMinutesToHoursMinutes(longestAwakeMinutes),
    label: 'Longest Awake',
    value: longestAwakeMinutes,
  };
}

/**
 * Calculate average awake period between sleep sessions
 */
export function calculateAverageAwake(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to sleep activities in the time period, sorted by start time
  const sleepActivities = activities
    .filter((activity) => activity.type === 'sleep')
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    })
    .filter((activity) => activity.endTime !== null)
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  if (sleepActivities.length < 2) {
    return {
      formattedValue: '—',
      label: 'Avg Awake',
      value: null,
    };
  }

  // Calculate gaps between sleep sessions
  const gaps: number[] = [];
  for (let i = 1; i < sleepActivities.length; i++) {
    const prevSleep = sleepActivities[i - 1];
    const currSleep = sleepActivities[i];

    if (!prevSleep?.endTime || !currSleep?.startTime) continue;

    const prevEndTime = new Date(prevSleep.endTime);
    const currStartTime = new Date(currSleep.startTime);

    // Calculate gap in minutes
    const gapMinutes =
      (currStartTime.getTime() - prevEndTime.getTime()) / (1000 * 60);
    gaps.push(gapMinutes);
  }

  if (gaps.length === 0) {
    return {
      formattedValue: '—',
      label: 'Avg Awake',
      value: null,
    };
  }

  // Calculate average
  const avgAwakeMinutes = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;

  return {
    formattedValue: formatMinutesToHoursMinutes(avgAwakeMinutes),
    label: 'Avg Awake',
    value: avgAwakeMinutes,
  };
}

/**
 * Calculate shortest sleep session duration
 */
export function calculateShortestSleep(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to sleep activities in the time period
  const sleepActivities = activities
    .filter((activity) => activity.type === 'sleep')
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    })
    .filter((activity) => activity.duration !== null && activity.duration > 0);

  if (sleepActivities.length === 0) {
    return {
      formattedValue: '—',
      label: 'Shortest Sleep',
      value: null,
    };
  }

  // Find the shortest sleep duration
  let shortestMinutes = Number.POSITIVE_INFINITY;
  for (const activity of sleepActivities) {
    const duration = activity.duration ?? 0;
    if (duration < shortestMinutes) {
      shortestMinutes = duration;
    }
  }

  if (shortestMinutes === Number.POSITIVE_INFINITY) {
    return {
      formattedValue: '—',
      label: 'Shortest Sleep',
      value: null,
    };
  }

  return {
    formattedValue: formatMinutesToHoursMinutes(shortestMinutes),
    label: 'Shortest Sleep',
    value: shortestMinutes,
  };
}

/**
 * Calculate shortest awake period between sleep sessions
 */
export function calculateShortestAwake(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to sleep activities in the time period, sorted by start time
  const sleepActivities = activities
    .filter((activity) => activity.type === 'sleep')
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    })
    .filter((activity) => activity.endTime !== null)
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  if (sleepActivities.length < 2) {
    return {
      formattedValue: '—',
      label: 'Shortest Awake',
      value: null,
    };
  }

  // Calculate gaps between sleep sessions
  let shortestAwakeMinutes = Number.POSITIVE_INFINITY;
  for (let i = 1; i < sleepActivities.length; i++) {
    const prevSleep = sleepActivities[i - 1];
    const currSleep = sleepActivities[i];

    if (!prevSleep?.endTime || !currSleep?.startTime) continue;

    const prevEndTime = new Date(prevSleep.endTime);
    const currStartTime = new Date(currSleep.startTime);

    // Calculate gap in minutes
    const gapMinutes =
      (currStartTime.getTime() - prevEndTime.getTime()) / (1000 * 60);

    if (gapMinutes < shortestAwakeMinutes) {
      shortestAwakeMinutes = gapMinutes;
    }
  }

  if (shortestAwakeMinutes === Number.POSITIVE_INFINITY) {
    return {
      formattedValue: '—',
      label: 'Shortest Awake',
      value: null,
    };
  }

  return {
    formattedValue: formatMinutesToHoursMinutes(shortestAwakeMinutes),
    label: 'Shortest Awake',
    value: shortestAwakeMinutes,
  };
}

/**
 * Calculate night sleep statistics
 * Night is defined as 6 PM (18:00) - 6 AM (06:00)
 */
export function calculateNightSleepStat(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  count: number;
  totalMinutes: number;
  avgDuration: number | null;
  longestSleep: number | null;
  formatted: {
    count: string;
    total: string;
    avgDuration: string;
    longestSleep: string;
  };
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to sleep activities in the time period
  const sleepActivities = activities
    .filter((activity) => activity.type === 'sleep')
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    });

  // Filter to night activities only
  const nightSleepActivities = filterActivitiesByTimePeriod(
    sleepActivities,
    'night',
  );

  const count = nightSleepActivities.length;
  const totalMinutes = nightSleepActivities.reduce(
    (sum, activity) => sum + (activity.duration || 0),
    0,
  );

  const activitiesWithDuration = nightSleepActivities.filter(
    (activity) => activity.duration && activity.duration > 0,
  );
  const avgDuration =
    activitiesWithDuration.length > 0
      ? totalMinutes / activitiesWithDuration.length
      : null;

  let longestSleep: number | null = null;
  if (activitiesWithDuration.length > 0) {
    longestSleep = Math.max(
      ...activitiesWithDuration.map((activity) => activity.duration || 0),
    );
  }

  return {
    avgDuration,
    count,
    formatted: {
      avgDuration: avgDuration ? formatMinutesToHoursMinutes(avgDuration) : '—',
      count: count.toString(),
      longestSleep: longestSleep
        ? formatMinutesToHoursMinutes(longestSleep)
        : '—',
      total: formatMinutesToHoursMinutes(totalMinutes),
    },
    longestSleep,
    totalMinutes,
  };
}

/**
 * Calculate day sleep (nap) statistics
 * Day is defined as 6 AM (06:00) - 6 PM (18:00)
 */
export function calculateDaySleepStat(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  count: number;
  totalMinutes: number;
  avgDuration: number | null;
  longestNap: number | null;
  formatted: {
    count: string;
    total: string;
    avgDuration: string;
    longestNap: string;
  };
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to sleep activities in the time period
  const sleepActivities = activities
    .filter((activity) => activity.type === 'sleep')
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    });

  // Filter to day activities only
  const daySleepActivities = filterActivitiesByTimePeriod(
    sleepActivities,
    'day',
  );

  const count = daySleepActivities.length;
  const totalMinutes = daySleepActivities.reduce(
    (sum, activity) => sum + (activity.duration || 0),
    0,
  );

  const activitiesWithDuration = daySleepActivities.filter(
    (activity) => activity.duration && activity.duration > 0,
  );
  const avgDuration =
    activitiesWithDuration.length > 0
      ? totalMinutes / activitiesWithDuration.length
      : null;

  let longestNap: number | null = null;
  if (activitiesWithDuration.length > 0) {
    longestNap = Math.max(
      ...activitiesWithDuration.map((activity) => activity.duration || 0),
    );
  }

  return {
    avgDuration,
    count,
    formatted: {
      avgDuration: avgDuration ? formatMinutesToHoursMinutes(avgDuration) : '—',
      count: count.toString(),
      longestNap: longestNap ? formatMinutesToHoursMinutes(longestNap) : '—',
      total: formatMinutesToHoursMinutes(totalMinutes),
    },
    longestNap,
    totalMinutes,
  };
}

/**
 * Calculate night vs day sleep comparison
 */
export function calculateNightVsDaySleepComparison(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  night: ReturnType<typeof calculateNightSleepStat>;
  day: ReturnType<typeof calculateDaySleepStat>;
  nightPercentage: number | null;
  dayPercentage: number | null;
} {
  const night = calculateNightSleepStat(activities, timePeriod);
  const day = calculateDaySleepStat(activities, timePeriod);

  const totalSleep = night.totalMinutes + day.totalMinutes;
  const nightPercentage =
    totalSleep > 0 ? (night.totalMinutes / totalSleep) * 100 : null;
  const dayPercentage =
    totalSleep > 0 ? (day.totalMinutes / totalSleep) * 100 : null;

  return {
    day,
    dayPercentage,
    night,
    nightPercentage,
  };
}

/**
 * Calculate optimal wake time recommendation
 */
export function calculateOptimalWakeTime(
  activities: Array<typeof Activities.$inferSelect>,
  babyBirthDate: Date | null,
): {
  recommendedTime: Date;
  confidence: ConfidenceLevel;
  formattedTime: string;
  reasoning: string;
} {
  const result = analyzeOptimalWakeTime(activities, babyBirthDate);

  const formattedTime = result.recommendedTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: true,
    minute: '2-digit',
  });

  return {
    confidence: result.confidence,
    formattedTime,
    reasoning: result.reasoning,
    recommendedTime: result.recommendedTime,
  };
}

/**
 * Calculate optimal bedtime recommendation
 */
export function calculateOptimalBedtime(
  activities: Array<typeof Activities.$inferSelect>,
  babyBirthDate: Date | null,
): {
  recommendedTime: Date;
  confidence: ConfidenceLevel;
  formattedTime: string;
  reasoning: string;
} {
  const result = analyzeOptimalBedtime(activities, babyBirthDate);

  const formattedTime = result.recommendedTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: true,
    minute: '2-digit',
  });

  return {
    confidence: result.confidence,
    formattedTime,
    reasoning: result.reasoning,
    recommendedTime: result.recommendedTime,
  };
}

/**
 * Calculate optimal daytime wake windows
 */
export function calculateDaytimeWakeWindows(
  activities: Array<typeof Activities.$inferSelect>,
  babyBirthDate: Date | null,
): {
  windowMinutes: number;
  windowHours: number;
  formattedWindow: string;
  confidence: ConfidenceLevel;
  reasoning: string;
} {
  const result = calculateWakeWindows(activities, babyBirthDate);

  const windowHours = result.windowMinutes / 60;
  const formattedWindow = formatMinutesToHoursMinutes(result.windowMinutes);

  return {
    confidence: result.confidence,
    formattedWindow,
    reasoning: result.reasoning,
    windowHours,
    windowMinutes: result.windowMinutes,
  };
}

/**
 * Calculate night sleep quality metrics
 */
/**
 * Calculate night sleep quality metrics
 */
export function calculateNightSleepMetrics(
  activities: Array<typeof Activities.$inferSelect>,
): {
  averageDurationMinutes: number | null;
  consistencyScore: number;
  formattedAverage: string;
  qualityTrend: 'improving' | 'stable' | 'declining';
} {
  const result = analyzeNightSleepQuality(activities);

  return {
    averageDurationMinutes: result.averageDurationMinutes,
    consistencyScore: result.consistencyScore,
    formattedAverage: result.averageDurationMinutes
      ? formatMinutesToHoursMinutes(result.averageDurationMinutes)
      : '—',
    qualityTrend: result.qualityTrend,
  };
}
