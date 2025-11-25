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
import { Scissors, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ClickableTimeDisplay } from '../shared/components/clickable-time-display';
import { useActivityMutations } from '../use-activity-mutations';

interface TimelineNailTrimmingDrawerProps {
  existingActivity: typeof Activities.$inferSelect;
  isOpen: boolean;
  onClose: () => void;
  babyId?: string;
}

export function TimelineNailTrimmingDrawer({
  existingActivity,
  isOpen: _isOpen,
  onClose,
  babyId: _babyId,
}: TimelineNailTrimmingDrawerProps) {
  const { updateActivity, deleteActivity, isUpdating, isDeleting } =
    useActivityMutations();

  const { data: user } = api.user.current.useQuery();
  const timeFormat = user?.timeFormat || '12h';

  const [startTime, setStartTime] = useState(new Date());
  const [location, setLocation] = useState<'hands' | 'feet' | 'both' | null>(
    null,
  );
  const [notes, setNotes] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const isPending = isUpdating || isDeleting;

  useEffect(() => {
    if (existingActivity?.startTime) {
      const start = new Date(existingActivity.startTime);
      setStartTime(start);
    }

    if (existingActivity) {
      setNotes(existingActivity.notes || '');

      if (existingActivity.details) {
        const details = existingActivity.details as {
          location?: 'hands' | 'feet' | 'both';
          type?: string;
        };

        setLocation(details.location || null);
      }
    }
  }, [existingActivity]);

  const handleSave = async () => {
    try {
      const nailTrimmingDetails = location
        ? {
            location,
            type: 'nail_trimming' as const,
          }
        : { type: 'nail_trimming' as const };

      await updateActivity({
        details: nailTrimmingDetails,
        id: existingActivity.id,
        notes: notes || undefined,
        startTime,
      });

      onClose();
    } catch (error) {
      console.error('Failed to update nail trimming:', error);
    }
  };

  const handleDelete = async () => {
    try {
      setShowDeleteConfirmation(false);
      onClose();
      await deleteActivity(existingActivity.id);
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  return (
    <>
      <div className="p-6 pb-4 bg-activity-nail-trimming">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Scissors
              className="size-8 text-activity-nail-trimming-foreground"
              strokeWidth={1.5}
            />
            <h2 className="text-2xl font-bold text-activity-nail-trimming-foreground">
              Edit Nail Trimming
            </h2>
          </div>
          <button
            className="p-2 rounded-full hover:bg-black/10 transition-colors text-activity-nail-trimming-foreground"
            onClick={onClose}
            type="button"
          >
            <X className="size-6" />
          </button>
        </div>
        <div className="ml-11">
          <ClickableTimeDisplay
            className="text-activity-nail-trimming-foreground"
            mode="single"
            onStartTimeChange={setStartTime}
            startTime={startTime}
            timeFormat={timeFormat}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Location (optional)
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Button
              className={cn(
                'h-12',
                location === 'hands'
                  ? 'bg-activity-nail-trimming text-activity-nail-trimming-foreground hover:bg-activity-nail-trimming/90'
                  : 'bg-transparent',
              )}
              onClick={() => setLocation(location === 'hands' ? null : 'hands')}
              type="button"
              variant={location === 'hands' ? 'default' : 'outline'}
            >
              Hands
            </Button>
            <Button
              className={cn(
                'h-12',
                location === 'feet'
                  ? 'bg-activity-nail-trimming text-activity-nail-trimming-foreground hover:bg-activity-nail-trimming/90'
                  : 'bg-transparent',
              )}
              onClick={() => setLocation(location === 'feet' ? null : 'feet')}
              type="button"
              variant={location === 'feet' ? 'default' : 'outline'}
            >
              Feet
            </Button>
            <Button
              className={cn(
                'h-12',
                location === 'both'
                  ? 'bg-activity-nail-trimming text-activity-nail-trimming-foreground hover:bg-activity-nail-trimming/90'
                  : 'bg-transparent',
              )}
              onClick={() => setLocation(location === 'both' ? null : 'both')}
              type="button"
              variant={location === 'both' ? 'default' : 'outline'}
            >
              Both
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Notes (optional)
          </p>
          <textarea
            className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-activity-nail-trimming"
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this nail trimming..."
            value={notes}
          />
        </div>
      </div>

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
              'bg-activity-nail-trimming text-activity-nail-trimming-foreground',
            )}
            disabled={isPending}
            onClick={handleSave}
          >
            {isPending ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </div>

      <AlertDialog
        onOpenChange={setShowDeleteConfirmation}
        open={showDeleteConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Nail Trimming Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this nail trimming activity. This
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
