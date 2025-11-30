import type { Activities } from '@nugget/db/schema';
import {
  differenceInDays,
  format,
  getDay,
  getHours,
  startOfDay,
} from 'date-fns';

/**
 * Helper functions for calculating activity-specific metrics for achievements
 */

export interface ActivityCounts {
  bath: number;
  contrastTime: number;
  doctorVisit: number;
  nailTrimming: number;
  pumping: number;
  solids: number;
  tummyTime: number;
  vitaminD: number;
  strollerWalk: number;
}

/**
 * Count activities by type
 */
export function getActivityCounts(
  activities: Array<typeof Activities.$inferSelect>,
): ActivityCounts {
  return {
    bath: activities.filter((a) => a.type === 'bath').length,
    contrastTime: activities.filter((a) => a.type === 'contrast_time').length,
    doctorVisit: activities.filter((a) => a.type === 'doctor_visit').length,
    nailTrimming: activities.filter((a) => a.type === 'nail_trimming').length,
    pumping: activities.filter((a) => a.type === 'pumping').length,
    solids: activities.filter((a) => a.type === 'solids').length,
    strollerWalk: activities.filter((a) => a.type === 'stroller_walk').length,
    tummyTime: activities.filter((a) => a.type === 'tummy_time').length,
    vitaminD: activities.filter((a) => a.type === 'vitamin_d').length,
  };
}

/**
 * Calculate total sleep hours
 */
export function getTotalSleepHours(
  activities: Array<typeof Activities.$inferSelect>,
): number {
  const sleepActivities = activities.filter(
    (a) => a.type === 'sleep' && a.duration && a.duration > 0,
  );
  const totalMinutes = sleepActivities.reduce(
    (sum, a) => sum + (a.duration || 0),
    0,
  );
  return totalMinutes / 60;
}

/**
 * Check if user logs activities after midnight (night owl)
 */
export function getNightOwlActivities(
  activities: Array<typeof Activities.$inferSelect>,
): boolean {
  return activities.some((a) => {
    const hour = getHours(new Date(a.startTime));
    return hour >= 0 && hour < 6;
  });
}

/**
 * Check if user logs activities early in the morning (early bird)
 */
export function getEarlyBirdActivities(
  activities: Array<typeof Activities.$inferSelect>,
): boolean {
  return activities.some((a) => {
    const hour = getHours(new Date(a.startTime));
    return hour >= 5 && hour < 7;
  });
}

/**
 * Count activities logged on weekends
 */
export function getWeekendActivityCount(
  activities: Array<typeof Activities.$inferSelect>,
): number {
  return activities.filter((a) => {
    const day = getDay(new Date(a.startTime));
    return day === 0 || day === 6; // Sunday or Saturday
  }).length;
}

/**
 * Check if activities were logged quickly (within 5 minutes of occurrence)
 * This is a simplified check - we assume activities logged within 5 minutes of each other
 * in the same hour are "quick logs"
 */
export function getQuickLogCount(
  activities: Array<typeof Activities.$inferSelect>,
): number {
  // Sort activities by time
  const sorted = [...activities].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  let quickLogs = 0;
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = sorted[i - 1];
    if (current && previous) {
      const timeDiff =
        (new Date(current.startTime).getTime() -
          new Date(current.createdAt || current.startTime).getTime()) /
        (1000 * 60); // minutes
      if (timeDiff <= 5 && timeDiff >= 0) {
        quickLogs++;
      }
    }
  }

  return quickLogs;
}

/**
 * Count activities with notes
 */
export function getActivitiesWithNotesCount(
  activities: Array<typeof Activities.$inferSelect>,
): number {
  return activities.filter((a) => a.notes && a.notes.trim().length > 0).length;
}

/**
 * Get longest sleep duration
 */
export function getLongestSleep(
  activities: Array<typeof Activities.$inferSelect>,
): { duration: number; date: Date } | null {
  const sleepActivities = activities
    .filter((a) => a.type === 'sleep' && a.duration && a.duration > 0)
    .sort((a, b) => (b.duration || 0) - (a.duration || 0));

  if (sleepActivities.length === 0) return null;

  const longest = sleepActivities[0];
  if (!longest || !longest.duration) return null;

  return {
    date: new Date(longest.startTime),
    duration: longest.duration,
  };
}

/**
 * Get most feedings in a single day
 */
export function getMostFeedingsInDay(
  activities: Array<typeof Activities.$inferSelect>,
): { count: number; date: Date } | null {
  const feedingsByDay = new Map<string, number>();
  activities
    .filter(
      (a) =>
        a.type === 'bottle' || a.type === 'nursing' || a.type === 'feeding',
    )
    .forEach((activity) => {
      const day = format(
        startOfDay(new Date(activity.startTime)),
        'yyyy-MM-dd',
      );
      feedingsByDay.set(day, (feedingsByDay.get(day) || 0) + 1);
    });

  let maxFeedings = 0;
  let maxFeedingsDay: string | null = null;
  feedingsByDay.forEach((count, day) => {
    if (count > maxFeedings) {
      maxFeedings = count;
      maxFeedingsDay = day;
    }
  });

  if (!maxFeedingsDay || maxFeedings === 0) return null;

  return {
    count: maxFeedings,
    date: new Date(maxFeedingsDay),
  };
}

/**
 * Get most activities in a single day
 */
export function getMostActiveDay(
  activities: Array<typeof Activities.$inferSelect>,
): { count: number; date: Date } | null {
  const activitiesByDay = new Map<string, number>();
  activities.forEach((activity) => {
    const day = format(startOfDay(new Date(activity.startTime)), 'yyyy-MM-dd');
    activitiesByDay.set(day, (activitiesByDay.get(day) || 0) + 1);
  });

  let maxActivities = 0;
  let maxActivitiesDay: string | null = null;
  activitiesByDay.forEach((count, day) => {
    if (count > maxActivities) {
      maxActivities = count;
      maxActivitiesDay = day;
    }
  });

  if (!maxActivitiesDay || maxActivities === 0) return null;

  return {
    count: maxActivities,
    date: new Date(maxActivitiesDay),
  };
}

/**
 * Count night sleep sessions (6 PM - 6 AM)
 */
export function getNightSleepCount(
  activities: Array<typeof Activities.$inferSelect>,
): number {
  return activities.filter((a) => {
    if (a.type !== 'sleep' || !a.duration || a.duration === 0) return false;
    const hour = getHours(new Date(a.startTime));
    return hour >= 18 || hour < 6;
  }).length;
}

/**
 * Count day sleep sessions (6 AM - 6 PM)
 */
export function getDaySleepCount(
  activities: Array<typeof Activities.$inferSelect>,
): number {
  return activities.filter((a) => {
    if (a.type !== 'sleep' || !a.duration || a.duration === 0) return false;
    const hour = getHours(new Date(a.startTime));
    return hour >= 6 && hour < 18;
  }).length;
}

/**
 * Check if multiple activity types were logged in same hour
 */
export function getMultiTaskerHours(
  activities: Array<typeof Activities.$inferSelect>,
): number {
  const activitiesByHour = new Map<string, Set<string>>();
  activities.forEach((a) => {
    const hourKey = format(new Date(a.startTime), 'yyyy-MM-dd-HH');
    if (!activitiesByHour.has(hourKey)) {
      activitiesByHour.set(hourKey, new Set());
    }
    activitiesByHour.get(hourKey)?.add(a.type);
  });

  let multiTaskHours = 0;
  activitiesByHour.forEach((types) => {
    if (types.size >= 3) {
      multiTaskHours++;
    }
  });

  return multiTaskHours;
}

/**
 * Get first activity date
 */
export function getFirstActivityDate(
  activities: Array<typeof Activities.$inferSelect>,
): Date | null {
  if (activities.length === 0) return null;
  const sorted = [...activities].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
  return sorted[0] ? new Date(sorted[0].startTime) : null;
}

/**
 * Check if user has logged specific activity types
 */
export function hasLoggedActivityType(
  activities: Array<typeof Activities.$inferSelect>,
  type: string,
): boolean {
  return activities.some((a) => a.type === type);
}

/**
 * Get consecutive tracking days (days with at least one activity)
 */
export function getConsecutiveTrackingDays(
  activities: Array<typeof Activities.$inferSelect>,
): number {
  if (activities.length === 0) return 0;

  const uniqueDays = new Set<string>();
  activities.forEach((a) => {
    const day = format(startOfDay(new Date(a.startTime)), 'yyyy-MM-dd');
    uniqueDays.add(day);
  });

  const sortedDays = Array.from(uniqueDays).sort();
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');

  // Check from today backwards
  let consecutive = 0;
  const checkDate = new Date(today);
  while (sortedDays.includes(format(checkDate, 'yyyy-MM-dd'))) {
    consecutive++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return consecutive;
}

/**
 * Count nights with late-night activities (sleep deprivation indicator)
 * Activities logged between 10 PM - 6 AM
 */
export function getNightsWithLateActivities(
  activities: Array<typeof Activities.$inferSelect>,
): number {
  const nightsWithActivity = new Set<string>();
  activities.forEach((a) => {
    const hour = getHours(new Date(a.startTime));
    // Late night: 10 PM - 6 AM (22-23, 0-5)
    if (hour >= 22 || hour < 6) {
      const day = format(startOfDay(new Date(a.startTime)), 'yyyy-MM-dd');
      nightsWithActivity.add(day);
    }
  });
  return nightsWithActivity.size;
}

/**
 * Count activities logged during sleep deprivation hours (midnight - 6 AM)
 */
export function getSleepDeprivationActivityCount(
  activities: Array<typeof Activities.$inferSelect>,
): number {
  return activities.filter((a) => {
    const hour = getHours(new Date(a.startTime));
    return hour >= 0 && hour < 6;
  }).length;
}

/**
 * Count nights with multiple wake-ups (feedings or diaper changes between 10 PM - 6 AM)
 */
export function getNightsWithMultipleWakeups(
  activities: Array<typeof Activities.$inferSelect>,
): number {
  const wakeupsByNight = new Map<string, number>();
  activities.forEach((a) => {
    // Count feedings and diaper changes during night hours
    const isWakeupActivity =
      a.type === 'bottle' ||
      a.type === 'nursing' ||
      a.type === 'feeding' ||
      a.type === 'diaper' ||
      a.type === 'wet' ||
      a.type === 'dirty';

    if (isWakeupActivity) {
      const hour = getHours(new Date(a.startTime));
      if (hour >= 22 || hour < 6) {
        const day = format(startOfDay(new Date(a.startTime)), 'yyyy-MM-dd');
        wakeupsByNight.set(day, (wakeupsByNight.get(day) || 0) + 1);
      }
    }
  });

  let nightsWithMultiple = 0;
  wakeupsByNight.forEach((count) => {
    if (count >= 2) {
      nightsWithMultiple++;
    }
  });

  return nightsWithMultiple;
}

/**
 * Calculate days survived since first activity
 */
export function getDaysSurvived(
  activities: Array<typeof Activities.$inferSelect>,
): number {
  const firstDate = getFirstActivityDate(activities);
  if (!firstDate) return 0;
  return differenceInDays(new Date(), firstDate);
}

/**
 * Check if this is a "first time" for various parent experiences
 */
export interface ParentFirsts {
  firstDiaperChange: boolean;
  firstFeeding: boolean;
  firstNightWakeup: boolean;
  firstWeekSurvived: boolean;
  firstMonthSurvived: boolean;
}

export function getParentFirsts(
  activities: Array<typeof Activities.$inferSelect>,
  daysSurvived: number,
): ParentFirsts {
  const hasDiaper =
    hasLoggedActivityType(activities, 'diaper') ||
    hasLoggedActivityType(activities, 'wet') ||
    hasLoggedActivityType(activities, 'dirty');
  const hasFeeding =
    hasLoggedActivityType(activities, 'bottle') ||
    hasLoggedActivityType(activities, 'nursing') ||
    hasLoggedActivityType(activities, 'feeding');

  const hasNightWakeup = activities.some((a) => {
    if (
      a.type !== 'bottle' &&
      a.type !== 'nursing' &&
      a.type !== 'feeding' &&
      a.type !== 'diaper' &&
      a.type !== 'wet' &&
      a.type !== 'dirty'
    ) {
      return false;
    }
    const hour = getHours(new Date(a.startTime));
    return hour >= 22 || hour < 6;
  });

  return {
    firstDiaperChange: hasDiaper,
    firstFeeding: hasFeeding,
    firstMonthSurvived: daysSurvived >= 30,
    firstNightWakeup: hasNightWakeup,
    firstWeekSurvived: daysSurvived >= 7,
  };
}
