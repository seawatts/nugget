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
import { Baby, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ClickableTimeDisplay } from '../shared/components/clickable-time-display';
import { useActivityMutations } from '../use-activity-mutations';
import type { DiaperFormData } from './diaper-drawer';
import { DiaperDrawerContent } from './diaper-drawer';

interface TimelineDiaperDrawerProps {
  existingActivity: typeof Activities.$inferSelect;
  isOpen: boolean;
  onClose: () => void;
  babyId?: string;
}

/**
 * Timeline-specific diaper drawer for editing past activities
 * No timer functionality - just edit fields and delete button
 */
export function TimelineDiaperDrawer({
  existingActivity,
  isOpen: _isOpen,
  onClose,
  babyId: _babyId,
}: TimelineDiaperDrawerProps) {
  const { updateActivity, deleteActivity, isUpdating, isDeleting } =
    useActivityMutations();

  // Fetch user preferences for time format
  const { data: user } = api.user.current.useQuery();
  const timeFormat = user?.timeFormat || '12h';

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
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const isPending = isUpdating || isDeleting;

  // Load existing activity data
  useEffect(() => {
    if (existingActivity?.startTime) {
      const start = new Date(existingActivity.startTime);
      setStartTime(start);
    }

    // Initialize diaper-specific fields from existing activity
    if (existingActivity) {
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

        // Get diaper type - prioritize specific types over generic 'diaper'
        // Check if details.type is a specific type (wet, dirty, both)
        const detailsHasSpecificType =
          details.type && ['wet', 'dirty', 'both'].includes(details.type);
        const activityHasSpecificType = ['wet', 'dirty', 'both'].includes(
          existingActivity.type,
        );

        const diaperType = detailsHasSpecificType
          ? (details.type as 'wet' | 'dirty' | 'both')
          : activityHasSpecificType
            ? (existingActivity.type as 'wet' | 'dirty' | 'both')
            : null;

        console.log('Timeline Diaper Drawer - Setting formData:', {
          activityHasSpecificType,
          activityType: existingActivity.type,
          calculatedDiaperType: diaperType,
          details,
          detailsHasSpecificType,
          detailsType: details.type,
        });

        setFormData({
          color: (details.color as DiaperFormData['color']) || null,
          consistency:
            (details.consistency as DiaperFormData['consistency']) || null,
          hasRash: details.hasRash ?? false,
          isGassy: details.isGassy ?? false,
          notes: existingActivity.notes || '',
          size: (details.size as DiaperFormData['size']) || null,
          type: diaperType,
        });
      } else {
        // No details field - check if activity type is a diaper type
        const diaperType = ['wet', 'dirty', 'both'].includes(
          existingActivity.type,
        )
          ? (existingActivity.type as 'wet' | 'dirty' | 'both')
          : null;

        setFormData({
          color: null,
          consistency: null,
          hasRash: false,
          isGassy: false,
          notes: existingActivity.notes || '',
          size: null,
          type: diaperType,
        });
      }
    }
  }, [existingActivity]);

  const handleSave = async () => {
    if (!formData.type) {
      console.error('No diaper type selected');
      return;
    }

    try {
      // Create details object
      const diaperDetails = {
        color: formData.color ?? undefined,
        consistency: formData.consistency ?? undefined,
        hasRash: formData.hasRash,
        isGassy: formData.isGassy,
        size: formData.size ?? undefined,
        type: formData.type,
      };

      // Update existing activity
      await updateActivity({
        details: diaperDetails,
        id: existingActivity.id,
        notes: formData.notes || undefined,
        startTime,
      });

      onClose();
    } catch (error) {
      console.error('Failed to update diaper:', error);
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

  // Determine if save button should be disabled
  const isSaveDisabled = isPending || !formData.type;

  return (
    <>
      {/* Custom Header with Activity Color */}
      <div className="p-6 pb-4 bg-activity-diaper">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Baby
              className="size-8 text-activity-diaper-foreground"
              strokeWidth={1.5}
            />
            <h2 className="text-2xl font-bold text-activity-diaper-foreground">
              Edit Diaper
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
        <div className="ml-11">
          <ClickableTimeDisplay
            className="text-activity-diaper-foreground"
            mode="single"
            onStartTimeChange={setStartTime}
            startTime={startTime}
            timeFormat={timeFormat}
          />
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
        <DiaperDrawerContent
          initialData={formData}
          onDataChange={setFormData}
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
              'bg-activity-diaper text-activity-diaper-foreground',
            )}
            disabled={isSaveDisabled}
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
            <AlertDialogTitle>Delete Diaper Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this diaper change activity. This
              action cannot be undone.
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
