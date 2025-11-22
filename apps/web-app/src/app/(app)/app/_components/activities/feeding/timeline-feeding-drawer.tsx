'use client';

import { api } from '@nugget/api/react';
import type { Activities, ActivityDetails } from '@nugget/db/schema';
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
import { useEffect, useState } from 'react';
import { ActivityDrawerHeader } from '../shared/components/activity-drawer-header';
import { TimeInput } from '../shared/components/time-input';
import { useActivityMutations } from '../use-activity-mutations';
import type { FeedingFormData } from './feeding-type-selector';
import { FeedingTypeSelector } from './feeding-type-selector';

interface TimelineFeedingDrawerProps {
  existingActivity: typeof Activities.$inferSelect;
  isOpen: boolean;
  onClose: () => void;
  babyId: string;
}

/**
 * Timeline-specific feeding drawer for editing past activities
 * No timer functionality - just edit fields and delete button
 */
export function TimelineFeedingDrawer({
  existingActivity,
  isOpen: _isOpen,
  onClose,
  babyId,
}: TimelineFeedingDrawerProps) {
  const { updateActivity, deleteActivity, isUpdating, isDeleting } =
    useActivityMutations();

  // Fetch baby data to get age information
  const [baby] = api.babies.getByIdLight.useSuspenseQuery({
    id: babyId,
  });

  // Calculate baby age in days
  const babyAgeDays = baby?.birthDate
    ? Math.floor(
        (Date.now() - new Date(baby.birthDate).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  // Time state
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  // Form state
  const [formData, setFormData] = useState<FeedingFormData | null>(null);

  // Delete confirmation
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const isPending = isUpdating || isDeleting;

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

      // Set form data based on activity type
      if (existingActivity.type === 'bottle') {
        const bottleDetails = existingActivity.details as {
          type: 'bottle';
          vitaminDGiven?: boolean;
        } | null;
        setFormData({
          amountMl: existingActivity.amountMl || undefined,
          bottleType:
            existingActivity.feedingSource === 'formula'
              ? 'formula'
              : 'breast_milk',
          notes: existingActivity.notes || undefined,
          type: 'bottle',
          vitaminDGiven: bottleDetails?.vitaminDGiven,
        });
      } else if (existingActivity.type === 'nursing') {
        // Extract durations from details or calculate from total duration
        const details = existingActivity.details as {
          side?: 'left' | 'right' | 'both';
          type: 'nursing';
          vitaminDGiven?: boolean;
        } | null;
        const totalDuration = existingActivity.duration || 0;

        let leftDuration = 0;
        let rightDuration = 0;

        // If we have side info, distribute duration accordingly
        if (details?.side === 'left') {
          leftDuration = totalDuration;
        } else if (details?.side === 'right') {
          rightDuration = totalDuration;
        } else {
          // 'both' or no side info - split evenly
          leftDuration = Math.floor(totalDuration / 2);
          rightDuration = totalDuration - leftDuration;
        }

        setFormData({
          leftDuration,
          notes: existingActivity.notes || undefined,
          rightDuration,
          type: 'nursing',
          vitaminDGiven: details?.vitaminDGiven,
        });
      }
    }
  }, [existingActivity]);

  const handleSave = async () => {
    if (!formData) return;

    try {
      // Calculate end time and duration based on feeding type
      let actualEndTime: Date;
      let durationMinutes: number;

      if (formData.type === 'bottle') {
        // For bottle feeding, duration is 0 and endTime equals startTime
        actualEndTime = startTime;
        durationMinutes = 0;
      } else if (formData.type === 'nursing') {
        // For nursing, use the endTime set by DateTimeRangePicker
        // and calculate duration from time difference
        actualEndTime = endTime;
        durationMinutes = Math.floor(
          (endTime.getTime() - startTime.getTime()) / 1000 / 60,
        );
      } else {
        // Fallback
        actualEndTime = endTime;
        durationMinutes = Math.floor(
          (endTime.getTime() - startTime.getTime()) / 1000 / 60,
        );
      }

      // Build update data
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
          vitaminDGiven: formData.vitaminDGiven,
        };
      } else if (formData.type === 'bottle') {
        feedingSource =
          formData.bottleType === 'formula' ? 'formula' : 'pumped';
        details = {
          type: 'bottle' as const,
          vitaminDGiven: formData.vitaminDGiven,
        };
      }

      await updateActivity({
        amountMl: formData.amountMl,
        details,
        duration: durationMinutes > 0 ? durationMinutes : undefined,
        endTime: actualEndTime,
        feedingSource,
        id: existingActivity.id,
        notes: formData.notes,
        startTime,
      });

      onClose();
    } catch (error) {
      console.error('Failed to update feeding:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteActivity(existingActivity.id);
      setShowDeleteConfirmation(false);
      onClose();
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  return (
    <>
      {/* Header */}
      <ActivityDrawerHeader
        activityType="feeding"
        customTitle="Edit Feeding"
        onClose={onClose}
      />

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
        <FeedingTypeSelector
          activeActivityId={null}
          babyAgeDays={babyAgeDays}
          duration={0}
          existingActivityType={formData?.type ?? null}
          initialData={formData ?? undefined}
          isTimerStopped={true}
          onFormDataChange={setFormData}
          onTimerStart={async () => {}}
          setDuration={() => {}}
          setStartTime={setStartTime}
          startTime={startTime}
        />

        {/* Time & Date Section */}
        {formData && (
          <div className="space-y-3 min-w-0">
            <h3 className="text-sm font-medium text-muted-foreground">
              Time & Date
            </h3>
            {formData.type === 'nursing' ? (
              <DateTimeRangePicker
                endDate={endTime}
                mode="range"
                setEndDate={setEndTime}
                setStartDate={setStartTime}
                startDate={startTime}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 min-w-0">
                <TimeInput
                  id="feeding-start-time"
                  label="Start Date & Time"
                  onChange={setStartTime}
                  value={startTime}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with Actions */}
      {formData && (
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
                'bg-activity-feeding text-activity-feeding-foreground',
              )}
              disabled={isPending || !formData}
              onClick={handleSave}
            >
              {isPending ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        onOpenChange={setShowDeleteConfirmation}
        open={showDeleteConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feeding Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this feeding activity. This action
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
