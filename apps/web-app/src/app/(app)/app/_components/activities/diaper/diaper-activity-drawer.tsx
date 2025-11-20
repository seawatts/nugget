'use client';

import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import { Baby, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
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
  babyId: _babyId,
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
    notes: '',
    size: null,
    type: null,
  });

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
        };
        setFormData({
          color: (details.color as DiaperFormData['color']) || null,
          consistency:
            (details.consistency as DiaperFormData['consistency']) || null,
          hasRash: false,
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
        notes: '',
        size: null,
        type: null,
      });
    }
  }, [existingActivity]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      const now = new Date();
      setStartTime(now);
      setFormData({
        color: null,
        consistency: null,
        hasRash: false,
        notes: '',
        size: null,
        type: null,
      });
    }
  }, [isOpen]);

  const handleSave = async () => {
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
        size: formData.size ?? undefined,
        type: formData.type,
      };

      // Only add optimistic activity for new activities (not updates)
      if (!existingActivity) {
        // Create optimistic activity for immediate UI feedback
        const optimisticActivity = {
          amount: null,
          assignedUserId: null,
          babyId: 'temp',
          createdAt: startTime,
          details: {
            color: formData.color,
            consistency: formData.consistency,
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
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <DiaperDrawerContent onDataChange={setFormData} />

        {/* Time & Date Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Time & Date
          </h3>
          <div className="space-y-2">
            <label
              className="text-xs text-muted-foreground"
              htmlFor="diaper-time"
            >
              Time
            </label>
            <input
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
              id="diaper-time"
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':').map(Number);
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
    </>
  );
}
