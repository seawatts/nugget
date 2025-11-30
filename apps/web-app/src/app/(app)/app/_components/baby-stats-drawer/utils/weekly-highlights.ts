import type { Activities } from '@nugget/db/schema';
import { format, startOfDay } from 'date-fns';
import type { WeeklyHighlights } from '../types';

/**
 * Calculate weekly highlights
 */
export function calculateWeeklyHighlights(
  _activities: Array<typeof Activities.$inferSelect>,
  weekActivities: Array<typeof Activities.$inferSelect>,
  previousWeekActivities: Array<typeof Activities.$inferSelect>,
): WeeklyHighlights {
  if (weekActivities.length === 0) {
    return {
      bestDay: null,
      feedingTrend: null,
      improvementMessage: null,
      newRecords: [],
    };
  }

  // Find best day
  const activitiesByDay = new Map<string, number>();
  weekActivities.forEach((activity) => {
    const day = format(startOfDay(new Date(activity.startTime)), 'yyyy-MM-dd');
    activitiesByDay.set(day, (activitiesByDay.get(day) || 0) + 1);
  });

  let maxCount = 0;
  let bestDayDate: string | null = null;
  activitiesByDay.forEach((count, day) => {
    if (count > maxCount) {
      maxCount = count;
      bestDayDate = day;
    }
  });

  // Calculate feeding trend
  const weekFeedings = weekActivities.filter(
    (a) => a.type === 'bottle' || a.type === 'nursing' || a.type === 'feeding',
  ).length;
  const prevWeekFeedings = previousWeekActivities.filter(
    (a) => a.type === 'bottle' || a.type === 'nursing' || a.type === 'feeding',
  ).length;
  const feedingTrend =
    prevWeekFeedings > 0
      ? ((weekFeedings - prevWeekFeedings) / prevWeekFeedings) * 100
      : null;

  // Generate improvement message
  let improvementMessage: string | null = null;
  if (feedingTrend !== null) {
    if (feedingTrend > 15) {
      improvementMessage = `Feeding ${Math.round(feedingTrend)}% more this week! 🎉`;
    } else if (feedingTrend < -15) {
      improvementMessage = `Feeding ${Math.round(Math.abs(feedingTrend))}% less this week`;
    } else if (feedingTrend > 0) {
      improvementMessage = `Feeding ${Math.round(feedingTrend)}% more this week! 📈`;
    }
  }

  // Check for new records (simplified - could be more sophisticated)
  const newRecords: Array<string> = [];
  if (weekFeedings > prevWeekFeedings && prevWeekFeedings > 0) {
    newRecords.push('Most feedings in a week!');
  }

  return {
    bestDay:
      bestDayDate && maxCount > 0
        ? { count: maxCount, date: new Date(bestDayDate) }
        : null,
    feedingTrend,
    improvementMessage,
    newRecords,
  };
}
