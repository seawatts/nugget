/**
 * Feeding-specific actions hook
 * Wraps usePredictiveActions with feeding-specific logic and adds claim/unclaim
 */

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { toast } from '@nugget/ui/sonner';
import { useState } from 'react';
import { usePredictiveActions } from '../../shared/components/predictive-cards/hooks/use-predictive-actions';
import { claimFeedingAction, unclaimFeedingAction } from '../actions';

interface UseFeedingActionsOptions {
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
  predictedTime?: Date;
  scheduledFeedingId?: string | null;
  // Smart defaults from prediction
  suggestedAmount?: number | null;
  suggestedDuration?: number | null;
  suggestedType?: 'bottle' | 'nursing' | null;
  // User preferences
  quickLogEnabled?: boolean;
  useLastAmount?: boolean;
  useTypicalDuration?: boolean;
  useLastType?: boolean;
  babyId: string;
}

export function useFeedingActions({
  onActivityLogged,
  predictedTime,
  scheduledFeedingId,
  suggestedAmount,
  suggestedDuration,
  suggestedType,
  quickLogEnabled: _quickLogEnabled = true,
  useLastAmount = true,
  useTypicalDuration = true,
  useLastType = true,
  babyId,
}: UseFeedingActionsOptions) {
  const utils = api.useUtils();
  const [claiming, setClaiming] = useState(false);

  // Build smart defaults based on user preferences
  const defaultQuickLogData: Record<string, unknown> = {};

  if (useLastAmount && suggestedAmount) {
    defaultQuickLogData.amountMl = suggestedAmount;
  }

  if (useTypicalDuration && suggestedDuration) {
    defaultQuickLogData.duration = suggestedDuration;
  }

  if (useLastType && suggestedType) {
    defaultQuickLogData.type = suggestedType;
  }

  // Use shared actions hook with feeding defaults
  const { handleQuickLog, isCreating } = usePredictiveActions({
    activityType: 'feeding',
    babyId,
    defaultQuickLogData,
    onActivityLogged,
  });

  const handleClaim = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!predictedTime) return;

    setClaiming(true);
    try {
      const result = await claimFeedingAction({
        babyId,
        predictedTime: predictedTime.toISOString(),
      });

      if (result?.data) {
        toast.success('Feeding claimed!');
        await utils.activities.getUpcomingFeeding.invalidate();
      } else if (result?.serverError) {
        toast.error(result.serverError);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to claim feeding',
      );
    } finally {
      setClaiming(false);
    }
  };

  const handleUnclaim = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!scheduledFeedingId) return;

    setClaiming(true);
    try {
      const result = await unclaimFeedingAction({
        activityId: scheduledFeedingId,
      });

      if (result?.data) {
        toast.success('Feeding unclaimed');
        await utils.activities.getUpcomingFeeding.invalidate();
      } else if (result?.serverError) {
        toast.error(result.serverError);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to unclaim feeding',
      );
    } finally {
      setClaiming(false);
    }
  };

  return {
    claiming,
    handleClaim,
    handleQuickLog,
    handleUnclaim,
    isCreating,
  };
}
