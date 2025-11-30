import type { Activities } from '@nugget/db/schema';
import { format, getDay, startOfDay } from 'date-fns';
import type { Patterns } from '../types';

/**
 * Calculate pattern recognition stats
 */
export function calculatePatterns(
  activities: Array<typeof Activities.$inferSelect>,
): Patterns {
  if (activities.length === 0) {
    return {
      feedingStyle: 'balanced',
      mostProductiveHour: 12,
      nightOwl: false,
      trackingAccuracy: 0,
      weekendWarrior: { weekday: 0, weekend: 0 },
    };
  }

  // Night owl vs early bird (most active hours)
  const hourCounts = new Map<number, number>();
  activities.forEach((activity) => {
    const hour = new Date(activity.startTime).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });

  let maxCount = 0;
  let mostProductiveHour = 12;
  hourCounts.forEach((count, hour) => {
    if (count > maxCount) {
      maxCount = count;
      mostProductiveHour = hour;
    }
  });

  const nightOwl = mostProductiveHour >= 20 || mostProductiveHour <= 4;

  // Weekend warrior
  let weekdayCount = 0;
  let weekendCount = 0;
  activities.forEach((activity) => {
    const day = getDay(new Date(activity.startTime));
    if (day === 0 || day === 6) {
      weekendCount++;
    } else {
      weekdayCount++;
    }
  });

  // Feeding style
  const bottleCount = activities.filter((a) => a.type === 'bottle').length;
  const nursingCount = activities.filter((a) => a.type === 'nursing').length;
  const feedingStyle =
    bottleCount > nursingCount * 1.5
      ? 'bottle'
      : nursingCount > bottleCount * 1.5
        ? 'nursing'
        : 'balanced';

  // Tracking accuracy (estimate based on activity frequency)
  const daysWithActivities = new Set(
    activities.map((a) =>
      format(startOfDay(new Date(a.startTime)), 'yyyy-MM-dd'),
    ),
  ).size;
  const estimatedDays = Math.min(
    daysWithActivities,
    Math.ceil(
      (Date.now() -
        new Date(activities[0]?.startTime ?? Date.now()).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
  const trackingAccuracy =
    estimatedDays > 0
      ? Math.min(100, Math.round((daysWithActivities / estimatedDays) * 100))
      : 0;

  return {
    feedingStyle,
    mostProductiveHour,
    nightOwl,
    trackingAccuracy,
    weekendWarrior: { weekday: weekdayCount, weekend: weekendCount },
  };
}
