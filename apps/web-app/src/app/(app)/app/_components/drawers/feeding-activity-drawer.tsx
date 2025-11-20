'use client';

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
import { Milk, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { getInProgressFeedingActivityAction } from '../activity-cards.actions';
import { useActivityMutations } from '../use-activity-mutations';
import type { FeedingFormData } from './feeding-drawer';
import { FeedingDrawerContent } from './feeding-drawer';

interface FeedingActivityDrawerProps {
  existingActivity?: typeof Activities.$inferSelect | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Complete, self-contained feeding activity drawer
 * Manages all feeding-specific state and logic internally
 */
export function FeedingActivityDrawer({
  existingActivity,
  isOpen,
  onClose,
}: FeedingActivityDrawerProps) {
  const {
    createActivity,
    updateActivity,
    deleteActivity,
    isCreating,
    isUpdating,
  } = useActivityMutations();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );

  // Feeding-specific state
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [formData, setFormData] = useState<FeedingFormData | null>(null);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [isTimerStopped, setIsTimerStopped] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [isLoadingInProgress, setIsLoadingInProgress] = useState(false);
  const [duration, setDuration] = useState(0);

  const isPending = isCreating || isUpdating;
  const isEditing = Boolean(existingActivity) || Boolean(activeActivityId);

  // Update state when existingActivity changes
  useEffect(() => {
    if (existingActivity?.startTime) {
      setStartTime(new Date(existingActivity.startTime));
      // Calculate end time from start time and duration
      if (existingActivity.duration) {
        const calculatedEndTime = new Date(existingActivity.startTime);
        calculatedEndTime.setMinutes(
          calculatedEndTime.getMinutes() + existingActivity.duration,
        );
        setEndTime(calculatedEndTime);
      } else {
        setEndTime(new Date(existingActivity.startTime));
      }
    } else {
      const now = new Date();
      setStartTime(now);
      setEndTime(now);
    }

    // Reset form data when drawer opens for new activity
    if (!existingActivity) {
      setFormData(null);
    }
  }, [existingActivity]);

  // Load in-progress feeding activity when drawer opens
  useEffect(() => {
    if (isOpen && !existingActivity) {
      setIsLoadingInProgress(true);
      void (async () => {
        try {
          const result = await getInProgressFeedingActivityAction({});
          if (result?.data?.activity) {
            const inProgressActivity = result.data.activity;
            setActiveActivityId(inProgressActivity.id);
            setStartTime(new Date(inProgressActivity.startTime));
            // Set endTime to now for in-progress activities
            setEndTime(new Date());

            // Calculate duration from start time
            const elapsedSeconds = Math.floor(
              (Date.now() - new Date(inProgressActivity.startTime).getTime()) /
                1000,
            );
            setDuration(elapsedSeconds);

            // Set form data type based on activity type
            if (inProgressActivity.type === 'bottle') {
              setFormData({
                amountMl: inProgressActivity.amount || undefined,
                bottleType:
                  inProgressActivity.feedingSource === 'formula'
                    ? 'formula'
                    : 'breast_milk',
                notes: inProgressActivity.notes || undefined,
                type: 'bottle',
              });
            } else if (inProgressActivity.type === 'nursing') {
              setFormData({
                notes: inProgressActivity.notes || undefined,
                type: 'nursing',
              });
            }
          } else {
            setActiveActivityId(null);
          }
        } catch (error) {
          console.error('Failed to load in-progress feeding:', error);
        } finally {
          setIsLoadingInProgress(false);
        }
      })();
    }

    // Reset state when drawer closes
    if (!isOpen) {
      setActiveActivityId(null);
      setIsTimerStopped(false);
      setIsLoadingInProgress(false);
      setDuration(0);
      const now = new Date();
      setStartTime(now);
      setEndTime(now);
      setFormData(null);
    }
  }, [isOpen, existingActivity]);

  const handleTimerStart = async () => {
    if (!formData) {
      console.error('No form data to start timer');
      return;
    }

    try {
      const newStartTime = new Date();
      setStartTime(newStartTime);
      setDuration(0);

      // Create in-progress activity based on feeding type
      if (formData.type === 'bottle') {
        const activity = await createActivity({
          activityType: 'bottle',
          amount: formData.amountMl,
          details: null,
          feedingSource:
            formData.bottleType === 'formula' ? 'formula' : 'pumped',
          notes: formData.notes || undefined,
          startTime: newStartTime,
        });

        if (activity?.id) {
          setActiveActivityId(activity.id);
          setIsTimerStopped(false);
        }
      } else if (formData.type === 'nursing') {
        const activity = await createActivity({
          activityType: 'nursing',
          amount: formData.amountMl,
          details: {
            side: 'both',
            type: 'nursing',
          },
          feedingSource: 'direct',
          notes: formData.notes || undefined,
          startTime: newStartTime,
        });

        if (activity?.id) {
          setActiveActivityId(activity.id);
          setIsTimerStopped(false);
        }
      }
    } catch (error) {
      console.error('Failed to start tracking:', error);
    }
  };

  const handleStop = () => {
    // Stop the timer and show detail fields
    setIsTimerStopped(true);
  };

  const handleCancelClick = () => {
    // If there's an active activity, show confirmation dialog
    if (activeActivityId && !existingActivity) {
      setShowCancelConfirmation(true);
    } else {
      // Otherwise just close the drawer
      onClose();
    }
  };

  const handleAbandonFeeding = async () => {
    if (activeActivityId) {
      try {
        await deleteActivity(activeActivityId);
        setActiveActivityId(null);
        setIsTimerStopped(false);
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

  const handleSave = async () => {
    if (!formData) {
      console.error('No form data to save');
      return;
    }

    try {
      // Calculate duration from time difference (in minutes)
      const durationMinutes = Math.floor(
        (endTime.getTime() - startTime.getTime()) / 1000 / 60,
      );

      // Close drawer immediately for better UX
      onClose();

      // Only add optimistic activity for new activities (not updates)
      if (!existingActivity && !activeActivityId) {
        // Create optimistic activity for immediate UI feedback
        const optimisticActivity = {
          amount:
            formData.type === 'bottle'
              ? formData.amountMl
              : formData.type === 'nursing'
                ? (formData.amountMl ?? null)
                : null,
          assignedUserId: null,
          babyId: 'temp',
          createdAt: startTime,
          details:
            formData.type === 'nursing'
              ? { side: 'both', type: 'nursing' }
              : formData.type === 'solids'
                ? { items: [], type: 'solids' }
                : null,
          duration: formData.type === 'nursing' ? durationMinutes : null,
          endTime,
          familyId: 'temp',
          familyMemberId: null,
          feedingSource:
            formData.type === 'bottle'
              ? formData.bottleType === 'formula'
                ? 'formula'
                : 'pumped'
              : formData.type === 'nursing'
                ? 'direct'
                : null,
          id: `optimistic-feeding-${Date.now()}`,
          isScheduled: false,
          notes: formData.notes || null,
          startTime,
          subjectType: 'baby' as const,
          type: 'feeding' as const,
          updatedAt: startTime,
          userId: 'temp',
        } as typeof Activities.$inferSelect;

        addOptimisticActivity(optimisticActivity);
      }

      // Prepare activity data based on feeding type
      const baseData = {
        endTime,
        notes: formData.notes || undefined,
        startTime,
      };

      if (existingActivity || activeActivityId) {
        // Update existing or in-progress activity
        const activityId = existingActivity?.id ?? activeActivityId ?? '';

        if (formData.type === 'bottle') {
          await updateActivity({
            ...baseData,
            amount: formData.amountMl,
            details: null,
            feedingSource:
              formData.bottleType === 'formula' ? 'formula' : 'pumped',
            id: activityId,
          });
        } else if (formData.type === 'nursing') {
          await updateActivity({
            ...baseData,
            amount: formData.amountMl,
            details: {
              side: 'both', // TODO: Allow user to select side
              type: 'nursing',
            },
            duration: durationMinutes,
            feedingSource: 'direct',
            id: activityId,
          });
        } else if (formData.type === 'solids') {
          await updateActivity({
            ...baseData,
            details: {
              items: [], // TODO: Allow user to input solid food items
              type: 'solids',
            },
            id: activityId,
          });
        }
      } else {
        // Create new activity
        if (formData.type === 'bottle') {
          await createActivity({
            activityType: 'bottle',
            amount: formData.amountMl,
            details: null,
            feedingSource:
              formData.bottleType === 'formula' ? 'formula' : 'pumped',
            notes: formData.notes || undefined,
            startTime,
          });
        } else if (formData.type === 'nursing') {
          await createActivity({
            activityType: 'nursing',
            amount: formData.amountMl,
            details: {
              side: 'both', // TODO: Allow user to select side
              type: 'nursing',
            },
            duration: durationMinutes,
            feedingSource: 'direct',
            notes: formData.notes || undefined,
            startTime,
          });
        } else if (formData.type === 'solids') {
          await createActivity({
            activityType: 'solids',
            details: {
              items: [], // TODO: Allow user to input solid food items
              type: 'solids',
            },
            notes: formData.notes || undefined,
            startTime,
          });
        }
      }
    } catch (error) {
      console.error('Failed to save feeding:', error);
    }
  };

  return (
    <>
      {/* Custom Header with Activity Color */}
      <div className="p-6 pb-4 bg-[oklch(0.68_0.18_35)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Milk className="size-8 text-white" strokeWidth={1.5} />
            <h2 className="text-2xl font-bold text-white">Feeding</h2>
          </div>
          <button
            className="p-2 rounded-full hover:bg-black/10 transition-colors text-white"
            onClick={onClose}
            type="button"
          >
            <X className="size-6" />
          </button>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoadingInProgress ? (
          <div className="flex items-center justify-center h-full">
            <div className="size-8 animate-spin rounded-full border-4 border-[oklch(0.68_0.18_35)] border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Time & Date Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Time & Date
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 min-w-0">
                  <label
                    className="text-xs text-muted-foreground"
                    htmlFor="feeding-start-time"
                  >
                    Start Time
                  </label>
                  <input
                    className="w-full min-w-0 px-3 py-2 rounded-md border border-border bg-background text-foreground"
                    id="feeding-start-time"
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value
                        .split(':')
                        .map(Number);
                      if (hours !== undefined && minutes !== undefined) {
                        const newStartTime = new Date(startTime);
                        newStartTime.setHours(hours, minutes);
                        setStartTime(newStartTime);
                      }
                    }}
                    type="time"
                    value={startTime.toTimeString().slice(0, 5)}
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <label
                    className="text-xs text-muted-foreground"
                    htmlFor="feeding-end-time"
                  >
                    End Time
                  </label>
                  <input
                    className="w-full min-w-0 px-3 py-2 rounded-md border border-border bg-background text-foreground"
                    id="feeding-end-time"
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value
                        .split(':')
                        .map(Number);
                      if (hours !== undefined && minutes !== undefined) {
                        const newEndTime = new Date(endTime);
                        newEndTime.setHours(hours, minutes);
                        setEndTime(newEndTime);
                      }
                    }}
                    type="time"
                    value={endTime.toTimeString().slice(0, 5)}
                  />
                </div>
              </div>
            </div>

            <FeedingDrawerContent
              activeActivityId={activeActivityId}
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
          </>
        )}
      </div>

      {/* Footer with Actions */}
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
              activeActivityId && !isTimerStopped
                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                : 'bg-[oklch(0.68_0.18_35)] text-white',
            )}
            disabled={isPending || isLoadingInProgress || !formData}
            onClick={
              activeActivityId && !isTimerStopped ? handleStop : handleSave
            }
          >
            {activeActivityId && !isTimerStopped
              ? 'Stop'
              : isPending
                ? 'Saving...'
                : activeActivityId && !existingActivity
                  ? 'Save'
                  : isEditing
                    ? 'Update'
                    : 'Save'}
          </Button>
        </div>
      </div>

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
