'use client';

import type { Activities, ActivityDetails } from '@nugget/db/schema';
import { useCallback } from 'react';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { useActivityMutations } from '../../use-activity-mutations';
import type { FeedingFormData } from '../feeding-type-selector';

interface UseFeedingSaveProps {
  existingActivity?: typeof Activities.$inferSelect | null;
  activeActivityId: string | null;
  clearTimerState: () => void;
  babyId?: string;
}

// Utility functions
function calculateDurationMinutes(startTime: Date, endTime: Date): number {
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60);
}

function buildOptimisticActivity(
  formData: FeedingFormData,
  startTime: Date,
  endTime: Date,
  durationMinutes: number,
): typeof Activities.$inferSelect {
  // Determine feedingSource and details based on type
  let feedingSource: 'pumped' | 'donor' | 'direct' | 'formula' | null = null;
  let details: ActivityDetails = null;
  const activityType: 'bottle' | 'nursing' | 'solids' | 'vitamin_d' =
    formData.type;

  if (formData.type === 'nursing') {
    feedingSource = 'direct';
    // Determine nursing side based on durations
    let side: 'left' | 'right' | 'both' = 'both';
    if (
      formData.leftDuration &&
      formData.leftDuration > 0 &&
      (!formData.rightDuration || formData.rightDuration === 0)
    ) {
      side = 'left';
    } else if (
      formData.rightDuration &&
      formData.rightDuration > 0 &&
      (!formData.leftDuration || formData.leftDuration === 0)
    ) {
      side = 'right';
    }
    details = {
      side,
      type: 'nursing' as const,
    };
  } else if (formData.type === 'bottle') {
    feedingSource = formData.bottleType === 'formula' ? 'formula' : 'pumped';
    details = {
      type: 'bottle' as const,
    };
  } else if (formData.type === 'vitamin_d') {
    details = {
      method: formData.method,
      type: 'vitamin_d' as const,
    };
  }

  return {
    amountMl: formData.amountMl ?? null,
    assignedUserId: null,
    babyId: 'temp',
    createdAt: new Date(),
    details,
    duration: durationMinutes,
    endTime,
    familyId: 'temp',
    familyMemberId: null,
    feedingSource,
    id: `optimistic-feeding-${Date.now()}`,
    isScheduled: false,
    notes: formData.notes ?? null,
    startTime,
    subjectType: 'baby' as const,
    type: activityType,
    updatedAt: new Date(),
    userId: 'temp',
  } as typeof Activities.$inferSelect;
}

function buildCreateActivityData(
  formData: FeedingFormData,
  baseData: { startTime: Date; endTime: Date; notes?: string },
  durationMinutes: number,
) {
  // Determine feedingSource and details based on type
  let feedingSource: 'pumped' | 'donor' | 'direct' | 'formula' | undefined;
  let details: ActivityDetails = null;
  const activityType: 'bottle' | 'nursing' | 'solids' | 'vitamin_d' =
    formData.type;

  if (formData.type === 'nursing') {
    feedingSource = 'direct';
    // Determine nursing side based on durations
    let side: 'left' | 'right' | 'both' = 'both';
    if (
      formData.leftDuration &&
      formData.leftDuration > 0 &&
      (!formData.rightDuration || formData.rightDuration === 0)
    ) {
      side = 'left';
    } else if (
      formData.rightDuration &&
      formData.rightDuration > 0 &&
      (!formData.leftDuration || formData.leftDuration === 0)
    ) {
      side = 'right';
    }
    details = {
      side,
      type: 'nursing' as const,
    };
  } else if (formData.type === 'bottle') {
    feedingSource = formData.bottleType === 'formula' ? 'formula' : 'pumped';
    details = {
      type: 'bottle' as const,
    };
  } else if (formData.type === 'vitamin_d') {
    details = {
      method: formData.method,
      type: 'vitamin_d' as const,
    };
  }

  return {
    activityType,
    amountMl: formData.amountMl,
    details,
    duration: durationMinutes > 0 ? durationMinutes : undefined,
    endTime: baseData.endTime,
    feedingSource,
    notes: baseData.notes,
    startTime: baseData.startTime,
  };
}

function buildUpdateActivityData(
  formData: FeedingFormData,
  baseData: { startTime: Date; endTime: Date; notes?: string },
  activityId: string,
  durationMinutes: number,
) {
  // Determine feedingSource and details based on type
  let feedingSource: 'pumped' | 'donor' | 'direct' | 'formula' | undefined;
  let details: ActivityDetails = null;

  if (formData.type === 'nursing') {
    feedingSource = 'direct';
    // Determine nursing side based on durations
    let side: 'left' | 'right' | 'both' = 'both';
    if (
      formData.leftDuration &&
      formData.leftDuration > 0 &&
      (!formData.rightDuration || formData.rightDuration === 0)
    ) {
      side = 'left';
    } else if (
      formData.rightDuration &&
      formData.rightDuration > 0 &&
      (!formData.leftDuration || formData.leftDuration === 0)
    ) {
      side = 'right';
    }
    details = {
      side,
      type: 'nursing' as const,
    };
  } else if (formData.type === 'bottle') {
    feedingSource = formData.bottleType === 'formula' ? 'formula' : 'pumped';
    details = {
      type: 'bottle' as const,
    };
  }

  return {
    amountMl: formData.amountMl,
    details,
    duration: durationMinutes > 0 ? durationMinutes : undefined,
    endTime: baseData.endTime,
    feedingSource,
    id: activityId,
    notes: baseData.notes,
    startTime: baseData.startTime,
  };
}

export function useFeedingSave({
  existingActivity,
  activeActivityId,
  clearTimerState,
  babyId,
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
        // Calculate end time and duration based on feeding type
        let actualEndTime: Date;
        let durationMinutes: number;

        if (formData.type === 'bottle') {
          // For bottle feeding, duration is 0 and endTime equals startTime
          actualEndTime = startTime;
          durationMinutes = 0;
        } else if (formData.type === 'nursing') {
          // For nursing, auto-calculate end time from start time + total duration
          const totalNursingMinutes =
            (formData.leftDuration ?? 0) + (formData.rightDuration ?? 0);
          actualEndTime = new Date(startTime);
          actualEndTime.setMinutes(
            actualEndTime.getMinutes() + totalNursingMinutes,
          );
          durationMinutes = totalNursingMinutes;
        } else {
          // Fallback for other types (shouldn't happen, but for safety)
          actualEndTime = endTime;
          durationMinutes = calculateDurationMinutes(startTime, endTime);
        }

        const baseData = {
          endTime: actualEndTime,
          notes: formData.notes,
          startTime,
        };

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

        // Close drawer immediately for better UX
        onClose();

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
          await createActivity({ ...createData, babyId });
        }
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
      babyId,
    ],
  );

  return { saveActivity };
}
