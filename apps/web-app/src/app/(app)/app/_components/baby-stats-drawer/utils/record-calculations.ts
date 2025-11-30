import type { Activities } from '@nugget/db/schema';
import { format, startOfDay } from 'date-fns';
import type { Records } from '../types';

/**
 * Calculate records and personal bests
 */
export function calculateRecords(
  activities: Array<typeof Activities.$inferSelect>,
): Records {
  if (activities.length === 0) {
    return {
      fastestFeeding: null,
      longestGap: null,
      longestSleep: null,
      mostActiveDay: null,
      mostFeedingsInDay: null,
    };
  }

  // Longest sleep
  const sleepActivities = activities
    .filter((a) => a.type === 'sleep' && a.duration)
    .sort((a, b) => (b.duration || 0) - (a.duration || 0));
  const longestSleep = sleepActivities[0]?.duration
    ? {
        date: new Date(sleepActivities[0].startTime),
        duration: sleepActivities[0].duration,
      }
    : null;

  // Most feedings in a day
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

  // Most active day
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

  // Fastest feeding (shortest time between feedings)
  const feedingTimes = activities
    .filter(
      (a) =>
        a.type === 'bottle' || a.type === 'nursing' || a.type === 'feeding',
    )
    .map((a) => new Date(a.startTime).getTime())
    .sort((a, b) => a - b);

  let minGap = Number.POSITIVE_INFINITY;
  let minGapDate: Date | null = null;
  for (let i = 1; i < feedingTimes.length; i++) {
    const current = feedingTimes[i];
    const previous = feedingTimes[i - 1];
    if (current !== undefined && previous !== undefined) {
      const gap = (current - previous) / (1000 * 60);
      if (gap < minGap && gap > 0) {
        minGap = gap;
        minGapDate = new Date(current);
      }
    }
  }

  // Longest gap between any activities
  const allTimes = activities
    .map((a) => new Date(a.startTime).getTime())
    .sort((a, b) => a - b);

  let maxGap = 0;
  let maxGapDate: Date | null = null;
  for (let i = 1; i < allTimes.length; i++) {
    const current = allTimes[i];
    const previous = allTimes[i - 1];
    if (current !== undefined && previous !== undefined) {
      const gap = (current - previous) / (1000 * 60 * 60);
      if (gap > maxGap) {
        maxGap = gap;
        maxGapDate = new Date(current);
      }
    }
  }

  return {
    fastestFeeding:
      minGapDate && minGap < Number.POSITIVE_INFINITY
        ? { date: minGapDate, minutes: Math.round(minGap) }
        : null,
    longestGap:
      maxGapDate && maxGap > 0
        ? { date: maxGapDate, hours: Math.round(maxGap * 10) / 10 }
        : null,
    longestSleep,
    mostActiveDay:
      maxActivitiesDay && maxActivities > 0
        ? { count: maxActivities, date: new Date(maxActivitiesDay) }
        : null,
    mostFeedingsInDay:
      maxFeedingsDay && maxFeedings > 0
        ? { count: maxFeedings, date: new Date(maxFeedingsDay) }
        : null,
  };
}
