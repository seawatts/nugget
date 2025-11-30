import type { Activities } from '@nugget/db/schema';
import { format, startOfDay, subDays } from 'date-fns';
import type { FunStats, HumorousStats } from '../types';

/**
 * Calculate fun stats
 */
export function calculateFunStats(
  activities: Array<typeof Activities.$inferSelect>,
): FunStats | null {
  if (activities.length === 0) {
    return null;
  }

  // Total activities logged
  const totalActivities = activities.length;

  // Days since first activity
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
  const firstActivity = sortedActivities[0];
  const daysSinceFirst = firstActivity
    ? Math.floor(
        (Date.now() - new Date(firstActivity.startTime).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  // Most active day
  const activitiesByDay = new Map<string, number>();
  activities.forEach((activity) => {
    const day = format(new Date(activity.startTime), 'yyyy-MM-dd');
    activitiesByDay.set(day, (activitiesByDay.get(day) || 0) + 1);
  });
  let maxCount = 0;
  let mostActiveDay: string | null = null;
  activitiesByDay.forEach((count, day) => {
    if (count > maxCount) {
      maxCount = count;
      mostActiveDay = day;
    }
  });

  // Average activities per day (last 7 days)
  const last7Days = activities.filter(
    (a) => new Date(a.startTime) >= startOfDay(subDays(new Date(), 7)),
  );
  const avgPerDay7d = last7Days.length / 7;

  // Average activities per day (last 30 days)
  const last30Days = activities.filter(
    (a) => new Date(a.startTime) >= startOfDay(subDays(new Date(), 30)),
  );
  const avgPerDay30d = last30Days.length / 30;

  // Total volume fed (all time)
  const feedingActivities = activities.filter(
    (a) =>
      (a.type === 'bottle' || a.type === 'nursing' || a.type === 'feeding') &&
      a.amountMl,
  );
  const totalVolumeMl = feedingActivities.reduce(
    (sum, a) => sum + (a.amountMl || 0),
    0,
  );

  // Total diapers changed (all time)
  const totalDiapers = activities.filter(
    (a) =>
      a.type === 'diaper' ||
      a.type === 'wet' ||
      a.type === 'dirty' ||
      a.type === 'both',
  ).length;

  return {
    avgPerDay7d,
    avgPerDay30d,
    daysSinceFirst,
    mostActiveDay,
    mostActiveDayCount: maxCount,
    totalActivities,
    totalDiapers,
    totalVolumeMl,
  };
}

/**
 * Calculate humorous stats
 */
export function calculateHumorousStats(
  activities: Array<typeof Activities.$inferSelect>,
): HumorousStats | null {
  const diaperActivities = activities.filter(
    (a) =>
      a.type === 'diaper' ||
      a.type === 'wet' ||
      a.type === 'dirty' ||
      a.type === 'both',
  );
  if (diaperActivities.length < 2) return null;

  // Average time between diaper changes
  const diaperTimes = diaperActivities
    .map((a) => new Date(a.startTime).getTime())
    .sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < diaperTimes.length; i++) {
    const current = diaperTimes[i];
    const previous = diaperTimes[i - 1];
    if (current !== undefined && previous !== undefined) {
      gaps.push((current - previous) / (1000 * 60));
    }
  }
  const avgDiaperGap =
    gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;

  // Most activities in one hour
  const activitiesByHour = new Map<string, number>();
  activities.forEach((activity) => {
    const hour = format(new Date(activity.startTime), 'yyyy-MM-dd-HH');
    activitiesByHour.set(hour, (activitiesByHour.get(hour) || 0) + 1);
  });
  let maxInHour = 0;
  activitiesByHour.forEach((count) => {
    if (count > maxInHour) maxInHour = count;
  });

  // Sleep efficiency
  const firstActivity = activities[0];
  const totalTime =
    activities.length > 0 && firstActivity
      ? (Date.now() -
          new Date(
            activities.reduce(
              (earliest, a) =>
                new Date(a.startTime) < new Date(earliest.startTime)
                  ? a
                  : earliest,
              firstActivity,
            ).startTime,
          ).getTime()) /
        (1000 * 60 * 60)
      : 0;
  const totalSleepHours = activities
    .filter((a) => a.type === 'sleep' && a.duration)
    .reduce((sum, a) => sum + (a.duration || 0) / 60, 0);
  const sleepEfficiency =
    totalTime > 0 ? (totalSleepHours / totalTime) * 100 : 0;

  return {
    avgDiaperGap: Math.round(avgDiaperGap),
    maxInHour,
    sleepEfficiency: Math.round(sleepEfficiency * 10) / 10,
  };
}
