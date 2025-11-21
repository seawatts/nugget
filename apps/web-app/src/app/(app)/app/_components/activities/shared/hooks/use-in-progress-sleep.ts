/**
 * Hook to check for in-progress sleep activity
 * Returns sleep data if found, null otherwise
 */

import { api } from '@nugget/api/react';
import { formatDistanceToNow } from 'date-fns';

interface UseInProgressSleepOptions {
  babyId?: string;
  enabled?: boolean;
}

export function useInProgressSleep({
  babyId,
  enabled = true,
}: UseInProgressSleepOptions) {
  const { data: baby } = api.babies.getMostRecent.useQuery(undefined, {
    enabled: enabled && !babyId,
  });

  const effectiveBabyId = babyId ?? baby?.id;

  const { data: inProgressSleep, isLoading } =
    api.activities.getInProgressActivity.useQuery(
      {
        activityType: 'sleep',
        babyId: effectiveBabyId ?? '',
      },
      {
        enabled: enabled && !!effectiveBabyId,
        // Poll every 30 seconds to keep duration fresh
        refetchInterval: 30000,
      },
    );

  // Calculate sleep duration if there's an in-progress sleep
  const sleepDuration = inProgressSleep?.startTime
    ? formatDistanceToNow(new Date(inProgressSleep.startTime), {
        addSuffix: false,
      })
    : null;

  const durationMinutes = inProgressSleep?.startTime
    ? Math.floor(
        (Date.now() - new Date(inProgressSleep.startTime).getTime()) /
          (1000 * 60),
      )
    : 0;

  return {
    durationMinutes,
    inProgressSleep: inProgressSleep ?? null,
    isLoading,
    sleepDuration,
  };
}
