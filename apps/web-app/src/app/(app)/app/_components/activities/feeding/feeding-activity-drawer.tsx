'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@nugget/ui/alert-dialog';
import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import { ActivityDrawerHeader } from '../shared/components/activity-drawer-header';
import { TimeInput } from '../shared/components/time-input';
import { useActivityMutations } from '../use-activity-mutations';
import { FeedingTypeSelector } from './feeding-type-selector';
import { useFeedingDrawerState } from './hooks/use-feeding-drawer-state';
import { useFeedingSave } from './hooks/use-feeding-save';

interface FeedingActivityDrawerProps {
  existingActivity?: typeof Activities.$inferSelect | null;
  isOpen: boolean;
  onClose: () => void;
  babyId?: string;
}

/**
 * Feeding activity drawer - refactored for clarity and maintainability
 * Uses custom hooks to separate concerns:
 * - useFeedingDrawerState: Manages all drawer state
 * - useFeedingTimer: Handles timer start logic
 * - useFeedingSave: Handles save/update logic
 */
export function FeedingActivityDrawer({
  existingActivity,
  isOpen,
  onClose,
  babyId,
}: FeedingActivityDrawerProps) {
  const { deleteActivity, isCreating, isUpdating } = useActivityMutations();

  // Fetch baby data to get age information (prefetched on server)
  const [baby] = api.babies.getByIdLight.useSuspenseQuery({
    id: babyId ?? '',
  });

  // Calculate baby age in days
  const babyAgeDays = baby?.birthDate
    ? Math.floor(
        (Date.now() - new Date(baby.birthDate).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  // Consolidated state management
  const {
    startTime,
    endTime,
    formData,
    activeActivityId,
    isTimerStopped,
    duration,
    showCancelConfirmation,
    isLoadingInProgress,
    isEditing,
    isTimerActive,
    setStartTime,
    setFormData,
    setDuration,
    setShowCancelConfirmation,
    clearTimerState,
    handleStop,
  } = useFeedingDrawerState({ babyId, existingActivity, isOpen });

  // Save management
  const { saveActivity } = useFeedingSave({
    activeActivityId,
    clearTimerState,
    existingActivity,
  });

  const isPending = isCreating || isUpdating;

  // Simplified event handlers
  const handleCancelClick = () => {
    if (activeActivityId && !existingActivity) {
      setShowCancelConfirmation(true);
    } else {
      onClose();
    }
  };

  const handleAbandonFeeding = async () => {
    if (activeActivityId) {
      try {
        await deleteActivity(activeActivityId);
        clearTimerState();
        setShowCancelConfirmation(false);
        onClose();
      } catch (error) {
        console.error('Failed to delete in-progress activity:', error);
      }
    }
  };

  const handleKeepRunning = () => {
    setShowCancelConfirmation(false);
    onClose();
  };

  const handleSave = () => {
    if (!formData) return;
    saveActivity(formData, startTime, endTime, onClose);
  };

  const handleTimerStart = async () => {
    // Timer start logic is handled by the feeding type selector components (bottle/nursing)
    // They manage their own timers and call the activity mutations directly
  };

  return (
    <>
      {/* Header */}
      <ActivityDrawerHeader activityType="feeding" onClose={onClose} />

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoadingInProgress ? (
          <div className="flex items-center justify-center h-full">
            <div className="size-8 animate-spin rounded-full border-4 border-activity-feeding border-t-transparent" />
          </div>
        ) : (
          <>
            <FeedingTypeSelector
              activeActivityId={activeActivityId}
              babyAgeDays={babyAgeDays}
              duration={duration}
              existingActivityType={
                existingActivity || activeActivityId
                  ? (formData?.type ?? null)
                  : null
              }
              isTimerStopped={isTimerStopped}
              onFormDataChange={setFormData}
              onTimerStart={handleTimerStart}
              setDuration={setDuration}
              setStartTime={setStartTime}
              startTime={startTime}
            />

            {/* Time & Date Section - Only show when timer has been stopped or no active tracking */}
            {formData && (activeActivityId ? isTimerStopped : true) && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Time & Date
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <TimeInput
                    id="feeding-start-time"
                    label="Start Time"
                    onChange={setStartTime}
                    value={startTime}
                  />
                  {/* End time is auto-calculated for nursing based on durations */}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer with Actions - Only show after feeding type is selected */}
      {formData && (
        <div className="p-6 pt-4 border-t border-border">
          <div className="flex gap-3">
            <Button
              className="flex-1 h-12 text-base bg-transparent"
              disabled={isLoadingInProgress}
              onClick={handleCancelClick}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className={cn(
                'flex-1 h-12 text-base font-semibold',
                isTimerActive
                  ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                  : 'bg-activity-feeding text-activity-feeding-foreground',
              )}
              disabled={isPending || isLoadingInProgress || !formData}
              onClick={isTimerActive ? handleStop : handleSave}
            >
              {isTimerActive
                ? 'Stop'
                : isPending
                  ? 'Saving...'
                  : isEditing
                    ? 'Update'
                    : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        onOpenChange={setShowCancelConfirmation}
        open={showCancelConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abandon Feeding Tracking?</AlertDialogTitle>
            <AlertDialogDescription>
              You have a feeding session currently in progress. What would you
              like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleKeepRunning}>
              Keep Running
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleAbandonFeeding}
            >
              Abandon Feeding
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
