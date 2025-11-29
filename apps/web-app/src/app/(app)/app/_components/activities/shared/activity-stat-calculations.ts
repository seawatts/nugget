/**
 * Generic activity stat calculation functions for simple count-based activities
 * Used for: vitamin_d, nail_trimming, bath
 */

import type { Activities } from '@nugget/db/schema';
import type { StatMetricType, StatPivotPeriod, StatTimePeriod } from './types';
import {
  calculateCountOverPeriod,
  getDateRangeForPeriod,
  normalizeValueByPivot,
} from './utils/stat-calculations';

/**
 * Calculate simple count-based stat for activities
 */
export function calculateSimpleActivityStat(
  activities: Array<typeof Activities.$inferSelect>,
  activityType: string,
  metric: StatMetricType,
  timePeriod: StatTimePeriod,
  label: string,
  pivotPeriod: StatPivotPeriod = 'total',
): {
  value: number | null;
  formattedValue: string;
  label: string;
} {
  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

  // Filter to specific activity type
  const filteredActivities = activities.filter(
    (activity) => activity.type === activityType,
  );

  let value: number | null = null;
  let formattedValue = '—';

  switch (metric) {
    case 'count':
    case 'total': {
      const count = calculateCountOverPeriod(
        filteredActivities,
        startDate,
        endDate,
        [activityType],
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
      break;
    }

    default:
      value = null;
      formattedValue = '—';
  }

  return {
    formattedValue,
    label,
    value,
  };
}
