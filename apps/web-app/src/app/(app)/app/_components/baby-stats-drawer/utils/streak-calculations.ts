import type { Activities } from '@nugget/db/schema';
import { format, startOfDay } from 'date-fns';
import type { Streaks } from '../types';

/**
 * Calculate streaks for various activity types
 */
export function calculateStreaks(
  activities: Array<typeof Activities.$inferSelect>,
): Streaks {
  const now = new Date();
  const activitiesByDay = new Map<string, Set<string>>();

  // Group activities by day
  activities.forEach((activity) => {
    const day = format(startOfDay(new Date(activity.startTime)), 'yyyy-MM-dd');
    if (!activitiesByDay.has(day)) {
      activitiesByDay.set(day, new Set());
    }
    activitiesByDay.get(day)?.add(activity.type);
  });

  const days = Array.from(activitiesByDay.keys()).sort().reverse();
  if (days.length === 0) {
    return {
      diaper: { current: 0, longest: 0 },
      feeding: { current: 0, longest: 0 },
      perfectDay: { current: 0, longest: 0 },
      sleep: { current: 0, longest: 0 },
    };
  }

  // Helper to calculate streak
  const calculateStreak = (
    checkFn: (dayActivities: Set<string>) => boolean,
    startFromToday = true,
  ): number => {
    let streak = 0;
    const startDay = startFromToday
      ? format(startOfDay(now), 'yyyy-MM-dd')
      : (days[0] ?? '');
    const sortedDays = startFromToday
      ? [startDay, ...days.filter((d) => d < startDay)].sort().reverse()
      : days;

    for (const day of sortedDays) {
      const dayActivities = activitiesByDay.get(day);
      if (dayActivities && checkFn(dayActivities)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const hasFeeding = (dayActivities: Set<string>) =>
    dayActivities.has('bottle') ||
    dayActivities.has('nursing') ||
    dayActivities.has('feeding');
  const hasDiaper = (dayActivities: Set<string>) =>
    dayActivities.has('diaper') ||
    dayActivities.has('wet') ||
    dayActivities.has('dirty');
  const hasSleep = (dayActivities: Set<string>) => dayActivities.has('sleep');
  const hasPerfectDay = (dayActivities: Set<string>) =>
    hasFeeding(dayActivities) &&
    hasDiaper(dayActivities) &&
    hasSleep(dayActivities);

  return {
    diaper: {
      current: calculateStreak(hasDiaper, true),
      longest: calculateStreak(hasDiaper, false),
    },
    feeding: {
      current: calculateStreak(hasFeeding, true),
      longest: calculateStreak(hasFeeding, false),
    },
    perfectDay: {
      current: calculateStreak(hasPerfectDay, true),
      longest: calculateStreak(hasPerfectDay, false),
    },
    sleep: {
      current: calculateStreak(hasSleep, true),
      longest: calculateStreak(hasSleep, false),
    },
  };
}
