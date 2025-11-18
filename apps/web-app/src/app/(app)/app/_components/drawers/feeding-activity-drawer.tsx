'use client';

import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import { Calendar, Clock, Milk, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  const [formData, setFormData] = useState<FeedingFormData | null>(null);

  const isPending = isCreating || isUpdating;
  const isEditing = Boolean(existingActivity);

  // Update state when existingActivity changes
  useEffect(() => {
    if (existingActivity?.startTime) {
      setStartTime(new Date(existingActivity.startTime));
    } else {
      setStartTime(new Date());
    }

    // Reset form data when drawer opens for new activity
    if (!existingActivity) {
      setFormData(null);
    }
  }, [existingActivity]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setFormData(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!formData) {
      console.error('No form data to save');
      return;
    }

    try {
      // Close drawer immediately for better UX
      onClose();

      // Prepare activity data based on feeding type
      const baseData = {
        notes: formData.notes || undefined,
        startTime,
      };

      if (existingActivity) {
        // Update existing activity
        if (formData.type === 'bottle') {
          await updateActivity({
            ...baseData,
            amount: formData.amountMl,
            details: null,
            feedingSource:
              formData.bottleType === 'formula' ? 'formula' : 'pumped',
            id: existingActivity.id,
          });
        } else if (formData.type === 'nursing') {
          await updateActivity({
            ...baseData,
            details: {
              side: 'both', // TODO: Allow user to select side
              type: 'nursing',
            },
            duration:
              (formData.leftDuration || 0) + (formData.rightDuration || 0),
            feedingSource: 'direct',
            id: existingActivity.id,
          });
        } else if (formData.type === 'solids') {
          await updateActivity({
            ...baseData,
            details: {
              type: 'solids',
            },
            id: existingActivity.id,
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
            duration:
              (formData.leftDuration || 0) + (formData.rightDuration || 0),
            feedingSource: 'direct',
            notes: formData.notes || undefined,
            startTime,
          });
        } else if (formData.type === 'solids') {
          await createActivity({
            activityType: 'feeding',
            details: {
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

        {/* Time Display */}
        <div className="flex items-center gap-4 text-sm text-white opacity-90">
          <div className="flex items-center gap-2">
            <Clock className="size-4" />
            <span>
              {startTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4" />
            <span>
              {startTime.toLocaleDateString([], {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <FeedingDrawerContent
          existingActivityType={
            existingActivity ? (formData?.type ?? null) : null
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
