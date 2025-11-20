'use client';

import type { Activities } from '@nugget/db/schema';
import { useCallback } from 'react';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { useActivityMutations } from '../../use-activity-mutations';
import type { FeedingFormData } from '../feeding-type-selector';
import {
  buildCreateActivityData,
  buildOptimisticActivity,
  buildUpdateActivityData,
  calculateDurationMinutes,
} from '../utils/activity-data-builders';

interface UseFeedingSaveProps {
  existingActivity?: typeof Activities.$inferSelect | null;
  activeActivityId: string | null;
  clearTimerState: () => void;
}

export function useFeedingSave({
  existingActivity,
  activeActivityId,
  clearTimerState,
}: UseFeedingSaveProps) {
  const { createActivity, updateActivity } = useActivityMutations();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );

  const saveActivity = useCallback(
    async (
      formData: FeedingFormData,
      startTime: Date,
      endTime: Date,
      onClose: () => void,
    ) => {
      if (!formData) {
        console.error('No form data to save');
        return;
      }

      try {
        const durationMinutes = calculateDurationMinutes(startTime, endTime);
        const baseData = { endTime, notes: formData.notes, startTime };

        // Add optimistic activity for new activities only
        if (!existingActivity && !activeActivityId) {
          const optimisticActivity = buildOptimisticActivity(
            formData,
            startTime,
            endTime,
            durationMinutes,
          );
          addOptimisticActivity(optimisticActivity);
        }

        // Update existing or in-progress activity
        if (existingActivity || activeActivityId) {
          const activityId = existingActivity?.id ?? activeActivityId ?? '';
          const updateData = buildUpdateActivityData(
            formData,
            baseData,
            activityId,
            durationMinutes,
          );
          await updateActivity(updateData);
          clearTimerState();
        } else {
          // Create new activity
          const createData = buildCreateActivityData(
            formData,
            baseData,
            durationMinutes,
          );
          await createActivity(createData);
        }

        onClose();
      } catch (error) {
        console.error('Failed to save feeding:', error);
      }
    },
    [
      existingActivity,
      activeActivityId,
      createActivity,
      updateActivity,
      addOptimisticActivity,
      clearTimerState,
    ],
  );

  return { saveActivity };
}
