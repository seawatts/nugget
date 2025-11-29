'use client';

import { useAuth } from '@clerk/nextjs';
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
import { Moon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDashboardDataStore } from '~/stores/dashboard-data';
import { ClickableTimeDisplay } from '../shared/components/clickable-time-display';
import { useActivityMutations } from '../use-activity-mutations';
import { SleepDrawerContent } from './sleep-drawer';
import { SleepTimeline } from './sleep-timeline';

interface TimelineSleepDrawerProps {
  existingActivity: typeof Activities.$inferSelect;
  isOpen: boolean;
  onClose: () => void;
  babyId?: string;
}

/**
 * Timeline-specific sleep drawer for editing past activities
 * No timer functionality - just edit fields and delete button
 */
export function TimelineSleepDrawer({
  existingActivity,
  isOpen,
  onClose,
  babyId,
}: TimelineSleepDrawerProps) {
  const { userId } = useAuth();
  const { updateActivity, deleteActivity, isUpdating, isDeleting } =
    useActivityMutations();

  // Get user preferences from dashboard store (already fetched by DashboardContainer)
  const user = useDashboardDataStore.use.user();
  const timeFormat = user?.timeFormat || '12h';

  // Sleep-specific state
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
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
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Get family members from dashboard store (already fetched in DashboardContainer)
  const familyMembers = useDashboardDataStore.use.familyMembers();

  const isPending = isUpdating || isDeleting;

  // Calculate duration in minutes
  const durationMinutes = Math.floor(
    (endTime.getTime() - startTime.getTime()) / 1000 / 60,
  );

  // Set current user ID when drawer opens
  useEffect(() => {
    if (isOpen) {
      setCurrentUserId(userId || undefined);
    }
  }, [isOpen, userId]);

  // Load existing activity data
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
    }

    // Initialize sleep-specific fields from existing activity
    if (existingActivity) {
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
  }, [existingActivity]);

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

      // Close drawer immediately for better UX
      onClose();

      // Update existing activity
      await updateActivity({
        details: sleepDetails,
        duration: durationMinutes,
        endTime,
        id: existingActivity.id,
        notes: notes || undefined,
        startTime,
      });
    } catch (error) {
      console.error('Failed to update sleep:', error);
    }
  };

  const handleDelete = async () => {
    try {
      // Close drawer immediately for better UX
      setShowDeleteConfirmation(false);
      onClose();
      await deleteActivity(existingActivity.id);
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  return (
    <>
      {/* Custom Header with Activity Color */}
      <div className="p-6 pb-4 bg-activity-sleep">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Moon
              className="size-8 text-activity-sleep-foreground"
              strokeWidth={1.5}
            />
            <h2 className="text-2xl font-bold text-activity-sleep-foreground">
              Edit Sleep
            </h2>
          </div>
          <button
            className="p-2 rounded-full hover:bg-black/10 transition-colors text-activity-sleep-foreground"
            onClick={onClose}
            type="button"
          >
            <X className="size-6" />
          </button>
        </div>
        <div className="ml-11">
          <ClickableTimeDisplay
            className="text-activity-sleep-foreground"
            duration={durationMinutes}
            endTime={endTime}
            mode="range"
            onEndTimeChange={setEndTime}
            onStartTimeChange={setStartTime}
            startTime={startTime}
            timeFormat={timeFormat}
          />
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Sleep Timeline */}
        {babyId && (
          <SleepTimeline
            babyId={babyId}
            endTime={endTime}
            setEndTime={setEndTime}
            setStartTime={setStartTime}
            startTime={startTime}
            timeFormat={timeFormat}
          />
        )}
        <SleepDrawerContent
          activeActivityId={null}
          coSleepingWith={coSleepingWith}
          currentUserId={currentUserId}
          duration={0}
          familyMembers={familyMembers}
          hideTimeSelection={true}
          isCoSleeping={isCoSleeping}
          isTimerStopped={true}
          onTimerStart={async () => {}}
          setCoSleepingWith={setCoSleepingWith}
          setDuration={() => {}}
          setIsCoSleeping={setIsCoSleeping}
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
            className="h-12 text-base"
            disabled={isPending}
            onClick={() => setShowDeleteConfirmation(true)}
            variant="destructive"
          >
            Delete
          </Button>
          <Button
            className="h-12 text-base bg-transparent"
            disabled={isPending}
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className={cn(
              'flex-1 h-12 text-base font-semibold',
              'bg-activity-sleep text-activity-sleep-foreground',
            )}
            disabled={isPending}
            onClick={handleSave}
          >
            {isPending ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        onOpenChange={setShowDeleteConfirmation}
        open={showDeleteConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sleep Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this sleep activity. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
