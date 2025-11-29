/**
 * Pumping-specific stat calculation functions
 */

import type { Activities } from '@nugget/db/schema';
import { formatMinutesToHoursMinutes } from '../shared/time-formatting-utils';
import type {
  StatMetricType,
  StatPivotPeriod,
  StatTimePeriod,
} from '../shared/types';
import {
  calculateAverageAmountOverPeriod,
  calculateAverageDurationOverPeriod,
  calculateCountOverPeriod,
  calculateTotalAmountOverPeriod,
  getDateRangeForPeriod,
  normalizeValueByPivot,
} from '../shared/utils/stat-calculations';
import { formatVolumeDisplay } from '../shared/volume-utils';

/**
 * Calculate pumping stat based on metric, time period, and pivot period
 */
export function calculatePumpingStat(
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

  // Filter to pumping activities only
  const pumpingActivities = activities.filter(
    (activity) => activity.type === 'pumping',
  );

  let value: number | null = null;
  let formattedValue = '—';
  let label = '';

  switch (metric) {
    case 'count': {
      const count = calculateCountOverPeriod(
        pumpingActivities,
        startDate,
        endDate,
        ['pumping'],
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
      label = 'Pumping Sessions';
      break;
    }

    case 'total':
    case 'amount': {
      const totalMl = calculateTotalAmountOverPeriod(
        pumpingActivities,
        startDate,
        endDate,
        ['pumping'],
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
        pumpingActivities,
        startDate,
        endDate,
        ['pumping'],
      );
      value = avgMl;
      if (avgMl !== null) {
        formattedValue = formatVolumeDisplay(avgMl, unit, true);
      }
      label = 'Average Amount';
      break;
    }

    case 'duration': {
      const avgDuration = calculateAverageDurationOverPeriod(
        pumpingActivities,
        startDate,
        endDate,
        ['pumping'],
      );
      value = avgDuration;
      if (avgDuration !== null) {
        formattedValue = formatMinutesToHoursMinutes(avgDuration);
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
