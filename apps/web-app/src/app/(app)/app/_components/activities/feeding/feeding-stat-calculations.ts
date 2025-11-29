/**
 * Feeding-specific stat calculation functions
 * Wraps generic stat calculations with feeding-specific filtering and formatting
 */

import type { Activities } from '@nugget/db/schema';
import { format } from 'date-fns';
import type {
  StatMetricType,
  StatPivotPeriod,
  StatTimePeriod,
} from '../shared/types';
import {
  calculateAverageAmountOverPeriod,
  calculateAverageDurationOverPeriod,
  calculateTotalAmountOverPeriod,
  getDateRangeForPeriod,
  normalizeValueByPivot,
} from '../shared/utils/stat-calculations';
import { formatVolumeDisplay } from '../shared/volume-utils';
import { isLiquidFeedingActivity } from './feeding-goals';

const FEEDING_ACTIVITY_TYPES = ['feeding', 'bottle', 'nursing'];

/**
 * Calculate feeding count by type over a time period
 */
function calculateFeedingCountByType(
  activities: Array<typeof Activities.$inferSelect>,
  startDate: Date,
  endDate: Date,
  type: 'total' | 'bottle' | 'nursing',
): number {
  const filtered = activities.filter((activity) => {
    if (!isLiquidFeedingActivity(activity.type)) return false;
    const activityDate = new Date(activity.startTime);
    return activityDate >= startDate && activityDate <= endDate;
  });

  if (type === 'total') {
    return filtered.length;
  }

  return filtered.filter((activity) => activity.type === type).length;
}

/**
 * Get human-readable label for feeding type
 */
function getFeedingTypeLabel(type: string): string {
  switch (type) {
    case 'bottle':
      return 'Bottle';
    case 'nursing':
      return 'Nursing';
    case 'feeding':
      return 'Feeding';
    default:
      return type;
  }
}

/**
 * Calculate feeding stat based on metric, time period, and pivot period
 */
export function calculateFeedingStat(
  activities: Array<typeof Activities.$inferSelect>,
  metric: StatMetricType,
  timePeriod: StatTimePeriod,
  unit: 'ML' | 'OZ',
  pivotPeriod: StatPivotPeriod = 'total',
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to feeding activities only
  const feedingActivities = activities.filter((activity) =>
    isLiquidFeedingActivity(activity.type),
  );

  let value: number | null = null;
  let formattedValue = '—';
  let label = '';

  switch (metric) {
    case 'count': {
      const count = calculateFeedingCountByType(
        activities,
        startDate,
        endDate,
        'total',
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
      label = 'Feedings';
      break;
    }

    case 'total':
    case 'amount': {
      const totalMl = calculateTotalAmountOverPeriod(
        feedingActivities,
        startDate,
        endDate,
        FEEDING_ACTIVITY_TYPES,
      );
      const normalizedMl = normalizeValueByPivot(
        totalMl,
        pivotPeriod,
        timePeriod,
      );
      value = normalizedMl;
      if (normalizedMl !== null) {
        formattedValue = formatVolumeDisplay(
          pivotPeriod === 'total' ? totalMl : normalizedMl,
          unit,
          true,
        );
      }
      label = 'Total Amount';
      break;
    }

    case 'average': {
      const avgMl = calculateAverageAmountOverPeriod(
        feedingActivities,
        startDate,
        endDate,
        FEEDING_ACTIVITY_TYPES,
      );
      // For average, pivot doesn't make sense - it's already per feeding
      value = avgMl;
      if (avgMl !== null) {
        formattedValue = formatVolumeDisplay(avgMl, unit, true);
      }
      label = 'Average Amount';
      break;
    }

    case 'duration': {
      const avgDuration = calculateAverageDurationOverPeriod(
        feedingActivities,
        startDate,
        endDate,
        FEEDING_ACTIVITY_TYPES,
      );
      // For average duration, pivot doesn't make sense - it's already per feeding
      value = avgDuration;
      if (avgDuration !== null) {
        // Format duration as hours and minutes
        const hours = Math.floor(avgDuration / 60);
        const minutes = Math.round(avgDuration % 60);
        if (hours > 0 && minutes > 0) {
          formattedValue = `${hours}h ${minutes}m`;
        } else if (hours > 0) {
          formattedValue = `${hours}h`;
        } else {
          formattedValue = `${minutes}m`;
        }
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
 * Calculate bottle feeding count
 */
export function calculateBottleCount(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
  pivotPeriod: StatPivotPeriod = 'total',
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);
  const count = calculateFeedingCountByType(
    activities,
    startDate,
    endDate,
    'bottle',
  );
  const normalizedCount = normalizeValueByPivot(count, pivotPeriod, timePeriod);
  return {
    formattedValue:
      pivotPeriod === 'total' || normalizedCount === null
        ? count.toString()
        : normalizedCount.toFixed(1),
    label: 'Bottle',
    value: normalizedCount,
  };
}

/**
 * Calculate nursing feeding count
 */
export function calculateNursingCount(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
  pivotPeriod: StatPivotPeriod = 'total',
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);
  const count = calculateFeedingCountByType(
    activities,
    startDate,
    endDate,
    'nursing',
  );
  const normalizedCount = normalizeValueByPivot(count, pivotPeriod, timePeriod);
  return {
    formattedValue:
      pivotPeriod === 'total' || normalizedCount === null
        ? count.toString()
        : normalizedCount.toFixed(1),
    label: 'Nursing',
    value: normalizedCount,
  };
}

/**
 * Calculate most common feeding type
 */
export function calculateMostCommonFeedingType(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  value: string | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to feeding activities in the time period
  const feedingActivities = activities
    .filter((activity) => isLiquidFeedingActivity(activity.type))
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    });

  if (feedingActivities.length === 0) {
    return {
      formattedValue: '—',
      label: 'Most Common Type',
      value: null,
    };
  }

  // Count each type
  const typeCounts: Record<string, number> = {};
  for (const activity of feedingActivities) {
    const type = activity.type || 'feeding';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }

  // Find the most common type
  let mostCommonType = 'feeding';
  let maxCount = 0;
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonType = type;
    }
  }

  return {
    formattedValue: getFeedingTypeLabel(mostCommonType),
    label: 'Most Common Type',
    value: mostCommonType,
  };
}

/**
 * Calculate average cluster feeding time of day
 * Cluster feeding is defined as feedings with intervals < 2 hours
 */
export function calculateAverageClusterFeedingTime(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
  timeFormat: '12h' | '24h' = '12h',
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to feeding activities in the time period, sorted by time
  const feedingActivities = activities
    .filter((activity) => isLiquidFeedingActivity(activity.type))
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  if (feedingActivities.length < 2) {
    return {
      formattedValue: '—',
      label: 'Avg Cluster Time',
      value: null,
    };
  }

  // Identify cluster feeding sessions (intervals < 2 hours)
  const clusterFeedingTimes: Date[] = [];
  for (let i = 1; i < feedingActivities.length; i++) {
    const prevFeeding = feedingActivities[i - 1];
    const currFeeding = feedingActivities[i];
    if (!prevFeeding || !currFeeding) continue;
    const prevTime = new Date(prevFeeding.startTime);
    const currTime = new Date(currFeeding.startTime);
    const intervalHours =
      (currTime.getTime() - prevTime.getTime()) / (1000 * 60 * 60);

    if (intervalHours < 2) {
      // This is a cluster feeding - use the current feeding time
      clusterFeedingTimes.push(currTime);
    }
  }

  if (clusterFeedingTimes.length === 0) {
    return {
      formattedValue: '—',
      label: 'Avg Cluster Time',
      value: null,
    };
  }

  // Calculate average time of day in minutes since midnight
  const timesInMinutes = clusterFeedingTimes.map((date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return hours * 60 + minutes;
  });

  const avgMinutes =
    timesInMinutes.reduce((sum, minutes) => sum + minutes, 0) /
    timesInMinutes.length;

  // Format the average time
  const avgHours = Math.floor(avgMinutes / 60);
  const avgMins = Math.round(avgMinutes % 60);
  const avgDate = new Date();
  avgDate.setHours(avgHours, avgMins, 0, 0);

  const formattedValue =
    timeFormat === '12h' ? format(avgDate, 'h:mm a') : format(avgDate, 'HH:mm');

  return {
    formattedValue,
    label: 'Avg Cluster Time',
    value: avgMinutes,
  };
}

/**
 * Calculate largest single feeding amount
 */
export function calculateLargestFeedingAmount(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
  unit: 'ML' | 'OZ',
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to feeding activities in the time period
  const feedingActivities = activities
    .filter((activity) => isLiquidFeedingActivity(activity.type))
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    })
    .filter((activity) => activity.amountMl !== null && activity.amountMl > 0);

  if (feedingActivities.length === 0) {
    return {
      formattedValue: '—',
      label: 'Largest Amount',
      value: null,
    };
  }

  // Find the largest amount
  let largestMl = 0;
  for (const activity of feedingActivities) {
    const amountMl = activity.amountMl ?? 0;
    if (amountMl > largestMl) {
      largestMl = amountMl;
    }
  }

  return {
    formattedValue: formatVolumeDisplay(largestMl, unit, true),
    label: 'Largest Amount',
    value: largestMl,
  };
}

/**
 * Calculate longest gap between feedings
 */
export function calculateLongestFeedingGap(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to feeding activities in the time period, sorted by start time
  const feedingActivities = activities
    .filter((activity) => isLiquidFeedingActivity(activity.type))
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  if (feedingActivities.length < 2) {
    return {
      formattedValue: '—',
      label: 'Longest Gap',
      value: null,
    };
  }

  // Calculate gaps between feedings
  let longestGapMinutes = 0;
  for (let i = 1; i < feedingActivities.length; i++) {
    const prevFeeding = feedingActivities[i - 1];
    const currFeeding = feedingActivities[i];

    if (!prevFeeding?.startTime || !currFeeding?.startTime) continue;

    const prevTime = new Date(prevFeeding.startTime);
    const currTime = new Date(currFeeding.startTime);

    // Calculate gap in minutes
    const gapMinutes = (currTime.getTime() - prevTime.getTime()) / (1000 * 60);

    if (gapMinutes > longestGapMinutes) {
      longestGapMinutes = gapMinutes;
    }
  }

  if (longestGapMinutes === 0) {
    return {
      formattedValue: '—',
      label: 'Longest Gap',
      value: null,
    };
  }

  // Format as hours and minutes (whole numbers only)
  const hours = Math.floor(longestGapMinutes / 60);
  const mins = Math.round(longestGapMinutes % 60);

  let formattedValue = '';
  if (hours > 0 && mins > 0) {
    formattedValue = `${hours}h ${mins}m`;
  } else if (hours > 0) {
    formattedValue = `${hours}h`;
  } else {
    formattedValue = `${mins}m`;
  }

  return {
    formattedValue,
    label: 'Longest Gap',
    value: longestGapMinutes,
  };
}

/**
 * Calculate average gap between feedings
 */
export function calculateAverageFeedingGap(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to feeding activities in the time period, sorted by start time
  const feedingActivities = activities
    .filter((activity) => isLiquidFeedingActivity(activity.type))
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  if (feedingActivities.length < 2) {
    return {
      formattedValue: '—',
      label: 'Avg Gap',
      value: null,
    };
  }

  // Calculate gaps between feedings
  const gaps: number[] = [];
  for (let i = 1; i < feedingActivities.length; i++) {
    const prevFeeding = feedingActivities[i - 1];
    const currFeeding = feedingActivities[i];

    if (!prevFeeding?.startTime || !currFeeding?.startTime) continue;

    const prevTime = new Date(prevFeeding.startTime);
    const currTime = new Date(currFeeding.startTime);

    // Calculate gap in minutes
    const gapMinutes = (currTime.getTime() - prevTime.getTime()) / (1000 * 60);
    gaps.push(gapMinutes);
  }

  if (gaps.length === 0) {
    return {
      formattedValue: '—',
      label: 'Avg Gap',
      value: null,
    };
  }

  // Calculate average
  const avgGapMinutes = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;

  // Format as hours and minutes (whole numbers only)
  const hours = Math.floor(avgGapMinutes / 60);
  const mins = Math.round(avgGapMinutes % 60);

  let formattedValue = '';
  if (hours > 0 && mins > 0) {
    formattedValue = `${hours}h ${mins}m`;
  } else if (hours > 0) {
    formattedValue = `${hours}h`;
  } else {
    formattedValue = `${mins}m`;
  }

  return {
    formattedValue,
    label: 'Avg Gap',
    value: avgGapMinutes,
  };
}

/**
 * Calculate shortest gap between feedings
 */
export function calculateShortestFeedingGap(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to feeding activities in the time period, sorted by start time
  const feedingActivities = activities
    .filter((activity) => isLiquidFeedingActivity(activity.type))
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  if (feedingActivities.length < 2) {
    return {
      formattedValue: '—',
      label: 'Shortest Gap',
      value: null,
    };
  }

  // Calculate gaps between feedings
  let shortestGapMinutes = Number.POSITIVE_INFINITY;
  for (let i = 1; i < feedingActivities.length; i++) {
    const prevFeeding = feedingActivities[i - 1];
    const currFeeding = feedingActivities[i];

    if (!prevFeeding?.startTime || !currFeeding?.startTime) continue;

    const prevTime = new Date(prevFeeding.startTime);
    const currTime = new Date(currFeeding.startTime);

    // Calculate gap in minutes
    const gapMinutes = (currTime.getTime() - prevTime.getTime()) / (1000 * 60);

    if (gapMinutes < shortestGapMinutes) {
      shortestGapMinutes = gapMinutes;
    }
  }

  if (shortestGapMinutes === Number.POSITIVE_INFINITY) {
    return {
      formattedValue: '—',
      label: 'Shortest Gap',
      value: null,
    };
  }

  // Format as hours and minutes (whole numbers only)
  const hours = Math.floor(shortestGapMinutes / 60);
  const mins = Math.round(shortestGapMinutes % 60);

  let formattedValue = '';
  if (hours > 0 && mins > 0) {
    formattedValue = `${hours}h ${mins}m`;
  } else if (hours > 0) {
    formattedValue = `${hours}h`;
  } else {
    formattedValue = `${mins}m`;
  }

  return {
    formattedValue,
    label: 'Shortest Gap',
    value: shortestGapMinutes,
  };
}
