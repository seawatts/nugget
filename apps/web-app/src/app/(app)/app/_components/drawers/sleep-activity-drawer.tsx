'use client';

import { useAuth } from '@clerk/nextjs';
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
import { DateTimeRangePicker } from '@nugget/ui/custom/date-time-range-picker';
import { cn } from '@nugget/ui/lib/utils';
import { Moon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { getInProgressSleepActivityAction } from '../activity-cards.actions';
import { getFamilyMembersAction } from '../activity-timeline-filters.actions';
import { useActivityMutations } from '../use-activity-mutations';
import { SleepDrawerContent } from './sleep-drawer';

interface SleepActivityDrawerProps {
  existingActivity?: typeof Activities.$inferSelect | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Complete, self-contained sleep activity drawer
 * Manages all sleep-specific state and logic internally
 */
export function SleepActivityDrawer({
  existingActivity,
  isOpen,
  onClose,
}: SleepActivityDrawerProps) {
  const { userId } = useAuth();
  const utils = api.useUtils();
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

  // Sleep-specific state
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [duration, setDuration] = useState(0);
  const [sleepType, setSleepType] = useState<'nap' | 'night'>('nap');
  const [notes, setNotes] = useState('');
  const [sleepQuality, setSleepQuality] = useState<
    'peaceful' | 'restless' | 'fussy' | 'crying' | undefined
  >();
  const [sleepLocation, setSleepLocation] = useState<
    | 'crib'
    | 'bassinet'
    | 'bed'
    | 'car_seat'
    | 'stroller'
    | 'arms'
    | 'swing'
    | 'bouncer'
    | undefined
  >();
  const [wakeReason, setWakeReason] = useState<
    | 'hungry'
    | 'diaper'
    | 'crying'
    | 'naturally'
    | 'noise'
    | 'unknown'
    | undefined
  >();
  const [isCoSleeping, setIsCoSleeping] = useState(false);
  const [coSleepingWith, setCoSleepingWith] = useState<string[]>([]);
  const [familyMembers, setFamilyMembers] = useState<
    Array<{
      id: string;
      name: string;
      avatarUrl?: string | null;
      userId: string;
      isCurrentUser?: boolean;
    }>
  >([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [isTimerStopped, setIsTimerStopped] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  const isPending = isCreating || isUpdating;
  const isEditing = Boolean(existingActivity) || Boolean(activeActivityId);

  // Fetch family members when drawer opens
  useEffect(() => {
    if (isOpen) {
      // Set current user ID
      setCurrentUserId(userId || undefined);

      // Fetch family members
      void (async () => {
        try {
          const result = await getFamilyMembersAction();
          if (result?.data) {
            setFamilyMembers(result.data);
          }
        } catch (error) {
          console.error('Failed to fetch family members:', error);
        }
      })();
    }
  }, [isOpen, userId]);

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

    // Initialize sleep-specific fields from existing activity
    if (existingActivity) {
      if (existingActivity.duration) {
        setDuration(existingActivity.duration * 60); // Convert minutes to seconds
      }
      if (existingActivity.notes) {
        setNotes(existingActivity.notes);
      }
      // Parse sleep details from details field
      if (
        existingActivity.details &&
        existingActivity.details.type === 'sleep'
      ) {
        setSleepType(existingActivity.details.sleepType);
        setSleepQuality(existingActivity.details.quality);
        setSleepLocation(existingActivity.details.location);
        setWakeReason(existingActivity.details.wakeReason);
        setIsCoSleeping(existingActivity.details.isCoSleeping || false);
        setCoSleepingWith(existingActivity.details.coSleepingWith || []);
      }
    }

    // Reset fields when drawer is opened for new activity
    if (!existingActivity) {
      const now = new Date();
      setStartTime(now);
      setEndTime(now);
      setDuration(0);
      setSleepType('nap');
      setNotes('');
      setSleepQuality(undefined);
      setSleepLocation(undefined);
      setWakeReason(undefined);
      setIsCoSleeping(false);
      setCoSleepingWith([]);
    }
  }, [existingActivity]);

  // Sync endTime with duration changes (when timer is running)
  useEffect(() => {
    if (duration > 0) {
      const calculatedEndTime = new Date(startTime.getTime() + duration * 1000);
      setEndTime(calculatedEndTime);
    }
  }, [duration, startTime]);

  // Load in-progress sleep activity when drawer opens
  useEffect(() => {
    if (isOpen && !existingActivity) {
      void (async () => {
        try {
          const result = await getInProgressSleepActivityAction({});
          if (result?.data?.activity) {
            const inProgressActivity = result.data.activity;
            setActiveActivityId(inProgressActivity.id);
            setStartTime(new Date(inProgressActivity.startTime));

            if (inProgressActivity.notes) {
              setNotes(inProgressActivity.notes);
            }
            if (
              inProgressActivity.details &&
              inProgressActivity.details.type === 'sleep'
            ) {
              setSleepType(inProgressActivity.details.sleepType);
              setSleepQuality(inProgressActivity.details.quality);
              setSleepLocation(inProgressActivity.details.location);
              setWakeReason(inProgressActivity.details.wakeReason);
              setIsCoSleeping(inProgressActivity.details.isCoSleeping || false);
              setCoSleepingWith(
                inProgressActivity.details.coSleepingWith || [],
              );
            }
          } else {
            setActiveActivityId(null);
          }
        } catch (error) {
          console.error('Failed to load in-progress sleep:', error);
        }
      })();
    }

    // Reset state when drawer closes
    if (!isOpen) {
      setActiveActivityId(null);
      setIsTimerStopped(false);
      setDuration(0);
      setNotes('');
      setSleepQuality(undefined);
      setSleepLocation(undefined);
      setWakeReason(undefined);
      setIsCoSleeping(false);
      setCoSleepingWith([]);
    }
  }, [isOpen, existingActivity]);

  const handleTimerStart = async () => {
    try {
      const activity = await createActivity({
        activityType: 'sleep',
        details: {
          coSleepingWith: isCoSleeping ? coSleepingWith : undefined,
          isCoSleeping: isCoSleeping || undefined,
          location: sleepLocation,
          quality: sleepQuality,
          sleepType: sleepType,
          type: 'sleep' as const,
          wakeReason: wakeReason,
        },
        notes: notes || undefined,
        startTime: startTime,
      });

      if (activity?.id) {
        setActiveActivityId(activity.id);
        setIsTimerStopped(false); // Ensure timer stopped state is reset
      }
    } catch (error) {
      console.error('Failed to start tracking:', error);
    }
  };

  const handleStop = () => {
    // Stop the timer and show detail fields
    setIsTimerStopped(true);
    // Duration is already being calculated by the timer, so we just need to stop it
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

  const handleAbandonSleep = async () => {
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
    try {
      // Calculate duration from time difference (in minutes)
      const durationMinutes = Math.floor(
        (endTime.getTime() - startTime.getTime()) / 1000 / 60,
      );

      // Create details object
      const sleepDetails = {
        coSleepingWith: isCoSleeping ? coSleepingWith : undefined,
        isCoSleeping: isCoSleeping || undefined,
        location: sleepLocation,
        quality: sleepQuality,
        sleepType: sleepType,
        type: 'sleep' as const,
        wakeReason: wakeReason,
      };

      // For new activities (not updates), add optimistic activity immediately
      if (!activeActivityId && !existingActivity) {
        const optimisticActivity = {
          amount: null,
          assignedUserId: null,
          babyId: 'temp',
          createdAt: new Date(),
          details: sleepDetails,
          duration: durationMinutes,
          endTime: endTime,
          familyId: 'temp',
          familyMemberId: null,
          feedingSource: null,
          id: `optimistic-sleep-${Date.now()}`,
          isScheduled: false,
          notes: notes || null,
          startTime: startTime,
          subjectType: 'baby' as const,
          type: 'sleep' as const,
          updatedAt: new Date(),
          userId: userId ?? 'temp',
        } as typeof Activities.$inferSelect;

        // Add to optimistic store immediately for instant UI feedback
        addOptimisticActivity(optimisticActivity);
      }

      // Close drawer immediately for better UX
      onClose();

      if (activeActivityId && !existingActivity) {
        // Update in-progress activity - set endTime to complete it
        await updateActivity({
          details: sleepDetails,
          duration: durationMinutes,
          endTime,
          id: activeActivityId,
          notes: notes || undefined,
          startTime,
        });
        // Clear state after successful save
        setActiveActivityId(null);
        setIsTimerStopped(false);
      } else if (existingActivity) {
        // Update existing activity
        await updateActivity({
          details: sleepDetails,
          duration: durationMinutes,
          endTime,
          id: existingActivity.id,
          notes: notes || undefined,
          startTime,
        });
      } else {
        // Create new activity - mutation hook handles invalidation and clears optimistic state
        await createActivity({
          activityType: 'sleep',
          details: sleepDetails,
          duration: durationMinutes,
          notes: notes || undefined,
          startTime,
        });
      }

      // Explicitly invalidate all activity queries to ensure UI updates
      await utils.activities.invalidate();
    } catch (error) {
      console.error('Failed to save sleep:', error);
    }
  };

  return (
    <>
      {/* Custom Header with Activity Color */}
      <div className="p-6 pb-4 bg-[oklch(0.75_0.15_195)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Moon
              className="size-8 text-[oklch(0.18_0.02_250)]"
              strokeWidth={1.5}
            />
            <h2 className="text-2xl font-bold text-[oklch(0.18_0.02_250)]">
              Sleep
            </h2>
          </div>
          <button
            className="p-2 rounded-full hover:bg-black/10 transition-colors text-[oklch(0.18_0.02_250)]"
            onClick={onClose}
            type="button"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Time Range Picker */}
        <DateTimeRangePicker
          className="text-[oklch(0.18_0.02_250)] opacity-90"
          endDate={endTime}
          mode="range"
          setEndDate={setEndTime}
          setStartDate={setStartTime}
          startDate={startTime}
        />
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <SleepDrawerContent
          activeActivityId={activeActivityId}
          coSleepingWith={coSleepingWith}
          currentUserId={currentUserId}
          duration={duration}
          familyMembers={familyMembers}
          isCoSleeping={isCoSleeping}
          isTimerStopped={isTimerStopped}
          notes={notes}
          onTimerStart={handleTimerStart}
          setCoSleepingWith={setCoSleepingWith}
          setDuration={setDuration}
          setIsCoSleeping={setIsCoSleeping}
          setNotes={setNotes}
          setSleepLocation={setSleepLocation}
          setSleepQuality={setSleepQuality}
          setSleepType={setSleepType}
          setStartTime={setStartTime}
          setWakeReason={setWakeReason}
          sleepLocation={sleepLocation}
          sleepQuality={sleepQuality}
          sleepType={sleepType}
          startTime={startTime}
          wakeReason={wakeReason}
        />
      </div>

      {/* Footer with Actions */}
      <div className="p-6 pt-4 border-t border-border">
        <div className="flex gap-3">
          <Button
            className="flex-1 h-12 text-base bg-transparent"
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
                : 'bg-[oklch(0.75_0.15_195)] text-[oklch(0.18_0.02_250)]',
            )}
            disabled={isPending}
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
            <AlertDialogTitle>Abandon Sleep Tracking?</AlertDialogTitle>
            <AlertDialogDescription>
              You have a sleep session currently in progress. What would you
              like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleKeepRunning}>
              Keep Running
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleAbandonSleep}
            >
              Abandon Sleep
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
