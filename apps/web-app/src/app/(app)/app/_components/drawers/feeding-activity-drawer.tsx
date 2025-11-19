'use client';

import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { DateTimeRangePicker } from '@nugget/ui/custom/date-time-range-picker';
import { cn } from '@nugget/ui/lib/utils';
import { Milk, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  const { createActivity, updateActivity, isCreating, isUpdating } =
    useActivityMutations();

  // Feeding-specific state
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [formData, setFormData] = useState<FeedingFormData | null>(null);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);

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
      void (async () => {
        try {
          const result = await getInProgressFeedingActivityAction({});
          if (result?.data?.activity) {
            const inProgressActivity = result.data.activity;
            setActiveActivityId(inProgressActivity.id);
            setStartTime(new Date(inProgressActivity.startTime));
            // Set endTime to now for in-progress activities
            setEndTime(new Date());

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
        }
      })();
    }

    // Reset state when drawer closes
    if (!isOpen) {
      setActiveActivityId(null);
      const now = new Date();
      setStartTime(now);
      setEndTime(now);
      setFormData(null);
    }
  }, [isOpen, existingActivity]);

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

  // Determine if save button should be disabled
  const isSaveDisabled = isPending || !formData;

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

        {/* Time Range Picker */}
        <DateTimeRangePicker
          className="text-white opacity-90"
          endDate={endTime}
          mode="range"
          setEndDate={setEndTime}
          setStartDate={setStartTime}
          startDate={startTime}
        />
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <FeedingDrawerContent
          existingActivityType={
            existingActivity || activeActivityId
              ? (formData?.type ?? null)
              : null
          }
          onFormDataChange={setFormData}
        />
      </div>

      {/* Footer with Actions */}
      <div className="p-6 pt-4 border-t border-border">
        <div className="flex gap-3">
          <Button
            className="flex-1 h-12 text-base bg-transparent"
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className={cn(
              'flex-1 h-12 text-base font-semibold',
              'bg-[oklch(0.68_0.18_35)] text-white',
            )}
            disabled={isSaveDisabled}
            onClick={handleSave}
          >
            {isPending ? 'Saving...' : isEditing ? 'Update' : 'Save'}
          </Button>
        </div>
      </div>
    </>
  );
}
