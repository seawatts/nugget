/**
 * Feeding-specific actions hook
 * Wraps usePredictiveActions with feeding-specific logic and adds claim/unclaim
 */

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { toast } from '@nugget/ui/sonner';
import { useState } from 'react';
import { usePredictiveActions } from '../../shared/components/predictive-cards/hooks/use-predictive-actions';
import {
  claimFeedingAction,
  skipFeedingAction,
  unclaimFeedingAction,
} from '../actions';

interface UseFeedingActionsOptions {
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
  predictedTime?: Date;
  scheduledFeedingId?: string | null;
}

export function useFeedingActions({
  onActivityLogged,
  predictedTime,
  scheduledFeedingId,
}: UseFeedingActionsOptions) {
  const utils = api.useUtils();
  const [claiming, setClaiming] = useState(false);

  // Use shared actions hook with feeding defaults
  const { handleQuickLog, handleSkip, isCreating, isSkipping } =
    usePredictiveActions({
      activityType: 'feeding',
      defaultQuickLogData: {
        amount: 120, // Default feeding amount in ml
        feedingSource: 'formula' as const,
      },
      onActivityLogged,
      skipAction: skipFeedingAction,
    });

  const handleClaim = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!predictedTime) return;

    setClaiming(true);
    try {
      const result = await claimFeedingAction({
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
    handleSkip,
    handleUnclaim,
    isCreating,
    isSkipping,
  };
}
