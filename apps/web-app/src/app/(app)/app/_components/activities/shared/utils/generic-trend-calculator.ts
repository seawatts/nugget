import type { Activities } from '@nugget/db/schema';
import {
  endOfDay,
  format,
  startOfDay,
  subDays,
  subHours,
  subMonths,
  subWeeks,
} from 'date-fns';
import type { TrendData } from '../types';

/**
 * Generic trend data calculator for simple count-based activities
 * Works for any activity type that just needs to count occurrences
 */
export function calculateGenericTrendData(
  activities: Array<typeof Activities.$inferSelect>,
  activityType: string,
  timeRange: '24h' | '7d' | '2w' | '1m' | '3m' | '6m' = '7d',
): TrendData[] {
  const now = new Date();
  let startDate: Date;
  let points: number;
  let groupBy: 'hour' | 'day' | 'week';

  switch (timeRange) {
    case '24h':
      startDate = subHours(now, 24);
      points = 24;
      groupBy = 'hour';
      break;
    case '7d':
      startDate = startOfDay(subDays(now, 6));
      points = 7;
      groupBy = 'day';
      break;
    case '2w':
      startDate = startOfDay(subWeeks(now, 2));
      points = 14;
      groupBy = 'day';
      break;
    case '1m':
      startDate = startOfDay(subMonths(now, 1));
      points = 30;
      groupBy = 'day';
      break;
    case '3m':
      startDate = startOfDay(subMonths(now, 3));
      points = 12;
      groupBy = 'week';
      break;
    case '6m':
      startDate = startOfDay(subMonths(now, 6));
      points = 26;
      groupBy = 'week';
      break;
    default:
      startDate = startOfDay(subDays(now, 6));
      points = 7;
      groupBy = 'day';
  }

  // Filter activities to time range and activity type
  const relevantActivities = activities.filter(
    (activity) =>
      activity.type === activityType &&
      new Date(activity.startTime) >= startDate &&
      new Date(activity.startTime) <= now,
  );

  // Group by time period
  const trendData: TrendData[] = [];

  if (groupBy === 'hour') {
    for (let i = 0; i < points; i++) {
      const periodStart = subHours(now, points - i);
      const periodEnd = subHours(now, points - i - 1);

      const count = relevantActivities.filter((activity) => {
        const activityTime = new Date(activity.startTime);
        return activityTime >= periodEnd && activityTime < periodStart;
      }).length;

      trendData.push({
        count,
        date: format(periodStart, 'yyyy-MM-dd HH:mm'),
        displayDate: format(periodStart, 'ha'),
      });
    }
  } else {
    // Day or week grouping
    for (let i = 0; i < points; i++) {
      const periodStart =
        groupBy === 'day'
          ? startOfDay(subDays(now, points - i - 1))
          : startOfDay(subWeeks(now, points - i - 1));
      const periodEnd =
        groupBy === 'day'
          ? endOfDay(periodStart)
          : endOfDay(subDays(periodStart, -6));

      const count = relevantActivities.filter((activity) => {
        const activityTime = new Date(activity.startTime);
        return activityTime >= periodStart && activityTime <= periodEnd;
      }).length;

      trendData.push({
        count,
        date: format(periodStart, 'yyyy-MM-dd'),
        displayDate:
          groupBy === 'day'
            ? format(periodStart, 'MMM d')
            : `${format(periodStart, 'MMM d')}-${format(periodEnd, 'd')}`,
      });
    }
  }

  return trendData;
}
