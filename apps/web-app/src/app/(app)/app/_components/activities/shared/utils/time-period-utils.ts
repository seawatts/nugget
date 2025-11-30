/**
 * Utility functions for determining night vs day time periods
 * Night: 6 PM (18:00) - 6 AM (06:00)
 * Day: 6 AM (06:00) - 6 PM (18:00)
 */

import type { Activities } from '@nugget/db/schema';
import { getHours } from 'date-fns';

/**
 * Check if a given date/time is during night hours
 * Night is defined as 6 PM (18:00) to 6 AM (06:00)
 */
export function isNightTime(date: Date): boolean {
  const hour = getHours(date);
  return hour >= 18 || hour < 6;
}

/**
 * Check if a given date/time is during day hours
 * Day is defined as 6 AM (06:00) to 6 PM (18:00)
 */
export function isDayTime(date: Date): boolean {
  return !isNightTime(date);
}

/**
 * Get the time period (night or day) for a given date
 */
export function getTimePeriod(date: Date): 'night' | 'day' {
  return isNightTime(date) ? 'night' : 'day';
}

/**
 * Filter activities by time period (night, day, or all)
 * Uses the activity's startTime to determine the period
 */
export function filterActivitiesByTimePeriod(
  activities: Array<typeof Activities.$inferSelect>,
  period: 'night' | 'day' | 'all',
): Array<typeof Activities.$inferSelect> {
  if (period === 'all') {
    return activities;
  }

  return activities.filter((activity) => {
    const activityDate = new Date(activity.startTime);
    const activityPeriod = getTimePeriod(activityDate);
    return activityPeriod === period;
  });
}
