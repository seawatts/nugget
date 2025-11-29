/**
 * Diaper-specific stat calculation functions
 */

import type { Activities } from '@nugget/db/schema';
import type {
  StatMetricType,
  StatPivotPeriod,
  StatTimePeriod,
} from '../shared/types';
import {
  getDateRangeForPeriod,
  normalizeValueByPivot,
} from '../shared/utils/stat-calculations';

/**
 * Calculate diaper count by type over a time period
 */
function calculateDiaperCountByType(
  activities: Array<typeof Activities.$inferSelect>,
  startDate: Date,
  endDate: Date,
  type: 'total' | 'wet' | 'dirty' | 'both',
): number {
  const filtered = activities.filter((activity) => {
    if (activity.type !== 'diaper') return false;
    const activityDate = new Date(activity.startTime);
    return activityDate >= startDate && activityDate <= endDate;
  });

  if (type === 'total') {
    return filtered.length;
  }

  let count = 0;
  for (const diaper of filtered) {
    const details = diaper.details as { type?: string } | null;
    const diaperType = details?.type;

    if (type === 'wet' && (diaperType === 'wet' || diaperType === 'both')) {
      count++;
    } else if (
      type === 'dirty' &&
      (diaperType === 'dirty' || diaperType === 'both')
    ) {
      count++;
    } else if (type === 'both' && diaperType === 'both') {
      count++;
    }
  }

  return count;
}

/**
 * Calculate diaper stat based on metric, time period, and pivot period
 */
export function calculateDiaperStat(
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

  let value: number | null = null;
  let formattedValue = '—';
  let label = '';

  switch (metric) {
    case 'count': {
      const count = calculateDiaperCountByType(
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
      label = 'Diapers';
      break;
    }

    case 'total': {
      // For diaper, "total" means total count
      const count = calculateDiaperCountByType(
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
      label = 'Total Diapers';
      break;
    }

    case 'average': {
      // Average could mean average per day, but for simplicity, show wet count
      const wetCount = calculateDiaperCountByType(
        activities,
        startDate,
        endDate,
        'wet',
      );
      const normalizedCount = normalizeValueByPivot(
        wetCount,
        pivotPeriod,
        timePeriod,
      );
      value = normalizedCount;
      if (normalizedCount !== null) {
        formattedValue =
          pivotPeriod === 'total'
            ? wetCount.toString()
            : normalizedCount.toFixed(1);
      }
      label = 'Wet Diapers';
      break;
    }

    case 'duration': {
      // For duration, show dirty count
      const dirtyCount = calculateDiaperCountByType(
        activities,
        startDate,
        endDate,
        'dirty',
      );
      const normalizedCount = normalizeValueByPivot(
        dirtyCount,
        pivotPeriod,
        timePeriod,
      );
      value = normalizedCount;
      if (normalizedCount !== null) {
        formattedValue =
          pivotPeriod === 'total'
            ? dirtyCount.toString()
            : normalizedCount.toFixed(1);
      }
      label = 'Dirty Diapers';
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
 * Get human-readable label for diaper type
 */
function getDiaperTypeLabel(type: string): string {
  switch (type) {
    case 'wet':
      return 'Wet';
    case 'dirty':
      return 'Dirty';
    case 'both':
      return 'Both';
    default:
      return type;
  }
}

/**
 * Get diaper type from activity details
 */
function getDiaperType(
  activity: typeof Activities.$inferSelect,
): 'wet' | 'dirty' | 'both' | null {
  if (activity.type !== 'diaper') return null;
  const details = activity.details as { type?: string } | null;
  const type = details?.type;
  if (type === 'wet' || type === 'dirty' || type === 'both') {
    return type;
  }
  return null;
}

/**
 * Calculate longest gap between diaper changes
 */
export function calculateLongestDiaperGap(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to diaper activities in the time period, sorted by start time
  const diaperActivities = activities
    .filter((activity) => activity.type === 'diaper')
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  if (diaperActivities.length < 2) {
    return {
      formattedValue: '—',
      label: 'Longest Gap',
      value: null,
    };
  }

  // Calculate gaps between diaper changes
  let longestGapMinutes = 0;
  for (let i = 1; i < diaperActivities.length; i++) {
    const prevDiaper = diaperActivities[i - 1];
    const currDiaper = diaperActivities[i];

    if (!prevDiaper?.startTime || !currDiaper?.startTime) continue;

    const prevTime = new Date(prevDiaper.startTime);
    const currTime = new Date(currDiaper.startTime);

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
 * Calculate average gap between diaper changes
 */
export function calculateAverageDiaperGap(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to diaper activities in the time period, sorted by start time
  const diaperActivities = activities
    .filter((activity) => activity.type === 'diaper')
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  if (diaperActivities.length < 2) {
    return {
      formattedValue: '—',
      label: 'Avg Gap',
      value: null,
    };
  }

  // Calculate gaps between diaper changes
  const gaps: number[] = [];
  for (let i = 1; i < diaperActivities.length; i++) {
    const prevDiaper = diaperActivities[i - 1];
    const currDiaper = diaperActivities[i];

    if (!prevDiaper?.startTime || !currDiaper?.startTime) continue;

    const prevTime = new Date(prevDiaper.startTime);
    const currTime = new Date(currDiaper.startTime);

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
 * Calculate longest period without a wet diaper (dehydration concern)
 */
export function calculateLongestDryPeriod(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to wet diapers (including "both") in the time period, sorted by start time
  const wetDiapers = activities
    .filter((activity) => activity.type === 'diaper')
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    })
    .filter((activity) => {
      const type = getDiaperType(activity);
      return type === 'wet' || type === 'both';
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  if (wetDiapers.length < 2) {
    return {
      formattedValue: '—',
      label: 'Longest Dry',
      value: null,
    };
  }

  // Calculate gaps between wet diapers
  let longestDryMinutes = 0;
  for (let i = 1; i < wetDiapers.length; i++) {
    const prevWet = wetDiapers[i - 1];
    const currWet = wetDiapers[i];

    if (!prevWet?.startTime || !currWet?.startTime) continue;

    const prevTime = new Date(prevWet.startTime);
    const currTime = new Date(currWet.startTime);

    // Calculate gap in minutes
    const gapMinutes = (currTime.getTime() - prevTime.getTime()) / (1000 * 60);

    if (gapMinutes > longestDryMinutes) {
      longestDryMinutes = gapMinutes;
    }
  }

  if (longestDryMinutes === 0) {
    return {
      formattedValue: '—',
      label: 'Longest Dry',
      value: null,
    };
  }

  // Format as hours and minutes (whole numbers only)
  const hours = Math.floor(longestDryMinutes / 60);
  const mins = Math.round(longestDryMinutes % 60);

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
    label: 'Longest Dry',
    value: longestDryMinutes,
  };
}

/**
 * Calculate longest period without a dirty diaper (constipation concern)
 */
export function calculateLongestCleanPeriod(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to dirty diapers (including "both") in the time period, sorted by start time
  const dirtyDiapers = activities
    .filter((activity) => activity.type === 'diaper')
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    })
    .filter((activity) => {
      const type = getDiaperType(activity);
      return type === 'dirty' || type === 'both';
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  if (dirtyDiapers.length < 2) {
    return {
      formattedValue: '—',
      label: 'Longest Clean',
      value: null,
    };
  }

  // Calculate gaps between dirty diapers
  let longestCleanMinutes = 0;
  for (let i = 1; i < dirtyDiapers.length; i++) {
    const prevDirty = dirtyDiapers[i - 1];
    const currDirty = dirtyDiapers[i];

    if (!prevDirty?.startTime || !currDirty?.startTime) continue;

    const prevTime = new Date(prevDirty.startTime);
    const currTime = new Date(currDirty.startTime);

    // Calculate gap in minutes
    const gapMinutes = (currTime.getTime() - prevTime.getTime()) / (1000 * 60);

    if (gapMinutes > longestCleanMinutes) {
      longestCleanMinutes = gapMinutes;
    }
  }

  if (longestCleanMinutes === 0) {
    return {
      formattedValue: '—',
      label: 'Longest Clean',
      value: null,
    };
  }

  // Format as hours and minutes (whole numbers only)
  const hours = Math.floor(longestCleanMinutes / 60);
  const mins = Math.round(longestCleanMinutes % 60);

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
    label: 'Longest Clean',
    value: longestCleanMinutes,
  };
}

/**
 * Calculate average dry period between wet diapers
 */
export function calculateAverageDryPeriod(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to wet diapers (including "both") in the time period, sorted by start time
  const wetDiapers = activities
    .filter((activity) => activity.type === 'diaper')
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    })
    .filter((activity) => {
      const type = getDiaperType(activity);
      return type === 'wet' || type === 'both';
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  if (wetDiapers.length < 2) {
    return {
      formattedValue: '—',
      label: 'Avg Dry',
      value: null,
    };
  }

  // Calculate gaps between wet diapers
  const gaps: number[] = [];
  for (let i = 1; i < wetDiapers.length; i++) {
    const prevWet = wetDiapers[i - 1];
    const currWet = wetDiapers[i];

    if (!prevWet?.startTime || !currWet?.startTime) continue;

    const prevTime = new Date(prevWet.startTime);
    const currTime = new Date(currWet.startTime);

    // Calculate gap in minutes
    const gapMinutes = (currTime.getTime() - prevTime.getTime()) / (1000 * 60);
    gaps.push(gapMinutes);
  }

  if (gaps.length === 0) {
    return {
      formattedValue: '—',
      label: 'Avg Dry',
      value: null,
    };
  }

  // Calculate average
  const avgDryMinutes = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;

  // Format as hours and minutes (whole numbers only)
  const hours = Math.floor(avgDryMinutes / 60);
  const mins = Math.round(avgDryMinutes % 60);

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
    label: 'Avg Dry',
    value: avgDryMinutes,
  };
}

/**
 * Calculate average clean period between dirty diapers
 */
export function calculateAverageCleanPeriod(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to dirty diapers (including "both") in the time period, sorted by start time
  const dirtyDiapers = activities
    .filter((activity) => activity.type === 'diaper')
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    })
    .filter((activity) => {
      const type = getDiaperType(activity);
      return type === 'dirty' || type === 'both';
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  if (dirtyDiapers.length < 2) {
    return {
      formattedValue: '—',
      label: 'Avg Clean',
      value: null,
    };
  }

  // Calculate gaps between dirty diapers
  const gaps: number[] = [];
  for (let i = 1; i < dirtyDiapers.length; i++) {
    const prevDirty = dirtyDiapers[i - 1];
    const currDirty = dirtyDiapers[i];

    if (!prevDirty?.startTime || !currDirty?.startTime) continue;

    const prevTime = new Date(prevDirty.startTime);
    const currTime = new Date(currDirty.startTime);

    // Calculate gap in minutes
    const gapMinutes = (currTime.getTime() - prevTime.getTime()) / (1000 * 60);
    gaps.push(gapMinutes);
  }

  if (gaps.length === 0) {
    return {
      formattedValue: '—',
      label: 'Avg Clean',
      value: null,
    };
  }

  // Calculate average
  const avgCleanMinutes = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;

  // Format as hours and minutes (whole numbers only)
  const hours = Math.floor(avgCleanMinutes / 60);
  const mins = Math.round(avgCleanMinutes % 60);

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
    label: 'Avg Clean',
    value: avgCleanMinutes,
  };
}

/**
 * Calculate shortest gap between diaper changes
 */
export function calculateShortestDiaperGap(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to diaper activities in the time period, sorted by start time
  const diaperActivities = activities
    .filter((activity) => activity.type === 'diaper')
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  if (diaperActivities.length < 2) {
    return {
      formattedValue: '—',
      label: 'Shortest Gap',
      value: null,
    };
  }

  // Calculate gaps between diaper changes
  let shortestGapMinutes = Number.POSITIVE_INFINITY;
  for (let i = 1; i < diaperActivities.length; i++) {
    const prevDiaper = diaperActivities[i - 1];
    const currDiaper = diaperActivities[i];

    if (!prevDiaper?.startTime || !currDiaper?.startTime) continue;

    const prevTime = new Date(prevDiaper.startTime);
    const currTime = new Date(currDiaper.startTime);

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

/**
 * Calculate most common diaper type
 */
export function calculateMostCommonDiaperType(
  activities: Array<typeof Activities.$inferSelect>,
  timePeriod: StatTimePeriod,
): {
  value: string | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to diaper activities in the time period
  const diaperActivities = activities
    .filter((activity) => activity.type === 'diaper')
    .filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    })
    .map((activity) => getDiaperType(activity))
    .filter((type): type is 'wet' | 'dirty' | 'both' => type !== null);

  if (diaperActivities.length === 0) {
    return {
      formattedValue: '—',
      label: 'Most Common',
      value: null,
    };
  }

  // Count each type
  const typeCounts: Record<string, number> = {};
  for (const type of diaperActivities) {
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }

  // Find the most common type
  let mostCommonType = 'wet';
  let maxCount = 0;
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonType = type;
    }
  }

  return {
    formattedValue: getDiaperTypeLabel(mostCommonType),
    label: 'Most Common',
    value: mostCommonType,
  };
}
