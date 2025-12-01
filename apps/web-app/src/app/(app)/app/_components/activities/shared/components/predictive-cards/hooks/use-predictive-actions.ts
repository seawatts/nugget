/**
 * Generic hook for predictive card actions (quick log, skip)
 * Can be customized per activity type
 */

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { toast } from '@nugget/ui/sonner';
import {
  getUserRelationFromStore,
  type UserRelation,
  useOptimisticActivitiesStore,
} from '~/stores/optimistic-activities';
import { useActivityMutations } from '../../../../use-activity-mutations';

interface UsePredictiveActionsOptions {
  activityType: 'feeding' | 'diaper' | 'sleep' | 'pumping';
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
  defaultQuickLogData?: Record<string, unknown>;
  babyId: string;
}

export function usePredictiveActions({
  activityType,
  onActivityLogged,
  defaultQuickLogData = {},
  babyId,
}: UsePredictiveActionsOptions) {
  const utils = api.useUtils();
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
      const user = getUserRelationFromStore();
      const optimisticActivity = {
        ...defaultQuickLogData,
        assignedUserId: null,
        babyId: babyId, // Use real babyId instead of 'temp' for timeline filtering
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
        user,
        userId: user?.id || 'temp',
      } as unknown as typeof Activities.$inferSelect & { user?: UserRelation };

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

  return {
    handleQuickLog,
    isCreating,
  };
}
