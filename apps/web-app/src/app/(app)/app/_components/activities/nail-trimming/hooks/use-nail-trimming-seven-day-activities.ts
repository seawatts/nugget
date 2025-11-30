'use client';

import type { Activities } from '@nugget/db/schema';
import { format, startOfDay, subDays } from 'date-fns';
import { useMemo } from 'react';

export interface NailTrimmingDayActivity {
  date: string;
  dateObj: Date;
  displayDate: string;
  isToday: boolean;
  hasHandsActivity: boolean;
  hasFeetActivity: boolean;
  handsActivity?: typeof Activities.$inferSelect;
  feetActivity?: typeof Activities.$inferSelect;
}

export function useNailTrimmingSevenDayActivities(
  allActivities: Array<typeof Activities.$inferSelect>,
): NailTrimmingDayActivity[] {
  return useMemo(() => {
    const startOfDayNow = startOfDay(new Date());
    const days: NailTrimmingDayActivity[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(startOfDayNow, i);
      const dateKey = format(date, 'yyyy-MM-dd');

      // Find all nail trimming activities for this day
      const dayActivities = allActivities.filter((activity) => {
        if (activity.type !== 'nail_trimming') return false;
        const activityDate = startOfDay(new Date(activity.startTime));
        const activityKey = format(activityDate, 'yyyy-MM-dd');
        return activityKey === dateKey;
      });

      // Find activities by location
      let handsActivity: typeof Activities.$inferSelect | undefined;
      let feetActivity: typeof Activities.$inferSelect | undefined;

      for (const activity of dayActivities) {
        const details = activity.details as {
          location?: 'hands' | 'feet' | 'both';
        } | null;
        const location = details?.location;

        if ((location === 'hands' || location === 'both') && !handsActivity) {
          handsActivity = activity;
        }
        if ((location === 'feet' || location === 'both') && !feetActivity) {
          feetActivity = activity;
        }
        // If location is not specified, we might want to show it as both
        // For now, we'll only show it if location is explicitly set
      }

      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;
      const isToday = i === 0;

      days.push({
        date: dateKey,
        dateObj: date,
        displayDate: `${dayName} ${monthDay}`,
        feetActivity,
        handsActivity,
        hasFeetActivity: !!feetActivity,
        hasHandsActivity: !!handsActivity,
        isToday,
      });
    }

    return days;
  }, [allActivities]);
}
