'use client';

import type { Activities } from '@nugget/db/schema';
import { startOfWeek } from 'date-fns';
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
): WeeklyStats {
  return useMemo(() => {
    if (!babyAgeDays) {
      return { count: 0, goal: 0, percentage: 0 };
    }

    const goal = getGoalFn(babyAgeDays);
    const startOfWeekDate = startOfWeek(new Date(), { weekStartsOn: 0 });

    const count = activities.filter((activity) => {
      if (activity.type !== activityType) return false;
      return new Date(activity.startTime) >= startOfWeekDate;
    }).length;

    const percentage = goal > 0 ? Math.min((count / goal) * 100, 100) : 0;

    return { count, goal, percentage };
  }, [activities, activityType, babyAgeDays, getGoalFn]);
}
