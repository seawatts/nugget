'use client';

import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import { Baby, Calendar, Clock, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useActivityMutations } from '../use-activity-mutations';
import type { DiaperFormData } from './diaper-drawer';
import { DiaperDrawerContent } from './diaper-drawer';

interface DiaperActivityDrawerProps {
  existingActivity?: typeof Activities.$inferSelect | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Complete, self-contained diaper activity drawer
 * Manages all diaper-specific state and logic internally
 */
export function DiaperActivityDrawer({
  existingActivity,
  isOpen,
  onClose,
}: DiaperActivityDrawerProps) {
  const { createActivity, updateActivity, isCreating, isUpdating } =
    useActivityMutations();

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
      setStartTime(new Date(existingActivity.startTime));
    } else {
      setStartTime(new Date());
    }

    // Initialize diaper-specific fields from existing activity
    if (existingActivity) {
      if (existingActivity.notes) {
        setFormData((prev) => ({ ...prev, notes: existingActivity.notes }));
      }
      // Parse diaper details from details field
      if (
        existingActivity.details &&
        existingActivity.details.type === 'diaper'
      ) {
        setFormData({
          color: existingActivity.details.color || null,
          consistency: existingActivity.details.consistency || null,
          hasRash: existingActivity.details.hasRash || false,
          notes: existingActivity.notes || '',
          size: existingActivity.details.size || null,
          type: existingActivity.details.diaperType || null,
        });
      }
    }

    // Reset form data when drawer opens for new activity
    if (!existingActivity) {
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
        color: formData.color,
        consistency: formData.consistency,
        diaperType: formData.type,
        hasRash: formData.hasRash,
        size: formData.size,
        type: 'diaper' as const,
      };

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
      <div className="p-6 pb-4 bg-[oklch(0.78_0.14_60)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Baby
              className="size-8 text-[oklch(0.18_0.02_250)]"
              strokeWidth={1.5}
            />
            <h2 className="text-2xl font-bold text-[oklch(0.18_0.02_250)]">
              Diaper
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

        {/* Time Display */}
        <div className="flex items-center gap-4 text-sm text-[oklch(0.18_0.02_250)] opacity-90">
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
        <DiaperDrawerContent onDataChange={setFormData} />
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
              'bg-[oklch(0.78_0.14_60)] text-[oklch(0.18_0.02_250)]',
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
