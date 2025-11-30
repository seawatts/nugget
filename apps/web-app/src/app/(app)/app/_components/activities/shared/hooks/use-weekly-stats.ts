'use client';

import type { Activities } from '@nugget/db/schema';
import { format, startOfDay, subDays } from 'date-fns';
import { useMemo } from 'react';

export interface WeeklyStats {
  count: number;
  goal: number;
  percentage: number;
}

export function useWeeklyStats(
  activities: Array<typeof Activities.$inferSelect>,
  activityType: string,
  getGoalFn: (ageDays: number) => number,
  babyAgeDays: number | null,
  _weekStartDayPreference?: number | null,
): WeeklyStats {
  return useMemo(() => {
    if (!babyAgeDays) {
      return { count: 0, goal: 0, percentage: 0 };
    }

    const goal = getGoalFn(babyAgeDays);

    // Use the same 7-day range as useSevenDayActivities (last 7 days from today)
    // This ensures the count matches what's shown in the 7-day grid
    const now = new Date();
    const startOfDayNow = startOfDay(now);

    // Calculate the date range for the last 7 days (same as useSevenDayActivities)
    // This matches the date range shown in the 7-day grid
    const sevenDaysAgoDate = subDays(startOfDayNow, 6);
    const sevenDaysAgoKey = format(sevenDaysAgoDate, 'yyyy-MM-dd');
    const todayKey = format(startOfDayNow, 'yyyy-MM-dd');

    // Filter activities from the last 7 days (matching the 7-day grid display)
    // Use date string keys (yyyy-MM-dd) for comparison to match useSevenDayActivities
    const weekActivities = activities.filter((activity) => {
      if (activity.type !== activityType) return false;

      // Normalize activity date to start of day and format as date key
      const activityDate = startOfDay(new Date(activity.startTime));
      const activityKey = format(activityDate, 'yyyy-MM-dd');

      // Include activities from 7 days ago up to today (inclusive)
      // This matches the date range shown in the 7-day grid
      return activityKey >= sevenDaysAgoKey && activityKey <= todayKey;
    });

    // Count unique days - each day counts as 1 regardless of how many activities occurred that day
    // For example, nail trimming with both hands and feet on the same day counts as 1
    // The Set automatically deduplicates by date key, so multiple activities on the same day = 1 count
    const uniqueDays = new Set<string>();
    for (const activity of weekActivities) {
      const activityDate = startOfDay(new Date(activity.startTime));
      const dayKey = format(activityDate, 'yyyy-MM-dd');
      uniqueDays.add(dayKey); // Set automatically deduplicates - same day key = same day
    }

    const count = uniqueDays.size;

    const percentage = goal > 0 ? Math.min((count / goal) * 100, 100) : 0;

    return { count, goal, percentage };
  }, [activities, activityType, babyAgeDays, getGoalFn]);
}
