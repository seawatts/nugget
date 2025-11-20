'use client';

import { useCallback } from 'react';
import { useActivityMutations } from '../../use-activity-mutations';
import type { FeedingFormData } from '../feeding-type-selector';

interface UseFeedingTimerProps {
  setStartTime: (time: Date) => void;
  setDuration: (duration: number) => void;
  setActiveActivityId: (id: string | null) => void;
  setIsTimerStopped: (stopped: boolean) => void;
}

export function useFeedingTimer({
  setStartTime,
  setDuration,
  setActiveActivityId,
  setIsTimerStopped,
}: UseFeedingTimerProps) {
  const { createActivity } = useActivityMutations();

  const startTimer = useCallback(
    async (formData: FeedingFormData) => {
      if (!formData) {
        console.error('No form data to start timer');
        return;
      }

      try {
        const newStartTime = new Date();
        setStartTime(newStartTime);
        setDuration(0);

        // Create in-progress activity (without endTime)
        const activityData = {
          activityType:
            formData.type as typeof import('@nugget/db/schema').Activities.$inferSelect.type,
          amount: formData.amountMl,
          details:
            formData.type === 'nursing'
              ? { side: 'both', type: 'nursing' as const }
              : null,
          feedingSource:
            formData.type === 'bottle'
              ? formData.bottleType === 'formula'
                ? 'formula'
                : 'pumped'
              : formData.type === 'nursing'
                ? 'direct'
                : null,
          notes: formData.notes || undefined,
          startTime: newStartTime,
        };

        const activity = await createActivity(activityData);

        if (activity?.id) {
          setActiveActivityId(activity.id);
          setIsTimerStopped(false);
        }
      } catch (error) {
        console.error('Failed to start tracking:', error);
      }
    },
    [
      createActivity,
      setStartTime,
      setDuration,
      setActiveActivityId,
      setIsTimerStopped,
    ],
  );

  return { startTimer };
}
