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
import { Pill, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ClickableTimeDisplay } from '../shared/components/clickable-time-display';
import { useActivityMutations } from '../use-activity-mutations';

interface TimelineVitaminDDrawerProps {
  existingActivity: typeof Activities.$inferSelect;
  isOpen: boolean;
  onClose: () => void;
  babyId?: string;
}

/**
 * Timeline-specific vitamin D drawer for editing past activities
 * No timer functionality - just edit fields and delete button
 */
export function TimelineVitaminDDrawer({
  existingActivity,
  isOpen: _isOpen,
  onClose,
  babyId: _babyId,
}: TimelineVitaminDDrawerProps) {
  const { updateActivity, deleteActivity, isUpdating, isDeleting } =
    useActivityMutations();

  // Fetch user preferences for time format
  const { data: user } = api.user.current.useQuery();
  const timeFormat = user?.timeFormat || '12h';

  // Vitamin D-specific state
  const [startTime, setStartTime] = useState(new Date());
  const [method, setMethod] = useState<'drops' | 'spray' | null>(null);
  const [notes, setNotes] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const isPending = isUpdating || isDeleting;

  // Load existing activity data
  useEffect(() => {
    if (existingActivity?.startTime) {
      const start = new Date(existingActivity.startTime);
      setStartTime(start);
    }

    // Initialize vitamin D-specific fields from existing activity
    if (existingActivity) {
      setNotes(existingActivity.notes || '');

      // Parse vitamin D details from details field
      if (existingActivity.details) {
        const details = existingActivity.details as {
          method?: 'drops' | 'spray';
          type?: string;
        };

        setMethod(details.method || null);
      }
    }
  }, [existingActivity]);

  const handleSave = async () => {
    try {
      // Create details object
      const vitaminDDetails = method
        ? {
            method,
            type: 'vitamin_d' as const,
          }
        : { type: 'vitamin_d' as const };

      // Update existing activity
      await updateActivity({
        details: vitaminDDetails,
        id: existingActivity.id,
        notes: notes || undefined,
        startTime,
      });

      onClose();
    } catch (error) {
      console.error('Failed to update vitamin D:', error);
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
      <div className="p-6 pb-4 bg-activity-vitamin-d">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Pill
              className="size-8 text-activity-vitamin-d-foreground"
              strokeWidth={1.5}
            />
            <h2 className="text-2xl font-bold text-activity-vitamin-d-foreground">
              Edit Vitamin D
            </h2>
          </div>
          <button
            className="p-2 rounded-full hover:bg-black/10 transition-colors text-activity-vitamin-d-foreground"
            onClick={onClose}
            type="button"
          >
            <X className="size-6" />
          </button>
        </div>
        <div className="ml-11">
          <ClickableTimeDisplay
            className="text-activity-vitamin-d-foreground"
            mode="single"
            onStartTimeChange={setStartTime}
            startTime={startTime}
            timeFormat={timeFormat}
          />
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
        {/* Method Selector (Optional) */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Method (optional)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              className={cn(
                'h-12',
                method === 'drops'
                  ? 'bg-activity-vitamin-d text-activity-vitamin-d-foreground hover:bg-activity-vitamin-d/90'
                  : 'bg-transparent',
              )}
              onClick={() => setMethod(method === 'drops' ? null : 'drops')}
              type="button"
              variant={method === 'drops' ? 'default' : 'outline'}
            >
              Drops
            </Button>
            <Button
              className={cn(
                'h-12',
                method === 'spray'
                  ? 'bg-activity-vitamin-d text-activity-vitamin-d-foreground hover:bg-activity-vitamin-d/90'
                  : 'bg-transparent',
              )}
              onClick={() => setMethod(method === 'spray' ? null : 'spray')}
              type="button"
              variant={method === 'spray' ? 'default' : 'outline'}
            >
              Spray
            </Button>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Notes (optional)
          </p>
          <textarea
            className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-activity-vitamin-d"
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this vitamin D dose..."
            value={notes}
          />
        </div>
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
              'bg-activity-vitamin-d text-activity-vitamin-d-foreground',
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
            <AlertDialogTitle>Delete Vitamin D Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this vitamin D activity. This action
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
