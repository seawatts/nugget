/**
 * Generic hook for predictive card actions (quick log, skip)
 * Can be customized per activity type
 */

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { toast } from '@nugget/ui/sonner';
import { useState } from 'react';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { useActivityMutations } from '../../../../use-activity-mutations';

interface UsePredictiveActionsOptions {
  activityType: 'feeding' | 'diaper' | 'sleep' | 'pumping';
  skipAction: (input: {
    babyId: string;
  }) => Promise<{ data?: unknown; serverError?: string } | undefined>;
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
  defaultQuickLogData?: Record<string, unknown>;
  babyId: string;
}

export function usePredictiveActions({
  activityType,
  skipAction,
  onActivityLogged,
  defaultQuickLogData = {},
  babyId,
}: UsePredictiveActionsOptions) {
  const utils = api.useUtils();
  const [skipping, setSkipping] = useState(false);
  const { createActivity, isCreating } = useActivityMutations();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );

  const handleQuickLog = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const now = new Date();

      // Determine the specific activity type
      // If defaultQuickLogData has a specific type (e.g., 'bottle', 'nursing'), use it
      // Otherwise, fall back to the generic activityType
      const specificType = (defaultQuickLogData.type as string) || activityType;

      // Create optimistic activity for immediate UI feedback
      // Set endTime to mark as completed (not in-progress)
      const optimisticActivity = {
        ...defaultQuickLogData,
        assignedUserId: null,
        babyId: 'temp',
        createdAt: now,
        details: null,
        duration: 0,
        endTime: now,
        familyId: 'temp',
        familyMemberId: null,
        id: `activity-optimistic-${specificType}-${Date.now()}`,
        isScheduled: false,
        notes: null,
        startTime: now,
        subjectType: 'baby' as const,
        type: specificType,
        updatedAt: now,
        userId: 'temp',
      } as typeof Activities.$inferSelect;

      // Add to optimistic store immediately
      addOptimisticActivity(optimisticActivity);

      // Create the actual activity with the specific type
      // Set endTime and duration to mark as completed (not in-progress)
      const activity = await createActivity({
        ...defaultQuickLogData,
        activityType: specificType as typeof Activities.$inferSelect.type,
        babyId,
        duration: 0,
        endTime: now,
        startTime: now,
      });

      // Notify parent component
      onActivityLogged?.(activity);

      // Invalidate prediction query
      const invalidateKey =
        activityType === 'feeding'
          ? 'getUpcomingFeeding'
          : activityType === 'diaper'
            ? 'getUpcomingDiaper'
            : activityType === 'sleep'
              ? 'getUpcomingSleep'
              : 'getUpcomingPumping';

      await utils.activities[invalidateKey].invalidate();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Failed to log ${activityType}`,
      );
    }
  };

  const handleSkip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSkipping(true);
    try {
      const result = await skipAction({ babyId });
      if (result?.serverError) {
        toast.error(result.serverError);
      } else {
        toast.success(
          `${activityType.charAt(0).toUpperCase() + activityType.slice(1)} reminder skipped`,
        );
        // Invalidate activities list to refresh timeline
        await utils.activities.list.invalidate();

        // Invalidate prediction query
        const invalidateKey =
          activityType === 'feeding'
            ? 'getUpcomingFeeding'
            : activityType === 'diaper'
              ? 'getUpcomingDiaper'
              : activityType === 'sleep'
                ? 'getUpcomingSleep'
                : 'getUpcomingPumping';

        await utils.activities[invalidateKey].invalidate();
      }
    } catch (error) {
      console.error(`Failed to skip ${activityType}:`, error);
      toast.error(`Failed to skip ${activityType}`);
    } finally {
      setSkipping(false);
    }
  };

  return {
    handleQuickLog,
    handleSkip,
    isCreating,
    isSkipping: skipping,
  };
}
