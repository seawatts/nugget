/**
 * Generic stat calculation utilities for time periods
 * Provides functions to calculate various metrics over date ranges
 */

import type { Activities } from '@nugget/db/schema';
import { format, startOfWeek, subMonths, subWeeks } from 'date-fns';

/**
 * Filter activities by date range
 */
function filterActivitiesByDateRange(
  activities: Array<typeof Activities.$inferSelect>,
  startDate: Date,
  endDate: Date,
): Array<typeof Activities.$inferSelect> {
  return activities.filter((activity) => {
    const activityDate = new Date(activity.startTime);
    return activityDate >= startDate && activityDate <= endDate;
  });
}

/**
 * Filter activities by type
 */
function filterActivitiesByType(
  activities: Array<typeof Activities.$inferSelect>,
  activityTypes: string[],
): Array<typeof Activities.$inferSelect> {
  return activities.filter((activity) => activityTypes.includes(activity.type));
}

/**
 * Calculate date range for a time period
 */
export function getDateRangeForPeriod(
  period:
    | 'this_week'
    | 'last_week'
    | 'last_2_weeks'
    | 'last_month'
    | 'last_3_months'
    | 'last_6_months',
): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  let startDate: Date;

  switch (period) {
    case 'this_week': {
      // Start of current week (Monday) to now
      const weekStart = startOfWeek(endDate, { weekStartsOn: 1 });
      weekStart.setHours(0, 0, 0, 0);
      startDate = weekStart;
      break;
    }
    case 'last_week': {
      // Start of last week (Monday) to end of last week (Sunday)
      const lastWeekEnd = subWeeks(endDate, 1);
      const lastWeekStart = startOfWeek(lastWeekEnd, { weekStartsOn: 1 });
      lastWeekStart.setHours(0, 0, 0, 0);
      startDate = lastWeekStart;
      // End date should be end of last week (Sunday 23:59:59)
      const lastWeekEndDate = new Date(lastWeekStart);
      lastWeekEndDate.setDate(lastWeekStart.getDate() + 6);
      lastWeekEndDate.setHours(23, 59, 59, 999);
      return { endDate: lastWeekEndDate, startDate };
    }
    case 'last_2_weeks':
      startDate = subWeeks(endDate, 2);
      break;
    case 'last_month':
      startDate = subMonths(endDate, 1);
      break;
    case 'last_3_months':
      startDate = subMonths(endDate, 3);
      break;
    case 'last_6_months':
      startDate = subMonths(endDate, 6);
      break;
    default:
      startDate = subWeeks(endDate, 1);
  }

  return { endDate, startDate };
}

/**
 * Format date range label for a time period
 * Returns string like "Nov 20 - Dec 1"
 */
export function getDateRangeLabelForPeriod(
  period:
    | 'this_week'
    | 'last_week'
    | 'last_2_weeks'
    | 'last_month'
    | 'last_3_months'
    | 'last_6_months',
): string {
  const { startDate, endDate } = getDateRangeForPeriod(period);
  return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`;
}

/**
 * Normalize a value based on pivot period and time period
 * Returns the value divided by the appropriate unit
 */
export function normalizeValueByPivot(
  value: number | null,
  pivotPeriod: 'total' | 'per_day' | 'per_week' | 'per_month' | 'per_hour',
  timePeriod:
    | 'this_week'
    | 'last_week'
    | 'last_2_weeks'
    | 'last_month'
    | 'last_3_months'
    | 'last_6_months',
): number | null {
  if (value === null || pivotPeriod === 'total') {
    return value;
  }

  const { startDate, endDate } = getDateRangeForPeriod(timePeriod);
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const hoursDiff =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  const weeksDiff = daysDiff / 7;
  const monthsDiff = daysDiff / 30;

  switch (pivotPeriod) {
    case 'per_day':
      return daysDiff > 0 ? value / daysDiff : value;
    case 'per_week':
      return weeksDiff > 0 ? value / weeksDiff : value;
    case 'per_month':
      return monthsDiff > 0 ? value / monthsDiff : value;
    case 'per_hour':
      return hoursDiff > 0 ? value / hoursDiff : value;
    default:
      return value;
  }
}

/**
 * Calculate count of activities over a time period
 */
export function calculateCountOverPeriod(
  activities: Array<typeof Activities.$inferSelect>,
  startDate: Date,
  endDate: Date,
  activityTypes?: string[],
): number {
  let filtered = filterActivitiesByDateRange(activities, startDate, endDate);

  if (activityTypes && activityTypes.length > 0) {
    filtered = filterActivitiesByType(filtered, activityTypes);
  }

  return filtered.length;
}

/**
 * Calculate total amount (in ml) over a time period
 */
export function calculateTotalAmountOverPeriod(
  activities: Array<typeof Activities.$inferSelect>,
  startDate: Date,
  endDate: Date,
  activityTypes?: string[],
): number {
  let filtered = filterActivitiesByDateRange(activities, startDate, endDate);

  if (activityTypes && activityTypes.length > 0) {
    filtered = filterActivitiesByType(filtered, activityTypes);
  }

  return filtered.reduce((sum, activity) => {
    return sum + (activity.amountMl || 0);
  }, 0);
}

/**
 * Calculate average amount (in ml) over a time period
 */
export function calculateAverageAmountOverPeriod(
  activities: Array<typeof Activities.$inferSelect>,
  startDate: Date,
  endDate: Date,
  activityTypes?: string[],
): number | null {
  let filtered = filterActivitiesByDateRange(activities, startDate, endDate);

  if (activityTypes && activityTypes.length > 0) {
    filtered = filterActivitiesByType(filtered, activityTypes);
  }

  const activitiesWithAmount = filtered.filter(
    (activity) => activity.amountMl && activity.amountMl > 0,
  );

  if (activitiesWithAmount.length === 0) {
    return null;
  }

  const total = activitiesWithAmount.reduce(
    (sum, activity) => sum + (activity.amountMl || 0),
    0,
  );

  return total / activitiesWithAmount.length;
}

/**
 * Calculate total duration (in minutes) over a time period
 */
export function calculateTotalDurationOverPeriod(
  activities: Array<typeof Activities.$inferSelect>,
  startDate: Date,
  endDate: Date,
  activityTypes?: string[],
): number {
  let filtered = filterActivitiesByDateRange(activities, startDate, endDate);

  if (activityTypes && activityTypes.length > 0) {
    filtered = filterActivitiesByType(filtered, activityTypes);
  }

  return filtered.reduce((sum, activity) => {
    return sum + (activity.duration || 0);
  }, 0);
}

/**
 * Calculate average duration (in minutes) over a time period
 */
export function calculateAverageDurationOverPeriod(
  activities: Array<typeof Activities.$inferSelect>,
  startDate: Date,
  endDate: Date,
  activityTypes?: string[],
): number | null {
  let filtered = filterActivitiesByDateRange(activities, startDate, endDate);

  if (activityTypes && activityTypes.length > 0) {
    filtered = filterActivitiesByType(filtered, activityTypes);
  }

  const activitiesWithDuration = filtered.filter(
    (activity) => activity.duration && activity.duration > 0,
  );

  if (activitiesWithDuration.length === 0) {
    return null;
  }

  const total = activitiesWithDuration.reduce(
    (sum, activity) => sum + (activity.duration || 0),
    0,
  );

  return total / activitiesWithDuration.length;
}
