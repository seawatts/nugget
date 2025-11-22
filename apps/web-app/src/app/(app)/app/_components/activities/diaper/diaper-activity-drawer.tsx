'use client';

import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import { Baby, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { StopSleepConfirmationDialog } from '../shared/components/stop-sleep-confirmation-dialog';
import { TimeInput } from '../shared/components/time-input';
import { useInProgressSleep } from '../shared/hooks/use-in-progress-sleep';
import { autoStopInProgressSleepAction } from '../sleep/actions';
import { useActivityMutations } from '../use-activity-mutations';
import type { DiaperFormData } from './diaper-drawer';
import { DiaperDrawerContent } from './diaper-drawer';

interface DiaperActivityDrawerProps {
  existingActivity?: typeof Activities.$inferSelect | null;
  isOpen: boolean;
  onClose: () => void;
  babyId?: string;
}

/**
 * Complete, self-contained diaper activity drawer
 * Manages all diaper-specific state and logic internally
 */
export function DiaperActivityDrawer({
  existingActivity,
  isOpen,
  onClose,
  babyId,
}: DiaperActivityDrawerProps) {
  const { createActivity, updateActivity, isCreating, isUpdating } =
    useActivityMutations();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );

  // Diaper-specific state
  const [startTime, setStartTime] = useState(new Date());
  const [formData, setFormData] = useState<DiaperFormData>({
    color: null,
    consistency: null,
    hasRash: false,
    isGassy: false,
    notes: '',
    size: null,
    type: null,
  });

  // Check for in-progress sleep
  const { inProgressSleep, sleepDuration } = useInProgressSleep({
    babyId,
    enabled: isOpen,
  });

  // State for sleep stop confirmation
  const [showSleepConfirmation, setShowSleepConfirmation] = useState(false);

  const isPending = isCreating || isUpdating;
  const isEditing = Boolean(existingActivity);

  // Update state when existingActivity changes
  useEffect(() => {
    if (existingActivity?.startTime) {
      const start = new Date(existingActivity.startTime);
      setStartTime(start);
    } else {
      const now = new Date();
      setStartTime(now);
    }

    // Initialize diaper-specific fields from existing activity
    if (existingActivity) {
      if (existingActivity.notes) {
        setFormData((prev) => ({
          ...prev,
          notes: existingActivity.notes || '',
        }));
      }
      // Parse diaper details from details field
      if (existingActivity.details) {
        const details = existingActivity.details as {
          type?: 'wet' | 'dirty' | 'both';
          size?: 'little' | 'medium' | 'large';
          color?: string;
          consistency?: string;
          hasRash?: boolean;
          isGassy?: boolean;
        };
        setFormData({
          color: (details.color as DiaperFormData['color']) || null,
          consistency:
            (details.consistency as DiaperFormData['consistency']) || null,
          hasRash: details.hasRash ?? false,
          isGassy: details.isGassy ?? false,
          notes: existingActivity.notes || '',
          size: (details.size as DiaperFormData['size']) || null,
          type: details.type || null,
        });
      }
    }

    // Reset form data when drawer opens for new activity
    if (!existingActivity) {
      const now = new Date();
      setStartTime(now);
      setFormData({
        color: null,
        consistency: null,
        hasRash: false,
        isGassy: false,
        notes: '',
        size: null,
        type: null,
      });
    }
  }, [existingActivity]);

  // Reset state when drawer closes - delay to allow closing animation to complete
  useEffect(() => {
    if (!isOpen) {
      // Delay state reset to prevent flash during drawer closing animation
      const timeoutId = setTimeout(() => {
        const now = new Date();
        setStartTime(now);
        setFormData({
          color: null,
          consistency: null,
          hasRash: false,
          isGassy: false,
          notes: '',
          size: null,
          type: null,
        });
      }, 300); // Standard drawer animation duration

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  const handleStopSleepAndSave = async () => {
    try {
      // Stop the in-progress sleep
      const result = await autoStopInProgressSleepAction();
      if (result?.data?.activity) {
        toast.info('Sleep tracking stopped');
      }
    } catch (error) {
      console.error('Failed to stop sleep:', error);
      toast.error('Failed to stop sleep tracking');
    }

    // Close confirmation dialog
    setShowSleepConfirmation(false);

    // Proceed with save
    await saveDiaperActivity();
  };

  const handleKeepSleepingAndSave = async () => {
    // Close confirmation dialog
    setShowSleepConfirmation(false);

    // Proceed with save without stopping sleep
    await saveDiaperActivity();
  };

  const handleSave = async () => {
    if (!formData.type) {
      console.error('No diaper type selected');
      return;
    }

    // Check if there's an in-progress sleep
    if (inProgressSleep) {
      // Show confirmation dialog
      setShowSleepConfirmation(true);
      return;
    }

    // Proceed with save
    await saveDiaperActivity();
  };

  const saveDiaperActivity = async () => {
    if (!formData.type) {
      console.error('No diaper type selected');
      return;
    }

    try {
      // Close drawer immediately for better UX
      onClose();

      // Create details object
      const diaperDetails = {
        color: formData.color ?? undefined,
        consistency: formData.consistency ?? undefined,
        hasRash: formData.hasRash,
        isGassy: formData.isGassy,
        size: formData.size ?? undefined,
        type: formData.type,
      };

      // Only add optimistic activity for new activities (not updates)
      if (!existingActivity) {
        // Create optimistic activity for immediate UI feedback
        const optimisticActivity = {
          amountMl: null,
          assignedUserId: null,
          babyId: 'temp',
          createdAt: startTime,
          details: {
            color: formData.color,
            consistency: formData.consistency,
            hasRash: formData.hasRash,
            isGassy: formData.isGassy,
            size: formData.size,
            type: formData.type, // wet, dirty, or both
          },
          duration: null,
          endTime: null,
          familyId: 'temp',
          familyMemberId: null,
          feedingSource: null,
          id: `optimistic-diaper-${Date.now()}`,
          isScheduled: false,
          notes: formData.notes || null,
          startTime,
          subjectType: 'baby' as const,
          type: 'diaper' as const, // activity type
          updatedAt: startTime,
          userId: 'temp',
        } as typeof Activities.$inferSelect;

        addOptimisticActivity(optimisticActivity);
      }

      if (existingActivity) {
        // Update existing activity
        await updateActivity({
          details: diaperDetails,
          id: existingActivity.id,
          notes: formData.notes || undefined,
          startTime,
        });
      } else {
        // Create new activity
        await createActivity({
          activityType: 'diaper',
          details: diaperDetails,
          notes: formData.notes || undefined,
          startTime,
        });
      }
    } catch (error) {
      console.error('Failed to save diaper:', error);
    }
  };

  // Determine if save button should be disabled
  const isSaveDisabled = isPending || !formData.type;

  return (
    <>
      {/* Custom Header with Activity Color */}
      <div className="p-6 pb-4 bg-activity-diaper">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Baby
              className="size-8 text-activity-diaper-foreground"
              strokeWidth={1.5}
            />
            <h2 className="text-2xl font-bold text-activity-diaper-foreground">
              Diaper
            </h2>
          </div>
          <button
            className="p-2 rounded-full hover:bg-black/10 transition-colors text-activity-diaper-foreground"
            onClick={onClose}
            type="button"
          >
            <X className="size-6" />
          </button>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
        <DiaperDrawerContent onDataChange={setFormData} />

        {/* Time & Date Section */}
        <div className="space-y-3 min-w-0">
          <h3 className="text-sm font-medium text-muted-foreground">
            Time & Date
          </h3>
          <TimeInput
            id="diaper-time"
            label="Date & Time"
            onChange={setStartTime}
            value={startTime}
          />
        </div>
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
              'bg-activity-diaper text-activity-diaper-foreground',
            )}
            disabled={isSaveDisabled}
            onClick={handleSave}
          >
            {isPending ? 'Saving...' : isEditing ? 'Update' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Sleep Stop Confirmation Dialog */}
      <StopSleepConfirmationDialog
        onKeepSleeping={handleKeepSleepingAndSave}
        onOpenChange={setShowSleepConfirmation}
        onStopSleep={handleStopSleepAndSave}
        open={showSleepConfirmation}
        sleepDuration={sleepDuration}
      />
    </>
  );
}
