'use client';

import type { Activities } from '@nugget/db/schema';
import { format, startOfDay, subDays } from 'date-fns';
import { useMemo } from 'react';

export interface SevenDayActivity {
  date: string;
  dateObj: Date;
  displayDate: string;
  hasActivity: boolean;
  isToday: boolean;
  activity?: typeof Activities.$inferSelect;
}

export function useSevenDayActivities(
  allActivities: Array<typeof Activities.$inferSelect>,
  activityType: string,
): SevenDayActivity[] {
  return useMemo(() => {
    const startOfDayNow = startOfDay(new Date());
    const days: SevenDayActivity[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(startOfDayNow, i);
      const dateKey = format(date, 'yyyy-MM-dd');

      // Find activity for this day
      const dayActivity = allActivities.find((activity) => {
        if (activity.type !== activityType) return false;
        const activityDate = startOfDay(new Date(activity.startTime));
        const activityKey = format(activityDate, 'yyyy-MM-dd');
        return activityKey === dateKey;
      });

      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;
      const isToday = i === 0; // Last day in the loop (today)

      days.push({
        activity: dayActivity,
        date: dateKey,
        dateObj: date,
        displayDate: `${dayName} ${monthDay}`,
        hasActivity: !!dayActivity,
        isToday,
      });
    }

    return days;
  }, [allActivities, activityType]);
}
