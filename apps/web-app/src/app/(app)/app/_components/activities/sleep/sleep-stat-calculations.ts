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
