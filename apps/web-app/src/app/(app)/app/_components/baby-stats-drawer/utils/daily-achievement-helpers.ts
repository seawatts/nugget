import type { Activities } from '@nugget/db/schema';
import { getHours, startOfDay } from 'date-fns';

/**
 * Helper functions for daily achievement calculations
 * All functions filter activities for today using local timezone
 */

/**
 * Filter activities for today using startOfDay (local timezone)
 */
export function getTodayActivities(
  activities: Array<typeof Activities.$inferSelect>,
): Array<typeof Activities.$inferSelect> {
  const todayStart = startOfDay(new Date());
  return activities.filter(
    (activity) => new Date(activity.startTime) >= todayStart,
  );
}

/**
 * Get count of activities logged today
 */
export function getActivityCountToday(
  activities: Array<typeof Activities.$inferSelect>,
): number {
  return getTodayActivities(activities).length;
}

/**
 * Check if all core activities (feeding, sleep, diaper) were logged today
 * Core activities are essential daily tracking activities
 */
export function hasCoreActivitiesToday(
  activities: Array<typeof Activities.$inferSelect>,
): boolean {
  const todayActivities = getTodayActivities(activities);

  const hasFeeding = todayActivities.some(
    (a) => a.type === 'bottle' || a.type === 'nursing' || a.type === 'feeding',
  );

  const hasSleep = todayActivities.some((a) => a.type === 'sleep');

  const hasDiaper = todayActivities.some(
    (a) =>
      a.type === 'diaper' ||
      a.type === 'wet' ||
      a.type === 'dirty' ||
      a.type === 'both',
  );

  return hasFeeding && hasSleep && hasDiaper;
}

/**
 * Filter activities logged before 7am (early bird)
 * Returns only activities from today that started before 7am
 */
export function getEarlyBirdActivities(
  activities: Array<typeof Activities.$inferSelect>,
): Array<typeof Activities.$inferSelect> {
  const todayActivities = getTodayActivities(activities);
  return todayActivities.filter((a) => {
    const hour = getHours(new Date(a.startTime));
    return hour < 7; // Before 7am
  });
}

/**
 * Filter activities logged after 10pm (night owl)
 * Returns only activities from today that started after 10pm
 */
export function getNightOwlActivities(
  activities: Array<typeof Activities.$inferSelect>,
): Array<typeof Activities.$inferSelect> {
  const todayActivities = getTodayActivities(activities);
  return todayActivities.filter((a) => {
    const hour = getHours(new Date(a.startTime));
    return hour >= 22; // 10pm or later (22:00)
  });
}

/**
 * Get the first activity of today (chronologically by startTime)
 */
export function getFirstActivityOfToday(
  activities: Array<typeof Activities.$inferSelect>,
): typeof Activities.$inferSelect | null {
  const todayActivities = getTodayActivities(activities);
  if (todayActivities.length === 0) return null;

  // Sort by startTime and return the first one
  const sorted = [...todayActivities].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  return sorted[0] ?? null;
}
